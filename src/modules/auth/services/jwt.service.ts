import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { createChildLogger } from '../../../utils/logger';
import { config } from '../../../utils/config';
import {
  JwtAccessTokenPayload,
  JwtRefreshTokenPayload,
  TokenPair,
  UserProfile,
  TokenMetadata,
} from '../types/auth.types';
import { authQuery } from '../queries/auth.query';
import { AppError, ErrorType } from '../../../utils/error';

// Create a logger for the JWT service
const logger = createChildLogger('jwt-service');

export class JwtService {
  private readonly accessTokenSecret: string;

  private readonly refreshTokenSecret: string;

  private readonly accessTokenExpiry: string;

  private readonly refreshTokenExpiry: string;

  constructor() {
    // Get JWT configuration from environment variables
    this.accessTokenSecret = config.JWT_ACCESS_SECRET || 'access-secret';
    this.refreshTokenSecret = config.JWT_REFRESH_SECRET || 'refresh-secret';
    this.accessTokenExpiry = config.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = config.JWT_REFRESH_EXPIRY || '7d';

    // Log warnings if using default secrets in production
    if (process.env.NODE_ENV === 'production') {
      if (this.accessTokenSecret === 'access-secret') {
        logger.warn('Using default JWT access token secret in production environment');
      }
      if (this.refreshTokenSecret === 'refresh-secret') {
        logger.warn('Using default JWT refresh token secret in production environment');
      }
    }
  }

  /**
   * Generate a new token pair (access and refresh tokens)
   *
   * @param user - User profile
   * @returns Token pair with access and refresh tokens
   */
  async generateTokenPair(user: UserProfile): Promise<TokenPair> {
    try {
      // Generate unique token IDs
      const accessTokenId = uuidv4();
      const refreshTokenId = uuidv4();

      // Calculate expiry times in seconds
      const accessExpSeconds = this.getExpiryInSeconds(this.accessTokenExpiry);
      const refreshExpSeconds = this.getExpiryInSeconds(this.refreshTokenExpiry);

      // Create access token payload
      const accessPayload: JwtAccessTokenPayload = {
        sub: user.id,
        jti: accessTokenId,
        role: user.role,
        permissions: user.permissions || [],
        email: user.email,
        authMethod: user.authMethod,
        tokenType: 'access',
      };

      // Create refresh token payload
      const refreshPayload: JwtRefreshTokenPayload = {
        sub: user.id,
        jti: refreshTokenId,
        email: user.email,
        authMethod: user.authMethod,
        tokenType: 'refresh',
        accessTokenId,
      };

      // Generate JWT tokens
      const accessToken = jwt.sign(accessPayload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
      });

      const refreshToken = jwt.sign(refreshPayload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry,
      });

      // Store token metadata in Redis
      const accessTokenMetadata: TokenMetadata = {
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        authMethod: user.authMethod,
        isRevoked: false,
        createdAt: new Date().toISOString(),
      };

      const refreshTokenMetadata: TokenMetadata = {
        ...accessTokenMetadata,
        accessTokenId,
      };

      // Store both tokens in Redis
      await authQuery.storeAccessToken(accessTokenId, accessTokenMetadata, accessExpSeconds);
      await authQuery.storeRefreshToken(refreshTokenId, refreshTokenMetadata, refreshExpSeconds);

