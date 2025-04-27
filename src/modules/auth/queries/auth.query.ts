/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { createClient } from 'redis';
import { createChildLogger } from '../../../utils/logger';
import { config } from '../../../utils/config';
import { TokenMetadata } from '../types/auth.types';

// Create a logger specific to auth queries
const logger = createChildLogger('auth-query');

/**
 * AuthQuery class for handling token and session storage in Redis
 */
export class AuthQuery {
  private client: ReturnType<typeof createClient>;

  private isConnected = false;

  // Key prefixes for Redis storage
  private readonly ACCESS_TOKEN_PREFIX = 'auth:token:access:';

  private readonly REFRESH_TOKEN_PREFIX = 'auth:token:refresh:';

  private readonly USER_TOKENS_PREFIX = 'auth:user:tokens:';

  private readonly OAUTH_STATE_PREFIX = 'auth:oauth:state:';

  /**
   * Create an instance of AuthQuery
   */
  constructor() {
    this.client = createClient({
      url: config.REDIS_URL,
    });

    this.initializeConnection();
  }

  /**
   * Initialize Redis connection
   */
  private async initializeConnection(): Promise<void> {
    try {
      // Register error handler
      this.client.on('error', (err) => {
        logger.error('Redis connection error:', err);
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      this.isConnected = true;
      logger.info('Connected to Redis for token storage');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;

      // Retry connection after a delay (5 seconds)
      setTimeout(() => this.initializeConnection(), 5000);
    }
  }

  /**
   * Check if Redis connection is active
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
        this.isConnected = true;
        logger.info('Reconnected to Redis');
      } catch (error) {
        logger.error('Failed to reconnect to Redis:', error);
        throw new Error('Token storage unavailable');
      }
    }
  }

  /**
   * Store an access token in Redis
   *
   * @param tokenId - Unique token ID
   * @param metadata - Token metadata
   * @param expiresIn - Expiration time in seconds
   */
  async storeAccessToken(
    tokenId: string,
    metadata: TokenMetadata,
    expiresIn: number,
  ): Promise<void> {
    await this.ensureConnection();

    const key = `${this.ACCESS_TOKEN_PREFIX}${tokenId}`;

    try {
      // Store token metadata as JSON
      await this.client.set(key, JSON.stringify(metadata), {
        EX: expiresIn,
      });

      // Add token ID to user's tokens set
      await this.client.sAdd(`${this.USER_TOKENS_PREFIX}${metadata.userId}`, tokenId);

      logger.debug(`Stored access token: ${tokenId} for user: ${metadata.userId}`);
    } catch (error) {
      logger.error('Failed to store access token:', error);
      throw new Error('Failed to store access token');
    }
  }

  /**
   * Store a refresh token in Redis
   *
   * @param tokenId - Unique token ID
   * @param metadata - Token metadata
   * @param expiresIn - Expiration time in seconds
   */
  async storeRefreshToken(
    tokenId: string,
    metadata: TokenMetadata,
    expiresIn: number,
  ): Promise<void> {
    await this.ensureConnection();

    const key = `${this.REFRESH_TOKEN_PREFIX}${tokenId}`;

    try {
      // Store token metadata as JSON
      await this.client.set(key, JSON.stringify(metadata), {
        EX: expiresIn,
      });

      // Add token ID to user's tokens set
      await this.client.sAdd(`${this.USER_TOKENS_PREFIX}${metadata.userId}`, tokenId);

      logger.debug(`Stored refresh token: ${tokenId} for user: ${metadata.userId}`);
    } catch (error) {
      logger.error('Failed to store refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Get access token metadata from Redis
   *
   * @param tokenId - Unique token ID
   * @returns Token metadata or null if not found
   */
  async getAccessToken(tokenId: string): Promise<TokenMetadata | null> {
    await this.ensureConnection();

    const key = `${this.ACCESS_TOKEN_PREFIX}${tokenId}`;

    try {
      const data = await this.client.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as TokenMetadata;
    } catch (error) {
      logger.error('Failed to get access token:', error);
      throw new Error('Failed to get access token');
    }
  }

  /**
   * Get refresh token metadata from Redis
   *
   * @param tokenId - Unique token ID
   * @returns Token metadata or null if not found
   */
  async getRefreshToken(tokenId: string): Promise<TokenMetadata | null> {
    await this.ensureConnection();

    const key = `${this.REFRESH_TOKEN_PREFIX}${tokenId}`;

    try {
      const data = await this.client.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as TokenMetadata;
    } catch (error) {
      logger.error('Failed to get refresh token:', error);
      throw new Error('Failed to get refresh token');
    }
  }

  /**
   * Revoke an access token
   *
   * @param tokenId - Unique token ID
   */
  async revokeAccessToken(tokenId: string): Promise<void> {
    await this.ensureConnection();

    const key = `${this.ACCESS_TOKEN_PREFIX}${tokenId}`;

    try {
      // Get token metadata to update isRevoked flag
      const data = await this.client.get(key);

      if (data) {
        const metadata = JSON.parse(data) as TokenMetadata;
        metadata.isRevoked = true;

        // Update token with revoked flag
        await this.client.set(key, JSON.stringify(metadata), {
          KEEPTTL: true, // Keep the original TTL
        });

        logger.debug(`Revoked access token: ${tokenId}`);
      }
    } catch (error) {
      logger.error('Failed to revoke access token:', error);
      throw new Error('Failed to revoke access token');
    }
  }

  /**
   * Revoke a refresh token
   *
   * @param tokenId - Unique token ID
   */
  async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.ensureConnection();

    const key = `${this.REFRESH_TOKEN_PREFIX}${tokenId}`;

    try {
      // Get token metadata to update isRevoked flag
      const data = await this.client.get(key);

      if (data) {
        const metadata = JSON.parse(data) as TokenMetadata;
        metadata.isRevoked = true;

        // Update token with revoked flag
        await this.client.set(key, JSON.stringify(metadata), {
          KEEPTTL: true, // Keep the original TTL
        });

        logger.debug(`Revoked refresh token: ${tokenId}`);
      }
    } catch (error) {
      logger.error('Failed to revoke refresh token:', error);
      throw new Error('Failed to revoke refresh token');
    }
  }

  /**
   * Revoke all tokens for a user
   *
   * @param userId - User ID
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.ensureConnection();

    const userTokensKey = `${this.USER_TOKENS_PREFIX}${userId}`;

    try {
      // Get all token IDs for the user
      const tokenIds = await this.client.sMembers(userTokensKey);

      // Revoke each token
      for (const tokenId of tokenIds) {
        // Try to revoke as both access and refresh token (one will fail but that's ok)
        await this.revokeAccessToken(tokenId).catch(() => {});
        await this.revokeRefreshToken(tokenId).catch(() => {});
      }

      logger.debug(`Revoked all tokens for user: ${userId}`);
    } catch (error) {
      logger.error('Failed to revoke all user tokens:', error);
      throw new Error('Failed to revoke all user tokens');
    }
  }

  /**
   * Store OAuth state parameter
   *
   * @param stateId - State ID (random string)
   * @param state - State data to store
   * @param expiresIn - Expiration time in seconds
   */
  async storeOAuthState(stateId: string, state: unknown, expiresIn = 600): Promise<void> {
    await this.ensureConnection();

    const key = `${this.OAUTH_STATE_PREFIX}${stateId}`;

    try {
      await this.client.set(key, JSON.stringify(state), {
        EX: expiresIn, // Default 10 minutes
      });

      logger.debug(`Stored OAuth state: ${stateId}`);
    } catch (error) {
      logger.error('Failed to store OAuth state:', error);
      throw new Error('Failed to store OAuth state');
    }
  }

  /**
   * Get and delete OAuth state
   *
   * @param stateId - State ID
   * @returns Stored state or null if not found
   */
  async getAndDeleteOAuthState<T>(stateId: string): Promise<T | null> {
    await this.ensureConnection();

    const key = `${this.OAUTH_STATE_PREFIX}${stateId}`;

    try {
      // Get state data
      const data = await this.client.get(key);

      // Delete state data (used only once)
      await this.client.del(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Failed to get OAuth state:', error);
      throw new Error('Failed to get OAuth state');
    }
  }

  /**
   * Cleanup expired tokens for a user
   *
   * @param userId - User ID
   */
  async cleanupExpiredTokens(userId: string): Promise<void> {
    await this.ensureConnection();

    const userTokensKey = `${this.USER_TOKENS_PREFIX}${userId}`;

    try {
      // Get all token IDs for the user
      const tokenIds = await this.client.sMembers(userTokensKey);

      // Check each token
      for (const tokenId of tokenIds) {
        const accessKey = `${this.ACCESS_TOKEN_PREFIX}${tokenId}`;
        const refreshKey = `${this.REFRESH_TOKEN_PREFIX}${tokenId}`;

        // Check if tokens exist
        const accessExists = await this.client.exists(accessKey);
        const refreshExists = await this.client.exists(refreshKey);

        // If neither exists, remove from user's tokens set
        if (!accessExists && !refreshExists) {
          await this.client.sRem(userTokensKey, tokenId);
          logger.debug(`Removed expired token: ${tokenId} for user: ${userId}`);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', error);
      // Don't throw, this is a background maintenance operation
    }
  }
}

// Create a singleton instance
export const authQuery = new AuthQuery();
