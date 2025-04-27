import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'reflect-metadata';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { errorHandler } from './utils/error';
import retrieveRouter from './routes/retrieve.routes';
import authRouter from './routes/auth.routes';
import ingestRouter from './routes/ingest.routes';
import knowledgeRouter from './routes/knowledge.routes';

// Initialize express app
const app = express();

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/retrieve', retrieveRouter);
app.use('/api/auth', authRouter);
app.use('/api/ingest', ingestRouter);
app.use('/api/knowledge', knowledgeRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.NODE_ENV} mode`);
});

export default app;
