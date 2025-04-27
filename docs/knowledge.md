# Knowledge Graph Documentation

This document provides a comprehensive guide to the Knowledge Graph capabilities of the Hype Knowledge API, enabling you to create, query, and leverage semantic networks of information.

## Overview

The Knowledge Graph module transforms your unstructured content into an interconnected network of entities and relationships, enabling:

- **Entity Extraction** - Automatically identify people, organizations, concepts, locations, and other entities
- **Relationship Discovery** - Uncover how entities relate to each other
- **Semantic Navigation** - Move between related concepts and information
- **Context Preservation** - Maintain the contextual relevance of information
- **Knowledge Enrichment** - Enhance existing knowledge with automatically inferred connections

Unlike traditional vector search, the Knowledge Graph preserves explicit relationships between concepts, allowing for precise traversal and exploration of your content's semantic structure.

## Key Concepts

### Entities

Entities are the nodes in your knowledge graph - distinct objects, concepts, or things mentioned in your content.

| Entity Type | Description | Examples |
|-------------|-------------|----------|
| PERSON | Individual humans | "John Smith", "Marie Curie" |
| ORGANIZATION | Companies, agencies, institutions | "Microsoft", "United Nations" |
| LOCATION | Physical places | "New York", "Mount Everest" |
| DATE | Temporal references | "January 2023", "Q3 2024" |
| EVENT | Happenings or occurrences | "World Cup 2022", "Annual Conference" |
| PRODUCT | Items, services, or offerings | "iPhone 15", "Premium Plan" |
| TECHNOLOGY | Technical concepts or tools | "Machine Learning", "React Framework" |
| TOPIC | Subject areas or domains | "Quantum Physics", "Digital Marketing" |
| CONCEPT | Abstract ideas | "Democracy", "Sustainability" |
| METRIC | Measurements or indicators | "Revenue Growth", "Customer Satisfaction" |

### Relationships

Relationships are the connections between entities, representing how they interact or relate to each other.

| Relationship Type | Description | Example |
|-------------------|-------------|---------|
| MENTIONS | Simple co-occurrence | "Document mentions Microsoft" |
| WORKS_FOR | Employment or affiliation | "John Smith works for Microsoft" |
| LOCATED_IN | Physical containment | "Microsoft headquarters located in Redmond" |
| PART_OF | Compositional relationship | "Windows is part of Microsoft's product lineup" |
| CREATED_BY | Authorship or origin | "PowerPoint created by Microsoft" |
| REPORTS_TO | Hierarchical relationship | "Regional Manager reports to VP of Sales" |
| COLLABORATED_WITH | Joint work or partnership | "Microsoft collaborated with OpenAI" |
| HAPPENED_AT | Event location | "Conference happened at Seattle Convention Center" |
| HAPPENED_ON | Event timing | "Product launch happened on March 15, 2023" |
| RELATED_TO | General association | "Blockchain related to cryptocurrency" |
| DEFINES | Definitional relationship | "Document defines machine learning process" |
| LEADS | Directional influence | "Marketing campaign leads to revenue growth" |

### Knowledge Graph Structure

Your knowledge graph is composed of:

- **Nodes**: Entity instances with unique identifiers
- **Edges**: Directional relationships between nodes with types and properties
- **Properties**: Additional information attached to nodes and edges
- **Context**: Source information connecting nodes and edges to original content

## Knowledge Graph API

### Create or Update Entities

Add new entities or update existing ones in your knowledge graph.

**Endpoint:** `POST /api/knowledge/entities`

