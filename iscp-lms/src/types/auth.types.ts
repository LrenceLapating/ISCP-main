/**
 * auth.types.ts
 * 
 * Author: Josiephous Pierre Dosdos
 * Date: May 16, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Authentication type definitions for handling user authentication,
 * login/registration credentials, and auth state management.
 */

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  campus?: string;
  profileImage?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'student' | 'teacher' | 'admin';
  campus: string;
} 