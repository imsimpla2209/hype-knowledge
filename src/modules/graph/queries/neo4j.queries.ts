/* eslint-disable no-await-in-loop */
import neo4j, { Driver, Session, Result } from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger';
import { config } from '../../../utils/config';
import { Entity, Relationship, Graph, GraphQueryParams, GraphQueryResult, Neo4jConfig } from '../types/graph.types';
import { ServiceUnavailableError } from '../../../utils/error';

/**
 * Neo4j graph database client for the graph module
 */
export class Neo4jClient {
  private driver: Driver | null = null;

  private isConnected = false;

  private config: Neo4jConfig;

  /**
   * Constructor initializes Neo4j client
   */
  constructor() {
    this.config = {
      uri: config.NEO4J_URI,
      username: config.NEO4J_USERNAME,
      password: config.NEO4J_PASSWORD,
      database: config.NEO4J_DATABASE || 'neo4j'
    };

    if (!this.config.uri) {
      throw new Error('Neo4j URI is not configured');
    }

    if (!this.config.username || !this.config.password) {
      throw new Error('Neo4j username or password not configured');
    }
  }

  /**
   * Connect to Neo4j database
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.driver) {
      return;
    }

    try {
      this.driver = neo4j.driver(this.config.uri, neo4j.auth.basic(this.config.username, this.config.password), {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000 // 2 minutes
      });

      // Verify connection
      await this.driver.verifyConnectivity();
      this.isConnected = true;
      logger.info('Connected to Neo4j graph database', { uri: this.config.uri });
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to Neo4j database', { error });
      throw new ServiceUnavailableError('Graph database is currently unavailable');
    }
  }

  /**
   * Close Neo4j connection
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.isConnected = false;
      logger.info('Closed Neo4j connection');
    }
  }

  /**
   * Get a session for running queries
   */
  private async getSession(): Promise<Session> {
    await this.connect();

    if (!this.driver) {
      throw new ServiceUnavailableError('Graph database connection not available');
    }

    return this.driver.session({
      database: this.config.database
    });
  }

