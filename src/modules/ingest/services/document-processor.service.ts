import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { UnstructuredLoader } from 'langchain/document_loaders/fs/unstructured';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DocumentType, DocumentChunk, DocumentMetadata, ProcessedDocument, ProcessOptions } from '../types/ingest.types';
import { redisDocumentStore } from '../queries/redis.queries';
import { logger } from '../../../utils/logger';
import { ValidationError, AppError } from '../../../utils/error';

/**
 * Service for processing documents
 */
export class DocumentProcessorService {
  private readonly tempDir: string;

  /**
   * Constructor for DocumentProcessorService
   */
  constructor() {
    // Create a temporary directory for processing files
    this.tempDir = path.join(os.tmpdir(), 'hype-knowledge-ingest');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Process a document stored in Redis
   * @param options - Processing options
   * @returns Processed document with chunks
   */
  async processDocument(options: ProcessOptions): Promise<ProcessedDocument> {
    const { documentId, chunkSize, chunkOverlap, useUnstructured } = options;

    try {
      logger.info(`Processing document ${documentId}`, { options });

      // Get raw document from Redis
      const rawDocument = await redisDocumentStore.getRawDocument(documentId);
      if (!rawDocument) {
        throw new ValidationError(`Document ${documentId} not found`);
      }

      // Update status
      await redisDocumentStore.setDocumentStatus(documentId, {
        status: 'processing',
        progress: 10
      });

      // Save content to temp file
      const tempFilePath = await this.saveToTempFile(rawDocument.content, rawDocument.metadata.documentType, documentId);

      // Process based on document type
      const chunks = await this.processFile(tempFilePath, rawDocument.metadata, {
        chunkSize,
        chunkOverlap,
        useUnstructured,
        parsingOptions: options.parsingOptions
      });

      // Clean up temp file
      this.cleanupTempFile(tempFilePath);

      // Update status
      await redisDocumentStore.setDocumentStatus(documentId, {
        progress: 80,
        totalChunks: chunks.length
      });

      // Create processed document
      const processedDocument: ProcessedDocument = {
        id: documentId,
        chunks,
        totalChunks: chunks.length,
        metadata: {
          ...rawDocument.metadata,
          uploadedAt: rawDocument.uploadedAt,
          processedAt: new Date()
        },
        processedAt: new Date()
      };

      // Store processed document
      await redisDocumentStore.storeProcessedDocument(processedDocument);

      logger.info(`Document ${documentId} processed successfully`, {
        chunkCount: chunks.length
      });

      return processedDocument;
    } catch (error) {
      logger.error(`Error processing document ${documentId}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      // Update status to failed
      await redisDocumentStore.setDocumentStatus(documentId, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(`Failed to process document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save base64 content to a temporary file
   * @param base64Content - Base64 encoded content
   * @param documentType - Type of document
   * @param documentId - Document ID
   * @returns Path to temporary file
   */
  private async saveToTempFile(base64Content: string, documentType: DocumentType, documentId: string): Promise<string> {
    // Get file extension based on document type
    const extension = this.getExtensionForDocumentType(documentType);
    const tempFilePath = path.join(this.tempDir, `${documentId}${extension}`);

    // Decode base64 and write to file
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(tempFilePath, buffer);

    return tempFilePath;
  }

  /**
   * Get file extension for document type
   * @param documentType - Document type
   * @returns File extension with dot
   */
  private getExtensionForDocumentType(documentType: DocumentType): string {
    switch (documentType) {
      case DocumentType.TEXT:
        return '.txt';
      case DocumentType.MARKDOWN:
        return '.md';
      case DocumentType.CSV:
        return '.csv';
      case DocumentType.JSON:
        return '.json';
      case DocumentType.HTML:
        return '.html';
      case DocumentType.PDF:
        return '.pdf';
      case DocumentType.DOC:
        return '.doc';
      case DocumentType.DOCX:
        return '.docx';
      case DocumentType.PPT:
        return '.ppt';
      case DocumentType.PPTX:
        return '.pptx';
      case DocumentType.XLS:
        return '.xls';
      case DocumentType.XLSX:
        return '.xlsx';
      default:
        return '.txt';
    }
  }

  /**
   * Process a file and split into chunks
   * @param filePath - Path to the file
   * @param metadata - Document metadata
   * @param options - Processing options
   * @returns Array of document chunks
   */
  private async processFile(
    filePath: string,
    metadata: DocumentMetadata,
    options: {
      chunkSize: number;
      chunkOverlap: number;
      useUnstructured: boolean;
      parsingOptions?: Record<string, any>;
    }
  ): Promise<DocumentChunk[]> {
    const { documentType } = metadata;
    const { chunkSize, chunkOverlap, useUnstructured, parsingOptions } = options;

    // Use Unstructured.io if available and enabled
    if (useUnstructured) {
      try {
        return await this.processWithUnstructured(filePath, metadata, chunkSize, chunkOverlap);
      } catch (error) {
        logger.warn('Failed to process with Unstructured.io, falling back to standard loaders', {
          error: error instanceof Error ? error.message : String(error)
        });
        // Continue with standard loaders if Unstructured.io fails
      }
    }

    // Process with standard loaders based on document type
    switch (documentType) {
      case DocumentType.TEXT:
        return this.processTextFile(filePath, metadata, chunkSize, chunkOverlap);
      case DocumentType.MARKDOWN:
        return this.processTextFile(filePath, metadata, chunkSize, chunkOverlap);
      case DocumentType.CSV:
        return this.processCSVFile(filePath, metadata, chunkSize, parsingOptions);
      case DocumentType.JSON:
        return this.processJSONFile(filePath, metadata, chunkSize, chunkOverlap, parsingOptions);
      case DocumentType.PDF:
        return this.processPDFFile(filePath, metadata, chunkSize, chunkOverlap);
      case DocumentType.DOCX:
        return this.processDocxFile(filePath, metadata, chunkSize, chunkOverlap);
      default:
        throw new ValidationError(`Unsupported document type: ${documentType}`);
    }
  }

  /**
   * Process file with Unstructured.io
   * @param filePath - Path to the file
   * @param metadata - Document metadata
   * @param chunkSize - Size of each chunk
   * @param chunkOverlap - Overlap between chunks
   * @returns Array of document chunks
   */
  private async processWithUnstructured(
    filePath: string,
    metadata: DocumentMetadata,
    chunkSize: number,
    chunkOverlap: number
  ): Promise<DocumentChunk[]> {
    // Initialize the Unstructured loader
    const loader = new UnstructuredLoader(filePath, {
      apiUrl: process.env.UNSTRUCTURED_API_URL || 'http://localhost:8000/general/v0/general',
      apiKey: process.env.UNSTRUCTURED_API_KEY
    });

    // Load the documents
    const docs = await loader.load();

    // Create text splitter for further chunking if needed
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap
    });

    // Split documents if they're too large
    const splitDocs = await textSplitter.splitDocuments(docs);

    // Convert to our DocumentChunk format
    return splitDocs.map((doc, index) => ({
      content: doc.pageContent,
      metadata: {
        ...metadata,
        ...doc.metadata
      },
      position: index
    }));
  }

  /**
   * Process text or markdown file
   * @param filePath - Path to the file
   * @param metadata - Document metadata
   * @param chunkSize - Size of each chunk
   * @param chunkOverlap - Overlap between chunks
   * @returns Array of document chunks
   */
  private async processTextFile(filePath: string, metadata: DocumentMetadata, chunkSize: number, chunkOverlap: number): Promise<DocumentChunk[]> {
    // Initialize the text loader
    const loader = new TextLoader(filePath);

    // Load the documents
    const docs = await loader.load();

    // Create text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap
    });

    // Split the document into chunks
    const splitDocs = await textSplitter.splitDocuments(docs);

    // Convert to our DocumentChunk format
    return splitDocs.map((doc, index) => ({
      content: doc.pageContent,
      metadata: {
        ...metadata,
        ...doc.metadata
      },
      position: index
    }));
  }

