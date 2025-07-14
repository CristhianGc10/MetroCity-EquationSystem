// src/engines/equation/Parser.ts

import type {
  EquationAST,
  Expression,
  Term,
  Token,
  TokenType,
  ParseResult,
  EquationType,
  EngineConfig,
  EquationError,
  EquationWarning,
  EquationMetadata
} from '../../types/equation/EquationTypes';

import {
  SUPPORTED_VARIABLES
} from '../../types/equation/EquationTypes';

/**
 * Parser Algebraico para Ecuaciones Lineales
 * Convierte strings de ecuaciones en Abstract Syntax Trees (AST)
 */
export class AlgebraicParser {
  private config: EngineConfig;
  private tokens: Token[] = [];
  private errors: EquationError[] = [];
  private warnings: EquationWarning[] = [];

  constructor(config: EngineConfig) {
    this.config = config;
  }

  // ============================================================================
  // MÉTODO PRINCIPAL DE PARSING
  // ============================================================================

  /**
   * Parsea una ecuación completa desde string
   */
  public parseEquation(input: string): ParseResult {
    this.reset();
    
    try {
      // 1. Tokenización
      this.tokens = this.tokenize(input);
      
      if (this.tokens.length === 0) {
        this.addError('empty_expression', 'La ecuación está vacía', 'high');
        return this.createParseResult(null);
      }

      // 2. Buscar el signo de igualdad
      const equalsIndex = this.findEqualsSign();
      if (equalsIndex === -1) {
        this.addError('syntax_error', 'Falta el signo de igualdad (=)', 'high');
        return this.createParseResult(null);
      }

      // 3. Parsear lado izquierdo
      const leftTokens = this.tokens.slice(0, equalsIndex);
      const leftExpression = this.parseExpression(leftTokens);

      // 4. Parsear lado derecho
      const rightTokens = this.tokens.slice(equalsIndex + 1);
      const rightExpression = this.parseExpression(rightTokens);

      // 5. Crear AST de la ecuación
      const ast = this.createEquationAST(leftExpression, rightExpression, input);

      return this.createParseResult(ast);

    } catch (error) {
      this.addError('syntax_error', `Error de parsing: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'critical');
      return this.createParseResult(null);
    }
  }

  // ============================================================================
  // TOKENIZACIÓN
  // ============================================================================

  /**
   * Convierte el string de entrada en tokens
   */
  private tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;

    while (position < input.length) {
      const char = input[position];
      
      // Saltar espacios en blanco
      if (/\s/.test(char)) {
        position++;
        continue;
      }

      // Números (incluyendo decimales)
      if (/\d/.test(char)) {
        const { token, newPosition } = this.parseNumber(input, position);
        tokens.push(token);
        position = newPosition;
        continue;
      }

      // Variables
      if (/[a-zA-Z]/.test(char)) {
        const { token, newPosition } = this.parseVariable(input, position);
        tokens.push(token);
        position = newPosition;
        continue;
      }

      // Operadores y símbolos especiales
      const symbol = this.parseSymbol(char, position);
      if (symbol) {
        tokens.push(symbol);
        position++;
        continue;
      }

      // Caracter no reconocido
      this.addError('invalid_character', `Caracter no válido: '${char}'`, 'medium', position, position + 1);
      position++;
    }

    return tokens;
  }

  /**
   * Parsea un número (entero o decimal)
   */
  private parseNumber(input: string, start: number): { token: Token; newPosition: number } {
    let position = start;
    let hasDecimal = false;

    while (position < input.length) {
      const char = input[position];
      
      if (/\d/.test(char)) {
        position++;
      } else if (char === '.' && !hasDecimal && this.config.allowDecimals) {
        hasDecimal = true;
        position++;
      } else {
        break;
      }
    }

    const value = input.slice(start, position);
    
    return {
      token: {
        type: 'NUMBER',
        value,
        position: { start, end: position }
      },
      newPosition: position
    };
  }

  /**
   * Parsea una variable
   */
  private parseVariable(input: string, start: number): { token: Token; newPosition: number } {
    let position = start;
    
    // Solo tomamos una letra para variables
    while (position < input.length && /[a-zA-Z]/.test(input[position])) {
      position++;
    }

    const value = input.slice(start, position);
    
    // Validar que es una variable soportada
    if (!SUPPORTED_VARIABLES.includes(value)) {
      this.addWarning('unusual_format', `Variable '${value}' no es estándar`, `Considera usar: ${SUPPORTED_VARIABLES.join(', ')}`);
    }

    return {
      token: {
        type: 'VARIABLE',
        value,
        position: { start, end: position }
      },
      newPosition: position
    };
  }

  /**
   * Parsea símbolos y operadores
   */
  private parseSymbol(char: string, position: number): Token | null {
    const symbolMap: { [key: string]: TokenType } = {
      '+': 'OPERATOR',
      '-': 'OPERATOR',
      '*': 'OPERATOR',
      '/': 'OPERATOR',
      '=': 'EQUALS',
      '(': 'LPAREN',
      ')': 'RPAREN'
    };

    const tokenType = symbolMap[char];
    if (!tokenType) return null;

    return {
      type: tokenType,
      value: char,
      position: { start: position, end: position + 1 }
    };
  }

  // ============================================================================
  // PARSING DE EXPRESIONES
  // ============================================================================

  /**
   * Parsea una expresión (lado izquierdo o derecho de la ecuación)
   */
  private parseExpression(tokens: Token[]): Expression {
    if (tokens.length === 0) {
      this.addError('empty_expression', 'Expresión vacía detectada', 'high');
      return this.createEmptyExpression();
    }

    try {
      // Convertir tokens a términos
      const terms = this.parseTerms(tokens);
      
      return {
        type: 'binary_operation',
        terms,
        simplified: false
      };

    } catch (error) {
      this.addError('syntax_error', `Error al parsear expresión: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'high');
      return this.createEmptyExpression();
    }
  }

