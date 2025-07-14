import { SimpleEquationSolver } from '../../engines/equation/SimpleEquationSolver';

describe('Debug Simple Solver', () => {
  let solver: SimpleEquationSolver;

  beforeEach(() => {
    solver = new SimpleEquationSolver();
  });

  it('should solve x + 5 = 10', () => {
    const solution = solver.parseAndSolve('x + 5 = 10');
    console.log('x + 5 = 10 solution:', solution);
    expect(solution.isComplete).toBe(true);
    expect(solution.variables.x).toBe(5);
  });

  it('should solve 2x = 10', () => {
    const solution = solver.parseAndSolve('2x = 10');
    console.log('2x = 10 solution:', solution);
    expect(solution.isComplete).toBe(true);
    expect(solution.variables.x).toBe(5);
  });

  it('should solve 2x + 3 = x + 8', () => {
    const solution = solver.parseAndSolve('2x + 3 = x + 8');
    console.log('2x + 3 = x + 8 solution:', solution);
    expect(solution.isComplete).toBe(true);
    expect(solution.variables.x).toBe(5);
  });
});