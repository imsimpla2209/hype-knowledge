import OpenAI from 'openai';
import { performance } from 'perf_hooks';
import {
  Embedding,
  EmbeddingModel,
  ContentType,
  TextEmbeddingRequest,
  BatchTextEmbeddingRequest,
  EmbeddingResponse,
  BatchEmbeddingResponse,
  ImageEmbeddingRequest,
  MultimodalEmbeddingRequest,
} from '../types/embed.types';
import { embeddingCache } from '../queries/redis.queries';
import { config } from '../../../utils/config';
import { logger } from '../../../utils/logger';
import { ValidationError, ServiceUnavailableError } from '../../../utils/error';

/**
 * OpenAI dimensions by model
 */
const MODEL_DIMENSIONS: Record<EmbeddingModel, number> = {
  [EmbeddingModel.OPENAI_TEXT]: 1536,
  [EmbeddingModel.OPENAI_TEXT_3_SMALL]: 1536,
  [EmbeddingModel.OPENAI_TEXT_3_LARGE]: 3072,
};

/**
 * OpenAI embedding service
 */
export class OpenAIEmbeddingService {
  private client: OpenAI;

  /**
   * Constructor - sets up OpenAI client
   */
  constructor() {
    if (!config.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    this.client = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  /**
   * Create embeddings for a single text input
   * @param request - Text embedding request
   * @returns Embedding response
   */
  async createEmbedding(request: TextEmbeddingRequest): Promise<EmbeddingResponse> {
    const startTime = performance.now();
    const {
      text,
      model = EmbeddingModel.OPENAI_TEXT_3_SMALL,
      contentType = ContentType.TEXT,
      useCache = true,
      cacheTtl = 86400,
      metadata = {},
    } = request;

    if (!text) {
      throw new ValidationError('Text is required for embedding');
    }

    // Check cache if enabled
    const contentHash = embeddingCache.constructor.createContentHash(text, model);
    if (useCache) {
      const cachedEmbedding = await embeddingCache.getEmbedding(contentHash);
      if (cachedEmbedding) {
        const timeTaken = performance.now() - startTime;
        return {
          embedding: cachedEmbedding,
          timeTaken,
          fromCache: true,
        };
      }
    }

    try {
      logger.info('Creating embedding with OpenAI', {
        model,
        contentType,
        textLength: text.length,
      });

      // Convert model name to OpenAI format
      const openaiModel = this.getOpenAIModelName(model);

      // Create embedding with OpenAI
      const response = await this.client.embeddings.create({
        model: openaiModel,
        input: text,
        encoding_format: 'float',
      });

      // Validate response
      if (!response.data || response.data.length === 0 || !response.data[0].embedding) {
        throw new Error('Invalid response from OpenAI embedding API');
      }

      // Create embedding object
      const vector = response.data[0].embedding;
      const embedding: Embedding = {
        vector,
        model,
        dimensions: vector.length,
        contentHash,
        contentType,
        createdAt: new Date(),
        metadata,
      };

      // Cache embedding if requested
      if (useCache) {
        await embeddingCache.storeEmbedding(embedding, cacheTtl);
      }

      const timeTaken = performance.now() - startTime;
      return {
        embedding,
        timeTaken,
        fromCache: false,
      };
    } catch (error) {
      logger.error('Error creating embedding with OpenAI', {
        error: error instanceof Error ? error.message : String(error),
        model,
      });

      if (error instanceof Error && error.message.includes('rate limit')) {
        throw new ServiceUnavailableError('OpenAI rate limit reached, try again later');
      }

      throw new ServiceUnavailableError(
        `Error creating embedding: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Create embeddings for a batch of text inputs
   * @param request - Batch text embedding request
   * @returns Batch embedding response
   */
  async createBatchEmbeddings(request: BatchTextEmbeddingRequest): Promise<BatchEmbeddingResponse> {
    const startTime = performance.now();
    const {
      texts,
      model = EmbeddingModel.OPENAI_TEXT_3_SMALL,
      contentType = ContentType.TEXT,
      useCache = true,
      cacheTtl = 86400,
      metadata = {},
    } = request;

    if (!texts || texts.length === 0) {
      throw new ValidationError('Texts array is required for batch embedding');
    }

    if (texts.length > 100) {
      throw new ValidationError('Maximum batch size is 100 texts');
    }

    // Generate content hashes for all texts
    const contentHashes = texts.map(text => embeddingCache.constructor.createContentHash(text, model));
    const embeddings: Embedding[] = [];
    let foundInCache = 0;

    // Check cache for all texts if enabled
    if (useCache) {
      const cachedEmbeddings = await embeddingCache.batchGetEmbeddings(contentHashes);
      foundInCache = cachedEmbeddings.size;

      // Create a map of content hash to index for faster lookups
      const hashToIndexMap = new Map<string, number>();
      contentHashes.forEach((hash, index) => {
        hashToIndexMap.set(hash, index);
      });

      // Add cached embeddings to the result and collect missing texts
      const missingTexts: { text: string; index: number; hash: string }[] = [];

      contentHashes.forEach((hash, index) => {
        const cachedEmbedding = cachedEmbeddings.get(hash);
        if (cachedEmbedding) {
          embeddings[index] = cachedEmbedding;
        } else {
          missingTexts.push({ text: texts[index], index, hash });
        }
      });

      // If all embeddings were found in cache, return early
      if (missingTexts.length === 0) {
        const timeTaken = performance.now() - startTime;
        return {
          embeddings,
          timeTaken,
          fromCache: true,
          count: embeddings.length,
        };
      }

      // Create embeddings for missing texts
      if (missingTexts.length > 0) {
        try {
          logger.info('Creating batch embeddings with OpenAI for missing texts', {
            model,
            contentType,
            count: missingTexts.length,
          });

          // Convert model name to OpenAI format
          const openaiModel = this.getOpenAIModelName(model);

          // Create embeddings with OpenAI
          const response = await this.client.embeddings.create({
            model: openaiModel,
            input: missingTexts.map(item => item.text),
            encoding_format: 'float',
          });

          // Validate response
          if (!response.data || response.data.length === 0) {
            throw new Error('Invalid response from OpenAI embedding API');
          }

          // Process new embeddings
          const newEmbeddings: Embedding[] = response.data.map((data, responseIndex) => {
            const { text, index, hash } = missingTexts[responseIndex];
            return {
              vector: data.embedding,
              model,
              dimensions: data.embedding.length,
              contentHash: hash,
              contentType,
              createdAt: new Date(),
              metadata: { ...metadata, index },
            };
          });

          // Store in cache
          if (useCache) {
            await embeddingCache.batchStoreEmbeddings(newEmbeddings, cacheTtl);
          }

          // Merge with existing embeddings
          for (let i = 0; i < newEmbeddings.length; i++) {
            const { index } = missingTexts[i];
            embeddings[index] = newEmbeddings[i];
          }
        } catch (error) {
          logger.error('Error creating batch embeddings with OpenAI', {
            error: error instanceof Error ? error.message : String(error),
            model,
          });

          if (error instanceof Error && error.message.includes('rate limit')) {
            throw new ServiceUnavailableError('OpenAI rate limit reached, try again later');
          }

          throw new ServiceUnavailableError(
            `Error creating batch embeddings: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } else {
      // If cache is disabled, create all embeddings directly
      try {
        logger.info('Creating batch embeddings with OpenAI (cache disabled)', {
          model,
          contentType,
          count: texts.length,
        });

        // Convert model name to OpenAI format
        const openaiModel = this.getOpenAIModelName(model);

        // Create embeddings with OpenAI
        const response = await this.client.embeddings.create({
          model: openaiModel,
          input: texts,
          encoding_format: 'float',
        });

        // Validate response
        if (!response.data || response.data.length === 0) {
          throw new Error('Invalid response from OpenAI embedding API');
        }

        // Process new embeddings
        embeddings.push(
          ...response.data.map((data, index) => ({
            vector: data.embedding,
            model,
            dimensions: data.embedding.length,
            contentHash: contentHashes[index],
            contentType,
            createdAt: new Date(),
            metadata: { ...metadata, index },
          })),
        );
      } catch (error) {
        logger.error('Error creating batch embeddings with OpenAI', {
          error: error instanceof Error ? error.message : String(error),
          model,
        });

        if (error instanceof Error && error.message.includes('rate limit')) {
          throw new ServiceUnavailableError('OpenAI rate limit reached, try again later');
        }

        throw new ServiceUnavailableError(
          `Error creating batch embeddings: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const timeTaken = performance.now() - startTime;
    return {
      embeddings,
      timeTaken,
      fromCache: foundInCache === texts.length,
      count: embeddings.length,
    };
  }

  /**
   * Create embedding for image data
   * @param request - Image embedding request
   * @returns Embedding response
   */
  async createImageEmbedding(request: ImageEmbeddingRequest): Promise<EmbeddingResponse> {
    const startTime = performance.now();
    const {
      imageData,
      text,
      model = EmbeddingModel.OPENAI_TEXT_3_SMALL,
      useCache = true,
      cacheTtl = 86400,
      metadata = {},
    } = request;

    if (!imageData) {
      throw new ValidationError('Image data is required for image embedding');
    }

    // For image only embedding, we currently return text embedding of the alt text or empty string
    // Future implementation can use CLIP or similar models for true image embeddings
    const textToEmbed = text || 'image';
    const contentType = ContentType.IMAGE;

    // Use text embedding service for now
    return this.createEmbedding({
      text: textToEmbed,
      model,
      contentType,
      useCache,
      cacheTtl,
      metadata: { ...metadata, isImage: true },
    });
  }

  /**
   * Create embedding for multimodal content (text + image)
   * @param request - Multimodal embedding request
   * @returns Embedding response
   */
  async createMultimodalEmbedding(request: MultimodalEmbeddingRequest): Promise<EmbeddingResponse> {
    const startTime = performance.now();
    const {
      text,
      imageData,
      model = EmbeddingModel.OPENAI_TEXT_3_SMALL,
      useCache = true,
      cacheTtl = 86400,
      metadata = {},
    } = request;

    if (!text) {
      throw new ValidationError('Text is required for multimodal embedding');
    }

    if (!imageData) {
      throw new ValidationError('Image data is required for multimodal embedding');
    }

    // For multimodal, we currently just use the text embedding
    // Future implementation can properly combine text and image features
    const contentType = ContentType.MULTIMODAL;

    // Use text embedding service for now
    return this.createEmbedding({
      text,
      model,
      contentType,
      useCache,
      cacheTtl,
      metadata: { ...metadata, hasImage: true },
    });
  }

  /**
   * Get the correct OpenAI model name from our enum
   * @param model - Our model enum value
   * @returns OpenAI model name
   */
  private getOpenAIModelName(model: EmbeddingModel): string {
    // Map our model enum to actual OpenAI model names
    switch (model) {
      case EmbeddingModel.OPENAI_TEXT:
        return 'text-embedding-ada-002';
      case EmbeddingModel.OPENAI_TEXT_3_SMALL:
        return 'text-embedding-3-small';
      case EmbeddingModel.OPENAI_TEXT_3_LARGE:
        return 'text-embedding-3-large';
      default:
        return 'text-embedding-3-small'; // Default to small embedding model
    }
  }

  /**
   * Get the dimension count for a specific model
   * @param model - Embedding model
   * @returns Dimension count
   */
  getDimensions(model: EmbeddingModel): number {
    return MODEL_DIMENSIONS[model] || 1536; // Default to 1536 if not found
  }
}

// Singleton instance
export const openaiEmbeddingService = new OpenAIEmbeddingService();
