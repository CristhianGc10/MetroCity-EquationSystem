// shared/types/EquationTypes.ts

/**
 * Tipos Compartidos para el Sistema de Ecuaciones MetroCity
 * Estos tipos son utilizados tanto por Frontend como Backend
 */

// ============================================================================
// TIPOS FUNDAMENTALES
// ============================================================================

export type EquationType = 
  | 'basic'        // ax + b = 0
  | 'standard'     // ax + b = cx + d  
  | 'distributive' // a(bx + c) = dx + e
  | 'complex'      // a(bx + c) + d(ex + f) = g(hx + i) + j
  | 'fractional'   // (ax + b)/c = (dx + e)/f
  | 'multi_step';  // Combinaciones complejas

export type OperationType = 
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'distribution'
  | 'combination'
  | 'transposition'
  | 'isolation';

export type NodeType = 
  | 'number'
  | 'variable'
  | 'binary_operation'
  | 'unary_operation'
  | 'parentheses'
  | 'fraction';

// ============================================================================
// ABSTRACT SYNTAX TREE
// ============================================================================

export interface ASTNode {
  type: NodeType;
  value?: number | string;
  left?: ASTNode;
  right?: ASTNode;
  operator?: string;
  metadata?: NodeMetadata;
}

export interface NodeMetadata {
  position: { start: number; end: number };
  originalText: string;
  coefficient?: number;
  isSimplified?: boolean;
}

export interface Expression extends ASTNode {
  terms?: Term[];
  simplified?: boolean;
}

export interface Term {
  coefficient: number;
  variable?: string;
  exponent?: number;
  isConstant: boolean;
  position: { start: number; end: number };
}

// ============================================================================
// ECUACIÓN PRINCIPAL
// ============================================================================

export interface EquationAST {
  type: 'equation';
  left: Expression;
  right: Expression;
  metadata: EquationMetadata;
  equationType: EquationType;
  variables: string[];
  complexity: number;
}

export interface EquationMetadata {
  id: string;
  originalInput: string;
  timestamp: number;
  difficultyLevel: DifficultyLevel;
  estimatedSteps: number;
  requiredOperations: OperationType[];
  contextInfo?: ContextInfo;
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ContextInfo {
  domain: CityDomain;
  scenario: string;
  realWorldApplication: string;
}

export type CityDomain = 
  | 'housing' 
  | 'transport' 
  | 'energy' 
  | 'economy' 
  | 'environment' 
  | 'technology' 
  | 'education' 
  | 'health';

// ============================================================================
// PASOS DE SOLUCIÓN
// ============================================================================

export interface Step {
  id: string;
  type: OperationType;
  description: string;
  fromExpression: Expression;
  toExpression: Expression;
  justification: string;
  difficulty: number;
  hints?: string[];
  isOptional?: boolean;
}

export interface StepSequence {
  steps: Step[];
  isOptimal: boolean;
  estimatedTime: number;
  alternativeExists: boolean;
}

// ============================================================================
// SOLUCIÓN
// ============================================================================

export interface Solution {
  variable: string;
  value: number;
  steps: Step[];
  verificationsSteps: VerificationStep[];
  solutionMethod: SolutionMethod;
  confidence: number;
}

export interface VerificationStep {
  substitution: string;
  leftSideResult: number;
  rightSideResult: number;
  isValid: boolean;
}

export type SolutionMethod = 
  | 'direct_isolation'
  | 'distribution_first'
  | 'combination_first'
  | 'cross_multiplication'
  | 'elimination';

// ============================================================================
// VALIDACIÓN Y ERRORES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: EquationError[];
  warnings: EquationWarning[];
  suggestions: string[];
}

export interface EquationError {
  type: ErrorType;
  message: string;
  position?: { start: number; end: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface EquationWarning {
  type: WarningType;
  message: string;
  suggestion: string;
}

export type ErrorType = 
  | 'syntax_error'
  | 'invalid_character'
  | 'missing_operator'
  | 'mismatched_parentheses'
  | 'division_by_zero'
  | 'invalid_variable'
  | 'empty_expression';

export type WarningType = 
  | 'unnecessary_parentheses'
  | 'can_be_simplified'
  | 'unusual_format'
  | 'high_complexity';

// ============================================================================
// PARSING Y TOKENIZACIÓN
// ============================================================================

export interface Token {
  type: TokenType;
  value: string;
  position: { start: number; end: number };
}

export type TokenType = 
  | 'NUMBER'
  | 'VARIABLE'
  | 'OPERATOR'
  | 'EQUALS'
  | 'LPAREN'
  | 'RPAREN'
  | 'FRACTION_BAR'
  | 'WHITESPACE'
  | 'EOF';

export interface ParseResult {
  ast: EquationAST | null;
  tokens: Token[];
  errors: EquationError[];
  warnings: EquationWarning[];
  parseTime: number;
}

// ============================================================================
// CONFIGURACIÓN DEL MOTOR
// ============================================================================

export interface EngineConfig {
  supportedTypes: EquationType[];
  maxComplexity: number;
  allowFractions: boolean;
  allowDecimals: boolean;
  maxSteps: number;
  timeoutMs: number;
  generateAlternatives: boolean;
}

export interface EngineState {
  currentEquation: EquationAST | null;
  currentStep: number;
  completedSteps: Step[];
  isLoading: boolean;
  lastError: EquationError | null;
}

// ============================================================================
// TIPOS ESPECÍFICOS DEL BACKEND
// ============================================================================

export interface DatabaseEquation {
  id: string;
  userId: string;
  originalInput: string;
  ast: EquationAST;
  parseResult: ParseResult;
  createdAt: Date;
  status: 'active' | 'completed' | 'deleted';
}

export interface UserStatistics {
  totalEquations: number;
  solvedEquations: number;
  averageTime: number;
  strengthsByType: { [type: string]: number };
}

export interface StepAttempt {
  equationId: string;
  userId: string;
  stepIndex: number;
  attemptedStep: Step;
  isCorrect: boolean;
  timestamp: Date;
}

// ============================================================================
// CONSTANTES Y CONFIGURACIONES
// ============================================================================

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  supportedTypes: ['basic', 'standard', 'distributive'],
  maxComplexity: 10,
  allowFractions: true,
  allowDecimals: true,
  maxSteps: 20,
  timeoutMs: 5000,
  generateAlternatives: true
};

export const SUPPORTED_VARIABLES = ['x', 'y', 'z', 'a', 'b', 'c', 'n', 't'];

export const OPERATOR_PRECEDENCE = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
  '(': 3,
  ')': 3
} as const;