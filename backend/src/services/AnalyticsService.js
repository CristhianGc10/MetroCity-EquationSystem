"use strict";
// backend/src/services/AnalyticsService.ts
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
exports.AnalyticsService = void 0;
/**
 * Servicio de Analytics
 * Registra eventos y métricas para análisis
 * Implementación simulada para Phase 1.2
 */
class AnalyticsService {
    constructor() {
        this.events = new Map();
        this.sessionStart = new Date();
        console.log('AnalyticsService initialized (mock implementation)');
    }
    recordEquationCreation(userId, equationId, ast) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = {
                id: this.generateEventId(),
                userId,
                eventType: 'equation_created',
                timestamp: new Date(),
                data: {
                    equationId,
                    equationType: ast.equationType,
                    complexity: ast.complexity,
                    variables: ast.variables,
                    estimatedSteps: ast.metadata.estimatedSteps
                },
                metadata: {
                    originalInput: ast.metadata.originalInput,
                    difficultyLevel: ast.metadata.difficultyLevel
                }
            };
            yield this.recordEvent(event);
            console.log('Analytics: Equation created', {
                userId,
                equationId,
                type: ast.equationType,
                complexity: ast.complexity
            });
        });
    }
    recordEquationAccess(userId, equationId, accessType) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = {
                id: this.generateEventId(),
                userId,
                eventType: 'equation_accessed',
                timestamp: new Date(),
                data: {
                    equationId,
                    accessType // 'cache_hit', 'direct_access', etc.
                }
            };
            yield this.recordEvent(event);
            console.log('Analytics: Equation accessed', {
                userId,
                equationId,
                accessType
            });
        });
    }
    recordStepAttempt(userId, equationId, stepIndex, isCorrect) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = {
                id: this.generateEventId(),
                userId,
                eventType: 'step_attempted',
                timestamp: new Date(),
                data: {
                    equationId,
                    stepIndex,
                    isCorrect,
                    attemptNumber: yield this.getAttemptNumber(userId, equationId, stepIndex)
                }
            };
            yield this.recordEvent(event);
            console.log('Analytics: Step attempt', {
                userId,
                equationId,
                stepIndex,
                isCorrect
            });
        });
    }
    recordSimilarEquationGeneration(userId, baseEquationId, newEquationId) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = {
                id: this.generateEventId(),
                userId,
                eventType: 'similar_equation_generated',
                timestamp: new Date(),
                data: {
                    baseEquationId,
                    newEquationId,
                    generationTime: new Date()
                }
            };
            yield this.recordEvent(event);
            console.log('Analytics: Similar equation generated', {
                userId,
                baseEquationId,
                newEquationId
            });
        });
    }
    recordErrorAnalysis(userId, analysis) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const event = {
                id: this.generateEventId(),
                userId,
                eventType: 'error_analysis_completed',
                timestamp: new Date(),
                data: {
                    analysis,
                    analysisTimestamp: new Date()
                }
            };
            yield this.recordEvent(event);
            console.log('Analytics: Error analysis completed', {
                userId,
                commonErrors: ((_a = analysis.commonErrors) === null || _a === void 0 ? void 0 : _a.length) || 0,
                weakTopics: ((_b = analysis.weakTopics) === null || _b === void 0 ? void 0 : _b.length) || 0
            });
        });
    }
    recordError(userId, operation, error) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = {
                id: this.generateEventId(),
                userId,
                eventType: 'error_occurred',
                timestamp: new Date(),
                data: {
                    operation,
                    errorMessage: error,
                    severity: this.categorizeError(error)
                }
            };
            yield this.recordEvent(event);
            console.log('Analytics: Error occurred', {
                userId,
                operation,
                error: error.substring(0, 100) + (error.length > 100 ? '...' : ''),
                timestamp: new Date()
            });
        });
    }
    // ============================================================================
    // MÉTRICAS Y REPORTES
    // ============================================================================
    getUserMetrics(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, timeframe = 'week') {
            const userEvents = this.events.get(userId) || [];
            const cutoffDate = this.getCutoffDate(timeframe);
            const recentEvents = userEvents.filter(event => event.timestamp >= cutoffDate);
            const metrics = {
                totalEvents: recentEvents.length,
                equationsCreated: recentEvents.filter(e => e.eventType === 'equation_created').length,
                stepsAttempted: recentEvents.filter(e => e.eventType === 'step_attempted').length,
                successRate: this.calculateSuccessRate(recentEvents),
                averageComplexity: this.calculateAverageComplexity(recentEvents),
                timeSpent: this.calculateTimeSpent(recentEvents),
                errorRate: this.calculateErrorRate(recentEvents),
                mostCommonErrors: this.getMostCommonErrors(recentEvents)
            };
            console.log(`Analytics: Generated metrics for user ${userId} (${timeframe}):`, {
                totalEvents: metrics.totalEvents,
                successRate: metrics.successRate,
                errorRate: metrics.errorRate
            });
            return metrics;
        });
    }
    getSystemMetrics() {
        return __awaiter(this, void 0, void 0, function* () {
            const allEvents = Array.from(this.events.values()).flat();
            const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentEvents = allEvents.filter(event => event.timestamp >= last24h);
            return {
                totalUsers: this.events.size,
                activeUsersLast24h: new Set(recentEvents.map(e => e.userId)).size,
                totalEvents: allEvents.length,
                eventsLast24h: recentEvents.length,
                topEquationTypes: this.getTopEquationTypes(recentEvents),
                systemUptime: Date.now() - this.sessionStart.getTime(),
                averageResponseTime: this.calculateAverageResponseTime(recentEvents)
            };
        });
    }
    getPerformanceMetrics() {
        return __awaiter(this, void 0, void 0, function* () {
            const allEvents = Array.from(this.events.values()).flat();
            const parseEvents = allEvents.filter(e => e.eventType === 'equation_created');
            return {
                averageParseTime: this.calculateAverageParseTime(parseEvents),
                slowestParses: this.getSlowestParses(parseEvents),
                errorRate: allEvents.filter(e => e.eventType === 'error_occurred').length / allEvents.length,
                memoryUsage: this.estimateMemoryUsage()
            };
        });
    }
    // ============================================================================
    // MÉTODOS AUXILIARES
    // ============================================================================
    recordEvent(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.events.has(event.userId)) {
                this.events.set(event.userId, []);
            }
            this.events.get(event.userId).push(event);
            // Simular latencia de logging
            yield this.delay(5);
        });
    }
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getAttemptNumber(userId, equationId, stepIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const userEvents = this.events.get(userId) || [];
            const stepAttempts = userEvents.filter(event => event.eventType === 'step_attempted' &&
                event.data.equationId === equationId &&
                event.data.stepIndex === stepIndex);
            return stepAttempts.length + 1;
        });
    }
    categorizeError(error) {
        if (error.toLowerCase().includes('critical') || error.toLowerCase().includes('crash')) {
            return 'critical';
        }
        else if (error.toLowerCase().includes('validation') || error.toLowerCase().includes('parsing')) {
            return 'medium';
        }
        else if (error.toLowerCase().includes('timeout') || error.toLowerCase().includes('network')) {
            return 'high';
        }
        else {
            return 'low';
        }
    }
    getCutoffDate(timeframe) {
        const now = Date.now();
        const timeframes = {
            day: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000
        };
        return new Date(now - timeframes[timeframe]);
    }
    calculateSuccessRate(events) {
        const stepEvents = events.filter(e => e.eventType === 'step_attempted');
        if (stepEvents.length === 0)
            return 0;
        const successfulSteps = stepEvents.filter(e => e.data.isCorrect).length;
        return successfulSteps / stepEvents.length;
    }
    calculateAverageComplexity(events) {
        const equationEvents = events.filter(e => e.eventType === 'equation_created');
        if (equationEvents.length === 0)
            return 0;
        const totalComplexity = equationEvents.reduce((sum, e) => sum + (e.data.complexity || 0), 0);
        return totalComplexity / equationEvents.length;
    }
    calculateTimeSpent(events) {
        if (events.length < 2)
            return 0;
        const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const firstEvent = sortedEvents[0];
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        return lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
    }
    calculateErrorRate(events) {
        if (events.length === 0)
            return 0;
        const errorEvents = events.filter(e => e.eventType === 'error_occurred').length;
        return errorEvents / events.length;
    }
    getMostCommonErrors(events) {
        const errorEvents = events.filter(e => e.eventType === 'error_occurred');
        const errorCounts = {};
        errorEvents.forEach(event => {
            const operation = event.data.operation;
            errorCounts[operation] = (errorCounts[operation] || 0) + 1;
        });
        return Object.entries(errorCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([operation]) => operation);
    }
    getTopEquationTypes(events) {
        const equationEvents = events.filter(e => e.eventType === 'equation_created');
        const typeCounts = {};
        equationEvents.forEach(event => {
            const type = event.data.equationType;
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        return typeCounts;
    }
    calculateAverageResponseTime(events) {
        // Simulado - en implementación real usaría timestamps de request/response
        return Math.random() * 100 + 50; // 50-150ms
    }
    calculateAverageParseTime(events) {
        // Simulado - en implementación real extraería parseTime de los datos
        return Math.random() * 50 + 20; // 20-70ms
    }
    getSlowestParses(events) {
        // Simulado - retornar algunos ejemplos
        return events.slice(0, 3).map(event => ({
            equationId: event.data.equationId,
            parseTime: Math.random() * 200 + 100,
            complexity: event.data.complexity
        }));
    }
    estimateMemoryUsage() {
        const sizeInBytes = JSON.stringify(Array.from(this.events.entries())).length;
        if (sizeInBytes < 1024 * 1024) {
            return `${(sizeInBytes / 1024).toFixed(2)} KB`;
        }
        else {
            return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
        }
    }
    delay(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
    // ============================================================================
    // MÉTODOS DE ADMINISTRACIÓN
    // ============================================================================
    getStats() {
        const allEvents = Array.from(this.events.values()).flat();
        return {
            totalUsers: this.events.size,
            totalEvents: allEvents.length,
            memoryUsage: this.estimateMemoryUsage(),
            uptime: Date.now() - this.sessionStart.getTime(),
            isSimulated: true
        };
    }
    clearUserData(userId) {
        this.events.delete(userId);
        console.log(`Analytics: Cleared data for user ${userId}`);
    }
    clearAllData() {
        this.events.clear();
        console.log('Analytics: All data cleared');
    }
}
exports.AnalyticsService = AnalyticsService;
