/* eslint-disable prettier/prettier */
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { DocumentMetadata, RawDocument, ProcessedDocument, IngestStatusResponse } from '../types/ingest.types';
import { config } from '../../../utils/config';
import { logger } from '../../../utils/logger';
import { ServiceUnavailableError } from '../../../utils/error';

/**
 * Redis prefix keys
 */
const KEYS = {
  RAW_DOCUMENT: 'ingest:raw:',
  PROCESSED_DOCUMENT: 'ingest:processed:',
  STATUS: 'ingest:status:'
};

/**
 * Default TTL for documents in Redis (3 days in seconds)
 */
const DEFAULT_TTL = 60 * 60 * 24 * 3;

/**
 * Redis client for document storage
 */
class RedisDocumentStore {
  private client: ReturnType<typeof createClient>;

  private isConnected = false;

  /**
   * Constructor - initializes Redis client
   */
  constructor() {
    if (!config.REDIS_URL) {
      throw new Error('Redis URL is not configured');
    }

    this.client = createClient({
      url: config.REDIS_URL
    });

    // Set up event handlers
    this.client.on('error', err => {
      logger.error('Redis client error', { error: err.message });
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis');
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
        logger.error('Failed to connect to Redis', { error });
        throw new ServiceUnavailableError('Document store is currently unavailable');
      }
    }
  }

  /**
   * Store a raw document
   * @param content - Base64 encoded content
   * @param metadata - Document metadata
   * @param ttl - Time to live in seconds
   * @returns Document ID
   */
  async storeRawDocument(content: string, metadata: DocumentMetadata, ttl = DEFAULT_TTL): Promise<string> {
    await this.connect();

    const id = uuidv4();
    const rawDocument: RawDocument = {
      id,
      content,
      metadata,
      uploadedAt: new Date(),
      ttl
    };

    // Store the document
    await this.client.set(`${KEYS.RAW_DOCUMENT}${id}`, JSON.stringify(rawDocument), { EX: ttl });

    // Initialize status
    await this.setDocumentStatus(id, {
      documentId: id,
      status: 'pending',
      uploadedAt: new Date()
    });

    return id;
  }

  /**
   * Get a raw document
   * @param id - Document ID
   * @returns Raw document or null if not found
   */
  async getRawDocument(id: string): Promise<RawDocument | null> {
    await this.connect();

    const data = await this.client.get(`${KEYS.RAW_DOCUMENT}${id}`);
    if (!data) return null;

    return JSON.parse(data) as RawDocument;
  }

  /**
   * Store a processed document
   * @param document - Processed document
   * @param ttl - Time to live in seconds
   */
  async storeProcessedDocument(document: ProcessedDocument, ttl = DEFAULT_TTL): Promise<void> {
    await this.connect();

    await this.client.set(`${KEYS.PROCESSED_DOCUMENT}${document.id}`, JSON.stringify(document), {
      EX: ttl
    });

    // Update status
    await this.setDocumentStatus(document.id, {
      documentId: document.id,
      status: 'completed',
      totalChunks: document.totalChunks,
      progress: 100,
      uploadedAt: document.metadata.uploadedAt ? new Date(document.metadata.uploadedAt) : new Date(),
      completedAt: new Date()
    });
  }

  /**
   * Get a processed document
   * @param id - Document ID
   * @returns Processed document or null if not found
   */
  async getProcessedDocument(id: string): Promise<ProcessedDocument | null> {
    await this.connect();

    const data = await this.client.get(`${KEYS.PROCESSED_DOCUMENT}${id}`);
    if (!data) return null;

    return JSON.parse(data) as ProcessedDocument;
  }

  /**
   * Set document processing status
   * @param id - Document ID
   * @param status - Status information
   * @param ttl - Time to live in seconds
   */
  async setDocumentStatus(id: string, status: Partial<IngestStatusResponse>, ttl = DEFAULT_TTL): Promise<void> {
    await this.connect();

    // Get current status if it exists
    const currentStatusStr = await this.client.get(`${KEYS.STATUS}${id}`);
    let currentStatus: IngestStatusResponse | null = null;

    if (currentStatusStr) {
      currentStatus = JSON.parse(currentStatusStr) as IngestStatusResponse;
    }

    // Merge current status with new status
    const newStatus: IngestStatusResponse = {
      ...currentStatus,
      ...status,
      documentId: id
    } as IngestStatusResponse;

    await this.client.set(`${KEYS.STATUS}${id}`, JSON.stringify(newStatus), { EX: ttl });
  }

  /**
   * Get document processing status
   * @param id - Document ID
   * @returns Status information or null if not found
   */
  async getDocumentStatus(id: string): Promise<IngestStatusResponse | null> {
    await this.connect();

    const data = await this.client.get(`${KEYS.STATUS}${id}`);
    if (!data) return null;

    return JSON.parse(data) as IngestStatusResponse;
  }

  /**
   * Delete a document and its associated data
   * @param id - Document ID
   */
  async deleteDocument(id: string): Promise<void> {
    await this.connect();

    // Delete all associated data
    await this.client.del(`${KEYS.RAW_DOCUMENT}${id}`, `${KEYS.PROCESSED_DOCUMENT}${id}`, `${KEYS.STATUS}${id}`);
  }
}

// Singleton instance
export const redisDocumentStore = new RedisDocumentStore();
