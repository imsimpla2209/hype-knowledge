# API Reference

This document provides a comprehensive reference of all available API endpoints in the Hype Knowledge system.

## Base URL

All API requests should be made to:

```
https://your-api-hostname.com/api
```

Replace `your-api-hostname.com` with your actual API hostname.

## Authentication

Most endpoints require authentication. Include the JWT token in your request headers:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Error Handling

The API uses standard HTTP status codes:

- 200/201: Success
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Resource Not Found
- 429: Too Many Requests (rate limit exceeded)
- 500: Server Error

Error responses follow this format:

```json
{
  "success": false,
  "message": "Detailed error message"
}
```

## Rate Limiting

API requests are limited to 100 requests per minute per user. If exceeded, you'll receive a 429 status code.

## Content Types

The API accepts:
- `application/json` for request bodies
- `multipart/form-data` for file uploads

All responses are in `application/json` format.

## Endpoints

### Authentication

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST   | /auth/register | Register a new user |
| POST   | /auth/login | User login |
| POST   | /auth/refresh | Refresh access token |
| POST   | /auth/logout | User logout |

### Ingest

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST   | /ingest/upload | Upload a file |
| POST   | /ingest/upload/text | Upload text content |
| POST   | /ingest/upload/url | Upload from URL |
| POST   | /ingest/process | Process an uploaded document |
| GET    | /ingest/status/:id | Get document processing status |
| GET    | /ingest/document/:id | Get processed document |
| DELETE | /ingest/document/:id | Delete a document |

### Retrieve

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST   | /retrieve/vector | Vector-based search |
| POST   | /retrieve/graph | Graph-based search |
| POST   | /retrieve/hybrid | Hybrid search (vector + graph) |

### Templates

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST   | /templates | Create a new template |
| POST   | /templates/batch | Batch create templates |
| POST   | /templates/search | Search for templates |
| GET    | /templates/:id | Get template by ID |
| PUT    | /templates/:id | Update a template |
| DELETE | /templates/:id | Delete a template |

### Knowledge Graph

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST   | /knowledge/graph | Create a knowledge graph |
| GET    | /knowledge/graph/:id | Get a knowledge graph |
| POST   | /knowledge/extract | Extract knowledge from text |
| POST   | /knowledge/query | Query the knowledge graph |
| POST   | /knowledge/graph/:id/entities | Add entities to graph |
| POST   | /knowledge/graph/:id/relationships | Add relationships to graph |

## Detailed Endpoint Documentation

### Authentication API

#### Register a new user

```
POST /api/auth/register
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "User Name"
}
```

Response:
```json
{
  "success": true,
  "userId": "user-uuid",
  "message": "User registered successfully"
}
```

#### Login

