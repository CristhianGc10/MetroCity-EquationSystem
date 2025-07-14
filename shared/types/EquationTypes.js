"use strict";
// shared/types/EquationTypes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPERATOR_PRECEDENCE = exports.SUPPORTED_VARIABLES = exports.DEFAULT_ENGINE_CONFIG = void 0;
// ============================================================================
// CONSTANTES Y CONFIGURACIONES
// ============================================================================
exports.DEFAULT_ENGINE_CONFIG = {
    supportedTypes: ['basic', 'standard', 'distributive'],
    maxComplexity: 10,
    allowFractions: true,
    allowDecimals: true,
    maxSteps: 20,
    timeoutMs: 5000,
    generateAlternatives: true
};
exports.SUPPORTED_VARIABLES = ['x', 'y', 'z', 'a', 'b', 'c', 'n', 't'];
exports.OPERATOR_PRECEDENCE = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '(': 3,
    ')': 3
};
