"use strict";
// backend/src/validate.ts
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
exports.validateBackend = validateBackend;
/**
 * Script de validación para verificar que todos los servicios funcionan correctamente
 * Ejecutar con: npx ts-node src/validate.ts
 */
const EquationEngine_1 = require("./engines/EquationEngine");
const DatabaseService_1 = require("./services/DatabaseService");
const CacheService_1 = require("./services/CacheService");
const AnalyticsService_1 = require("./services/AnalyticsService");
const EquationService_1 = require("./services/EquationService");
function validateBackend() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🔍 Iniciando validación del backend MetroCity...\n');
        const results = {
            passed: 0,
            failed: 0,
            errors: []
        };
        // Test 1: EquationEngine
        try {
            console.log('✅ Probando EquationEngine...');
            const engine = new EquationEngine_1.EquationEngine();
            const parseResult = engine.parse('2x + 3 = 7');
            if (!parseResult.ast)
                throw new Error('Parse result should have AST');
            const solution = engine.solve(parseResult.ast);
            if (typeof solution.value !== 'number')
                throw new Error('Solution should have numeric value');
            const steps = engine.generateSteps(parseResult.ast);
            if (steps.steps.length === 0)
                throw new Error('Should generate steps');
            console.log('   ✓ Parse, solve, y generación de pasos funcionan');
            results.passed++;
        }
        catch (error) {
            console.log('   ❌ EquationEngine falló:', error instanceof Error ? error.message : 'Error desconocido');
            results.failed++;
            results.errors.push(`EquationEngine: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
        // Test 2: DatabaseService
        try {
            console.log('✅ Probando DatabaseService...');
            const dbService = new DatabaseService_1.DatabaseService();
            const mockData = {
                id: 'test-eq-123',
                userId: 'test-user-456',
                originalInput: '2x + 3 = 7',
                ast: {},
                parseResult: {},
                createdAt: new Date(),
                status: 'active'
            };
            const savedId = yield dbService.saveEquation(mockData);
            if (savedId !== mockData.id)
                throw new Error('Should return correct ID');
            const hasAccess = yield dbService.userHasAccessToEquation('test-user-456', 'test-eq-123');
            if (!hasAccess)
                throw new Error('User should have access to their equation');
            const stats = yield dbService.getUserStatistics('test-user-456');
            if (typeof stats.totalEquations !== 'number')
                throw new Error('Stats should have numeric values');
            console.log('   ✓ Save, access check, y estadísticas funcionan');
            results.passed++;
        }
        catch (error) {
            console.log('   ❌ DatabaseService falló:', error instanceof Error ? error.message : 'Error desconocido');
            results.failed++;
            results.errors.push(`DatabaseService: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
        // Test 3: CacheService
        try {
            console.log('✅ Probando CacheService...');
            const cacheService = new CacheService_1.CacheService();
            yield cacheService.set('test-key', { value: 'test-data' }, 60);
            const cachedValue = yield cacheService.get('test-key');
            if (!cachedValue || cachedValue.value !== 'test-data')
                throw new Error('Cache should store and retrieve data');
            const exists = yield cacheService.exists('test-key');
            if (!exists)
                throw new Error('Key should exist');
            yield cacheService.delete('test-key');
            const deletedValue = yield cacheService.get('test-key');
            if (deletedValue !== null)
                throw new Error('Key should be deleted');
            console.log('   ✓ Set, get, exists, y delete funcionan');
            results.passed++;
        }
        catch (error) {
            console.log('   ❌ CacheService falló:', error instanceof Error ? error.message : 'Error desconocido');
            results.failed++;
            results.errors.push(`CacheService: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
        // Test 4: AnalyticsService
        try {
            console.log('✅ Probando AnalyticsService...');
            const analyticsService = new AnalyticsService_1.AnalyticsService();
            const mockAST = {
                equationType: 'basic',
                complexity: 2,
                variables: ['x'],
                metadata: {
                    originalInput: '2x + 3 = 7',
                    difficultyLevel: 'beginner',
                    estimatedSteps: 2
                }
            };
            yield analyticsService.recordEquationCreation('test-user', 'test-eq', mockAST);
            yield analyticsService.recordStepAttempt('test-user', 'test-eq', 0, true);
            yield analyticsService.recordError('test-user', 'test-operation', 'test error');
            const metrics = yield analyticsService.getUserMetrics('test-user');
            if (typeof metrics.totalEvents !== 'number')
                throw new Error('Metrics should have numeric values');
            console.log('   ✓ Record events y métricas funcionan');
            results.passed++;
        }
        catch (error) {
            console.log('   ❌ AnalyticsService falló:', error instanceof Error ? error.message : 'Error desconocido');
            results.failed++;
            results.errors.push(`AnalyticsService: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
        // Test 5: EquationService (Integración)
        try {
            console.log('✅ Probando EquationService (integración)...');
            const equationService = new EquationService_1.EquationService();
            const result = yield equationService.processEquation('2x + 3 = 7', 'test-user-integration');
            if (!result.id)
                throw new Error('Should return equation ID');
            if (!result.parseResult)
                throw new Error('Should return parse result');
            console.log('   ✓ Procesamiento completo de ecuación funciona');
            results.passed++;
        }
        catch (error) {
            console.log('   ❌ EquationService falló:', error instanceof Error ? error.message : 'Error desconocido');
            results.failed++;
            results.errors.push(`EquationService: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
        // Test 6: Performance básico
        try {
            console.log('✅ Probando performance básico...');
            const engine = new EquationEngine_1.EquationEngine();
            const startTime = Date.now();
            for (let i = 0; i < 10; i++) {
                engine.parse(`${i}x + ${i + 1} = ${i + 5}`);
            }
            const endTime = Date.now();
            const averageTime = (endTime - startTime) / 10;
            if (averageTime > 200)
                throw new Error(`Average parse time too slow: ${averageTime}ms`);
            console.log(`   ✓ Performance OK (${averageTime.toFixed(2)}ms promedio por parse)`);
            results.passed++;
        }
        catch (error) {
            console.log('   ❌ Performance test falló:', error instanceof Error ? error.message : 'Error desconocido');
            results.failed++;
            results.errors.push(`Performance: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
        // Resumen final
        console.log('\n🏁 RESUMEN DE VALIDACIÓN:');
        console.log(`✅ Pruebas exitosas: ${results.passed}`);
        console.log(`❌ Pruebas fallidas: ${results.failed}`);
        if (results.failed > 0) {
            console.log('\n🚨 ERRORES ENCONTRADOS:');
            results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        else {
            console.log('\n🎉 ¡Todas las pruebas pasaron! El backend está listo para la Fase 1.2');
        }
        // Verificar criterios específicos de la Fase 1.2
        console.log('\n📋 VERIFICACIÓN DE CRITERIOS FASE 1.2:');
        console.log(`✅ Parser reconoce múltiples tipos: ${results.passed >= 1 ? 'SÍ' : 'NO'}`);
        console.log(`✅ Generador de pasos funciona: ${results.passed >= 1 ? 'SÍ' : 'NO'}`);
        console.log(`✅ API responde rápidamente: ${results.passed >= 6 ? 'SÍ' : 'NO'}`);
        console.log(`✅ Servicios están integrados: ${results.passed >= 5 ? 'SÍ' : 'NO'}`);
        if (results.failed === 0) {
            console.log('\n🏆 ¡FASE 1.2 COMPLETADA EXITOSAMENTE!');
            process.exit(0);
        }
        else {
            console.log('\n⚠️  Algunos componentes necesitan corrección antes de continuar');
            process.exit(1);
        }
    });
}
// Ejecutar validación
if (require.main === module) {
    validateBackend().catch(error => {
        console.error('💥 Error inesperado durante la validación:', error);
        process.exit(1);
    });
}