  /**
   * Parsea tokens y los convierte en términos matemáticos
   */
  private parseTerms(tokens: Token[]): Term[] {
    const terms: Term[] = [];
    let i = 0;

    while (i < tokens.length) {
      const term = this.parseSingleTerm(tokens, i);
      if (term.term) {
        terms.push(term.term);
      }
      i = term.nextIndex;
    }

    return this.combineAndSimplifyTerms(terms);
  }

  /**
   * Parsea un término individual
   */
  private parseSingleTerm(tokens: Token[], startIndex: number): { term: Term | null; nextIndex: number } {
    let index = startIndex;
    let sign = 1;
    let coefficient = 0;
    let variable: string | undefined;
    let hasCoefficient = false;

    // Manejar signo inicial
    if (index < tokens.length && tokens[index].type === 'OPERATOR') {
      const operator = tokens[index].value;
      if (operator === '-') {
        sign = -1;
      } else if (operator === '+') {
        sign = 1;
      }
      index++;
    }

    // Manejar coeficiente numérico
    if (index < tokens.length && tokens[index].type === 'NUMBER') {
      coefficient = parseFloat(tokens[index].value);
      hasCoefficient = true;
      index++;
    }

    // Manejar variable
    if (index < tokens.length && tokens[index].type === 'VARIABLE') {
      variable = tokens[index].value;
      index++;
      
      // Si no había coeficiente explícito, el coeficiente es 1
      if (!hasCoefficient) {
        coefficient = 1;
      }
    } else if (hasCoefficient) {
      // Es un término constante
      variable = undefined;
    } else if (sign === -1) {
      // Solo un signo negativo sin número ni variable
      this.addError('syntax_error', 'Signo negativo sin término', 'medium');
      return { term: null, nextIndex: index };
    }

    // Si llegamos aquí sin coeficiente ni variable, error
    if (!hasCoefficient && !variable) {
      return { term: null, nextIndex: index + 1 };
    }

    const term: Term = {
      coefficient: sign * coefficient,
      variable,
      exponent: variable ? 1 : undefined,
      isConstant: !variable,
      position: { 
        start: tokens[startIndex]?.position.start || 0, 
        end: tokens[index - 1]?.position.end || 0 
      }
    };

    return { term, nextIndex: index };
  }

  // ============================================================================
  // UTILIDADES DE PARSING
  // ============================================================================

  /**
   * Encuentra la posición del signo de igualdad
   */
  private findEqualsSign(): number {
    for (let i = 0; i < this.tokens.length; i++) {
      if (this.tokens[i].type === 'EQUALS') {
        return i;
      }
    }
    return -1;
  }

  /**
   * Combina y simplifica términos semejantes
   */
  private combineAndSimplifyTerms(terms: Term[]): Term[] {
    const simplified: { [key: string]: Term } = {};

    terms.forEach(term => {
      const key = term.variable || 'constant';
      
      if (simplified[key]) {
        simplified[key].coefficient += term.coefficient;
      } else {
        simplified[key] = { ...term };
      }
    });

    // Filtrar términos con coeficiente cero
    return Object.values(simplified).filter(term => Math.abs(term.coefficient) > 1e-10);
  }

