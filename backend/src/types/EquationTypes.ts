export type OperatorType = '+' | '-' | '*' | '/' | '^' | '=' | '(' | ')';

export type ExpressionType = 
  | 'variable'
  | 'number'
  | 'operator'
  | 'function'
  | 'parentheses';

export interface Expression {
  type: ExpressionType;
  value: string | number;
  left?: Expression;
  right?: Expression;
  children?: Expression[];
}

export interface EquationMetadata {
  type: 'linear' | 'quadratic' | 'polynomial' | 'system';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  variables: string[];
  domain?: 'real' | 'integer' | 'natural';
  createdAt: Date;
  updatedAt: Date;
}

export interface EquationAST {
  type: 'equation';
  left: Expression;
  right: Expression;
  metadata: EquationMetadata;
}

export interface Step {
  id: string;
  type: 'simplify' | 'isolate' | 'combine' | 'substitute' | 'solve';
  description: string;
  equation: EquationAST;
  reasoning: string;
  isValid: boolean;
}

export interface Solution {
  id: string;
  variables: Record<string, number>;
  steps: Step[];
  isComplete: boolean;
  confidence: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
  score: number;
}

export interface EquationDocument {
  id: string;
  equation: EquationAST;
  solution?: Solution;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export interface CreateEquationRequest {
  equationString: string;
  metadata?: Partial<EquationMetadata>;
}

export interface ValidateSolutionRequest {
  solution: Solution;
}