# Retrieval Documentation

This document provides a comprehensive guide to the Retrieval capabilities of the Hype Knowledge API, enabling you to search, query, and extract relevant information from your knowledge base.

## Overview

The Retrieve module is the core search interface for your knowledge base, offering multiple retrieval strategies to find the most relevant content for any query:

- **Vector Search** - Semantic similarity-based retrieval using embeddings
- **Knowledge Graph** - Structured navigation through entity relationships
- **Hybrid Search** - Combination of vector and graph approaches for optimal results

Key capabilities include:

- Semantic understanding of complex queries
- Multi-stage retrieval pipelines
- Contextual relevance ranking
- Metadata and faceted filtering
- Caching for performance optimization
- Query rewriting and expansion
- Multi-modal content retrieval

## Retrieval Endpoints

### Basic Retrieval

Retrieve relevant documents based on a natural language query.

**Endpoint:** `POST /api/retrieve`

**Request:**
```json
{
  "query": "What are the benefits of knowledge graphs for semantic search?",
  "limit": 5,
  "strategy": "VECTOR",
  "filters": {
    "documentType": ["article", "whitepaper"],
    "date": {
      "after": "2022-01-01"
    }
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "doc-a1b2c3",
      "content": "Knowledge graphs enhance semantic search by preserving relationships between entities, enabling more contextual understanding than traditional vector-based approaches. While vector search excels at finding similar content based on embedding proximity, knowledge graphs maintain explicit connections that allow for precise traversal of related concepts...",
      "metadata": {
        "title": "Advances in Semantic Search Architecture",
        "documentType": "whitepaper",
        "author": "Dr. Sarah Chen",
        "date": "2023-04-15",
        "url": "https://example.com/papers/semantic-search-2023"
      },
      "score": 0.92,
      "highlights": [
        {
          "text": "<em>Knowledge graphs</em> enhance <em>semantic search</em> by preserving <em>relationships</em> between entities",
          "position": [0, 120]
        }
      ]
    },
    {
      "id": "doc-d4e5f6",
      "content": "Comparing vector search and knowledge graph approaches reveals complementary strengths. Vector search provides excellent semantic similarity matching, while knowledge graphs excel at relationship-aware retrieval. The benefits of knowledge graphs include explicit relationship modeling, reasoning capabilities, and context preservation...",
      "metadata": {
        "title": "Vector vs. Graph: Retrieval Approaches Compared",
        "documentType": "article",
        "author": "James Wilson",
        "date": "2022-11-30",
        "url": "https://example.com/articles/retrieval-comparison"
      },
      "score": 0.87,
      "highlights": [
        {
          "text": "The <em>benefits</em> of <em>knowledge graphs</em> include explicit relationship modeling, reasoning capabilities, and context preservation",
          "position": [150, 260]
        }
      ]
    },
    // Additional results...
  ],
  "totalResults": 24,
  "timeTaken": 128,
  "strategy": "VECTOR",
  "cached": false,
  "query": "What are the benefits of knowledge graphs for semantic search?"
}
```

### Vector Retrieval

Specialized endpoint for vector-based semantic search.

**Endpoint:** `POST /api/retrieve/vector`

**Request:**
```json
{
  "query": "machine learning best practices",
  "limit": 10,
  "topK": 20,
  "scoreThreshold": 0.75,
  "includeSimilarityScores": true,
  "modelId": "default",
  "filters": {
    "tags": ["AI", "Tutorials"],
    "category": "Technical"
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "doc-g7h8i9",
      "content": "Machine learning best practices include proper data preparation, feature engineering, model selection, hyperparameter tuning, and evaluation. Data preparation involves cleaning, normalization, and addressing missing values...",
      "metadata": {
        "title": "Machine Learning Best Practices Guide",
        "tags": ["AI", "Tutorials", "ML"],
        "category": "Technical",
        "author": "AI Research Team"
      },
      "score": 0.91,
      "vectorDistance": 0.09,
      "highlights": [
        {
          "text": "<em>Machine learning best practices</em> include proper data preparation, feature engineering, model selection",
          "position": [0, 100]
        }
      ]
    },
    // Additional results...
  ],
  "totalResults": 18,
  "timeTaken": 85,
  "strategy": "VECTOR",
  "cached": false,
  "embeddingModel": "text-embedding-3-large",
  "dimensions": 1536
}
```

