import { z } from 'zod';

/**
 * Supported graph entity types
 */
export enum EntityType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  LOCATION = 'LOCATION',
  EVENT = 'EVENT',
  DATE = 'DATE',
  TIME = 'TIME',
  PRODUCT = 'PRODUCT',
  CONCEPT = 'CONCEPT',
  DOCUMENT = 'DOCUMENT',
  TOPIC = 'TOPIC',
  KEYWORD = 'KEYWORD',
  CUSTOM = 'CUSTOM'
}

/**
 * Supported graph relationship types
 */
export enum RelationshipType {
  RELATED_TO = 'RELATED_TO',
  HAS_PROPERTY = 'HAS_PROPERTY',
  PART_OF = 'PART_OF',
  LOCATED_IN = 'LOCATED_IN',
  WORKS_AT = 'WORKS_AT',
  CREATED_BY = 'CREATED_BY',
  MENTIONS = 'MENTIONS',
  REFERENCES = 'REFERENCES',
  IS_A = 'IS_A',
  KNOWS = 'KNOWS',
  OCCURRED_ON = 'OCCURRED_ON',
  PARTICIPATES_IN = 'PARTICIPATES_IN',
  WROTE = 'WROTE',
  SIMILAR_TO = 'SIMILAR_TO',
  CUSTOM = 'CUSTOM'
}

/**
 * Neo4j database configuration
 */
export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
}

/**
 * Entity representing a node in the graph
 */
export interface Entity {
  id?: string;
  type: string;
  name: string;
  content?: string;
  description?: string;
  confidence?: number;
  source?: string;
  properties?: Record<string, any>;
  embedding?: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Relationship representing an edge between two entities
 */
export interface Relationship {
  id?: string;
  type: string;
  sourceId: string;
  targetId: string;
  name?: string;
  weight?: number;
  confidence?: number;
  directed?: boolean;
  source?: string;
  properties?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Graph containing entities and relationships
 */
export interface Graph {
  id?: string;
  name: string;
  description?: string;
  entities?: Entity[];
  relationships?: Relationship[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Parameters for graph querying
 */
export interface GraphQueryParams {
  graphId?: string;
  entityType?: string;
  relationshipType?: string;
  properties?: Record<string, any>;
  searchText?: string;
  startEntityId?: string;
  maxHops?: number;
  limit?: number;
  queryString?: string;
}

/**
 * Result of a graph query
 */
export interface GraphQueryResult {
  entities: Entity[];
  relationships: Relationship[];
  totalEntities: number;
  totalRelationships: number;
  timeTaken: number;
  raw?: any;
}

/**
 * Entity extraction result
 */
export interface EntityExtractionResult {
  entities: Entity[];
  text: string;
  processingTime: number;
}

/**
 * Relationship extraction result
 */
export interface RelationshipExtractionResult {
  relationships: Relationship[];
  entities: Entity[];
  text: string;
  processingTime: number;
}

/**
 * Schema for creating a graph
 */
export const createGraphSchema = z.object({
  name: z.string().min(1, 'Graph name is required'),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Schema for entity
 */
export const entitySchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string().min(1, 'Entity type is required'),
  name: z.string().min(1, 'Entity name is required'),
  content: z.string().optional(),
  description: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  source: z.string().optional(),
  properties: z.record(z.any()).optional(),
  embedding: z.array(z.number()).optional()
});

/**
 * Schema for relationship
 */
export const relationshipSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string().min(1, 'Relationship type is required'),
  sourceId: z.string().min(1, 'Source entity ID is required'),
  targetId: z.string().min(1, 'Target entity ID is required'),
  name: z.string().optional(),
  weight: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
  directed: z.boolean().optional(),
  source: z.string().optional(),
  properties: z.record(z.any()).optional()
});

/**
 * Schema for adding entities to a graph
 */
export const addEntitiesToGraphSchema = z.object({
  graphId: z.string().min(1, 'Graph ID is required'),
  entities: z.array(entitySchema).min(1, 'At least one entity is required')
});

/**
 * Schema for adding relationships to a graph
 */
export const addRelationshipsToGraphSchema = z.object({
  graphId: z.string().min(1, 'Graph ID is required'),
  relationships: z.array(relationshipSchema).min(1, 'At least one relationship is required')
});

/**
 * Schema for entity extraction from text
 */
export const extractEntitiesSchema = z.object({
  text: z.string().min(1, 'Text is required for entity extraction'),
  options: z
    .object({
      types: z.array(z.string()).optional(),
      confidence: z.number().min(0).max(1).optional(),
      language: z.string().optional(),
      customEntities: z.array(z.string()).optional()
    })
    .optional()
});

/**
 * Schema for relationship extraction from text
 */
export const extractRelationshipsSchema = z.object({
  text: z.string().min(1, 'Text is required for relationship extraction'),
  options: z
    .object({
      types: z.array(z.string()).optional(),
      confidence: z.number().min(0).max(1).optional(),
      language: z.string().optional(),
      customRelationships: z.array(z.string()).optional(),
      includeEntities: z.boolean().optional()
    })
    .optional()
});

/**
 * Schema for graph querying
 */
export const queryGraphSchema = z
  .object({
    graphId: z.string().optional(),
    entityType: z.string().optional(),
    relationshipType: z.string().optional(),
    properties: z.record(z.any()).optional(),
    searchText: z.string().optional(),
    startEntityId: z.string().optional(),
    maxHops: z.number().positive().optional(),
    limit: z.number().positive().optional(),
    queryString: z.string().optional()
  })
  .refine(
    data => {
      // At least one parameter must be provided
      return (
        data.graphId !== undefined ||
        data.entityType !== undefined ||
        data.relationshipType !== undefined ||
        data.properties !== undefined ||
        data.searchText !== undefined ||
        data.startEntityId !== undefined ||
        data.queryString !== undefined
      );
    },
    {
      message: 'At least one query parameter must be provided'
    }
  );

/**
 * Graph extraction options for prompts
 */
export interface GraphExtractionOptions {
  systemPrompt?: string;
  userPrompt?: string;
  maxEntities?: number;
  maxRelationships?: number;
  temperature?: number;
  includeSources?: boolean;
  model?: string;
}

/**
 * Extraction provider type
 */
export enum ExtractionProvider {
  OPENAI = 'OPENAI',
  AZURE_OPENAI = 'AZURE_OPENAI',
  LANGCHAIN = 'LANGCHAIN',
  CUSTOM = 'CUSTOM'
}

/**
 * Schema for graph extraction from document
 */
export const extractFromDocumentSchema = z.object({
  documentContent: z.string().min(1, 'Document content is required'),
  documentId: z.string().optional(),
  options: z
    .object({
      entityTypes: z.array(z.string()).optional(),
      relationshipTypes: z.array(z.string()).optional(),
      confidence: z.number().min(0).max(1).optional(),
      provider: z.nativeEnum(ExtractionProvider).optional(),
      extractRelationships: z.boolean().optional(),
      createGraph: z.boolean().optional(),
      graphName: z.string().optional()
    })
    .optional()
});
