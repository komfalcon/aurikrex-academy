import { UserRecord } from "firebase-admin/auth";

export interface AuthUser extends Omit<UserRecord, 'toJSON'> {
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