### Graph Retrieval

Navigate and retrieve content through knowledge graph relationships.

**Endpoint:** `POST /api/retrieve/graph`

**Request:**
```json
{
  "query": "Projects led by the engineering team in Q1 2023",
  "entityFocus": {
    "name": "Engineering Team",
    "type": "ORGANIZATION"
  },
  "relationshipPath": [
    {
      "type": "LEADS", 
      "direction": "outgoing"
    },
    {
      "type": "HAPPENED_ON",
      "properties": {
        "date": {
          "after": "2023-01-01",
          "before": "2023-04-01"
        }
      }
    }
  ],
  "limit": 5,
  "includeEntityDetails": true
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "doc-j0k1l2",
      "content": "The Engineering Team successfully delivered the Cloud Infrastructure Migration project in February 2023, moving all production systems to the new cloud platform ahead of schedule and under budget...",
      "metadata": {
        "title": "Cloud Infrastructure Migration Project",
        "projectCode": "ENG-2023-01",
        "date": "2023-02-28",
        "status": "Completed"
      },
      "entityDetails": [
        {
          "id": "ent-m3n4o5",
          "name": "Engineering Team",
          "type": "ORGANIZATION"
        },
        {
          "id": "ent-p6q7r8",
          "name": "Cloud Infrastructure Migration",
          "type": "PROJECT"
        }
      ],
      "path": [
        {
          "source": "ent-m3n4o5",
          "target": "ent-p6q7r8",
          "type": "LEADS",
          "properties": {
            "role": "Primary Owner",
            "startDate": "2023-01-05"
          }
        },
        {
          "source": "ent-p6q7r8",
          "target": "2023-02-28",
          "type": "HAPPENED_ON"
        }
      ],
      "score": 0.94
    },
    // Additional results...
  ],
  "totalResults": 3,
  "timeTaken": 152,
  "strategy": "GRAPH",
  "cached": false
}
```

### Hybrid Retrieval

Combine vector and graph-based retrieval for optimal results.

**Endpoint:** `POST /api/retrieve/hybrid`

**Request:**
```json
{
  "query": "security vulnerabilities in cloud applications",
  "vectorWeight": 0.6,
  "graphWeight": 0.4,
  "limit": 5,
  "rewriteQuery": true,
  "graphOptions": {
    "entityTypes": ["VULNERABILITY", "TECHNOLOGY"],
    "relationshipTypes": ["AFFECTS", "MITIGATED_BY"],
    "maxHops": 2
  },
  "filters": {
    "docType": "security_advisory",
    "severity": ["high", "critical"]
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "doc-s9t0u1",
      "content": "A critical vulnerability (CVE-2023-1234) was discovered in AWS Lambda functions that could allow unauthorized access to cloud resources when misconfigured. This affects applications using Lambda with public endpoints and insufficient permission boundaries...",
      "metadata": {
        "title": "CVE-2023-1234: AWS Lambda Security Advisory",
        "docType": "security_advisory",
        "severity": "critical",
        "published": "2023-06-15",
        "cve": "CVE-2023-1234"
      },
      "vectorScore": 0.88,
      "graphScore": 0.95,
      "combinedScore": 0.91,
      "retrievalPath": {
        "vector": true,
        "graph": true,
        "entities": [
          "AWS Lambda", 
          "CVE-2023-1234",
          "Cloud Application Security"
        ]
      }
    },
    // Additional results...
  ],
  "totalResults": 12,
  "timeTaken": 187,
  "strategy": "HYBRID",
  "rewrittenQuery": "security vulnerabilities affecting cloud applications and services like AWS Lambda, Azure Functions, or Google Cloud Run",
  "cached": false
}
```

### Multi-Modal Retrieval

Retrieve content based on both text and image queries.

**Endpoint:** `POST /api/retrieve/multimodal`