**Request:**
```json
{
  "entities": [
    {
      "name": "OpenAI",
      "type": "ORGANIZATION",
      "properties": {
        "industry": "Artificial Intelligence",
        "founded": "2015",
        "location": "San Francisco"
      },
      "aliases": ["OpenAI Inc.", "OpenAI LP"],
      "externalIds": {
        "wikidata": "Q54864656",
        "crunchbase": "openai"
      }
    },
    {
      "name": "GPT-4",
      "type": "PRODUCT",
      "properties": {
        "category": "Large Language Model",
        "releaseDate": "2023-03-14",
        "developer": "OpenAI"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "created": 1,
  "updated": 1,
  "entities": [
    {
      "id": "ent-a1b2c3d4",
      "name": "OpenAI",
      "type": "ORGANIZATION",
      "properties": {
        "industry": "Artificial Intelligence",
        "founded": "2015",
        "location": "San Francisco"
      },
      "aliases": ["OpenAI Inc.", "OpenAI LP"],
      "externalIds": {
        "wikidata": "Q54864656",
        "crunchbase": "openai"
      },
      "createdAt": "2023-07-12T15:23:42Z",
      "updatedAt": "2023-07-12T15:23:42Z"
    },
    {
      "id": "ent-e5f6g7h8",
      "name": "GPT-4",
      "type": "PRODUCT",
      "properties": {
        "category": "Large Language Model",
        "releaseDate": "2023-03-14",
        "developer": "OpenAI"
      },
      "createdAt": "2023-06-10T09:15:22Z",
      "updatedAt": "2023-07-12T15:23:42Z"
    }
  ]
}
```

### Get Entity Details

Retrieve detailed information about a specific entity.

**Endpoint:** `GET /api/knowledge/entities/{entityId}`

**Response:**
```json
{
  "id": "ent-a1b2c3d4",
  "name": "OpenAI",
  "type": "ORGANIZATION",
  "properties": {
    "industry": "Artificial Intelligence",
    "founded": "2015",
    "location": "San Francisco"
  },
  "aliases": ["OpenAI Inc.", "OpenAI LP"],
  "externalIds": {
    "wikidata": "Q54864656",
    "crunchbase": "openai"
  },
  "createdAt": "2023-07-12T15:23:42Z",
  "updatedAt": "2023-07-12T15:23:42Z",
  "mentionCount": 142,
  "documentCount": 28,
  "relationshipCounts": {
    "CREATED_BY": 0,
    "CREATED": 15,
    "COLLABORATED_WITH": 8,
    "LOCATED_IN": 1,
    "MENTIONS": 112
  },
  "firstMentionedAt": "2023-03-15T12:45:22Z",
  "lastMentionedAt": "2023-07-10T08:12:33Z"
}
```

### Search Entities

Search for entities based on various criteria.

**Endpoint:** `GET /api/knowledge/entities/search`

**Query Parameters:**
- `q`: Search term (name, alias, or property)
- `type`: Filter by entity type
- `limit`: Maximum number of results (default: 20)
- `offset`: Pagination offset
- `sort`: Field to sort by (default: relevance)
- `properties`: Filter by property values (JSON)

**Example Request:**
```http
GET /api/knowledge/entities/search?q=ai&type=ORGANIZATION&limit=5&properties={"founded":"2015"} HTTP/1.1
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "entities": [
    {
      "id": "ent-a1b2c3d4",
      "name": "OpenAI",
      "type": "ORGANIZATION",
      "properties": {
        "industry": "Artificial Intelligence",
        "founded": "2015",
        "location": "San Francisco"
      },
      "relevanceScore": 0.89,
      "mentionCount": 142
    },
    {
      "id": "ent-i9j0k1l2",
      "name": "Anthropic AI",
      "type": "ORGANIZATION",
      "properties": {
        "industry": "Artificial Intelligence",
        "founded": "2015",
        "location": "San Francisco"
      },
      "relevanceScore": 0.76,
      "mentionCount": 87
    }
  ],
  "total": 2,
  "limit": 5,
  "offset": 0
}
```

### Create Relationships

Add relationships between entities in your knowledge graph.

**Endpoint:** `POST /api/knowledge/relationships`

