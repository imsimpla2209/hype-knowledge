/* eslint-disable no-plusplus */
import axios from 'axios';
import { createHash } from 'crypto';
import {
  EmbeddingModel,
  ContentType,
  TextEmbeddingRequest,
  BatchTextEmbeddingRequest,
  EmbeddingResponse,
  BatchEmbeddingResponse,
  FileEmbeddingRequest,
  UrlEmbeddingRequest,
  ImageEmbeddingRequest,
  MultimodalEmbeddingRequest,
} from '../types/embed.types';
import { openaiEmbeddingService } from './openai.service';
import { logger } from '../../../utils/logger';
import { ValidationError } from '../../../utils/error';

/**
 * Main embedding service to handle different types of content
 */
export class EmbeddingService {
  /**
   * Create text embedding
   * @param request - Text embedding request
   * @returns Embedding response
   */
  async createTextEmbedding(request: TextEmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      logger.info('Processing text embedding request', {
        model: request.model,
        contentType: request.contentType,
        textLength: request.text?.length,
      });

      return await openaiEmbeddingService.createEmbedding(request);
    } catch (error) {
      logger.error('Error in text embedding', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create batch text embeddings
   * @param request - Batch text embedding request
   * @returns Batch embedding response
   */
  async createBatchEmbeddings(request: BatchTextEmbeddingRequest): Promise<BatchEmbeddingResponse> {
    try {
      logger.info('Processing batch embedding request', {
        model: request.model,
        contentType: request.contentType,
        count: request.texts?.length,
      });

      return await openaiEmbeddingService.createBatchEmbeddings(request);
    } catch (error) {
      logger.error('Error in batch embedding', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create embedding from a file
   * @param request - File embedding request
   * @returns Embedding response
   */
  async createFileEmbedding(request: FileEmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      // In a real implementation, this would retrieve the file from the ingest module
      // For now, we'll throw a not implemented error
      throw new ValidationError('File embedding not implemented yet');
    } catch (error) {
      logger.error('Error in file embedding', {
        error: error instanceof Error ? error.message : String(error),
        fileId: request.fileId,
      });
      throw error;
    }
  }

  /**
   * Create embedding from a URL
   * @param request - URL embedding request
   * @returns Embedding response
   */
  async createUrlEmbedding(request: UrlEmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      logger.info('Processing URL embedding request', {
        model: request.model,
        url: request.url,
      });

      // Fetch URL content
      const response = await axios.get(request.url, {
        timeout: 10000, // 10 seconds timeout
      });

      if (typeof response.data !== 'string') {
        // If response is not a string (e.g., JSON), stringify it
        const content = JSON.stringify(response.data);

        // Create text embedding from the content
        return this.createTextEmbedding({
          text: content,
          model: request.model,
          contentType: ContentType.JSON,
          useCache: request.useCache,
          cacheTtl: request.cacheTtl,
          metadata: { ...request.metadata, url: request.url },
        });
      }

      // Create text embedding from the content
      return this.createTextEmbedding({
        text: response.data,
        model: request.model,
        contentType: ContentType.TEXT,
        useCache: request.useCache,
        cacheTtl: request.cacheTtl,
        metadata: { ...request.metadata, url: request.url },
      });
    } catch (error) {
      logger.error('Error in URL embedding', {
        error: error instanceof Error ? error.message : String(error),
        url: request.url,
      });
      throw error;
    }
  }

  /**
   * Create embedding from an image
   * @param request - Image embedding request
   * @returns Embedding response
   */
  async createImageEmbedding(request: ImageEmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      logger.info('Processing image embedding request', {
        model: request.model,
        hasText: !!request.text,
      });

      return await openaiEmbeddingService.createImageEmbedding(request);
    } catch (error) {
      logger.error('Error in image embedding', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create embedding from multimodal content (text + image)
   * @param request - Multimodal embedding request
   * @returns Embedding response
   */
  async createMultimodalEmbedding(request: MultimodalEmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      logger.info('Processing multimodal embedding request', {
        model: request.model,
        textLength: request.text?.length,
      });

      return await openaiEmbeddingService.createMultimodalEmbedding(request);
    } catch (error) {
      logger.error('Error in multimodal embedding', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a hash of the content for cache key or identification
   * @param content - Content to hash
   * @param model - Model used for embedding
   * @returns Hash string
   */
  createContentHash(content: string, model: EmbeddingModel): string {
    return createHash('sha256').update(`${content}:${model}`).digest('hex');
  }

  /**
   * Get similarity between two embeddings
   * @param embedding1 - First embedding vector
   * @param embedding2 - Second embedding vector
   * @returns Cosine similarity (0-1)
   */
  getSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new ValidationError(`Embedding dimensions don't match: ${embedding1.length} vs ${embedding2.length}`);
    }

    // Compute cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Get dimensions for a specific model
   * @param model - Embedding model
   * @returns Number of dimensions
   */
  getDimensions(model: EmbeddingModel): number {
    return openaiEmbeddingService.getDimensions(model);
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService();