**Request:**
```json
{
  "textQuery": "dashboard design with good data visualization",
  "imageUrl": "https://example.com/images/sample_dashboard.png",
  "textWeight": 0.7,
  "imageWeight": 0.3,
  "limit": 5,
  "filters": {
    "contentType": ["image", "document"],
    "category": "UX Design"
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "doc-v2w3x4",
      "content": "Effective dashboard design places critical information in the top-left quadrant following the F-pattern of visual scanning. This example uses a clear hierarchy, limited color palette, and appropriate chart types for each data visualization need...",
      "metadata": {
        "title": "Dashboard Design Principles",
        "contentType": "document",
        "category": "UX Design",
        "hasImages": true
      },
      "textMatchScore": 0.92,
      "imageMatchScore": 0.85,
      "combinedScore": 0.90,
      "imagePreview": "https://api.example.com/thumbnails/doc-v2w3x4/1",
      "highlights": [
        {
          "text": "Effective <em>dashboard design</em> places critical information in the top-left quadrant following the F-pattern of visual scanning",
          "position": [0, 120]
        },
        {
          "text": "appropriate chart types for each <em>data visualization</em> need",
          "position": [210, 260]
        }
      ]
    },
    // Additional results...
  ],
  "totalResults": 8,
  "timeTaken": 215,
  "strategy": "MULTIMODAL",
  "cached": false
}
```

### Context-Aware Retrieval

Retrieve content with awareness of previous interactions and context.

**Endpoint:** `POST /api/retrieve/contextual`

**Request:**
```json
{
  "query": "What are its key features?",
  "conversationId": "conv-y5z6a7",
  "limit": 3,
  "useHistory": true,
  "enhanceQuery": true
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "doc-b8c9d0",
      "content": "ChatGPT Enterprise offers several key features that distinguish it from the standard version: Advanced data security with enterprise-grade encryption, unlimited access to GPT-4 capabilities, longer context windows for processing extensive documents, customization options for specific company needs, and analytics dashboards for usage tracking...",
      "metadata": {
        "title": "ChatGPT Enterprise Features Overview",
        "product": "ChatGPT Enterprise",
        "documentType": "product_documentation"
      },
      "score": 0.89,
      "contextMatch": "high",
      "highlights": [
        {
          "text": "ChatGPT Enterprise offers several <em>key features</em> that distinguish it from the standard version",
          "position": [0, 85]
        }
      ]
    },
    // Additional results...
  ],
  "totalResults": 6,
  "timeTaken": 105,
  "strategy": "VECTOR",
  "contextualInfo": {
    "enhancedQuery": "What are the key features of ChatGPT Enterprise?",
    "previousQueries": [
      "Tell me about ChatGPT Enterprise",
      "When was it released?"
    ],
    "detectedTopic": "ChatGPT Enterprise product features"
  },
  "cached": false
}
```

## Retrieval Parameters

### Core Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `query` | string | The natural language query to search for | *Required* |
| `limit` | integer | Maximum number of results to return | 10 |
| `strategy` | string | Retrieval strategy: "VECTOR", "GRAPH", or "HYBRID" | "VECTOR" |
| `filters` | object | Metadata filters to apply to results | null |
| `useCache` | boolean | Whether to use cached results if available | true |
| `rewriteQuery` | boolean | Whether to rewrite the query for better retrieval | false |
| `includeSimilarityScores` | boolean | Whether to include similarity scores in response | false |
| `includeMetadata` | boolean | Whether to include document metadata in response | true |
| `includeHighlights` | boolean | Whether to include highlighted text snippets | true |

### Vector-Specific Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `modelId` | string | Embedding model to use for vector search | "default" |
| `topK` | integer | Number of candidates to retrieve before reranking | 100 |
| `scoreThreshold` | number | Minimum similarity score threshold (0-1) | 0.7 |
| `dimensions` | integer | Number of dimensions for vector embeddings | Model-dependent |
| `similarity` | string | Similarity metric: "cosine", "dotProduct", "euclidean" | "cosine" |