      // Run token cleanup in background
      authQuery.cleanupExpiredTokens(user.id).catch((err) => {
        logger.error('Failed to cleanup expired tokens:', err);
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: accessExpSeconds,
      };
    } catch (error) {
      logger.error('Failed to generate token pair:', error);
      throw new AppError('Failed to generate authentication tokens', ErrorType.Internal);
    }
  }

  /**
   * Verify and decode a JWT access token
   *
   * @param token - JWT access token
   * @returns Decoded token payload
   */
  async verifyAccessToken(token: string): Promise<JwtAccessTokenPayload> {
    try {
      // Verify token signature and expiry
      const decoded = jwt.verify(token, this.accessTokenSecret) as JwtAccessTokenPayload;

      // Verify token type
      if (decoded.tokenType !== 'access') {
        throw new AppError('Invalid token type', ErrorType.Unauthorized);
      }

      // Check if token is in Redis and not revoked
      const tokenMetadata = await authQuery.getAccessToken(decoded.jti);

      if (!tokenMetadata) {
        throw new AppError('Token not found or expired', ErrorType.Unauthorized);
      }

      if (tokenMetadata.isRevoked) {
        throw new AppError('Token has been revoked', ErrorType.Unauthorized);
      }

      return decoded;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('JWT verification failed:', error.message);
        throw new AppError('Invalid token', ErrorType.Unauthorized);
      }

      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Token expired:', error.message);
        throw new AppError('Token expired', ErrorType.Unauthorized);
      }

      logger.error('Token verification failed:', error);
      throw new AppError('Authentication failed', ErrorType.Unauthorized);
    }
  }

  /**
   * Verify and decode a JWT refresh token
   *
   * @param token - JWT refresh token
   * @returns Decoded token payload
   */
  async verifyRefreshToken(token: string): Promise<JwtRefreshTokenPayload> {
    try {
      // Verify token signature and expiry
      const decoded = jwt.verify(token, this.refreshTokenSecret) as JwtRefreshTokenPayload;

      // Verify token type
      if (decoded.tokenType !== 'refresh') {
        throw new AppError('Invalid token type', ErrorType.Unauthorized);
      }

      // Check if token is in Redis and not revoked
      const tokenMetadata = await authQuery.getRefreshToken(decoded.jti);

      if (!tokenMetadata) {
        throw new AppError('Token not found or expired', ErrorType.Unauthorized);
      }

      if (tokenMetadata.isRevoked) {
        throw new AppError('Token has been revoked', ErrorType.Unauthorized);
      }

      return decoded;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('JWT verification failed:', error.message);
        throw new AppError('Invalid token', ErrorType.Unauthorized);
      }

      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Token expired:', error.message);
        throw new AppError('Token expired', ErrorType.Unauthorized);
      }

      logger.error('Token verification failed:', error);
      throw new AppError('Authentication failed', ErrorType.Unauthorized);
    }
  }

  /**
   * Revoke an access token
   *
   * @param tokenId - JWT token ID
   */
  async revokeAccessToken(tokenId: string): Promise<void> {
    try {
      await authQuery.revokeAccessToken(tokenId);
    } catch (error) {
      logger.error('Failed to revoke access token:', error);
      throw new AppError('Failed to revoke token', ErrorType.Internal);
    }
  }

  /**
   * Revoke a refresh token
   *
   * @param tokenId - JWT token ID
   */
  async revokeRefreshToken(tokenId: string): Promise<void> {
    try {
      await authQuery.revokeRefreshToken(tokenId);
    } catch (error) {
      logger.error('Failed to revoke refresh token:', error);
      throw new AppError('Failed to revoke token', ErrorType.Internal);
    }
  }

  /**
   * Revoke all tokens for a user
   *
   * @param userId - User ID
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await authQuery.revokeAllUserTokens(userId);
    } catch (error) {
      logger.error('Failed to revoke all user tokens:', error);
      throw new AppError('Failed to revoke user tokens', ErrorType.Internal);
    }
  }

  /**
   * Refresh tokens by generating a new token pair
   *
   * @param refreshToken - Current refresh token
   * @returns New token pair
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = await this.verifyRefreshToken(refreshToken);

      // Get refresh token metadata
      const tokenMetadata = await authQuery.getRefreshToken(decoded.jti);

      if (!tokenMetadata) {
        throw new AppError('Invalid refresh token', ErrorType.Unauthorized);
      }

      // Revoke old tokens
      await this.revokeRefreshToken(decoded.jti);

      if (decoded.accessTokenId) {
        await this.revokeAccessToken(decoded.accessTokenId);
      }

      // Create user profile from token data
      const user: UserProfile = {
        id: decoded.sub,
        email: decoded.email,
        role: tokenMetadata.role,
        permissions: tokenMetadata.permissions,
        authMethod: tokenMetadata.authMethod,
      };

      // Generate new token pair
      return await this.generateTokenPair(user);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to refresh tokens:', error);
      throw new AppError('Failed to refresh authentication', ErrorType.Unauthorized);
    }
  }

  /**
   * Convert a JWT expiry string to seconds
   *
   * @param expiry - Expiry string (e.g., '15m', '7d')
   * @returns Expiry time in seconds
   */
  private getExpiryInSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhdw])$/);

    if (!match) {
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      case 'w':
        return value * 7 * 24 * 60 * 60;
      default:
        return 900;
    }
  }
}

// Create a singleton instance
export const jwtService = new JwtService();
