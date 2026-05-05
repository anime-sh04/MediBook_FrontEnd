import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LoginRequest, LoginResponse,
  RegisterRequest, RegisterResponse,
  RegisterProviderRequest,
  RefreshTokenRequest, RefreshTokenResponse,
  LogoutRequest, UserDto,
  UpdateProfileRequest, ChangePasswordRequest
} from '../core/models/auth.models';

const BASE = `${environment.apiUrls.auth}/auth`;
const TOKEN_KEY   = 'mb_access_token';
const REFRESH_KEY = 'mb_refresh_token';
const USER_KEY    = 'mb_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<UserDto | null>(null);
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user() && !!this.getAccessToken());

  constructor(private http: HttpClient) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this._user.set(payload);
      } catch {
        this.clearTokens();
      }
    }
  }

  // ── UC-1: Register patient ────────────────────────────────────────────────
  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${BASE}/register`, request);
  }
  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
    
      const user: UserDto = {
        id: payload.sub,                     // 🔥 IMPORTANT FIX
        fullName: payload.name || '',
        email: payload.email || '',
        role: payload.role || '',
        phone: '',
        isActive: true,
        createdAt: ''
      };
    
      this._user.set(user);
    
    } catch {
      this.clearTokens();
    }
  }
  // ── UC-1p: Register provider ──────────────────────────────────────────────
  registerProvider(request: RegisterProviderRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${BASE}/register-provider`, request);
  }

  oauthLoginUrl(provider: 'google' | 'github'): string {
    return `${BASE}/oauth/${provider}/login`;
  }

  // ── UC-2: Login ───────────────────────────────────────────────────────────
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${BASE}/login`, request).pipe(
      tap(response => {
        this.saveTokens(response.accessToken, response.refreshToken);
        this.storeUser(response.user);
        this._user.set(response.user);
      })
    );
  }

  // ── UC-2: Get current user ────────────────────────────────────────────────
  getMe(): Observable<UserDto> {
    return this.http.get<UserDto>(`${BASE}/me`).pipe(
      tap(user => {
        this.storeUser(user);
        this._user.set(user);
      })
    );
  }

  // ── UC-2: Refresh token ───────────────────────────────────────────────────
  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(`${BASE}/refresh`, { refreshToken } as RefreshTokenRequest);
  }

  // ── UC-2: Logout ──────────────────────────────────────────────────────────
  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken() ?? '';
    return this.http.post<void>(`${BASE}/logout`, { refreshToken } as LogoutRequest).pipe(
      tap(() => this.clearTokens())
    );
  }

  // ── UC-3: Update profile ──────────────────────────────────────────────────
  updateProfile(request: UpdateProfileRequest): Observable<UserDto> {
    return this.http.put<UserDto>(`${BASE}/profile`, request).pipe(
      tap(user => {
        this.storeUser(user);
        this._user.set(user);
      })
    );
  }

  getUserById(id: string) {
    return this.http.get<{
      id: string;
      fullName: string;
      email: string;
      phone: string;
      role: string;
    }>(`${environment.apiUrls.auth}/auth/users/${id}`);
  }
  
  // ── UC-3: Change password ─────────────────────────────────────────────────
  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${BASE}/password`, request);
  }

  // ── UC-3: Deactivate account ──────────────────────────────────────────────
  deactivateAccount(): Observable<void> {
    return this.http.delete<void>(`${BASE}/deactivate`).pipe(
      tap(() => this.clearTokens())
    );
  }

  // ── Token helpers ─────────────────────────────────────────────────────────
  getAccessToken(): string | null  { return localStorage.getItem(TOKEN_KEY); }
  getRefreshToken(): string | null { return localStorage.getItem(REFRESH_KEY); }

  storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  private storeUser(user: UserDto): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }


  private loadUser(): UserDto | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}