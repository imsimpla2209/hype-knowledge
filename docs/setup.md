# Setup Guide

This guide will help you set up and run the Hype Knowledge API on your development or production environment.

## Prerequisites

- Node.js (v16 or higher)
- NPM (v8 or higher)
- Redis (v6 or higher)
- Neo4j (v4.4 or higher)
- Qdrant (v1.1.0 or higher)
- OpenAI API key

## Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/hype-knowledge.git
   cd hype-knowledge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following environment variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# Auth Configuration
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key

# Embedding Model Configuration
DEFAULT_EMBEDDING_MODEL=OPENAI_TEXT_3_SMALL

# Optional Unstructured.io Configuration
UNSTRUCTURED_API_URL=http://localhost:8000/general/v0/general
UNSTRUCTURED_API_KEY=your_unstructured_api_key
```

Replace the placeholder values with your actual configuration.

## Database Setup

### Redis

1. Install Redis:
   ```bash
   # Ubuntu
   sudo apt update
   sudo apt install redis-server

   # macOS with Homebrew
   brew install redis
   ```

2. Start Redis:
   ```bash
   # Ubuntu
   sudo systemctl start redis-server

   # macOS
   brew services start redis
   ```

### Neo4j

1. Install Neo4j:
   - Download from [Neo4j Download Center](https://neo4j.com/download-center/)
   - Or use Docker:
     ```bash
     docker run -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/your_password neo4j:4.4
     ```

2. Configure Neo4j to accept remote connections if needed.

### Qdrant

1. Install Qdrant:
   - Using Docker:
     ```bash
     docker run -p 6333:6333 -p 6334:6334 -v $(pwd)/qdrant_data:/qdrant/storage qdrant/qdrant
     ```

## Running the Application

### Development Mode

```bash
npm run dev
```

This will start the server with hot reloading enabled.

### Production Mode

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Testing

Run the test suite:

```bash
npm test
```

For coverage reports:

```bash
npm run test:coverage
```

## Docker Deployment

A Dockerfile and docker-compose.yml are provided for containerized deployment.

1. Build the Docker image:
   ```bash
   docker build -t hype-knowledge .
   ```

2. Run the containers:
   ```bash
   docker-compose up -d
   ```

This will start the API server along with Redis, Neo4j, and Qdrant.

## Health Check

Verify the API is running correctly by making a request to the health endpoint:

```bash
curl http://localhost:3000/health
```

You should receive a response like:
```json
{"status":"OK","message":"Server is healthy"}
```

## Troubleshooting

### Connection Issues

If you encounter database connection issues:

1. Verify that Redis, Neo4j, and Qdrant are running:
   ```bash
   # Redis
   redis-cli ping
   
   # Neo4j (should be accessible at http://localhost:7474)
   
   # Qdrant (should be accessible at http://localhost:6333/dashboard)
   ```

2. Check your environment variables to ensure connection strings are correct.

### API Key Issues

If you receive authentication errors with OpenAI:

1. Verify your OpenAI API key is valid and has proper permissions.
2. Check for any rate limiting or quota issues on your OpenAI account.

## Next Steps

After successful setup, proceed to the [API Reference](api-reference.md) to learn how to interact with the API. 