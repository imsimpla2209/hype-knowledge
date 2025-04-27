# Ingest Documentation

This document details the Ingest functionality of the Hype Knowledge API, which serves as the gateway for adding and managing content in your knowledge base.

## Overview

The Ingest module enables you to upload, import, process, and manage all content in your knowledge base. It provides flexible options to:

- **Upload Documents**: Add files directly via API
- **Import Content**: Connect to external sources like URLs, databases, and APIs
- **Process Content**: Convert, chunk, extract entities, and create embeddings
- **Manage Metadata**: Attach and update structured information
- **Track Status**: Monitor ingestion progress and handle errors

Content added through the Ingest API is automatically processed, indexed, and made available for retrieval through the Retrieve API.

## Supported Content Types

The API supports a wide range of content types:

| Category | Supported Formats |
|----------|-------------------|
| Documents | PDF, DOCX, DOC, TXT, RTF, ODT, Pages |
| Spreadsheets | XLSX, XLS, CSV, ODS, Numbers |
| Presentations | PPTX, PPT, ODP, KEY |
| Images | PNG, JPG, JPEG, GIF, TIFF, WebP (with OCR) |
| Audio | MP3, WAV, M4A, FLAC (with transcription) |
| Video | MP4, MOV, AVI, MKV (with transcription) |
| Email | EML, MSG |
| Web Content | HTML, URLs, Websites |
| Code Files | JSON, XML, YAML, MD, code files (.py, .js, etc.) |
| Structured Data | JSON, CSV, XLS, XLSX |
| Databases | SQL dumps, database connections |

## Ingest Methods

### Direct File Upload

Upload individual files directly to the API.

**Endpoint:** `POST /api/ingest/upload`

**Request:**
```http
POST /api/ingest/upload HTTP/1.1
Content-Type: multipart/form-data
Authorization: Bearer YOUR_API_KEY

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="quarterly_report.pdf"
Content-Type: application/pdf

[Binary PDF data]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="options"
Content-Type: application/json

{
  "chunkSize": 1000,
  "chunkOverlap": 200,
  "skipEmbedding": false,
  "language": "en",
  "extractEntities": true
}
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="metadata"
Content-Type: application/json

{
  "title": "Quarterly Financial Report Q1 2023",
  "author": "Finance Department",
  "department": "Finance",
  "date": "2023-04-15",
  "confidentiality": "internal"
}
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc-a1b2c3d4",
  "status": "processing",
  "fileName": "quarterly_report.pdf",
  "contentType": "application/pdf",
  "fileSize": 2456789,
  "metadata": {
    "title": "Quarterly Financial Report Q1 2023",
    "author": "Finance Department",
    "department": "Finance",
    "date": "2023-04-15",
    "confidentiality": "internal"
  },
  "processingOptions": {
    "chunkSize": 1000,
    "chunkOverlap": 200,
    "skipEmbedding": false,
    "language": "en",
    "extractEntities": true
  },
  "estimatedProcessingTime": "30 seconds",
  "statusCheckUrl": "/api/ingest/status/doc-a1b2c3d4"
}
```

### Bulk File Upload

Upload multiple files in a single request.

**Endpoint:** `POST /api/ingest/bulk-upload`

