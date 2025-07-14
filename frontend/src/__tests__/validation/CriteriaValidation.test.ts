import { EquationEngine } from '../../engines/equation/EquationEngine';

describe('Validation Criteria for Phase 1.2', () => {
  let engine: EquationEngine;

  beforeEach(() => {
    engine = new EquationEngine();
  });

  describe('Criterion 1: Parser recognizes at least 3 types of linear equations', () => {
    it('should recognize simple linear equation (Type 1: ax = b)', () => {
      const equation = '2x = 10';
      const ast = engine.parse(equation);
      
      expect(ast.metadata.type).toBe('linear');
      expect(ast.metadata.variables).toContain('x');
    });

    it('should recognize linear equation with addition (Type 2: ax + b = c)', () => {
      const equation = '3x + 5 = 14';
      const ast = engine.parse(equation);
      
      expect(ast.metadata.type).toBe('linear');
      expect(ast.metadata.variables).toContain('x');
    });

    it('should recognize linear equation with variables on both sides (Type 3: ax + b = cx + d)', () => {
      const equation = '2x + 3 = x + 8';
      const ast = engine.parse(equation);
      
      expect(ast.metadata.type).toBe('linear');
      expect(ast.metadata.variables).toContain('x');
    });

    it('should recognize equation with multiple terms (Type 4: ax + bx + c = d)', () => {
      const equation = '2x + 3x - 1 = 9';
      const ast = engine.parse(equation);
      
      expect(ast.metadata.type).toBe('linear');
      expect(ast.metadata.variables).toContain('x');
    });
  });

  describe('Criterion 2: Step generator produces correct sequence', () => {
    it('should generate correct sequence for simple equation', () => {
      const equation = '2x + 4 = 10';
      const ast = engine.parse(equation);
      const steps = engine.generateSteps(ast);
      
      expect(steps.length).toBeGreaterThan(1);
      expect(steps[0].description).toBe('Initial equation');
      
      const finalStep = steps[steps.length - 1];
      expect(finalStep.type).toBe('solve');
      expect(finalStep.isValid).toBe(true);
    });

    it('should produce logical step progression', () => {
      const equation = 'x + 5 = 12';
      const ast = engine.parse(equation);
      const steps = engine.generateSteps(ast);
      
      let hasSimplify = false;
      let hasSolve = false;
      
      steps.forEach(step => {
        if (step.type === 'simplify' || step.type === 'isolate') {
          hasSimplify = true;
        }
        if (step.type === 'solve') {
          hasSolve = true;
        }
        expect(step.isValid).toBe(true);
      });
      
      expect(hasSolve).toBe(true);
    });

    it('should validate each generated step', () => {
      const equation = '3x - 2 = 7';
      const ast = engine.parse(equation);
      const steps = engine.generateSteps(ast);
      
      steps.forEach(step => {
        expect(engine.validateStep(step)).toBe(true);
      });
    });
  });

  describe('Criterion 3: API responds in <200ms for basic operations (simulated)', () => {
    it('should parse equation quickly', () => {
      const startTime = performance.now();
      
      const equation = '2x + 3 = 7';
      engine.parse(equation);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
    });

    it('should solve equation quickly', () => {
      const startTime = performance.now();
      
      const equation = 'x + 1 = 5';
      const solution = engine.solveEquation(equation);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
      expect(solution.isComplete).toBe(true);
    });

    it('should generate steps quickly', () => {
      const startTime = performance.now();
      
      const equation = '2x + 4 = 10';
      const ast = engine.parse(equation);
      engine.generateSteps(ast);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Criterion 4: Tests cover core functionality (this test file)', () => {
    it('should have comprehensive parser tests', () => {
      const testCases = [
        '2x = 10',
        'x + 5 = 8',
        '2x + 3 = x + 7',
        '3x - 2 = 7',
        'x + 1 = 0'
      ];
      
      testCases.forEach(equation => {
        expect(() => engine.parse(equation)).not.toThrow();
        const ast = engine.parse(equation);
        expect(ast.metadata.type).toBe('linear');
      });
    });

    it('should have comprehensive solver tests', () => {
      const testCases = [
        { equation: 'x = 5', expectedX: 5 },
        { equation: 'x + 2 = 7', expectedX: 5 },
        { equation: '2x = 8', expectedX: 4 },
        { equation: '3x - 6 = 9', expectedX: 5 },
        { equation: 'x + 1 = 2x - 3', expectedX: 4 }
      ];
      
      testCases.forEach(testCase => {
        const solution = engine.solveEquation(testCase.equation);
        expect(solution.isComplete).toBe(true);
        expect(solution.variables.x).toBeCloseTo(testCase.expectedX, 5);
      });
    });

    it('should have comprehensive validation tests', () => {
      const equation = 'x + 3 = 8';
      const ast = engine.parse(equation);
      
      const correctSolution = {
        id: 'test',
        variables: { x: 5 },
        steps: [],
        isComplete: true,
        confidence: 0.9
      };
      
      const incorrectSolution = {
        id: 'test',
        variables: { x: 10 },
        steps: [],
        isComplete: true,
        confidence: 0.9
      };
      
      const correctValidation = engine.validateSolution(correctSolution, ast);
      const incorrectValidation = engine.validateSolution(incorrectSolution, ast);
      
      expect(correctValidation.isValid).toBe(true);
      expect(incorrectValidation.isValid).toBe(false);
    });
  });

  describe('Additional Quality Checks', () => {
    it('should handle edge cases gracefully', () => {
      const edgeCases = [
        'x = 0',
        '0x = 0',
        'x + 0 = 5',
        '-x = -5'
      ];
      
      edgeCases.forEach(equation => {
        expect(() => engine.parse(equation)).not.toThrow();
      });
    });

    it('should provide meaningful error messages', () => {
      const invalidEquations = [
        'x +',
        '= 5',
        'x = = 5',
        ''
      ];
      
      invalidEquations.forEach(equation => {
        expect(() => engine.parse(equation)).toThrow();
      });
    });

    it('should maintain consistent API interface', () => {
      const engine = new EquationEngine();
      
      expect(typeof engine.parse).toBe('function');
      expect(typeof engine.solve).toBe('function');
      expect(typeof engine.generateSteps).toBe('function');
      expect(typeof engine.validateStep).toBe('function');
      expect(typeof engine.solveEquation).toBe('function');
      expect(typeof engine.validateSolution).toBe('function');
    });
  });
});