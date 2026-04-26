const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  // Brute-force protection fields
  failedLoginAttempts: { type: Number, default: 0 },
  isLocked:            { type: Boolean, default: false },
  lockUntil:           { type: Date, default: null },

  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain password with hashed
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Check if account lock has expired
userSchema.methods.isLockExpired = function () {
  return this.lockUntil && this.lockUntil < new Date();
};

module.exports = mongoose.model('User', userSchema);
