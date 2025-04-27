import { z } from 'zod';
import { EmbeddingModel, Embedding, ContentType } from '../../embed/types/embed.types';

/**
 * Supported vector database providers
 */
export enum VectorProvider {
  PINECONE = 'pinecone',
  QDRANT = 'qdrant',
  MILVUS = 'milvus',
  WEAVIATE = 'weaviate',
  PGVECTOR = 'pgvector',
  REDIS = 'redis',
  MEMORY = 'memory',
}

/**
 * Vector similarity metrics
 */
export enum SimilarityMetric {
  COSINE = 'cosine',
  EUCLIDEAN = 'euclidean',
  DOT_PRODUCT = 'dot_product',
}

/**
 * Vector indexing methods
 */
export enum IndexMethod {
  FLAT = 'flat',
  IVF = 'ivf',
  HNSW = 'hnsw',
  PQ = 'pq',
  SCALAR_QUANTIZATION = 'scalar_quantization',
}

/**
 * Vector storage configuration base interface
 */
export interface VectorStoreConfig {
  /** Vector database provider */
  provider: VectorProvider;
  /** Collection/index name */
  collection: string;
  /** Similarity metric to use */
  similarityMetric?: SimilarityMetric;
  /** Index method */
  indexMethod?: IndexMethod;
  /** Connection options specific to provider */
  connectionOptions?: Record<string, any>;
}

/**
 * Pinecone vector store configuration
 */
export interface PineconeConfig extends VectorStoreConfig {
  provider: VectorProvider.PINECONE;
  apiKey: string;
  environment: string;
  projectId: string;
  namespace?: string;
}

/**
 * Qdrant vector store configuration
 */
export interface QdrantConfig extends VectorStoreConfig {
  provider: VectorProvider.QDRANT;
  url: string;
  apiKey?: string;
}

/**
 * PGVector configuration
 */
export interface PGVectorConfig extends VectorStoreConfig {
  provider: VectorProvider.PGVECTOR;
  connectionString: string;
  tableName: string;
  vectorColumnName?: string;
  metadataColumnName?: string;
}

/**
 * Redis vector store configuration
 */
export interface RedisVectorConfig extends VectorStoreConfig {
  provider: VectorProvider.REDIS;
  url: string;
  keyPrefix?: string;
}

/**
 * In-memory vector store configuration
 */
export interface MemoryVectorConfig extends VectorStoreConfig {
  provider: VectorProvider.MEMORY;
  maxEntries?: number;
}

/**
 * Vector store configuration union type
 */
export type VectorStoreConfigUnion =
  | PineconeConfig
  | QdrantConfig
  | PGVectorConfig
  | RedisVectorConfig
  | MemoryVectorConfig;

/**
 * Vector entry to be stored
 */
export interface VectorEntry {
  /** Unique ID for the vector */
  id: string;
  /** The embedding vector */
  vector: number[];
  /** Original text or content that was embedded */
  content: string;
  /** Content type */
  contentType: ContentType;
  /** Embedding model used */
  model: EmbeddingModel;
  /** Metadata for filtering and additional info */
  metadata?: Record<string, any>;
  /** Namespace or category (for providers that support it) */
  namespace?: string;
}

/**
 * Vector upsert request
 */
export interface VectorUpsertRequest {
  /** Collection/index to store in */
  collection: string;
  /** The embedding entry to store */
  entry: VectorEntry;
  /** Provider to use (defaults to configured default) */
  provider?: VectorProvider;
}

/**
 * Batch vector upsert request
 */
export interface BatchVectorUpsertRequest {
  /** Collection/index to store in */
  collection: string;
  /** The embedding entries to store */
  entries: VectorEntry[];
  /** Provider to use (defaults to configured default) */
  provider?: VectorProvider;
}

/**
 * Vector search filter
 */
export interface VectorFilter {
  /** Field to filter on */
  field: string;
  /** Operator for comparison */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
  /** Value to compare against */
  value: any;
}

/**
 * Compound filter with AND/OR logic
 */
export interface CompoundFilter {
  /** AND operator (all conditions must match) */
  $and?: (VectorFilter | CompoundFilter)[];
  /** OR operator (any condition can match) */
  $or?: (VectorFilter | CompoundFilter)[];
}

/**
 * Vector search request
 */
export interface VectorSearchRequest {
  /** Collection/index to search in */
  collection: string;
  /** Query vector to search against */
  queryVector?: number[];
  /** Query embedding to derive vector from */
  queryEmbedding?: Embedding;
  /** Text to embed and search with */
  queryText?: string;
  /** Top K results to return */
  topK: number;
  /** Filter to apply */
  filter?: VectorFilter | CompoundFilter;
  /** Minimum similarity score threshold */
  minScore?: number;
  /** Provider to use (defaults to configured default) */
  provider?: VectorProvider;
  /** Whether to include vector in results */
  includeVector?: boolean;
  /** Whether to include metadata in results */
  includeMetadata?: boolean;
  /** Namespace to search in (if supported) */
  namespace?: string;
}

/**
 * Vector search result
 */
