// Base user interface for authentication
export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  disabled: boolean;
  emailVerified: boolean;
  role: 'student' | 'instructor' | 'admin';
  createdAt: Date;
  lastLogin: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  displayName: string;
  role?: 'student' | 'instructor';
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}