**Request:**
```http
POST /api/ingest/bulk-upload HTTP/1.1
Content-Type: multipart/form-data
Authorization: Bearer YOUR_API_KEY

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="files[]"; filename="document1.pdf"
Content-Type: application/pdf

[Binary PDF data]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="files[]"; filename="document2.docx"
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document

[Binary DOCX data]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="options"
Content-Type: application/json

{
  "chunkSize": 1000,
  "chunkOverlap": 200,
  "skipEmbedding": false,
  "batchName": "Marketing Materials Q2"
}
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="metadata"
Content-Type: application/json

{
  "department": "Marketing",
  "quarter": "Q2",
  "year": "2023"
}
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

**Response:**
```json
{
  "success": true,
  "batchId": "batch-x1y2z3",
  "status": "processing",
  "filesSubmitted": 2,
  "filesAccepted": 2,
  "filesRejected": 0,
  "documents": [
    {
      "documentId": "doc-e5f6g7h8",
      "fileName": "document1.pdf",
      "status": "processing"
    },
    {
      "documentId": "doc-i9j0k1l2",
      "fileName": "document2.docx",
      "status": "processing"
    }
  ],
  "commonMetadata": {
    "department": "Marketing",
    "quarter": "Q2",
    "year": "2023"
  },
  "processingOptions": {
    "chunkSize": 1000,
    "chunkOverlap": 200,
    "skipEmbedding": false,
    "batchName": "Marketing Materials Q2"
  },
  "batchStatusUrl": "/api/ingest/batch/status/batch-x1y2z3"
}
```

### URL Ingestion

Import content directly from a web URL.

**Endpoint:** `POST /api/ingest/url`

**Request:**
```json
{
  "url": "https://www.example.com/blog/article-123",
  "options": {
    "includeImages": true,
    "maxPages": 1,
    "waitForSelector": ".article-content",
    "extractEntities": true
  },
  "metadata": {
    "source": "Company Blog",
    "category": "Technical"
  }
}
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc-m3n4o5p6",
  "status": "processing",
  "url": "https://www.example.com/blog/article-123",
  "detectedTitle": "10 Ways to Optimize Your Database Performance",
  "contentType": "text/html",
  "estimatedWordCount": 1250,
  "metadata": {
    "source": "Company Blog",
    "category": "Technical",
    "title": "10 Ways to Optimize Your Database Performance",
    "extractedDate": "2023-06-12T10:15:00Z"
  },
  "processingOptions": {
    "includeImages": true,
    "maxPages": 1,
    "waitForSelector": ".article-content",
    "extractEntities": true
  },
  "statusCheckUrl": "/api/ingest/status/doc-m3n4o5p6"
}
```

### Web Crawling

Crawl and import content from multiple pages starting from a root URL.

**Endpoint:** `POST /api/ingest/crawl`

**Request:**
```json
{
  "rootUrl": "https://docs.example.com/",
  "options": {
    "maxPages": 50,
    "maxDepth": 3,
    "includeUrlPattern": "docs\\.example\\.com\\/guide\\/.*",
    "excludeUrlPattern": "docs\\.example\\.com\\/guide\\/deprecated\\/.*",
    "waitForSelector": ".content",
    "respectRobotsTxt": true
  },
  "metadata": {
    "source": "Product Documentation",
    "version": "v2.1",
    "category": "Technical Documentation"
  }
}
```

**Response:**
```json
{
  "success": true,
  "batchId": "batch-q7r8s9",
  "status": "crawling",
  "rootUrl": "https://docs.example.com/",
  "estimatedPages": 35,
  "pagesFound": 12,
  "pagesProcessed": 0,
  "processingOptions": {
    "maxPages": 50,
    "maxDepth": 3,
    "includeUrlPattern": "docs\\.example\\.com\\/guide\\/.*",
    "excludeUrlPattern": "docs\\.example\\.com\\/guide\\/deprecated\\/.*",
    "waitForSelector": ".content",
    "respectRobotsTxt": true
  },
  "commonMetadata": {
    "source": "Product Documentation",
    "version": "v2.1",
    "category": "Technical Documentation"
  },
  "batchStatusUrl": "/api/ingest/batch/status/batch-q7r8s9"
}
```

### Database Connection

Import data directly from database tables or queries.

**Endpoint:** `POST /api/ingest/database`

**Request:**
```json
{
  "connection": {
    "type": "postgres",
    "host": "db.example.com",
    "port": 5432,
    "database": "customer_data",
    "username": "readonly_user",
    "password": "YOUR_DB_PASSWORD",
    "ssl": true
  },
  "query": "SELECT customer_id, name, email, subscription_plan, created_at, last_login FROM customers WHERE created_at > '2023-01-01'",
  "options": {
    "chunkStrategy": "row",
    "idColumn": "customer_id",
    "batchSize": 1000,
    "extractEntities": true
  },
  "metadata": {
    "source": "Customer Database",
    "dataCategory": "Customer Information",
    "sensitivity": "confidential",
    "department": "Customer Success"
  }
}
```

**Response:**
```json
{
  "success": true,
  "batchId": "batch-t1u2v3",
  "status": "processing",
  "connectionType": "postgres",
  "database": "customer_data",
  "rowsEstimated": 5230,
  "rowsProcessed": 0,
  "batchesCreated": 6,
  "processingOptions": {
    "chunkStrategy": "row",
    "idColumn": "customer_id",
    "batchSize": 1000,
    "extractEntities": true
  },
  "commonMetadata": {
    "source": "Customer Database",
    "dataCategory": "Customer Information",
    "sensitivity": "confidential",
    "department": "Customer Success"
  },
  "batchStatusUrl": "/api/ingest/batch/status/batch-t1u2v3"
}
```

### API Integration

Import data from external APIs and services.

**Endpoint:** `POST /api/ingest/api-source`

**Request:**
```json
{
  "source": {
    "type": "rest",
    "url": "https://api.example.com/products",
    "method": "GET",
    "headers": {
      "Authorization": "Bearer YOUR_EXTERNAL_API_KEY",
      "Content-Type": "application/json"
    },
    "queryParams": {
      "limit": 100,
      "status": "active"
    }
  },
  "options": {
    "resultPath": "data.items",
    "pagination": {
      "type": "offset",
      "limitParam": "limit",
      "offsetParam": "offset",
      "maxItems": 1000
    },
    "chunkStrategy": "item",
    "idField": "product_id"
  },
  "metadata": {
    "source": "Product API",
    "dataType": "Product Catalog",
    "lastUpdated": "2023-07-15"
  }
}
```

**Response:**
```json
{
  "success": true,
  "batchId": "batch-w4x5y6",
  "status": "processing",
  "sourceType": "rest",
  "apiUrl": "https://api.example.com/products",
  "itemsEstimated": 750,
  "itemsProcessed": 0,
  "apiCallsMade": 1,
  "processingOptions": {
    "resultPath": "data.items",
    "pagination": {
      "type": "offset",
      "limitParam": "limit",
      "offsetParam": "offset",
      "maxItems": 1000
    },
    "chunkStrategy": "item",
    "idField": "product_id"
  },
  "commonMetadata": {
    "source": "Product API",
    "dataType": "Product Catalog",
    "lastUpdated": "2023-07-15"
  },
  "batchStatusUrl": "/api/ingest/batch/status/batch-w4x5y6"
}
```

## Processing Options

### Chunking Strategies

Control how your documents are divided into manageable sections for processing and retrieval.

| Strategy | Description | Best For |
|----------|-------------|----------|
| `fixed` | Split text into chunks of fixed token length | General purpose documents |
| `paragraph` | Split on paragraph boundaries | Well-structured documents |
| `heading` | Split at heading elements | Documents with clear section headers |
| `semantic` | Use AI to split at semantic boundaries | Complex documents with varied structure |
| `record` | Treat each data record as a chunk | Structured data (CSV, database records) |
| `slide` | Treat each slide as a chunk | Presentations |
| `page` | Treat each page as a chunk | Short-form content like images |
| `custom` | Use custom delimiter patterns | Special document formats |

**Example Request:**
```json
{
  "options": {
    "chunkStrategy": "semantic",
    "chunkSize": 1000,
    "chunkOverlap": 100,
    "minChunkSize": 100
  }
}
```

### Embedding Options

Configure how vector embeddings are generated for your content.

| Option | Description | Default |
|--------|-------------|---------|
| `skipEmbedding` | Skip the embedding generation step | `false` |
| `embeddingModel` | Model to use for generating embeddings | `default` |
| `batchSize` | Number of chunks to embed in each batch | `20` |
| `dimensions` | Dimensionality of embeddings (model-dependent) | Model default |

**Example Request:**
```json
{
  "options": {
    "embeddingModel": "multilingual-large",
    "batchSize": 50
  }
}
```

### OCR Settings

Configure Optical Character Recognition for images and documents with embedded images.

| Option | Description | Default |
|--------|-------------|---------|
| `performOcr` | Enable OCR processing | `auto` |
| `ocrLanguages` | Languages to use for OCR | `["en"]` |
| `ocrQuality` | Quality level (fast, balanced, high) | `balanced` |
| `detectTables` | Extract and preserve table structure | `true` |
| `detectForms` | Extract form fields and values | `true` |

**Example Request:**
```json
{
  "options": {
    "performOcr": true,
    "ocrLanguages": ["en", "es", "fr"],
    "ocrQuality": "high",
    "detectTables": true
  }
}
```

### Metadata Extraction

Automatically extract metadata from your documents.

| Option | Description | Default |
|--------|-------------|---------|
| `extractMetadata` | Extract built-in document metadata | `true` |
| `extractTitle` | Extract document title | `true` |
| `extractAuthors` | Extract author information | `true` |
| `extractDates` | Extract creation/modification dates | `true` |
| `extractEntities` | Extract named entities (people, orgs, etc.) | `false` |

**Example Request:**
```json
{
  "options": {
    "extractMetadata": true,
    "extractTitle": true,
    "extractEntities": true,
    "entityTypes": ["PERSON", "ORGANIZATION", "LOCATION", "PRODUCT"]
  }
}
```

### Knowledge Graph Options

Configure how documents contribute to your knowledge graph.

| Option | Description | Default |
|--------|-------------|---------|
| `addToGraph` | Add content to knowledge graph | `true` |
| `entityExtraction` | Extract entities and relationships | `basic` |
| `entityTypes` | Types of entities to extract | All types |
| `relationshipTypes` | Types of relationships to extract | All types |
| `confidence` | Minimum confidence threshold | `0.7` |

**Example Request:**
```json
{
  "options": {
    "addToGraph": true,
    "entityExtraction": "comprehensive",
    "entityTypes": ["PERSON", "ORGANIZATION", "PRODUCT", "TECHNOLOGY"],
    "relationshipTypes": ["WORKS_FOR", "CREATED_BY", "PART_OF"],
    "confidence": 0.8
  }
}
```

## Document Management

### List Documents

Retrieve a list of all your ingested documents.

**Endpoint:** `GET /api/ingest/documents`

**Query Parameters:**
- `limit`: Maximum number of documents to return (default: 20)
- `offset`: Number of documents to skip (for pagination)
- `sort`: Field to sort by (e.g., `createdAt`, `title`)
- `order`: Sort order (`asc` or `desc`)
- `status`: Filter by status (`processing`, `completed`, `failed`)
- `filter`: JSON filtering criteria for metadata

**Example Request:**
```http
GET /api/ingest/documents?limit=10&offset=0&sort=createdAt&order=desc&status=completed&filter={"metadata.department":"Finance"} HTTP/1.1
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "documents": [
    {
      "documentId": "doc-a1b2c3d4",
      "title": "Quarterly Financial Report Q1 2023",
      "fileName": "quarterly_report.pdf",
      "contentType": "application/pdf",
      "status": "completed",
      "createdAt": "2023-07-10T15:32:10Z",
      "updatedAt": "2023-07-10T15:33:42Z",
      "metadata": {
        "author": "Finance Department",
        "department": "Finance",
        "date": "2023-04-15",
        "confidentiality": "internal"
      },
      "stats": {
        "fileSize": 2456789,
        "pageCount": 24,
        "chunkCount": 35,
        "wordCount": 7820,
        "entityCount": 143
      }
    },
    // Additional documents...
  ],
  "total": 45,
  "limit": 10,
  "offset": 0,
  "hasMore": true
}
```

### Get Document Details

Retrieve detailed information about a specific document.

**Endpoint:** `GET /api/ingest/documents/{documentId}`

**Example Response:**
```json
{
  "documentId": "doc-a1b2c3d4",
  "title": "Quarterly Financial Report Q1 2023",
  "fileName": "quarterly_report.pdf",
  "contentType": "application/pdf",
  "status": "completed",
  "createdAt": "2023-07-10T15:32:10Z",
  "updatedAt": "2023-07-10T15:33:42Z",
  "processingOptions": {
    "chunkSize": 1000,
    "chunkOverlap": 200,
    "chunkStrategy": "paragraph",
    "extractEntities": true
  },
  "metadata": {
    "author": "Finance Department",
    "department": "Finance",
    "date": "2023-04-15",
    "confidentiality": "internal",
    "language": "en",
    "extractedAuthors": ["Jane Smith", "Robert Johnson"],
    "extractedDate": "2023-04-12"
  },
  "stats": {
    "fileSize": 2456789,
    "pageCount": 24,
    "chunkCount": 35,
    "wordCount": 7820,
    "entityCount": 143,
    "processingTime": "92 seconds"
  },
  "entities": [
    {
      "name": "Revenue Growth",
      "type": "METRIC",
      "occurrences": 12
    },
    {
      "name": "European Market",
      "type": "LOCATION",
      "occurrences": 8
    }
    // Additional entities...
  ],
  "chunks": {
    "count": 35,
    "sample": [
      {
        "id": "chunk-e5f6g7",
        "text": "First quarter revenue reached $12.4M, representing a 15% increase year-over-year. This growth was primarily driven by the expansion of our European market presence and the successful launch of our premium service tier.",
        "location": "page 3, paragraph 2"
      }
      // Additional chunks...
    ]
  }
}
```

### Update Document Metadata

Update metadata for an existing document.

**Endpoint:** `PATCH /api/ingest/documents/{documentId}`

**Request:**
```json
{
  "metadata": {
    "confidentiality": "restricted",
    "category": "Financial",
    "tags": ["quarterly-report", "2023", "finance"],
    "reviewedBy": "John Executive"
  }
}
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc-a1b2c3d4",
  "metadata": {
    "author": "Finance Department",
    "department": "Finance",
    "date": "2023-04-15",
    "confidentiality": "restricted",
    "category": "Financial",
    "tags": ["quarterly-report", "2023", "finance"],
    "reviewedBy": "John Executive"
  },
  "updatedAt": "2023-07-12T09:22:15Z"
}
```

### Delete Document

Remove a document from your knowledge base.

**Endpoint:** `DELETE /api/ingest/documents/{documentId}`

**Query Parameters:**
- `removeEmbeddings`: Delete all embeddings (default: `true`)
- `removeEntities`: Remove associated entities (default: `false`)
- `force`: Force deletion even if document is used in templates (default: `false`)

**Example Request:**
```http
DELETE /api/ingest/documents/doc-a1b2c3d4?removeEmbeddings=true&removeEntities=true HTTP/1.1
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc-a1b2c3d4",
  "status": "deleted",
  "removedResources": {
    "embeddings": 35,
    "chunks": 35,
    "entities": 143
  }
}
```

## Batch Operations

### Check Batch Status

Check the status of a batch ingestion operation.

**Endpoint:** `GET /api/ingest/batch/status/{batchId}`

**Response:**
```json
{
  "batchId": "batch-x1y2z3",
  "status": "completed",
  "name": "Marketing Materials Q2",
  "createdAt": "2023-07-12T14:22:10Z",
  "updatedAt": "2023-07-12T14:24:36Z",
  "progress": {
    "total": 2,
    "completed": 2,
    "failed": 0,
    "processing": 0,
    "percentComplete": 100
  },
  "documents": [
    {
      "documentId": "doc-e5f6g7h8",
      "fileName": "document1.pdf",
      "status": "completed",
      "error": null
    },
    {
      "documentId": "doc-i9j0k1l2",
      "fileName": "document2.docx",
      "status": "completed",
      "error": null
    }
  ],
  "processingStats": {
    "totalProcessingTime": "2m 26s",
    "averageProcessingTime": "1m 13s",
    "totalPageCount": 48,
    "totalWordCount": 15240
  }
}
```

### Retry Failed Documents

Retry processing documents that failed during ingestion.

**Endpoint:** `POST /api/ingest/batch/{batchId}/retry`

**Request:**
```json
{
  "documentIds": ["doc-m3n4o5p6", "doc-q7r8s9t0"],
  "options": {
    "chunkSize": 1500,
    "timeout": 300
  }
}
```

**Response:**
```json
{
  "success": true,
  "batchId": "batch-x1y2z3",
  "status": "processing",
  "documentsRetried": 2,
  "retryOptions": {
    "chunkSize": 1500,
    "timeout": 300
  }
}
```

## Scheduled Ingestion

### Create Ingestion Schedule

Set up an automatic ingestion schedule for recurring data imports.

**Endpoint:** `POST /api/ingest/schedules`

**Request:**
```json
{
  "name": "Weekly Blog Content",
  "source": {
    "type": "crawl",
    "rootUrl": "https://blog.example.com",
    "options": {
      "maxPages": 10,
      "includeUrlPattern": "blog\\.example\\.com\\/posts\\/.*",
      "respectRobotsTxt": true
    }
  },
  "schedule": {
    "frequency": "weekly",
    "dayOfWeek": "monday",
    "time": "06:00",
    "timezone": "America/New_York"
  },
  "options": {
    "chunkStrategy": "paragraph",
    "extractEntities": true,
    "deduplicateContent": true
  },
  "metadata": {
    "source": "Company Blog",
    "contentType": "blog",
    "automated": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "scheduleId": "sched-a1b2c3",
  "name": "Weekly Blog Content",
  "status": "active",
  "source": {
    "type": "crawl",
    "rootUrl": "https://blog.example.com",
    "options": {
      "maxPages": 10,
      "includeUrlPattern": "blog\\.example\\.com\\/posts\\/.*",
      "respectRobotsTxt": true
    }
  },
  "schedule": {
    "frequency": "weekly",
    "dayOfWeek": "monday",
    "time": "06:00",
    "timezone": "America/New_York",
    "nextRun": "2023-07-17T06:00:00-04:00"
  },
  "options": {
    "chunkStrategy": "paragraph",
    "extractEntities": true,
    "deduplicateContent": true
  },
  "metadata": {
    "source": "Company Blog",
    "contentType": "blog",
    "automated": true
  },
  "history": []
}
```

### List Ingestion Schedules

Get a list of all configured ingestion schedules.

**Endpoint:** `GET /api/ingest/schedules`

**Response:**
```json
{
  "schedules": [
    {
      "scheduleId": "sched-a1b2c3",
      "name": "Weekly Blog Content",
      "status": "active",
      "sourceType": "crawl",
      "frequency": "weekly",
      "nextRun": "2023-07-17T06:00:00-04:00",
      "lastRun": null,
      "lastStatus": null
    },
    {
      "scheduleId": "sched-d4e5f6",
      "name": "Monthly Customer Data Sync",
      "status": "active",
      "sourceType": "database",
      "frequency": "monthly",
      "nextRun": "2023-08-01T02:00:00-04:00",
      "lastRun": "2023-07-01T02:00:00-04:00",
      "lastStatus": "completed"
    }
  ],
  "total": 2
}
```

### Update Ingestion Schedule

Modify an existing ingestion schedule.

**Endpoint:** `PATCH /api/ingest/schedules/{scheduleId}`

**Request:**
```json
{
  "status": "paused",
  "schedule": {
    "frequency": "weekly",
    "dayOfWeek": "wednesday",
    "time": "08:00"
  },
  "options": {
    "maxPages": 20
  }
}
```

**Response:**
```json
{
  "success": true,
  "scheduleId": "sched-a1b2c3",
  "name": "Weekly Blog Content",
  "status": "paused",
  "schedule": {
    "frequency": "weekly",
    "dayOfWeek": "wednesday",
    "time": "08:00",
    "timezone": "America/New_York",
    "nextRun": "2023-07-19T08:00:00-04:00"
  },
  "source": {
    "type": "crawl",
    "rootUrl": "https://blog.example.com",
    "options": {
      "maxPages": 20,
      "includeUrlPattern": "blog\\.example\\.com\\/posts\\/.*",
      "respectRobotsTxt": true
    }
  }
}
```

### Run Ingestion Schedule Manually

Trigger a scheduled ingestion immediately, outside of its normal schedule.

**Endpoint:** `POST /api/ingest/schedules/{scheduleId}/run`

**Response:**
```json
{
  "success": true,
  "scheduleId": "sched-a1b2c3",
  "batchId": "batch-g7h8i9",
  "status": "processing",
  "manualRun": true,
  "startedAt": "2023-07-14T16:45:22Z",
  "batchStatusUrl": "/api/ingest/batch/status/batch-g7h8i9"
}
```

## Usage Statistics

### Get Ingestion Usage

Retrieve statistics on your API usage for the Ingest endpoints.

**Endpoint:** `GET /api/ingest/usage`

**Query Parameters:**
- `period`: Time period (`day`, `week`, `month`, `year`)
- `startDate`: Start date for custom period (ISO format)
- `endDate`: End date for custom period (ISO format)

**Response:**
```json
{
  "period": "month",
  "startDate": "2023-07-01T00:00:00Z",
  "endDate": "2023-07-31T23:59:59Z",
  "usage": {
    "totalRequests": 153,
    "totalDocuments": 87,
    "totalSize": 256789012,
    "totalPages": 1245,
    "apiCalls": {
      "upload": 42,
      "bulkUpload": 5,
      "url": 15,
      "crawl": 2,
      "database": 1,
      "apiSource": 1
    },
    "contentTypes": {
      "pdf": 35,
      "docx": 22,
      "pptx": 10,
      "html": 15,
      "other": 5
    },
    "processingTime": {
      "total": "6h 23m 15s",
      "average": "4m 24s",
      "min": "12s",
      "max": "15m 42s"
    }
  },
  "limits": {
    "maxDocumentsPerMonth": 1000,
    "maxSizePerMonth": 5368709120,
    "remaining": {
      "documents": 913,
      "size": 5111920108
    },
    "usagePercentage": 8.7
  }
}
```

## Best Practices

### Document Preparation

1. **Clean your documents** before ingestion:
   - Remove headers, footers, and page numbers
   - Ensure proper formatting and structural integrity
   - Fix OCR errors in scanned documents

2. **Optimize file size**:
   - Compress images within documents
   - Use efficient formats (PDF instead of image scans)
   - Split very large documents (>50MB) into logical sections

3. **Ensure accessibility**:
   - Use proper headings and structure
   - Include alt text for images
   - Ensure tables have proper headers

### Metadata Management

1. **Be consistent with metadata schemas**:
   - Define standard fields for your organization
   - Use consistent naming conventions
   - Document your metadata schema

2. **Include contextual metadata**:
   - Author and creation date
   - Department or team
   - Content type and purpose
   - Confidentiality level

3. **Use metadata for filtering**:
   - Add tags for categorical filtering
   - Include version information
   - Add relevant dates for temporal filtering

### Chunking Strategy

1. **Balance chunk size**:
   - Too small: loss of context
   - Too large: decreased retrieval precision
   - Aim for 300-1000 tokens for most use cases

2. **Choose appropriate strategy**:
   - Technical documents: heading-based chunking
   - Narrative content: paragraph or semantic chunking
   - Structured data: record-based chunking

3. **Use appropriate overlap**:
   - 10-20% overlap preserves context between chunks
   - More overlap for complex technical content
   - Less overlap for distinct, well-structured content

### Performance Optimization

1. **Batch operations**:
   - Use bulk upload for multiple files
   - Consider database connections for large datasets
   - Process large websites with crawling

2. **Schedule during off-hours**:
   - Set up scheduled ingestion for large imports
   - Choose low-traffic periods
   - Monitor ingestion times and adjust accordingly

3. **Monitor and manage**:
   - Track ingestion success rates
   - Clean up failed imports
   - Periodically audit and remove outdated content

## Troubleshooting

### Common Issues

| Issue | Possible Causes | Resolution |
|-------|-----------------|------------|
| Upload fails | File too large | Split document or increase size limit |
| | Unsupported format | Convert to supported format |
| | Corrupted file | Fix or recreate file |
| Processing timeout | Complex document | Increase timeout or split document |
| | Server load | Retry during off-peak hours |
| OCR quality issues | Poor scan quality | Improve original scan or pre-process |
| | Wrong language setting | Specify correct OCR languages |
| Chunking problems | Inappropriate strategy | Try a different chunking strategy |
| | Document structure | Improve document formatting |

### Error Messages

| Error Code | Message | Resolution |
|------------|---------|------------|
| `FILE_TOO_LARGE` | File exceeds maximum size limit | Compress or split file |
| `UNSUPPORTED_FORMAT` | File format not supported | Convert to supported format |
| `PROCESSING_FAILED` | Document processing failed | Check logs for specific error |
| `INVALID_OPTIONS` | Invalid processing options | Correct option parameters |
| `PERMISSION_DENIED` | Insufficient permissions | Check API key permissions |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Reduce request frequency |
| `DATABASE_CONNECTION_ERROR` | Could not connect to database | Check connection credentials |
| `CRAWL_FAILED` | Web crawling operation failed | Check URL accessibility and patterns |

For persistent issues, check the detailed error logs available at `GET /api/ingest/logs` or contact support with your request ID.

## Related Documentation

- [Retrieve Documentation](retrieve.md) - Learn how to query your ingested content
- [Knowledge Graph Documentation](knowledge.md) - Understand how entities and relationships work
- [Templates Documentation](templates.md) - Create structured responses from your content 