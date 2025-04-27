import { z } from 'zod';

/**
 * Supported embedding models
 */
export enum EmbeddingModel {
  // OpenAI embedding models
  OPENAI_TEXT = 'text-embedding-ada-002',
  OPENAI_TEXT_3_SMALL = 'text-embedding-3-small',
  OPENAI_TEXT_3_LARGE = 'text-embedding-3-large',
  // Potential future models can be added here
}

/**
 * Supported content types for embedding
 */
export enum ContentType {
  TEXT = 'text',
  JSON = 'json',
  MARKDOWN = 'markdown',
  CSV = 'csv',
  CODE = 'code',
  IMAGE = 'image',
  MULTIMODAL = 'multimodal',
}

/**
 * Base embedding request interface
 */
export interface BaseEmbeddingRequest {
  /** Model to use for embedding */
  model?: EmbeddingModel;
  /** Whether to use cache */
  useCache?: boolean;
  /** Cache TTL in seconds (if cached) */
  cacheTtl?: number;
  /** Custom metadata to attach to embedding */
  metadata?: Record<string, any>;
}

/**
 * Text embedding request
 */
export interface TextEmbeddingRequest extends BaseEmbeddingRequest {
  /** Text content to embed */
  text: string;
  /** Content type */
  contentType?: ContentType;
}

/**
 * Batch text embedding request for multiple texts
 */
export interface BatchTextEmbeddingRequest extends BaseEmbeddingRequest {
  /** Array of texts to embed */
  texts: string[];
  /** Content type (should be consistent for batch) */
  contentType?: ContentType;
}

/**
 * File embedding request
 */
export interface FileEmbeddingRequest extends BaseEmbeddingRequest {
  /** File ID (from ingest module) to embed */
  fileId: string;
}

/**
 * URL embedding request
 */
export interface UrlEmbeddingRequest extends BaseEmbeddingRequest {
  /** URL to fetch and embed */
  url: string;
}

/**
 * Image embedding request
 */
export interface ImageEmbeddingRequest extends BaseEmbeddingRequest {
  /** Base64-encoded image data */
  imageData: string;
  /** Optional text to use with the image (for multimodal embedding) */
  text?: string;
}

/**
 * Multimodal embedding request for text+image
 */
export interface MultimodalEmbeddingRequest extends BaseEmbeddingRequest {
  /** Text content */
  text: string;
  /** Base64-encoded image data */
  imageData: string;
}

/**
 * Unified embedding request type
 */
export type EmbeddingRequest =
  | TextEmbeddingRequest
  | BatchTextEmbeddingRequest
  | FileEmbeddingRequest
  | UrlEmbeddingRequest
  | ImageEmbeddingRequest
  | MultimodalEmbeddingRequest;

/**
 * Embedding vector representation
 */
export interface Embedding {
  /** Vector values */
  vector: number[];
  /** Embedding model used */
  model: EmbeddingModel;
  /** Dimension count */
  dimensions: number;
  /** Original content hash (for caching) */
  contentHash: string;
  /** Content type */
  contentType: ContentType;
  /** When the embedding was created */
  createdAt: Date;
  /** Any custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Batch embedding response
 */
export interface BatchEmbeddingResponse {
  /** Array of embeddings */
  embeddings: Embedding[];
  /** Time taken to generate embeddings in ms */
  timeTaken: number;
  /** Whether results came from cache */
  fromCache: boolean;
  /** Count of embeddings generated */
  count: number;
}

/**
 * Single embedding response
 */
export interface EmbeddingResponse {
  /** The embedding */
  embedding: Embedding;
  /** Time taken to generate embedding in ms */
  timeTaken: number;
  /** Whether result came from cache */
  fromCache: boolean;
}

/**
 * Cached embedding in Redis
 */
export interface CachedEmbedding {
  /** Vector values */
  vector: number[];
  /** Model used */
  model: EmbeddingModel;
  /** Content type */
  contentType: ContentType;
  /** When it was cached */
  cachedAt: Date;
  /** When it expires */
  expiresAt: Date;
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Zod schema for text embedding request
 */
export const textEmbeddingSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty'),
  model: z.nativeEnum(EmbeddingModel).optional().default(EmbeddingModel.OPENAI_TEXT_3_SMALL),
  contentType: z.nativeEnum(ContentType).optional().default(ContentType.TEXT),
  useCache: z.boolean().optional().default(true),
  cacheTtl: z.number().int().positive().optional().default(86400), // 1 day default
  metadata: z.record(z.any()).optional(),
});

/**
 * Zod schema for batch text embedding request
 */
export const batchTextEmbeddingSchema = z.object({
  texts: z.array(z.string()).min(1, 'Must provide at least one text'),
  model: z.nativeEnum(EmbeddingModel).optional().default(EmbeddingModel.OPENAI_TEXT_3_SMALL),
  contentType: z.nativeEnum(ContentType).optional().default(ContentType.TEXT),
  useCache: z.boolean().optional().default(true),
  cacheTtl: z.number().int().positive().optional().default(86400), // 1 day default
  metadata: z.record(z.any()).optional(),
});

/**
 * Zod schema for file embedding request
 */
export const fileEmbeddingSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  model: z.nativeEnum(EmbeddingModel).optional().default(EmbeddingModel.OPENAI_TEXT_3_SMALL),
  useCache: z.boolean().optional().default(true),
  cacheTtl: z.number().int().positive().optional().default(86400), // 1 day default
  metadata: z.record(z.any()).optional(),
});

/**
 * Zod schema for URL embedding request
 */
export const urlEmbeddingSchema = z.object({
  url: z.string().url('Invalid URL format'),
  model: z.nativeEnum(EmbeddingModel).optional().default(EmbeddingModel.OPENAI_TEXT_3_SMALL),
  useCache: z.boolean().optional().default(true),
  cacheTtl: z.number().int().positive().optional().default(86400), // 1 day default
  metadata: z.record(z.any()).optional(),
});

/**
 * Zod schema for image embedding request
 */
export const imageEmbeddingSchema = z.object({
  imageData: z.string().min(1, 'Image data is required'),
  text: z.string().optional(),
  model: z.nativeEnum(EmbeddingModel).optional().default(EmbeddingModel.OPENAI_TEXT_3_SMALL),
  useCache: z.boolean().optional().default(true),
  cacheTtl: z.number().int().positive().optional().default(86400), // 1 day default
  metadata: z.record(z.any()).optional(),
});

/**
 * Zod schema for multimodal embedding request
 */
export const multimodalEmbeddingSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty'),
  imageData: z.string().min(1, 'Image data is required'),
  model: z.nativeEnum(EmbeddingModel).optional().default(EmbeddingModel.OPENAI_TEXT_3_SMALL),
  useCache: z.boolean().optional().default(true),
  cacheTtl: z.number().int().positive().optional().default(86400), // 1 day default
  metadata: z.record(z.any()).optional(),
});