### Graph-Specific Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `entityFocus` | object | The entity to start graph traversal from | null |
| `relationshipPath` | array | Path of relationships to traverse | [] |
| `maxHops` | integer | Maximum number of relationship hops | 3 |
| `includeEntityDetails` | boolean | Whether to include entity details in response | false |
| `traversalStrategy` | string | Graph traversal strategy: "breadthFirst", "depthFirst" | "breadthFirst" |
| `minConfidence` | number | Minimum confidence score for entity relationships | 0.6 |

### Hybrid-Specific Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `vectorWeight` | number | Weight given to vector search (0-1) | 0.5 |
| `graphWeight` | number | Weight given to graph search (0-1) | 0.5 |
| `graphOptions` | object | Options for the graph portion of hybrid search | {} |
| `vectorOptions` | object | Options for the vector portion of hybrid search | {} |
| `mergingStrategy` | string | Strategy for merging results: "weighted", "reciprocal" | "weighted" |

### Multi-Modal Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `textQuery` | string | Text portion of a multi-modal query | *Required* |
| `imageUrl` | string | URL to an image for multi-modal search | null |
| `imageBase64` | string | Base64-encoded image for multi-modal search | null |
| `textWeight` | number | Weight given to text matching (0-1) | 0.5 |
| `imageWeight` | number | Weight given to image matching (0-1) | 0.5 |

### Context-Aware Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `conversationId` | string | ID of the conversation for context | null |
| `useHistory` | boolean | Whether to use conversation history | true |
| `historyWindow` | integer | Number of previous exchanges to consider | 5 |
| `enhanceQuery` | boolean | Whether to enhance ambiguous queries | true |
| `userContext` | object | Additional user context information | {} |

## Advanced Features

### Query Rewriting

Improve retrieval quality by automatically rewriting queries for better semantic matching.

**Endpoint:** `POST /api/retrieve/rewrite`

**Request:**
```json
{
  "query": "gpu usage ml",
  "purpose": "retrieval",
  "style": "expanded",
  "maxLength": 100
}
```

**Response:**
```json
{
  "original": "gpu usage ml",
  "rewritten": "GPU utilization and optimization for machine learning training and inference processes",
  "expansions": [
    "GPU performance in machine learning",
    "GPU memory management for ML models",
    "GPU efficiency in deep learning applications"
  ],
  "extractedKeywords": ["GPU", "usage", "machine learning", "optimization"],
  "timeTaken": 78
}
```

### Result Post-Processing

Apply additional processing to retrieval results.

**Endpoint:** `POST /api/retrieve/process`

**Request:**
```json
{
  "retrievalId": "ret-e1f2g3",
  "operations": [
    {
      "type": "deduplicate",
      "threshold": 0.85
    },
    {
      "type": "rerank",
      "model": "cross-encoder",
      "originalQuery": "climate change solutions"
    },
    {
      "type": "cluster",
      "numberOfClusters": 3
    }
  ]
}
```

**Response:**
```json
{
  "processedResults": {
    "original": 15,
    "afterDeduplication": 12,
    "afterReranking": 12,
    "final": 12
  },
  "clusters": [
    {
      "id": "cluster-1",
      "label": "Renewable Energy Solutions",
      "count": 5,
      "topDocuments": ["doc-h4i5j6", "doc-k7l8m9"]
    },
    {
      "id": "cluster-2",
      "label": "Policy and Governance",
      "count": 4,
      "topDocuments": ["doc-n0p1q2", "doc-r3s4t5"]
    },
    {
      "id": "cluster-3",
      "label": "Carbon Capture Technologies",
      "count": 3,
      "topDocuments": ["doc-u6v7w8", "doc-x9y0z1"]
    }
  ],
  "results": [
    // Reordered and processed results
  ],
  "timeTaken": 345
}
```

### Retrieval Analytics

Get insights on retrieval performance and usage.

**Endpoint:** `GET /api/retrieve/analytics`

**Query Parameters:**
- `period`: Time period (e.g., "day", "week", "month")
- `startDate`: Start date for analysis (YYYY-MM-DD)
- `endDate`: End date for analysis (YYYY-MM-DD)

