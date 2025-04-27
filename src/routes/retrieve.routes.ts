import express from 'express';
import { retrieveController } from '../modules/retrieve';

/**
 * Router for retrieve module endpoints
 */
const retrieveRouter = express.Router();

// Health check endpoint
retrieveRouter.get('/health', retrieveController.healthCheck.bind(retrieveController));

// Main retrieval endpoints
retrieveRouter.post('/', retrieveController.retrieve.bind(retrieveController));
retrieveRouter.post('/vector', retrieveController.vectorRetrieval.bind(retrieveController));
retrieveRouter.post('/graph', retrieveController.graphRetrieval.bind(retrieveController));

export default retrieveRouter;
