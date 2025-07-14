// src/engines/equation/EquationEngine.ts

import type { 
    EquationAST, 
    Solution, 
    Step, 
    ValidationResult, 
    ParseResult,
    EngineConfig,
    EquationType,
    Expression,
    OperationType,
    SolutionMethod,
    StepSequence
  } from '../../types/equation/EquationTypes';
  
  import { DEFAULT_ENGINE_CONFIG } from '../../types/equation/EquationTypes';
  
  import { AlgebraicParser } from './Parser';
  import { ExpressionEvaluator } from './Evaluator';
  import { StepGenerator } from './StepGenerator';
  import { EquationValidator } from './Validator';
  
  /**
   * Motor Principal de Ecuaciones Lineales
   * Sistema completo para parsing, análisis y resolución de ecuaciones
   */
  export class EquationEngine {
    private parser: AlgebraicParser;
    private evaluator: ExpressionEvaluator;
    private stepGenerator: StepGenerator;
    private validator: EquationValidator;
    private config: EngineConfig;
  
    constructor(config: Partial<EngineConfig> = {}) {
      this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
      this.parser = new AlgebraicParser(this.config);
      this.evaluator = new ExpressionEvaluator();
      this.stepGenerator = new StepGenerator(this.config);
      this.validator = new EquationValidator();
    }
  
    // ============================================================================
    // MÉTODOS PRINCIPALES DE LA API
    // ============================================================================
  
    /**
     * Parsea una ecuación desde string a AST
     */
    public parse(equation: string): ParseResult {
      const startTime = performance.now();
      
      try {
        // Validación inicial
        const validation = this.validator.validateInput(equation);
        if (!validation.isValid) {
          return {
            ast: null,
            tokens: [],
            errors: validation.errors,
            warnings: validation.warnings,
            parseTime: performance.now() - startTime
          };
        }
  
        // Parsing
        const result = this.parser.parseEquation(equation);
        
        // Análisis adicional del AST
        if (result.ast) {
          result.ast = this.enhanceAST(result.ast);
        }
  
        result.parseTime = performance.now() - startTime;
        return result;
  
      } catch (error) {
        return {
          ast: null,
          tokens: [],
          errors: [{
            type: 'syntax_error',
            message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
            severity: 'critical'
          }],
          warnings: [],
          parseTime: performance.now() - startTime
        };
      }
    }
  
    /**
     * Resuelve una ecuación completamente
     */
    public solve(equation: EquationAST): Solution {
      try {
        // Generar secuencia de pasos
        const stepSequence = this.generateSteps(equation);
        
        // Aplicar pasos para obtener la solución
        const solution = this.applySolutionSteps(equation, stepSequence.steps);
        
        // Verificar la solución
        const verification = this.verifySolution(equation, solution);
        
        return {
          ...solution,
          verificationsSteps: verification,
          confidence: this.calculateConfidence(solution, verification)
        };
  
      } catch (error) {
        throw new Error(`Error al resolver ecuación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
  
    /**
     * Genera secuencia de pasos para resolver la ecuación
     */
    public generateSteps(equation: EquationAST): StepSequence {
      return this.stepGenerator.generateOptimalSequence(equation);
    }
  
    /**
     * Valida un paso individual del estudiante
     */
    public validateStep(currentEquation: EquationAST, attemptedStep: Step, expectedSteps: Step[]): ValidationResult {
      return this.validator.validateStudentStep(currentEquation, attemptedStep, expectedSteps);
    }
  
    /**
     * Obtiene el tipo de ecuación automáticamente
     */
    public getEquationType(equation: EquationAST): EquationType {
      return this.parser.detectEquationType(equation);
    }
  
    // ============================================================================
    // MÉTODOS DE ANÁLISIS Y MEJORA
    // ============================================================================
  
    /**
     * Mejora el AST con metadatos adicionales
     */
    private enhanceAST(ast: EquationAST): EquationAST {
      const enhanced = { ...ast };
      
      // Detectar tipo de ecuación
      enhanced.equationType = this.parser.detectEquationType(ast);
      
      // Extraer variables
      enhanced.variables = this.extractVariables(ast);
      
      // Calcular complejidad
      enhanced.complexity = this.calculateComplexity(ast);
      
      // Estimar número de pasos
      enhanced.metadata.estimatedSteps = this.estimateSteps(ast);
      
      // Determinar operaciones requeridas
      enhanced.metadata.requiredOperations = this.analyzeRequiredOperations(ast);
  
      return enhanced;
    }
  
    /**
     * Extrae todas las variables de la ecuación
     */
    private extractVariables(ast: EquationAST): string[] {
      const variables = new Set<string>();
      
      const extractFromExpression = (expr: Expression) => {
        if (expr.terms) {
          expr.terms.forEach(term => {
            if (term.variable) {
              variables.add(term.variable);
            }
          });
        }
      };
  
      extractFromExpression(ast.left);
      extractFromExpression(ast.right);
      
      return Array.from(variables);
    }
  
    /**
     * Calcula la complejidad de la ecuación
     */
    private calculateComplexity(ast: EquationAST): number {
      let complexity = 0;
      
      // Factores de complejidad
      const leftTerms = ast.left.terms?.length || 0;
      const rightTerms = ast.right.terms?.length || 0;
      
      complexity += leftTerms + rightTerms;
      
      // Bonus por tipo de ecuación
      const typeComplexity = {
        'basic': 1,
        'standard': 2,
        'distributive': 3,
        'complex': 5,
        'fractional': 4,
        'multi_step': 6
      };
      
      complexity += typeComplexity[ast.equationType] || 1;
      
      return Math.min(complexity, 10); // Máximo 10
    }
  
    /**
     * Estima el número de pasos necesarios
     */
    private estimateSteps(ast: EquationAST): number {
      const baseSteps = {
        'basic': 2,
        'standard': 3,
        'distributive': 4,
        'complex': 6,
        'fractional': 5,
        'multi_step': 8
      };
      
      let steps = baseSteps[ast.equationType] || 3;
      
      // Ajustar por complejidad adicional
      if (ast.complexity > 5) {
        steps += Math.floor(ast.complexity / 2);
      }
      
      return Math.min(steps, this.config.maxSteps);
    }
  
    /**
     * Analiza las operaciones que serán necesarias
     */
    private analyzeRequiredOperations(ast: EquationAST): OperationType[] {
      const operations: OperationType[] = [];
      
      // Análisis basado en tipo de ecuación
      switch (ast.equationType) {
        case 'basic':
          operations.push('transposition', 'isolation');
          break;
          
        case 'standard':
          operations.push('transposition', 'combination', 'isolation');
          break;
          
        case 'distributive':
          operations.push('distribution', 'combination', 'transposition', 'isolation');
          break;
          
        case 'complex':
          operations.push('distribution', 'combination', 'transposition', 'isolation');
          break;
          
        case 'fractional':
          operations.push('multiplication', 'combination', 'isolation');
          break;
          
        default:
          operations.push('combination', 'transposition', 'isolation');
      }
      
      return operations;
    }
  
    // ============================================================================
    // MÉTODOS DE SOLUCIÓN
    // ============================================================================
  
    /**
     * Aplica la secuencia de pasos para obtener la solución final
     */
    private applySolutionSteps(equation: EquationAST, steps: Step[]): Omit<Solution, 'verificationsSteps' | 'confidence'> {
      if (equation.variables.length === 0) {
        throw new Error('No se encontraron variables en la ecuación');
      }
  
      const variable = equation.variables[0]; // Por ahora solo ecuaciones de una variable
      
      // Simular la aplicación de pasos (implementación simplificada)
      // En una implementación completa, esto aplicaría cada paso secuencialmente
      const finalValue = this.solveMathematically(equation, variable);
      
      const solutionMethod = this.determineSolutionMethod(equation);
      
      return {
        variable,
        value: finalValue,
        steps,
        solutionMethod
      };
    }
  
    /**
     * Resuelve matemáticamente la ecuación (método directo para validación)
     */
    private solveMathematically(equation: EquationAST, variable: string): number {
      // Implementación simplificada - en la versión completa usaríamos un CAS
      // Por ahora, implementamos casos básicos
      
      const leftTerms = equation.left.terms || [];
      const rightTerms = equation.right.terms || [];
      
      // Mover todos los términos al lado izquierdo
      let variableCoeff = 0;
      let constantTerm = 0;
      
      // Procesar lado izquierdo
      leftTerms.forEach(term => {
        if (term.variable === variable) {
          variableCoeff += term.coefficient;
        } else if (term.isConstant) {
          constantTerm += term.coefficient;
        }
      });
      
      // Procesar lado derecho (cambiar signo)
      rightTerms.forEach(term => {
        if (term.variable === variable) {
          variableCoeff -= term.coefficient;
        } else if (term.isConstant) {
          constantTerm -= term.coefficient;
        }
      });
      
      // Resolver: variableCoeff * x + constantTerm = 0
      // x = -constantTerm / variableCoeff
      
      if (Math.abs(variableCoeff) < 1e-10) {
        throw new Error('La ecuación no tiene solución única');
      }
      
      return -constantTerm / variableCoeff;
    }
  
    /**
     * Determina el método de solución más apropiado
     */
    private determineSolutionMethod(equation: EquationAST): SolutionMethod {
      switch (equation.equationType) {
        case 'basic':
          return 'direct_isolation';
        case 'distributive':
          return 'distribution_first';
        case 'fractional':
          return 'cross_multiplication';
        default:
          return 'combination_first';
      }
    }
  
    /**
     * Verifica la solución sustituyendo en la ecuación original
     */
    private verifySolution(equation: EquationAST, solution: Omit<Solution, 'verificationsSteps' | 'confidence'>) {
      const substitution = `${solution.variable} = ${solution.value}`;
      
      // Evaluar lado izquierdo
      const leftResult = this.evaluator.evaluateWithSubstitution(
        equation.left, 
        solution.variable, 
        solution.value
      );
      
      // Evaluar lado derecho  
      const rightResult = this.evaluator.evaluateWithSubstitution(
        equation.right, 
        solution.variable, 
        solution.value
      );
      
      const tolerance = 1e-10;
      const isValid = Math.abs(leftResult - rightResult) < tolerance;
      
      return [{
        substitution,
        leftSideResult: leftResult,
        rightSideResult: rightResult,
        isValid
      }];
    }
  
    /**
     * Calcula la confianza en la solución
     */
    private calculateConfidence(
      solution: Omit<Solution, 'verificationsSteps' | 'confidence'>, 
      verification: any[]
    ): number {
      if (verification.length === 0) return 0;
      
      const isVerified = verification.every(v => v.isValid);
      if (!isVerified) return 0;
      
      // Factores de confianza
      let confidence = 0.8; // Base
      
      // Bonus por método de solución
      const methodBonus = {
        'direct_isolation': 0.2,
        'distribution_first': 0.15,
        'combination_first': 0.1,
        'cross_multiplication': 0.15,
        'elimination': 0.05
      };
      
      confidence += methodBonus[solution.solutionMethod] || 0;
      
      return Math.min(confidence, 1.0);
    }
  
    // ============================================================================
    // UTILIDADES Y CONFIGURACIÓN
    // ============================================================================
  
    /**
     * Actualiza la configuración del motor
     */
    public updateConfig(newConfig: Partial<EngineConfig>): void {
      this.config = { ...this.config, ...newConfig };
      
      // Reinicializar componentes si es necesario
      this.parser = new AlgebraicParser(this.config);
      this.stepGenerator = new StepGenerator(this.config);
    }
  
    /**
     * Obtiene la configuración actual
     */
    public getConfig(): EngineConfig {
      return { ...this.config };
    }
  
    /**
     * Obtiene estadísticas del motor
     */
    public getStats() {
      return {
        supportedTypes: this.config.supportedTypes,
        maxComplexity: this.config.maxComplexity,
        version: '1.0.0'
      };
    }
  }