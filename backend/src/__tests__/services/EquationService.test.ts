import { EquationService } from '../../services/EquationService';
import { CreateEquationRequest, ValidateSolutionRequest } from '../../types/EquationTypes';

describe('EquationService', () => {
  let service: EquationService;

  beforeEach(() => {
    service = new EquationService();
  });

  describe('saveEquation', () => {
    it('should save a valid linear equation', async () => {
      const request: CreateEquationRequest = {
        equationString: 'x + 2 = 5'
      };

      const id = await service.saveEquation(request);

      expect(id).toBeDefined();
      expect(id).toMatch(/^eq_/);
    });

    it('should save equation with multiple variables', async () => {
      const request: CreateEquationRequest = {
        equationString: 'x + y = 10'
      };

      const id = await service.saveEquation(request);
      const equation = await service.getEquation(id);

      expect(equation.metadata.variables).toContain('x');
      expect(equation.metadata.variables).toContain('y');
    });

    it('should reject equation without equals sign', async () => {
      const request: CreateEquationRequest = {
        equationString: 'x + 2'
      };

      await expect(service.saveEquation(request)).rejects.toThrow();
    });

    it('should detect quadratic equations', async () => {
      const request: CreateEquationRequest = {
        equationString: 'x^2 + 2x = 8'
      };

      const id = await service.saveEquation(request);
      const equation = await service.getEquation(id);

      expect(equation.metadata.type).toBe('quadratic');
    });
  });

  describe('getEquation', () => {
    it('should retrieve saved equation', async () => {
      const request: CreateEquationRequest = {
        equationString: '2x + 3 = 7'
      };

      const id = await service.saveEquation(request);
      const equation = await service.getEquation(id);

      expect(equation).toBeDefined();
      expect(equation.type).toBe('equation');
      expect(equation.metadata.type).toBe('linear');
    });

    it('should throw error for non-existent equation', async () => {
      await expect(service.getEquation('non-existent-id')).rejects.toThrow('Equation not found');
    });
  });

  describe('validateSolution', () => {
    it('should validate correct solution', async () => {
      const request: CreateEquationRequest = {
        equationString: 'x + 2 = 5'
      };

      const id = await service.saveEquation(request);

      const validationRequest: ValidateSolutionRequest = {
        solution: {
          id: 'sol_test',
          variables: { x: 3 },
          steps: [
            {
              id: 'step_1',
              type: 'solve',
              description: 'Solve for x',
              equation: await service.getEquation(id),
              reasoning: 'Subtract 2 from both sides',
              isValid: true
            }
          ],
          isComplete: true,
          confidence: 0.9
        }
      };

      const result = await service.validateSolution(id, validationRequest);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(70);
    });

    it('should reject incomplete solution', async () => {
      const request: CreateEquationRequest = {
        equationString: 'x + 2 = 5'
      };

      const id = await service.saveEquation(request);

      const validationRequest: ValidateSolutionRequest = {
        solution: {
          id: 'sol_test',
          variables: {},
          steps: [],
          isComplete: false,
          confidence: 0.1
        }
      };

      const result = await service.validateSolution(id, validationRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle validation for non-existent equation', async () => {
      const validationRequest: ValidateSolutionRequest = {
        solution: {
          id: 'sol_test',
          variables: { x: 3 },
          steps: [],
          isComplete: true,
          confidence: 0.9
        }
      };

      const result = await service.validateSolution('non-existent-id', validationRequest);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('not found'))).toBe(true);
    });
  });

  describe('getAllEquations', () => {
    it('should return empty array initially', async () => {
      const equations = await service.getAllEquations();

      expect(equations).toEqual([]);
    });

    it('should return saved equations', async () => {
      const request1: CreateEquationRequest = { equationString: 'x + 1 = 2' };
      const request2: CreateEquationRequest = { equationString: 'y + 3 = 5' };

      await service.saveEquation(request1);
      await service.saveEquation(request2);

      const equations = await service.getAllEquations();

      expect(equations.length).toBe(2);
    });

    it('should return equations sorted by creation date', async () => {
      const request1: CreateEquationRequest = { equationString: 'x + 1 = 2' };
      const request2: CreateEquationRequest = { equationString: 'y + 3 = 5' };

      const id1 = await service.saveEquation(request1);
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const id2 = await service.saveEquation(request2);

      const equations = await service.getAllEquations();

      expect(equations[0].id).toBe(id2); // Most recent first
      expect(equations[1].id).toBe(id1);
    });
  });

  describe('deleteEquation', () => {
    it('should delete existing equation', async () => {
      const request: CreateEquationRequest = {
        equationString: 'x + 2 = 5'
      };

      const id = await service.saveEquation(request);
      const deleted = await service.deleteEquation(id);

      expect(deleted).toBe(true);
      await expect(service.getEquation(id)).rejects.toThrow();
    });

    it('should return false for non-existent equation', async () => {
      const deleted = await service.deleteEquation('non-existent-id');

      expect(deleted).toBe(false);
    });
  });

  describe('getEquationsByType', () => {
    it('should filter equations by type', async () => {
      const linearRequest: CreateEquationRequest = { equationString: 'x + 2 = 5' };
      const quadraticRequest: CreateEquationRequest = { equationString: 'x^2 + 2x = 8' };

      await service.saveEquation(linearRequest);
      await service.saveEquation(quadraticRequest);

      const linearEquations = await service.getEquationsByType('linear');
      const quadraticEquations = await service.getEquationsByType('quadratic');

      expect(linearEquations.length).toBe(1);
      expect(quadraticEquations.length).toBe(1);
      expect(linearEquations[0].equation.metadata.type).toBe('linear');
      expect(quadraticEquations[0].equation.metadata.type).toBe('quadratic');
    });
  });

  describe('updateEquationSolution', () => {
    it('should update equation with solution', async () => {
      const request: CreateEquationRequest = {
        equationString: 'x + 2 = 5'
      };

      const id = await service.saveEquation(request);

      const solution = {
        id: 'sol_test',
        variables: { x: 3 },
        steps: [],
        isComplete: true,
        confidence: 0.9
      };

      await service.updateEquationSolution(id, solution);

      const equations = await service.getAllEquations();
      const updatedEquation = equations.find(eq => eq.id === id);

      expect(updatedEquation?.solution).toEqual(solution);
    });

    it('should throw error for non-existent equation', async () => {
      const solution = {
        id: 'sol_test',
        variables: { x: 3 },
        steps: [],
        isComplete: true,
        confidence: 0.9
      };

      await expect(service.updateEquationSolution('non-existent-id', solution))
        .rejects.toThrow('Equation not found');
    });
  });

  describe('getServiceInfo', () => {
    it('should return service information', () => {
      const info = service.getServiceInfo();

      expect(info.name).toBe('MetroCity Equation Service');
      expect(info.version).toBe('1.0.0');
      expect(info.totalEquations).toBe(0);
    });

    it('should update equation count', async () => {
      const request: CreateEquationRequest = {
        equationString: 'x + 2 = 5'
      };

      await service.saveEquation(request);

      const info = service.getServiceInfo();
      expect(info.totalEquations).toBe(1);
    });
  });
});