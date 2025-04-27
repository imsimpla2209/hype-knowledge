import { config } from '../../../utils/config';
import { EmbeddingService, embeddingService } from '../../embed/services/embed.service';
import {
  VectorProvider,
  VectorStoreConfigUnion,
  VectorSearchRequest,
  VectorSearchResponse,
  DeleteVectorRequest,
  BatchDeleteVectorRequest,
  BatchVectorUpsertRequest,
  VectorUpsertRequest,
  DeleteByFilterRequest,
  CollectionStatsRequest,
  CollectionStatsResponse,
} from '../types/vector.types';
import { Embedding } from '../../embed/types/embed.types';

/**
 * Abstract base provider for vector storage implementations
 */
export abstract class VectorStoreProvider {
  /**
   * Initialize the provider with configuration
   */
  abstract initialize(config: VectorStoreConfigUnion): Promise<void>;

  /**
   * Store a vector in the database
   */
  abstract upsert(request: VectorUpsertRequest): Promise<string>;

  /**
   * Store multiple vectors in the database
   */
  abstract batchUpsert(request: BatchVectorUpsertRequest): Promise<string[]>;

  /**
   * Search for similar vectors
   */
  abstract search(request: VectorSearchRequest): Promise<VectorSearchResponse>;

  /**
   * Delete a vector by ID
   */
  abstract delete(request: DeleteVectorRequest): Promise<void>;

  /**
   * Delete multiple vectors by ID
   */
  abstract batchDelete(request: BatchDeleteVectorRequest): Promise<void>;

  /**
   * Delete vectors by filter
   */
  abstract deleteByFilter(request: DeleteByFilterRequest): Promise<void>;

  /**
   * Get collection stats
   */
  abstract getCollectionStats(request: CollectionStatsRequest): Promise<CollectionStatsResponse>;

  /**
   * Create a new collection/index
   */
  abstract createCollection(collectionName: string, dimensions: number): Promise<void>;

  /**
   * Check if collection exists
   */
  abstract collectionExists(collectionName: string): Promise<boolean>;

  /**
   * Delete collection
   */
  abstract deleteCollection(collectionName: string): Promise<void>;
}

/**
 * Main vector service that handles vector storage and retrieval
 */
export class VectorService {
  private providers: Map<VectorProvider, VectorStoreProvider> = new Map();

  private defaultProvider: VectorProvider;

  private initialized = false;

  constructor() {
    this.defaultProvider = (config.vector?.defaultProvider as VectorProvider) || VectorProvider.MEMORY;
  }

  /**
   * Register a vector database provider
   */
  registerProvider(provider: VectorProvider, implementation: VectorStoreProvider): void {
    this.providers.set(provider, implementation);
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(provider: VectorProvider): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} is not registered`);
    }
    this.defaultProvider = provider;
  }

  /**
   * Get a provider by name
   */
  getProvider(provider?: VectorProvider): VectorStoreProvider {
    const providerName = provider || this.defaultProvider;
    const implementation = this.providers.get(providerName);

    if (!implementation) {
      throw new Error(`Vector provider ${providerName} not found`);
    }

    return implementation;
  }

  /**
   * Initialize the vector service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load provider configurations from config
    const providerConfigs = (config.vector?.providers as Record<string, VectorStoreConfigUnion>) || {};

    // Initialize each provider with its configuration
    const providerEntries = Object.entries(providerConfigs);
    await Promise.all(
      providerEntries.map(async ([providerName, providerConfig]) => {
        const provider = this.providers.get(providerName as VectorProvider);
        if (provider) {
          await provider.initialize(providerConfig as VectorStoreConfigUnion);
        }
      }),
    );

    this.initialized = true;
  }

  /**
   * Store a vector in the database
   */
  async upsert(request: VectorUpsertRequest): Promise<string> {
    await this.ensureInitialized();
    const provider = this.getProvider(request.provider);
    return provider.upsert(request);
  }

  /**
   * Store multiple vectors in the database
   */
  async batchUpsert(request: BatchVectorUpsertRequest): Promise<string[]> {
    await this.ensureInitialized();
    const provider = this.getProvider(request.provider);
    return provider.batchUpsert(request);
  }

  /**
   * Search for similar vectors
   */
  async search(request: VectorSearchRequest): Promise<VectorSearchResponse> {
    await this.ensureInitialized();

    // If text provided but no vector, generate the embedding first
    if (request.queryText && !request.queryVector && !request.queryEmbedding) {
      const { embedding } = await embeddingService.createTextEmbedding({
        text: request.queryText,
      });
      request.queryEmbedding = embedding;
    }

    // If embedding provided but no vector, use the vector from the embedding
    if (request.queryEmbedding && !request.queryVector) {
      request.queryVector = request.queryEmbedding.vector;
    }

    const provider = this.getProvider(request.provider);
    return provider.search(request);
  }

  /**
   * Delete a vector by ID
   */
  async delete(request: DeleteVectorRequest): Promise<void> {
    await this.ensureInitialized();
    const provider = this.getProvider(request.provider);
    return provider.delete(request);
  }

  /**
   * Delete multiple vectors by ID
   */
  async batchDelete(request: BatchDeleteVectorRequest): Promise<void> {
    await this.ensureInitialized();
    const provider = this.getProvider(request.provider);
    return provider.batchDelete(request);
  }

  /**
   * Delete vectors by filter
   */
  async deleteByFilter(request: DeleteByFilterRequest): Promise<void> {
    await this.ensureInitialized();
    const provider = this.getProvider(request.provider);
    return provider.deleteByFilter(request);
  }

  /**
   * Get collection stats
   */
  async getCollectionStats(request: CollectionStatsRequest): Promise<CollectionStatsResponse> {
    await this.ensureInitialized();
    const provider = this.getProvider(request.provider);
    return provider.getCollectionStats(request);
  }

  /**
   * Create a new collection/index
   */
  async createCollection(collectionName: string, dimensions: number, provider?: VectorProvider): Promise<void> {
    await this.ensureInitialized();
    const vectorProvider = this.getProvider(provider);
    return vectorProvider.createCollection(collectionName, dimensions);
  }

  /**
   * Check if collection exists
   */
  async collectionExists(collectionName: string, provider?: VectorProvider): Promise<boolean> {
    await this.ensureInitialized();
    const vectorProvider = this.getProvider(provider);
    return vectorProvider.collectionExists(collectionName);
  }

  /**
   * Delete collection
   */
  async deleteCollection(collectionName: string, provider?: VectorProvider): Promise<void> {
    await this.ensureInitialized();
    const vectorProvider = this.getProvider(provider);
    return vectorProvider.deleteCollection(collectionName);
  }

  /**
   * Store an embedding directly
   */
  async storeEmbedding(
    collection: string,
    id: string,
    embedding: Embedding,
    content: string,
    metadata?: Record<string, any>,
    provider?: VectorProvider,
  ): Promise<string> {
    return this.upsert({
      collection,
      provider,
      entry: {
        id,
        vector: embedding.vector,
        content,
        contentType: embedding.contentType,
        model: embedding.model,
        metadata: {
          ...embedding.metadata,
          ...metadata,
        },
      },
    });
  }

  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Singleton instance
export const vectorService = new VectorService();