**Response:**
```json
{
  "period": "month",
  "startDate": "2023-06-01",
  "endDate": "2023-06-30",
  "summary": {
    "totalQueries": 12458,
    "uniqueQueries": 9876,
    "averageQueryLength": 5.8,
    "averageResultsReturned": 7.3,
    "cacheHitRate": 0.42,
    "averageLatency": 145,
    "successRate": 0.997
  },
  "strategies": {
    "VECTOR": 8745,
    "GRAPH": 1256,
    "HYBRID": 2457
  },
  "popularQueries": [
    {
      "query": "customer onboarding process",
      "count": 87,
      "averageResults": 4.2
    },
    {
      "query": "quarterly financial reports",
      "count": 62,
      "averageResults": 3.8
    },
    {
      "query": "product roadmap 2023",
      "count": 49,
      "averageResults": 5.1
    }
  ],
  "topFilters": {
    "documentType": ["procedure", "report", "policy"],
    "department": ["sales", "marketing", "finance"],
    "date": ["current-quarter", "current-year"]
  },
  "performance": {
    "p50Latency": 120,
    "p95Latency": 350,
    "p99Latency": 780
  }
}
```

### Retrieval Feedback

Submit feedback on retrieval results for continuous improvement.

**Endpoint:** `POST /api/retrieve/feedback`

**Request:**
```json
{
  "retrievalId": "ret-e1f2g3",
  "queryId": "q-a2b3c4",
  "rating": 4,
  "relevantDocuments": ["doc-h4i5j6", "doc-k7l8m9"],
  "irrelevantDocuments": ["doc-n0p1q2"],
  "missingInformation": "Information about carbon offset verification standards was missing",
  "userComments": "Results were mostly good but one document was off-topic",
  "source": "chat-interface"
}
```

**Response:**
```json
{
  "success": true,
  "feedbackId": "fb-d5e6f7",
  "message": "Feedback received successfully. Thank you for helping us improve.",
  "applied": true,
  "impactedCache": true
}
```

## Integration Examples

### Web Application Integration

```javascript
// Retrieve information in a web application
async function searchKnowledgeBase(query, filters = {}) {
  const response = await fetch('https://api.example.com/api/retrieve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      query,
      limit: 5,
      strategy: 'HYBRID',
      filters,
      includeHighlights: true
    })
  });
  
  const data = await response.json();
  return data.results;
}

// Example usage
const searchResults = await searchKnowledgeBase('remote work policy', {
  documentType: 'policy',
  department: 'HR'
});

// Display results
searchResults.forEach(result => {
  console.log(`Title: ${result.metadata.title}`);
  console.log(`Relevance: ${result.score}`);
  console.log(`Highlight: ${result.highlights[0]?.text}`);
  console.log('---');
});
```

### Node.js Server Integration

```javascript
const axios = require('axios');

class KnowledgeBaseClient {
  constructor(apiKey, baseUrl = 'https://api.example.com') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  
  async retrieve(options) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/retrieve`, options, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Retrieval error:', error.response?.data || error.message);
      throw error;
    }
  }
  
  async vectorSearch(query, limit = 10, filters = {}) {
    return this.retrieve({
      query,
      limit,
      strategy: 'VECTOR',
      filters
    });
  }
  
  async graphSearch(query, entityFocus, relationshipPath = [], limit = 10) {
    return this.retrieve({
      query,
      limit,
      strategy: 'GRAPH',
      entityFocus,
      relationshipPath
    });
  }
  
  async hybridSearch(query, limit = 10, vectorWeight = 0.6, graphWeight = 0.4) {
    return this.retrieve({
      query,
      limit,
      strategy: 'HYBRID',
      vectorWeight,
      graphWeight
    });
  }
}

// Example usage
const client = new KnowledgeBaseClient('your-api-key');

async function searchProductDocumentation() {
  const results = await client.vectorSearch(
    'how to configure SSO',
    5,
    { category: 'Authentication', productVersion: 'v2.x' }
  );
  
  return results;
}
```

### Python Integration

```python
import requests

