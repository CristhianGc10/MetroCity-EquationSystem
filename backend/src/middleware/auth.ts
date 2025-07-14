// backend/src/middleware/auth.ts

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware de autenticación JWT
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // En desarrollo, permitir bypass de autenticación para testing
    if (process.env.NODE_ENV === 'development' && !req.headers.authorization) {
      req.user = {
        id: 'test-user-123',
        email: 'test@example.com',
        role: 'student'
      };
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No valid authorization header provided'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const jwtSecret = process.env.JWT_SECRET || 'development-secret-key';
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role || 'student'
    };

    next();

  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    } else {
      res.status(500).json({
        error: 'Authentication error',
        message: 'Failed to authenticate user'
      });
    }
  }
};