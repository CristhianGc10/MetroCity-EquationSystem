// src/engines/equation/Evaluator.ts

import type {
  Expression,
  Term,
  EquationAST
} from '../../types/equation/EquationTypes';

/**
 * Evaluador de Expresiones Matemáticas
 * Calcula valores numéricos de expresiones algebraicas
 */
export class ExpressionEvaluator {
  
  // ============================================================================
  // MÉTODOS PRINCIPALES DE EVALUACIÓN
  // ============================================================================

  /**
   * Evalúa una expresión sustituyendo una variable por un valor
   */
  public evaluateWithSubstitution(expression: Expression, variable: string, value: number): number {
    if (!expression.terms || expression.terms.length === 0) {
      return 0;
    }

    let result = 0;

    for (const term of expression.terms) {
      const termValue = this.evaluateTerm(term, variable, value);
      result += termValue;
    }

    return result;
  }

  /**
   * Evalúa una expresión con múltiples sustituciones de variables
   */
  public evaluateWithMultipleSubstitutions(
    expression: Expression, 
    substitutions: { [variable: string]: number }
  ): number {
    if (!expression.terms || expression.terms.length === 0) {
      return 0;
    }

    let result = 0;

    for (const term of expression.terms) {
      const termValue = this.evaluateTermWithMultipleVars(term, substitutions);
      result += termValue;
    }

    return result;
  }

