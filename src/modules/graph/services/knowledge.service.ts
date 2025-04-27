import { KnowledgeGraphQueries } from '../queries/knowledge.queries';
import {
  KnowledgeEntity,
  KnowledgeRelationship,
  KnowledgeGraph,
  KnowledgeExtractionParams,
  KnowledgeExtractionResult,
  KnowledgeGraphQueryParams,
  ConfidenceLevel,
  KnowledgeSourceType,
  createKnowledgeGraphSchema,
  extractKnowledgeSchema,
  queryKnowledgeGraphSchema,
} from '../types/knowledge.types';

/**
 * Service for knowledge graph operations
 */
export class KnowledgeGraphService {
  private knowledgeGraphQueries: KnowledgeGraphQueries;

  /**
   * Creates a new instance of KnowledgeGraphService
   */
  constructor() {
    this.knowledgeGraphQueries = new KnowledgeGraphQueries();
  }

  /**
   * Creates a new knowledge graph
   *
   * @param name - Name of the knowledge graph
   * @param description - Optional description
   * @param metadata - Optional metadata
   * @returns Created graph ID
   */
  async createKnowledgeGraph(name: string, description?: string, metadata?: Record<string, any>): Promise<string> {
    try {
      // Validate input using zod schema
      createKnowledgeGraphSchema.parse({ name, description, metadata });

      // Create the knowledge graph
      return await this.knowledgeGraphQueries.createKnowledgeGraph(name, description, metadata);
    } catch (error) {
      console.error('Error creating knowledge graph:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to create knowledge graph: ${error.message}`);
      }

      throw new Error('Failed to create knowledge graph: Unknown error');
    }
  }

  /**
   * Retrieves a knowledge graph by ID
   *
   * @param graphId - ID of the knowledge graph to retrieve
   * @returns Knowledge graph or null if not found
   */
  async getKnowledgeGraph(graphId: string): Promise<KnowledgeGraph | null> {
    try {
      return await this.knowledgeGraphQueries.getKnowledgeGraph(graphId);
    } catch (error) {
      console.error('Error retrieving knowledge graph:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to retrieve knowledge graph: ${error.message}`);
      }

      throw new Error('Failed to retrieve knowledge graph: Unknown error');
    }
  }

  /**
   * Extracts knowledge from text
   *
   * @param params - Knowledge extraction parameters
   * @returns Extracted entities and relationships
   */
  async extractKnowledge(params: KnowledgeExtractionParams): Promise<KnowledgeExtractionResult> {
    try {
      // Validate input using zod schema
      extractKnowledgeSchema.parse(params);

      // Extract knowledge
      return await this.knowledgeGraphQueries.extractKnowledge(params);
    } catch (error) {
      console.error('Error extracting knowledge:', error);

      if (error instanceof Error) {
        throw new Error(`Knowledge extraction failed: ${error.message}`);
      }

      throw new Error('Knowledge extraction failed: Unknown error');
    }
  }

  /**
   * Queries a knowledge graph using natural language
   *
   * @param params - Knowledge graph query parameters
   * @returns Query results with entities and relationships
   */
  async queryKnowledgeGraph(params: KnowledgeGraphQueryParams): Promise<{
    entities: KnowledgeEntity[];
    relationships: KnowledgeRelationship[];
    query: string;
    processedQuery?: string;
  }> {
    try {
      // Validate input using zod schema
      queryKnowledgeGraphSchema.parse(params);

      // Query the knowledge graph
      return await this.knowledgeGraphQueries.queryKnowledgeGraph(params);
    } catch (error) {
      console.error('Error querying knowledge graph:', error);

      if (error instanceof Error) {
        throw new Error(`Knowledge graph query failed: ${error.message}`);
      }

      throw new Error('Knowledge graph query failed: Unknown error');
    }
  }

  /**
   * Adds entities to a knowledge graph
   *
   * @param graphId - ID of the graph
   * @param entities - Entities to add
   * @returns Number of entities added
   */
  async addEntitiesToKnowledgeGraph(graphId: string, entities: KnowledgeEntity[]): Promise<number> {
    try {
      return await this.knowledgeGraphQueries.addEntitiesToKnowledgeGraph(graphId, entities);
    } catch (error) {
      console.error('Error adding entities to knowledge graph:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to add entities: ${error.message}`);
      }

      throw new Error('Failed to add entities: Unknown error');
    }
  }

  /**
   * Adds relationships to a knowledge graph
   *
   * @param graphId - ID of the graph
   * @param relationships - Relationships to add
   * @returns Number of relationships added
   */
  async addRelationshipsToKnowledgeGraph(graphId: string, relationships: KnowledgeRelationship[]): Promise<number> {
    try {
      return await this.knowledgeGraphQueries.addRelationshipsToKnowledgeGraph(graphId, relationships);
    } catch (error) {
      console.error('Error adding relationships to knowledge graph:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to add relationships: ${error.message}`);
      }

      throw new Error('Failed to add relationships: Unknown error');
    }
  }

  /**
   * Creates a knowledge graph from text by extracting entities and relationships
   *
   * @param name - Name of the knowledge graph
   * @param text - Text to extract knowledge from
   * @param options - Optional extraction options
   * @returns Created graph ID and extraction result
   */
  async createKnowledgeGraphFromText(
    name: string,
    text: string,
    options?: Partial<KnowledgeExtractionParams>,
  ): Promise<{ graphId: string; extractionResult: KnowledgeExtractionResult }> {
    try {
      // Create the knowledge graph
      const graphId = await this.createKnowledgeGraph(name, options?.description);

      // Extract knowledge from text
      const extractionResult = await this.extractKnowledge({
        text,
        existingGraphId: graphId,
        ...options,
      });

      return { graphId, extractionResult };
    } catch (error) {
      console.error('Error creating knowledge graph from text:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to create knowledge graph from text: ${error.message}`);
      }

      throw new Error('Failed to create knowledge graph from text: Unknown error');
    }
  }

