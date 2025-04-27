import { z } from 'zod';
import { EmbeddingModel } from '../../embed/types/embed.types';
import { EmbeddingModelRetrieveParams } from './embedding-model.types';

/**
 * Representing LangChain document for type safety
 */
export interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}

/**
 * Available retrieval strategies
 */
export enum RetrievalStrategy {
  VECTOR = 'vector',
  GRAPH = 'graph',
  HYBRID = 'hybrid'
}

/**
 * Base retrieval request parameters
 */
export interface BaseRetrievalParams {
  /** The query text */
  query: string;
  /** Maximum number of documents to retrieve */
  limit?: number;
  /** Metadata filters to apply */
  filters?: Record<string, unknown>;
  /** Whether to rewrite the query for better retrieval */
  rewriteQuery?: boolean;
  /** Whether to use cache for retrieval */
  useCache?: boolean;
}

/**
 * Vector retrieval specific parameters
 */
export interface VectorRetrievalParams extends BaseRetrievalParams, EmbeddingModelRetrieveParams {
  /** Similarity threshold (0-1) */
  similarityThreshold?: number;
  /** Collection name in Qdrant */
  collectionName?: string;
}

/**
 * Graph retrieval specific parameters
 */
export interface GraphRetrievalParams extends BaseRetrievalParams {
  /** Maximum hops in graph traversal */
  maxHops?: number;
  /** Relationship types to traverse */
  relationshipTypes?: string[];
  /** Node labels to include */
  nodeLabels?: string[];
}

/**
 * Hybrid retrieval parameters
 */
export interface HybridRetrievalParams extends VectorRetrievalParams, GraphRetrievalParams {
  /** Strategy for combining results */
  mergeStrategy?: 'interleave' | 'weighted' | 'rerank';
  /** Weight for vector results vs graph results (0-1) */
  vectorWeight?: number;
}

/**
 * Parameters for retrieve service
 */
export interface RetrieveParams extends HybridRetrievalParams {
  /** Retrieval strategy to use */
  strategy: RetrievalStrategy;
}

/**
 * Retrieval result with metadata
 */
export interface RetrieveResult {
  /** Retrieved documents */
  documents: Document[];
  /** Time taken for retrieval (ms) */
  timeTaken: number;
  /** Whether results came from cache */
  fromCache: boolean;
  /** The query that was used (may be rewritten) */
  queryUsed: string;
}

/**
 * Zod schema for validate retrieve params
 */
export const retrieveParamsSchema = z.object({
  query: z.string().min(1, 'Query must be non-empty'),
  limit: z.number().positive().int().optional().default(5),
  filters: z.record(z.unknown()).optional(),
  rewriteQuery: z.boolean().optional().default(false),
  useCache: z.boolean().optional().default(true),
  strategy: z.nativeEnum(RetrievalStrategy).optional().default(RetrievalStrategy.HYBRID),
  similarityThreshold: z.number().min(0).max(1).optional().default(0.7),
  collectionName: z.string().optional(),
  maxHops: z.number().int().nonnegative().optional().default(2),
  relationshipTypes: z.array(z.string()).optional(),
  nodeLabels: z.array(z.string()).optional(),
  mergeStrategy: z.enum(['interleave', 'weighted', 'rerank']).optional().default('rerank'),
  vectorWeight: z.number().min(0).max(1).optional().default(0.7),
  embeddingModel: z.nativeEnum(EmbeddingModel).optional().default(EmbeddingModel.OPENAI_TEXT_3_SMALL),
  similarityMetric: z.enum(['cosine', 'euclidean', 'dot_product']).optional()
});
