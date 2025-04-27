import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/auth.types';

// Add user to request object
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        name: string;
      };
    }
  }
}

/**
 * Mock authentication middleware that always succeeds
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  // Set mock user in request
  req.user = {
    id: 'mock-user-id',
    email: 'user@example.com',
    name: 'Mock User',
    role: UserRole.USER
  };

  next();
};

/**
 * Mock authorization middleware that checks for admin role
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  // For testing, you can modify this to either succeed or fail
  const shouldSucceed = true;

  if (shouldSucceed) {
    req.user = {
      id: 'mock-admin-id',
      email: 'admin@example.com',
      name: 'Mock Admin',
      role: UserRole.ADMIN
    };
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access forbidden. Admin role required.'
    });
  }
};