  /**
   * Updates the confidence level of an entity or relationship
   *
   * @param graphId - ID of the knowledge graph
   * @param entityId - ID of the entity to update
   * @param newConfidence - New confidence value (0-1)
   * @returns Updated confidence level
   */
  async updateEntityConfidence(graphId: string, entityId: string, newConfidence: number): Promise<ConfidenceLevel> {
    try {
      // Validate confidence value
      if (newConfidence < 0 || newConfidence > 1) {
        throw new Error('Confidence value must be between 0 and 1');
      }

      // Get the knowledge graph
      const graph = await this.getKnowledgeGraph(graphId);

      if (!graph) {
        throw new Error(`Knowledge graph with ID ${graphId} not found`);
      }

      // Find the entity to update
      const entity = graph.entities.find(e => e.id === entityId);

      if (!entity) {
        throw new Error(`Entity with ID ${entityId} not found`);
      }

      // Map confidence value to confidence level
      let confidenceLevel = ConfidenceLevel.MEDIUM;
      if (newConfidence >= 0.8) confidenceLevel = ConfidenceLevel.HIGH;
      else if (newConfidence <= 0.4) confidenceLevel = ConfidenceLevel.LOW;

      // Update the entity
      entity.confidence = newConfidence;
      entity.confidenceLevel = confidenceLevel;
      entity.updatedAt = new Date();

      // Save the updated entity
      await this.addEntitiesToKnowledgeGraph(graphId, [entity]);

      return confidenceLevel;
    } catch (error) {
      console.error('Error updating entity confidence:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to update entity confidence: ${error.message}`);
      }

      throw new Error('Failed to update entity confidence: Unknown error');
    }
  }

  /**
   * Merges two knowledge graphs
   *
   * @param sourceGraphId - ID of the source graph
   * @param targetGraphId - ID of the target graph
   * @param options - Optional merge options
   * @returns Number of entities and relationships merged
   */
  async mergeKnowledgeGraphs(
    sourceGraphId: string,
    targetGraphId: string,
    options?: {
      minConfidence?: number;
      overwriteExisting?: boolean;
      sourceLabel?: string;
    },
  ): Promise<{ entitiesCount: number; relationshipsCount: number }> {
    try {
      // Get the source and target graphs
      const sourceGraph = await this.getKnowledgeGraph(sourceGraphId);
      const targetGraph = await this.getKnowledgeGraph(targetGraphId);

      if (!sourceGraph) {
        throw new Error(`Source knowledge graph with ID ${sourceGraphId} not found`);
      }

      if (!targetGraph) {
        throw new Error(`Target knowledge graph with ID ${targetGraphId} not found`);
      }

      // Filter entities by confidence if specified
      let entitiesToMerge = sourceGraph.entities;
      if (options?.minConfidence) {
        entitiesToMerge = entitiesToMerge.filter(e => e.confidence >= (options.minConfidence || 0));
      }

      // Add source label to merged entities if specified
      if (options?.sourceLabel) {
        entitiesToMerge = entitiesToMerge.map(e => ({
          ...e,
          source: {
            ...e.source,
            name: `${e.source.name} (${options.sourceLabel})`,
          },
        }));
      }

      // Add entities to target graph
      const entitiesCount = await this.addEntitiesToKnowledgeGraph(targetGraphId, entitiesToMerge);

      // Filter relationships by confidence if specified
      let relationshipsToMerge = sourceGraph.relationships;
      if (options?.minConfidence) {
        relationshipsToMerge = relationshipsToMerge.filter(r => r.confidence >= (options.minConfidence || 0));
      }

      // Add relationships to target graph
      const relationshipsCount = await this.addRelationshipsToKnowledgeGraph(targetGraphId, relationshipsToMerge);

      return { entitiesCount, relationshipsCount };
    } catch (error) {
      console.error('Error merging knowledge graphs:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to merge knowledge graphs: ${error.message}`);
      }

      throw new Error('Failed to merge knowledge graphs: Unknown error');
    }
  }

  /**
   * Deletes a knowledge graph
   *
   * @param graphId - ID of the graph to delete
   * @returns True if deletion was successful
   */
  async deleteKnowledgeGraph(graphId: string): Promise<boolean> {
    const session = this.knowledgeGraphQueries.driver.session({
      database: this.knowledgeGraphQueries.database,
    });

    try {
      await session.executeWrite((tx: any) =>
        tx.run(
          `
          MATCH (g:KnowledgeGraph {id: $graphId})
          OPTIONAL MATCH (g)<-[:BELONGS_TO]-(e:Entity)
          OPTIONAL MATCH (r:Relationship)-[:FROM|TO]->(:Entity)-[:BELONGS_TO]->(g)
          DETACH DELETE r, e, g
          `,
          { graphId },
        ),
      );

      return true;
    } catch (error) {
      console.error('Error deleting knowledge graph:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to delete knowledge graph: ${error.message}`);
      }

      throw new Error('Failed to delete knowledge graph: Unknown error');
    } finally {
      await session.close();
    }
  }

  /**
   * Cleanup resources when service is no longer needed
   */
  async close(): Promise<void> {
    await this.knowledgeGraphQueries.close();
  }
}
