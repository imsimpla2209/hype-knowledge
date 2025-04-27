import { inject } from 'inversify';
import { ApiOperationDelete, ApiOperationGet, ApiOperationPost, ApiPath, SwaggerDefinitionConstant } from 'swagger-express-ts';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BaseController } from '../../../core/controllers/base.controller';
import { TemplateService } from '../services/template.service';
import { Template, TemplateEmbeddingRequestSchema, TemplateSearchRequestSchema } from '../types/template.types';
import { validateZodSchema } from '../../../utils/validation.util';

@ApiPath({
  path: '/api/v1/templates',
  name: 'Template Operations',
  description: 'API endpoints for template embedding and retrieval'
})
export class TemplateController extends BaseController {
  constructor(@inject(TemplateService) private templateService: TemplateService) {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/embed', this.embedTemplate.bind(this));
    this.router.post('/search', this.searchTemplates.bind(this));
    this.router.post('/bulk-embed', this.bulkEmbedTemplates.bind(this));
    this.router.delete('/:id', this.deleteTemplate.bind(this));
  }

  @ApiOperationPost({
    path: '/embed',
    description: 'Embed a template in the vector store',
    summary: 'Embed a template',
    parameters: {
      body: {
        description: 'Template embedding request',
        required: true,
        model: 'TemplateEmbeddingRequest'
      }
    },
    responses: {
      200: {
        description: 'Template embedded successfully',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT
      },
      400: {
        description: 'Bad request',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT
      },
      500: {
        description: 'Internal server error',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT
      }
    }
  })
  private async embedTemplate(req: Request, res: Response): Promise<void> {
    try {
      const validatedRequest = validateZodSchema(TemplateEmbeddingRequestSchema, req.body);
      const templateId = await this.templateService.embedTemplate(validatedRequest);

      this.sendSuccessResponse(res, {
        message: 'Template embedded successfully',
        data: { templateId }
      });
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  @ApiOperationPost({
    path: '/search',
    description: 'Search for templates based on query and filters',
    summary: 'Search templates',
    parameters: {
      body: {
        description: 'Template search request',
        required: true,
        model: 'TemplateSearchRequest'
      }
    },
    responses: {
      200: {
        description: 'Search results',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT
      },
      400: {
        description: 'Bad request',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT
      },
      500: {
        description: 'Internal server error',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT
      }
    }
  })
  private async searchTemplates(req: Request, res: Response): Promise<void> {
    try {
      const validatedRequest = validateZodSchema(TemplateSearchRequestSchema, req.body);
      const searchResult = await this.templateService.searchTemplates(validatedRequest);

      this.sendSuccessResponse(res, {
        message: 'Templates retrieved successfully',
        data: searchResult
      });
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  @ApiOperationPost({
    path: '/bulk-embed',
    description: 'Bulk embed multiple templates',
    summary: 'Bulk embed templates',
    parameters: {
      body: {
        description: 'Array of templates to embed',
        required: true,
        model: 'Template'
      }
    },
    responses: {
      200: {
        description: 'Templates embedded successfully',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT
      },
      400: {
        description: 'Bad request',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT
      },
      500: {
        description: 'Internal server error',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT
      }
    }
  })
  private async bulkEmbedTemplates(req: Request, res: Response): Promise<void> {
    try {
      // Validate array of templates
      if (!Array.isArray(req.body)) {
        return this.sendErrorResponse(res, 'Request body must be an array of templates', StatusCodes.BAD_REQUEST);
      }

      const templates = req.body as Template[];
      const templateIds = await this.templateService.bulkEmbedTemplates(templates);

      this.sendSuccessResponse(res, {
        message: `${templateIds.length} templates embedded successfully`,
        data: { templateIds }
      });
    } catch (error) {
      this.handleError(error, req, res);
    }
  }

  @ApiOperationDelete({
    path: '/{id}',
    description: 'Delete a template from the vector store',
    summary: 'Delete template',
    parameters: {
      path: {
        id: {
          description: 'Template ID',
          required: true,
          type: SwaggerDefinitionConstant.Parameter.Type.STRING
        }
      }
    },
    responses: {
      200: {
        description: 'Template deleted successfully',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT
      },
      404: {
        description: 'Template not found',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT
      },
      500: {
        description: 'Internal server error',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT
      }
    }
  })
  private async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateId = req.params.id;

      if (!templateId) {
        return this.sendErrorResponse(res, 'Template ID is required', StatusCodes.BAD_REQUEST);
      }

      await this.templateService.deleteTemplate(templateId);

      this.sendSuccessResponse(res, {
        message: 'Template deleted successfully'
      });
    } catch (error) {
      this.handleError(error, req, res);
    }
  }
}
