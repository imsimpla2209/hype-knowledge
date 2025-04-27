# Retrieve Module

## Purpose

The Retrieve module implements hybrid Retrieval Augmented Generation (RAG) capabilities, combining vector search (Qdrant) with graph traversal (Neo4j) to provide context-aware, high-quality retrieval for AI applications.

## Features

- Hybrid retrieval using both vector similarity and graph relationships
- Configurable retrieval strategies (vector-only, graph-only, hybrid)
- Query rewriting for improved retrieval accuracy
- Metadata filtering and result reranking
- Caching of retrieval results for performance

## Dependencies

- LangChain.js: Core orchestration for RAG
- Qdrant: Vector database for similarity search
- Neo4j: Graph database for relationship-based retrieval
- Redis: Optional caching of retrieval results

## API Endpoints

- `POST /api/retrieve`: Main retrieval endpoint, supports all strategies
- `POST /api/retrieve/vector`: Vector-only retrieval
- `POST /api/retrieve/graph`: Graph-only retrieval
- `GET /api/retrieve/health`: Health check endpoint
- `GET /api/retrieve/embedding-models`: Get available embedding models

## Configuration

The module requires the following environment variables:

- `QDRANT_URL`: URL for Qdrant vector database
- `QDRANT_API_KEY`: API key for Qdrant (if applicable)
- `NEO4J_URI`: URI for Neo4j graph database
- `NEO4J_USERNAME`: Username for Neo4j authentication
- `NEO4J_PASSWORD`: Password for Neo4j authentication
- `OPENAI_API_KEY`: API key for OpenAI services
- `GEMINI_API_KEY`: API key for Gemini model (optional)
- `REDIS_URL`: URL for Redis cache (optional)
- `RETRIEVE_CACHE_TTL`: TTL for cached retrieval results in seconds (optional)
- `MAX_DOCUMENTS`: Maximum number of documents to retrieve (default: 5)

## Usage

The retrieve module exposes a service interface that can be used by other modules:

```typescript
import { retrieveService, RetrievalStrategy, EmbeddingModel } from '../retrieve';

// Hybrid retrieval (using both vector and graph)
const results = await retrieveService.retrieve({
  query: "What's the capital of France?",
  strategy: RetrievalStrategy.HYBRID,
  filters: { category: 'geography' },
  limit: 5,
  embeddingModel: EmbeddingModel.OPENAI_TEXT_3_SMALL, // Specify embedding model
  similarityMetric: 'cosine', // Similarity metric for vector search
});

// Vector-only retrieval with custom embedding model
const vectorResults = await retrieveService.retrieve({
  query: 'Tell me about machine learning',
  strategy: RetrievalStrategy.VECTOR,
  embeddingModel: EmbeddingModel.OPENAI_TEXT_3_LARGE,
  similarityThreshold: 0.8,
});

// Graph-only retrieval
const graphResults = await retrieveService.retrieve({
  query: 'Who founded Microsoft?',
  strategy: RetrievalStrategy.GRAPH,
  maxHops: 3,
  nodeLabels: ['Person', 'Company'],
  relationshipTypes: ['FOUNDED', 'WORKED_AT'],
});
```

## Design Decisions

1. Separation of retrieval strategies (vector, graph, hybrid) for flexibility
2. Use of LangChain's retriever interfaces for consistency
3. Caching layer to improve performance for repeated queries
4. Metadata filtering to support more targeted retrieval
5. Multiple embedding models for different use cases
6. Query rewriting for improved semantic search
7. Deduplication of results from different retrieval methods

## Examples

See the unit tests for usage examples and expected behaviors.

## Example API Request

```json
// POST /api/retrieve
{
  "query": "How does photosynthesis work?",
  "strategy": "hybrid",
  "filters": {
    "domain": "biology",
    "confidence": "high"
  },
  "limit": 10,
  "rewriteQuery": true,
  "embeddingModel": "OPENAI_TEXT_3_SMALL",
  "similarityMetric": "cosine",
  "vectorWeight": 0.7,
  "mergeStrategy": "weighted"
}
```

## Available Embedding Models

The module supports multiple embedding models with different characteristics:

| Model ID            | Dimensions | Provider | Features                              |
| ------------------- | ---------- | -------- | ------------------------------------- |
| OPENAI_TEXT         | 1536       | OpenAI   | Legacy model (text-embedding-ada-002) |
| OPENAI_TEXT_3_SMALL | 1536       | OpenAI   | Improved efficiency, default model    |
| OPENAI_TEXT_3_LARGE | 3072       | OpenAI   | Highest quality, larger dimensions    |

To get all available models with their configurations, use the `/api/retrieve/embedding-models` endpoint.
