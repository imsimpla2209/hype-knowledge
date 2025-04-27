import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodType } from 'zod';
import { ValidationError } from './error';

/**
 * Middleware factory to validate request data with Zod schema
 * @param schema - Zod schema to validate against
 * @param source - Source of data to validate (body, query, params)
 * @returns Express middleware function
 */
export const validate = <T>(
  schema: ZodType<T>,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate the request data against the schema
      const data = schema.parse(req[source]);
      
      // Replace the request data with the validated data
      req[source] = data;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors for better readability
        const formattedErrors = error.errors.reduce((acc, curr) => {
          const path = curr.path.join('.');
          acc[path] = curr.message;
          return acc;
        }, {} as Record<string, string>);
        
        next(new ValidationError(
          `Validation failed for ${source}`,
          formattedErrors,
          `${source.toUpperCase()}_VALIDATION_FAILED`
        ));
      } else {
        next(error);
      }
    }
  };
};

// Common validation schemas

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email format');

/**
 * Password validation schema with requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/,
    'Password must include uppercase, lowercase, number, and special character'
  );

/**
 * UUID validation schema
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * Pagination parameters schema
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), 'Page must be a number')
    .transform((val) => (val ? Number(val) : 1)),
  limit: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), 'Limit must be a number')
    .refine((val) => !val || Number(val) <= 100, 'Limit cannot exceed 100')
    .transform((val) => (val ? Number(val) : 10)),
});

/**
 * User login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

/**
 * User registration schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});

/**
 * Upload file schema
 */
export const fileUploadSchema = z.object({
  file: z
    .any()
    .refine((file) => file !== undefined, 'File is required')
    .refine(
      (file) => file?.size <= 10 * 1024 * 1024,
      'File size must be less than 10MB'
    ),
  fileType: z
    .enum(['document', 'image', 'data'], { 
      errorMap: () => ({ message: 'File type must be document, image, or data' })
    })
    .optional(),
  description: z.string().optional(),
});

/**
 * Query filter schema
 */
export const filterSchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  startDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Start date must be a valid date'
    ),
  endDate: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'End date must be a valid date'
    ),
});

/**
 * OAuth state validation schema
 */
export const oauthStateSchema = z.object({
  redirectUrl: z.string().url('Invalid redirect URL'),
  nonce: z.string().min(10, 'Invalid nonce value'),
  expiresAt: z.number().int().positive('Invalid expiration time'),
});

/**
 * Proxy auth validation schema
 */
export const proxyAuthSchema = z.object({
  token: z.string().min(1, 'Proxy token is required'),
  service: z.enum(['external-system-1', 'external-system-2'], {
    errorMap: () => ({ message: 'Invalid service identifier' }),
  }),
});

/**
 * API key validation schema
 */
export const apiKeySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  expiresIn: z
    .number()
    .int()
    .positive()
    .max(365 * 24 * 60 * 60, 'Expiry cannot exceed 1 year')
    .optional()
    .default(30 * 24 * 60 * 60), // 30 days default
  scopes: z.array(
    z.enum(['read', 'write', 'admin'], {
      errorMap: () => ({ message: 'Scope must be read, write, or admin' }),
    })
  ),
}); 