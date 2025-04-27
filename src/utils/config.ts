import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variable schema for validation
 */
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),

  // Qdrant configuration
  QDRANT_URL: z.string().url(),
  QDRANT_API_KEY: z.string().optional(),

  // Neo4j configuration
  NEO4J_URI: z.string().url(),
  NEO4J_USERNAME: z.string(),
  NEO4J_PASSWORD: z.string(),

  // OpenAI configuration
  OPENAI_API_KEY: z.string(),

  // Gemini configuration (optional)
  GEMINI_API_KEY: z.string().optional(),

  // Redis configuration (optional for caching)
  REDIS_URL: z.string().url().optional(),
  RETRIEVE_CACHE_TTL: z.string().transform(Number).default('3600'), // Default 1 hour

  // Retrieval configuration
  MAX_DOCUMENTS: z.string().transform(Number).default('5'),
});

/**
 * Validate environment variables and provide typed access
 */
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\nEnvironment variable validation failed:');
      error.errors.forEach(err => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nCheck your .env file and make sure all required variables are set correctly.\n');
    } else {
      console.error('Unknown error parsing environment variables:', error);
    }
    process.exit(1);
  }
};

/**
 * Typed configuration object
 */
export const config = parseEnv() as any;

/**
 * Type definition for the config object
 */
export type Config = z.infer<typeof envSchema>;
