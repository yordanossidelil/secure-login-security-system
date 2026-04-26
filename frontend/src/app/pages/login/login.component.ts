import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * SPEC: LoginComponent
 * - Sends POST /api/auth/login with { email, password }
 * - On success: stores JWT token + user in localStorage, navigates to /dashboard
 * - On failure: displays backend error message (e.g. attempts remaining, account locked)
 * - Brute-force protection: backend locks account after 5 failed attempts for 15 minutes
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';       // SPEC: Holds error/security alert message from backend
  loading = false;  // SPEC: Prevents duplicate form submissions

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.error = '';
    this.loading = true;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      // SPEC: Success — JWT saved in AuthService, redirect to protected dashboard
      next: () => this.router.navigate(['/dashboard']),
      // SPEC: Error — show message from backend (locked, invalid credentials, etc.)
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed';
      }
    });
  }
}
