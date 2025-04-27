import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { RetrieveService } from '../services/retrieve.service';
import { retrieveParamsSchema, RetrievalStrategy } from '../types/retrieve.types';
import { EMBEDDING_MODEL_CONFIGS } from '../types/embedding-model.types';

/**
 * Controller for handling retrieval requests
 */
export class RetrieveController {
  private retrieveService: RetrieveService;

  /**
   * Creates a new instance of RetrieveController
   */
  constructor() {
    this.retrieveService = new RetrieveService();
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'OK',
      message: 'Retrieve service is healthy'
    });
  }

  /**
   * Get available embedding models
   */
  async getEmbeddingModels(req: Request, res: Response): Promise<void> {
    const models = Object.entries(EMBEDDING_MODEL_CONFIGS).map(([id, config]) => ({
      id,
      name: config.name,
      provider: config.provider,
      dimensions: config.dimensions,
      maxTokens: config.maxTokens,
      supportsBatching: config.supportsBatching,
      supportsMultimodal: config.supportsMultimodal,
      defaultSimilarityMetric: config.defaultSimilarityMetric
    }));

    res.status(200).json({
      success: true,
      models
    });
  }

  /**
   * Main retrieval endpoint supporting all strategies
   */
  async retrieve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const params = retrieveParamsSchema.parse(req.body);

      // Execute retrieval
      const result = await this.retrieveService.retrieve(params);

      // Return the results
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Vector-only retrieval endpoint
   */
  async vectorRetrieval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Set strategy to vector and validate
      const params = retrieveParamsSchema.parse({
        ...req.body,
        strategy: RetrievalStrategy.VECTOR
      });

      // Execute retrieval
      const result = await this.retrieveService.retrieve(params);

      // Return the results
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Graph-only retrieval endpoint
   */
  async graphRetrieval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Set strategy to graph and validate
      const params = retrieveParamsSchema.parse({
        ...req.body,
        strategy: RetrievalStrategy.GRAPH
      });

      // Execute retrieval
      const result = await this.retrieveService.retrieve(params);

      // Return the results
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      next(error);
    }
  }
}