class HypeKnowledgeClient:
    def __init__(self, api_key, base_url="https://api.example.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def retrieve(self, query, **kwargs):
        """
        Main retrieval method with flexible parameters
        """
        payload = {
            "query": query,
            **kwargs
        }
        
        response = requests.post(
            f"{self.base_url}/api/retrieve",
            json=payload,
            headers=self.headers
        )
        
        response.raise_for_status()
        return response.json()
    
    def contextual_search(self, query, conversation_id, use_history=True):
        """
        Search with conversation context
        """
        return self.retrieve(
            query=query,
            conversationId=conversation_id,
            useHistory=use_history,
            enhanceQuery=True
        )

# Example usage
client = HypeKnowledgeClient("your-api-key")

# Simple search
results = client.retrieve(
    query="quarterly financial projections",
    limit=3,
    filters={"department": "Finance", "year": "2023"},
    strategy="VECTOR"
)

# Contextual search
context_results = client.contextual_search(
    "What were the results?",
    conversation_id="conv-f8g9h0"
)

# Process results
for item in results["results"]:
    print(f"Document: {item['metadata'].get('title', 'Untitled')}")
    print(f"Relevance: {item['score']}")
    print(f"Content: {item['content'][:100]}...")
    print("---")
```

## Best Practices

### Query Optimization

1. **Be specific in queries**
   - Include important keywords and context
   - Use natural language questions rather than keyword fragments
   - Specify time frames, names, or other identifying information when relevant

2. **Leverage filters effectively**
   - Use metadata filters to narrow results to relevant subsets
   - Combine content queries with metadata constraints
   - Consider date ranges for time-sensitive information

3. **Choose the right strategy**
   - Use VECTOR for general semantic searching
   - Use GRAPH when relationship context is important
   - Use HYBRID for complex informational needs

### Performance Optimization

1. **Caching considerations**
   - Enable caching for frequently accessed information
   - Use cache invalidation for time-sensitive queries
   - Monitor cache hit ratios and adjust cache lifetime accordingly

2. **Result limits**
   - Request only as many results as needed
   - Use pagination for displaying large result sets
   - Consider chunking large retrievals into multiple requests

3. **Query rewriting**
   - Enable query rewriting for ambiguous or short queries
   - Use contextual retrieval for conversational interfaces
   - Implement feedback mechanisms to improve retrieval quality over time

### Security and Privacy

1. **API key management**
   - Use separate API keys for different applications or environments
   - Implement proper key rotation procedures
   - Never expose API keys in client-side code

2. **Content filtering**
   - Use filters to respect access permissions
   - Implement user-specific content restrictions
   - Consider implementing content policies for sensitive information

3. **Data usage**
   - Be transparent about how retrieval data may be used
   - Consider anonymizing sensitive queries
   - Implement privacy controls for personal information

## Troubleshooting

### Common Issues

1. **Poor relevance in results**
   - Check if the query is too vague or ambiguous
   - Try using more specific language or adding context
   - Experiment with different retrieval strategies
   - Consider using hybrid retrieval with adjusted weights

2. **Missing expected results**
   - Verify the content has been properly ingested
   - Check metadata filters that might be excluding content
   - Ensure document formats are supported
   - Try alternative phrasings of the query

3. **Performance problems**
   - Reduce the result limit or use pagination
   - Simplify complex filter conditions
   - Enable caching where appropriate
   - For graph queries, limit traversal depth

### Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `400` | Bad Request | Check request format and parameters |
| `401` | Unauthorized | Verify API key is valid and has sufficient permissions |
| `403` | Forbidden | Check access permissions for the requested content |
| `404` | Not Found | Verify endpoint URL and resource existence |
| `429` | Too Many Requests | Implement rate limiting or backoff strategies |
| `500` | Internal Server Error | Contact support with details of the failed request |
| `503` | Service Unavailable | Retry the request after a delay |

## Related Documentation

- [Ingest Documentation](ingest.md) - Learn how to add content to your knowledge base
- [Knowledge Graph Documentation](knowledge.md) - Understand graph-based retrieval options
- [Templates Documentation](templates.md) - Create structured responses using retrieved information 