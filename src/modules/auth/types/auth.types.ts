import { z } from 'zod';
import { Request } from 'express';

/**
 * Authentication types for the application
 */

// Auth methods
export enum AuthMethod {
  PASSWORD = 'password',
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
  PROXY = 'proxy',
}

// User roles
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

// User permission types
export enum Permission {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  READ_DOCUMENTS = 'read:documents',
  WRITE_DOCUMENTS = 'write:documents',
  DELETE_DOCUMENTS = 'delete:documents',
  MANAGE_USERS = 'manage:users',
  MANAGE_SETTINGS = 'manage:settings',
}

// User profile for authentication
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  authMethod: AuthMethod;
  provider?: AuthMethod;
  providerId?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

// JWT access token payload structure
export interface JwtAccessTokenPayload {
  sub: string; // User ID
  jti: string; // Token ID
  email: string;
  role: UserRole;
  permissions: Permission[];
  authMethod: AuthMethod;
  tokenType: 'access';
  iat: number; // Issued at
  exp: number; // Expiration time
  [key: string]: any;
}

// JWT refresh token payload structure
export interface JwtRefreshTokenPayload {
  sub: string; // User ID
  jti: string; // Token ID
  email: string;
  authMethod: AuthMethod;
  tokenType: 'refresh';
  accessTokenId?: string;
  iat: number; // Issued at
  exp: number; // Expiration time
  [key: string]: any;
}

// For backward compatibility
export interface JwtPayload extends JwtAccessTokenPayload {
  name: string;
  provider: AuthMethod;
}

// Token metadata stored in Redis
export interface TokenMetadata {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  authMethod: AuthMethod;
  isRevoked: boolean;
  createdAt: string;
  accessTokenId?: string;
  device?: string;
  ip?: string;
  expiresAt?: number;
  [key: string]: any;
}

// Token pair returned to client
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// OAuth state data
export interface OAuthState {
  redirectUrl: string;
  codeVerifier?: string;
  createdAt: number;
  nonce?: string;
  expiresAt?: number;
  [key: string]: any;
}

export type OAuthStateParams = OAuthState;

// OAuth provider configuration
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  [key: string]: any;
}

// Authentication request
export interface AuthRequest {
  email?: string;
  password?: string;
  refreshToken?: string;
  code?: string;
  state?: string;
  provider?: string;
  rememberMe?: boolean;
  [key: string]: any;
}

// Login params
export type LoginParams = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

// Authentication response
export interface AuthResponse {
  user: UserProfile;
  tokens: TokenPair;
}

export type AuthResult = AuthResponse;

// Password reset token
export interface PasswordResetToken {
  userId: string;
  email: string;
  expiresAt: number;
}

// Token validation response
export interface TokenValidationResponse {
  valid: boolean;
  user?: UserProfile;
  error?: string;
}

/**
 * Proxy authentication parameters
 */
export interface ProxyAuthParams {
  token: string;
  service: string;
}

/**
 * Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: UserProfile;
}

// ZOD VALIDATION SCHEMAS

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

/**
 * Refresh token validation schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
