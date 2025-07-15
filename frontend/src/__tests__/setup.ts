// frontend/src/__tests__/setup.ts

/**
 * Configuración global para tests de Vitest
 * Este archivo se ejecuta antes de todos los tests
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// Configurar timeouts globales
vi.setConfig({ testTimeout: 30000 })

// Mock de performance API si no está disponible
if (typeof performance === 'undefined') {
  global.performance = {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    getEntries: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    navigation: {} as any,
    timing: {} as any,
    timeOrigin: Date.now()
  } as any;
}

// Configuración global para tests
beforeAll(() => {
  console.log('🧪 Iniciando suite de tests para MetroCity EquationEngine');
});

afterAll(() => {
  console.log('✅ Suite de tests completada');
});

beforeEach(() => {
  // Resetear mocks antes de cada test
  vi.clearAllMocks();
});

afterEach(() => {
  // Limpieza después de cada test
});

// Utilidades globales para tests
export const createMockEquation = (input: string) => ({
  id: `mock-${Date.now()}`,
  originalInput: input,
  timestamp: Date.now(),
  ast: null as any,
  parseResult: null as any
});

// Función helper para performance tests
export const measurePerformance = (fn: () => any): number => {
  const start = performance.now();
  fn();
  return performance.now() - start;
};

// Función helper para tests asíncronos
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Configuración de tolerancia para comparaciones numéricas
export const NUMERICAL_TOLERANCE = 0.001;

// Configuración de timeouts para diferentes tipos de tests
export const TEST_TIMEOUTS = {
  FAST: 100,      // Para tests rápidos (parsing, cálculos simples)
  NORMAL: 1000,   // Para tests normales
  SLOW: 5000,     // Para tests que pueden ser más lentos (integración)
  VERY_SLOW: 10000 // Para tests muy lentos (end-to-end)
};

// Datos de prueba comunes
export const TEST_EQUATIONS = {
  BASIC: [
    'x = 5',
    '2x = 10', 
    'x + 3 = 8',
    '3x - 6 = 9'
  ],
  STANDARD: [
    '2x + 3 = x + 7',
    '5x - 2 = 3x + 4',
    'x + 1 = 2x - 5'
  ],
  DISTRIBUTIVE: [
    '2(x + 3) = 10',
    '3(2x - 1) = x + 4'
  ],
  COMPLEX: [
    '2(x + 1) + 3(x - 2) = 4x + 8',
    '3(2x + 1) - 2(x - 3) = 5x + 1'
  ],
  INVALID: [
    '',
    'x +',
    '2x = 3x = 4',
    'x + y = )',
    '((x + 1) = 5'
  ]
};

console.log('🔧 Setup de Vitest configurado correctamente');