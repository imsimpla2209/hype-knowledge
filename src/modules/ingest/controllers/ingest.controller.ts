import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { uploadService } from '../services/upload.service';
import { documentProcessorService } from '../services/document-processor.service';
import { redisDocumentStore } from '../queries/redis.queries';
import { uploadSchema, processOptionsSchema } from '../types/ingest.types';
import { logger } from '../../../utils/logger';
import { ValidationError, NotFoundError } from '../../../utils/error';

/**
 * Controller for ingest endpoints
 */
export class IngestController {
  /**
   * Upload a file
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Parse and validate request metadata
      const { metadata } = uploadSchema.parse(req.body);

      // Upload file
      const documentId = await uploadService.uploadFileFromRequest(req, metadata);

      // Return success response
      res.status(201).json({
        status: 'success',
        message: 'File uploaded successfully',
        data: {
          documentId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload text content
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async uploadText(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const schema = z.object({
        content: z.string().min(1, 'Content is required'),
        filename: z.string().optional(),
        metadata: uploadSchema.shape.metadata,
      });

      const { content, filename, metadata } = schema.parse(req.body);

      // Upload text content
      const documentId = await uploadService.uploadTextContent(content, filename, metadata);

      // Return success response
      res.status(201).json({
        status: 'success',
        message: 'Text uploaded successfully',
        data: {
          documentId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload from URL
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async uploadFromUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const schema = z.object({
        url: z.string().url('Invalid URL'),
        metadata: uploadSchema.shape.metadata,
      });

      const { url, metadata } = schema.parse(req.body);

      // Upload from URL
      const documentId = await uploadService.uploadFromUrl(url, metadata);

      // Return success response
      res.status(201).json({
        status: 'success',
        message: 'URL content uploaded successfully',
        data: {
          documentId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process a document
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async processDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const options = processOptionsSchema.parse(req.body);

      // Check if document exists
      const rawDocument = await redisDocumentStore.getRawDocument(options.documentId);
      if (!rawDocument) {
        throw new NotFoundError(`Document ${options.documentId} not found`);
      }

      // Process document asynchronously
      this.processDocumentAsync(options);

      // Return accepted response
      res.status(202).json({
        status: 'success',
        message: 'Document processing started',
        data: {
          documentId: options.documentId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process a document asynchronously
   * @param options - Processing options
   */
  private async processDocumentAsync(options: z.infer<typeof processOptionsSchema>): Promise<void> {
    try {
      await documentProcessorService.processDocument(options);
    } catch (error) {
      logger.error('Error in async document processing', {
        error: error instanceof Error ? error.message : String(error),
        documentId: options.documentId,
      });

      // Update status to failed
      await redisDocumentStore.setDocumentStatus(options.documentId, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get document status
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getDocumentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Get document status
      const status = await redisDocumentStore.getDocumentStatus(id);
      if (!status) {
        throw new NotFoundError(`Document ${id} not found`);
      }

      // Return status
      res.status(200).json({
        status: 'success',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get processed document
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async getProcessedDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Get processed document
      const document = await redisDocumentStore.getProcessedDocument(id);
      if (!document) {
        // Check if raw document exists but isn't processed
        const status = await redisDocumentStore.getDocumentStatus(id);
        if (status) {
          throw new ValidationError(
            `Document ${id} is not processed yet. Current status: ${status.status}`,
          );
        }
        throw new NotFoundError(`Document ${id} not found`);
      }

      // Return document
      res.status(200).json({
        status: 'success',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a document
   * @param req - Express request
   * @param res - Express response
   * @param next - Express next function
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Check if document exists
      const status = await redisDocumentStore.getDocumentStatus(id);
      if (!status) {
        throw new NotFoundError(`Document ${id} not found`);
      }

      // Delete document
      await redisDocumentStore.deleteDocument(id);

      // Return success response
      res.status(200).json({
        status: 'success',
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Singleton instance
export const ingestController = new IngestController();
