import { z } from 'zod';

/**
 * Supported mime types for ingestion
 */
export enum SupportedMimeType {
  TEXT = 'text/plain',
  MARKDOWN = 'text/markdown',
  CSV = 'text/csv',
  JSON = 'application/json',
  HTML = 'text/html',
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  PPT = 'application/vnd.ms-powerpoint',
  PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  XLS = 'application/vnd.ms-excel',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

/**
 * Supported document types for ingestion
 */
export enum DocumentType {
  TEXT = 'text',
  MARKDOWN = 'markdown',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html',
  PDF = 'pdf',
  DOC = 'doc',
  DOCX = 'docx',
  PPT = 'ppt',
  PPTX = 'pptx',
  XLS = 'xls',
  XLSX = 'xlsx',
}

/**
 * Document metadata interface
 */
export interface DocumentMetadata {
  /** Original file name */
  filename?: string;
  /** Original mime type */
  mimeType?: string;
  /** Document type */
  documentType: DocumentType;
  /** Source of the document */
  source?: string;
  /** Additional custom metadata */
  [key: string]: any;
}

/**
 * Processed document chunk
 */
export interface DocumentChunk {
  /** Content of the chunk */
  content: string;
  /** Metadata of the document */
  metadata: DocumentMetadata;
  /** Position of chunk in the document */
  position?: number;
}

/**
 * Processed document
 */
export interface ProcessedDocument {
  /** Document ID */
  id: string;
  /** Processed chunks */
  chunks: DocumentChunk[];
  /** Total chunks processed */
  totalChunks: number;
  /** Metadata of the document */
  metadata: DocumentMetadata;
  /** Processing timestamp */
  processedAt: Date;
}

/**
 * File upload request validation schema
 */
export const uploadSchema = z.object({
  metadata: z
    .object({
      source: z.string().optional(),
      documentType: z.nativeEnum(DocumentType).optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Document processing options
 */
export const processOptionsSchema = z.object({
  /** Document ID to process */
  documentId: z.string(),
  /** Chunk size (characters for text, rows for CSV) */
  chunkSize: z.number().int().positive().default(1000),
  /** Chunk overlap */
  chunkOverlap: z.number().int().min(0).default(200),
  /** Whether to use Unstructured.io for preprocessing */
  useUnstructured: z.boolean().default(true),
  /** Whether to include metadata in chunks */
  includeMetadata: z.boolean().default(true),
  /** Additional parsing options */
  parsingOptions: z
    .object({
      csvHasHeaders: z.boolean().optional(),
      jsonDepth: z.number().int().min(1).optional(),
      splitByHeading: z.boolean().optional(),
    })
    .optional(),
});

export type UploadRequest = z.infer<typeof uploadSchema>;
export type ProcessOptions = z.infer<typeof processOptionsSchema>;

/**
 * Raw uploaded document in Redis
 */
export interface RawDocument {
  /** Document ID */
  id: string;
  /** Original file buffer as base64 */
  content: string;
  /** File metadata */
  metadata: DocumentMetadata;
  /** Upload timestamp */
  uploadedAt: Date;
  /** Temporary storage TTL */
  ttl: number;
}

/**
 * Ingest status response
 */
export interface IngestStatusResponse {
  /** Document ID */
  documentId: string;
  /** Status of the processing */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  /** Processing progress (0-100) */
  progress?: number;
  /** Total chunks processed */
  totalChunks?: number;
  /** Error message if failed */
  error?: string;
  /** When document was uploaded */
  uploadedAt: Date;
  /** When document processing was completed */
  completedAt?: Date;
}