  // ============================================================================
  // DETECCIÓN DE TIPOS
  // ============================================================================

  /**
   * Detecta automáticamente el tipo de ecuación
   */
  public detectEquationType(ast: EquationAST): EquationType {
    const leftTerms = ast.left.terms || [];
    const rightTerms = ast.right.terms || [];
    const allTerms = [...leftTerms, ...rightTerms];
    
    const variableTerms = allTerms.filter(term => !term.isConstant);
    const hasMultipleTerms = variableTerms.length > 1;
    
    // Análisis básico por número de términos y complejidad
    if (variableTerms.length === 0) {
      this.addWarning('unusual_format', 'Ecuación sin variables', 'Verifica que sea una ecuación válida');
      return 'basic';
    }

    if (variableTerms.length === 1 && allTerms.length <= 2) {
      return 'basic'; // ax + b = 0 o similar
    }

    if (hasMultipleTerms && allTerms.length <= 4) {
      return 'standard'; // ax + b = cx + d
    }

    // Detectar patrones más complejos (simplificado por ahora)
    if (this.hasDistributivePattern(ast)) {
      return 'distributive';
    }

    if (allTerms.length > 4) {
      return 'complex';
    }

    return 'standard';
  }

  /**
   * Detecta si hay patrón distributivo (simplificado)
   */
  private hasDistributivePattern(ast: EquationAST): boolean {
    // En una implementación completa, esto analizaría la estructura del AST
    // Por ahora, es una heurística simple
    const allTerms = [...(ast.left.terms || []), ...(ast.right.terms || [])];
    return allTerms.length >= 3 && allTerms.some(term => Math.abs(term.coefficient) > 1 && !term.isConstant);
  }

  // ============================================================================
  // CREACIÓN DE OBJETOS
  // ============================================================================

  /**
   * Crea el AST final de la ecuación
   */
  private createEquationAST(left: Expression, right: Expression, originalInput: string): EquationAST {
    const variables = this.extractVariablesFromExpressions([left, right]);
    
    const metadata: EquationMetadata = {
      id: this.generateId(),
      originalInput,
      timestamp: Date.now(),
      difficultyLevel: 'beginner', // Se calculará después
      estimatedSteps: 0, // Se calculará después
      requiredOperations: [] // Se calculará después
    };

    const ast: EquationAST = {
      type: 'equation',
      left,
      right,
      metadata,
      equationType: 'basic', // Se detectará después
      variables,
      complexity: 0 // Se calculará después
    };

    return ast;
  }

  /**
   * Extrae variables de múltiples expresiones
   */
  private extractVariablesFromExpressions(expressions: Expression[]): string[] {
    const variables = new Set<string>();
    
    expressions.forEach(expr => {
      expr.terms?.forEach(term => {
        if (term.variable) {
          variables.add(term.variable);
        }
      });
    });
    
    return Array.from(variables);
  }

  /**
   * Crea una expresión vacía
   */
  private createEmptyExpression(): Expression {
    return {
      type: 'binary_operation',
      terms: [],
      simplified: true
    };
  }

  /**
   * Crea el resultado del parsing
   */
  private createParseResult(ast: EquationAST | null): ParseResult {
    return {
      ast,
      tokens: this.tokens,
      errors: this.errors,
      warnings: this.warnings,
      parseTime: 0 // Se establecerá en el motor principal
    };
  }

  // ============================================================================
  // UTILIDADES Y HELPERS
  // ============================================================================

  /**
   * Reinicia el estado del parser
   */
  private reset(): void {
    this.tokens = [];
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Añade un error
   */
  private addError(type: 'syntax_error' | 'invalid_character' | 'missing_operator' | 'mismatched_parentheses' | 'division_by_zero' | 'invalid_variable' | 'empty_expression', message: string, severity: 'low' | 'medium' | 'high' | 'critical', start?: number, end?: number): void {
    this.errors.push({
      type,
      message,
      severity,
      position: start !== undefined && end !== undefined ? { start, end } : undefined
    });
  }

  /**
   * Añade una advertencia
   */
  private addWarning(type: 'unnecessary_parentheses' | 'can_be_simplified' | 'unusual_format' | 'high_complexity', message: string, suggestion: string): void {
    this.warnings.push({
      type,
      message,
      suggestion
    });
  }

  /**
   * Genera un ID único para la ecuación
   */
  private generateId(): string {
    return `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}