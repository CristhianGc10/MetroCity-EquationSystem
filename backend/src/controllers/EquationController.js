"use strict";
// backend/src/controllers/EquationController.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquationController = void 0;
const EquationService_1 = require("../services/EquationService");
/**
 * Controlador de Ecuaciones
 * Maneja las rutas HTTP relacionadas con ecuaciones
 */
class EquationController {
    constructor() {
        this.equationService = new EquationService_1.EquationService();
    }
    /**
     * POST /api/equations
     * Crear nueva ecuación
     */
    createEquation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { equation } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!equation || !userId) {
                    res.status(400).json({
                        error: 'Equation and user ID are required'
                    });
                    return;
                }
                const result = yield this.equationService.processEquation(equation, userId);
                res.status(201).json({
                    success: true,
                    data: result
                });
            }
            catch (error) {
                console.error('Error creating equation:', error);
                res.status(500).json({
                    error: 'Failed to process equation',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * GET /api/equations/:id
     * Obtener ecuación por ID
     */
    getEquation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!id || !userId) {
                    res.status(400).json({
                        error: 'Equation ID and user ID are required'
                    });
                    return;
                }
                const result = yield this.equationService.getEquation(id, userId);
                res.json({
                    success: true,
                    data: result
                });
            }
            catch (error) {
                console.error('Error getting equation:', error);
                res.status(404).json({
                    error: 'Equation not found',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * POST /api/equations/:id/validate-step
     * Validar paso del estudiante
     */
    validateStep(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const { step, stepIndex } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!id || !step || stepIndex === undefined || !userId) {
                    res.status(400).json({
                        error: 'All fields are required'
                    });
                    return;
                }
                const result = yield this.equationService.validateStudentStep(id, userId, step, stepIndex);
                res.json({
                    success: true,
                    data: result
                });
            }
            catch (error) {
                console.error('Error validating step:', error);
                res.status(500).json({
                    error: 'Failed to validate step',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * POST /api/equations/:id/generate-similar
     * Generar ecuación similar
     */
    generateSimilar(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const { difficulty } = req.body;
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!id || !userId) {
                    res.status(400).json({
                        error: 'Equation ID and user ID are required'
                    });
                    return;
                }
                const result = yield this.equationService.generateSimilarEquation(id, userId, difficulty);
                res.json({
                    success: true,
                    data: result
                });
            }
            catch (error) {
                console.error('Error generating similar equation:', error);
                res.status(500).json({
                    error: 'Failed to generate similar equation',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * GET /api/users/:userId/progress
     * Obtener progreso del usuario
     */
    getUserProgress(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { userId } = req.params;
                const requestingUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                // Verificar permisos (usuario solo puede ver su propio progreso)
                if (userId !== requestingUserId) {
                    res.status(403).json({
                        error: 'Forbidden'
                    });
                    return;
                }
                const result = yield this.equationService.getUserProgress(userId);
                res.json({
                    success: true,
                    data: result
                });
            }
            catch (error) {
                console.error('Error getting user progress:', error);
                res.status(500).json({
                    error: 'Failed to get user progress',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
    /**
     * GET /api/users/:userId/error-analysis
     * Análisis de errores del usuario
     */
    analyzeUserErrors(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { userId } = req.params;
                const requestingUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (userId !== requestingUserId) {
                    res.status(403).json({
                        error: 'Forbidden'
                    });
                    return;
                }
                const result = yield this.equationService.analyzeUserErrors(userId);
                res.json({
                    success: true,
                    data: result
                });
            }
            catch (error) {
                console.error('Error analyzing user errors:', error);
                res.status(500).json({
                    error: 'Failed to analyze user errors',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
    }
}
exports.EquationController = EquationController;
