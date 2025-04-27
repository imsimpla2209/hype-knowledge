import { createClient } from 'redis';
import { QdrantQueryAdapter } from '../queries/qdrant.query';
import { Neo4jQueryAdapter } from '../queries/neo4j.query';
import { config } from '../../../utils/config';
import { Document, RetrieveParams, RetrieveResult, RetrievalStrategy } from '../types/retrieve.types';
import { EmbeddingModel } from '../../embed/types/embed.types';
import { EMBEDDING_MODEL_CONFIGS } from '../types/embedding-model.types';

/**
 * RetrieveService orchestrates hybrid retrieval using vector and graph methods
 */
export class RetrieveService {
  private qdrantAdapter: QdrantQueryAdapter;

  private neo4jAdapter: Neo4jQueryAdapter;

  private redisClient: ReturnType<typeof createClient> | null = null;

  /**
   * Creates a new instance of RetrieveService
   */
  constructor() {
    this.qdrantAdapter = new QdrantQueryAdapter();
    this.neo4jAdapter = new Neo4jQueryAdapter();
    this.initializeCache();
  }

  /**
   * Initializes Redis cache client if configured
   */
  private async initializeCache(): Promise<void> {
    if (config.REDIS_URL) {
      try {
        this.redisClient = createClient({
          url: config.REDIS_URL,
        });

        await this.redisClient.connect();
        console.info('Redis cache connected for retrieve service');
      } catch (error: any) {
        console.warn('Failed to connect to Redis cache:', error.message);
        this.redisClient = null;
      }
    }
  }

