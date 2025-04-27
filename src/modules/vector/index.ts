import { vectorService } from './services/vector.service';
import { memoryVectorProvider } from './services/memory.provider';
import { vectorRouter } from './controllers/vector.controller';
import {
  VectorProvider,
  VectorStoreConfig,
  VectorEntry,
  VectorSearchRequest,
  VectorSearchResponse,
  VectorSearchResult,
  VectorFilter,
  CompoundFilter,
  SimilarityMetric,
  IndexMethod,
} from './types/vector.types';

/**
 * Initialize the vector module
 */
const initVectorModule = async () => {
  // Register the memory provider
  vectorService.registerProvider(VectorProvider.MEMORY, memoryVectorProvider);

  // Initialize the service
  await vectorService.initialize();

  return {
    vectorService,
    memoryVectorProvider,
    vectorRouter,
  };
};

export {
  vectorService,
  memoryVectorProvider,
  vectorRouter,
  initVectorModule,
  // Types
  VectorProvider,
  VectorStoreConfig,
  VectorEntry,
  VectorSearchRequest,
  VectorSearchResponse,
  VectorSearchResult,
  VectorFilter,
  CompoundFilter,
  SimilarityMetric,
  IndexMethod,
};
