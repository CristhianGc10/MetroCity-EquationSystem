// src/utils/mathUtils.ts

import type { Term, Expression, EquationAST } from '../types/equation/EquationTypes';

/**
 * Utilidades Matemáticas para el Motor de Ecuaciones
 * Funciones auxiliares para operaciones matemáticas comunes
 */
export const mathUtils = {

  // ============================================================================
  // OPERACIONES CON NÚMEROS
  // ============================================================================

  /**
   * Verifica si un número es efectivamente cero (considerando tolerancia)
   */
  isZero(value: number, tolerance: number = 1e-10): boolean {
    return Math.abs(value) < tolerance;
  },

  /**
   * Verifica si dos números son iguales (considerando tolerancia)
   */
  areEqual(a: number, b: number, tolerance: number = 1e-10): boolean {
    return Math.abs(a - b) < tolerance;
  },

  /**
   * Redondea un número a una cantidad específica de decimales
   */
  roundToPrecision(value: number, decimals: number = 10): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },

  /**
   * Calcula el máximo común divisor de dos números
   */
  gcd(a: number, b: number): number {
    a = Math.abs(Math.floor(a));
    b = Math.abs(Math.floor(b));
    
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    
    return a || 1;
  },

  /**
   * Calcula el mínimo común múltiplo de dos números
   */
  lcm(a: number, b: number): number {
    return Math.abs(a * b) / this.gcd(a, b);
  },

  /**
   * Simplifica una fracción
   */
  simplifyFraction(numerator: number, denominator: number): { num: number; den: number } {
    const divisor = this.gcd(numerator, denominator);
    return {
      num: numerator / divisor,
      den: denominator / divisor
    };
  },

  // ============================================================================
  // OPERACIONES CON TÉRMINOS
  // ============================================================================

  /**
   * Verifica si dos términos son semejantes (misma variable y exponente)
   */
  areTermsLike(term1: Term, term2: Term): boolean {
    return term1.variable === term2.variable && 
           (term1.exponent || 1) === (term2.exponent || 1) &&
           term1.isConstant === term2.isConstant;
  },

  /**
   * Combina dos términos semejantes
   */
  combineTerms(term1: Term, term2: Term): Term {
    if (!this.areTermsLike(term1, term2)) {
      throw new Error('Los términos no son semejantes y no se pueden combinar');
    }

    return {
      coefficient: term1.coefficient + term2.coefficient,
      variable: term1.variable,
      exponent: term1.exponent,
      isConstant: term1.isConstant,
      position: {
        start: Math.min(term1.position.start, term2.position.start),
        end: Math.max(term1.position.end, term2.position.end)
      }
    };
  },

  /**
   * Multiplica un término por un escalar
   */
  multiplyTermByScalar(term: Term, scalar: number): Term {
    return {
      ...term,
      coefficient: term.coefficient * scalar
    };
  },

  /**
   * Crea un término constante
   */
  createConstantTerm(value: number): Term {
    return {
      coefficient: value,
      isConstant: true,
      position: { start: 0, end: 0 }
    };
  },

  /**
   * Crea un término con variable
   */
  createVariableTerm(coefficient: number, variable: string, exponent: number = 1): Term {
    return {
      coefficient,
      variable,
      exponent,
      isConstant: false,
      position: { start: 0, end: 0 }
    };
  },

  // ============================================================================
  // OPERACIONES CON EXPRESIONES
  // ============================================================================

  /**
   * Obtiene todos los términos únicos de una expresión
   */
  getUniqueTermTypes(expression: Expression): string[] {
    if (!expression.terms) return [];
    
    const types = new Set<string>();
    expression.terms.forEach(term => {
      const type = term.isConstant ? 'constant' : `${term.variable}^${term.exponent || 1}`;
      types.add(type);
    });
    
    return Array.from(types);
  },

  /**
   * Agrupa términos por tipo (variable y exponente)
   */
  groupTermsByType(terms: Term[]): { [key: string]: Term[] } {
    const groups: { [key: string]: Term[] } = {};
    
    terms.forEach(term => {
      const key = term.isConstant ? 'constant' : `${term.variable}^${term.exponent || 1}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(term);
    });
    
    return groups;
  },

  /**
   * Simplifica términos combinando los semejantes
   */
  simplifyTerms(terms: Term[]): Term[] {
    const groups = this.groupTermsByType(terms);
    const simplified: Term[] = [];
    
    Object.values(groups).forEach(group => {
      if (group.length === 1) {
        simplified.push(group[0]);
      } else {
        // Combinar todos los términos del grupo
        let combined = group[0];
        for (let i = 1; i < group.length; i++) {
          combined = this.combineTerms(combined, group[i]);
        }
        
        // Solo añadir si el coeficiente no es cero
        if (!this.isZero(combined.coefficient)) {
          simplified.push(combined);
        }
      }
    });
    
    return simplified;
  },

  /**
   * Calcula el grado de una expresión
   */
  getExpressionDegree(expression: Expression, variable?: string): number {
    if (!expression.terms) return 0;
    
    let maxDegree = 0;
    
    expression.terms.forEach(term => {
      if (term.isConstant) return;
      if (variable && term.variable !== variable) return;
      
      const degree = term.exponent || 1;
      maxDegree = Math.max(maxDegree, degree);
    });
    
    return maxDegree;
  },

  // ============================================================================
  // ANÁLISIS DE ECUACIONES
  // ============================================================================

  /**
   * Calcula la complejidad de una ecuación
   */
  calculateEquationComplexity(equation: EquationAST): number {
    const leftTerms = equation.left.terms?.length || 0;
    const rightTerms = equation.right.terms?.length || 0;
    const totalTerms = leftTerms + rightTerms;
    
    // Factores de complejidad
    let complexity = totalTerms;
    
    // Bonus por múltiples variables
    complexity += equation.variables.length * 2;
    
    // Bonus por exponentes altos
    const maxDegreeLeft = this.getExpressionDegree(equation.left);
    const maxDegreeRight = this.getExpressionDegree(equation.right);
    complexity += Math.max(maxDegreeLeft, maxDegreeRight);
    
    // Bonus por coeficientes grandes
    const allTerms = [...(equation.left.terms || []), ...(equation.right.terms || [])];
    const hasLargeCoefficients = allTerms.some(term => Math.abs(term.coefficient) > 10);
    if (hasLargeCoefficients) complexity += 2;
    
    // Bonus por fracciones
    const hasFractions = allTerms.some(term => !Number.isInteger(term.coefficient));
    if (hasFractions) complexity += 1;
    
    return Math.min(complexity, 15); // Máximo 15
  },

  /**
   * Determina si una ecuación es lineal
   */
  isLinearEquation(equation: EquationAST): boolean {
    const leftDegree = this.getExpressionDegree(equation.left);
    const rightDegree = this.getExpressionDegree(equation.right);
    
    return Math.max(leftDegree, rightDegree) <= 1;
  },

  /**
   * Extrae coeficientes de una ecuación lineal en forma estándar
   */
  extractLinearCoefficients(equation: EquationAST): { 
    variableCoeff: number; 
    constant: number; 
    variable: string 
  } {
    if (!this.isLinearEquation(equation)) {
      throw new Error('La ecuación no es lineal');
    }

    if (equation.variables.length === 0) {
      throw new Error('La ecuación no tiene variables');
    }

    const variable = equation.variables[0];
    
    // Coeficientes del lado izquierdo
    let leftVarCoeff = 0;
    let leftConstant = 0;
    
    equation.left.terms?.forEach(term => {
      if (term.variable === variable) {
        leftVarCoeff += term.coefficient;
      } else if (term.isConstant) {
        leftConstant += term.coefficient;
      }
    });
    
    // Coeficientes del lado derecho (cambiar signo)
    let rightVarCoeff = 0;
    let rightConstant = 0;
    
    equation.right.terms?.forEach(term => {
      if (term.variable === variable) {
        rightVarCoeff += term.coefficient;
      } else if (term.isConstant) {
        rightConstant += term.coefficient;
      }
    });
    
    // Forma estándar: ax + b = 0 (mover todo al lado izquierdo)
    const variableCoeff = leftVarCoeff - rightVarCoeff;
    const constant = leftConstant - rightConstant;
    
    return { variableCoeff, constant, variable };
  },

  // ============================================================================
  // SOLUCIÓN DIRECTA DE ECUACIONES LINEALES
  // ============================================================================

  /**
   * Resuelve una ecuación lineal directamente
   */
  solveLinearEquation(equation: EquationAST): { value: number; steps: string[] } {
    const { variableCoeff, constant, variable } = this.extractLinearCoefficients(equation);
    const steps: string[] = [];
    
    if (this.isZero(variableCoeff)) {
      if (this.isZero(constant)) {
        throw new Error('La ecuación tiene infinitas soluciones');
      } else {
        throw new Error('La ecuación no tiene solución');
      }
    }
    
    steps.push(`Ecuación en forma estándar: ${variableCoeff}${variable} + ${constant} = 0`);
    
    if (!this.isZero(constant)) {
      steps.push(`Transponer constante: ${variableCoeff}${variable} = ${-constant}`);
    }
    
    const solution = -constant / variableCoeff;
    steps.push(`Dividir entre ${variableCoeff}: ${variable} = ${solution}`);
    
    return {
      value: this.roundToPrecision(solution),
      steps
    };
  },

  // ============================================================================
  // UTILIDADES DE FORMATEO
  // ============================================================================

  /**
   * Formatea un término como string
   */
  formatTerm(term: Term, isFirst: boolean = false): string {
    let result = '';
    
    // Signo
    if (!isFirst) {
      result += term.coefficient >= 0 ? ' + ' : ' - ';
    } else if (term.coefficient < 0) {
      result += '-';
    }
    
    // Coeficiente
    const absCoeff = Math.abs(term.coefficient);
    
    if (term.isConstant) {
      result += absCoeff.toString();
    } else {
      if (absCoeff === 1) {
        result += term.variable || '';
      } else {
        result += absCoeff + (term.variable || '');
      }
      
      // Exponente
      if (term.exponent && term.exponent !== 1) {
        result += `^${term.exponent}`;
      }
    }
    
    return result;
  },

  /**
   * Formatea una expresión como string
   */
  formatExpression(expression: Expression): string {
    if (!expression.terms || expression.terms.length === 0) {
      return '0';
    }
    
    return expression.terms
      .map((term, index) => this.formatTerm(term, index === 0))
      .join('');
  },

  /**
   * Formatea una ecuación como string
   */
  formatEquation(equation: EquationAST): string {
    const left = this.formatExpression(equation.left);
    const right = this.formatExpression(equation.right);
    return `${left} = ${right}`;
  },

  // ============================================================================
  // UTILIDADES DE VALIDACIÓN MATEMÁTICA
  // ============================================================================

  /**
   * Verifica si un valor es una solución válida
   */
  isValidSolution(equation: EquationAST, variable: string, value: number): boolean {
    try {
      // Sustituir en lado izquierdo
      let leftResult = 0;
      equation.left.terms?.forEach(term => {
        if (term.isConstant) {
          leftResult += term.coefficient;
        } else if (term.variable === variable) {
          leftResult += term.coefficient * Math.pow(value, term.exponent || 1);
        }
      });
      
      // Sustituir en lado derecho
      let rightResult = 0;
      equation.right.terms?.forEach(term => {
        if (term.isConstant) {
          rightResult += term.coefficient;
        } else if (term.variable === variable) {
          rightResult += term.coefficient * Math.pow(value, term.exponent || 1);
        }
      });
      
      return this.areEqual(leftResult, rightResult);
      
    } catch {
      return false;
    }
  },

  /**
   * Genera valores de prueba para una variable
   */
  generateTestValues(count: number = 10): number[] {
    const values: number[] = [];
    
    // Valores especiales
    values.push(0, 1, -1);
    
    // Valores aleatorios
    for (let i = 0; i < count - 3; i++) {
      const value = (Math.random() - 0.5) * 20; // Entre -10 y 10
      values.push(this.roundToPrecision(value, 2));
    }
    
    return values;
  },

  // ============================================================================
  // UTILIDADES DE CONVERSIÓN
  // ============================================================================

  /**
   * Convierte una expresión a forma polinómica estándar
   */
  toStandardForm(expression: Expression, variable: string): {
    coefficients: number[];
    degrees: number[];
  } {
    const terms = expression.terms || [];
    const coeffMap: { [degree: number]: number } = {};
    
    terms.forEach(term => {
      if (term.isConstant) {
        coeffMap[0] = (coeffMap[0] || 0) + term.coefficient;
      } else if (term.variable === variable) {
        const degree = term.exponent || 1;
        coeffMap[degree] = (coeffMap[degree] || 0) + term.coefficient;
      }
    });
    
    const degrees = Object.keys(coeffMap).map(Number).sort((a, b) => b - a);
    const coefficients = degrees.map(deg => coeffMap[deg]);
    
    return { coefficients, degrees };
  },

  /**
   * Convierte números a fracciones simples cuando es posible
   */
  toFraction(decimal: number, tolerance: number = 1e-6): { 
    numerator: number; 
    denominator: number; 
    isExact: boolean 
  } {
    if (Number.isInteger(decimal)) {
      return { numerator: decimal, denominator: 1, isExact: true };
    }
    
    // Buscar fracción simple
    for (let denominator = 2; denominator <= 1000; denominator++) {
      const numerator = Math.round(decimal * denominator);
      const approximation = numerator / denominator;
      
      if (Math.abs(decimal - approximation) < tolerance) {
        const simplified = this.simplifyFraction(numerator, denominator);
        return {
          numerator: simplified.num,
          denominator: simplified.den,
          isExact: true
        };
      }
    }
    
    // Si no se encuentra fracción simple, usar decimal
    return {
      numerator: Math.round(decimal * 1000),
      denominator: 1000,
      isExact: false
    };
  }
};

export default mathUtils;