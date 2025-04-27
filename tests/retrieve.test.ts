import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RetrieveService } from '../src/modules/retrieve/services/retrieve.service';
import { QdrantQueryAdapter } from '../src/modules/retrieve/queries/qdrant.query';
import { Neo4jQueryAdapter } from '../src/modules/retrieve/queries/neo4j.query';
import { RetrievalStrategy } from '../src/modules/retrieve/types/retrieve.types';

// Mock the database adapters
jest.mock('../src/modules/retrieve/queries/qdrant.query');
jest.mock('../src/modules/retrieve/queries/neo4j.query');
jest.mock('redis', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('RetrieveService', () => {
  let retrieveService: RetrieveService;
  let mockQdrantAdapter: jest.Mocked<QdrantQueryAdapter>;
  let mockNeo4jAdapter: jest.Mocked<Neo4jQueryAdapter>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up mock document results
    const mockVectorDocuments = [
      {
        pageContent: 'Vector document 1',
        metadata: { source: 'qdrant', score: 0.95 },
      },
      {
        pageContent: 'Vector document 2',
        metadata: { source: 'qdrant', score: 0.85 },
      },
    ];
    
    const mockGraphDocuments = [
      {
        pageContent: 'Graph document 1',
        metadata: { source: 'neo4j', resultIndex: 0 },
      },
      {
        pageContent: 'Graph document 2',
        metadata: { source: 'neo4j', resultIndex: 1 },
      },
    ];
    
    // Set up mock implementations
    (QdrantQueryAdapter as jest.Mock).mockImplementation(() => ({
      search: jest.fn().mockResolvedValue(mockVectorDocuments),
    }));
    
    (Neo4jQueryAdapter as jest.Mock).mockImplementation(() => ({
      search: jest.fn().mockResolvedValue(mockGraphDocuments),
    }));
    
    // Create service with mocked dependencies
    retrieveService = new RetrieveService();
    
    // Get mock instances to verify calls
    mockQdrantAdapter = (retrieveService as any).qdrantAdapter;
    mockNeo4jAdapter = (retrieveService as any).neo4jAdapter;
  });
  
  it('should perform vector-only retrieval when strategy is VECTOR', async () => {
    // Execute
    const result = await retrieveService.retrieve({
      query: 'test query',
      strategy: RetrievalStrategy.VECTOR,
    });
    
    // Verify
    expect(mockQdrantAdapter.search).toHaveBeenCalledTimes(1);
    expect(mockNeo4jAdapter.search).not.toHaveBeenCalled();
    expect(result.documents).toHaveLength(2);
    expect(result.fromCache).toBe(false);
    expect(result.queryUsed).toBe('test query');
  });
  
  it('should perform graph-only retrieval when strategy is GRAPH', async () => {
    // Execute
    const result = await retrieveService.retrieve({
      query: 'test query',
      strategy: RetrievalStrategy.GRAPH,
    });
    
    // Verify
    expect(mockQdrantAdapter.search).not.toHaveBeenCalled();
    expect(mockNeo4jAdapter.search).toHaveBeenCalledTimes(1);
    expect(result.documents).toHaveLength(2);
    expect(result.fromCache).toBe(false);
    expect(result.queryUsed).toBe('test query');
  });
  
  it('should perform hybrid retrieval when strategy is HYBRID', async () => {
    // Execute
    const result = await retrieveService.retrieve({
      query: 'test query',
      strategy: RetrievalStrategy.HYBRID,
      mergeStrategy: 'interleave',
    });
    
    // Verify
    expect(mockQdrantAdapter.search).toHaveBeenCalledTimes(1);
    expect(mockNeo4jAdapter.search).toHaveBeenCalledTimes(1);
    expect(result.documents).toHaveLength(4); // Combined documents
    expect(result.fromCache).toBe(false);
    expect(result.queryUsed).toBe('test query');
  });
  
  it('should apply filters to search queries', async () => {
    // Set up
    const filters = { source: 'documentation' };
    
    // Execute
    await retrieveService.retrieve({
      query: 'test query',
      strategy: RetrievalStrategy.VECTOR,
      filters,
    });
    
    // Verify
    expect(mockQdrantAdapter.search).toHaveBeenCalledWith(
      expect.objectContaining({
        filters,
      })
    );
  });
  
  it('should respect the limit parameter', async () => {
    // Execute
    await retrieveService.retrieve({
      query: 'test query',
      strategy: RetrievalStrategy.VECTOR,
      limit: 10,
    });
    
    // Verify
    expect(mockQdrantAdapter.search).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
      })
    );
  });
}); 