  /**
   * Evalúa si dos expresiones son equivalentes para valores dados
   */
  public areExpressionsEquivalent(
    expr1: Expression, 
    expr2: Expression, 
    testValues: { [variable: string]: number }[]
  ): boolean {
    // Probar con múltiples valores para verificar equivalencia
    for (const values of testValues) {
      const result1 = this.evaluateWithMultipleSubstitutions(expr1, values);
      const result2 = this.evaluateWithMultipleSubstitutions(expr2, values);
      
      if (Math.abs(result1 - result2) > 1e-10) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Verifica si una ecuación es satisfecha por los valores dados
   */
  public verifyEquationSolution(equation: EquationAST, values: { [variable: string]: number }): boolean {
    const leftResult = this.evaluateWithMultipleSubstitutions(equation.left, values);
    const rightResult = this.evaluateWithMultipleSubstitutions(equation.right, values);
    
    return Math.abs(leftResult - rightResult) < 1e-10;
  }

  // ============================================================================
  // EVALUACIÓN DE TÉRMINOS
  // ============================================================================

  /**
   * Evalúa un término individual con una sustitución
   */
  private evaluateTerm(term: Term, variable: string, value: number): number {
    if (term.isConstant) {
      // Término constante
      return term.coefficient;
    }

    if (term.variable === variable) {
      // Término con la variable a sustituir
      const exponent = term.exponent || 1;
      return term.coefficient * Math.pow(value, exponent);
    }

    // Término con variable diferente - no se puede evaluar
    throw new Error(`No se puede evaluar el término con variable '${term.variable}' - valor no proporcionado`);
  }

  /**
   * Evalúa un término con múltiples variables
   */
  private evaluateTermWithMultipleVars(term: Term, substitutions: { [variable: string]: number }): number {
    if (term.isConstant) {
      return term.coefficient;
    }

    if (!term.variable) {
      throw new Error('Término no constante sin variable definida');
    }

    const variableValue = substitutions[term.variable];
    if (variableValue === undefined) {
      throw new Error(`Valor no proporcionado para la variable '${term.variable}'`);
    }

    const exponent = term.exponent || 1;
    return term.coefficient * Math.pow(variableValue, exponent);
  }

  // ============================================================================
  // UTILIDADES DE ANÁLISIS
  // ============================================================================

  /**
   * Obtiene el coeficiente de una variable específica en una expresión
   */
  public getVariableCoefficient(expression: Expression, variable: string): number {
    if (!expression.terms) {
      return 0;
    }

    let coefficient = 0;
    
    for (const term of expression.terms) {
      if (term.variable === variable) {
        coefficient += term.coefficient;
      }
    }

    return coefficient;
  }

  /**
   * Obtiene el término constante de una expresión
   */
  public getConstantTerm(expression: Expression): number {
    if (!expression.terms) {
      return 0;
    }

    let constant = 0;
    
    for (const term of expression.terms) {
      if (term.isConstant) {
        constant += term.coefficient;
      }
    }

    return constant;
  }

  /**
   * Simplifica una expresión combinando términos semejantes
   */
  public simplifyExpression(expression: Expression): Expression {
    if (!expression.terms || expression.terms.length === 0) {
      return expression;
    }

    // Agrupar términos por variable
    const termGroups: { [key: string]: Term } = {};

    for (const term of expression.terms) {
      const key = term.variable || 'constant';
      
      if (termGroups[key]) {
        // Combinar coeficientes
        termGroups[key].coefficient += term.coefficient;
      } else {
        // Crear nueva entrada
        termGroups[key] = { ...term };
      }
    }

    // Filtrar términos con coeficiente cero y convertir a array
    const simplifiedTerms = Object.values(termGroups).filter(
      term => Math.abs(term.coefficient) > 1e-10
    );

    return {
      ...expression,
      terms: simplifiedTerms,
      simplified: true
    };
  }

  /**
   * Calcula la derivada de una expresión respecto a una variable
   */
  public differentiate(expression: Expression, variable: string): Expression {
    if (!expression.terms) {
      return this.createZeroExpression();
    }

    const derivativeTerms: Term[] = [];

    for (const term of expression.terms) {
      if (term.isConstant) {
        // La derivada de una constante es 0 - no agregar término
        continue;
      }

      if (term.variable !== variable) {
        // La derivada respecto a una variable diferente es 0
        continue;
      }

      const exponent = term.exponent || 1;
      
      if (exponent === 1) {
        // La derivada de ax es a
        derivativeTerms.push({
          coefficient: term.coefficient,
          isConstant: true,
          position: term.position
        });
      } else {
        // La derivada de ax^n es n*a*x^(n-1)
        derivativeTerms.push({
          coefficient: term.coefficient * exponent,
          variable: term.variable,
          exponent: exponent - 1,
          isConstant: false,
          position: term.position
        });
      }
    }

    return {
      type: 'binary_operation',
      terms: derivativeTerms,
      simplified: false
    };
  }

  // ============================================================================
  // OPERACIONES ALGEBRAICAS
  // ============================================================================

  /**
   * Suma dos expresiones
   */
  public addExpressions(expr1: Expression, expr2: Expression): Expression {
    const allTerms = [
      ...(expr1.terms || []),
      ...(expr2.terms || [])
    ];

    const result: Expression = {
      type: 'binary_operation',
      terms: allTerms,
      simplified: false
    };

    return this.simplifyExpression(result);
  }

  /**
   * Resta dos expresiones (expr1 - expr2)
   */
  public subtractExpressions(expr1: Expression, expr2: Expression): Expression {
    const expr2Negated = this.negateExpression(expr2);
    return this.addExpressions(expr1, expr2Negated);
  }

  /**
   * Multiplica una expresión por un escalar
   */
  public multiplyByScalar(expression: Expression, scalar: number): Expression {
    if (!expression.terms) {
      return expression;
    }

    const multipliedTerms = expression.terms.map(term => ({
      ...term,
      coefficient: term.coefficient * scalar
    }));

    return {
      ...expression,
      terms: multipliedTerms,
      simplified: false
    };
  }

  /**
   * Niega una expresión (multiplica por -1)
   */
  public negateExpression(expression: Expression): Expression {
    return this.multiplyByScalar(expression, -1);
  }

  // ============================================================================
  // ANÁLISIS Y VALIDACIÓN
  // ============================================================================

  /**
   * Verifica si una expresión es cero
   */
  public isZeroExpression(expression: Expression): boolean {
    if (!expression.terms || expression.terms.length === 0) {
      return true;
    }

    // Simplificar primero
    const simplified = this.simplifyExpression(expression);
    
    return simplified.terms!.every(term => Math.abs(term.coefficient) < 1e-10);
  }

  /**
   * Verifica si una expresión es una constante
   */
  public isConstantExpression(expression: Expression): boolean {
    if (!expression.terms || expression.terms.length === 0) {
      return true;
    }

    return expression.terms.every(term => term.isConstant);
  }

  /**
   * Obtiene todas las variables presentes en una expresión
   */
  public getVariables(expression: Expression): string[] {
    if (!expression.terms) {
      return [];
    }

    const variables = new Set<string>();
    
    for (const term of expression.terms) {
      if (term.variable && !term.isConstant) {
        variables.add(term.variable);
      }
    }

    return Array.from(variables);
  }

  /**
   * Calcula el grado de una expresión (mayor exponente)
   */
  public getDegree(expression: Expression, variable?: string): number {
    if (!expression.terms || expression.terms.length === 0) {
      return 0;
    }

    let maxDegree = 0;

    for (const term of expression.terms) {
      if (term.isConstant) {
        continue;
      }

      if (variable && term.variable !== variable) {
        continue;
      }

      const exponent = term.exponent || 1;
      maxDegree = Math.max(maxDegree, exponent);
    }

    return maxDegree;
  }

  // ============================================================================
  // UTILIDADES Y HELPERS
  // ============================================================================

  /**
   * Crea una expresión que representa cero
   */
  private createZeroExpression(): Expression {
    return {
      type: 'binary_operation',
      terms: [],
      simplified: true
    };
  }

  /**
   * Genera valores de prueba para verificación
   */
  public generateTestValues(variables: string[], count: number = 5): { [variable: string]: number }[] {
    const testValues: { [variable: string]: number }[] = [];
    
    for (let i = 0; i < count; i++) {
      const values: { [variable: string]: number } = {};
      
      for (const variable of variables) {
        // Generar valores variados: algunos enteros, algunos decimales, algunos negativos
        const randomValue = Math.random() * 20 - 10; // Entre -10 y 10
        values[variable] = Math.round(randomValue * 100) / 100; // Redondear a 2 decimales
      }
      
      testValues.push(values);
    }
    
    return testValues;
  }

  /**
   * Formatea una expresión como string para depuración
   */
  public expressionToString(expression: Expression): string {
    if (!expression.terms || expression.terms.length === 0) {
      return '0';
    }

    const termStrings = expression.terms.map((term, index) => {
      let str = '';
      
      // Signo
      if (index > 0) {
        str += term.coefficient >= 0 ? ' + ' : ' - ';
      } else if (term.coefficient < 0) {
        str += '-';
      }
      
      // Coeficiente
      const absCoeff = Math.abs(term.coefficient);
      if (term.isConstant) {
        str += absCoeff.toString();
      } else if (absCoeff === 1) {
        str += term.variable || '';
      } else {
        str += absCoeff + (term.variable || '');
      }
      
      // Exponente
      if (term.exponent && term.exponent !== 1) {
        str += `^${term.exponent}`;
      }
      
      return str;
    });

    return termStrings.join('');
  }
}