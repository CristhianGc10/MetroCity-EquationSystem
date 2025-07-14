"use strict";
// backend/src/middleware/auth.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware de autenticación JWT
 */
const authMiddleware = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = {
            id: decoded.userId || decoded.id,
            email: decoded.email,
            role: decoded.role || 'student'
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                error: 'Invalid token',
                message: 'The provided token is invalid or expired'
            });
        }
        else {
            res.status(500).json({
                error: 'Authentication error',
                message: 'Failed to authenticate user'
            });
        }
    }
};
exports.authMiddleware = authMiddleware;
