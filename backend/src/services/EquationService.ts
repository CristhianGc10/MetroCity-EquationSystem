// backend/src/services/EquationService.ts

import type { 
  EquationAST, 
  Solution, 
  ValidationResult, 
  ParseResult, 
  Step,
  StepSequence
} from '../../../shared/types/EquationTypes';

import { EquationEngine } from '../engines/EquationEngine';
import { DatabaseService } from './DatabaseService';  
import { CacheService } from './CacheService';  
import { AnalyticsService } from './AnalyticsService';

/**
 * Servicio Principal de Ecuaciones - Backend
 * Maneja todas las operaciones relacionadas con ecuaciones
 */
export class EquationService {
  private equationEngine: EquationEngine;
  private database: DatabaseService;
  private cache: CacheService;
  private analytics: AnalyticsService;

  constructor() {
    this.equationEngine = new EquationEngine();
    this.database = new DatabaseService();
    this.cache = new CacheService();
    this.analytics = new AnalyticsService();
  }

  // ============================================================================
  // OPERACIONES PRINCIPALES
  // ============================================================================

  /**
   * Procesa una nueva ecuación del usuario
   */
  async processEquation(input: string, userId: string): Promise<{
    id: string;
    parseResult: ParseResult;
    solution?: Solution;
    steps?: StepSequence;
  }> {
    try {
      // 1. Verificar caché
      const cacheKey = this.generateCacheKey(input);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        await this.analytics.recordEquationAccess(userId, cached.id, 'cache_hit');
        return cached;
      }

      // 2. Parsear ecuación
      const parseResult = this.equationEngine.parse(input);
      
      if (!parseResult.ast) {
        throw new Error('No se pudo parsear la ecuación');
      }

      // 3. Generar ID y guardar en base de datos
      const equationId = await this.database.saveEquation({
        id: parseResult.ast.metadata.id,
        userId,
        originalInput: input,
        ast: parseResult.ast,
        parseResult,
        createdAt: new Date(),
        status: 'active'
      });

      // 4. Generar solución y pasos
      const solution = this.equationEngine.solve(parseResult.ast);
      const steps = this.equationEngine.generateSteps(parseResult.ast);

      // 5. Guardar resultados
      await this.database.saveSolution(equationId, solution);
      await this.database.saveSteps(equationId, steps.steps);

      // 6. Preparar respuesta
      const result = {
        id: equationId,
        parseResult,
        solution,
        steps
      };

      // 7. Cachear resultado
      await this.cache.set(cacheKey, result, 3600); // 1 hora

      // 8. Registrar analytics
      await this.analytics.recordEquationCreation(userId, equationId, parseResult.ast);

      return result;

    } catch (error) {
      await this.analytics.recordError(userId, 'equation_processing', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Obtiene una ecuación por ID
   */
  async getEquation(equationId: string, userId: string): Promise<{
    equation: EquationAST;
    solution: Solution;
    steps: Step[];
  }> {
    try {
      // Verificar permisos
      const hasAccess = await this.database.userHasAccessToEquation(userId, equationId);
      if (!hasAccess) {
        throw new Error('No tienes permisos para acceder a esta ecuación');
      }

      // Obtener datos
      const equation = await this.database.getEquation(equationId);
      const solution = await this.database.getSolution(equationId);
      const steps = await this.database.getSteps(equationId);

      await this.analytics.recordEquationAccess(userId, equationId, 'direct_access');

      return { equation, solution, steps };

    } catch (error) {
      await this.analytics.recordError(userId, 'equation_retrieval', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Valida un paso del estudiante
   */
  async validateStudentStep(
    equationId: string,
    userId: string,
    attemptedStep: Step,
    currentStepIndex: number
  ): Promise<ValidationResult & { 
    isCorrect: boolean; 
    nextHint?: string;
    progress: number 
  }> {
    try {
      // Obtener ecuación y pasos esperados
      const equation = await this.database.getEquation(equationId);
      const expectedSteps = await this.database.getSteps(equationId);

      // Validar paso
      const validation = this.equationEngine.validateStep(
        equation, 
        attemptedStep, 
        expectedSteps
      );

      // Determinar si es correcto
      const isCorrect = validation.isValid && 
        this.isStepCorrect(attemptedStep, expectedSteps[currentStepIndex]);

      // Calcular progreso
      const progress = (currentStepIndex + (isCorrect ? 1 : 0)) / expectedSteps.length;

      // Generar hint si es necesario
      let nextHint: string | undefined;
      if (!isCorrect && currentStepIndex < expectedSteps.length) {
        nextHint = await this.generateHint(equation, expectedSteps[currentStepIndex], attemptedStep);
      }

      // Registrar intento
      await this.database.recordStepAttempt({
        equationId,
        userId,
        stepIndex: currentStepIndex,
        attemptedStep,
        isCorrect,
        timestamp: new Date()
      });

      await this.analytics.recordStepAttempt(userId, equationId, currentStepIndex, isCorrect);

      return {
        ...validation,
        isCorrect,
        nextHint,
        progress
      };

    } catch (error) {
      await this.analytics.recordError(userId, 'step_validation', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Genera una nueva ecuación similar para práctica
   */
  async generateSimilarEquation(
    baseEquationId: string,
    userId: string,
    difficulty?: 'easier' | 'same' | 'harder'
  ): Promise<{
    id: string;
    equation: string;
    context?: string;
  }> {
    try {
      const baseEquation = await this.database.getEquation(baseEquationId);
      
      // Generar variación
      const variation = await this.generateEquationVariation(baseEquation, difficulty);
      
      // Procesar nueva ecuación
      const result = await this.processEquation(variation.equation, userId);
      
      await this.analytics.recordSimilarEquationGeneration(userId, baseEquationId, result.id);
      
      return {
        id: result.id,
        equation: variation.equation,
        context: variation.context
      };

    } catch (error) {
      await this.analytics.recordError(userId, 'similar_equation_generation', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // ============================================================================
  // OPERACIONES DE ANÁLISIS
  // ============================================================================

  /**
   * Obtiene estadísticas de progreso del usuario
   */
  async getUserProgress(userId: string): Promise<{
    totalEquations: number;
    solvedEquations: number;
    averageTime: number;
    strengthsByType: { [type: string]: number };
    recentActivity: any[];
  }> {
    try {
      const stats = await this.database.getUserStatistics(userId);
      const recentActivity = await this.database.getRecentUserActivity(userId, 10);
      
      return {
        totalEquations: stats.totalEquations,
        solvedEquations: stats.solvedEquations,
        averageTime: stats.averageTime,
        strengthsByType: stats.strengthsByType,
        recentActivity
      };

    } catch (error) {
      await this.analytics.recordError(userId, 'progress_retrieval', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Identifica patrones de error del usuario
   */
  async analyzeUserErrors(userId: string): Promise<{
    commonErrors: string[];
    suggestions: string[];
    weakTopics: string[];
  }> {
    try {
      const errorData = await this.database.getUserErrors(userId);
      
      const analysis = {
        commonErrors: this.identifyCommonErrors(errorData),
        suggestions: this.generateImprovementSuggestions(errorData),
        weakTopics: this.identifyWeakTopics(errorData)
      };

      await this.analytics.recordErrorAnalysis(userId, analysis);
      
      return analysis;

    } catch (error) {
      await this.analytics.recordError(userId, 'error_analysis', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  /**
   * Genera clave de caché para una ecuación
   */
  private generateCacheKey(input: string): string {
    // Normalizar entrada para caché consistente
    const normalized = input.toLowerCase().replace(/\s+/g, '');
    return `equation:${this.hashString(normalized)}`;
  }

  /**
   * Hash simple para strings
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Verifica si un paso es correcto comparándolo con el esperado
   */
  private isStepCorrect(attempted: Step, expected: Step): boolean {
    // Comparación simplificada - en implementación completa sería más robusta
    return attempted.type === expected.type &&
           this.stepsAreEquivalent(attempted, expected);
  }

  /**
   * Verifica equivalencia entre pasos
   */
  private stepsAreEquivalent(step1: Step, step2: Step): boolean {
    // Implementación simplificada
    try {
      // Comparar descripciones normalizadas
      const desc1 = step1.description.toLowerCase().trim();
      const desc2 = step2.description.toLowerCase().trim();
      
      if (desc1 === desc2) return true;
      
      // Comparar tipos y operaciones principales
      return step1.type === step2.type;
      
    } catch {
      return false;
    }
  }

  /**
   * Genera un hint personalizado para el estudiante
   */
  private async generateHint(
    equation: EquationAST,
    expectedStep: Step,
    attemptedStep: Step
  ): Promise<string> {
    // Análisis del error y generación de hint contextual
    const errorType = this.analyzeStepError(expectedStep, attemptedStep);
    
    const hints = {
      'wrong_operation': `Recuerda que en este paso necesitas ${this.getOperationDescription(expectedStep.type)}`,
      'calculation_error': 'Revisa tus cálculos, el procedimiento es correcto pero hay un error aritmético',
      'wrong_order': 'El paso es válido pero no es el siguiente en la secuencia óptima',
      'incomplete': 'El paso está incompleto, asegúrate de aplicar la operación a ambos lados',
      'default': expectedStep.hints?.[0] || 'Revisa el paso anterior y piensa en la operación inversa'
    };

    return hints[errorType as keyof typeof hints] || hints.default;
  }

  /**
   * Analiza el tipo de error en un paso
   */
  private analyzeStepError(expected: Step, attempted: Step): string {
    if (expected.type !== attempted.type) {
      return 'wrong_operation';
    }
    
    if (attempted.description.length < expected.description.length * 0.5) {
      return 'incomplete';
    }
    
    return 'calculation_error';
  }

  /**
   * Obtiene descripción amigable de una operación
   */
  private getOperationDescription(operationType: string): string {
    const descriptions = {
      'transposition': 'transponer términos al otro lado',
      'combination': 'combinar términos semejantes',
      'distribution': 'aplicar la propiedad distributiva',
      'isolation': 'aislar la variable',
      'multiplication': 'multiplicar ambos lados',
      'division': 'dividir ambos lados'
    };

    return descriptions[operationType as keyof typeof descriptions] || operationType;
  }

  /**
   * Genera variación de una ecuación existente
   */
  private async generateEquationVariation(
    baseEquation: EquationAST,
    difficulty: 'easier' | 'same' | 'harder' = 'same'
  ): Promise<{ equation: string; context?: string }> {
    // Implementación simplificada - generar variación cambiando coeficientes
    const variation = this.createCoefficientVariation(baseEquation, difficulty);
    
    return {
      equation: this.formatEquationString(variation),
      context: 'Ecuación generada para práctica adicional'
    };
  }

  /**
   * Crea variación cambiando coeficientes
   */
  private createCoefficientVariation(
    equation: EquationAST,
    difficulty: 'easier' | 'same' | 'harder'
  ): EquationAST {
    const multiplier = {
      'easier': 0.5 + Math.random() * 0.3, // 0.5 - 0.8
      'same': 0.8 + Math.random() * 0.4,   // 0.8 - 1.2
      'harder': 1.2 + Math.random() * 0.8  // 1.2 - 2.0
    }[difficulty];

    // Crear copia y modificar coeficientes
    const variation: EquationAST = JSON.parse(JSON.stringify(equation));
    
    variation.left.terms?.forEach(term => {
      if (!term.isConstant) {
        term.coefficient = Math.round(term.coefficient * multiplier);
      }
    });

    variation.right.terms?.forEach(term => {
      if (term.isConstant) {
        term.coefficient = Math.round(term.coefficient * multiplier);
      }
    });

    // Actualizar metadata
    variation.metadata.id = `var_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    variation.metadata.timestamp = Date.now();

    return variation;
  }

  /**
   * Formatea ecuación AST como string
   */
  private formatEquationString(equation: EquationAST): string {
    const formatSide = (terms: any[]) => {
      if (terms.length === 0) return '0';
      
      return terms.map((term, index) => {
        let str = '';
        
        if (index > 0) {
          str += term.coefficient >= 0 ? ' + ' : ' - ';
        } else if (term.coefficient < 0) {
          str += '-';
        }
        
        const absCoeff = Math.abs(term.coefficient);
        
        if (term.isConstant) {
          str += absCoeff;
        } else {
          if (absCoeff === 1) {
            str += term.variable;
          } else {
            str += absCoeff + term.variable;
          }
        }
        
        return str;
      }).join('');
    };

    const left = formatSide(equation.left.terms || []);
    const right = formatSide(equation.right.terms || []);
    
    return `${left} = ${right}`;
  }

  /**
   * Identifica errores comunes del usuario
   */
  private identifyCommonErrors(errorData: any[]): string[] {
    const errorCounts: { [key: string]: number } = {};
    
    errorData.forEach(error => {
      errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error]) => error);
  }

  /**
   * Genera sugerencias de mejora
   */
  private generateImprovementSuggestions(errorData: any[]): string[] {
    const suggestions = [
      'Practica más ecuaciones básicas para fortalecer los fundamentos',
      'Revisa el orden de operaciones antes de resolver',
      'Verifica siempre tu respuesta sustituyendo en la ecuación original'
    ];
    
    return suggestions.slice(0, 3);
  }

  /**
   * Identifica temas débiles
   */
  private identifyWeakTopics(errorData: any[]): string[] {
    // Análisis simplificado
    return ['transposition', 'distribution', 'combination'].slice(0, 2);
  }
}

export default EquationService;