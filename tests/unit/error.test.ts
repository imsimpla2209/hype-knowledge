import { 
  AppError, 
  NotFoundError, 
  AuthError, 
  ValidationError, 
  ForbiddenError,
  ConflictError,
  ServiceUnavailableError,
  errorHandler 
} from '../../src/utils/error';
import { Request, Response } from 'express';
import { logger } from '../../src/utils/logger';

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Error classes', () => {
  describe('AppError', () => {
    it('should create an AppError with default values', () => {
      const error = new AppError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });
    
    it('should create an AppError with custom values', () => {
      const error = new AppError('Custom error', 418, 'IM_A_TEAPOT', false);
      
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(418);
      expect(error.code).toBe('IM_A_TEAPOT');
      expect(error.isOperational).toBe(false);
    });
  });
  
  describe('NotFoundError', () => {
    it('should create a NotFoundError with default values', () => {
      const error = new NotFoundError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.isOperational).toBe(true);
    });
    
    it('should create a NotFoundError with custom message and code', () => {
      const error = new NotFoundError('User not found', 'USER_NOT_FOUND');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('USER_NOT_FOUND');
    });
  });
  
  describe('AuthError', () => {
    it('should create an AuthError with default values', () => {
      const error = new AuthError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(AuthError);
      expect(error.message).toBe('Authentication failed');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTH_FAILED');
    });
  });
  
  describe('ValidationError', () => {
    it('should create a ValidationError with custom errors', () => {
      const validationErrors = { email: 'Invalid email format' };
      const error = new ValidationError('Form validation failed', validationErrors);
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Form validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.errors).toEqual(validationErrors);
    });
  });
  
  describe('ForbiddenError', () => {
    it('should create a ForbiddenError', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
    });
  });
  
  describe('ConflictError', () => {
    it('should create a ConflictError', () => {
      const error = new ConflictError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(409);
    });
  });
  
  describe('ServiceUnavailableError', () => {
    it('should create a ServiceUnavailableError', () => {
      const error = new ServiceUnavailableError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(503);
    });
  });
});

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  
  beforeEach(() => {
    jsonSpy = jest.fn();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jsonSpy,
    };
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock process.env.NODE_ENV for consistent testing
    process.env.NODE_ENV = 'test';
  });
  
  it('should handle AppError correctly', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'TEST_ERROR',
      message: 'Test error'
    }));
    expect(logger.warn).toHaveBeenCalledWith('TEST_ERROR: Test error');
  });
  
  it('should handle ValidationError with error details', () => {
    const validationErrors = { field: 'Invalid field' };
    const error = new ValidationError('Validation error', validationErrors);
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());
    
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      details: validationErrors
    }));
  });
  
  it('should handle unknown errors as 500 Internal Server Error', () => {
    const error = new Error('Unknown error');
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());
    
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }));
    expect(logger.error).toHaveBeenCalled();
  });
  
  it('should handle ZodError correctly', () => {
    const error = new Error('Validation failed');
    error.name = 'ZodError';
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      code: 'VALIDATION_FAILED'
    }));
  });
  
  it('should handle JWT errors correctly', () => {
    const error = new Error('Invalid token');
    error.name = 'JsonWebTokenError';
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());
    
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      code: 'INVALID_TOKEN'
    }));
  });
}); 