import { z } from 'zod';
import { EmbeddingModel } from '../../embed/types/embed.types';

/**
 * Available embedding model providers
 */
export enum EmbeddingProvider {
  OPENAI = 'openai',
  COHERE = 'cohere',
  HUGGINGFACE = 'huggingface',
  CUSTOM = 'custom'
}

/**
 * Embedding model configuration
 */
export interface EmbeddingModelConfig {
  /** Name/ID of the model */
  name: string;
  /** Provider of the embedding model */
  provider: EmbeddingProvider;
  /** Dimensions of the embedding vectors */
  dimensions: number;
  /** Maximum token context window */
  maxTokens: number;
  /** Whether the model supports batched requests */
  supportsBatching: boolean;
  /** Whether the model supports multiple content types */
  supportsMultimodal: boolean;
  /** Default similarity metric for this model */
  defaultSimilarityMetric: 'cosine' | 'euclidean' | 'dot_product';
}

/**
 * Mapping between EmbeddingModel enum and their configurations
 */
export const EMBEDDING_MODEL_CONFIGS: Record<EmbeddingModel, EmbeddingModelConfig> = {
  [EmbeddingModel.OPENAI_TEXT]: {
    name: 'text-embedding-ada-002',
    provider: EmbeddingProvider.OPENAI,
    dimensions: 1536,
    maxTokens: 8191,
    supportsBatching: true,
    supportsMultimodal: false,
    defaultSimilarityMetric: 'cosine'
  },
  [EmbeddingModel.OPENAI_TEXT_3_SMALL]: {
    name: 'text-embedding-3-small',
    provider: EmbeddingProvider.OPENAI,
    dimensions: 1536,
    maxTokens: 8191,
    supportsBatching: true,
    supportsMultimodal: false,
    defaultSimilarityMetric: 'cosine'
  },
  [EmbeddingModel.OPENAI_TEXT_3_LARGE]: {
    name: 'text-embedding-3-large',
    provider: EmbeddingProvider.OPENAI,
    dimensions: 3072,
    maxTokens: 8191,
    supportsBatching: true,
    supportsMultimodal: false,
    defaultSimilarityMetric: 'cosine'
  }
};

/**
 * Embedding model retrieval request parameters
 */
export interface EmbeddingModelRetrieveParams {
  /** Embedding model to use */
  embeddingModel?: EmbeddingModel;
  /** Similarity metric to use for search */
  similarityMetric?: 'cosine' | 'euclidean' | 'dot_product';
}

/**
 * Zod schema for embedding model retrieve params
 */
export const embeddingModelParamsSchema = z.object({
  embeddingModel: z.nativeEnum(EmbeddingModel).optional().default(EmbeddingModel.OPENAI_TEXT_3_SMALL),
  similarityMetric: z.enum(['cosine', 'euclidean', 'dot_product']).optional()
});