**Request:**
```json
{
  "relationships": [
    {
      "sourceEntityId": "ent-a1b2c3d4",
      "targetEntityId": "ent-e5f6g7h8",
      "type": "CREATED",
      "properties": {
        "confidence": 0.95,
        "date": "2023-03-14"
      }
    },
    {
      "sourceEntityId": "ent-a1b2c3d4",
      "targetEntityId": "ent-m3n4o5p6",
      "type": "COLLABORATED_WITH",
      "properties": {
        "projectName": "ChatGPT Development",
        "startDate": "2022-01",
        "endDate": "2023-03"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "created": 2,
  "updated": 0,
  "relationships": [
    {
      "id": "rel-q7r8s9t0",
      "sourceEntityId": "ent-a1b2c3d4",
      "sourceEntityName": "OpenAI",
      "targetEntityId": "ent-e5f6g7h8",
      "targetEntityName": "GPT-4",
      "type": "CREATED",
      "properties": {
        "confidence": 0.95,
        "date": "2023-03-14"
      },
      "createdAt": "2023-07-12T15:30:12Z"
    },
    {
      "id": "rel-u1v2w3x4",
      "sourceEntityId": "ent-a1b2c3d4",
      "sourceEntityName": "OpenAI",
      "targetEntityId": "ent-m3n4o5p6",
      "targetEntityName": "Microsoft",
      "type": "COLLABORATED_WITH",
      "properties": {
        "projectName": "ChatGPT Development",
        "startDate": "2022-01",
        "endDate": "2023-03"
      },
      "createdAt": "2023-07-12T15:30:12Z"
    }
  ]
}
```

### Get Entity Relationships

Retrieve relationships for a specific entity.

**Endpoint:** `GET /api/knowledge/entities/{entityId}/relationships`

**Query Parameters:**
- `types`: Filter by relationship types (comma-separated)
- `direction`: Filter by relationship direction (`outgoing`, `incoming`, or `both`)
- `limit`: Maximum number of results (default: 20)
- `offset`: Pagination offset

**Example Request:**
```http
GET /api/knowledge/entities/ent-a1b2c3d4/relationships?types=CREATED,COLLABORATED_WITH&direction=outgoing&limit=10 HTTP/1.1
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "relationships": [
    {
      "id": "rel-q7r8s9t0",
      "sourceEntityId": "ent-a1b2c3d4",
      "sourceEntityName": "OpenAI",
      "targetEntityId": "ent-e5f6g7h8",
      "targetEntityName": "GPT-4",
      "type": "CREATED",
      "properties": {
        "confidence": 0.95,
        "date": "2023-03-14"
      },
      "createdAt": "2023-07-12T15:30:12Z",
      "mentionCount": 15
    },
    {
      "id": "rel-u1v2w3x4",
      "sourceEntityId": "ent-a1b2c3d4",
      "sourceEntityName": "OpenAI",
      "targetEntityId": "ent-m3n4o5p6",
      "targetEntityName": "Microsoft",
      "type": "COLLABORATED_WITH",
      "properties": {
        "projectName": "ChatGPT Development",
        "startDate": "2022-01",
        "endDate": "2023-03"
      },
      "createdAt": "2023-07-12T15:30:12Z",
      "mentionCount": 8
    }
  ],
  "total": 2,
  "limit": 10,
  "offset": 0
}
```

### Graph Traversal

Navigate through your knowledge graph by following relationships.

**Endpoint:** `POST /api/knowledge/traverse`

**Request:**
```json
{
  "startingEntityId": "ent-a1b2c3d4",
  "traversalPath": [
    {
      "relationshipType": "CREATED",
      "direction": "outgoing"
    },
    {
      "relationshipType": "MENTIONED_IN",
      "direction": "outgoing",
      "limit": 5
    }
  ],
  "options": {
    "includeProperties": true,
    "maxDepth": 2,
    "returnFormat": "detailed"
  }
}
```

