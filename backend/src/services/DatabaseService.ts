// backend/src/services/DatabaseService.ts

import type { EquationAST, Solution, Step } from '../../../frontend/src/types/equation/EquationTypes';

/**
 * Servicio de Base de Datos
 * Maneja todas las operaciones de persistencia
 * Implementación simulada para Phase 1.2
 */
export class DatabaseService {
  private mockData: Map<string, any> = new Map();

  constructor() {
    console.log('DatabaseService initialized (mock implementation)');
  }

  async saveEquation(data: {
    id: string;
    userId: string;
    originalInput: string;
    ast: EquationAST;
    parseResult: any;
    createdAt: Date;
    status: string;
  }): Promise<string> {
    console.log('DatabaseService: Saving equation:', data.id);
    
    // Simulación de guardado en base de datos
    this.mockData.set(`equation_${data.id}`, {
      ...data,
      savedAt: new Date()
    });
    
    // Simular latencia de base de datos
    await this.delay(50);
    
    return data.id;
  }

  async getEquation(equationId: string): Promise<EquationAST> {
    console.log('DatabaseService: Getting equation:', equationId);
    
    const data = this.mockData.get(`equation_${equationId}`);
    
    if (!data) {
      throw new Error(`Equation ${equationId} not found`);
    }
    
    await this.delay(30);
    return data.ast;
  }

  async saveSolution(equationId: string, solution: Solution): Promise<void> {
    console.log('DatabaseService: Saving solution for equation:', equationId);
    
    this.mockData.set(`solution_${equationId}`, {
      solution,
      savedAt: new Date()
    });
    
    await this.delay(40);
  }

  async getSolution(equationId: string): Promise<Solution> {
    console.log('DatabaseService: Getting solution for equation:', equationId);
    
    const data = this.mockData.get(`solution_${equationId}`);
    
    if (!data) {
      // Retornar solución por defecto para testing
      return {
        variable: 'x',
        value: 2,
        steps: [],
        verificationsSteps: [{
          substitution: 'x = 2',
          leftSideResult: 7,
          rightSideResult: 7,
          isValid: true
        }],
        solutionMethod: 'direct_isolation',
        confidence: 0.95
      };
    }
    
    await this.delay(30);
    return data.solution;
  }

  async saveSteps(equationId: string, steps: Step[]): Promise<void> {
    console.log('DatabaseService: Saving steps for equation:', equationId, `(${steps.length} steps)`);
    
    this.mockData.set(`steps_${equationId}`, {
      steps,
      savedAt: new Date()
    });
    
    await this.delay(45);
  }

  async getSteps(equationId: string): Promise<Step[]> {
    console.log('DatabaseService: Getting steps for equation:', equationId);
    
    const data = this.mockData.get(`steps_${equationId}`);
    
    if (!data) {
      // Retornar pasos por defecto para testing
      return [
        {
          id: 'default_step_1',
          type: 'transposition',
          description: 'Transponer término constante',
          fromExpression: {} as any,
          toExpression: {} as any,
          justification: 'Aplicar propiedad de igualdad',
          difficulty: 2,
          hints: ['Mover términos al otro lado cambiando el signo']
        },
        {
          id: 'default_step_2',
          type: 'isolation',
          description: 'Aislar la variable',
          fromExpression: {} as any,
          toExpression: {} as any,
          justification: 'Dividir entre el coeficiente',
          difficulty: 1,
          hints: ['Dividir ambos lados entre el coeficiente de la variable']
        }
      ];
    }
    
    await this.delay(35);
    return data.steps;
  }

  async userHasAccessToEquation(userId: string, equationId: string): Promise<boolean> {
    console.log('DatabaseService: Checking access for user:', userId, 'equation:', equationId);
    
    const equationData = this.mockData.get(`equation_${equationId}`);
    
    // En la implementación simulada, siempre permitir acceso
    // En la implementación real, verificar ownership
    await this.delay(20);
    
    if (!equationData) {
      return false;
    }
    
    return equationData.userId === userId || userId === 'test-user-123';
  }

  async recordStepAttempt(data: {
    equationId: string;
    userId: string;
    stepIndex: number;
    attemptedStep: Step;
    isCorrect: boolean;
    timestamp: Date;
  }): Promise<void> {
    console.log('DatabaseService: Recording step attempt:', {
      equationId: data.equationId,
      userId: data.userId,
      stepIndex: data.stepIndex,
      isCorrect: data.isCorrect
    });
    
    const attemptKey = `attempt_${data.equationId}_${data.stepIndex}_${Date.now()}`;
    this.mockData.set(attemptKey, data);
    
    await this.delay(30);
  }

  async getUserStatistics(userId: string): Promise<{
    totalEquations: number;
    solvedEquations: number;
    averageTime: number;
    strengthsByType: { [type: string]: number };
  }> {
    console.log('DatabaseService: Getting user statistics:', userId);
    
    await this.delay(40);
    
    // Datos simulados para testing
    return {
      totalEquations: Math.floor(Math.random() * 20) + 5,
      solvedEquations: Math.floor(Math.random() * 15) + 3,
      averageTime: Math.floor(Math.random() * 180) + 60, // 60-240 segundos
      strengthsByType: {
        basic: Math.random() * 0.4 + 0.6,        // 0.6-1.0
        standard: Math.random() * 0.5 + 0.4,      // 0.4-0.9
        distributive: Math.random() * 0.6 + 0.2,  // 0.2-0.8
        complex: Math.random() * 0.4 + 0.1        // 0.1-0.5
      }
    };
  }

  async getRecentUserActivity(userId: string, limit: number): Promise<any[]> {
    console.log('DatabaseService: Getting recent activity for user:', userId, 'limit:', limit);
    
    await this.delay(35);
    
    // Actividad simulada
    const activities = [];
    const now = new Date();
    
    for (let i = 0; i < Math.min(limit, 5); i++) {
      const activityDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // i días atrás
      
      activities.push({
        id: `activity_${i}`,
        type: ['equation_solved', 'step_completed', 'hint_used'][Math.floor(Math.random() * 3)],
        timestamp: activityDate,
        details: {
          equationId: `eq_${Date.now()}_${i}`,
          performance: Math.random() * 0.4 + 0.6 // 0.6-1.0
        }
      });
    }
    
    return activities;
  }

  async getUserErrors(userId: string): Promise<any[]> {
    console.log('DatabaseService: Getting user errors:', userId);
    
    await this.delay(30);
    
    // Errores simulados para análisis
    return [
      {
        type: 'calculation_error',
        frequency: Math.floor(Math.random() * 5) + 1,
        lastOccurrence: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        context: 'transposition'
      },
      {
        type: 'sign_error',
        frequency: Math.floor(Math.random() * 3) + 1,
        lastOccurrence: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
        context: 'isolation'
      },
      {
        type: 'order_error',
        frequency: Math.floor(Math.random() * 4) + 1,
        lastOccurrence: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
        context: 'step_sequence'
      }
    ];
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  /**
   * Simula latencia de base de datos
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpia datos simulados (útil para testing)
   */
  public clearMockData(): void {
    this.mockData.clear();
    console.log('DatabaseService: Mock data cleared');
  }

  /**
   * Obtiene estadísticas del servicio
   */
  public getServiceStats() {
    return {
      mockDataEntries: this.mockData.size,
      isSimulated: true,
      version: '1.0.0-mock'
    };
  }
}