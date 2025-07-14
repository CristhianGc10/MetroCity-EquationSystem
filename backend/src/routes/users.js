"use strict";
// backend/src/routes/users.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EquationController_1 = require("../controllers/EquationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const equationController = new EquationController_1.EquationController();
// Middleware aplicado a todas las rutas de usuarios
router.use(auth_1.authMiddleware);
/**
 * @route   GET /api/users/:userId/progress
 * @desc    Obtener progreso del usuario
 * @access  Private
 */
router.get('/:userId/progress', equationController.getUserProgress.bind(equationController));
/**
 * @route   GET /api/users/:userId/error-analysis
 * @desc    Análisis de errores del usuario
 * @access  Private
 */
router.get('/:userId/error-analysis', equationController.analyzeUserErrors.bind(equationController));
exports.default = router;
