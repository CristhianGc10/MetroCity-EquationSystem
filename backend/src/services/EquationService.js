"use strict";
// backend/src/services/EquationService.ts
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
exports.EquationService = void 0;
const EquationEngine_1 = require("../engines/EquationEngine");
const DatabaseService_1 = require("./DatabaseService");
const CacheService_1 = require("./CacheService");
const AnalyticsService_1 = require("./AnalyticsService");
/**
 * Servicio Principal de Ecuaciones - Backend
 * Maneja todas las operaciones relacionadas con ecuaciones
 */
class EquationService {
    constructor() {
        this.equationEngine = new EquationEngine_1.EquationEngine();
        this.database = new DatabaseService_1.DatabaseService();
        this.cache = new CacheService_1.CacheService();
        this.analytics = new AnalyticsService_1.AnalyticsService();
    }
    // ============================================================================
    // OPERACIONES PRINCIPALES
    // ============================================================================
    /**
     * Procesa una nueva ecuación del usuario
     */
    processEquation(input, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 1. Verificar caché
                const cacheKey = this.generateCacheKey(input);
                const cached = yield this.cache.get(cacheKey);
                if (cached) {
                    yield this.analytics.recordEquationAccess(userId, cached.id, 'cache_hit');
                    return cached;
                }
                // 2. Parsear ecuación
                const parseResult = this.equationEngine.parse(input);
                if (!parseResult.ast) {
                    throw new Error('No se pudo parsear la ecuación');
                }
                // 3. Generar ID y guardar en base de datos
                const equationId = yield this.database.saveEquation({
                    id: parseResult.ast.metadata.id,
                    userId,
                    originalInput: input,
                    ast: parseResult.ast,
                    parseResult,
                    createdAt: new Date(),
                    status: 'active'
                });
                // 4. Generar solución y pasos
                const solution = this.equationEngine.solve(parseResult.ast);
                const steps = this.equationEngine.generateSteps(parseResult.ast);
                // 5. Guardar resultados
                yield this.database.saveSolution(equationId, solution);
                yield this.database.saveSteps(equationId, steps.steps);
                // 6. Preparar respuesta
                const result = {
                    id: equationId,
                    parseResult,
                    solution,
                    steps
                };
                // 7. Cachear resultado
                yield this.cache.set(cacheKey, result, 3600); // 1 hora
                // 8. Registrar analytics
                yield this.analytics.recordEquationCreation(userId, equationId, parseResult.ast);
                return result;
            }
            catch (error) {
                yield this.analytics.recordError(userId, 'equation_processing', error instanceof Error ? error.message : 'Unknown error');
                throw error;
            }
        });
    }
    /**
     * Obtiene una ecuación por ID
     */
    getEquation(equationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Verificar permisos
                const hasAccess = yield this.database.userHasAccessToEquation(userId, equationId);
                if (!hasAccess) {
                    throw new Error('No tienes permisos para acceder a esta ecuación');
                }
                // Obtener datos
                const equation = yield this.database.getEquation(equationId);
                const solution = yield this.database.getSolution(equationId);
                const steps = yield this.database.getSteps(equationId);
                yield this.analytics.recordEquationAccess(userId, equationId, 'direct_access');
                return { equation, solution, steps };
            }
            catch (error) {
                yield this.analytics.recordError(userId, 'equation_retrieval', error instanceof Error ? error.message : 'Unknown error');
                throw error;
            }
        });
    }
    /**
     * Valida un paso del estudiante
     */
    validateStudentStep(equationId, userId, attemptedStep, currentStepIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Obtener ecuación y pasos esperados
                const equation = yield this.database.getEquation(equationId);
                const expectedSteps = yield this.database.getSteps(equationId);
                // Validar paso
                const validation = this.equationEngine.validateStep(equation, attemptedStep, expectedSteps);
                // Determinar si es correcto
                const isCorrect = validation.isValid &&
                    this.isStepCorrect(attemptedStep, expectedSteps[currentStepIndex]);
                // Calcular progreso
                const progress = (currentStepIndex + (isCorrect ? 1 : 0)) / expectedSteps.length;
                // Generar hint si es necesario
                let nextHint;
                if (!isCorrect && currentStepIndex < expectedSteps.length) {
                    nextHint = yield this.generateHint(equation, expectedSteps[currentStepIndex], attemptedStep);
                }
                // Registrar intento
                yield this.database.recordStepAttempt({
                    equationId,
                    userId,
                    stepIndex: currentStepIndex,
                    attemptedStep,
                    isCorrect,
                    timestamp: new Date()
                });
                yield this.analytics.recordStepAttempt(userId, equationId, currentStepIndex, isCorrect);
                return Object.assign(Object.assign({}, validation), { isCorrect,
                    nextHint,
                    progress });
            }
            catch (error) {
                yield this.analytics.recordError(userId, 'step_validation', error instanceof Error ? error.message : 'Unknown error');
                throw error;
            }
        });
    }
    /**
     * Genera una nueva ecuación similar para práctica
     */
    generateSimilarEquation(baseEquationId, userId, difficulty) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const baseEquation = yield this.database.getEquation(baseEquationId);
                // Generar variación
                const variation = yield this.generateEquationVariation(baseEquation, difficulty);
                // Procesar nueva ecuación
                const result = yield this.processEquation(variation.equation, userId);
                yield this.analytics.recordSimilarEquationGeneration(userId, baseEquationId, result.id);
                return {
                    id: result.id,
                    equation: variation.equation,
                    context: variation.context
                };
            }
            catch (error) {
                yield this.analytics.recordError(userId, 'similar_equation_generation', error instanceof Error ? error.message : 'Unknown error');
                throw error;
            }
        });
    }
    // ============================================================================
    // OPERACIONES DE ANÁLISIS
    // ============================================================================
    /**
     * Obtiene estadísticas de progreso del usuario
     */
    getUserProgress(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield this.database.getUserStatistics(userId);
                const recentActivity = yield this.database.getRecentUserActivity(userId, 10);
                return {
                    totalEquations: stats.totalEquations,
                    solvedEquations: stats.solvedEquations,
                    averageTime: stats.averageTime,
                    strengthsByType: stats.strengthsByType,
                    recentActivity
                };
            }
            catch (error) {
                yield this.analytics.recordError(userId, 'progress_retrieval', error instanceof Error ? error.message : 'Unknown error');
                throw error;
            }
        });
    }
    /**
     * Identifica patrones de error del usuario
     */
    analyzeUserErrors(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const errorData = yield this.database.getUserErrors(userId);
                const analysis = {
                    commonErrors: this.identifyCommonErrors(errorData),
                    suggestions: this.generateImprovementSuggestions(errorData),
                    weakTopics: this.identifyWeakTopics(errorData)
                };
                yield this.analytics.recordErrorAnalysis(userId, analysis);
                return analysis;
            }
            catch (error) {
                yield this.analytics.recordError(userId, 'error_analysis', error instanceof Error ? error.message : 'Unknown error');
                throw error;
            }
        });
    }
    // ============================================================================
    // MÉTODOS AUXILIARES
    // ============================================================================
    /**
     * Genera clave de caché para una ecuación
     */
    generateCacheKey(input) {
        // Normalizar entrada para caché consistente
        const normalized = input.toLowerCase().replace(/\s+/g, '');
        return `equation:${this.hashString(normalized)}`;
    }
    /**
     * Hash simple para strings
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32bit integer
        }
        return Math.abs(hash).toString();
    }
    /**
     * Verifica si un paso es correcto comparándolo con el esperado
     */
    isStepCorrect(attempted, expected) {
        // Comparación simplificada - en implementación completa sería más robusta
        return attempted.type === expected.type &&
            this.stepsAreEquivalent(attempted, expected);
    }
    /**
     * Verifica equivalencia entre pasos
     */
    stepsAreEquivalent(step1, step2) {
        // Implementación simplificada
        try {
            // Comparar descripciones normalizadas
            const desc1 = step1.description.toLowerCase().trim();
            const desc2 = step2.description.toLowerCase().trim();
            if (desc1 === desc2)
                return true;
            // Comparar tipos y operaciones principales
            return step1.type === step2.type;
        }
        catch (_a) {
            return false;
        }
    }
    /**
     * Genera un hint personalizado para el estudiante
     */
    generateHint(equation, expectedStep, attemptedStep) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Análisis del error y generación de hint contextual
            const errorType = this.analyzeStepError(expectedStep, attemptedStep);
            const hints = {
                'wrong_operation': `Recuerda que en este paso necesitas ${this.getOperationDescription(expectedStep.type)}`,
                'calculation_error': 'Revisa tus cálculos, el procedimiento es correcto pero hay un error aritmético',
                'wrong_order': 'El paso es válido pero no es el siguiente en la secuencia óptima',
                'incomplete': 'El paso está incompleto, asegúrate de aplicar la operación a ambos lados',
                'default': ((_a = expectedStep.hints) === null || _a === void 0 ? void 0 : _a[0]) || 'Revisa el paso anterior y piensa en la operación inversa'
            };
            return hints[errorType] || hints.default;
        });
    }
    /**
     * Analiza el tipo de error en un paso
     */
    analyzeStepError(expected, attempted) {
        if (expected.type !== attempted.type) {
            return 'wrong_operation';
        }
        if (attempted.description.length < expected.description.length * 0.5) {
            return 'incomplete';
        }
        return 'calculation_error';
    }
    /**
     * Obtiene descripción amigable de una operación
     */
    getOperationDescription(operationType) {
        const descriptions = {
            'transposition': 'transponer términos al otro lado',
            'combination': 'combinar términos semejantes',
            'distribution': 'aplicar la propiedad distributiva',
            'isolation': 'aislar la variable',
            'multiplication': 'multiplicar ambos lados',
            'division': 'dividir ambos lados'
        };
        return descriptions[operationType] || operationType;
    }
    /**
     * Genera variación de una ecuación existente
     */
    generateEquationVariation(baseEquation_1) {
        return __awaiter(this, arguments, void 0, function* (baseEquation, difficulty = 'same') {
            // Implementación simplificada - generar variación cambiando coeficientes
            const variation = this.createCoefficientVariation(baseEquation, difficulty);
            return {
                equation: this.formatEquationString(variation),
                context: 'Ecuación generada para práctica adicional'
            };
        });
    }
    /**
     * Crea variación cambiando coeficientes
     */
    createCoefficientVariation(equation, difficulty) {
        var _a, _b;
        const multiplier = {
            'easier': 0.5 + Math.random() * 0.3, // 0.5 - 0.8
            'same': 0.8 + Math.random() * 0.4, // 0.8 - 1.2
            'harder': 1.2 + Math.random() * 0.8 // 1.2 - 2.0
        }[difficulty];
        // Crear copia y modificar coeficientes
        const variation = JSON.parse(JSON.stringify(equation));
        (_a = variation.left.terms) === null || _a === void 0 ? void 0 : _a.forEach(term => {
            if (!term.isConstant) {
                term.coefficient = Math.round(term.coefficient * multiplier);
            }
        });
        (_b = variation.right.terms) === null || _b === void 0 ? void 0 : _b.forEach(term => {
            if (term.isConstant) {
                term.coefficient = Math.round(term.coefficient * multiplier);
            }
        });
        // Actualizar metadata
        variation.metadata.id = `var_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        variation.metadata.timestamp = Date.now();
        return variation;
    }
    /**
     * Formatea ecuación AST como string
     */
    formatEquationString(equation) {
        const formatSide = (terms) => {
            if (terms.length === 0)
                return '0';
            return terms.map((term, index) => {
                let str = '';
                if (index > 0) {
                    str += term.coefficient >= 0 ? ' + ' : ' - ';
                }
                else if (term.coefficient < 0) {
                    str += '-';
                }
                const absCoeff = Math.abs(term.coefficient);
                if (term.isConstant) {
                    str += absCoeff;
                }
                else {
                    if (absCoeff === 1) {
                        str += term.variable;
                    }
                    else {
                        str += absCoeff + term.variable;
                    }
                }
                return str;
            }).join('');
        };
        const left = formatSide(equation.left.terms || []);
        const right = formatSide(equation.right.terms || []);
        return `${left} = ${right}`;
    }
    /**
     * Identifica errores comunes del usuario
     */
    identifyCommonErrors(errorData) {
        const errorCounts = {};
        errorData.forEach(error => {
            errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
        });
        return Object.entries(errorCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([error]) => error);
    }
    /**
     * Genera sugerencias de mejora
     */
    generateImprovementSuggestions(errorData) {
        const suggestions = [
            'Practica más ecuaciones básicas para fortalecer los fundamentos',
            'Revisa el orden de operaciones antes de resolver',
            'Verifica siempre tu respuesta sustituyendo en la ecuación original'
        ];
        return suggestions.slice(0, 3);
    }
    /**
     * Identifica temas débiles
     */
    identifyWeakTopics(errorData) {
        // Análisis simplificado
        return ['transposition', 'distribution', 'combination'].slice(0, 2);
    }
}
exports.EquationService = EquationService;
exports.default = EquationService;
