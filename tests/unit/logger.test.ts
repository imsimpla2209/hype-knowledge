import { logger, createChildLogger, httpLogger } from '../../src/utils/logger';
import winston from 'winston';
import { EventEmitter } from 'events';

// Mock winston transports to avoid actual logging
jest.mock('winston', () => {
  const originalModule = jest.requireActual('winston');
  
  // Mock the Console transport to avoid actual console logs
  const mockConsole = {
    Console: jest.fn().mockImplementation(() => ({
      level: 'info',
      name: 'console',
    })),
  };
  
  // Mock the File transport to avoid file operations
  const mockFile = {
    File: jest.fn().mockImplementation(() => ({
      level: 'info',
      name: 'file',
    })),
  };
  
  return {
    ...originalModule,
    transports: {
      ...originalModule.transports,
      ...mockConsole,
      ...mockFile,
    },
    createLogger: jest.fn().mockImplementation(() => ({
      level: 'info',
      levels: originalModule.config.npm.levels,
      transports: [],
      add: jest.fn(),
      remove: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      http: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockImplementation(() => ({
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        http: jest.fn(),
        debug: jest.fn(),
      })),
    })),
    format: {
      ...originalModule.format,
      combine: jest.fn(),
      timestamp: jest.fn(),
      colorize: jest.fn(),
      printf: jest.fn(),
      json: jest.fn(),
    },
    addColors: jest.fn(),
  };
});

describe('logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should export a logger instance', () => {
    expect(logger).toBeDefined();
    expect(winston.createLogger).toHaveBeenCalled();
  });
  
  describe('createChildLogger', () => {
    it('should create a child logger with module name', () => {
      const childLogger = createChildLogger('test-module');
      
      expect(childLogger).toBeDefined();
      expect(logger.child).toHaveBeenCalledWith({
        module: 'test-module',
      });
    });
    
    it('should create a child logger with additional metadata', () => {
      const additionalMetadata = { service: 'auth', version: '1.0.0' };
      const childLogger = createChildLogger('test-module', additionalMetadata);
      
      expect(childLogger).toBeDefined();
      expect(logger.child).toHaveBeenCalledWith({
        module: 'test-module',
        ...additionalMetadata,
      });
    });
  });
  
  describe('httpLogger', () => {
    it('should log HTTP requests with appropriate log level based on status code', () => {
      // Mock request and response objects
      const req = {
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'Test Agent',
        },
      };
      
      // Create a mock response with EventEmitter to simulate 'finish' event
      const res = new EventEmitter() as any;
      res.statusCode = 200;
      
      const next = jest.fn();
      
      // Call the middleware
      httpLogger(req, res, next);
      
      // Verify next was called
      expect(next).toHaveBeenCalled();
      
      // Simulate response finish event
      res.emit('finish');
      
      // Should log with http level for 2xx status
      expect(logger.http).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/test 200')
      );
      
      // Test 4xx status code
      res.statusCode = 404;
      res.emit('finish');
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/test 404')
      );
      
      // Test 5xx status code
      res.statusCode = 500;
      res.emit('finish');
      
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/test 500')
      );
    });
    
    it('should handle missing headers or user-agent', () => {
      // Mock request with no headers
      const req = {
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
      };
      
      // Create a mock response
      const res = new EventEmitter() as any;
      res.statusCode = 200;
      
      const next = jest.fn();
      
      // Call the middleware
      httpLogger(req, res, next);
      
      // Simulate response finish event
      res.emit('finish');
      
      // Should still log without errors
      expect(logger.http).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
}); 