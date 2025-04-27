import { RetrieveService } from './services/retrieve.service';
import { RetrieveController } from './controllers/retrieve.controller';
import { RetrieveParams, RetrieveResult, RetrievalStrategy, Document } from './types/retrieve.types';
import { EmbeddingModelConfig, EmbeddingProvider, EmbeddingModelRetrieveParams, EMBEDDING_MODEL_CONFIGS } from './types/embedding-model.types';

// Create singleton instances
const retrieveService = new RetrieveService();
const retrieveController = new RetrieveController();

// Export all module components
export {
  // Service instance (singleton)
  retrieveService,

  // Controller instance (singleton)
  retrieveController,

  // Classes
  RetrieveService,
  RetrieveController,

  // Types
  RetrieveParams,
  RetrieveResult,
  RetrievalStrategy,
  Document,

  // Embedding model types
  EmbeddingModelConfig,
  EmbeddingProvider,
  EmbeddingModelRetrieveParams,
  EMBEDDING_MODEL_CONFIGS
};
