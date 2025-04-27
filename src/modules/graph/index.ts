import { KnowledgeGraphController } from './controllers/knowledge.controller';
import { KnowledgeGraphService } from './services/knowledge.service';
import * as KnowledgeGraphTypes from './types/knowledge.types';
import * as GraphTypes from './types/graph.types';

// Export controller instance
export const knowledgeGraphController = new KnowledgeGraphController();

// Export types and classes
export { KnowledgeGraphService, KnowledgeGraphController, KnowledgeGraphTypes, GraphTypes };