**Response:**
```json
{
  "traversalResults": {
    "startingEntity": {
      "id": "ent-a1b2c3d4",
      "name": "OpenAI",
      "type": "ORGANIZATION"
    },
    "paths": [
      {
        "nodes": [
          {
            "id": "ent-a1b2c3d4",
            "name": "OpenAI",
            "type": "ORGANIZATION"
          },
          {
            "id": "ent-e5f6g7h8",
            "name": "GPT-4",
            "type": "PRODUCT"
          },
          {
            "id": "doc-y5z6a7b8",
            "name": "Technical Whitepaper: GPT-4 Architecture",
            "type": "DOCUMENT"
          }
        ],
        "edges": [
          {
            "id": "rel-q7r8s9t0",
            "type": "CREATED",
            "sourceId": "ent-a1b2c3d4",
            "targetId": "ent-e5f6g7h8",
            "properties": {
              "confidence": 0.95,
              "date": "2023-03-14"
            }
          },
          {
            "id": "rel-c9d0e1f2",
            "type": "MENTIONED_IN",
            "sourceId": "ent-e5f6g7h8",
            "targetId": "doc-y5z6a7b8",
            "properties": {
              "mentionCount": 45,
              "relevanceScore": 0.92
            }
          }
        ]
      },
      // Additional paths...
    ],
    "totalPaths": 12,
    "limitedPaths": 5
  }
}
```

### Knowledge Graph Queries

Run complex queries to explore relationships and patterns in your knowledge graph.

**Endpoint:** `POST /api/knowledge/query`

**Request:**
```json
{
  "query": "MATCH (org:ORGANIZATION)-[:CREATED]->(product:PRODUCT)-[:MENTIONED_IN]->(doc:DOCUMENT) WHERE org.name = 'OpenAI' RETURN org, product, doc LIMIT 5",
  "parameters": {
    "orgName": "OpenAI"
  },
  "options": {
    "returnFormat": "graph",
    "includeProperties": true
  }
}
```

**Response:**
```json
{
  "queryResults": {
    "format": "graph",
    "nodes": [
      {
        "id": "ent-a1b2c3d4",
        "name": "OpenAI",
        "type": "ORGANIZATION",
        "properties": {
          "industry": "Artificial Intelligence",
          "founded": "2015"
        }
      },
      {
        "id": "ent-e5f6g7h8",
        "name": "GPT-4",
        "type": "PRODUCT",
        "properties": {
          "category": "Large Language Model",
          "releaseDate": "2023-03-14"
        }
      },
      {
        "id": "doc-y5z6a7b8",
        "name": "Technical Whitepaper: GPT-4 Architecture",
        "type": "DOCUMENT",
        "properties": {
          "date": "2023-04-02",
          "format": "PDF"
        }
      }
      // Additional nodes...
    ],
    "edges": [
      {
        "id": "rel-q7r8s9t0",
        "type": "CREATED",
        "sourceId": "ent-a1b2c3d4",
        "targetId": "ent-e5f6g7h8",
        "properties": {
          "confidence": 0.95
        }
      },
      {
        "id": "rel-c9d0e1f2",
        "type": "MENTIONED_IN",
        "sourceId": "ent-e5f6g7h8",
        "targetId": "doc-y5z6a7b8",
        "properties": {
          "mentionCount": 45
        }
      }
      // Additional edges...
    ],
    "totalResults": 5
  }
}
```

### Entity Extraction

Extract entities from text without ingesting it as a document.

**Endpoint:** `POST /api/knowledge/extract-entities`

**Request:**
```json
{
  "text": "OpenAI released GPT-4 in March 2023, marking a significant advancement in large language models. Microsoft, an investor in OpenAI, quickly integrated GPT-4 into Bing Search and other products.",
  "options": {
    "entityTypes": ["ORGANIZATION", "PRODUCT", "DATE"],
    "minConfidence": 0.7,
    "includeRelationships": true,
    "addToGraph": false
  }
}
```

