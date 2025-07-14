import { EquationEngine } from '../../engines/equation/EquationEngine';

describe('Working Integration Tests', () => {
  let engine: EquationEngine;

  beforeEach(() => {
    engine = new EquationEngine();
  });

  describe('Direct equation solving (using working solver)', () => {
    it('should solve simple equations using solveEquation method', () => {
      const testCases = [
        { equation: 'x + 5 = 10', expectedX: 5 },
        { equation: 'x + 2 = 7', expectedX: 5 },
        { equation: '2x = 8', expectedX: 4 },
        { equation: 'x + 1 = 4', expectedX: 3 },
        { equation: '2x + 3 = x + 8', expectedX: 5 }
      ];
      
      testCases.forEach(testCase => {
        const solution = engine.solveEquation(testCase.equation);
        expect(solution.isComplete).toBe(true);
        expect(solution.variables.x).toBeCloseTo(testCase.expectedX, 5);
        expect(solution.steps.length).toBeGreaterThan(0);
      });
    });

    it('should generate multiple steps for complex equations', () => {
      const solution = engine.solveEquation('2x + 4 = 10');
      
      expect(solution.steps.length).toBeGreaterThan(1);
      expect(solution.steps[0].description).toBe('Initial equation');
      expect(solution.steps.some(step => step.type === 'solve')).toBe(true);
    });

    it('should validate steps correctly', () => {
      const solution = engine.solveEquation('x + 2 = 5');
      
      solution.steps.forEach(step => {
        expect(engine.validateStep(step)).toBe(true);
      });
    });
  });

  describe('Engine capabilities', () => {
    it('should return supported equation types', () => {
      const types = engine.getSupportedEquationTypes();
      
      expect(types).toContain('linear');
      expect(types).toContain('quadratic');
      expect(types).toContain('polynomial');
    });

    it('should return engine information', () => {
      const info = engine.getEngineInfo();
      
      expect(info.name).toBe('MetroCity Equation Engine');
      expect(info.version).toBe('1.0.0');
      expect(info.capabilities).toContain('Linear equation solving');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid equations gracefully', () => {
      const solution = engine.solveEquation('invalid equation');
      
      expect(solution.isComplete).toBe(false);
      expect(solution.confidence).toBe(0);
    });

    it('should handle empty equation', () => {
      const solution = engine.solveEquation('');
      
      expect(solution.isComplete).toBe(false);
    });
  });

  describe('Performance criteria validation', () => {
    it('should solve equations quickly (< 200ms)', () => {
      const equations = [
        'x + 1 = 5',
        '2x = 10',
        '3x + 2 = 8',
        'x + 3 = 2x - 1'
      ];
      
      equations.forEach(eq => {
        const startTime = performance.now();
        const solution = engine.solveEquation(eq);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(200);
        expect(solution.isComplete).toBe(true);
      });
    });
  });
});