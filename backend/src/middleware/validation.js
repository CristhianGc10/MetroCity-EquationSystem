"use strict";
// backend/src/middleware/validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequestBody = void 0;
/**
 * Middleware de validación del cuerpo de la petición
 */
const validateRequestBody = (schema) => {
    return (req, res, next) => {
        const errors = [];
        // Verificar campos requeridos
        Object.entries(schema).forEach(([field, rule]) => {
            const value = req.body[field];
            if (rule.required && (value === undefined || value === null)) {
                errors.push(`Field '${field}' is required`);
                return;
            }
            if (value === undefined || value === null) {
                return; // Campo opcional no presente
            }
            // Validar tipo
            if (!validateType(value, rule.type)) {
                errors.push(`Field '${field}' must be of type ${rule.type}`);
                return;
            }
            // Validaciones específicas por tipo
            if (rule.type === 'string') {
                if (rule.minLength && value.length < rule.minLength) {
                    errors.push(`Field '${field}' must be at least ${rule.minLength} characters long`);
                }
                if (rule.maxLength && value.length > rule.maxLength) {
                    errors.push(`Field '${field}' must be at most ${rule.maxLength} characters long`);
                }
                if (rule.pattern && !rule.pattern.test(value)) {
                    errors.push(`Field '${field}' format is invalid`);
                }
                if (rule.enum && !rule.enum.includes(value)) {
                    errors.push(`Field '${field}' must be one of: ${rule.enum.join(', ')}`);
                }
            }
            if (rule.type === 'number') {
                if (rule.min !== undefined && value < rule.min) {
                    errors.push(`Field '${field}' must be at least ${rule.min}`);
                }
                if (rule.max !== undefined && value > rule.max) {
                    errors.push(`Field '${field}' must be at most ${rule.max}`);
                }
            }
        });
        if (errors.length > 0) {
            res.status(400).json({
                error: 'Validation failed',
                message: 'Request body validation failed',
                details: errors
            });
            return;
        }
        next();
    };
};
exports.validateRequestBody = validateRequestBody;
/**
 * Valida el tipo de un valor
 */
function validateType(value, expectedType) {
    switch (expectedType) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && !isNaN(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'object':
            return typeof value === 'object' && value !== null && !Array.isArray(value);
        case 'array':
            return Array.isArray(value);
        default:
            return false;
    }
}