**Response:**
```json
{
  "entities": [
    {
      "name": "OpenAI",
      "type": "ORGANIZATION",
      "confidence": 0.97,
      "positions": [[0, 6]],
      "matches": ["OpenAI"]
    },
    {
      "name": "GPT-4",
      "type": "PRODUCT",
      "confidence": 0.95,
      "positions": [[15, 20], [86, 91]],
      "matches": ["GPT-4", "GPT-4"]
    },
    {
      "name": "March 2023",
      "type": "DATE",
      "confidence": 0.98,
      "positions": [[24, 34]],
      "matches": ["March 2023"]
    },
    {
      "name": "Microsoft",
      "type": "ORGANIZATION",
      "confidence": 0.96,
      "positions": [[93, 102]],
      "matches": ["Microsoft"]
    },
    {
      "name": "Bing Search",
      "type": "PRODUCT",
      "confidence": 0.88,
      "positions": [[146, 157]],
      "matches": ["Bing Search"]
    }
  ],
  "relationships": [
    {
      "sourceEntity": "OpenAI",
      "targetEntity": "GPT-4",
      "type": "CREATED",
      "confidence": 0.92
    },
    {
      "sourceEntity": "Microsoft",
      "targetEntity": "OpenAI",
      "type": "INVESTED_IN",
      "confidence": 0.85
    },
    {
      "sourceEntity": "Microsoft",
      "targetEntity": "GPT-4",
      "type": "INTEGRATED",
      "confidence": 0.90
    },
    {
      "sourceEntity": "Microsoft",
      "targetEntity": "Bing Search",
      "type": "OWNS",
      "confidence": 0.94
    }
  ]
}
```

### Visualize Knowledge Graph

Generate a visualization of a portion of your knowledge graph.

**Endpoint:** `POST /api/knowledge/visualize`

**Request:**
```json
{
  "centerEntityId": "ent-a1b2c3d4",
  "maxDepth": 2,
  "maxNodes": 50,
  "relationshipTypes": ["CREATED", "COLLABORATED_WITH", "PART_OF"],
  "includeProperties": ["industry", "founded", "category", "releaseDate"],
  "format": "d3"
}
```

**Response:**
```json
{
  "visualization": {
    "format": "d3",
    "data": {
      "nodes": [
        {
          "id": "ent-a1b2c3d4",
          "name": "OpenAI",
          "type": "ORGANIZATION",
          "properties": {
            "industry": "Artificial Intelligence",
            "founded": "2015"
          },
          "size": 30,
          "color": "#1f77b4"
        },
        // Additional nodes...
      ],
      "links": [
        {
          "source": "ent-a1b2c3d4",
          "target": "ent-e5f6g7h8",
          "type": "CREATED",
          "strength": 0.8
        },
        // Additional links...
      ]
    },
    "nodeCount": 23,
    "linkCount": 35,
    "depth": 2
  }
}
```

## Knowledge Graph Management

### Get Knowledge Graph Statistics

Retrieve statistics about your knowledge graph.

**Endpoint:** `GET /api/knowledge/stats`

**Response:**
```json
{
  "stats": {
    "entities": {
      "total": 12568,
      "byType": {
        "PERSON": 3215,
        "ORGANIZATION": 1458,
        "PRODUCT": 2789,
        "LOCATION": 845,
        "TECHNOLOGY": 1256,
        "CONCEPT": 1890,
        "DATE": 560,
        "EVENT": 345,
        "TOPIC": 210
      }
    },
    "relationships": {
      "total": 45678,
      "byType": {
        "MENTIONS": 25600,
        "WORKS_FOR": 2340,
        "CREATED": 1580,
        "PART_OF": 3250,
        "COLLABORATED_WITH": 940,
        "LOCATED_IN": 820,
        "RELATED_TO": 10300,
        "HAPPENED_ON": 520,
        "HAPPENED_AT": 328
      }
    },
    "growth": {
      "entitiesLast30Days": 1245,
      "relationshipsLast30Days": 5620
    },
    "density": 0.45,
    "averageConnections": 3.6
  }
}
```

