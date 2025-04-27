// Load environment variables from .env.test if it exists
import * as dotenv from 'dotenv';

process.env.NODE_ENV = 'test';
dotenv.config({ path: '.env.test' });

// Setup global test timeout
jest.setTimeout(30000);

// Silence console during tests
global.console = {
  ...console,
  // Uncomment to silence specific log levels
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global teardown
afterAll(async () => {
  // Add any cleanup needed after all tests
}); 