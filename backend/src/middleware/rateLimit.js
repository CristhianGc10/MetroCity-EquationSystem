"use strict";
// backend/src/middleware/rateLimit.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictRateLimitMiddleware = exports.rateLimitMiddleware = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Configuración de rate limiting
 */
exports.rateLimitMiddleware = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 requests por ventana por IP
    message: {
        error: 'Too many requests',
        message: 'Too many requests from this IP, please try again later',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
        var _a;
        // Usar user ID si está autenticado, sino IP
        return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.ip || 'unknown';
    },
    skip: (req) => {
        // Skip rate limiting para health checks
        return req.path === '/api/health';
    },
    handler: (req, res) => {
        var _a;
        console.warn(`Rate limit exceeded for ${((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.ip}`);
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
exports.strictRateLimitMiddleware = (0, express_rate_limit_1.default)({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 20, // Máximo 20 requests por ventana
    message: {
        error: 'Rate limit exceeded',
        message: 'Too many compute-intensive requests, please wait before trying again',
        retryAfter: '5 minutes'
    },
    keyGenerator: (req) => {
        var _a;
        return ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.ip || 'unknown';
    }
});