```
POST /api/auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

Response:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

#### Refresh Token

```
POST /api/auth/refresh
```

Request body:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

#### Logout

```
POST /api/auth/logout
```

Response:
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

### Ingest API

#### Upload a File

```
POST /api/ingest/upload
Content-Type: multipart/form-data
```

Form parameters:
- `file`: The file to upload
- `metadata`: (optional) JSON string with metadata

Response:
```json
{
  "success": true,
  "documentId": "document-uuid",
  "message": "File uploaded successfully"
}
```

#### Upload Text Content

```
POST /api/ingest/upload/text
```

Request body:
```json
{
  "content": "Your text content here...",
  "filename": "document.txt",
  "metadata": {
    "source": "manual-input",
    "tags": ["notes"]
  }
}
```

Response:
```json
{
  "success": true,
  "documentId": "document-uuid",
  "message": "Text content uploaded successfully"
}
```

#### Upload from URL

```
POST /api/ingest/upload/url
```

Request body:
```json
{
  "url": "https://example.com/document.pdf",
  "metadata": {
    "source": "web",
    "tags": ["reference"]
  }
}
```

Response:
```json
{
  "success": true,
  "documentId": "document-uuid",
  "message": "URL content uploaded successfully"
}
```

#### Process a Document

```
POST /api/ingest/process
```

Request body:
```json
{
  "documentId": "document-uuid",
  "chunkSize": 1000,
  "chunkOverlap": 200,
  "useUnstructured": true,
  "includeMetadata": true,
  "parsingOptions": {
    "csvHasHeaders": true,
    "jsonDepth": 2,
    "splitByHeading": true
  }
}
```

Response:
```json
{
  "success": true,
  "documentId": "document-uuid",
  "totalChunks": 15,
  "message": "Document processed successfully"
}
```

#### Get Document Status

```
GET /api/ingest/status/document-uuid
```

Response:
```json
{
  "success": true,
  "documentId": "document-uuid",
  "status": "completed",
  "progress": 100,
  "totalChunks": 15,
  "uploadedAt": "2023-09-30T12:00:00Z",
  "completedAt": "2023-09-30T12:01:30Z"
}
```

#### Get Processed Document

```
GET /api/ingest/document/document-uuid
```

Response:
```json
{
  "success": true,
  "document": {
    "id": "document-uuid",
    "chunks": [
      {
        "content": "...",
        "metadata": {
          "position": 1
        }
      },
      /* more chunks */
    ],
    "totalChunks": 15,
    "metadata": {
      "filename": "example.txt",
      "mimeType": "text/plain",
      "documentType": "text",
      "source": "manual-upload",
      "tags": ["documentation"]
    },
    "processedAt": "2023-09-30T12:01:30Z"
  }
}
```

#### Delete a Document

```
DELETE /api/ingest/document/document-uuid
```

Response:
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### Retrieve API

#### Vector Search

```
POST /api/retrieve/vector
```

Request body:
```json
{
  "query": "How to implement user authentication?",
  "limit": 5,
  "collectionName": "documents",
  "embeddingModel": "OPENAI_TEXT_3_SMALL",
  "similarityThreshold": 0.7,
  "similarityMetric": "cosine",
  "filters": {
    "tags": ["documentation"]
  },
  "useCache": true
}
```

Response:
```json
{
  "success": true,
  "documents": [
    {
      "pageContent": "...",
      "metadata": {
        "source": "document-id-1",
        "score": 0.92,
        "retrievalMethod": "vector"
      }
    },
    /* more documents */
  ],
  "timeTaken": 123,
  "fromCache": false,
  "queryUsed": "How to implement user authentication?"
}
```

#### Graph Search

```
POST /api/retrieve/graph
```

Request body:
```json
{
  "query": "Find all entities related to user authentication",
  "limit": 10,
  "maxHops": 2,
  "nodeLabels": ["Person", "Concept"],
  "relationshipTypes": ["RELATED_TO", "IMPLEMENTS"],
  "useCache": true
}
```

Response:
```json
{
  "success": true,
  "documents": [
    {
      "pageContent": "...",
      "metadata": {
        "source": "neo4j",
        "retrievalMethod": "graph",
        "query": "Find all entities related to user authentication"
      }
    },
    /* more documents */
  ],
  "timeTaken": 234,
  "fromCache": false,
  "queryUsed": "Find all entities related to user authentication"
}
```

#### Hybrid Search

```
POST /api/retrieve/hybrid
```

Request body:
```json
{
  "query": "user authentication best practices",
  "limit": 10,
  "strategy": "HYBRID",
  "mergeStrategy": "weighted",
  "vectorWeight": 0.7,
  "collectionName": "documents",
  "embeddingModel": "OPENAI_TEXT_3_SMALL",
  "maxHops": 2,
  "filters": {
    "tags": ["security"]
  },
  "useCache": true,
  "rewriteQuery": true
}
```

Response:
```json
{
  "success": true,
  "documents": [
    {
      "pageContent": "...",
      "metadata": {
        "source": "document-id-1",
        "score": 0.92,
        "retrievalMethod": "hybrid"
      }
    },
    /* more documents */
  ],
  "timeTaken": 345,
  "fromCache": false,
  "queryUsed": "best practices for implementing user authentication and security"
}
```

### Templates API

#### Ingest a Template

```
POST /api/templates
```

Request body:
```json
{
  "name": "SchoolMate - Back To School",
  "type": ["holiday_page", "landing_page"],
  "category": ["landing_page"],
  "dateOfRelease": "6/2023",
  "industry": ["other"],
  "style": ["cheerful"],
  "collection": ["holiday_page"],
  "feature": ["content_list", "countdown_timer", "product_details"],
  "new": false,
  "json": "/templates/json/schoolmate-back-to-school.json",
  "flexJson": "/templates/json/schoolmate-back-to-school_wip.json",
  "html": "/templates/html/schoolmate-back-to-school.html",
  "id": "6da97e68-d8c9-4db3-b353-2f4c7761060f",
  "previewDesktop": {
    "src": "/templates/schoolmate-back-to-school_desktop.png",
    "height": 5888
  },
  "previewMobile": {
    "src": "/templates/schoolmate-back-to-school_mobile.png",
    "height": 8846
  }
}
```

Response:
```json
{
  "success": true,
  "templateId": "6da97e68-d8c9-4db3-b353-2f4c7761060f",
  "message": "Template ingested successfully"
}
```

#### Batch Ingest Templates

```
POST /api/templates/batch
```

Request body:
```json
{
  "templates": [
    {
      "name": "Template One",
      "type": ["landing_page"],
      "category": ["ecommerce"],
      "industry": ["retail"],
      "style": ["minimalist"],
      "collection": ["holiday_collection"],
      "feature": ["product_carousel", "testimonials"]
    },
    {
      "name": "Template Two",
      "type": ["homepage"],
      "category": ["portfolio"],
      "industry": ["creative"],
      "style": ["bold"],
      "collection": ["portfolio_collection"],
      "feature": ["image_gallery", "contact_form"]
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "templateIds": ["template-uuid-1", "template-uuid-2"],
  "count": 2,
  "message": "Templates ingested successfully"
}
```

#### Search Templates

```
POST /api/templates/search
```

Request body:
```json
{
  "query": "cheerful landing page with countdown",
  "type": ["landing_page"],
  "industry": ["education"],
  "feature": ["countdown_timer"],
  "limit": 5,
  "useCache": true
}
```

Response:
```json
{
  "success": true,
  "templates": [
    {
      "id": "6da97e68-d8c9-4db3-b353-2f4c7761060f",
      "name": "SchoolMate - Back To School",
      "type": ["holiday_page", "landing_page"],
      "category": ["landing_page"],
      "industry": ["other"],
      "style": ["cheerful"],
      "collection": ["holiday_page"],
      "feature": ["content_list", "countdown_timer", "product_details"],
      "metadata": {
        "score": 0.95,
        "retrievalMethod": "vector"
      }
    },
    /* more templates */
  ],
  "totalResults": 3,
  "query": "cheerful landing page with countdown",
  "timeTaken": 123,
  "fromCache": false
}
```

#### Get Template by ID

```
GET /api/templates/6da97e68-d8c9-4db3-b353-2f4c7761060f
```

Response:
```json
{
  "success": true,
  "template": {
    "id": "6da97e68-d8c9-4db3-b353-2f4c7761060f",
    "name": "SchoolMate - Back To School",
    "type": ["holiday_page", "landing_page"],
    "category": ["landing_page"],
    "dateOfRelease": "6/2023",
    "industry": ["other"],
    "style": ["cheerful"],
    "collection": ["holiday_page"],
    "feature": ["content_list", "countdown_timer", "product_details"],
    "new": false,
    "json": "/templates/json/schoolmate-back-to-school.json",
    "flexJson": "/templates/json/schoolmate-back-to-school_wip.json",
    "html": "/templates/html/schoolmate-back-to-school.html",
    "previewDesktop": {
      "src": "/templates/schoolmate-back-to-school_desktop.png",
      "height": 5888
    },
    "previewMobile": {
      "src": "/templates/schoolmate-back-to-school_mobile.png",
      "height": 8846
    }
  }
}
```

#### Update Template

```
PUT /api/templates/6da97e68-d8c9-4db3-b353-2f4c7761060f
```

Request body:
```json
{
  "name": "SchoolMate - Back To School",
  "type": ["holiday_page", "landing_page"],
  "category": ["landing_page"],
  "industry": ["education"],
  "style": ["cheerful", "vibrant"],
  "collection": ["holiday_page"],
  "feature": ["content_list", "countdown_timer", "product_details", "newsletter_signup"]
}
```

Response:
```json
{
  "success": true,
  "templateId": "6da97e68-d8c9-4db3-b353-2f4c7761060f",
  "message": "Template updated successfully"
}
```

#### Delete Template

```
DELETE /api/templates/6da97e68-d8c9-4db3-b353-2f4c7761060f
```

Response:
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

### Knowledge Graph API

#### Create Knowledge Graph

```
POST /api/knowledge/graph
```

Request body:
```json
{
  "name": "Security Concepts",
  "description": "Graph of security concepts and relationships",
  "metadata": {
    "domain": "cybersecurity",
    "version": "1.0"
  }
}
```

Response:
```json
{
  "success": true,
  "graphId": "graph-uuid",
  "message": "Knowledge graph created successfully"
}
```

#### Get Knowledge Graph

```
GET /api/knowledge/graph/graph-uuid
```

Response:
```json
{
  "success": true,
  "graph": {
    "id": "graph-uuid",
    "name": "Security Concepts",
    "description": "Graph of security concepts and relationships",
    "entities": [
      /* entities */
    ],
    "relationships": [
      /* relationships */
    ],
    "metadata": {
      "domain": "cybersecurity",
      "version": "1.0"
    },
    "createdAt": "2023-09-30T12:00:00Z",
    "updatedAt": "2023-09-30T12:00:00Z"
  }
}
```

#### Extract Knowledge from Text

```
POST /api/knowledge/extract
```

Request body:
```json
{
  "text": "User authentication involves verifying the identity of users accessing a system. Common methods include password authentication, two-factor authentication, and biometric verification.",
  "existingGraphId": "graph-uuid",
  "entityTypes": ["PERSON", "CONCEPT", "PRODUCT"],
  "relationshipTypes": ["RELATED_TO", "IMPLEMENTS", "USES"],
  "minConfidence": 0.6,
  "language": "en",
  "includeSourceText": true,
  "model": "gpt-4"
}
```

Response:
```json
{
  "success": true,
  "extractionResult": {
    "entities": [
      {
        "id": "entity-uuid-1",
        "type": "CONCEPT",
        "name": "User Authentication",
        "description": "Process of verifying user identity",
        "confidence": 0.95,
        "confidenceLevel": "HIGH"
      },
      /* more entities */
    ],
    "relationships": [
      {
        "id": "relationship-uuid-1",
        "type": "IMPLEMENTS",
        "sourceId": "entity-uuid-2",
        "targetId": "entity-uuid-1",
        "name": "Implements authentication",
        "confidence": 0.85,
        "confidenceLevel": "HIGH"
      },
      /* more relationships */
    ],
    "sourceId": "source-uuid",
    "processingTime": 1234
  },
  "message": "Knowledge extracted successfully"
}
```

#### Query Knowledge Graph

```
POST /api/knowledge/query
```

Request body:
```json
{
  "query": "What authentication methods are related to security?",
  "graphId": "graph-uuid",
  "entityTypes": ["CONCEPT", "PRODUCT"],
  "relationshipTypes": ["RELATED_TO", "IMPLEMENTS"],
  "minConfidence": 0.5,
  "maxHops": 3,
  "limit": 10,
  "includeInferred": true
}
```

Response:
```json
{
  "success": true,
  "entities": [
    /* matching entities */
  ],
  "relationships": [
    /* matching relationships */
  ],
  "query": "What authentication methods are related to security?",
  "processedQuery": "MATCH (e:Entity)-[:BELONGS_TO]->(g:KnowledgeGraph {id: 'graph-uuid'}) WHERE e.type IN ['CONCEPT', 'PRODUCT'] AND e.confidence >= 0.5 ..."
}
```

## Response Status Codes

The API uses the following HTTP status codes:

| Status Code | Description |
| ----------- | ----------- |
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Server Error - Internal server error | 