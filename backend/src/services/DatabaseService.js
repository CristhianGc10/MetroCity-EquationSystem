"use strict";
// backend/src/services/DatabaseService.ts
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
exports.DatabaseService = void 0;
/**
 * Servicio de Base de Datos
 * Maneja todas las operaciones de persistencia
 * Implementación simulada para Phase 1.2
 */
class DatabaseService {
    constructor() {
        this.mockData = new Map();
        console.log('DatabaseService initialized (mock implementation)');
    }
    saveEquation(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('DatabaseService: Saving equation:', data.id);
            // Simulación de guardado en base de datos
            this.mockData.set(`equation_${data.id}`, Object.assign(Object.assign({}, data), { savedAt: new Date() }));
            // Simular latencia de base de datos
            yield this.delay(50);
            return data.id;
        });
    }
    getEquation(equationId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('DatabaseService: Getting equation:', equationId);
            const data = this.mockData.get(`equation_${equationId}`);
            if (!data) {
                throw new Error(`Equation ${equationId} not found`);
            }
            yield this.delay(30);
            return data.ast;
        });
    }
    saveSolution(equationId, solution) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('DatabaseService: Saving solution for equation:', equationId);
            this.mockData.set(`solution_${equationId}`, {
                solution,
                savedAt: new Date()
            });
            yield this.delay(40);
        });
    }
    getSolution(equationId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('DatabaseService: Getting solution for equation:', equationId);
            const data = this.mockData.get(`solution_${equationId}`);
            if (!data) {
                // Retornar solución por defecto para testing
                return {
                    variable: 'x',
                    value: 2,
                    steps: [],
                    verificationsSteps: [{
                            substitution: 'x = 2',
                            leftSideResult: 7,
                            rightSideResult: 7,
                            isValid: true
                        }],
                    solutionMethod: 'direct_isolation',
                    confidence: 0.95
                };
            }
            yield this.delay(30);
            return data.solution;
        });
    }
    saveSteps(equationId, steps) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('DatabaseService: Saving steps for equation:', equationId, `(${steps.length} steps)`);
            this.mockData.set(`steps_${equationId}`, {
                steps,
                savedAt: new Date()
            });
            yield this.delay(45);
        });
    }
    getSteps(equationId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('DatabaseService: Getting steps for equation:', equationId);
            const data = this.mockData.get(`steps_${equationId}`);
            if (!data) {
                // Retornar pasos por defecto para testing
                return [
                    {
                        id: 'default_step_1',
                        type: 'transposition',
                        description: 'Transponer término constante',
                        fromExpression: {},
                        toExpression: {},
                        justification: 'Aplicar propiedad de igualdad',
                        difficulty: 2,
                        hints: ['Mover términos al otro lado cambiando el signo']
                    },
                    {
                        id: 'default_step_2',
                        type: 'isolation',
                        description: 'Aislar la variable',
                        fromExpression: {},
                        toExpression: {},
                        justification: 'Dividir entre el coeficiente',
                        difficulty: 1,
                        hints: ['Dividir ambos lados entre el coeficiente de la variable']
                    }
                ];
            }
            yield this.delay(35);
            return data.steps;
        });
    }
    userHasAccessToEquation(userId, equationId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('DatabaseService: Checking access for user:', userId, 'equation:', equationId);
            const equationData = this.mockData.get(`equation_${equationId}`);
            // En la implementación simulada, siempre permitir acceso
            // En la implementación real, verificar ownership
            yield this.delay(20);
            if (!equationData) {
                return false;
            }
            return equationData.userId === userId || userId === 'test-user-123';
        });
    }
    recordStepAttempt(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('DatabaseService: Recording step attempt:', {
                equationId: data.equationId,
                userId: data.userId,
                stepIndex: data.stepIndex,
                isCorrect: data.isCorrect
            });
            const attemptKey = `attempt_${data.equationId}_${data.stepIndex}_${Date.now()}`;
            this.mockData.set(attemptKey, data);
            yield this.delay(30);
        });
    }
    getUserStatistics(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('DatabaseService: Getting user statistics:', userId);
            yield this.delay(40);
            // Datos simulados para testing
            return {
                totalEquations: Math.floor(Math.random() * 20) + 5,
                solvedEquations: Math.floor(Math.random() * 15) + 3,
                averageTime: Math.floor(Math.random() * 180) + 60, // 60-240 segundos
                strengthsByType: {
                    basic: Math.random() * 0.4 + 0.6, // 0.6-1.0
                    standard: Math.random() * 0.5 + 0.4, // 0.4-0.9
                    distributive: Math.random() * 0.6 + 0.2, // 0.2-0.8
                    complex: Math.random() * 0.4 + 0.1 // 0.1-0.5
                }
            };
        });
    }
    getRecentUserActivity(userId, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('DatabaseService: Getting recent activity for user:', userId, 'limit:', limit);
            yield this.delay(35);
            // Actividad simulada
            const activities = [];
            const now = new Date();
            for (let i = 0; i < Math.min(limit, 5); i++) {
                const activityDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // i días atrás
                activities.push({
                    id: `activity_${i}`,
                    type: ['equation_solved', 'step_completed', 'hint_used'][Math.floor(Math.random() * 3)],
                    timestamp: activityDate,
                    details: {
                        equationId: `eq_${Date.now()}_${i}`,
                        performance: Math.random() * 0.4 + 0.6 // 0.6-1.0
                    }
                });
            }
            return activities;
        });
    }
    getUserErrors(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('DatabaseService: Getting user errors:', userId);
            yield this.delay(30);
            // Errores simulados para análisis
            return [
                {
                    type: 'calculation_error',
                    frequency: Math.floor(Math.random() * 5) + 1,
                    lastOccurrence: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    context: 'transposition'
                },
                {
                    type: 'sign_error',
                    frequency: Math.floor(Math.random() * 3) + 1,
                    lastOccurrence: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
                    context: 'isolation'
                },
                {
                    type: 'order_error',
                    frequency: Math.floor(Math.random() * 4) + 1,
                    lastOccurrence: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
                    context: 'step_sequence'
                }
            ];
        });
    }
    // ============================================================================
    // MÉTODOS AUXILIARES
    // ============================================================================
    /**
     * Simula latencia de base de datos
     */
    delay(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
    /**
     * Limpia datos simulados (útil para testing)
     */
    clearMockData() {
        this.mockData.clear();
        console.log('DatabaseService: Mock data cleared');
    }
    /**
     * Obtiene estadísticas del servicio
     */
    getServiceStats() {
        return {
            mockDataEntries: this.mockData.size,
            isSimulated: true,
            version: '1.0.0-mock'
        };
    }
}
exports.DatabaseService = DatabaseService;
