const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const MAX_ATTEMPTS = 5;

// ─── POST /api/auth/register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: 'All fields are required' });

  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  try {
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ message: 'Username or email already exists' });

    const user = await User.create({ username, email, password });
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Auto-unlock if lock duration has passed
    if (user.isLocked && user.isLockExpired()) {
      user.isLocked = false;
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    if (user.isLocked) {
      const minutesLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(403).json({
        message: `Account locked. Try again in ${minutesLeft} minute(s).`,
        locked: true,
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        const lockMinutes = parseInt(process.env.LOCK_DURATION_MINUTES) || 15;
        user.isLocked = true;
        user.lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
        await user.save();
        return res.status(403).json({
          message: `Too many failed attempts. Account locked for ${lockMinutes} minutes.`,
          locked: true,
          securityAlert: true,
        });
      }

      await user.save();
      const remaining = MAX_ATTEMPTS - user.failedLoginAttempts;
      return res.status(401).json({
        message: `Invalid credentials. ${remaining} attempt(s) remaining.`,
        attemptsLeft: remaining,
      });
    }

    // Successful login — reset counters
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────
// JWT is stateless; logout is handled client-side by deleting the token.
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ─── POST /api/auth/unlock-user ────────────────────────────────────────────
// Admin-only: manually unlock a user account
router.post('/unlock-user', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin access required' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isLocked = false;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.json({ message: `Account for ${email} has been unlocked` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
