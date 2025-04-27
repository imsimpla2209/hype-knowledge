import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DocumentType, DocumentMetadata, UploadRequest } from '../types/ingest.types';
import { redisDocumentStore } from '../queries/redis.queries';
import { logger } from '../../../utils/logger';
import { ValidationError } from '../../../utils/error';

/**
 * Service for handling file uploads
 */
export class UploadService {
  /**
   * Upload a file and store in Redis
   * @param file - Express file object
   * @param metadata - Optional metadata
   * @returns Document ID
   */
  async uploadFile(file: Express.Multer.File, metadata?: UploadRequest['metadata']): Promise<string> {
    try {
      logger.info('Processing file upload', {
        filename: file.originalname,
        mimetype: file.mimetype
      });

      // Determine document type from mime type
      const documentType = this.getDocumentTypeFromMimeType(file.mimetype);

      // Create metadata
      const docMetadata: DocumentMetadata = {
        filename: file.originalname,
        mimeType: file.mimetype,
        documentType,
        fileSize: file.size,
        uploadedAt: new Date(),
        ...metadata
      };

      // Convert file buffer to base64
      const base64Content = file.buffer.toString('base64');

      // Store raw document in Redis
      const documentId = await redisDocumentStore.storeRawDocument(base64Content, docMetadata);

      logger.info('File uploaded successfully', { documentId, filename: file.originalname });

      return documentId;
    } catch (error) {
      logger.error('Error uploading file', {
        error: error instanceof Error ? error.message : String(error),
        filename: file.originalname
      });
      throw error;
    }
  }

  /**
   * Upload a file from a request
   * @param req - Express request with file
   * @param metadata - Optional metadata
   * @returns Document ID
   */
  async uploadFileFromRequest(req: Request, metadata?: UploadRequest['metadata']): Promise<string> {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    return this.uploadFile(req.file, metadata);
  }

  /**
   * Upload from text content
   * @param content - Text content
   * @param filename - Optional filename
   * @param metadata - Optional metadata
   * @returns Document ID
   */
  async uploadTextContent(content: string, filename: string, metadata?: UploadRequest['metadata']): Promise<string> {
    try {
      logger.info('Processing text upload', { contentLength: content.length });

      // Create metadata
      const docMetadata: DocumentMetadata = {
        filename,
        mimeType: 'text/plain',
        documentType: DocumentType.TEXT,
        fileSize: Buffer.byteLength(content, 'utf8'),
        uploadedAt: new Date(),
        ...metadata
      };

      // Convert content to base64
      const base64Content = Buffer.from(content, 'utf8').toString('base64');

      // Store raw document in Redis
      const documentId = await redisDocumentStore.storeRawDocument(base64Content, docMetadata);

      logger.info('Text content uploaded successfully', { documentId });

      return documentId;
    } catch (error) {
      logger.error('Error uploading text content', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Upload from a URL
   * @param url - URL to fetch content from
   * @param metadata - Optional metadata
   * @returns Document ID
   */
  async uploadFromUrl(url: string, metadata?: UploadRequest['metadata']): Promise<string> {
    try {
      logger.info('Processing URL upload', { url });

      // Fetch content from URL
      const response = await fetch(url);

      if (!response.ok) {
        throw new ValidationError(`Failed to fetch URL: ${response.statusText}`);
      }

      // Get content type
      const contentType = response.headers.get('content-type') || 'text/plain';

      // Get filename from URL or use default
      const urlPath = new URL(url).pathname;
      const filename = path.basename(urlPath) || 'downloaded-content';

      // Create buffer from response
      const buffer = Buffer.from(await response.arrayBuffer());

      // Determine document type
      const documentType = this.getDocumentTypeFromMimeType(contentType);

      // Create metadata
      const docMetadata: DocumentMetadata = {
        filename,
        mimeType: contentType,
        documentType,
        fileSize: buffer.length,
        source: url,
        uploadedAt: new Date(),
        ...metadata
      };

      // Convert to base64
      const base64Content = buffer.toString('base64');

      // Store raw document in Redis
      const documentId = await redisDocumentStore.storeRawDocument(base64Content, docMetadata);

      logger.info('URL content uploaded successfully', { documentId, url });

      return documentId;
    } catch (error) {
      logger.error('Error uploading from URL', {
        error: error instanceof Error ? error.message : String(error),
        url
      });
      throw error;
    }
  }

  /**
   * Determine document type from mime type
   * @param mimeType - MIME type string
   * @returns Document type
   */
  private getDocumentTypeFromMimeType(mimeType: string): DocumentType {
    // Normalize mime type
    const normalizedMime = mimeType.toLowerCase().trim();

    // Match mime type to document type
    if (normalizedMime.includes('text/plain')) {
      return DocumentType.TEXT;
    }
    if (normalizedMime.includes('text/markdown') || normalizedMime.includes('text/x-markdown')) {
      return DocumentType.MARKDOWN;
    }
    if (normalizedMime.includes('text/csv')) {
      return DocumentType.CSV;
    }
    if (normalizedMime.includes('application/json')) {
      return DocumentType.JSON;
    }
    if (normalizedMime.includes('text/html')) {
      return DocumentType.HTML;
    }
    if (normalizedMime.includes('application/pdf')) {
      return DocumentType.PDF;
    }
    if (normalizedMime.includes('application/msword')) {
      return DocumentType.DOC;
    }
    if (normalizedMime.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      return DocumentType.DOCX;
    }
    if (normalizedMime.includes('application/vnd.ms-powerpoint')) {
      return DocumentType.PPT;
    }
    if (normalizedMime.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
      return DocumentType.PPTX;
    }
    if (normalizedMime.includes('application/vnd.ms-excel')) {
      return DocumentType.XLS;
    }
    if (normalizedMime.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      return DocumentType.XLSX;
    }

    // Default to text
    return DocumentType.TEXT;
  }
}

// Singleton instance
export const uploadService = new UploadService();
