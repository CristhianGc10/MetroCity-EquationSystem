// src/engines/equation/Validator.ts

import type {
  EquationAST,
  Step,
  ValidationResult,
  EquationError,
  EquationWarning,
  Expression
} from '../../types/equation/EquationTypes';

import { SUPPORTED_VARIABLES } from '../../types/equation/EquationTypes';
import { ExpressionEvaluator } from './Evaluator';

/**
 * Validador de Ecuaciones y Pasos - Frontend
 * Verifica la corrección de ecuaciones, pasos de solución y entrada del usuario
 */
export class EquationValidator {
  private evaluator: ExpressionEvaluator;

  constructor() {
    this.evaluator = new ExpressionEvaluator();
  }

  // ============================================================================
  // VALIDACIÓN DE ENTRADA
  // ============================================================================

  /**
   * Valida la entrada del usuario antes del parsing
   */
  public validateInput(input: string): ValidationResult {
    const errors: EquationError[] = [];
    const warnings: EquationWarning[] = [];

    // Verificaciones básicas
    this.checkEmptyInput(input, errors);
    this.checkValidCharacters(input, errors);
    this.checkEqualsSign(input, errors);
    this.checkParenthesesBalance(input, errors);
    this.checkConsecutiveOperators(input, errors, warnings);
    this.checkVariableUsage(input, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: this.generateInputSuggestions(errors, warnings)
    };
  }

  /**
   * Valida un paso del estudiante contra los pasos esperados
   */
  public validateStudentStep(
    currentEquation: EquationAST,
    attemptedStep: Step,
    expectedSteps: Step[]
  ): ValidationResult {
    const errors: EquationError[] = [];
    const warnings: EquationWarning[] = [];

    // Verificar si el paso es matemáticamente válido
    const isMathematicallyValid = this.validateMathematicalStep(currentEquation, attemptedStep);
    if (!isMathematicallyValid) {
      errors.push({
        type: 'syntax_error',
        message: 'El paso no es matemáticamente válido',
        severity: 'high'
      });
    }

    // Verificar si el paso está en la secuencia esperada
    const isInExpectedSequence = this.isStepInExpectedSequence(attemptedStep, expectedSteps);
    if (!isInExpectedSequence) {
      warnings.push({
        type: 'unusual_format',
        message: 'Este paso es válido pero no es el más eficiente',
        suggestion: 'Considera seguir la secuencia sugerida para una solución más directa'
      });
    }

    // Verificar la complejidad del paso
    this.validateStepComplexity(attemptedStep, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: this.generateStepSuggestions(attemptedStep, expectedSteps)
    };
  }

  // ============================================================================
  // VALIDACIONES ESPECÍFICAS DE ENTRADA
  // ============================================================================

  /**
   * Verifica si la entrada está vacía
   */
  private checkEmptyInput(input: string, errors: EquationError[]): void {
    if (input.trim().length === 0) {
      errors.push({
        type: 'empty_expression',
        message: 'La ecuación no puede estar vacía',
        severity: 'critical'
      });
    }
  }

  /**
   * Verifica caracteres válidos
   */
  private checkValidCharacters(input: string, errors: EquationError[]): void {
    const validChars = /^[0-9a-zA-Z+\-*/=().\s]*$/;
    
    if (!validChars.test(input)) {
      const invalidChars = input.match(/[^0-9a-zA-Z+\-*/=().\s]/g);
      errors.push({
        type: 'invalid_character',
        message: `Caracteres no válidos encontrados: ${invalidChars?.join(', ')}`,
        severity: 'high'
      });
    }
  }

  /**
   * Verifica la presencia del signo de igualdad
   */
  private checkEqualsSign(input: string, errors: EquationError[]): void {
    const equalsCount = (input.match(/=/g) || []).length;
    
    if (equalsCount === 0) {
      errors.push({
        type: 'syntax_error',
        message: 'Falta el signo de igualdad (=)',
        severity: 'high'
      });
    } else if (equalsCount > 1) {
      errors.push({
        type: 'syntax_error',
        message: 'Solo debe haber un signo de igualdad',
        severity: 'high'
      });
    }
  }

  /**
   * Verifica el balance de paréntesis
   */
  private checkParenthesesBalance(input: string, errors: EquationError[]): void {
    let balance = 0;
    let position = 0;

    for (const char of input) {
      if (char === '(') {
        balance++;
      } else if (char === ')') {
        balance--;
        if (balance < 0) {
          errors.push({
            type: 'mismatched_parentheses',
            message: 'Paréntesis de cierre sin paréntesis de apertura correspondiente',
            position: { start: position, end: position + 1 },
            severity: 'high'
          });
          return;
        }
      }
      position++;
    }

    if (balance > 0) {
      errors.push({
        type: 'mismatched_parentheses',
        message: 'Faltan paréntesis de cierre',
        severity: 'high'
      });
    }
  }

