"use strict";
// backend/src/utils/errors.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.PermissionError = exports.NotFoundError = exports.AuthenticationError = exports.ValidationError = void 0;
/**
 * Clases de error personalizadas para la aplicación
 */
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        Error.captureStackTrace(this, ValidationError);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
        Error.captureStackTrace(this, AuthenticationError);
    }
}
exports.AuthenticationError = AuthenticationError;
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        Error.captureStackTrace(this, NotFoundError);
    }
}
exports.NotFoundError = NotFoundError;
class PermissionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PermissionError';
        Error.captureStackTrace(this, PermissionError);
    }
}
exports.PermissionError = PermissionError;
class RateLimitError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RateLimitError';
        Error.captureStackTrace(this, RateLimitError);
    }
}
exports.RateLimitError = RateLimitError;