  /**
   * Process CSV file
   * @param filePath - Path to the file
   * @param metadata - Document metadata
   * @param chunkSize - Number of rows per chunk
   * @param parsingOptions - CSV parsing options
   * @returns Array of document chunks
   */
  private async processCSVFile(
    filePath: string,
    metadata: DocumentMetadata,
    chunkSize: number,
    parsingOptions?: Record<string, any>
  ): Promise<DocumentChunk[]> {
    // Initialize the CSV loader with options
    const loader = new CSVLoader(filePath, {
      column: '',
      ...parsingOptions
    });

    // Load the documents (each row becomes a document)
    const docs = await loader.load();

    // Group rows into chunks of specified size
    const chunks: DocumentChunk[] = [];
    let chunk: string[] = [];
    let chunkIndex = 0;

    docs.forEach((doc, index) => {
      chunk.push(doc.pageContent);

      // When chunk reaches specified size or it's the last document
      if (chunk.length === chunkSize || index === docs.length - 1) {
        chunks.push({
          content: chunk.join('\n'),
          metadata: {
            ...metadata,
            rows: chunk.length,
            startRow: chunkIndex * chunkSize,
            endRow: chunkIndex * chunkSize + chunk.length - 1
          },
          position: chunkIndex
        });

        chunk = [];
        chunkIndex++;
      }
    });

    return chunks;
  }

