"use strict";
// backend/src/server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const rateLimit_1 = require("./middleware/rateLimit");
// Cargar variables de entorno
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// ============================================================================
// MIDDLEWARES GLOBALES
// ============================================================================
// Seguridad
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "https://api.metrocity.edu"]
        }
    }
}));
// CORS
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
}));
// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
// Rate limiting global
app.use(rateLimit_1.rateLimitMiddleware);
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ============================================================================
// RUTAS
// ============================================================================
// API routes
app.use('/api', routes_1.default);
// Ruta de bienvenida
app.get('/', (req, res) => {
    res.json({
        message: 'MetroCity Equation Engine API',
        version: process.env.VERSION || '1.0.0',
        status: 'active',
        documentation: '/api/docs',
        health: '/api/health'
    });
});
// Ruta para recursos no encontrados
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        availableRoutes: [
            'GET /',
            'GET /api/health',
            'POST /api/equations',
            'GET /api/equations/:id',
            'POST /api/equations/:id/validate-step',
            'GET /api/users/:userId/progress'
        ]
    });
});
// ============================================================================
// MANEJO DE ERRORES
// ============================================================================
// Middleware global de manejo de errores
app.use((error, req, res, next) => {
    console.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    // Error genérico del servidor
    res.status(500).json(Object.assign({ error: 'Internal Server Error', message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : error.message }, (process.env.NODE_ENV !== 'production' && { stack: error.stack })));
});
// ============================================================================
// INICIO DEL SERVIDOR
// ============================================================================
const server = app.listen(PORT, () => {
    console.log(`
🏗️  MetroCity Equation Engine - Backend
🚀 Server running on port ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
📊 API available at: http://localhost:${PORT}/api
💚 Health check: http://localhost:${PORT}/api/health
⏰ Started at: ${new Date().toISOString()}
  `);
});
// Manejo graceful de cierre
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});
exports.default = app;
