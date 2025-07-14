// backend/src/engines/EquationEngine.ts

import type { 
    EquationAST, 
    Solution, 
    Step, 
    ValidationResult, 
    ParseResult,
    StepSequence,
    EquationType,
    Expression,
    Term
  } from '../../../shared/types/EquationTypes';
  
  /**
   * Motor de Ecuaciones - Versión Backend Simplificada
   * Implementación básica para testing y desarrollo inicial
   */
  export class EquationEngine {
    
    parse(input: string): ParseResult {
      console.log('Backend: Parsing equation:', input);
      
      // Implementación simplificada para Phase 1.2
      const basicTerms: Term[] = [
        {
          coefficient: 2,
          variable: 'x',
          isConstant: false,
          position: { start: 0, end: 2 }
        },
        {
          coefficient: 3,
          isConstant: true,
          position: { start: 4, end: 5 }
        }
      ];
      
      const mockAST: EquationAST = {
        type: 'equation',
        left: { 
          type: 'binary_operation', 
          terms: basicTerms, 
          simplified: false 
        } as Expression,
        right: { 
          type: 'binary_operation', 
          terms: [{ coefficient: 7, isConstant: true, position: { start: 8, end: 9 } }], 
          simplified: false 
        } as Expression,
        metadata: {
          id: `eq_${Date.now()}`,
          originalInput: input,
          timestamp: Date.now(),
          difficultyLevel: 'beginner',
          estimatedSteps: 3,
          requiredOperations: ['transposition', 'isolation']
        },
        equationType: this.detectSimpleType(input),
        variables: this.extractSimpleVariables(input),
        complexity: 2
      };
  
      return {
        ast: mockAST,
        tokens: [],
        errors: [],
        warnings: [],
        parseTime: Math.random() * 50 + 10 // 10-60ms
      };
    }
  
    solve(equation: EquationAST): Solution {
      console.log('Backend: Solving equation:', equation.metadata.id);
      
      // Implementación simplificada que resuelve ecuaciones básicas
      const variable = equation.variables[0] || 'x';
      const value = this.solveMockEquation(equation);
      
      return {
        variable,
        value,
        steps: [],
        verificationsSteps: [{
          substitution: `${variable} = ${value}`,
          leftSideResult: value * 2 + 3, // Simulado
          rightSideResult: 7, // Simulado
          isValid: Math.abs((value * 2 + 3) - 7) < 0.001
        }],
        solutionMethod: 'direct_isolation',
        confidence: 0.95
      };
    }
  
    generateSteps(equation: EquationAST): StepSequence {
      console.log('Backend: Generating steps for equation:', equation.metadata.id);
      
      const steps: Step[] = [
        {
          id: `step_${Date.now()}_1`,
          type: 'transposition',
          description: 'Transponer término constante al lado derecho',
          fromExpression: equation.left,
          toExpression: equation.left, // Simplificado
          justification: 'Aplicar propiedad de igualdad para mantener el balance',
          difficulty: 2,
          hints: ['Mover el número al otro lado cambiando el signo']
        },
        {
          id: `step_${Date.now()}_2`,
          type: 'isolation',
          description: 'Aislar la variable dividiendo entre su coeficiente',
          fromExpression: equation.left,
          toExpression: equation.left, // Simplificado
          justification: 'Dividir entre el coeficiente para obtener x = valor',
          difficulty: 1,
          hints: ['Dividir ambos lados entre el coeficiente de x']
        }
      ];
      
      return {
        steps,
        isOptimal: true,
        estimatedTime: 90, // 1.5 minutos
        alternativeExists: false
      };
    }
  
    validateStep(equation: EquationAST, attemptedStep: Step, expectedSteps: Step[]): ValidationResult {
      console.log('Backend: Validating step:', attemptedStep.id);
      
      // Validación simplificada
      const isValidType = expectedSteps.some(step => step.type === attemptedStep.type);
      
      return {
        isValid: isValidType,
        errors: isValidType ? [] : [{
          type: 'syntax_error',
          message: 'El tipo de paso no coincide con lo esperado',
          severity: 'medium'
        }],
        warnings: [],
        suggestions: isValidType ? [] : [
          'Revisa la secuencia de pasos sugerida',
          'Asegúrate de seguir el orden lógico de resolución'
        ]
      };
    }
  
    // ============================================================================
    // MÉTODOS AUXILIARES SIMPLIFICADOS
    // ============================================================================
  
    private detectSimpleType(input: string): EquationType {
      // Detección muy básica basada en patrones simples
      if (input.includes('(') && input.includes(')')) {
        return 'distributive';
      }
      
      const sides = input.split('=');
      if (sides.length === 2) {
        const leftHasVar = /[a-zA-Z]/.test(sides[0]);
        const rightHasVar = /[a-zA-Z]/.test(sides[1]);
        
        if (leftHasVar && rightHasVar) {
          return 'standard';
        } else if (leftHasVar || rightHasVar) {
          return 'basic';
        }
      }
      
      return 'basic';
    }
  
    private extractSimpleVariables(input: string): string[] {
      const variables = new Set<string>();
      const matches = input.match(/[a-zA-Z]/g);
      
      if (matches) {
        matches.forEach(match => {
          if (match.toLowerCase() !== match.toUpperCase()) { // Es una letra
            variables.add(match.toLowerCase());
          }
        });
      }
      
      return Array.from(variables);
    }
  
    private solveMockEquation(equation: EquationAST): number {
      // Resolución muy simplificada para 2x + 3 = 7 -> x = 2
      const leftTerms = equation.left.terms || [];
      const rightTerms = equation.right.terms || [];
      
      let variableCoeff = 0;
      let leftConstant = 0;
      let rightConstant = 0;
      
      // Extraer coeficientes del lado izquierdo
      leftTerms.forEach(term => {
        if (term.isConstant) {
          leftConstant += term.coefficient;
        } else {
          variableCoeff += term.coefficient;
        }
      });
      
      // Extraer constantes del lado derecho
      rightTerms.forEach(term => {
        if (term.isConstant) {
          rightConstant += term.coefficient;
        }
      });
      
      // Resolver: variableCoeff * x + leftConstant = rightConstant
      // x = (rightConstant - leftConstant) / variableCoeff
      
      if (Math.abs(variableCoeff) < 0.001) {
        return 0; // Evitar división por cero
      }
      
      const result = (rightConstant - leftConstant) / variableCoeff;
      return Math.round(result * 1000) / 1000; // Redondear a 3 decimales
    }
  
    // ============================================================================
    // MÉTODOS DE CONFIGURACIÓN
    // ============================================================================
  
    getConfig() {
      return {
        supportedTypes: ['basic', 'standard', 'distributive'],
        maxComplexity: 10,
        version: '1.0.0-backend'
      };
    }
  
    getStats() {
      return {
        supportedTypes: ['basic', 'standard', 'distributive'],
        maxComplexity: 10,
        version: '1.0.0-backend',
        backend: true
      };
    }
  }