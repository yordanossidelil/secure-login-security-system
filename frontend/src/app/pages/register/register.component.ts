import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * SPEC: RegisterComponent
 * - Sends POST /api/auth/register with { username, email, password }
 * - Password is hashed with bcrypt (salt rounds: 12) on the backend before saving
 * - On success: shows success message, redirects to /login after 1.5s
 * - On failure: shows error (e.g. "Username or email already exists")
 * - Frontend validation: all fields required, password min 6 characters
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  error = '';    // SPEC: Backend validation error (duplicate email/username, etc.)
  success = '';  // SPEC: Shown on successful registration before redirect
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.error = '';
    this.success = '';
    this.loading = true;
    this.auth.register({ username: this.username, email: this.email, password: this.password }).subscribe({
      next: () => {
        // SPEC: Auto-redirect to login after showing success message
        this.success = 'Account created! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed';
      }
    });
  }
}
