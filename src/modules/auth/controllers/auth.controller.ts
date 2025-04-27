import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../types/auth.types';

/**
 * Mock authentication controller
 */
class AuthController {
  /**
   * Mock login endpoint
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Always succeed with mock user
      res.status(200).json({
        success: true,
        message: 'Login successful',
        tokens: {
          accessToken: `mock_access_token_${uuidv4()}`,
          refreshToken: `mock_refresh_token_${uuidv4()}`,
          expiresIn: 900 // 15 minutes
        },
        user: {
          id: 'mock-user-id',
          email: email || 'user@example.com',
          name: 'Mock User',
          role: UserRole.USER
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mock refresh token endpoint
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Always succeed with new tokens
      res.status(200).json({
        success: true,
        message: 'Token refresh successful',
        tokens: {
          accessToken: `mock_access_token_${uuidv4()}`,
          refreshToken: `mock_refresh_token_${uuidv4()}`,
          expiresIn: 900 // 15 minutes
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mock logout endpoint
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Always succeed
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
