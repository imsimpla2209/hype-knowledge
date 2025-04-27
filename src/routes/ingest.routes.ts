import { Router } from 'express';
import multer from 'multer';
import { ingestController } from '../modules/ingest/controllers/ingest.controller';
import { validate } from '../utils/validation';
import { uploadSchema, processOptionsSchema } from '../modules/ingest/types/ingest.types';
import { logger } from '../utils/logger';

// Create router
const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * @api {post} /ingest/upload Upload a file
 * @apiName UploadFile
 * @apiGroup Ingest
 * @apiDescription Upload a file for processing
 */
router.post(
  '/upload',
  upload.single('file'),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }
    logger.debug('File uploaded', { filename: req.file.originalname, size: req.file.size });
    next();
  },
  ingestController.uploadFile.bind(ingestController),
);

/**
 * @api {post} /ingest/upload/text Upload text content
 * @apiName UploadText
 * @apiGroup Ingest
 * @apiDescription Upload text content for processing
 */
router.post('/upload/text', ingestController.uploadText.bind(ingestController));

/**
 * @api {post} /ingest/upload/url Upload from URL
 * @apiName UploadFromUrl
 * @apiGroup Ingest
 * @apiDescription Upload content from a URL for processing
 */
router.post('/upload/url', ingestController.uploadFromUrl.bind(ingestController));

/**
 * @api {post} /ingest/process Process a document
 * @apiName ProcessDocument
 * @apiGroup Ingest
 * @apiDescription Process an uploaded document
 */
router.post(
  '/process',
  validate(processOptionsSchema),
  ingestController.processDocument.bind(ingestController),
);

/**
 * @api {get} /ingest/status/:id Get document status
 * @apiName GetDocumentStatus
 * @apiGroup Ingest
 * @apiDescription Get the status of a document
 */
router.get('/status/:id', ingestController.getDocumentStatus.bind(ingestController));

/**
 * @api {get} /ingest/document/:id Get processed document
 * @apiName GetProcessedDocument
 * @apiGroup Ingest
 * @apiDescription Get a processed document
 */
router.get('/document/:id', ingestController.getProcessedDocument.bind(ingestController));

/**
 * @api {delete} /ingest/document/:id Delete document
 * @apiName DeleteDocument
 * @apiGroup Ingest
 * @apiDescription Delete a document
 */
router.delete('/document/:id', ingestController.deleteDocument.bind(ingestController));

export default router;
