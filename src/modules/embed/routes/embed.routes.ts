import { Router } from 'express';
import { embedController } from '../controllers/embed.controller';
import { checkPermission } from '../../../middleware/auth.middleware';
import { Permission } from '../../auth/types/auth.types';

/**
 * Router for embedding endpoints
 */
export const embedRouter = Router();

// Create text embedding
embedRouter.post(
  '/text',
  checkPermission(Permission.EMBEDDING_CREATE),
  embedController.createTextEmbedding.bind(embedController),
);

// Create batch text embeddings
embedRouter.post(
  '/batch',
  checkPermission(Permission.EMBEDDING_CREATE),
  embedController.createBatchEmbeddings.bind(embedController),
);

// Create file embedding
embedRouter.post(
  '/file',
  checkPermission(Permission.EMBEDDING_CREATE),
  embedController.createFileEmbedding.bind(embedController),
);

// Create URL embedding
embedRouter.post(
  '/url',
  checkPermission(Permission.EMBEDDING_CREATE),
  embedController.createUrlEmbedding.bind(embedController),
);

// Create image embedding
embedRouter.post(
  '/image',
  checkPermission(Permission.EMBEDDING_CREATE),
  embedController.createImageEmbedding.bind(embedController),
);

// Create multimodal embedding
embedRouter.post(
  '/multimodal',
  checkPermission(Permission.EMBEDDING_CREATE),
  embedController.createMultimodalEmbedding.bind(embedController),
);

// Calculate similarity between embeddings
embedRouter.post(
  '/similarity',
  checkPermission(Permission.EMBEDDING_CREATE),
  embedController.calculateSimilarity.bind(embedController),
);
