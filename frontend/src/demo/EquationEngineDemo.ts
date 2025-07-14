import { EquationEngine } from '../engines/equation/EquationEngine';

export function runEquationEngineDemo() {
  console.log('🧮 MetroCity Equation Engine Demo\n');
  
  const engine = new EquationEngine();
  
  // Demo equations to test
  const testEquations = [
    'x + 5 = 10',
    '2x = 10', 
    '2x + 3 = x + 8',
    '3x + 2 = 8',
    'x + 1 = 4'
  ];

  console.log('📋 Testing Linear Equations:\n');
  
  testEquations.forEach((eq, index) => {
    console.log(`${index + 1}. Solving: ${eq}`);
    
    const startTime = performance.now();
    const solution = engine.solveEquation(eq);
    const endTime = performance.now();
    
    console.log(`   ✅ Solution: x = ${solution.variables.x}`);
    console.log(`   📊 Steps: ${solution.steps.length}`);
    console.log(`   ⚡ Time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`   🎯 Complete: ${solution.isComplete}`);
    console.log(`   📈 Confidence: ${(solution.confidence * 100).toFixed(1)}%`);
    
    // Show steps
    console.log('   📝 Steps:');
    solution.steps.forEach((step, stepIndex) => {
      console.log(`      ${stepIndex + 1}. ${step.description}`);
      console.log(`         └─ ${step.reasoning}`);
    });
    
    console.log('');
  });

  // Test engine info
  console.log('ℹ️  Engine Information:');
  const info = engine.getEngineInfo();
  console.log(`   Name: ${info.name}`);
  console.log(`   Version: ${info.version}`);
  console.log(`   Capabilities:`);
  info.capabilities.forEach(cap => console.log(`   - ${cap}`));

  console.log('\n🎉 Demo completed successfully!');
  
  return {
    testResults: testEquations.map(eq => {
      const solution = engine.solveEquation(eq);
      return {
        equation: eq,
        solution: solution.variables,
        isComplete: solution.isComplete,
        stepCount: solution.steps.length
      };
    }),
    engineInfo: info
  };
}

// Example usage in browser console or Node.js
if (typeof window === 'undefined') {
  // Running in Node.js
  runEquationEngineDemo();
}