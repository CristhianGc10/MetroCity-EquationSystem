"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const EquationService_1 = require("../../services/EquationService");
describe('EquationService', () => {
    let service;
    beforeEach(() => {
        service = new EquationService_1.EquationService();
    });
    describe('saveEquation', () => {
        it('should save a valid linear equation', () => __awaiter(void 0, void 0, void 0, function* () {
            const request = {
                equationString: 'x + 2 = 5'
            };
            const id = yield service.saveEquation(request);
            expect(id).toBeDefined();
            expect(id).toMatch(/^eq_/);
        }));
        it('should save equation with multiple variables', () => __awaiter(void 0, void 0, void 0, function* () {
            const request = {
                equationString: 'x + y = 10'
            };
            const id = yield service.saveEquation(request);
            const equation = yield service.getEquation(id);
            expect(equation.metadata.variables).toContain('x');
            expect(equation.metadata.variables).toContain('y');
        }));
        it('should reject equation without equals sign', () => __awaiter(void 0, void 0, void 0, function* () {
            const request = {
                equationString: 'x + 2'
            };
            yield expect(service.saveEquation(request)).rejects.toThrow();
        }));
        it('should detect quadratic equations', () => __awaiter(void 0, void 0, void 0, function* () {
            const request = {
                equationString: 'x^2 + 2x = 8'
            };
            const id = yield service.saveEquation(request);
            const equation = yield service.getEquation(id);
            expect(equation.metadata.type).toBe('quadratic');
        }));
    });
    describe('getEquation', () => {
        it('should retrieve saved equation', () => __awaiter(void 0, void 0, void 0, function* () {
            const request = {
                equationString: '2x + 3 = 7'
            };
            const id = yield service.saveEquation(request);
            const equation = yield service.getEquation(id);
            expect(equation).toBeDefined();
            expect(equation.type).toBe('equation');
            expect(equation.metadata.type).toBe('linear');
        }));
        it('should throw error for non-existent equation', () => __awaiter(void 0, void 0, void 0, function* () {
            yield expect(service.getEquation('non-existent-id')).rejects.toThrow('Equation not found');
        }));
    });
    describe('validateSolution', () => {
        it('should validate correct solution', () => __awaiter(void 0, void 0, void 0, function* () {
            const request = {
                equationString: 'x + 2 = 5'
            };
            const id = yield service.saveEquation(request);
            const validationRequest = {
                solution: {
                    id: 'sol_test',
                    variables: { x: 3 },
                    steps: [
                        {
                            id: 'step_1',
                            type: 'solve',
                            description: 'Solve for x',
                            equation: yield service.getEquation(id),
                            reasoning: 'Subtract 2 from both sides',
                            isValid: true
                        }
                    ],
                    isComplete: true,
                    confidence: 0.9
                }
            };
            const result = yield service.validateSolution(id, validationRequest);
            expect(result.isValid).toBe(true);
            expect(result.score).toBeGreaterThan(70);
        }));
        it('should reject incomplete solution', () => __awaiter(void 0, void 0, void 0, function* () {
            const request = {
                equationString: 'x + 2 = 5'
            };
            const id = yield service.saveEquation(request);
            const validationRequest = {
                solution: {
                    id: 'sol_test',
                    variables: {},
                    steps: [],
                    isComplete: false,
                    confidence: 0.1
                }
            };
            const result = yield service.validateSolution(id, validationRequest);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        }));
        it('should handle validation for non-existent equation', () => __awaiter(void 0, void 0, void 0, function* () {
            const validationRequest = {
                solution: {
                    id: 'sol_test',
                    variables: { x: 3 },
                    steps: [],
                    isComplete: true,
                    confidence: 0.9
                }
            };
            const result = yield service.validateSolution('non-existent-id', validationRequest);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('not found'))).toBe(true);
        }));
    });
    describe('getAllEquations', () => {
        it('should return empty array initially', () => __awaiter(void 0, void 0, void 0, function* () {
            const equations = yield service.getAllEquations();
            expect(equations).toEqual([]);
        }));
        it('should return saved equations', () => __awaiter(void 0, void 0, void 0, function* () {
            const request1 = { equationString: 'x + 1 = 2' };
            const request2 = { equationString: 'y + 3 = 5' };
            yield service.saveEquation(request1);
            yield service.saveEquation(request2);
            const equations = yield service.getAllEquations();
            expect(equations.length).toBe(2);
        }));
        it('should return equations sorted by creation date', () => __awaiter(void 0, void 0, void 0, function* () {
            const request1 = { equationString: 'x + 1 = 2' };
            const request2 = { equationString: 'y + 3 = 5' };
            const id1 = yield service.saveEquation(request1);
            // Small delay to ensure different timestamps
            yield new Promise(resolve => setTimeout(resolve, 10));
            const id2 = yield service.saveEquation(request2);
            const equations = yield service.getAllEquations();
            expect(equations[0].id).toBe(id2); // Most recent first
            expect(equations[1].id).toBe(id1);
        }));
    });
    describe('deleteEquation', () => {
        it('should delete existing equation', () => __awaiter(void 0, void 0, void 0, function* () {
            const request = {
                equationString: 'x + 2 = 5'
            };
            const id = yield service.saveEquation(request);
            const deleted = yield service.deleteEquation(id);
            expect(deleted).toBe(true);
            yield expect(service.getEquation(id)).rejects.toThrow();
        }));
        it('should return false for non-existent equation', () => __awaiter(void 0, void 0, void 0, function* () {
            const deleted = yield service.deleteEquation('non-existent-id');
            expect(deleted).toBe(false);
        }));
    });
    describe('getEquationsByType', () => {
        it('should filter equations by type', () => __awaiter(void 0, void 0, void 0, function* () {
            const linearRequest = { equationString: 'x + 2 = 5' };
            const quadraticRequest = { equationString: 'x^2 + 2x = 8' };
            yield service.saveEquation(linearRequest);
            yield service.saveEquation(quadraticRequest);
            const linearEquations = yield service.getEquationsByType('linear');
            const quadraticEquations = yield service.getEquationsByType('quadratic');
            expect(linearEquations.length).toBe(1);
            expect(quadraticEquations.length).toBe(1);
            expect(linearEquations[0].equation.metadata.type).toBe('linear');
            expect(quadraticEquations[0].equation.metadata.type).toBe('quadratic');
        }));
    });
    describe('updateEquationSolution', () => {
        it('should update equation with solution', () => __awaiter(void 0, void 0, void 0, function* () {
            const request = {
                equationString: 'x + 2 = 5'
            };
            const id = yield service.saveEquation(request);
            const solution = {
                id: 'sol_test',
                variables: { x: 3 },
                steps: [],
                isComplete: true,
                confidence: 0.9
            };
            yield service.updateEquationSolution(id, solution);
            const equations = yield service.getAllEquations();
            const updatedEquation = equations.find(eq => eq.id === id);
            expect(updatedEquation === null || updatedEquation === void 0 ? void 0 : updatedEquation.solution).toEqual(solution);
        }));
        it('should throw error for non-existent equation', () => __awaiter(void 0, void 0, void 0, function* () {
            const solution = {
                id: 'sol_test',
                variables: { x: 3 },
                steps: [],
                isComplete: true,
                confidence: 0.9
            };
            yield expect(service.updateEquationSolution('non-existent-id', solution))
                .rejects.toThrow('Equation not found');
        }));
    });
    describe('getServiceInfo', () => {
        it('should return service information', () => {
            const info = service.getServiceInfo();
            expect(info.name).toBe('MetroCity Equation Service');
            expect(info.version).toBe('1.0.0');
            expect(info.totalEquations).toBe(0);
        });
        it('should update equation count', () => __awaiter(void 0, void 0, void 0, function* () {
            const request = {
                equationString: 'x + 2 = 5'
            };
            yield service.saveEquation(request);
            const info = service.getServiceInfo();
            expect(info.totalEquations).toBe(1);
        }));
    });
});
