"use strict";
// backend/src/routes/equations.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EquationController_1 = require("../controllers/EquationController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const rateLimit_1 = require("../middleware/rateLimit");
const router = (0, express_1.Router)();
const equationController = new EquationController_1.EquationController();
// Middleware aplicado a todas las rutas de ecuaciones
router.use(auth_1.authMiddleware);
router.use(rateLimit_1.rateLimitMiddleware);
/**
 * @route   POST /api/equations
 * @desc    Crear nueva ecuación
 * @access  Private
 */
router.post('/', (0, validation_1.validateRequestBody)({
    equation: { type: 'string', required: true, minLength: 1 }
}), equationController.createEquation.bind(equationController));
/**
 * @route   GET /api/equations/:id
 * @desc    Obtener ecuación por ID
 * @access  Private
 */
router.get('/:id', equationController.getEquation.bind(equationController));
/**
 * @route   POST /api/equations/:id/validate-step
 * @desc    Validar paso de solución del estudiante
 * @access  Private
 */
router.post('/:id/validate-step', (0, validation_1.validateRequestBody)({
    step: { type: 'object', required: true },
    stepIndex: { type: 'number', required: true, min: 0 }
}), equationController.validateStep.bind(equationController));
/**
 * @route   POST /api/equations/:id/generate-similar
 * @desc    Generar ecuación similar para práctica
 * @access  Private
 */
router.post('/:id/generate-similar', (0, validation_1.validateRequestBody)({
    difficulty: {
        type: 'string',
        required: false,
        enum: ['easier', 'same', 'harder']
    }
}), equationController.generateSimilar.bind(equationController));
exports.default = router;
