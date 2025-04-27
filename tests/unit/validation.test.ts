import { Request, Response, NextFunction } from 'express';
import { 
  validate, 
  emailSchema, 
  passwordSchema, 
  loginSchema, 
  paginationSchema, 
  fileUploadSchema,
  filterSchema,
  proxyAuthSchema,
  apiKeySchema
} from '../../src/utils/validation';
import { ValidationError } from '../../src/utils/error';
import { z } from 'zod';

describe('validation', () => {
  describe('validate middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;
    
    beforeEach(() => {
      req = { body: {}, query: {}, params: {} };
      res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      next = jest.fn();
    });
    
    it('should pass validation and call next when data is valid', () => {
      // Setup
      req.body = { email: 'test@example.com', password: 'password123' };
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });
      
      // Execute
      const middleware = validate(schema);
      middleware(req as Request, res as Response, next);
      
      // Verify
      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });
    
    it('should call next with ValidationError when data is invalid', () => {
      // Setup
      req.body = { email: 'invalid-email', password: 'short' };
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });
      
      // Execute
      const middleware = validate(schema);
      middleware(req as Request, res as Response, next);
      
      // Verify
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.statusCode).toBe(400);
      expect(error.errors).toHaveProperty('email');
      expect(error.errors).toHaveProperty('password');
    });
    
    it('should validate query parameters when source is "query"', () => {
      // Setup
      req.query = { page: '2', limit: '20' };
      
      // Execute
      const middleware = validate(paginationSchema, 'query');
      middleware(req as Request, res as Response, next);
      
      // Verify
      expect(next).toHaveBeenCalledWith();
      expect(req.query).toEqual({ page: 2, limit: 20 });
    });
    
    it('should validate route parameters when source is "params"', () => {
      // Setup
      req.params = { id: '123' };
      const schema = z.object({ id: z.string() });
      
      // Execute
      const middleware = validate(schema, 'params');
      middleware(req as Request, res as Response, next);
      
      // Verify
      expect(next).toHaveBeenCalledWith();
    });
  });
  
  describe('emailSchema', () => {
    it('should pass validation for valid emails', () => {
      expect(() => emailSchema.parse('user@example.com')).not.toThrow();
      expect(() => emailSchema.parse('user.name+tag@example.co.uk')).not.toThrow();
    });
    
    it('should fail validation for invalid emails', () => {
      expect(() => emailSchema.parse('invalid-email')).toThrow();
      expect(() => emailSchema.parse('user@')).toThrow();
      expect(() => emailSchema.parse('@example.com')).toThrow();
    });
  });
  
  describe('passwordSchema', () => {
    it('should pass validation for valid passwords', () => {
      expect(() => passwordSchema.parse('Password1!')).not.toThrow();
      expect(() => passwordSchema.parse('StrongP@ssw0rd')).not.toThrow();
    });
    
    it('should fail validation for passwords without uppercase', () => {
      expect(() => passwordSchema.parse('password1!')).toThrow();
    });
    
    it('should fail validation for passwords without lowercase', () => {
      expect(() => passwordSchema.parse('PASSWORD1!')).toThrow();
    });
    
    it('should fail validation for passwords without numbers', () => {
      expect(() => passwordSchema.parse('Password!')).toThrow();
    });
    
    it('should fail validation for passwords without special characters', () => {
      expect(() => passwordSchema.parse('Password1')).toThrow();
    });
    
    it('should fail validation for short passwords', () => {
      expect(() => passwordSchema.parse('Pass1!')).toThrow();
    });
  });
  
  describe('loginSchema', () => {
    it('should pass validation for valid login data', () => {
      expect(() => loginSchema.parse({
        email: 'user@example.com',
        password: 'password123',
      })).not.toThrow();
    });
    
    it('should set default value for rememberMe', () => {
      const result = loginSchema.parse({
        email: 'user@example.com',
        password: 'password123',
      });
      
      expect(result).toEqual({
        email: 'user@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });
    
    it('should fail validation for missing email', () => {
      expect(() => loginSchema.parse({
        password: 'password123',
      })).toThrow();
    });
    
    it('should fail validation for missing password', () => {
      expect(() => loginSchema.parse({
        email: 'user@example.com',
      })).toThrow();
    });
  });
  
  describe('paginationSchema', () => {
    it('should pass validation and transform string values to numbers', () => {
      const result = paginationSchema.parse({
        page: '2',
        limit: '15',
      });
      
      expect(result).toEqual({
        page: 2,
        limit: 15,
      });
    });
    
    it('should use default values when not provided', () => {
      const result = paginationSchema.parse({});
      
      expect(result).toEqual({
        page: 1,
        limit: 10,
      });
    });
    
    it('should fail for non-numeric values', () => {
      expect(() => paginationSchema.parse({
        page: 'abc',
      })).toThrow();
    });
    
    it('should fail when limit exceeds maximum', () => {
      expect(() => paginationSchema.parse({
        limit: '150',
      })).toThrow();
    });
  });
  
  describe('fileUploadSchema', () => {
    it('should pass validation for valid file data', () => {
      expect(() => fileUploadSchema.parse({
        file: { size: 1024 * 1024 }, // 1MB file
        fileType: 'document',
        description: 'Test file',
      })).not.toThrow();
    });
    
    it('should fail when file is missing', () => {
      expect(() => fileUploadSchema.parse({
        fileType: 'document',
      })).toThrow();
    });
    
    it('should fail when file is too large', () => {
      expect(() => fileUploadSchema.parse({
        file: { size: 20 * 1024 * 1024 }, // 20MB file
        fileType: 'document',
      })).toThrow();
    });
    
    it('should fail for invalid file type', () => {
      expect(() => fileUploadSchema.parse({
        file: { size: 1024 * 1024 },
        fileType: 'invalid-type',
      })).toThrow();
    });
  });
  
  describe('proxyAuthSchema', () => {
    it('should pass validation for valid proxy auth data', () => {
      expect(() => proxyAuthSchema.parse({
        token: 'valid-token',
        service: 'external-system-1',
      })).not.toThrow();
    });
    
    it('should fail for invalid service', () => {
      expect(() => proxyAuthSchema.parse({
        token: 'valid-token',
        service: 'unknown-service',
      })).toThrow();
    });
  });
  
  describe('apiKeySchema', () => {
    it('should pass validation for valid API key data', () => {
      expect(() => apiKeySchema.parse({
        name: 'Test API Key',
        scopes: ['read', 'write'],
      })).not.toThrow();
    });
    
    it('should set default expiry when not provided', () => {
      const result = apiKeySchema.parse({
        name: 'Test API Key',
        scopes: ['read'],
      });
      
      expect(result.expiresIn).toBe(30 * 24 * 60 * 60); // 30 days in seconds
    });
    
    it('should fail for invalid scope', () => {
      expect(() => apiKeySchema.parse({
        name: 'Test API Key',
        scopes: ['invalid-scope'],
      })).toThrow();
    });
  });
}); 