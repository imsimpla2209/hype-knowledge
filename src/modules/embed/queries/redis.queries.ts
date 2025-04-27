import { createClient } from 'redis';
import { createHash } from 'crypto';
import { Embedding, CachedEmbedding, EmbeddingModel, ContentType } from '../types/embed.types';
import { config } from '../../../utils/config';
import { logger } from '../../../utils/logger';
import { ServiceUnavailableError } from '../../../utils/error';

/**
 * Redis prefix for embedding keys
 */
const EMBED_KEY_PREFIX = 'embed:';

/**
 * Default TTL for cached embeddings (1 day in seconds)
 */
const DEFAULT_TTL = 86400;

/**
 * Redis client for embedding cache
 */
export class EmbeddingCache {
  private client: ReturnType<typeof createClient>;

  private isConnected = false;

  /**
   * Constructor initializes Redis client
   */
  constructor() {
    if (!config.REDIS_URL) {
      throw new Error('Redis URL is not configured');
    }

    this.client = createClient({
      url: config.REDIS_URL,
    });

    // Set up event handlers
    this.client.on('error', err => {
      logger.error('Redis embedding cache error', { error: err.message });
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.debug('Connected to Redis embedding cache');
      this.isConnected = true;
    });
  }

  /**
   * Connect to Redis if not already connected
   */
  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
      } catch (error) {
        logger.error('Failed to connect to Redis embedding cache', { error });
        throw new ServiceUnavailableError('Embedding cache is currently unavailable');
      }
    }
  }

  /**
   * Create a hash of the content for cache key
   * @param content - Content to hash
   * @param model - Model used
   * @returns Hash string
   */
  static createContentHash(content: string, model: EmbeddingModel): string {
    return createHash('sha256').update(`${content}:${model}`).digest('hex');
  }

  /**
   * Generate cache key from content hash
   * @param contentHash - Content hash
   * @returns Cache key
   */
  static getCacheKey(contentHash: string): string {
    return `${EMBED_KEY_PREFIX}${contentHash}`;
  }

  /**
   * Store embedding in cache
   * @param embedding - The embedding to cache
   * @param ttl - TTL in seconds
   */
  async storeEmbedding(embedding: Embedding, ttl = DEFAULT_TTL): Promise<void> {
    await this.connect();

    const key = EmbeddingCache.getCacheKey(embedding.contentHash);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    const cachedEmbedding: CachedEmbedding = {
      vector: embedding.vector,
      model: embedding.model,
      contentType: embedding.contentType,
      cachedAt: new Date(),
      expiresAt,
      metadata: embedding.metadata,
    };

    await this.client.set(key, JSON.stringify(cachedEmbedding), { EX: ttl });
    logger.debug('Stored embedding in cache', {
      contentHash: embedding.contentHash,
      model: embedding.model,
      ttl,
    });
  }

  /**
   * Retrieve embedding from cache
   * @param contentHash - Hash of the content
   * @returns Embedding or null if not found/expired
   */
  async getEmbedding(contentHash: string): Promise<Embedding | null> {
    await this.connect();

    const key = EmbeddingCache.getCacheKey(contentHash);
    const data = await this.client.get(key);

    if (!data) {
      return null;
    }

    try {
      const cachedEmbedding = JSON.parse(data) as CachedEmbedding;

      // Check if already expired (Redis might not have cleaned up yet)
      const expiresAt = new Date(cachedEmbedding.expiresAt);
      if (expiresAt < new Date()) {
        logger.debug('Found expired embedding in cache', { contentHash });
        await this.client.del(key);
        return null;
      }

      // Convert cached embedding to Embedding format
      const embedding: Embedding = {
        vector: cachedEmbedding.vector,
        model: cachedEmbedding.model,
        dimensions: cachedEmbedding.vector.length,
        contentHash,
        contentType: cachedEmbedding.contentType,
        createdAt: new Date(cachedEmbedding.cachedAt),
        metadata: cachedEmbedding.metadata,
      };

      logger.debug('Retrieved embedding from cache', { contentHash, model: embedding.model });
      return embedding;
    } catch (error) {
      logger.warn('Error parsing cached embedding', { contentHash, error });
      return null;
    }
  }

  /**
   * Batch retrieve embeddings from cache
   * @param contentHashes - Array of content hashes
   * @returns Map of content hash to embedding
   */
  async batchGetEmbeddings(contentHashes: string[]): Promise<Map<string, Embedding>> {
    await this.connect();

    if (contentHashes.length === 0) {
      return new Map();
    }

    const keys = contentHashes.map(EmbeddingCache.getCacheKey);
    const results = await this.client.mGet(keys);

    const embeddingMap = new Map<string, Embedding>();

    results.forEach((data, index) => {
      if (!data) return;

      try {
        const contentHash = contentHashes[index];
        const cachedEmbedding = JSON.parse(data) as CachedEmbedding;

        // Check if already expired
        const expiresAt = new Date(cachedEmbedding.expiresAt);
        if (expiresAt < new Date()) {
          logger.debug('Found expired embedding in cache during batch get', { contentHash });
          this.client.del(keys[index]); // Clean up expired embedding
          return;
        }

        // Convert to Embedding format
        embeddingMap.set(contentHash, {
          vector: cachedEmbedding.vector,
          model: cachedEmbedding.model,
          dimensions: cachedEmbedding.vector.length,
          contentHash,
          contentType: cachedEmbedding.contentType,
          createdAt: new Date(cachedEmbedding.cachedAt),
          metadata: cachedEmbedding.metadata,
        });
      } catch (error) {
        logger.warn('Error parsing cached embedding in batch', { index, error });
      }
    });

    logger.debug('Batch retrieved embeddings from cache', {
      requested: contentHashes.length,
      found: embeddingMap.size,
    });

    return embeddingMap;
  }

  /**
   * Delete embedding from cache
   * @param contentHash - Hash of the content
   */
  async deleteEmbedding(contentHash: string): Promise<void> {
    await this.connect();
    const key = EmbeddingCache.getCacheKey(contentHash);
    await this.client.del(key);
    logger.debug('Deleted embedding from cache', { contentHash });
  }

  /**
   * Batch store embeddings in cache
   * @param embeddings - Array of embeddings to cache
   * @param ttl - TTL in seconds for all embeddings
   */
  async batchStoreEmbeddings(embeddings: Embedding[], ttl = DEFAULT_TTL): Promise<void> {
    await this.connect();

    if (embeddings.length === 0) {
      return;
    }

    const pipeline = this.client.multi();
    const expiresAt = new Date(Date.now() + ttl * 1000);

    embeddings.forEach(embedding => {
      const key = EmbeddingCache.getCacheKey(embedding.contentHash);
      const cachedEmbedding: CachedEmbedding = {
        vector: embedding.vector,
        model: embedding.model,
        contentType: embedding.contentType,
        cachedAt: new Date(),
        expiresAt,
        metadata: embedding.metadata,
      };

      pipeline.set(key, JSON.stringify(cachedEmbedding), { EX: ttl });
    });

    await pipeline.exec();
    logger.debug('Batch stored embeddings in cache', { count: embeddings.length, ttl });
  }
}

// Singleton instance
export const embeddingCache = new EmbeddingCache();
