// ═══════════════════════════════════════
//  Auth Service Models
// ═══════════════════════════════════════

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface RegisterProviderRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  specialization: string;
  medicalLicenseNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: UserDto;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  providerId?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: string[];
}
