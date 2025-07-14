// src/engines/equation/StepGenerator.ts

import type {
    EquationAST,
    Step,
    StepSequence,
    Expression,
    EngineConfig
  } from '../../types/equation/EquationTypes';
  
  import { ExpressionEvaluator } from './Evaluator';
  
  /**
   * Generador de Pasos de Solución
   * Crea secuencias optimizadas de pasos para resolver ecuaciones lineales
   */
  export class StepGenerator {
    private evaluator: ExpressionEvaluator;
  
    constructor(config: EngineConfig) {
      // Config se guarda implícitamente para uso futuro
      this.evaluator = new ExpressionEvaluator();
    }
  
    // ============================================================================
    // MÉTODO PRINCIPAL
    // ============================================================================
  
    /**
     * Genera la secuencia óptima de pasos para resolver una ecuación
     */
    public generateOptimalSequence(equation: EquationAST): StepSequence {
      try {
        const steps = this.analyzeAndGenerateSteps(equation);
        
        return {
          steps,
          isOptimal: true,
          estimatedTime: this.estimateTimeForSteps(steps),
          alternativeExists: this.hasAlternativeMethod(equation)
        };
  
      } catch (error) {
        // Secuencia de respaldo en caso de error
        return {
          steps: this.generateFallbackSteps(equation),
          isOptimal: false,
          estimatedTime: 300, // 5 minutos estimados
          alternativeExists: false
        };
      }
    }
  
    // ============================================================================
    // ANÁLISIS Y GENERACIÓN
    // ============================================================================
  
    /**
     * Analiza la ecuación y genera los pasos apropiados
     */
    private analyzeAndGenerateSteps(equation: EquationAST): Step[] {
      // Determinar estrategia basada en el tipo de ecuación
      switch (equation.equationType) {
        case 'basic':
          return this.generateBasicSteps(equation);
          
        case 'standard':
          return this.generateStandardSteps(equation);
          
        case 'distributive':
          return this.generateDistributiveSteps(equation);
          
        case 'complex':
          return this.generateComplexSteps(equation);
          
        case 'fractional':
          return this.generateFractionalSteps(equation);
          
        default:
          return this.generateStandardSteps(equation);
      }
    }
  
    // ============================================================================
    // GENERADORES POR TIPO DE ECUACIÓN
    // ============================================================================
  
    /**
     * Genera pasos para ecuaciones básicas (ax + b = 0)
     */
    private generateBasicSteps(equation: EquationAST): Step[] {
      const steps: Step[] = [];
      let currentEquation = equation;
      
      // Paso 1: Identificar si hay términos en ambos lados
      if (this.needsTermTransposition(currentEquation)) {
        const transposeStep = this.createTranspositionStep(currentEquation);
        steps.push(transposeStep);
        currentEquation = this.applyStep(currentEquation);
      }
      
      // Paso 2: Aislar la variable
      const isolationStep = this.createIsolationStep(currentEquation);
      steps.push(isolationStep);
      
      return steps;
    }
  
    /**
     * Genera pasos para ecuaciones estándar (ax + b = cx + d)
     */
    private generateStandardSteps(equation: EquationAST): Step[] {
      const steps: Step[] = [];
      let currentEquation = equation;
      
      // Paso 1: Combinar términos semejantes si es necesario
      if (this.needsTermCombination(currentEquation)) {
        const combineStep = this.createCombinationStep(currentEquation);
        steps.push(combineStep);
        currentEquation = this.applyStep(currentEquation);
      }
      
      // Paso 2: Transponer términos con variables
      const transposeVariableStep = this.createVariableTranspositionStep(currentEquation);
      steps.push(transposeVariableStep);
      currentEquation = this.applyStep(currentEquation);
      
      // Paso 3: Transponer términos constantes
      const transposeConstantStep = this.createConstantTranspositionStep(currentEquation);
      steps.push(transposeConstantStep);
      currentEquation = this.applyStep(currentEquation);
      
      // Paso 4: Aislar la variable
      const isolationStep = this.createIsolationStep(currentEquation);
      steps.push(isolationStep);
      
      return steps;
    }
  
    /**
     * Genera pasos para ecuaciones distributivas
     */
    private generateDistributiveSteps(equation: EquationAST): Step[] {
      const steps: Step[] = [];
      let currentEquation = equation;
      
      // Paso 1: Aplicar propiedad distributiva
      if (this.needsDistribution(currentEquation)) {
        const distributiveStep = this.createDistributiveStep(currentEquation);
        steps.push(distributiveStep);
        currentEquation = this.applyStep(currentEquation);
      }
      
      // Paso 2: Combinar términos semejantes
      const combineStep = this.createCombinationStep(currentEquation);
      steps.push(combineStep);
      currentEquation = this.applyStep(currentEquation);
      
      // Seguir con pasos estándar
      const remainingSteps = this.generateStandardSteps(currentEquation);
      steps.push(...remainingSteps);
      
      return steps;
    }
  
    /**
     * Genera pasos para ecuaciones complejas
     */
    private generateComplexSteps(equation: EquationAST): Step[] {
      // Para ecuaciones complejas, usar una estrategia híbrida
      return this.generateDistributiveSteps(equation);
    }
  
    /**
     * Genera pasos para ecuaciones fraccionarias
     */
    private generateFractionalSteps(equation: EquationAST): Step[] {
      const steps: Step[] = [];
      let currentEquation = equation;
      
      // Paso 1: Multiplicar ambos lados por el denominador común
      const clearFractionsStep = this.createClearFractionsStep(currentEquation);
      steps.push(clearFractionsStep);
      currentEquation = this.applyStep(currentEquation);
      
      // Seguir con pasos estándar
      const remainingSteps = this.generateStandardSteps(currentEquation);
      steps.push(...remainingSteps);
      
      return steps;
    }
  
    // ============================================================================
    // CREADORES DE PASOS ESPECÍFICOS
    // ============================================================================
  
    /**
     * Crea un paso de transposición de términos
     */
    private createTranspositionStep(equation: EquationAST): Step {
      const leftConstant = this.evaluator.getConstantTerm(equation.left);
      
      return {
        id: this.generateStepId(),
        type: 'transposition',
        description: this.generateTranspositionDescription(leftConstant),
        fromExpression: equation.left,
        toExpression: this.createTransposedExpression(equation),
        justification: 'Se transponen los términos aplicando la propiedad de igualdad',
        difficulty: 2,
        hints: [
          'Para mantener la igualdad, lo que se hace a un lado debe hacerse al otro',
          'Si un término está sumando, pasa al otro lado restando'
        ]
      };
    }
  
    /**
     * Crea un paso de aislamiento de variable
     */
    private createIsolationStep(equation: EquationAST): Step {
      const variable = equation.variables[0];
      const coefficient = this.evaluator.getVariableCoefficient(equation.left, variable);
      
      return {
        id: this.generateStepId(),
        type: 'isolation',
        description: `Dividir ambos lados entre ${Math.abs(coefficient)} para aislar ${variable}`,
        fromExpression: equation.left,
        toExpression: this.createIsolatedExpression(equation),
        justification: `Aplicamos la propiedad de división para aislar la variable ${variable}`,
        difficulty: 2,
        hints: [
          `Para aislar ${variable}, dividimos ambos lados entre su coeficiente`,
          'La división es la operación inversa de la multiplicación'
        ]
      };
    }
  
    /**
     * Crea un paso de combinación de términos semejantes
     */
    private createCombinationStep(equation: EquationAST): Step {
      return {
        id: this.generateStepId(),
        type: 'combination',
        description: 'Combinar términos semejantes',
        fromExpression: equation.left,
        toExpression: this.evaluator.simplifyExpression(equation.left),
        justification: 'Los términos con la misma variable se pueden combinar sumando sus coeficientes',
        difficulty: 1,
        hints: [
          'Los términos semejantes tienen la misma variable',
          'Suma o resta solo los coeficientes, la variable permanece igual'
        ]
      };
    }
  
    /**
     * Crea un paso de aplicación de propiedad distributiva
     */
    private createDistributiveStep(equation: EquationAST): Step {
      return {
        id: this.generateStepId(),
        type: 'distribution',
        description: 'Aplicar propiedad distributiva',
        fromExpression: equation.left,
        toExpression: this.createDistributedExpression(equation.left),
        justification: 'Se aplica la propiedad distributiva: a(b + c) = ab + ac',
        difficulty: 3,
        hints: [
          'Multiplica el término exterior por cada término dentro del paréntesis',
          'No olvides mantener los signos correctos'
        ]
      };
    }
  
    /**
     * Crea un paso para eliminar fracciones
     */
    private createClearFractionsStep(equation: EquationAST): Step {
      return {
        id: this.generateStepId(),
        type: 'multiplication',
        description: 'Multiplicar ambos lados para eliminar fracciones',
        fromExpression: equation.left,
        toExpression: this.createClearedFractionsExpression(equation.left),
        justification: 'Multiplicamos por el mínimo común múltiplo de los denominadores',
        difficulty: 4,
        hints: [
          'Encuentra el mínimo común múltiplo de todos los denominadores',
          'Multiplica todos los términos por este valor'
        ]
      };
    }
  
    /**
     * Crea un paso de transposición de variables
     */
    private createVariableTranspositionStep(equation: EquationAST): Step {
      return {
        id: this.generateStepId(),
        type: 'transposition',
        description: 'Transponer términos con variables al lado izquierdo',
        fromExpression: equation.left,
        toExpression: this.createVariableTransposedExpression(equation),
        justification: 'Agrupamos todos los términos con variables en un lado',
        difficulty: 2,
        hints: [
          'Mueve todos los términos con variables al lado izquierdo',
          'Cambia el signo cuando muevas términos'
        ]
      };
    }
  
    /**
     * Crea un paso de transposición de constantes
     */
    private createConstantTranspositionStep(equation: EquationAST): Step {
      return {
        id: this.generateStepId(),
        type: 'transposition',
        description: 'Transponer términos constantes al lado derecho',
        fromExpression: equation.left,
        toExpression: this.createConstantTransposedExpression(equation),
        justification: 'Agrupamos todos los términos constantes en el lado derecho',
        difficulty: 2,
        hints: [
          'Mueve todos los números al lado derecho',
          'Recuerda cambiar el signo al transponer'
        ]
      };
    }
  
    // ============================================================================
    // UTILIDADES DE ANÁLISIS
    // ============================================================================
  
    /**
     * Verifica si necesita transposición de términos
     */
    private needsTermTransposition(equation: EquationAST): boolean {
      const rightConstant = this.evaluator.getConstantTerm(equation.right);
      const rightVariable = this.evaluator.getVariableCoefficient(equation.right, equation.variables[0]);
      
      return Math.abs(rightConstant) > 1e-10 || Math.abs(rightVariable) > 1e-10;
    }
  
    /**
     * Verifica si necesita combinación de términos
     */
    private needsTermCombination(equation: EquationAST): boolean {
      const leftTerms = equation.left.terms || [];
      const rightTerms = equation.right.terms || [];
      
      // Contar términos del mismo tipo
      const variableTermsLeft = leftTerms.filter(t => !t.isConstant).length;
      const constantTermsLeft = leftTerms.filter(t => t.isConstant).length;
      const variableTermsRight = rightTerms.filter(t => !t.isConstant).length;
      const constantTermsRight = rightTerms.filter(t => t.isConstant).length;
      
      return variableTermsLeft > 1 || constantTermsLeft > 1 || 
             variableTermsRight > 1 || constantTermsRight > 1;
    }
  
    /**
     * Verifica si necesita aplicar propiedad distributiva
     */
    private needsDistribution(equation: EquationAST): boolean {
      // Simplificado: buscar coeficientes mayores a 1 en términos con variables
      const allTerms = [...(equation.left.terms || []), ...(equation.right.terms || [])];
      return allTerms.some(term => !term.isConstant && Math.abs(term.coefficient) > 1);
    }
  
    /**
     * Verifica si hay métodos alternativos de solución
     */
    private hasAlternativeMethod(equation: EquationAST): boolean {
      // Las ecuaciones distributivas y complejas suelen tener métodos alternativos
      return ['distributive', 'complex', 'fractional'].includes(equation.equationType);
    }
  
    // ============================================================================
    // CREADORES DE EXPRESIONES TRANSFORMADAS
    // ============================================================================
  
    /**
     * Crea expresión después de transposición
     */
    private createTransposedExpression(equation: EquationAST): Expression {
      // Simplificado: retornar la expresión simplificada
      return this.evaluator.simplifyExpression(equation.left);
    }
  
    /**
     * Crea expresión después de aislamiento
     */
    private createIsolatedExpression(equation: EquationAST): Expression {
      const variable = equation.variables[0];
      return {
        type: 'binary_operation',
        terms: [{
          coefficient: 1,
          variable,
          exponent: 1,
          isConstant: false,
          position: { start: 0, end: 1 }
        }],
        simplified: true
      };
    }
  
    /**
     * Crea expresión después de aplicar distributiva
     */
    private createDistributedExpression(expression: Expression): Expression {
      // Simplificado: retornar la expresión simplificada
      return this.evaluator.simplifyExpression(expression);
    }
  
    /**
     * Crea expresión después de eliminar fracciones
     */
    private createClearedFractionsExpression(expression: Expression): Expression {
      // Simplificado: multiplicar coeficientes por 2 (asumiendo denominador común de 2)
      return this.evaluator.multiplyByScalar(expression, 2);
    }
  
    /**
     * Crea expresión después de transponer variables
     */
    private createVariableTransposedExpression(equation: EquationAST): Expression {
      return this.evaluator.simplifyExpression(equation.left);
    }
  
    /**
     * Crea expresión después de transponer constantes
     */
    private createConstantTransposedExpression(equation: EquationAST): Expression {
      return this.evaluator.simplifyExpression(equation.left);
    }
  
    // ============================================================================
    // UTILIDADES Y HELPERS
    // ============================================================================
  
    /**
     * Aplica un paso a una ecuación (simplificado)
     */
    private applyStep(equation: EquationAST): EquationAST {
      // En una implementación completa, esto aplicaría la transformación específica
      // Por ahora, retornamos la ecuación original
      return equation;
    }
  
    /**
     * Genera descripción para transposición
     */
    private generateTranspositionDescription(leftConstant: number): string {
      if (Math.abs(leftConstant) > 1e-10) {
        return `Transponer ${leftConstant > 0 ? '+' : ''}${leftConstant} al lado derecho`;
      }
      return 'Reorganizar términos';
    }
  
    /**
     * Estima el tiempo necesario para completar los pasos
     */
    private estimateTimeForSteps(steps: Step[]): number {
      const timePerStep = {
        'transposition': 45,
        'combination': 30,
        'distribution': 60,
        'isolation': 30,
        'multiplication': 50
      };
  
      let totalTime = 0;
      for (const step of steps) {
        totalTime += (timePerStep[step.type as keyof typeof timePerStep] || 40) * step.difficulty;
      }
  
      return totalTime; // En segundos
    }
  
    /**
     * Genera pasos de respaldo en caso de error
     */
    private generateFallbackSteps(equation: EquationAST): Step[] {
      return [{
        id: this.generateStepId(),
        type: 'combination',
        description: 'Simplificar la ecuación',
        fromExpression: equation.left,
        toExpression: equation.right,
        justification: 'Paso de resolución básico',
        difficulty: 1,
        hints: ['Verifica la ecuación y aplica operaciones básicas']
      }];
    }
  
    /**
     * Genera un ID único para el paso
     */
    private generateStepId(): string {
      return `step_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
  }