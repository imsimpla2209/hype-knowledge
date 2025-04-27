# Ingest Module

The Ingest module provides functionality for uploading, processing, and managing unstructured data from various sources.

## Features

- File upload and processing for various document types (Text, Markdown, CSV, JSON, PDF, etc.)
- Text content and URL-based ingestion
- Document chunking with configurable size and overlap
- Unstructured.io integration for enhanced document processing
- Temporary storage in Redis for processed documents
- Async processing with status tracking

## API Endpoints

### Upload Endpoints

- `POST /api/ingest/upload` - Upload a file
- `POST /api/ingest/upload/text` - Upload text content
- `POST /api/ingest/upload/url` - Upload from URL

### Processing Endpoints

- `POST /api/ingest/process` - Process an uploaded document
- `GET /api/ingest/status/:id` - Get document processing status
- `GET /api/ingest/document/:id` - Get processed document
- `DELETE /api/ingest/document/:id` - Delete a document

## Architecture

The module follows a clean architecture with the following components:

- **Controllers** - Handle HTTP requests and responses
- **Services** - Implement business logic for document processing
- **Queries** - Interact with Redis for data storage
- **Types** - Define data models and validation schemas

## Supported Document Types

- Plain Text (`.txt`)
- Markdown (`.md`)
- CSV (`.csv`)
- JSON (`.json`)
- HTML (`.html`)
- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Microsoft PowerPoint (`.ppt`, `.pptx`)
- Microsoft Excel (`.xls`, `.xlsx`)

## Usage Examples

### Uploading a File

```bash
curl -X POST http://localhost:3000/api/ingest/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/document.pdf" \
  -F "metadata={\"source\":\"manual-upload\",\"tags\":[\"documentation\"]}"
```

### Processing a Document

```bash
curl -X POST http://localhost:3000/api/ingest/process \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "document-uuid",
    "chunkSize": 1000,
    "chunkOverlap": 200,
    "useUnstructured": true,
    "includeMetadata": true
  }'
```

### Getting Document Status

```bash
curl -X GET http://localhost:3000/api/ingest/status/document-uuid
```

## Dependencies

- LangChain.js - Document processing and chunking
- Unstructured.io - Advanced document parsing
- Redis - Temporary document storage
- Multer - File upload handling
- Zod - Request validation
