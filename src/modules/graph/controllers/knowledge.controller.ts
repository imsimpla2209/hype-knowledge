import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { KnowledgeGraphService } from '../services/knowledge.service';
import {
  createKnowledgeGraphSchema,
  extractKnowledgeSchema,
  queryKnowledgeGraphSchema,
} from '../types/knowledge.types';

/**
 * Controller for knowledge graph operations
 */
export class KnowledgeGraphController {
  private knowledgeGraphService: KnowledgeGraphService;

  /**
   * Creates a new instance of KnowledgeGraphController
   */
  constructor() {
    this.knowledgeGraphService = new KnowledgeGraphService();
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'OK',
      message: 'Knowledge graph service is healthy',
    });
  }

  /**
   * Creates a new knowledge graph
   */
  async createKnowledgeGraph(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const { name, description, metadata } = createKnowledgeGraphSchema.parse(req.body);

      // Create the knowledge graph
      const graphId = await this.knowledgeGraphService.createKnowledgeGraph(name, description, metadata);

      // Return the result
      res.status(201).json({
        success: true,
        graphId,
        message: 'Knowledge graph created successfully',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Retrieves a knowledge graph by ID
   */
  async getKnowledgeGraph(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Retrieve the knowledge graph
      const graph = await this.knowledgeGraphService.getKnowledgeGraph(id);

      if (!graph) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `Knowledge graph with ID ${id} not found`,
        });
        return;
      }

      // Return the result
      res.status(200).json({
        success: true,
        graph,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extracts knowledge from text
   */
  async extractKnowledge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const params = extractKnowledgeSchema.parse(req.body);

      // Extract knowledge
      const result = await this.knowledgeGraphService.extractKnowledge(params);

      // Return the result
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Queries a knowledge graph using natural language
   */
  async queryKnowledgeGraph(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const params = queryKnowledgeGraphSchema.parse(req.body);

      // Query the knowledge graph
      const result = await this.knowledgeGraphService.queryKnowledgeGraph(params);

      // Return the result
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      next(error);
    }
  }

  /**
   * Creates a knowledge graph from text
   */
  async createKnowledgeGraphFromText(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate required fields
      const { name, text, ...options } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Name is required and must be a string',
        });
        return;
      }

      if (!text || typeof text !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Text is required and must be a string',
        });
        return;
      }

      // Create the knowledge graph from text
      const result = await this.knowledgeGraphService.createKnowledgeGraphFromText(name, text, options);

      // Return the result
      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Merges two knowledge graphs
   */
  async mergeKnowledgeGraphs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate required fields
      const { sourceGraphId, targetGraphId, ...options } = req.body;

      if (!sourceGraphId || typeof sourceGraphId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Source graph ID is required and must be a string',
        });
        return;
      }

      if (!targetGraphId || typeof targetGraphId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Target graph ID is required and must be a string',
        });
        return;
      }

      // Merge the knowledge graphs
      const result = await this.knowledgeGraphService.mergeKnowledgeGraphs(sourceGraphId, targetGraphId, options);

      // Return the result
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a knowledge graph
   */
  async deleteKnowledgeGraph(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Delete the knowledge graph
      const success = await this.knowledgeGraphService.deleteKnowledgeGraph(id);

      // Return the result
      res.status(200).json({
        success,
        message: `Knowledge graph with ID ${id} deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an entity's confidence
   */
  async updateEntityConfidence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { graphId, entityId } = req.params;
      const { confidence } = req.body;

      if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Confidence must be a number between 0 and 1',
        });
        return;
      }

      // Update the entity's confidence
      const confidenceLevel = await this.knowledgeGraphService.updateEntityConfidence(graphId, entityId, confidence);

      // Return the result
      res.status(200).json({
        success: true,
        entityId,
        confidence,
        confidenceLevel,
      });
    } catch (error) {
      next(error);
    }
  }
}
