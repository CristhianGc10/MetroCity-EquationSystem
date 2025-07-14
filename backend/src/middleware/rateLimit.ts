// backend/src/middleware/rateLimit.ts

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Configuración de rate limiting
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por ventana por IP
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request): string => {
    // Usar user ID si está autenticado, sino IP
    return (req as AuthenticatedRequest).user?.id || req.ip || 'unknown';
  },
  skip: (req: Request): boolean => {
    // Skip rate limiting para health checks
    return req.path === '/api/health';
  },
  handler: (req: Request, res: Response): void => {
    console.warn(`Rate limit exceeded for ${(req as AuthenticatedRequest).user?.id || req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Rate limiting más estricto para operaciones computacionalmente intensivas
 */
export const strictRateLimitMiddleware = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 20, // Máximo 20 requests por ventana
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many compute-intensive requests, please wait before trying again',
    retryAfter: '5 minutes'
  },
  keyGenerator: (req: Request): string => {
    return (req as AuthenticatedRequest).user?.id || req.ip || 'unknown';
  }
});