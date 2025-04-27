import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

/**
 * Error type enum for categorizing errors
 */
export enum ErrorType {
  Internal = 'INTERNAL_ERROR',
  NotFound = 'RESOURCE_NOT_FOUND',
  Validation = 'VALIDATION_FAILED',
  Unauthorized = 'AUTH_FAILED',
  Forbidden = 'ACCESS_FORBIDDEN',
  Conflict = 'RESOURCE_CONFLICT',
  ServiceUnavailable = 'SERVICE_UNAVAILABLE'
}

/**
 * Base application error class
 * @extends Error
 */
export class AppError extends Error {
  /** HTTP status code */
  public statusCode: number;

  /** Error code for categorization */
  public code: string;

  /** Whether this is an operational error */
  public isOperational: boolean;

  /**
   * Creates a new AppError
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param code - Error code for categorization
   * @param isOperational - Whether this is an operational error
   */
  constructor(message: string, statusCode = 500, code: string | ErrorType = ErrorType.Internal, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code as string;
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);

    // Set prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Not found error
 * @extends AppError
 */
export class NotFoundError extends AppError {
  /**
   * Creates a new NotFoundError
   * @param message - Error message
   * @param code - Error code for categorization
   */
  constructor(message = 'Resource not found', code: string | ErrorType = ErrorType.NotFound) {
    super(message, 404, code, true);

    // Set prototype explicitly
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Authentication error
 * @extends AppError
 */
export class AuthError extends AppError {
  /**
   * Creates a new AuthError
   * @param message - Error message
   * @param code - Error code for categorization
   */
  constructor(message = 'Authentication failed', code: string | ErrorType = ErrorType.Unauthorized) {
    super(message, 401, code, true);

    // Set prototype explicitly
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Validation error
 * @extends AppError
 */
export class ValidationError extends AppError {
  /** Validation errors detail */
  public errors: Record<string, unknown>;

  /**
   * Creates a new ValidationError
   * @param message - Error message
   * @param errors - Validation errors detail
   * @param code - Error code for categorization
   */
  constructor(message = 'Validation failed', errors: Record<string, unknown> = {}, code: string | ErrorType = ErrorType.Validation) {
    super(message, 400, code, true);
    this.errors = errors;

    // Set prototype explicitly
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authorization error
 * @extends AppError
 */
export class ForbiddenError extends AppError {
  /**
   * Creates a new ForbiddenError
   * @param message - Error message
   * @param code - Error code for categorization
   */
  constructor(message = 'Access forbidden', code: string | ErrorType = ErrorType.Forbidden) {
    super(message, 403, code, true);

    // Set prototype explicitly
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Conflict error
 * @extends AppError
 */
export class ConflictError extends AppError {
  /**
   * Creates a new ConflictError
   * @param message - Error message
   * @param code - Error code for categorization
   */
  constructor(message = 'Resource conflict', code: string | ErrorType = ErrorType.Conflict) {
    super(message, 409, code, true);

    // Set prototype explicitly
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Service unavailable error
 * @extends AppError
 */
export class ServiceUnavailableError extends AppError {
  /**
   * Creates a new ServiceUnavailableError
   * @param message - Error message
   * @param code - Error code for categorization
   */
  constructor(message = 'Service unavailable', code: string | ErrorType = ErrorType.ServiceUnavailable) {
    super(message, 503, code, true);

    // Set prototype explicitly
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Error handler middleware for Express
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let errorMessage = 'An unexpected error occurred';
  let errorDetails: Record<string, unknown> = {};
  let isOperational = false;

  // If this is one of our custom AppErrors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    errorMessage = err.message;
    isOperational = err.isOperational;

    if (err instanceof ValidationError) {
      errorDetails = err.errors;
    }
  } else if (err.name === 'ZodError') {
    // Handle Zod validation errors
    statusCode = 400;
    errorCode = 'VALIDATION_FAILED';
    errorMessage = 'Validation failed';
    errorDetails = { zodErrors: err };
    isOperational = true;
  } else if (err.name === 'JsonWebTokenError') {
    // Handle JWT errors
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    errorMessage = 'Invalid token';
    isOperational = true;
  } else if (err.name === 'TokenExpiredError') {
    // Handle JWT expiration
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    errorMessage = 'Token expired';
    isOperational = true;
  }

  // Log the error
  if (isOperational) {
    logger.warn(`${errorCode}: ${errorMessage}`);
  } else {
    logger.error(`Unhandled error: ${err.message}`, { error: err, stack: err.stack });
  }

  // Send the response
  res.status(statusCode).json({
    status: 'error',
    code: errorCode,
    message: errorMessage,
    ...(Object.keys(errorDetails).length > 0 && { details: errorDetails }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
