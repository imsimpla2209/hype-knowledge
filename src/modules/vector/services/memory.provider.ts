import { randomUUID } from 'crypto';
import {
  VectorProvider,
  VectorStoreConfigUnion,
  MemoryVectorConfig,
  VectorEntry,
  VectorUpsertRequest,
  BatchVectorUpsertRequest,
  VectorSearchRequest,
  VectorSearchResponse,
  DeleteVectorRequest,
  BatchDeleteVectorRequest,
  DeleteByFilterRequest,
  CollectionStatsRequest,
  CollectionStatsResponse,
  VectorSearchResult,
  VectorFilter,
  CompoundFilter,
} from '../types/vector.types';
import { VectorStoreProvider } from './vector.service';

/**
 * Simple in-memory vector store provider for testing and development
 */
export class MemoryVectorProvider implements VectorStoreProvider {
  // Collection name -> entries map
  private collections: Map<string, Map<string, VectorEntry>> = new Map();

  private config: MemoryVectorConfig | null = null;

  private dimensions: Map<string, number> = new Map();

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must be of the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i += 1) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate Euclidean distance between two vectors
   */
  private euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must be of the same dimension');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i += 1) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Calculate dot product similarity between two vectors
   */
  private dotProduct(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must be of the same dimension');
    }

    let dotProduct = 0;
    for (let i = 0; i < a.length; i += 1) {
      dotProduct += a[i] * b[i];
    }

    return dotProduct;
  }

  /**
   * Calculate similarity based on configured metric
   */
  private calculateSimilarity(a: number[], b: number[]): number {
    if (this.config?.similarityMetric === 'euclidean') {
      // Convert to similarity score (1 / (1 + distance))
      const distance = this.euclideanDistance(a, b);
      return 1 / (1 + distance);
    }
    if (this.config?.similarityMetric === 'dot_product') {
      // Normalize dot product to [0,1] range
      return Math.max(0, Math.min(1, (this.dotProduct(a, b) + 1) / 2));
    }
    // Default: cosine similarity
    return this.cosineSimilarity(a, b);
  }

  /**
   * Get a collection by name, creating if it doesn't exist
   */
  private getCollection(name: string): Map<string, VectorEntry> {
    let collection = this.collections.get(name);
    if (!collection) {
      collection = new Map<string, VectorEntry>();
      this.collections.set(name, collection);
    }
    return collection;
  }

  /**
   * Test if an entry passes a filter
   */
  private passesFilter(entry: VectorEntry, filter: VectorFilter | CompoundFilter): boolean {
    // Handle compound filters first
    if ('$and' in filter) {
      return filter.$and!.every(subFilter => this.passesFilter(entry, subFilter));
    }

    if ('$or' in filter) {
      return filter.$or!.some(subFilter => this.passesFilter(entry, subFilter));
    }

    // Handle basic filters
    const vectorFilter = filter as VectorFilter;
    const { field, operator, value } = vectorFilter;

    // Get the field value from entry or metadata
    const metadata = entry.metadata || {};
    const fieldParts = field.split('.');
    let currentValue: any = fieldParts[0] === 'metadata' ? metadata : (entry as any)[fieldParts[0]];

    // Navigate nested properties
    for (let i = 1; i < fieldParts.length; i += 1) {
      if (currentValue === undefined || currentValue === null) {
        return false;
      }
      currentValue = currentValue[fieldParts[i]];
    }

    // Apply comparison operator
    switch (operator) {
      case 'eq':
        return currentValue === value;
      case 'ne':
        return currentValue !== value;
      case 'gt':
        return currentValue > value;
      case 'gte':
        return currentValue >= value;
      case 'lt':
        return currentValue < value;
      case 'lte':
        return currentValue <= value;
      case 'in':
        return Array.isArray(value) && value.includes(currentValue);
      case 'nin':
        return Array.isArray(value) && !value.includes(currentValue);
      case 'contains':
        return typeof currentValue === 'string' && typeof value === 'string' && currentValue.includes(value);
      default:
        return false;
    }
  }

  /**
   * Initialize the memory provider with configuration
   */
  async initialize(config: VectorStoreConfigUnion): Promise<void> {
    if (config.provider !== VectorProvider.MEMORY) {
      throw new Error('Invalid configuration for memory provider');
    }
    this.config = config as MemoryVectorConfig;
  }

  /**
   * Store a vector in memory
   */
  async upsert(request: VectorUpsertRequest): Promise<string> {
    const { collection, entry, provider } = request;

    if (provider && provider !== VectorProvider.MEMORY) {
      throw new Error(`Invalid provider for memory store: ${provider}`);
    }

    const vectorCollection = this.getCollection(collection);
    const id = entry.id || randomUUID();

    // Set dimensions if not already set
    if (!this.dimensions.has(collection)) {
      this.dimensions.set(collection, entry.vector.length);
    }

    // Save the entry
    const entryWithId: VectorEntry = {
      ...entry,
      id,
    };
    vectorCollection.set(id, entryWithId);

    return id;
  }

  /**
   * Store multiple vectors in memory
   */
  async batchUpsert(request: BatchVectorUpsertRequest): Promise<string[]> {
    const { collection, entries, provider } = request;

    if (provider && provider !== VectorProvider.MEMORY) {
      throw new Error(`Invalid provider for memory store: ${provider}`);
    }

    // Use Promise.all to process entries in parallel
    const ids = await Promise.all(
      entries.map(entry =>
        this.upsert({
          collection,
          provider,
          entry,
        }),
      ),
    );

    return ids;
  }

  /**
   * Search for similar vectors in memory
   */
  async search(request: VectorSearchRequest): Promise<VectorSearchResponse> {
    const {
      collection,
      queryVector,
      topK = 10,
      filter,
      minScore = 0,
      includeVector = false,
      includeMetadata = true,
      provider,
    } = request;

    if (provider && provider !== VectorProvider.MEMORY) {
      throw new Error(`Invalid provider for memory store: ${provider}`);
    }

    if (!queryVector) {
      throw new Error('Query vector is required for memory search');
    }

    const startTime = Date.now();
    const vectorCollection = this.getCollection(collection);

    // Get all entries and calculate similarity
    const results: VectorSearchResult[] = [];

    // Convert the Map values to an array for processing
    Array.from(vectorCollection.values()).forEach(entry => {
      // Apply filter if provided
      if (filter && !this.passesFilter(entry, filter)) {
        return;
      }

      // Calculate similarity
      const similarity = this.calculateSimilarity(queryVector, entry.vector);

      // Skip entries below minimum score
      if (similarity < minScore) {
        return;
      }

      // Add to results
      results.push({
        id: entry.id,
        score: similarity,
        content: entry.content,
        contentType: entry.contentType,
        vector: includeVector ? entry.vector : undefined,
        metadata: includeMetadata ? entry.metadata : undefined,
      });
    });

    // Sort by similarity (descending) and limit to topK
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, topK);

    const endTime = Date.now();

    return {
      results: topResults,
      total: results.length,
      timeTaken: endTime - startTime,
      provider: VectorProvider.MEMORY,
    };
  }

  /**
   * Delete a vector by ID
   */
  async delete(request: DeleteVectorRequest): Promise<void> {
    const { collection, id, provider } = request;

    if (provider && provider !== VectorProvider.MEMORY) {
      throw new Error(`Invalid provider for memory store: ${provider}`);
    }

    const vectorCollection = this.getCollection(collection);
    vectorCollection.delete(id);
  }

  /**
   * Delete multiple vectors by ID
   */
  async batchDelete(request: BatchDeleteVectorRequest): Promise<void> {
    const { collection, ids, provider } = request;

    if (provider && provider !== VectorProvider.MEMORY) {
      throw new Error(`Invalid provider for memory store: ${provider}`);
    }

    const vectorCollection = this.getCollection(collection);

    // Delete each ID from the collection
    ids.forEach(id => {
      vectorCollection.delete(id);
    });
  }

  /**
   * Delete vectors by filter
   */
  async deleteByFilter(request: DeleteByFilterRequest): Promise<void> {
    const { collection, filter, provider } = request;

    if (provider && provider !== VectorProvider.MEMORY) {
      throw new Error(`Invalid provider for memory store: ${provider}`);
    }

    const vectorCollection = this.getCollection(collection);
    const idsToDelete: string[] = [];

    // Find entries that match the filter
    Array.from(vectorCollection.values()).forEach(entry => {
      if (this.passesFilter(entry, filter)) {
        idsToDelete.push(entry.id);
      }
    });

    // Delete matched entries
    idsToDelete.forEach(id => {
      vectorCollection.delete(id);
    });
  }

  /**
   * Get collection stats
   */
  async getCollectionStats(request: CollectionStatsRequest): Promise<CollectionStatsResponse> {
    const { collection, provider } = request;

    if (provider && provider !== VectorProvider.MEMORY) {
      throw new Error(`Invalid provider for memory store: ${provider}`);
    }

    const vectorCollection = this.getCollection(collection);
    const dimensions = this.dimensions.get(collection) || 0;

    return {
      vectorCount: vectorCollection.size,
      dimensions,
      indexStatus: 'ready',
      provider: VectorProvider.MEMORY,
      providerStats: {
        memoryUsageBytes: JSON.stringify(Array.from(vectorCollection.values())).length,
      },
    };
  }

  /**
   * Create a new collection
   */
  async createCollection(collectionName: string, dimensions: number): Promise<void> {
    // Collection is automatically created when first used
    this.dimensions.set(collectionName, dimensions);
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, new Map());
    }
  }

  /**
   * Check if collection exists
   */
  async collectionExists(collectionName: string): Promise<boolean> {
    return this.collections.has(collectionName);
  }

  /**
   * Delete collection
   */
  async deleteCollection(collectionName: string): Promise<void> {
    this.collections.delete(collectionName);
    this.dimensions.delete(collectionName);
  }
}

// Create singleton instance
export const memoryVectorProvider = new MemoryVectorProvider();
