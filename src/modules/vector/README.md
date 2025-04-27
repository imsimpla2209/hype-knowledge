# Vector Module

The Vector Module provides a flexible and extensible way to store, retrieve, and search vector embeddings using various vector database providers.

## Features

- Abstract provider interface allowing different vector database implementations
- Built-in memory vector store for development and testing
- Support for various similarity metrics (cosine, euclidean, dot product)
- Easy integration with the Embed Module for creating and storing embeddings
- Comprehensive filtering capabilities for vector search
- Collection management functions
- Batch operations for better performance

## Providers

The module currently includes the following providers:

- **Memory**: An in-memory vector store for development and testing
- Support for additional providers can be implemented by extending the `VectorStoreProvider` abstract class

## API Endpoints

- `POST /vectors` - Store a vector
- `POST /vectors/batch` - Store multiple vectors
- `POST /vectors/search` - Search for similar vectors
- `DELETE /vectors/:id` - Delete a vector by ID
- `POST /vectors/delete/batch` - Delete multiple vectors
- `POST /vectors/delete/filter` - Delete vectors by filter
- `GET /vectors/stats/:collection` - Get collection statistics
- `POST /vectors/collections/:name` - Create a new collection
- `DELETE /vectors/collections/:name` - Delete a collection

## Setup

```typescript
import express from 'express';
import { initVectorModule, vectorRouter } from './modules/vector';

const app = express();
app.use(express.json());

// Initialize the vector module
const initApp = async () => {
  await initVectorModule();

  // Register routes
  app.use('/vectors', vectorRouter);

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
};

initApp().catch(console.error);
```

## Usage Example

```typescript
import { vectorService } from './modules/vector';
import { ContentType, EmbeddingModel } from './modules/embed';

// Store a vector
const id = await vectorService.upsert({
  collection: 'documents',
  entry: {
    id: 'doc-123',
    vector: [0.1, 0.2, 0.3, ...], // Embedding vector
    content: 'Original document text',
    contentType: ContentType.TEXT,
    model: EmbeddingModel.OPENAI_TEXT_3_SMALL,
    metadata: {
      docType: 'article',
      category: 'science',
      author: 'John Doe'
    }
  }
});

// Search for similar vectors
const results = await vectorService.search({
  collection: 'documents',
  queryVector: [0.15, 0.25, 0.35, ...],
  topK: 10,
  filter: {
    field: 'metadata.category',
    operator: 'eq',
    value: 'science'
  },
  includeMetadata: true
});
```

## Integration with Embed Module

The Vector Module works seamlessly with the Embed Module for generating and storing embeddings:

```typescript
import { embeddingService } from './modules/embed';
import { vectorService } from './modules/vector';

// Generate embedding and store it in one step
const { embedding } = await embeddingService.createTextEmbedding({
  text: 'Document text to embed',
});

await vectorService.storeEmbedding('documents', 'doc-123', embedding, 'Document text to embed', {
  category: 'science',
});
```