  /**
   * Main retrieval method that orchestrates different retrieval strategies
   *
   * @param params - Retrieval parameters including strategy
   * @returns Promise with retrieval results
   */
  async retrieve(params: RetrieveParams): Promise<RetrieveResult> {
    const startTime = Date.now();
    let queryUsed = params.query;
    let documents: Document[] = [];
    const fromCache = false;

    try {
      // Check cache if enabled
      if (params.useCache !== false && this.redisClient) {
        const cachedResult = await this.getCachedResult(params);
        if (cachedResult) {
          return {
            documents: cachedResult.documents,
            timeTaken: Date.now() - startTime,
            fromCache: true,
            queryUsed: cachedResult.queryUsed,
          };
        }
      }

      // Optionally rewrite query for better retrieval if requested
      if (params.rewriteQuery) {
        queryUsed = await this.rewriteQuery(params.query);
      }

      // Execute retrieval based on strategy
      switch (params.strategy) {
        case RetrievalStrategy.VECTOR:
          documents = await this.vectorRetrieval({
            ...params,
            query: queryUsed,
          });
          break;
        case RetrievalStrategy.GRAPH:
          documents = await this.graphRetrieval({
            ...params,
            query: queryUsed,
          });
          break;
        case RetrievalStrategy.HYBRID:
        default:
          documents = await this.hybridRetrieval({
            ...params,
            query: queryUsed,
          });
          break;
      }

      // Cache results if enabled
      if (params.useCache !== false && this.redisClient) {
        await this.cacheResult(params, { documents, queryUsed });
      }

      // Enhance documents with embedding model info when applicable
      if (params.embeddingModel && [RetrievalStrategy.VECTOR, RetrievalStrategy.HYBRID].includes(params.strategy)) {
        documents = this.enhanceDocumentsWithModelInfo(documents, params.embeddingModel);
      }

      // Return the results
      return {
        documents,
        timeTaken: Date.now() - startTime,
        fromCache,
        queryUsed,
      };
    } catch (error: unknown) {
      console.error('Error in retrieve service:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Retrieval failed: ${errorMessage}`);
    }
  }

  /**
   * Performs vector retrieval using Qdrant
   */
  private async vectorRetrieval(params: RetrieveParams): Promise<Document[]> {
    return this.qdrantAdapter.search(params);
  }

  /**
   * Performs graph retrieval using Neo4j
   */
  private async graphRetrieval(params: RetrieveParams): Promise<Document[]> {
    return this.neo4jAdapter.search(params);
  }

  /**
   * Performs hybrid retrieval using both vector and graph methods
   */
  private async hybridRetrieval(params: RetrieveParams): Promise<Document[]> {
    // Get results from both methods in parallel
    const [vectorResults, graphResults] = await Promise.all([this.vectorRetrieval(params), this.graphRetrieval(params)]);

    // Combine results based on merge strategy
    switch (params.mergeStrategy) {
      case 'interleave':
        return this.interleaveResults(vectorResults, graphResults, params.limit);
      case 'weighted':
        return this.weightedMerge(vectorResults, graphResults, params.vectorWeight || 0.7, params.limit);
      case 'rerank':
      default:
        return this.rerankResults([...vectorResults, ...graphResults], params.query, params.limit);
    }
  }

  /**
   * Interleaves results from vector and graph sources
   */
  private interleaveResults(vectorResults: Document[], graphResults: Document[], limit = 5): Document[] {
    const combined: Document[] = [];
    const maxLength = Math.max(vectorResults.length, graphResults.length);

    for (let i = 0; i < maxLength && combined.length < limit; i++) {
      if (i < vectorResults.length) {
        combined.push(vectorResults[i]);
      }

      if (i < graphResults.length && combined.length < limit) {
        combined.push(graphResults[i]);
      }
    }

    return combined.slice(0, limit);
  }

  /**
   * Combines results with a weighted approach
   */
  private weightedMerge(vectorResults: Document[], graphResults: Document[], vectorWeight = 0.7, limit = 5): Document[] {
    // Assign scores based on rank and weight
    const scoredResults: Array<Document & { weightedScore: number }> = [
      ...vectorResults.map((doc, index) => ({
        ...doc,
        weightedScore: (vectorResults.length - index) * vectorWeight,
      })),
      ...graphResults.map((doc, index) => ({
        ...doc,
        weightedScore: (graphResults.length - index) * (1 - vectorWeight),
      })),
    ];

    // Sort by weighted score
    scoredResults.sort((a, b) => b.weightedScore - a.weightedScore);

    // Remove duplicates based on content similarity (simple implementation)
    const uniqueResults: Document[] = [];
    const seenContent = new Set<string>();

    for (const result of scoredResults) {
      // Create a simplified content signature for deduplication
      const contentSignature = result.pageContent.substring(0, 100).toLowerCase();

      if (!seenContent.has(contentSignature) && uniqueResults.length < limit) {
        seenContent.add(contentSignature);
        uniqueResults.push(result);
      }
    }

    return uniqueResults;
  }

  /**
   * Reranks combined results (simplified implementation)
   * In a real implementation, this would use a reranking model or MMR
   */
  private async rerankResults(results: Document[], query: string, limit = 5): Promise<Document[]> {
    // Remove duplicates
    const uniqueResults: Document[] = [];
    const seenContent = new Set<string>();

    for (const result of results) {
      const contentSignature = result.pageContent.substring(0, 100).toLowerCase();

      if (!seenContent.has(contentSignature)) {
        seenContent.add(contentSignature);
        uniqueResults.push(result);
      }
    }

    // For now, just return the unique results capped at limit
    // In a real implementation, this would use a reranking model
    return uniqueResults.slice(0, limit);
  }

  /**
   * Rewrites a query to improve retrieval quality (simplified implementation)
   * In a production system, this would use an LLM to expand or rewrite the query
   */
  private async rewriteQuery(query: string): Promise<string> {
    // In a real implementation, this would use an LLM to rewrite the query
    // For now, we just return the original query
    return query;
  }

  /**
   * Generates cache key for a retrieval request
   */
  private getCacheKey(params: RetrieveParams): string {
    // Create a stable cache key from the params
    const { query, strategy, limit, filters = {}, collectionName } = params;
    const keyParts = [query, strategy, limit, collectionName || 'default', JSON.stringify(filters)];

    return `retrieve:${keyParts.join(':')}`;
  }

  /**
   * Retrieves cached result if available
   */
  private async getCachedResult(params: RetrieveParams): Promise<{ documents: Document[]; queryUsed: string } | null> {
    if (!this.redisClient) return null;

    const cacheKey = this.getCacheKey(params);
    const cachedData = await this.redisClient.get(cacheKey);

    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch (error: any) {
        console.warn('Failed to parse cached retrieve result:', error.message);
      }
    }

    return null;
  }

  /**
   * Caches retrieval results
   */
  private async cacheResult(params: RetrieveParams, result: { documents: Document[]; queryUsed: string }): Promise<void> {
    if (!this.redisClient) return;

    const cacheKey = this.getCacheKey(params);
    const ttl = config.RETRIEVE_CACHE_TTL || 3600; // Default 1 hour

    try {
      await this.redisClient.set(cacheKey, JSON.stringify(result), { EX: ttl });
    } catch (error: any) {
      console.warn('Failed to cache retrieve result:', error.message);
    }
  }

  /**
   * Add embedding model metadata to documents
   */
  private enhanceDocumentsWithModelInfo(documents: Document[], model: EmbeddingModel): Document[] {
    const modelConfig = EMBEDDING_MODEL_CONFIGS[model];

    return documents.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        embeddingModel: doc.metadata.embeddingModel || model,
        embeddingProvider: doc.metadata.embeddingProvider || modelConfig.provider,
        dimensions: doc.metadata.dimensions || modelConfig.dimensions,
      },
    }));
  }
}
