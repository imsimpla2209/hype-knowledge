import { Neo4jGraph } from 'langchain/graphs/neo4j_graph';
import { GraphCypherQAChain } from 'langchain/chains/graph_qa/cypher';
import { OpenAI } from 'langchain/llms/openai';
import { config } from '../../../utils/config';
import { Document, GraphRetrievalParams } from '../types/retrieve.types';

/**
 * Neo4jQueryAdapter is responsible for managing graph-based retrieval using Neo4j
 */
export class Neo4jQueryAdapter {
  private graph: Neo4jGraph;
  private model: OpenAI;

  /**
   * Creates a new instance of Neo4jQueryAdapter
   */
  constructor() {
    this.initializeGraph();
    this.model = new OpenAI({
      openAIApiKey: config.OPENAI_API_KEY,
      temperature: 0, // Use deterministic responses for retrieval
      modelName: 'gpt-3.5-turbo', // Can be configured from env vars
    });
  }

  /**
   * Initializes the Neo4j graph connection
   */
  private async initializeGraph(): Promise<void> {
    try {
      this.graph = await Neo4jGraph.initialize({
        url: config.NEO4J_URI,
        username: config.NEO4J_USERNAME,
        password: config.NEO4J_PASSWORD,
      });
    } catch (error) {
      console.error('Failed to initialize Neo4j graph:', error);
      throw new Error(`Neo4j initialization failed: ${error.message}`);
    }
  }

  /**
   * Performs a graph-based search using Neo4j
   * 
   * @param params - Graph retrieval parameters
   * @returns Promise with retrieved documents
   */
  async search(params: GraphRetrievalParams): Promise<Document[]> {
    const startTime = Date.now();
    
    try {
      const {
        query,
        limit = config.MAX_DOCUMENTS,
        maxHops = 2,
        relationshipTypes = [],
        nodeLabels = [],
      } = params;
      
      // Ensure graph is initialized
      if (!this.graph) {
        await this.initializeGraph();
      }
      
      // Refresh schema to ensure we have the latest metadata
      await this.graph.refreshSchema();
      
      // Create a chain for converting natural language to Cypher
      const chain = GraphCypherQAChain.fromLLM({
        llm: this.model,
        graph: this.graph,
        returnDirect: true, // Return raw results rather than natural language answer
      });
      
      // Add context to the query about hops, relationships, and node types
      const enhancedQuery = this.enhanceQuery(
        query,
        maxHops,
        relationshipTypes,
        nodeLabels,
        limit
      );
      
      // Execute the query
      const results = await chain.run(enhancedQuery);
      
      // Convert Neo4j results to Document format
      return this.convertToDocuments(results, query);
    } catch (error) {
      console.error('Error in Neo4j graph search:', error);
      throw new Error(`Graph search failed: ${error.message}`);
    } finally {
      console.debug(`Graph search completed in ${Date.now() - startTime}ms`);
    }
  }

  /**
   * Enhances the natural language query with additional context for the LLM
   */
  private enhanceQuery(
    query: string,
    maxHops: number,
    relationshipTypes: string[],
    nodeLabels: string[],
    limit: number
  ): string {
    let enhancedQuery = query;
    
    // Add context about graph traversal constraints
    if (maxHops > 0) {
      enhancedQuery += ` Limit traversal to at most ${maxHops} hops.`;
    }
    
    if (relationshipTypes.length > 0) {
      enhancedQuery += ` Only consider relationships of types: ${relationshipTypes.join(', ')}.`;
    }
    
    if (nodeLabels.length > 0) {
      enhancedQuery += ` Only consider nodes with labels: ${nodeLabels.join(', ')}.`;
    }
    
    enhancedQuery += ` Return at most ${limit} results.`;
    
    return enhancedQuery;
  }

  /**
   * Converts Neo4j results to Document format
   */
  private convertToDocuments(results: any[], originalQuery: string): Document[] {
    if (!results || !Array.isArray(results) || results.length === 0) {
      return [];
    }
    
    // Map Neo4j results to Document format
    // This implementation assumes the results are in a format that can be stringified
    return results.map((result, index) => {
      // Extract text content from the result - actual implementation depends on the result structure
      let pageContent = '';
      
      if (typeof result === 'string') {
        pageContent = result;
      } else if (result && typeof result === 'object') {
        // Handle object results - extract relevant text fields
        // This is a simplified example - real implementation would vary based on the graph structure
        const textFields = Object.entries(result)
          .filter(([key, value]) => typeof value === 'string')
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        
        pageContent = textFields || JSON.stringify(result);
      } else {
        pageContent = JSON.stringify(result);
      }
      
      return {
        pageContent,
        metadata: {
          source: 'neo4j',
          retrievalMethod: 'graph',
          query: originalQuery,
          resultIndex: index,
        },
      };
    });
  }
} 