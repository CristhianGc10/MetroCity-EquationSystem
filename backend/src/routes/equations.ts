// backend/src/routes/equations.ts

import { Router } from 'express';
import { EquationController } from '../controllers/EquationController';
import { authMiddleware } from '../middleware/auth';
import { validateRequestBody } from '../middleware/validation';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = Router();
const equationController = new EquationController();

// Middleware aplicado a todas las rutas de ecuaciones
router.use(authMiddleware);
router.use(rateLimitMiddleware);

/**
 * @route   POST /api/equations
 * @desc    Crear nueva ecuación
 * @access  Private
 */
router.post(
  '/',
  validateRequestBody({
    equation: { type: 'string', required: true, minLength: 1 }
  }),
  equationController.createEquation.bind(equationController)
);

/**
 * @route   GET /api/equations/:id
 * @desc    Obtener ecuación por ID
 * @access  Private
 */
router.get(
  '/:id',
  equationController.getEquation.bind(equationController)
);

/**
 * @route   POST /api/equations/:id/validate-step
 * @desc    Validar paso de solución del estudiante
 * @access  Private
 */
router.post(
  '/:id/validate-step',
  validateRequestBody({
    step: { type: 'object', required: true },
    stepIndex: { type: 'number', required: true, min: 0 }
  }),
  equationController.validateStep.bind(equationController)
);

/**
 * @route   POST /api/equations/:id/generate-similar
 * @desc    Generar ecuación similar para práctica
 * @access  Private
 */
router.post(
  '/:id/generate-similar',
  validateRequestBody({
    difficulty: { 
      type: 'string', 
      required: false, 
      enum: ['easier', 'same', 'harder'] 
    }
  }),
  equationController.generateSimilar.bind(equationController)
);

export default router;