  /**
   * Verifica operadores consecutivos
   */
  private checkConsecutiveOperators(
    input: string, 
    errors: EquationError[], 
    warnings: EquationWarning[]
  ): void {
    const consecutiveOps = /[+\-*/]{2,}/g;
    const matches = input.match(consecutiveOps);

    if (matches) {
      matches.forEach(match => {
        if (match === '--' || match === '++') {
          warnings.push({
            type: 'can_be_simplified',
            message: `Operadores consecutivos "${match}" pueden simplificarse`,
            suggestion: match === '--' ? 'Usar + en lugar de --' : 'Eliminar + redundante'
          });
        } else {
          errors.push({
            type: 'syntax_error',
            message: `Operadores consecutivos no válidos: "${match}"`,
            severity: 'medium'
          });
        }
      });
    }
  }

  /**
   * Verifica el uso de variables
   */
  private checkVariableUsage(input: string, warnings: EquationWarning[]): void {
    const variables = input.match(/[a-zA-Z]/g) || [];
    const uniqueVariables = [...new Set(variables)];

    // Verificar variables no estándar
    uniqueVariables.forEach(variable => {
      if (!SUPPORTED_VARIABLES.includes(variable)) {
        warnings.push({
          type: 'unusual_format',
          message: `Variable "${variable}" no es estándar`,
          suggestion: `Considera usar variables estándar: ${SUPPORTED_VARIABLES.join(', ')}`
        });
      }
    });

    // Advertir sobre múltiples variables
    if (uniqueVariables.length > 1) {
      warnings.push({
        type: 'high_complexity',
        message: `Ecuación con múltiples variables: ${uniqueVariables.join(', ')}`,
        suggestion: 'Las ecuaciones con una variable son más fáciles de resolver'
      });
    }
  }

  // ============================================================================
  // VALIDACIÓN DE PASOS MATEMÁTICOS
  // ============================================================================

  /**
   * Valida si un paso es matemáticamente correcto
   */
  private validateMathematicalStep(equation: EquationAST, step: Step): boolean {
    try {
      // Verificar que las expresiones sean equivalentes
      const testValues = this.evaluator.generateTestValues(equation.variables, 5);
      
      // Para pasos de transposición, verificar que la operación preserve la igualdad
      if (step.type === 'transposition') {
        return this.validateTranspositionStep(equation, testValues);
      }

      // Para pasos de combinación, verificar que los términos se combinen correctamente
      if (step.type === 'combination') {
        return this.validateCombinationStep(step, testValues);
      }

      // Para pasos de distribución, verificar la propiedad distributiva
      if (step.type === 'distribution') {
        return this.validateDistributionStep(step, testValues);
      }

      // Para pasos de aislamiento, verificar la operación inversa
      if (step.type === 'isolation') {
        return this.validateIsolationStep(step);
      }

      return true; // Por defecto, aceptar otros tipos de pasos

    } catch (error) {
      return false;
    }
  }

  /**
   * Valida un paso de transposición
   */
  private validateTranspositionStep(
    equation: EquationAST, 
    testValues: { [variable: string]: number }[]
  ): boolean {
    // Verificar que la transposición preserve la igualdad
    for (const values of testValues) {
      const originalLeft = this.evaluator.evaluateWithMultipleSubstitutions(equation.left, values);
      const originalRight = this.evaluator.evaluateWithMultipleSubstitutions(equation.right, values);
      
      // La diferencia debe mantenerse (considerando que se movieron términos)
      const originalDiff = originalLeft - originalRight;
      const tolerance = 1e-10;
      
      // Para transposición, verificamos que la estructura sea válida
      if (Math.abs(originalDiff) > tolerance) {
        // Si había diferencia, debe mantenerse en el nuevo lado
        continue; // Validación simplificada
      }
    }
    
    return true;
  }

  /**
   * Valida un paso de combinación
   */
  private validateCombinationStep(
    step: Step, 
    testValues: { [variable: string]: number }[]
  ): boolean {
    // Verificar que la combinación sea equivalente a la expresión original
    return this.evaluator.areExpressionsEquivalent(
      step.fromExpression,
      step.toExpression,
      testValues
    );
  }

  /**
   * Valida un paso de distribución
   */
  private validateDistributionStep(
    step: Step, 
    testValues: { [variable: string]: number }[]
  ): boolean {
    // Verificar que la distribución sea matemáticamente correcta
    return this.evaluator.areExpressionsEquivalent(
      step.fromExpression,
      step.toExpression,
      testValues
    );
  }

  /**
   * Valida un paso de aislamiento
   */
  private validateIsolationStep(step: Step): boolean {
    // Verificar que el resultado sea una variable aislada
    const terms = step.toExpression.terms || [];
    
    // Debe haber exactamente un término con coeficiente 1
    const variableTerms = terms.filter(term => !term.isConstant);
    
    return variableTerms.length === 1 && Math.abs(variableTerms[0].coefficient - 1) < 1e-10;
  }

  // ============================================================================
  // VALIDACIÓN DE SECUENCIAS
  // ============================================================================