### Export Knowledge Graph

Export your knowledge graph in various formats.

**Endpoint:** `POST /api/knowledge/export`

**Request:**
```json
{
  "format": "neo4j",
  "filters": {
    "entityTypes": ["ORGANIZATION", "PRODUCT", "PERSON"],
    "relationshipTypes": ["CREATED", "WORKS_FOR", "COLLABORATED_WITH"],
    "minConfidence": 0.8,
    "startDate": "2023-01-01",
    "endDate": "2023-07-31"
  },
  "options": {
    "includeProperties": true,
    "exportMethod": "url",
    "expiration": "24h"
  }
}
```

**Response:**
```json
{
  "success": true,
  "exportId": "exp-g1h2i3j4",
  "format": "neo4j",
  "stats": {
    "entities": 4580,
    "relationships": 12450,
    "fileSize": "8.5 MB"
  },
  "status": "generating",
  "estimatedCompletionTime": "2023-07-15T14:35:00Z",
  "downloadUrl": null,
  "expiresAt": null
}
```

### Clean Knowledge Graph

Remove low-quality or outdated entities and relationships.

**Endpoint:** `POST /api/knowledge/clean`

**Request:**
```json
{
  "criteria": {
    "confidenceThreshold": 0.6,
    "minimumMentions": 2,
    "lastUpdatedBefore": "2023-01-01",
    "orphanedEntities": true,
    "entityTypes": ["ALL"],
    "relationshipTypes": ["ALL"]
  },
  "options": {
    "dryRun": true,
    "generateReport": true
  }
}
```

**Response:**
```json
{
  "dryRun": true,
  "report": {
    "entitiesToRemove": 342,
    "relationshipsToRemove": 1256,
    "breakdownByEntityType": {
      "PERSON": 105,
      "ORGANIZATION": 67,
      "PRODUCT": 48,
      "LOCATION": 22,
      "CONCEPT": 100
    },
    "breakdownByRelationshipType": {
      "MENTIONS": 850,
      "WORKS_FOR": 125,
      "COLLABORATED_WITH": 80,
      "RELATED_TO": 201
    },
    "lowConfidenceCount": 946,
    "lowMentionCount": 325,
    "outdatedCount": 180,
    "orphanedCount": 147
  },
  "estimatedSpaceReclaimed": "2.3 MB",
  "estimatedCompletionTime": "5 minutes",
  "cleaningId": "clean-k5l6m7n8"
}
```

## Advanced Features

### Knowledge Graph Embeddings

Generate embeddings for entities to enable semantic similarity search.

**Endpoint:** `POST /api/knowledge/entities/embeddings`

**Request:**
```json
{
  "entityIds": ["ent-a1b2c3d4", "ent-e5f6g7h8", "ent-i9j0k1l2"],
  "embeddingModel": "default",
  "options": {
    "dimensions": 768,
    "includeProperties": true,
    "includeRelationships": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "embeddings": [
    {
      "entityId": "ent-a1b2c3d4",
      "name": "OpenAI",
      "type": "ORGANIZATION",
      "embedding": [0.023, 0.015, -0.032, ...],
      "dimensions": 768
    },
    {
      "entityId": "ent-e5f6g7h8",
      "name": "GPT-4",
      "type": "PRODUCT",
      "embedding": [0.041, -0.025, 0.018, ...],
      "dimensions": 768
    },
    {
      "entityId": "ent-i9j0k1l2",
      "name": "Anthropic AI",
      "type": "ORGANIZATION",
      "embedding": [0.028, 0.012, -0.037, ...],
      "dimensions": 768
    }
  ]
}
```

### Similar Entities

Find entities similar to a given entity based on embeddings or relationship patterns.

**Endpoint:** `GET /api/knowledge/entities/{entityId}/similar`

