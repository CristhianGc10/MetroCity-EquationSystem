// backend/src/routes/users.ts

import { Router } from 'express';
import { EquationController } from '../controllers/EquationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const equationController = new EquationController();

// Middleware aplicado a todas las rutas de usuarios
router.use(authMiddleware);

/**
 * @route   GET /api/users/:userId/progress
 * @desc    Obtener progreso del usuario
 * @access  Private
 */
router.get(
  '/:userId/progress',
  equationController.getUserProgress.bind(equationController)
);

/**
 * @route   GET /api/users/:userId/error-analysis
 * @desc    Análisis de errores del usuario
 * @access  Private
 */
router.get(
  '/:userId/error-analysis',
  equationController.analyzeUserErrors.bind(equationController)
);

export default router;