import { Request, Response, NextFunction } from 'express';
import {
  textEmbeddingSchema,
  batchTextEmbeddingSchema,
  fileEmbeddingSchema,
  urlEmbeddingSchema,
  imageEmbeddingSchema,
  multimodalEmbeddingSchema,
} from '../types/embed.types';
import { embeddingService } from '../services/embed.service';
import { logger } from '../../../utils/logger';
import { ValidationError } from '../../../utils/error';

/**
 * Controller for embedding endpoints
 */
export class EmbedController {
  /**
   * Create text embedding
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async createTextEmbedding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const request = textEmbeddingSchema.parse(req.body);

      // Create embedding
      const result = await embeddingService.createTextEmbedding(request);

      // Return response
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create batch text embeddings
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async createBatchEmbeddings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const request = batchTextEmbeddingSchema.parse(req.body);

      // Create embeddings
      const result = await embeddingService.createBatchEmbeddings(request);

      // Return response
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create embedding from file
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async createFileEmbedding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const request = fileEmbeddingSchema.parse(req.body);

      // Create embedding
      const result = await embeddingService.createFileEmbedding(request);

      // Return response
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create embedding from URL
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async createUrlEmbedding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const request = urlEmbeddingSchema.parse(req.body);

      // Create embedding
      const result = await embeddingService.createUrlEmbedding(request);

      // Return response
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create embedding from image
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async createImageEmbedding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const request = imageEmbeddingSchema.parse(req.body);

      // Create embedding
      const result = await embeddingService.createImageEmbedding(request);

      // Return response
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create embedding from multimodal content (text + image)
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async createMultimodalEmbedding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const request = multimodalEmbeddingSchema.parse(req.body);

      // Create embedding
      const result = await embeddingService.createMultimodalEmbedding(request);

      // Return response
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate similarity between two vectors
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async calculateSimilarity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const schema = {
        vector1: Array.isArray(req.body.vector1),
        vector2: Array.isArray(req.body.vector2),
      };

      if (!schema.vector1 || !schema.vector2) {
        throw new ValidationError('Both vector1 and vector2 must be arrays');
      }

      // Calculate similarity
      const similarity = embeddingService.getSimilarity(req.body.vector1, req.body.vector2);

      // Return response
      res.status(200).json({
        status: 'success',
        data: {
          similarity,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

// Singleton instance
export const embedController = new EmbedController();
