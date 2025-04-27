import { QdrantClient } from '@qdrant/js-client-rest';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { QdrantVectorStore } from 'langchain/vectorstores/qdrant';
import { config } from '../../../utils/config';
import { Document, VectorRetrievalParams } from '../types/retrieve.types';
import { EMBEDDING_MODEL_CONFIGS } from '../types/embedding-model.types';
import { EmbeddingModel } from '../../embed/types/embed.types';

/**
 * QdrantQueryAdapter is responsible for managing vector search using Qdrant
 */
export class QdrantQueryAdapter {
  private client: QdrantClient;

  private embeddingsCache: Map<EmbeddingModel, OpenAIEmbeddings>;

  /**
   * Creates a new instance of QdrantQueryAdapter
   */
  constructor() {
    this.client = new QdrantClient({
      url: config.QDRANT_URL,
      ...(config.QDRANT_API_KEY ? { apiKey: config.QDRANT_API_KEY } : {}),
    });

    this.embeddingsCache = new Map();
  }

  /**
   * Gets or creates an embedding model instance
   *
   * @param model - The embedding model to use
   * @returns The embedding model instance
   */
  private getEmbeddings(model: EmbeddingModel): OpenAIEmbeddings {
    if (!this.embeddingsCache.has(model)) {
      const modelConfig = EMBEDDING_MODEL_CONFIGS[model];

      this.embeddingsCache.set(
        model,
        new OpenAIEmbeddings({
          openAIApiKey: config.OPENAI_API_KEY,
          modelName: modelConfig.name,
        }),
      );
    }

    return this.embeddingsCache.get(model)!;
  }

  /**
   * Searches for similar documents in Qdrant
   *
   * @param params - Vector retrieval parameters
   * @returns Promise with retrieved documents
   */
  async search(params: VectorRetrievalParams): Promise<Document[]> {
    const startTime = Date.now();

    try {
      const {
        query,
        limit = config.MAX_DOCUMENTS,
        filters = {},
        similarityThreshold = 0.7,
        collectionName = 'documents',
        embeddingModel = EmbeddingModel.OPENAI_TEXT_3_SMALL,
        similarityMetric,
      } = params;

      // Get appropriate embeddings model
      const embeddings = this.getEmbeddings(embeddingModel);
      const modelConfig = EMBEDDING_MODEL_CONFIGS[embeddingModel];

      // Create vector store instance with the client
      const vectorStore = new QdrantVectorStore(embeddings, {
        client: this.client,
        collectionName,
        ...(similarityMetric
          ? {
              searchOptions: {
                searchParams: {
                  metric: this.mapSimilarityMetric(similarityMetric),
                },
              },
            }
          : {}),
      });

      // Prepare filters for Qdrant
      const qdrantFilters = this.prepareFilters(filters);

      // Perform similarity search
      const results = await vectorStore.similaritySearchWithScore(query, limit, qdrantFilters);

      // Filter results by similarity threshold and map to Document format
      return results
        .filter(([, score]) => score >= similarityThreshold)
        .map(([doc, score]) => ({
          pageContent: doc.pageContent,
          metadata: {
            ...doc.metadata,
            score,
            retrievalMethod: 'vector',
            embeddingModel,
            dimensions: modelConfig.dimensions,
          },
        }));
    } catch (error: unknown) {
      console.error('Error in Qdrant vector search:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Vector search failed: ${errorMessage}`);
    } finally {
      console.debug(`Vector search completed in ${Date.now() - startTime}ms`);
    }
  }

  /**
   * Maps the similarity metric to Qdrant format
   */
  private mapSimilarityMetric(metric: 'cosine' | 'euclidean' | 'dot_product'): string {
    switch (metric) {
      case 'cosine':
        return 'Cosine';
      case 'euclidean':
        return 'Euclid';
      case 'dot_product':
        return 'Dot';
      default:
        return 'Cosine';
    }
  }

  /**
   * Prepares filters for Qdrant query
   *
   * @param filters - Filter object with metadata keys and values
   * @returns Qdrant filter object
   */
  private prepareFilters(filters: Record<string, unknown>): Record<string, unknown> {
    if (!filters || Object.keys(filters).length === 0) {
      return {};
    }

    // Convert simple filters to Qdrant filter format
    // This is a simplified implementation - production code would handle
    // more complex filter scenarios (ranges, arrays, etc.)
    const filterConditions = Object.entries(filters).map(([key, value]) => ({
      key: `metadata.${key}`,
      match: { value },
    }));

    return {
      filter: {
        must: filterConditions,
      },
    };
  }
}
