import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

/**
 * SPEC: DashboardComponent
 * - Protected route — only accessible with a valid JWT (enforced by AuthGuard)
 * - Loads user info from localStorage (set during login)
 * - Displays active security features for demonstration purposes
 * - Logout clears localStorage and redirects to /login
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  user: any = null; // SPEC: Populated from localStorage — { id, username, email, role }

  constructor(private auth: AuthService) {}

  ngOnInit() {
    // SPEC: Read user object stored during login (from JWT response)
    this.user = this.auth.getUser();
  }

  logout() {
    // SPEC: Clears token + user from localStorage, calls backend logout, redirects to /login
    this.auth.logout();
  }
}
