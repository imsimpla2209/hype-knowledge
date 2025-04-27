import { z } from 'zod';
import { EntityType, RelationshipType, Entity, Relationship } from './graph.types';

/**
 * Knowledge source types
 */
export enum KnowledgeSourceType {
  DOCUMENT = 'DOCUMENT',
  API = 'API',
  DATABASE = 'DATABASE',
  USER_INPUT = 'USER_INPUT',
  INFERENCE = 'INFERENCE',
  EXTERNAL = 'EXTERNAL'
}

/**
 * Confidence levels for knowledge
 */
export enum ConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFERRED = 'INFERRED',
  UNCERTAIN = 'UNCERTAIN'
}

/**
 * Knowledge source metadata
 */
export interface KnowledgeSource {
  id?: string;
  type: KnowledgeSourceType;
  name: string;
  description?: string;
  uri?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Knowledge entity extending base entity with overrides
 */
export interface KnowledgeEntity extends Omit<Entity, 'source'> {
  source: KnowledgeSource;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  lastVerified?: Date;
  alternateNames?: string[];
}

/**
 * Knowledge relationship extending base relationship with overrides
 */
export interface KnowledgeRelationship extends Omit<Relationship, 'source'> {
  source: KnowledgeSource;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  lastVerified?: Date;
  bidirectional?: boolean;
}

/**
 * Structure for a knowledge graph
 */
export interface KnowledgeGraph {
  id?: string;
  name: string;
  description?: string;
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Parameters for knowledge graph extraction
 */
export interface KnowledgeExtractionParams {
  text: string;
  existingGraphId?: string;
  entityTypes?: EntityType[];
  relationshipTypes?: RelationshipType[];
  minConfidence?: number;
  language?: string;
  includeSourceText?: boolean;
  model?: string;
  description?: string;
}

/**
 * Result of a knowledge extraction operation
 */
export interface KnowledgeExtractionResult {
  entities: KnowledgeEntity[];
  relationships: KnowledgeRelationship[];
  sourceId: string;
  processingTime: number;
}

/**
 * Parameters for knowledge graph querying
 */
export interface KnowledgeGraphQueryParams {
  query: string;
  graphId?: string;
  entityTypes?: EntityType[];
  relationshipTypes?: RelationshipType[];
  minConfidence?: number;
  maxHops?: number;
  limit?: number;
  includeInferred?: boolean;
}

/**
 * Schema for creating a knowledge graph
 */
export const createKnowledgeGraphSchema = z.object({
  name: z.string().min(1, 'Knowledge graph name is required'),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Schema for knowledge graph extraction
 */
export const extractKnowledgeSchema = z.object({
  text: z.string().min(1, 'Text is required for knowledge extraction'),
  existingGraphId: z.string().optional(),
  entityTypes: z.array(z.nativeEnum(EntityType)).optional(),
  relationshipTypes: z.array(z.nativeEnum(RelationshipType)).optional(),
  minConfidence: z.number().min(0).max(1).optional().default(0.5),
  language: z.string().optional(),
  includeSourceText: z.boolean().optional().default(true),
  model: z.string().optional()
});

/**
 * Schema for knowledge graph querying
 */
export const queryKnowledgeGraphSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  graphId: z.string().optional(),
  entityTypes: z.array(z.nativeEnum(EntityType)).optional(),
  relationshipTypes: z.array(z.nativeEnum(RelationshipType)).optional(),
  minConfidence: z.number().min(0).max(1).optional().default(0.5),
  maxHops: z.number().positive().optional().default(3),
  limit: z.number().positive().optional().default(10),
  includeInferred: z.boolean().optional().default(true)
});

/**
 * Schema for knowledge entity
 */
export const knowledgeEntitySchema = z.object({
  id: z.string().uuid().optional(),
  type: z.nativeEnum(EntityType),
  name: z.string().min(1, 'Entity name is required'),
  content: z.string().optional(),
  description: z.string().optional(),
  confidence: z.number().min(0).max(1),
  confidenceLevel: z.nativeEnum(ConfidenceLevel),
  source: z.object({
    id: z.string().optional(),
    type: z.nativeEnum(KnowledgeSourceType),
    name: z.string(),
    description: z.string().optional(),
    uri: z.string().optional(),
    createdAt: z.date(),
    metadata: z.record(z.any()).optional()
  }),
  properties: z.record(z.any()).optional(),
  alternateNames: z.array(z.string()).optional(),
  lastVerified: z.date().optional()
});

/**
 * Schema for knowledge relationship
 */
export const knowledgeRelationshipSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.nativeEnum(RelationshipType),
  sourceId: z.string().min(1, 'Source entity ID is required'),
  targetId: z.string().min(1, 'Target entity ID is required'),
  name: z.string().optional(),
  weight: z.number().optional(),
  confidence: z.number().min(0).max(1),
  confidenceLevel: z.nativeEnum(ConfidenceLevel),
  bidirectional: z.boolean().optional().default(false),
  source: z.object({
    id: z.string().optional(),
    type: z.nativeEnum(KnowledgeSourceType),
    name: z.string(),
    description: z.string().optional(),
    uri: z.string().optional(),
    createdAt: z.date(),
    metadata: z.record(z.any()).optional()
  }),
  properties: z.record(z.any()).optional(),
  lastVerified: z.date().optional()
});
