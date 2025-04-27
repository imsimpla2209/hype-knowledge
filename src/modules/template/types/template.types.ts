import { z } from 'zod';
import { ContentType, EmbeddingModel } from '../../embed/types/embed.types';

/**
 * Template industry types
 */
export enum TemplateIndustry {
  ECOMMERCE = 'ecommerce',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  FINANCE = 'finance',
  TECHNOLOGY = 'technology',
  MARKETING = 'marketing',
  ENTERTAINMENT = 'entertainment',
  TRAVEL = 'travel',
  FOOD = 'food',
  REAL_ESTATE = 'real_estate',
  OTHER = 'other'
}

/**
 * Template types
 */
export enum TemplateType {
  LANDING = 'landing',
  BLOG = 'blog',
  PRODUCT = 'product',
  CONTACT = 'contact',
  ABOUT = 'about',
  GALLERY = 'gallery',
  PORTFOLIO = 'portfolio',
  DASHBOARD = 'dashboard',
  CHECKOUT = 'checkout',
  OTHER = 'other'
}

/**
 * Template style types
 */
export enum TemplateStyle {
  MODERN = 'modern',
  MINIMALIST = 'minimalist',
  CLASSIC = 'classic',
  CORPORATE = 'corporate',
  CREATIVE = 'creative',
  RETRO = 'retro',
  ELEGANT = 'elegant',
  BOLD = 'bold',
  PLAYFUL = 'playful',
  OTHER = 'other'
}

/**
 * Template data structure
 */
export interface Template {
  id: string;
  name: string;
  description?: string;
  features: string[];
  collection?: string;
  style?: string;
  industry?: string;
  type: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Template metadata structure
 */
export interface TemplateMetadata {
  id: string;
  name: string;
  features: string[];
  collection?: string;
  style?: string;
  industry?: string;
  type: string;
  thumbnailUrl?: string;
}

/**
 * Template vector structure
 */
export interface TemplateVector {
  id: string;
  vector: number[];
  metadata: TemplateMetadata;
}

/**
 * Zod schema for template embedding request
 */
export const TemplateEmbeddingRequestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  features: z.array(z.string()),
  collection: z.string().optional(),
  style: z.string().optional(),
  industry: z.string().optional(),
  type: z.string(),
  thumbnailUrl: z.string().optional()
});

export type TemplateEmbeddingRequest = z.infer<typeof TemplateEmbeddingRequestSchema>;

/**
 * Zod schema for template search request
 */
export const TemplateSearchRequestSchema = z.object({
  query: z.string(),
  filters: z
    .object({
      collection: z.string().optional(),
      style: z.string().optional(),
      industry: z.string().optional(),
      type: z.string().optional()
    })
    .optional(),
  limit: z.number().int().positive().default(10)
});

export type TemplateSearchRequest = z.infer<typeof TemplateSearchRequestSchema>;

/**
 * Template search result
 */
export interface TemplateSearchResult {
  id: string;
  name: string;
  features: string[];
  collection?: string;
  style?: string;
  industry?: string;
  type: string;
  thumbnailUrl?: string;
  score: number;
}

/**
 * Template search response
 */
export interface TemplateSearchResponse {
  results: TemplateSearchResult[];
  total: number;
  timeTaken: number;
}

/**
 * Template vector dimension
 */
export const TEMPLATE_VECTOR_DIMENSION = 1536; // For OpenAI embeddings
