import { injectable, inject } from 'inversify';
import { StatusCodes } from 'http-status-codes';
import { performance } from 'perf_hooks';
import { AppError } from '../../../core/errors/app.error';
import { EmbeddingService } from '../../embed/services/embedding.service';
import {
  TemplateEmbeddingRequest,
  TemplateSearchRequest,
  TemplateSearchResponse,
  TemplateVector,
  TEMPLATE_VECTOR_DIMENSION
} from '../types/template.types';
import { VectorService } from '../../vector/services/vector.service';
import { EmbeddingModel } from '../../embed/types/embed.types';
import { Logger } from '../../../core/logger/logger';

@injectable()
export class TemplateService {
  private readonly collectionName = 'templates';

  constructor(
    @inject(EmbeddingService) private readonly embedService: EmbeddingService,
    @inject(VectorService) private readonly vectorService: VectorService,
    @inject(Logger) private readonly logger: Logger
  ) {}

  /**
   * Initialize the template collection if it doesn't exist
   */
  async initCollection(): Promise<void> {
    try {
      const collections = await this.vectorService.listCollections();
      const exists = collections.includes(this.collectionName);

      if (!exists) {
        await this.vectorService.createCollection({
          name: this.collectionName,
          dimensions: TEMPLATE_VECTOR_DIMENSION,
          metadata: {
            indexed: ['id', 'name', 'features', 'collection', 'style', 'industry', 'type']
          }
        });
        this.logger.info(`Created vector collection: ${this.collectionName}`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize template collection', error);
      throw new AppError('Failed to initialize template collection', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create an embedding for a template and store it in the vector database
   */
  async embedTemplate(templateData: TemplateEmbeddingRequest): Promise<string> {
    try {
      await this.initCollection();

      // Create the text representation of the template for embedding
      const templateText = this.createTemplateEmbeddingText(templateData);

      // Generate embedding vector
      const embeddingResult = await this.embedService.getTextEmbedding({
        text: templateText,
        model: EmbeddingModel.OPENAI_TEXT_3_SMALL
      });

      // Store in vector database
      const templateVector: TemplateVector = {
        id: templateData.id,
        vector: embeddingResult.embedding,
        metadata: {
          id: templateData.id,
          name: templateData.name,
          features: templateData.features,
          collection: templateData.collection,
          style: templateData.style,
          industry: templateData.industry,
          type: templateData.type,
          thumbnailUrl: templateData.thumbnailUrl
        }
      };

      await this.vectorService.upsert({
        collection: this.collectionName,
        entries: [templateVector]
      });

      return templateData.id;
    } catch (error) {
      this.logger.error('Failed to embed template', error);
      throw new AppError('Failed to embed template', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Search for templates matching the given query and filters
   */
  async searchTemplates(request: TemplateSearchRequest): Promise<TemplateSearchResponse> {
    try {
      await this.initCollection();

      const startTime = performance.now();

      // Generate embedding for the query
      const embeddingResult = await this.embedService.getTextEmbedding({
        text: request.query,
        model: EmbeddingModel.OPENAI_TEXT_3_SMALL
      });

      // Build filter condition if filters are provided
      const filter: Record<string, any> = {};
      if (request.filters) {
        if (request.filters.collection) {
          filter.collection = request.filters.collection;
        }

        if (request.filters.style) {
          filter.style = request.filters.style;
        }

        if (request.filters.industry) {
          filter.industry = request.filters.industry;
        }

        if (request.filters.type) {
          filter.type = request.filters.type;
        }
      }

      // Search vector database
      const searchResult = await this.vectorService.search({
        collection: this.collectionName,
        queryVector: embeddingResult.embedding,
        topK: request.limit,
        filter: Object.keys(filter).length > 0 ? filter : undefined
      });

      // Format results
      const results = searchResult.matches.map(match => ({
        id: match.id,
        name: match.metadata?.name as string,
        features: match.metadata?.features as string[],
        collection: match.metadata?.collection as string,
        style: match.metadata?.style as string,
        industry: match.metadata?.industry as string,
        type: match.metadata?.type as string,
        thumbnailUrl: match.metadata?.thumbnailUrl as string,
        score: match.score
      }));

      return {
        results,
        total: results.length,
        timeTaken: performance.now() - startTime
      };
    } catch (error) {
      this.logger.error('Failed to search templates', error);
      throw new AppError('Failed to search templates', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete a template from the vector database
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      await this.vectorService.deleteVectors({
        collection: this.collectionName,
        ids: [id]
      });
    } catch (error) {
      this.logger.error(`Failed to delete template: ${id}`, error);
      throw new AppError('Failed to delete template', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create a text representation of the template for embedding
   */
  private createTemplateEmbeddingText(template: TemplateEmbeddingRequest): string {
    const parts = [`Template Name: ${template.name}`];

    if (template.description) {
      parts.push(`Description: ${template.description}`);
    }

    if (template.features && template.features.length > 0) {
      parts.push(`Features: ${template.features.join(', ')}`);
    }

    if (template.collection) {
      parts.push(`Collection: ${template.collection}`);
    }

    if (template.style) {
      parts.push(`Style: ${template.style}`);
    }

    if (template.industry) {
      parts.push(`Industry: ${template.industry}`);
    }

    if (template.type) {
      parts.push(`Type: ${template.type}`);
    }

    return parts.join('\n');
  }
}