**Query Parameters:**
- `method`: Similarity method (`embedding` or `structural`)
- `limit`: Maximum number of results (default: 10)
- `minScore`: Minimum similarity score (0-1)

**Example Request:**
```http
GET /api/knowledge/entities/ent-a1b2c3d4/similar?method=embedding&limit=5&minScore=0.7 HTTP/1.1
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "similarEntities": [
    {
      "id": "ent-i9j0k1l2",
      "name": "Anthropic AI",
      "type": "ORGANIZATION",
      "similarityScore": 0.89,
      "commonRelationships": 5,
      "properties": {
        "industry": "Artificial Intelligence",
        "founded": "2021"
      }
    },
    {
      "id": "ent-o9p0q1r2",
      "name": "DeepMind",
      "type": "ORGANIZATION",
      "similarityScore": 0.82,
      "commonRelationships": 3,
      "properties": {
        "industry": "Artificial Intelligence",
        "founded": "2010"
      }
    },
    // Additional entities...
  ],
  "baseEntity": {
    "id": "ent-a1b2c3d4",
    "name": "OpenAI",
    "type": "ORGANIZATION"
  },
  "method": "embedding",
  "total": 5
}
```

### Knowledge Graph Completion

Predict and suggest potential new relationships in your knowledge graph.

**Endpoint:** `POST /api/knowledge/complete`

**Request:**
```json
{
  "entityId": "ent-a1b2c3d4",
  "relationshipTypes": ["COLLABORATED_WITH", "INVESTED_IN", "ACQUIRED"],
  "options": {
    "minConfidence": 0.7,
    "maxSuggestions": 10,
    "excludeExisting": true
  }
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "sourceEntityId": "ent-a1b2c3d4",
      "sourceEntityName": "OpenAI",
      "targetEntityId": "ent-s3t4u5v6",
      "targetEntityName": "Inflection AI",
      "relationshipType": "COLLABORATED_WITH",
      "confidence": 0.78,
      "evidence": [
        "Shared research publications",
        "Common board members",
        "Similar technology focus"
      ]
    },
    {
      "sourceEntityId": "ent-a1b2c3d4",
      "sourceEntityName": "OpenAI",
      "targetEntityId": "ent-w7x8y9z0",
      "targetEntityName": "Scale AI",
      "relationshipType": "INVESTED_IN",
      "confidence": 0.72,
      "evidence": [
        "Mentioned in funding announcements",
        "Strategic alignment",
        "Executive statements"
      ]
    },
    // Additional suggestions...
  ],
  "baseEntity": {
    "id": "ent-a1b2c3d4",
    "name": "OpenAI",
    "type": "ORGANIZATION"
  },
  "total": 8
}
```

## Entity Resolution

### Merge Entities

Combine duplicate entities while preserving relationships.

**Endpoint:** `POST /api/knowledge/entities/merge`

**Request:**
```json
{
  "entityIds": ["ent-a1b2c3d4", "ent-c5d6e7f8"],
  "survivingEntityId": "ent-a1b2c3d4",
  "options": {
    "mergeProperties": true,
    "mergeAliases": true,
    "resolveConflicts": "manual",
    "conflicts": {
      "founded": "2015"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "mergedEntityId": "ent-a1b2c3d4",
  "mergedEntity": {
    "id": "ent-a1b2c3d4",
    "name": "OpenAI",
    "type": "ORGANIZATION",
    "properties": {
      "industry": "Artificial Intelligence",
      "founded": "2015",
      "location": "San Francisco",
      "employees": "Over 500"
    },
    "aliases": ["OpenAI Inc.", "OpenAI LP", "OpenAI Corporation"],
    "relationshipsSummary": {
      "incoming": 28,
      "outgoing": 43
    },
    "removedEntityIds": ["ent-c5d6e7f8"]
  },
  "relationshipsUpdated": 15
}
```

### Find Duplicate Entities

Identify potential duplicate entities in your knowledge graph.

**Endpoint:** `POST /api/knowledge/entities/find-duplicates`

