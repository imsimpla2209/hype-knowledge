import { Request, Response, Router } from 'express';
import { vectorService } from '../services/vector.service';
import {
  VectorUpsertRequest,
  BatchVectorUpsertRequest,
  VectorSearchRequest,
  DeleteVectorRequest,
  BatchDeleteVectorRequest,
  DeleteByFilterRequest,
  CollectionStatsRequest,
  vectorUpsertSchema,
  batchVectorUpsertSchema,
  vectorSearchSchema,
  batchDeleteVectorSchema,
} from '../types/vector.types';

/**
 * Create a Zod validation middleware
 */
const validateBody = (schema: any) => (req: Request, res: Response, next: Function) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error: any) {
    res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.errors || error.message,
    });
  }
};

/**
 * Vector routes
 */
export const vectorRouter = Router();

/**
 * Store a vector
 */
vectorRouter.post('/', validateBody(vectorUpsertSchema), async (req: Request, res: Response) => {
  try {
    const request = req.body as VectorUpsertRequest;
    const id = await vectorService.upsert(request);
    res.status(200).json({
      status: 'success',
      data: { id },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: `Failed to store vector: ${error.message}`,
    });
  }
});

/**
 * Store multiple vectors
 */
vectorRouter.post('/batch', validateBody(batchVectorUpsertSchema), async (req: Request, res: Response) => {
  try {
    const request = req.body as BatchVectorUpsertRequest;
    const ids = await vectorService.batchUpsert(request);
    res.status(200).json({
      status: 'success',
      data: { ids },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: `Failed to store vectors: ${error.message}`,
    });
  }
});

/**
 * Search for similar vectors
 */
vectorRouter.post('/search', validateBody(vectorSearchSchema), async (req: Request, res: Response) => {
  try {
    const request = req.body as VectorSearchRequest;
    const results = await vectorService.search(request);
    res.status(200).json({
      status: 'success',
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: `Failed to search vectors: ${error.message}`,
    });
  }
});

/**
 * Delete a vector
 */
vectorRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { collection, provider, namespace } = req.query;

    if (!collection) {
      return res.status(400).json({
        status: 'error',
        message: 'Collection is required',
      });
    }

    const request: DeleteVectorRequest = {
      id,
      collection: collection as string,
      provider: provider as any,
      namespace: namespace as string,
    };

    await vectorService.delete(request);
    res.status(200).json({
      status: 'success',
      data: { success: true },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: `Failed to delete vector: ${error.message}`,
    });
  }
});

/**
 * Delete multiple vectors
 */
vectorRouter.post('/delete/batch', validateBody(batchDeleteVectorSchema), async (req: Request, res: Response) => {
  try {
    const request = req.body as BatchDeleteVectorRequest;
    await vectorService.batchDelete(request);
    res.status(200).json({
      status: 'success',
      data: { success: true },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: `Failed to delete vectors: ${error.message}`,
    });
  }
});

/**
 * Delete vectors by filter
 */
vectorRouter.post('/delete/filter', async (req: Request, res: Response) => {
  try {
    const request = req.body as DeleteByFilterRequest;
    await vectorService.deleteByFilter(request);
    res.status(200).json({
      status: 'success',
      data: { success: true },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: `Failed to delete vectors by filter: ${error.message}`,
    });
  }
});

/**
 * Get collection stats
 */
vectorRouter.get('/stats/:collection', async (req: Request, res: Response) => {
  try {
    const { collection } = req.params;
    const { provider } = req.query;

    const request: CollectionStatsRequest = {
      collection,
      provider: provider as any,
    };

    const stats = await vectorService.getCollectionStats(request);
    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: `Failed to get collection stats: ${error.message}`,
    });
  }
});

/**
 * Create collection
 */
vectorRouter.post('/collections/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { dimensions, provider } = req.query;

    if (!dimensions) {
      return res.status(400).json({
        status: 'error',
        message: 'Dimensions are required',
      });
    }

    const dimensionsNum = Number(dimensions);
    if (Number.isNaN(dimensionsNum) || dimensionsNum <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Dimensions must be a positive integer',
      });
    }

    await vectorService.createCollection(name, dimensionsNum, provider as any);
    res.status(200).json({
      status: 'success',
      data: { success: true },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: `Failed to create collection: ${error.message}`,
    });
  }
});

/**
 * Delete collection
 */
vectorRouter.delete('/collections/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { provider } = req.query;

    await vectorService.deleteCollection(name, provider as any);
    res.status(200).json({
      status: 'success',
      data: { success: true },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: `Failed to delete collection: ${error.message}`,
    });
  }
});
