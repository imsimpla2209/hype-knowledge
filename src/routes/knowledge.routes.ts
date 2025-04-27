import { Router } from 'express';
import { knowledgeGraphController } from '../modules/graph';

// Create router
const knowledgeRouter = Router();

/**
 * @api {get} /knowledge/health Health check
 * @apiName KnowledgeHealthCheck
 * @apiGroup Knowledge
 * @apiDescription Check the health of the knowledge graph service
 */
knowledgeRouter.get('/health', knowledgeGraphController.healthCheck.bind(knowledgeGraphController));

/**
 * @api {post} /knowledge/graph Create knowledge graph
 * @apiName CreateKnowledgeGraph
 * @apiGroup Knowledge
 * @apiDescription Create a new knowledge graph
 */
knowledgeRouter.post('/graph', knowledgeGraphController.createKnowledgeGraph.bind(knowledgeGraphController));

/**
 * @api {get} /knowledge/graph/:id Get knowledge graph
 * @apiName GetKnowledgeGraph
 * @apiGroup Knowledge
 * @apiDescription Retrieve a knowledge graph by ID
 */
knowledgeRouter.get('/graph/:id', knowledgeGraphController.getKnowledgeGraph.bind(knowledgeGraphController));

/**
 * @api {delete} /knowledge/graph/:id Delete knowledge graph
 * @apiName DeleteKnowledgeGraph
 * @apiGroup Knowledge
 * @apiDescription Delete a knowledge graph by ID
 */
knowledgeRouter.delete('/graph/:id', knowledgeGraphController.deleteKnowledgeGraph.bind(knowledgeGraphController));

/**
 * @api {post} /knowledge/extract Extract knowledge
 * @apiName ExtractKnowledge
 * @apiGroup Knowledge
 * @apiDescription Extract knowledge from text
 */
knowledgeRouter.post('/extract', knowledgeGraphController.extractKnowledge.bind(knowledgeGraphController));

/**
 * @api {post} /knowledge/query Query knowledge graph
 * @apiName QueryKnowledgeGraph
 * @apiGroup Knowledge
 * @apiDescription Query a knowledge graph using natural language
 */
knowledgeRouter.post('/query', knowledgeGraphController.queryKnowledgeGraph.bind(knowledgeGraphController));

/**
 * @api {post} /knowledge/create-from-text Create from text
 * @apiName CreateKnowledgeGraphFromText
 * @apiGroup Knowledge
 * @apiDescription Create a knowledge graph from text
 */
knowledgeRouter.post('/create-from-text', knowledgeGraphController.createKnowledgeGraphFromText.bind(knowledgeGraphController));

/**
 * @api {post} /knowledge/merge Merge knowledge graphs
 * @apiName MergeKnowledgeGraphs
 * @apiGroup Knowledge
 * @apiDescription Merge two knowledge graphs
 */
knowledgeRouter.post('/merge', knowledgeGraphController.mergeKnowledgeGraphs.bind(knowledgeGraphController));

/**
 * @api {patch} /knowledge/graph/:graphId/entity/:entityId/confidence Update entity confidence
 * @apiName UpdateEntityConfidence
 * @apiGroup Knowledge
 * @apiDescription Update an entity's confidence level
 */
knowledgeRouter.patch('/graph/:graphId/entity/:entityId/confidence', knowledgeGraphController.updateEntityConfidence.bind(knowledgeGraphController));

export default knowledgeRouter;