**Request:**
```json
{
  "criteria": {
    "nameSimilarityThreshold": 0.8,
    "requireSameType": true,
    "considerAliases": true,
    "considerProperties": ["founded", "location"],
    "entityTypes": ["ORGANIZATION", "PERSON", "PRODUCT"]
  },
  "options": {
    "limit": 100,
    "minConfidence": 0.75
  }
}
```

**Response:**
```json
{
  "duplicateSets": [
    {
      "entities": [
        {
          "id": "ent-a1b2c3d4",
          "name": "OpenAI",
          "type": "ORGANIZATION",
          "properties": {
            "founded": "2015",
            "location": "San Francisco"
          }
        },
        {
          "id": "ent-c5d6e7f8",
          "name": "OpenAI Inc.",
          "type": "ORGANIZATION",
          "properties": {
            "founded": "2015",
            "location": "San Francisco"
          }
        }
      ],
      "confidence": 0.95,
      "matchCriteria": ["name", "properties"],
      "suggestedSurvivor": "ent-a1b2c3d4"
    },
    // Additional duplicate sets...
  ],
  "total": 12,
  "limit": 100
}
```

## Integration with Retrieve API

The Knowledge Graph integrates seamlessly with the Retrieve API for powerful graph-based retrieval.

### Graph-Enhanced Retrieval

Use entity and relationship information to enhance document retrieval.

**Example Query:**
```json
{
  "query": "What AI products has OpenAI developed?",
  "strategy": "GRAPH",
  "graphOptions": {
    "targetEntityId": "ent-a1b2c3d4",
    "traversalPath": [
      {
        "relationshipType": "CREATED",
        "direction": "outgoing"
      },
      {
        "relationshipType": "MENTIONED_IN",
        "direction": "outgoing"
      }
    ],
    "maxHops": 2,
    "maxResults": 10
  }
}
```

See [Retrieve Documentation](retrieve.md) for more details on using the knowledge graph for document retrieval.

## Best Practices

### Entity Extraction

1. **Configure entity types** based on your domain:
   - Focus on the entity types most relevant to your content
   - Create custom entity types for domain-specific concepts
   - Use consistent entity type names across your knowledge base

2. **Set appropriate confidence thresholds**:
   - Higher thresholds (>0.8) for critical applications
   - Medium thresholds (0.6-0.8) for general use
   - Lower thresholds (0.4-0.6) when recall is more important than precision

3. **Enhance extracted entities**:
   - Add aliases for better entity resolution
   - Include external IDs for linking to standard knowledge bases
   - Periodically review and clean low-confidence entities

### Relationship Management

1. **Define meaningful relationship types**:
   - Use descriptive and specific relationship names
   - Document the semantics of each relationship type
   - Consider directionality carefully (e.g., CREATED_BY vs CREATED)

2. **Balance comprehensiveness and quality**:
   - Start with high-confidence relationships
   - Expand to more nuanced relationships over time
   - Regularly clean relationships with low confidence scores

3. **Manage relationship properties**:
   - Include temporal information when available
   - Add confidence scores for transparency
   - Use properties to capture relationship context

### Knowledge Graph Optimization

1. **Regular maintenance**:
   - Schedule periodic cleaning operations
   - Merge duplicate entities
   - Remove obsolete or low-quality nodes and edges

2. **Performance considerations**:
   - Limit traversal depth for complex queries
   - Use entity embeddings for similarity searches
   - Implement caching for frequently accessed entities

3. **Knowledge enrichment**:
   - Combine automatic extraction with manual curation
   - Use knowledge graph completion to identify missing relationships
   - Consider integrating with external knowledge bases

## Related Documentation

- [Ingest Documentation](ingest.md) - Learn how to add content that builds your knowledge graph
- [Retrieve Documentation](retrieve.md) - Use the knowledge graph for enhanced retrieval
- [Templates Documentation](templates.md) - Create structured responses using graph data 