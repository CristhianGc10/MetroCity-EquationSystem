// backend/src/controllers/EquationController.ts

import type { Request, Response } from 'express';
import { EquationService } from '../services/EquationService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Controlador de Ecuaciones
 * Maneja las rutas HTTP relacionadas con ecuaciones
 */
export class EquationController {
  private equationService: EquationService;

  constructor() {
    this.equationService = new EquationService();
  }

  /**
   * POST /api/equations
   * Crear nueva ecuación
   */
  async createEquation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { equation } = req.body;
      const userId = req.user?.id;

      if (!equation || !userId) {
        res.status(400).json({ 
          error: 'Equation and user ID are required' 
        });
        return;
      }

      const result = await this.equationService.processEquation(equation, userId);
      
      res.status(201).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error creating equation:', error);
      res.status(500).json({
        error: 'Failed to process equation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/equations/:id
   * Obtener ecuación por ID
   */
  async getEquation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id || !userId) {
        res.status(400).json({ 
          error: 'Equation ID and user ID are required' 
        });
        return;
      }

      const result = await this.equationService.getEquation(id, userId);
      
      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting equation:', error);
      res.status(404).json({
        error: 'Equation not found',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/equations/:id/validate-step
   * Validar paso del estudiante
   */
  async validateStep(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { step, stepIndex } = req.body;
      const userId = req.user?.id;

      if (!id || !step || stepIndex === undefined || !userId) {
        res.status(400).json({ 
          error: 'All fields are required' 
        });
        return;
      }

      const result = await this.equationService.validateStudentStep(
        id, 
        userId, 
        step, 
        stepIndex
      );
      
      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error validating step:', error);
      res.status(500).json({
        error: 'Failed to validate step',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/equations/:id/generate-similar
   * Generar ecuación similar
   */
  async generateSimilar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { difficulty } = req.body;
      const userId = req.user?.id;

      if (!id || !userId) {
        res.status(400).json({ 
          error: 'Equation ID and user ID are required' 
        });
        return;
      }

      const result = await this.equationService.generateSimilarEquation(
        id, 
        userId, 
        difficulty
      );
      
      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error generating similar equation:', error);
      res.status(500).json({
        error: 'Failed to generate similar equation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/users/:userId/progress
   * Obtener progreso del usuario
   */
  async getUserProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user?.id;

      // Verificar permisos (usuario solo puede ver su propio progreso)
      if (userId !== requestingUserId) {
        res.status(403).json({ 
          error: 'Forbidden' 
        });
        return;
      }

      const result = await this.equationService.getUserProgress(userId);
      
      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting user progress:', error);
      res.status(500).json({
        error: 'Failed to get user progress',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/users/:userId/error-analysis
   * Análisis de errores del usuario
   */
  async analyzeUserErrors(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user?.id;

      if (userId !== requestingUserId) {
        res.status(403).json({ 
          error: 'Forbidden' 
        });
        return;
      }

      const result = await this.equationService.analyzeUserErrors(userId);
      
      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error analyzing user errors:', error);
      res.status(500).json({
        error: 'Failed to analyze user errors',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}