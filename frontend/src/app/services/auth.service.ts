import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

function getApiUrl(): string {
  const host = window.location.hostname;
  // GitHub Codespaces: replace the port segment in the forwarded hostname
  if (host.includes('app.github.dev')) {
    return `https://${host.replace('-4200', '-3000')}/api/auth`;
  }
  return 'http://localhost:3000/api/auth';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = getApiUrl();

  constructor(private http: HttpClient, private router: Router) {}

  register(data: { username: string; email: string; password: string }) {
    return this.http.post(`${this.api}/register`, data);
  }

  login(data: { email: string; password: string }) {
    return this.http.post<any>(`${this.api}/login`, data).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  logout() {
    const token = this.getToken();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
    if (token) {
      this.http.post(`${this.api}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe();
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): any {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