  /**
   * Create graph with initial entities and relationships
   * @param graph Graph data to create
   * @returns Created graph ID
   */
  async createGraph(graph: Graph): Promise<string> {
    const session = await this.getSession();
    const graphId = graph.id || uuidv4();

    try {
      // Create graph node first
      await session.executeWrite(tx =>
        tx.run(
          `CREATE (g:Graph {
            id: $id, 
            name: $name, 
            description: $description, 
            metadata: $metadata,
            createdAt: datetime(),
            updatedAt: datetime()
          })`,
          {
            id: graphId,
            name: graph.name,
            description: graph.description || '',
            metadata: graph.metadata ? JSON.stringify(graph.metadata) : '{}'
          }
        )
      );

      // Add entities if provided
      if (graph.entities && graph.entities.length > 0) {
        await this.addEntitiesToGraph(graphId, graph.entities);
      }

      // Add relationships if provided
      if (graph.relationships && graph.relationships.length > 0) {
        await this.addRelationshipsToGraph(graphId, graph.relationships);
      }

      logger.info('Created graph', { graphId, name: graph.name });
      return graphId;
    } catch (error) {
      logger.error('Failed to create graph', { error, graphId });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get graph by ID
   * @param graphId Graph ID
   * @returns Graph data
   */
  async getGraph(graphId: string): Promise<Graph | null> {
    const session = await this.getSession();

    try {
      // Get graph node
      const graphResult = await session.executeRead(tx =>
        tx.run(
          `MATCH (g:Graph {id: $graphId})
           RETURN g`,
          { graphId }
        )
      );

      if (graphResult.records.length === 0) {
        return null;
      }

      const graphNode = graphResult.records[0].get('g').properties;

      // Get all entities in this graph
      const entitiesResult = await session.executeRead(tx =>
        tx.run(
          `MATCH (g:Graph {id: $graphId})-[:CONTAINS]->(e:Entity)
           RETURN e`,
          { graphId }
        )
      );

      const entities: Entity[] = entitiesResult.records.map(record => {
        const entity = record.get('e').properties;

        // Parse properties fields that were stored as JSON
        if (entity.properties && typeof entity.properties === 'string') {
          entity.properties = JSON.parse(entity.properties);
        }

        // Parse embedding if exists
        if (entity.embedding && typeof entity.embedding === 'string') {
          entity.embedding = JSON.parse(entity.embedding);
        }

        return entity as Entity;
      });

      // Get all relationships in this graph
      const relationshipsResult = await session.executeRead(tx =>
        tx.run(
          `MATCH (g:Graph {id: $graphId})-[:CONTAINS]->(r:Relationship)
           RETURN r`,
          { graphId }
        )
      );

      const relationships: Relationship[] = relationshipsResult.records.map(record => {
        const relationship = record.get('r').properties;

        // Parse properties fields that were stored as JSON
        if (relationship.properties && typeof relationship.properties === 'string') {
          relationship.properties = JSON.parse(relationship.properties);
        }

        return relationship as Relationship;
      });

      // Parse metadata if it's a string
      let { metadata } = graphNode;
      if (metadata && typeof metadata === 'string') {
        metadata = JSON.parse(metadata);
      }

      return {
        id: graphNode.id,
        name: graphNode.name,
        description: graphNode.description,
        entities,
        relationships,
        metadata,
        createdAt: new Date(graphNode.createdAt),
        updatedAt: new Date(graphNode.updatedAt)
      };
    } catch (error) {
      logger.error('Failed to get graph', { error, graphId });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Add entities to an existing graph
   * @param graphId Graph ID
   * @param entities Entities to add
   * @returns Added entity IDs
   */
  async addEntitiesToGraph(graphId: string, entities: Entity[]): Promise<string[]> {
    const session = await this.getSession();
    const entityIds: string[] = [];

    try {
      // Check if graph exists
      const graphExists = await this.graphExists(graphId);
      if (!graphExists) {
        throw new Error(`Graph with ID ${graphId} not found`);
      }

      // Add entities in batch
      for (const entity of entities) {
        const entityId = entity.id || uuidv4();
        entityIds.push(entityId);

        // Create entity and link to graph
        await session.executeWrite(tx =>
          tx.run(
            `MATCH (g:Graph {id: $graphId})
             CREATE (e:Entity {
               id: $entityId,
               type: $type,
               name: $name,
               content: $content,
               description: $description,
               confidence: $confidence,
               source: $source,
               properties: $properties,
               embedding: $embedding,
               createdAt: datetime(),
               updatedAt: datetime()
             })
             CREATE (g)-[:CONTAINS]->(e)
             // Create index for entity type
             CREATE (et:EntityType {type: $type})
             MERGE (e)-[:IS_TYPE]->(et)
             RETURN e.id`,
            {
              graphId,
              entityId,
              type: entity.type,
              name: entity.name,
              content: entity.content || '',
              description: entity.description || '',
              confidence: entity.confidence !== undefined ? entity.confidence : null,
              source: entity.source || '',
              properties: entity.properties ? JSON.stringify(entity.properties) : '{}',
              embedding: entity.embedding ? JSON.stringify(entity.embedding) : null
            }
          )
        );
      }

      logger.info('Added entities to graph', {
        graphId,
        count: entities.length,
        entityIds
      });

      return entityIds;
    } catch (error) {
      logger.error('Failed to add entities to graph', { error, graphId });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Add relationships to an existing graph
   * @param graphId Graph ID
   * @param relationships Relationships to add
   * @returns Added relationship IDs
   */
  async addRelationshipsToGraph(graphId: string, relationships: Relationship[]): Promise<string[]> {
    const session = await this.getSession();
    const relationshipIds: string[] = [];

    try {
      // Check if graph exists
      const graphExists = await this.graphExists(graphId);
      if (!graphExists) {
        throw new Error(`Graph with ID ${graphId} not found`);
      }

      // Add relationships in batch
      for (const relationship of relationships) {
        const relationshipId = relationship.id || uuidv4();
        relationshipIds.push(relationshipId);

        // Create relationship, link to graph, and connect entities
        await session.executeWrite(tx =>
          tx.run(
            `MATCH (g:Graph {id: $graphId})
             MATCH (source:Entity {id: $sourceId})
             MATCH (target:Entity {id: $targetId})
             CREATE (r:Relationship {
               id: $relationshipId,
               type: $type,
               sourceId: $sourceId,
               targetId: $targetId,
               name: $name,
               weight: $weight,
               confidence: $confidence,
               directed: $directed,
               source: $source,
               properties: $properties,
               createdAt: datetime(),
               updatedAt: datetime()
             })
             CREATE (g)-[:CONTAINS]->(r)
             CREATE (r)-[:FROM]->(source)
             CREATE (r)-[:TO]->(target)
             // Create index for relationship type
             CREATE (rt:RelationshipType {type: $type})
             MERGE (r)-[:IS_TYPE]->(rt)
             RETURN r.id`,
            {
              graphId,
              relationshipId,
              sourceId: relationship.sourceId,
              targetId: relationship.targetId,
              type: relationship.type,
              name: relationship.name || '',
              weight: relationship.weight !== undefined ? relationship.weight : null,
              confidence: relationship.confidence !== undefined ? relationship.confidence : null,
              directed: relationship.directed !== undefined ? relationship.directed : true,
              source: relationship.source || '',
              properties: relationship.properties ? JSON.stringify(relationship.properties) : '{}'
            }
          )
        );
      }

      logger.info('Added relationships to graph', {
        graphId,
        count: relationships.length,
        relationshipIds
      });

      return relationshipIds;
    } catch (error) {
      logger.error('Failed to add relationships to graph', { error, graphId });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Check if a graph exists
   * @param graphId Graph ID
   * @returns True if graph exists
   */
  async graphExists(graphId: string): Promise<boolean> {
    const session = await this.getSession();

    try {
      const result = await session.executeRead(tx => tx.run('MATCH (g:Graph {id: $graphId}) RETURN count(g) as count', { graphId }));

      return result.records[0].get('count').toNumber() > 0;
    } catch (error) {
      logger.error('Failed to check if graph exists', { error, graphId });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Check if entity exists
   * @param entityId Entity ID
   * @returns True if entity exists
   */
  async entityExists(entityId: string): Promise<boolean> {
    const session = await this.getSession();

    try {
      const result = await session.executeRead(tx => tx.run('MATCH (e:Entity {id: $entityId}) RETURN count(e) as count', { entityId }));

      return result.records[0].get('count').toNumber() > 0;
    } catch (error) {
      logger.error('Failed to check if entity exists', { error, entityId });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Query graph based on parameters
   * @param params Query parameters
   * @returns Query results
   */
  async queryGraph(params: GraphQueryParams): Promise<GraphQueryResult> {
    const session = await this.getSession();
    const startTime = Date.now();

    try {
      let query = '';
      const queryParams: Record<string, any> = {};

      // Build the Cypher query based on params
      if (params.queryString) {
        // Use custom query string if provided
        query = params.queryString;
      } else {
        // Build query from params
        let matchClause = 'MATCH (e:Entity)';
        const whereConditions: string[] = [];

        // Filter by graph ID
        if (params.graphId) {
          matchClause = 'MATCH (g:Graph {id: $graphId})-[:CONTAINS]->(e:Entity)';
          queryParams.graphId = params.graphId;
        }

        // Filter by entity type
        if (params.entityType) {
          whereConditions.push('e.type = $entityType');
          queryParams.entityType = params.entityType;
        }

        // Filter by starting entity
        if (params.startEntityId) {
          matchClause = 'MATCH (start:Entity {id: $startEntityId}), (e:Entity)';
          whereConditions.push('start <> e');

          const maxHops = params.maxHops || 2;
          matchClause += `, path = (start)-[*1..${maxHops}]-(e)`;

          queryParams.startEntityId = params.startEntityId;
        }

        // Filter by property values
        if (params.properties && Object.keys(params.properties).length > 0) {
          for (const [key, value] of Object.entries(params.properties)) {
            const propKey = `prop_${key.replace(/[^a-zA-Z0-9]/g, '_')}`;

            if (typeof value === 'string') {
              whereConditions.push(`e.properties CONTAINS $${propKey}`);
            } else {
              // For non-string values, we need to check JSON
              whereConditions.push(`e.properties CONTAINS '"${key}":' + $${propKey}`);
            }

            queryParams[propKey] = String(value);
          }
        }

        // Filter by text search
        if (params.searchText) {
          whereConditions.push('(e.name CONTAINS $searchText OR e.content CONTAINS $searchText OR e.description CONTAINS $searchText)');
          queryParams.searchText = params.searchText;
        }

        // Build the complete query
        query = matchClause;

        if (whereConditions.length > 0) {
          query += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        // If filtering by relationship type
        if (params.relationshipType) {
          query = `
            MATCH (e:Entity)-[r]->(other:Entity)
            WHERE type(r) = $relationshipType
            ${whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : ''}
          `;
          queryParams.relationshipType = params.relationshipType;
        }

        // Add return clause with limit
        const limit = params.limit || 100;
        query += `
          RETURN DISTINCT e, 
          [(e)-[r]-(n) | [r, n]] as connections
          LIMIT ${limit}
        `;
      }

      // Execute the query
      const result = await session.executeRead(tx => tx.run(query, queryParams));

      // Process results
      const entities: Record<string, Entity> = {};
      const relationships: Record<string, Relationship> = {};

      result.records.forEach(record => {
        // Process main entity
        const entity = record.get('e').properties;

        // Parse JSON fields
        if (entity.properties && typeof entity.properties === 'string') {
          entity.properties = JSON.parse(entity.properties);
        }

        if (entity.embedding && typeof entity.embedding === 'string') {
          entity.embedding = JSON.parse(entity.embedding);
        }

        entities[entity.id] = entity as Entity;

        // Process connected entities and relationships
        const connections = record.get('connections');
        if (connections && Array.isArray(connections)) {
          connections.forEach((connection: any[]) => {
            if (connection && connection.length === 2) {
              const rel = connection[0];
              const connectedNode = connection[1];

              // Process relationship
              if (rel && rel.properties && rel.properties.id) {
                const relationship = rel.properties;

                // Parse JSON fields
                if (relationship.properties && typeof relationship.properties === 'string') {
                  relationship.properties = JSON.parse(relationship.properties);
                }

                relationships[relationship.id] = relationship as Relationship;
              }

              // Process connected entity
              if (connectedNode && connectedNode.properties && connectedNode.properties.id) {
                const connectedEntity = connectedNode.properties;

                // Parse JSON fields
                if (connectedEntity.properties && typeof connectedEntity.properties === 'string') {
                  connectedEntity.properties = JSON.parse(connectedEntity.properties);
                }

                if (connectedEntity.embedding && typeof connectedEntity.embedding === 'string') {
                  connectedEntity.embedding = JSON.parse(connectedEntity.embedding);
                }

                entities[connectedEntity.id] = connectedEntity as Entity;
              }
            }
          });
        }
      });

      const entitiesArray = Object.values(entities);
      const relationshipsArray = Object.values(relationships);

      logger.info('Queried graph', {
        entityCount: entitiesArray.length,
        relationshipCount: relationshipsArray.length,
        params
      });

      return {
        entities: entitiesArray,
        relationships: relationshipsArray,
        totalEntities: entitiesArray.length,
        totalRelationships: relationshipsArray.length,
        timeTaken: Date.now() - startTime,
        raw: result
      };
    } catch (error) {
      logger.error('Failed to query graph', { error, params });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete a graph and all its entities and relationships
   * @param graphId Graph ID
   * @returns True if successful
   */
  async deleteGraph(graphId: string): Promise<boolean> {
    const session = await this.getSession();

    try {
      // Delete the graph and all connected elements
      const result = await session.executeWrite(tx =>
        tx.run(
          `MATCH (g:Graph {id: $graphId})
           OPTIONAL MATCH (g)-[:CONTAINS]->(n)
           DETACH DELETE n, g`,
          { graphId }
        )
      );

      logger.info('Deleted graph', { graphId });
      return true;
    } catch (error) {
      logger.error('Failed to delete graph', { error, graphId });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get all graphs
   * @param limit Maximum number of graphs to return
   * @returns Array of graph metadata
   */
  async getAllGraphs(limit = 100): Promise<{ id: string; name: string; description?: string }[]> {
    const session = await this.getSession();

    try {
      const result = await session.executeRead(tx =>
        tx.run(
          `MATCH (g:Graph)
           RETURN g.id as id, g.name as name, g.description as description
           LIMIT $limit`,
          { limit }
        )
      );

      return result.records.map(record => ({
        id: record.get('id'),
        name: record.get('name'),
        description: record.get('description')
      }));
    } catch (error) {
      logger.error('Failed to get all graphs', { error });
      throw error;
    } finally {
      await session.close();
    }
  }
}

// Create singleton instance
export const neo4jClient = new Neo4jClient();