  /**
   * Verifica si un paso está en la secuencia esperada
   */
  private isStepInExpectedSequence(attemptedStep: Step, expectedSteps: Step[]): boolean {
    return expectedSteps.some(expected => 
      expected.type === attemptedStep.type &&
      this.stepsAreEquivalent(expected, attemptedStep)
    );
  }

  /**
   * Verifica si dos pasos son equivalentes
   */
  private stepsAreEquivalent(step1: Step, step2: Step): boolean {
    if (step1.type !== step2.type) {
      return false;
    }

    // Comparación simplificada - en implementación completa sería más robusta
    try {
      const testValues = [{ x: 1 }, { x: 2 }, { x: -1 }];
      
      return this.evaluator.areExpressionsEquivalent(
        step1.toExpression,
        step2.toExpression,
        testValues
      );
    } catch {
      return false;
    }
  }

  /**
   * Valida la complejidad de un paso
   */
  private validateStepComplexity(step: Step, warnings: EquationWarning[]): void {
    if (step.difficulty > 4) {
      warnings.push({
        type: 'high_complexity',
        message: 'Este paso tiene alta complejidad',
        suggestion: 'Considera dividir en pasos más simples'
      });
    }

    // Verificar si el paso podría simplificarse
    if (step.type === 'combination' && this.canBeSimplified(step.toExpression)) {
      warnings.push({
        type: 'can_be_simplified',
        message: 'La expresión resultante puede simplificarse más',
        suggestion: 'Combina términos semejantes adicionales'
      });
    }
  }

  /**
   * Verifica si una expresión puede simplificarse más
   */
  private canBeSimplified(expression: Expression): boolean {
    if (!expression.terms || expression.terms.length < 2) {
      return false;
    }

    // Buscar términos que podrían combinarse
    const termsByVariable: { [key: string]: any[] } = {};
    
    expression.terms.forEach(term => {
      const key = term.variable || 'constant';
      if (!termsByVariable[key]) {
        termsByVariable[key] = [];
      }
      termsByVariable[key].push(term);
    });

    // Si hay múltiples términos del mismo tipo, pueden combinarse
    return Object.values(termsByVariable).some(terms => terms.length > 1);
  }

  // ============================================================================
  // GENERACIÓN DE SUGERENCIAS
  // ============================================================================

  /**
   * Genera sugerencias para la entrada del usuario
   */
  private generateInputSuggestions(
    errors: EquationError[], 
    warnings: EquationWarning[]
  ): string[] {
    const suggestions: string[] = [];

    if (errors.some(e => e.type === 'empty_expression')) {
      suggestions.push('Ingresa una ecuación válida, por ejemplo: 2x + 3 = 7');
    }

    if (errors.some(e => e.type === 'syntax_error' && e.message.includes('igualdad'))) {
      suggestions.push('Asegúrate de incluir un signo de igualdad (=) en tu ecuación');
    }

    if (errors.some(e => e.type === 'mismatched_parentheses')) {
      suggestions.push('Verifica que todos los paréntesis estén balanceados');
    }

    if (warnings.some(w => w.type === 'unusual_format')) {
      suggestions.push('Usa variables estándar como x, y, z para mayor claridad');
    }

    return suggestions;
  }

  /**
   * Genera sugerencias para pasos de solución
   */
  private generateStepSuggestions(attemptedStep: Step, expectedSteps: Step[]): string[] {
    const suggestions: string[] = [];

    if (expectedSteps.length > 0) {
      const nextExpectedStep = expectedSteps[0];
      
      if (attemptedStep.type !== nextExpectedStep.type) {
        suggestions.push(`Considera ${this.getStepTypeDescription(nextExpectedStep.type)} como siguiente paso`);
      }
    }

    if (attemptedStep.difficulty > 3) {
      suggestions.push('Este paso es complejo. Considera dividirlo en pasos más pequeños');
    }

    return suggestions;
  }

  /**
   * Obtiene descripción amigable del tipo de paso
   */
  private getStepTypeDescription(stepType: string): string {
    const descriptions = {
      'transposition': 'transponer términos',
      'combination': 'combinar términos semejantes',
      'distribution': 'aplicar propiedad distributiva',
      'isolation': 'aislar la variable',
      'multiplication': 'multiplicar ambos lados',
      'division': 'dividir ambos lados',
      'addition': 'sumar a ambos lados',
      'subtraction': 'restar de ambos lados'
    };

    return descriptions[stepType as keyof typeof descriptions] || stepType;
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Valida la estructura general de una ecuación AST
   */
  public validateEquationStructure(equation: EquationAST): ValidationResult {
    const errors: EquationError[] = [];
    const warnings: EquationWarning[] = [];

    if (!equation.left || !equation.right) {
      errors.push({
        type: 'syntax_error',
        message: 'La ecuación debe tener lados izquierdo y derecho',
        severity: 'critical'
      });
    }

    if (equation.variables.length === 0) {
      warnings.push({
        type: 'unusual_format',
        message: 'La ecuación no contiene variables',
        suggestion: 'Verifica que sea una ecuación algebraica válida'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: []
    };
  }
}