  /**
   * Process JSON file
   * @param filePath - Path to the file
   * @param metadata - Document metadata
   * @param chunkSize - Size of each chunk
   * @param chunkOverlap - Overlap between chunks
   * @param parsingOptions - JSON parsing options
   * @returns Array of document chunks
   */
  private async processJSONFile(
    filePath: string,
    metadata: DocumentMetadata,
    chunkSize: number,
    chunkOverlap: number,
    parsingOptions?: Record<string, any>
  ): Promise<DocumentChunk[]> {
    // Initialize the JSON loader with options
    const loader = new JSONLoader(filePath);

    // Load the documents
    const docs = await loader.load();

    // Create text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap
    });

    // Split the document into chunks
    const splitDocs = await textSplitter.splitDocuments(docs);

    // Convert to our DocumentChunk format
    return splitDocs.map((doc, index) => ({
      content: doc.pageContent,
      metadata: {
        ...metadata,
        ...doc.metadata
      },
      position: index
    }));
  }

  /**
   * Process PDF file
   * @param filePath - Path to the file
   * @param metadata - Document metadata
   * @param chunkSize - Size of each chunk
   * @param chunkOverlap - Overlap between chunks
   * @returns Array of document chunks
   */
  private async processPDFFile(filePath: string, metadata: DocumentMetadata, chunkSize: number, chunkOverlap: number): Promise<DocumentChunk[]> {
    // Initialize the PDF loader
    const loader = new PDFLoader(filePath);

    // Load the documents
    const docs = await loader.load();

    // Create text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap
    });

    // Split the document into chunks
    const splitDocs = await textSplitter.splitDocuments(docs);

    // Convert to our DocumentChunk format
    return splitDocs.map((doc, index) => ({
      content: doc.pageContent,
      metadata: {
        ...metadata,
        ...doc.metadata
      },
      position: index
    }));
  }

  /**
   * Process DOCX file
   * @param filePath - Path to the file
   * @param metadata - Document metadata
   * @param chunkSize - Size of each chunk
   * @param chunkOverlap - Overlap between chunks
   * @returns Array of document chunks
   */
  private async processDocxFile(filePath: string, metadata: DocumentMetadata, chunkSize: number, chunkOverlap: number): Promise<DocumentChunk[]> {
    // Initialize the DOCX loader
    const loader = new DocxLoader(filePath);

    // Load the documents
    const docs = await loader.load();

    // Create text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap
    });

    // Split the document into chunks
    const splitDocs = await textSplitter.splitDocuments(docs);

    // Convert to our DocumentChunk format
    return splitDocs.map((doc, index) => ({
      content: doc.pageContent,
      metadata: {
        ...metadata,
        ...doc.metadata
      },
      position: index
    }));
  }

  /**
   * Clean up a temporary file
   * @param filePath - Path to the file
   */
  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      logger.warn(`Failed to clean up temporary file ${filePath}`, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Singleton instance
export const documentProcessorService = new DocumentProcessorService();
