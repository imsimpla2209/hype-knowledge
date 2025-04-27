/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
import neo4j, { Driver, Session, auth } from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import { config } from '../../../utils/config';
import {
  KnowledgeEntity,
  KnowledgeRelationship,
  KnowledgeGraph,
  KnowledgeExtractionParams,
  KnowledgeExtractionResult,
  KnowledgeGraphQueryParams,
  KnowledgeSourceType,
  ConfidenceLevel
} from '../types/knowledge.types';
import { EntityType, RelationshipType } from '../types/graph.types';

// Extended interface for OpenAI chat completion params with JSON response format
interface ExtendedChatCompletionParams extends ChatCompletionCreateParamsBase {
  response_format?: { type: 'json_object' };
}

/**
 * Neo4j query adapter for knowledge graph operations
 */
export class KnowledgeGraphQueries {
  public driver: Driver;

  public openai: OpenAI;

  public database: string;

  /**
   * Creates a new instance of KnowledgeGraphQueries
   */
  constructor() {
    this.driver = neo4j.driver(config.NEO4J_URI, auth.basic(config.NEO4J_USERNAME, config.NEO4J_PASSWORD));
    this.database = 'neo4j'; // Default database
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY
    });
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
    const session: Session = this.driver.session({ database: this.database });
    try {
      const graphId = uuidv4();
      const now = new Date().toISOString();

      const result = await session.executeWrite((tx: any) =>
        tx.run(
          `
          CREATE (g:KnowledgeGraph {
            id: $graphId,
            name: $name,
            description: $description,
            metadata: $metadata,
            createdAt: $createdAt,
            updatedAt: $createdAt
          })
          RETURN g.id as id
          `,
          {
            graphId,
            name,
            description: description || '',
            metadata: metadata ? JSON.stringify(metadata) : '{}',
            createdAt: now
          }
        )
      );

      return result.records[0].get('id');
    } finally {
      await session.close();
    }
  }

  /**
   * Retrieves a knowledge graph by ID
   *
   * @param graphId - ID of the knowledge graph to retrieve
   * @returns Knowledge graph or null if not found
   */
  async getKnowledgeGraph(graphId: string): Promise<KnowledgeGraph | null> {
    const session: Session = this.driver.session({ database: this.database });
    try {
      const result = await session.executeRead((tx: any) =>
        tx.run(
          `
          MATCH (g:KnowledgeGraph {id: $graphId})
          OPTIONAL MATCH (g)<-[:BELONGS_TO]-(e:Entity)
          OPTIONAL MATCH (s:Entity)<-[:FROM]-(r:Relationship)-[:TO]->(t:Entity)
          WHERE (s)-[:BELONGS_TO]->(g) AND (t)-[:BELONGS_TO]->(g)
          RETURN g as graph, 
                 collect(DISTINCT e) as entities, 
                 collect(DISTINCT {relationship: r, source: s.id, target: t.id}) as relationships
          `,
          { graphId }
        )
      );

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const graphData = record.get('graph').properties;
      const entitiesData = record.get('entities');
      const relationshipsData = record.get('relationships');

      // Convert neo4j entities to knowledge entities
      const entities: KnowledgeEntity[] = entitiesData.map((e: any) => {
        const props = e.properties;
        return {
          id: props.id,
          type: props.type,
          name: props.name,
          content: props.content || '',
          description: props.description || '',
          confidence: parseFloat(props.confidence) || 0,
          confidenceLevel: props.confidenceLevel || ConfidenceLevel.MEDIUM,
          source: JSON.parse(props.source || '{}'),
          properties: JSON.parse(props.properties || '{}'),
          alternateNames: JSON.parse(props.alternateNames || '[]'),
          lastVerified: props.lastVerified ? new Date(props.lastVerified) : undefined,
          createdAt: new Date(props.createdAt),
          updatedAt: new Date(props.updatedAt)
        };
      });

      // Convert neo4j relationships to knowledge relationships
      const relationships: KnowledgeRelationship[] = relationshipsData.map((r: any) => {
        const props = r.relationship.properties;
        return {
          id: props.id,
          type: props.type,
          sourceId: r.source,
          targetId: r.target,
          name: props.name || '',
          weight: parseFloat(props.weight) || 0,
          confidence: parseFloat(props.confidence) || 0,
          confidenceLevel: props.confidenceLevel || ConfidenceLevel.MEDIUM,
          source: JSON.parse(props.source || '{}'),
          bidirectional: props.bidirectional === 'true',
          properties: JSON.parse(props.properties || '{}'),
          lastVerified: props.lastVerified ? new Date(props.lastVerified) : undefined,
          createdAt: new Date(props.createdAt),
          updatedAt: new Date(props.updatedAt)
        };
      });

      return {
        id: graphData.id,
        name: graphData.name,
        description: graphData.description || '',
        entities,
        relationships,
        metadata: JSON.parse(graphData.metadata || '{}'),
        createdAt: new Date(graphData.createdAt),
        updatedAt: new Date(graphData.updatedAt)
      };
    } finally {
      await session.close();
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
    const session: Session = this.driver.session({ database: this.database });
    try {
      let addedCount = 0;

      // Process entities in batches of 100
      const batchSize = 100;
      for (let i = 0; i < entities.length; i += batchSize) {
        const batch = entities.slice(i, i + batchSize);

        const params = {
          graphId,
          entities: batch.map(entity => ({
            id: entity.id || uuidv4(),
            type: entity.type,
            name: entity.name,
            content: entity.content || '',
            description: entity.description || '',
            confidence: entity.confidence,
            confidenceLevel: entity.confidenceLevel,
            source: JSON.stringify(entity.source),
            properties: JSON.stringify(entity.properties || {}),
            alternateNames: JSON.stringify(entity.alternateNames || []),
            lastVerified: entity.lastVerified?.toISOString() || null,
            createdAt: entity.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: entity.updatedAt?.toISOString() || new Date().toISOString()
          }))
        };

        const result = await session.executeWrite((tx: any) =>
          tx.run(
            `
            MATCH (g:KnowledgeGraph {id: $graphId})
            UNWIND $entities as entity
            MERGE (e:Entity {id: entity.id})
            ON CREATE SET
              e.type = entity.type,
              e.name = entity.name,
              e.content = entity.content,
              e.description = entity.description,
              e.confidence = entity.confidence,
              e.confidenceLevel = entity.confidenceLevel,
              e.source = entity.source,
              e.properties = entity.properties,
              e.alternateNames = entity.alternateNames,
              e.lastVerified = entity.lastVerified,
              e.createdAt = entity.createdAt,
              e.updatedAt = entity.updatedAt
            ON MATCH SET
              e.type = entity.type,
              e.name = entity.name,
              e.content = entity.content,
              e.description = entity.description,
              e.confidence = entity.confidence,
              e.confidenceLevel = entity.confidenceLevel,
              e.source = entity.source,
              e.properties = entity.properties,
              e.alternateNames = entity.alternateNames,
              e.lastVerified = entity.lastVerified,
              e.updatedAt = entity.updatedAt
            MERGE (e)-[:BELONGS_TO]->(g)
            RETURN count(e) as addedEntities
            `,
            params
          )
        );

        addedCount += result.records[0].get('addedEntities').toNumber();
      }

      return addedCount;
    } finally {
      await session.close();
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
    const session: Session = this.driver.session({ database: this.database });
    try {
      let addedCount = 0;

      // Process relationships in batches of 100
      const batchSize = 100;
      for (let i = 0; i < relationships.length; i += batchSize) {
        const batch = relationships.slice(i, i + batchSize);

        const params = {
          graphId,
          relationships: batch.map(rel => ({
            id: rel.id || uuidv4(),
            type: rel.type,
            sourceId: rel.sourceId,
            targetId: rel.targetId,
            name: rel.name || '',
            weight: rel.weight || 0,
            confidence: rel.confidence,
            confidenceLevel: rel.confidenceLevel,
            source: JSON.stringify(rel.source),
            bidirectional: rel.bidirectional || false,
            properties: JSON.stringify(rel.properties || {}),
            lastVerified: rel.lastVerified?.toISOString() || null,
            createdAt: rel.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: rel.updatedAt?.toISOString() || new Date().toISOString()
          }))
        };

        const result = await session.executeWrite((tx: any) =>
          tx.run(
            `
            MATCH (g:KnowledgeGraph {id: $graphId})
            UNWIND $relationships as rel
            MATCH (source:Entity {id: rel.sourceId})-[:BELONGS_TO]->(g)
            MATCH (target:Entity {id: rel.targetId})-[:BELONGS_TO]->(g)
            MERGE (r:Relationship {id: rel.id})
            ON CREATE SET
              r.type = rel.type,
              r.name = rel.name,
              r.weight = rel.weight,
              r.confidence = rel.confidence,
              r.confidenceLevel = rel.confidenceLevel,
              r.source = rel.source,
              r.bidirectional = rel.bidirectional,
              r.properties = rel.properties,
              r.lastVerified = rel.lastVerified,
              r.createdAt = rel.createdAt,
              r.updatedAt = rel.updatedAt
            ON MATCH SET
              r.type = rel.type,
              r.name = rel.name,
              r.weight = rel.weight,
              r.confidence = rel.confidence,
              r.confidenceLevel = rel.confidenceLevel,
              r.source = rel.source,
              r.bidirectional = rel.bidirectional,
              r.properties = rel.properties,
              r.lastVerified = rel.lastVerified,
              r.updatedAt = rel.updatedAt
            MERGE (r)-[:FROM]->(source)
            MERGE (r)-[:TO]->(target)
            RETURN count(r) as addedRelationships
            `,
            params
          )
        );

        addedCount += result.records[0].get('addedRelationships').toNumber();
      }

      return addedCount;
    } finally {
      await session.close();
    }
  }

  /**
   * Extracts knowledge from text using LLM
   *
   * @param params - Knowledge extraction parameters
   * @returns Extracted entities and relationships
   */
  async extractKnowledge(params: KnowledgeExtractionParams): Promise<KnowledgeExtractionResult> {
    const startTime = Date.now();

    // Define the default entity and relationship types to extract
    const entityTypes = params.entityTypes || Object.values(EntityType);
    const relationshipTypes = params.relationshipTypes || Object.values(RelationshipType);

    // Define the source as a document provided through extraction
    const sourceId = uuidv4();
    const source = {
      id: sourceId,
      type: KnowledgeSourceType.DOCUMENT,
      name: 'Extracted Knowledge',
      description: 'Knowledge extracted from text',
      createdAt: new Date(),
      metadata: {
        text: params.includeSourceText ? params.text : 'Text not included',
        extractionTime: new Date().toISOString()
      }
    };

    // Construct a prompt for the LLM
    const prompt = this.buildExtractionPrompt(params.text, entityTypes, relationshipTypes, params.minConfidence || 0.5);

    try {
      // Use OpenAI to extract knowledge
      /* eslint-disable @typescript-eslint/no-explicit-any */
      // @ts-ignore
      const completion = await (this.openai.chat.completions.create as any)({
        model: params.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a knowledge extraction assistant that identifies entities and relationships from text. Output only JSON without explanations.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */

      // Parse the extraction result
      const content = completion.choices?.[0]?.message?.content || '{}';
      const extractionResult = JSON.parse(content) as {
        entities: Array<{
          id?: string;
          type: string;
          name: string;
          description?: string;
          confidence: number;
          alternateNames?: string[];
        }>;
        relationships: Array<{
          id?: string;
          type: string;
          source: string;
          target: string;
          description?: string;
          confidence: number;
          bidirectional?: boolean;
        }>;
      };

      // Convert extracted data to KnowledgeEntity and KnowledgeRelationship formats
      const entities: KnowledgeEntity[] = extractionResult.entities.map(entity => {
        // Map confidence value to confidence level
        let confidenceLevel = ConfidenceLevel.MEDIUM;
        if (entity.confidence >= 0.8) confidenceLevel = ConfidenceLevel.HIGH;
        else if (entity.confidence <= 0.4) confidenceLevel = ConfidenceLevel.LOW;

        return {
          id: entity.id || uuidv4(),
          type: entity.type as EntityType,
          name: entity.name,
          description: entity.description || '',
          confidence: entity.confidence,
          confidenceLevel,
          source,
          properties: {},
          alternateNames: entity.alternateNames || [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      // Create a map of entity names to IDs
      const entityMap = new Map<string, string>();
      entities.forEach(entity => {
        entityMap.set(entity.name.toLowerCase(), entity.id || '');
        if (entity.alternateNames) {
          entity.alternateNames.forEach(name => {
            entityMap.set(name.toLowerCase(), entity.id || '');
          });
        }
      });

      // Convert relationship data
      const relationships: KnowledgeRelationship[] = [];
      for (const rel of extractionResult.relationships) {
        // Find entity IDs by name (case-insensitive)
        const sourceId = entityMap.get(rel.source.toLowerCase());
        const targetId = entityMap.get(rel.target.toLowerCase());

        // Skip if source or target entity not found
        if (!sourceId || !targetId) continue;

        // Map confidence to confidence level
        let confidenceLevel = ConfidenceLevel.MEDIUM;
        if (rel.confidence >= 0.8) confidenceLevel = ConfidenceLevel.HIGH;
        else if (rel.confidence <= 0.4) confidenceLevel = ConfidenceLevel.LOW;

        relationships.push({
          id: rel.id || uuidv4(),
          type: rel.type as RelationshipType,
          sourceId,
          targetId,
          name: rel.description || '',
          confidence: rel.confidence,
          confidenceLevel,
          source,
          bidirectional: rel.bidirectional || false,
          properties: {},
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // If an existing graph ID is provided, add the entities and relationships to it
      if (params.existingGraphId) {
        await this.addEntitiesToKnowledgeGraph(params.existingGraphId, entities);
        await this.addRelationshipsToKnowledgeGraph(params.existingGraphId, relationships);
      }

      return {
        entities,
        relationships,
        sourceId,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Error extracting knowledge:', error);
      throw new Error(`Knowledge extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Builds a prompt for the LLM to extract knowledge
   */
  private buildExtractionPrompt(text: string, entityTypes: string[], relationshipTypes: string[], minConfidence: number): string {
    return `
Extract entities and relationships from the following text. 
Only include entities and relationships with confidence >= ${minConfidence}.

Entity types to extract: ${entityTypes.join(', ')}
Relationship types to extract: ${relationshipTypes.join(', ')}

For each entity, include:
- id (optional)
- type (one of the entity types above)
- name (required)
- description (optional)
- confidence (a decimal between 0-1)
- alternateNames (optional array of strings)

For each relationship, include:
- id (optional)
- type (one of the relationship types above)
- source (the name of the source entity)
- target (the name of the target entity)
- description (optional)
- confidence (a decimal between 0-1)
- bidirectional (optional boolean, default false)

Text to analyze:
"""
${text}
"""

Return the results as a JSON object with the format:
{
  "entities": [
    {
      "type": "PERSON",
      "name": "John Doe",
      "description": "CEO of Example Corp",
      "confidence": 0.95,
      "alternateNames": ["J. Doe", "Johnny"]
    }
  ],
  "relationships": [
    {
      "type": "WORKS_AT",
      "source": "John Doe",
      "target": "Example Corp",
      "description": "Chief Executive Officer",
      "confidence": 0.9,
      "bidirectional": false
    }
  ]
}`;
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
    const session: Session = this.driver.session({ database: this.database });
    try {
      let cypherQuery: string;
      let processedQuery: string | undefined;

      // If the query is already a Cypher query, use it directly
      if (params.query.toUpperCase().includes('MATCH') && params.query.includes('RETURN')) {
        cypherQuery = params.query;
      } else {
        // Convert natural language to Cypher using GPT
        processedQuery = await this.naturalLanguageToCypher(
          params.query,
          params.graphId,
          params.entityTypes,
          params.relationshipTypes,
          params.maxHops,
          params.includeInferred
        );
        cypherQuery = processedQuery;
      }

      // Add confidence filter if specified
      if (params.minConfidence && params.minConfidence > 0) {
        // Only add if not already present in the query
        if (!cypherQuery.includes('confidence >=')) {
          cypherQuery = cypherQuery.replace(/MATCH/i, `MATCH (e:Entity) WHERE e.confidence >= ${params.minConfidence} WITH e MATCH`);
        }
      }

      // Add limit if specified and not already present
      if (params.limit && !cypherQuery.includes('LIMIT')) {
        cypherQuery = `${cypherQuery} LIMIT ${params.limit}`;
      }

      // Execute the Cypher query
      const result = await session.executeRead(tx => tx.run(cypherQuery, {}));

      // Process the results
      const entities = new Map<string, KnowledgeEntity>();
      const relationships = new Map<string, KnowledgeRelationship>();

      // Extract entities and relationships from the result
      result.records.forEach(record => {
        record.keys.forEach(key => {
          const value = record.get(key);

          if (!value) return;

          // Handle entity nodes
          if (value.labels && value.labels.includes('Entity')) {
            const props = value.properties;
            if (!entities.has(props.id)) {
              entities.set(props.id, {
                id: props.id,
                type: props.type as EntityType,
                name: props.name,
                content: props.content || '',
                description: props.description || '',
                confidence: parseFloat(props.confidence) || 0,
                confidenceLevel: (props.confidenceLevel as ConfidenceLevel) || ConfidenceLevel.MEDIUM,
                source: typeof props.source === 'string' ? JSON.parse(props.source) : props.source,
                properties: typeof props.properties === 'string' ? JSON.parse(props.properties) : props.properties || {},
                alternateNames: typeof props.alternateNames === 'string' ? JSON.parse(props.alternateNames) : props.alternateNames || [],
                lastVerified: props.lastVerified ? new Date(props.lastVerified) : undefined,
                createdAt: new Date(props.createdAt),
                updatedAt: new Date(props.updatedAt)
              });
            }
          }

          // Handle relationship data
          if (value.labels && value.labels.includes('Relationship')) {
            const props = value.properties;
            if (!relationships.has(props.id)) {
              relationships.set(props.id, {
                id: props.id,
                type: props.type as RelationshipType,
                sourceId: props.sourceId, // This may need to be retrieved separately
                targetId: props.targetId, // This may need to be retrieved separately
                name: props.name || '',
                weight: parseFloat(props.weight) || 0,
                confidence: parseFloat(props.confidence) || 0,
                confidenceLevel: (props.confidenceLevel as ConfidenceLevel) || ConfidenceLevel.MEDIUM,
                source: typeof props.source === 'string' ? JSON.parse(props.source) : props.source,
                bidirectional: props.bidirectional === 'true' || props.bidirectional === true,
                properties: typeof props.properties === 'string' ? JSON.parse(props.properties) : props.properties || {},
                lastVerified: props.lastVerified ? new Date(props.lastVerified) : undefined,
                createdAt: new Date(props.createdAt),
                updatedAt: new Date(props.updatedAt)
              });
            }
          }
        });
      });

      return {
        entities: Array.from(entities.values()),
        relationships: Array.from(relationships.values()),
        query: params.query,
        processedQuery
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Converts natural language query to Cypher query using LLM
   */
  private async naturalLanguageToCypher(
    query: string,
    graphId?: string,
    entityTypes?: EntityType[],
    relationshipTypes?: RelationshipType[],
    maxHops?: number,
    includeInferred?: boolean
  ): Promise<string> {
    // Enhance the query with additional context
    let enhancedQuery = query;

    if (graphId) {
      enhancedQuery += ` (Filter to knowledge graph with ID: ${graphId})`;
    }

    if (entityTypes && entityTypes.length > 0) {
      enhancedQuery += ` (Consider only entity types: ${entityTypes.join(', ')})`;
    }

    if (relationshipTypes && relationshipTypes.length > 0) {
      enhancedQuery += ` (Consider only relationship types: ${relationshipTypes.join(', ')})`;
    }

    if (maxHops) {
      enhancedQuery += ` (Limit traversal to ${maxHops} hops)`;
    }

    if (includeInferred !== undefined) {
      if (includeInferred) {
        enhancedQuery += ' (Include inferred relationships)';
      } else {
        enhancedQuery += ' (Exclude inferred relationships)';
      }
    }

    // Create model prompt
    const prompt = `
Convert the following natural language query to a Neo4j Cypher query for a knowledge graph.

The knowledge graph has the following structure:
- Nodes with label 'Entity' representing entities (PERSON, ORGANIZATION, etc.)
- Relationships connecting entities
- Entity properties: id, type, name, description, confidence, source
- Relationship properties: id, type, name, confidence, bidirectional

Natural language query:
"${enhancedQuery}"

Return only the Cypher query without any explanation or additional text.
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a Cypher query specialist for Neo4j knowledge graphs. Convert natural language questions to accurate Cypher queries.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      });

      const cypherQuery = completion.choices[0].message.content?.trim() || '';

      // Apply additional constraints based on graphId if not handled by the model
      if (graphId && !cypherQuery.includes(graphId)) {
        if (cypherQuery.toUpperCase().includes('MATCH')) {
          return cypherQuery.replace(
            /MATCH/i,
            `MATCH (g:KnowledgeGraph {id: "${graphId}"})
             MATCH (e:Entity)-[:BELONGS_TO]->(g)
             WITH e MATCH`
          );
        }
        return `MATCH (g:KnowledgeGraph {id: "${graphId}"})
                 MATCH (e:Entity)-[:BELONGS_TO]->(g)
                 ${cypherQuery}`;
      }

      return cypherQuery;
    } catch (error) {
      console.error('Error converting natural language to Cypher:', error);
      throw new Error(`Query conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Close the Neo4j driver connection
   */
  async close(): Promise<void> {
    await this.driver.close();
  }
}