export interface VectorSearchResult {
  /** Entry ID */
  id: string;
  /** Similarity score */
  score: number;
  /** Original content */
  content: string;
  /** Content type */
  contentType: ContentType;
  /** Vector (if requested) */
  vector?: number[];
  /** Metadata (if requested) */
  metadata?: Record<string, any>;
  /** Distance from query vector */
  distance?: number;
}

/**
 * Vector search response
 */
export interface VectorSearchResponse {
  /** Matching results */
  results: VectorSearchResult[];
  /** Total results found */
  total: number;
  /** Time taken for query in ms */
  timeTaken: number;
  /** Provider used */
  provider: VectorProvider;
}

/**
 * Delete vector request
 */
export interface DeleteVectorRequest {
  /** Collection/index to delete from */
  collection: string;
  /** ID of the vector to delete */
  id: string;
  /** Provider to use (defaults to configured default) */
  provider?: VectorProvider;
  /** Namespace (if applicable) */
  namespace?: string;
}

/**
 * Batch delete vector request
 */
export interface BatchDeleteVectorRequest {
  /** Collection/index to delete from */
  collection: string;
  /** IDs of vectors to delete */
  ids: string[];
  /** Provider to use (defaults to configured default) */
  provider?: VectorProvider;
  /** Namespace (if applicable) */
  namespace?: string;
}

/**
 * Delete by filter request
 */
export interface DeleteByFilterRequest {
  /** Collection/index to delete from */
  collection: string;
  /** Filter for vectors to delete */
  filter: VectorFilter | CompoundFilter;
  /** Provider to use (defaults to configured default) */
  provider?: VectorProvider;
  /** Namespace (if applicable) */
  namespace?: string;
}

/**
 * Collection stats request
 */
export interface CollectionStatsRequest {
  /** Collection name */
  collection: string;
  /** Provider to use */
  provider?: VectorProvider;
}

/**
 * Collection stats response
 */
export interface CollectionStatsResponse {
  /** Vector count */
  vectorCount: number;
  /** Dimension size */
  dimensions: number;
  /** Index status */
  indexStatus: 'ready' | 'building' | 'not_indexed';
  /** Provider used */
  provider: VectorProvider;
  /** Provider-specific stats */
  providerStats?: Record<string, any>;
}

/**
 * Zod schema for vector upsert request
 */
export const vectorUpsertSchema = z.object({
  collection: z.string().min(1, 'Collection name is required'),
  entry: z.object({
    id: z.string().min(1, 'Vector ID is required'),
    vector: z.array(z.number()).min(1, 'Vector cannot be empty'),
    content: z.string(),
    contentType: z.nativeEnum(ContentType),
    model: z.nativeEnum(EmbeddingModel),
    metadata: z.record(z.any()).optional(),
    namespace: z.string().optional(),
  }),
  provider: z.nativeEnum(VectorProvider).optional(),
});

/**
 * Zod schema for batch vector upsert request
 */
export const batchVectorUpsertSchema = z.object({
  collection: z.string().min(1, 'Collection name is required'),
  entries: z
    .array(
      z.object({
        id: z.string().min(1, 'Vector ID is required'),
        vector: z.array(z.number()).min(1, 'Vector cannot be empty'),
        content: z.string(),
        contentType: z.nativeEnum(ContentType),
        model: z.nativeEnum(EmbeddingModel),
        metadata: z.record(z.any()).optional(),
        namespace: z.string().optional(),
      }),
    )
    .min(1, 'Must provide at least one vector entry'),
  provider: z.nativeEnum(VectorProvider).optional(),
});

/**
 * Zod schema for vector search request
 */
export const vectorSearchSchema = z
  .object({
    collection: z.string().min(1, 'Collection name is required'),
    queryVector: z.array(z.number()).optional(),
    queryText: z.string().optional(),
    topK: z.number().int().positive().default(10),
    filter: z.any().optional(), // Complex filter structure
    minScore: z.number().min(0).max(1).optional(),
    provider: z.nativeEnum(VectorProvider).optional(),
    includeVector: z.boolean().optional().default(false),
    includeMetadata: z.boolean().optional().default(true),
    namespace: z.string().optional(),
  })
  .refine(data => data.queryVector !== undefined || data.queryText !== undefined, {
    message: 'Either queryVector or queryText must be provided',
    path: ['queryVector', 'queryText'],
  });

/**
 * Zod schema for delete vector request
 */
export const deleteVectorSchema = z.object({
  collection: z.string().min(1, 'Collection name is required'),
  id: z.string().min(1, 'Vector ID is required'),
  provider: z.nativeEnum(VectorProvider).optional(),
  namespace: z.string().optional(),
});

/**
 * Zod schema for batch delete vector request
 */
export const batchDeleteVectorSchema = z.object({
  collection: z.string().min(1, 'Collection name is required'),
  ids: z.array(z.string()).min(1, 'Must provide at least one ID'),
  provider: z.nativeEnum(VectorProvider).optional(),
  namespace: z.string().optional(),
});

/**
 * Zod schema for collection stats request
 */
export const collectionStatsSchema = z.object({
  collection: z.string().min(1, 'Collection name is required'),
  provider: z.nativeEnum(VectorProvider).optional(),
});
