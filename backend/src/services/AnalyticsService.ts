// backend/src/services/AnalyticsService.ts

import type { EquationAST } from '../../../frontend/src/types/equation/EquationTypes';

interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: string;
  timestamp: Date;
  data: any;
  metadata?: any;
}

/**
 * Servicio de Analytics
 * Registra eventos y métricas para análisis
 * Implementación simulada para Phase 1.2
 */
export class AnalyticsService {
  private events: Map<string, AnalyticsEvent[]> = new Map();
  private sessionStart: Date;

  constructor() {
    this.sessionStart = new Date();
    console.log('AnalyticsService initialized (mock implementation)');
  }

  async recordEquationCreation(userId: string, equationId: string, ast: EquationAST): Promise<void> {
    const event: AnalyticsEvent = {
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

    await this.recordEvent(event);
    
    console.log('Analytics: Equation created', {
      userId,
      equationId,
      type: ast.equationType,
      complexity: ast.complexity
    });
  }

  async recordEquationAccess(userId: string, equationId: string, accessType: string): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      userId,
      eventType: 'equation_accessed',
      timestamp: new Date(),
      data: {
        equationId,
        accessType // 'cache_hit', 'direct_access', etc.
      }
    };

    await this.recordEvent(event);
    
    console.log('Analytics: Equation accessed', {
      userId,
      equationId,
      accessType
    });
  }

  async recordStepAttempt(userId: string, equationId: string, stepIndex: number, isCorrect: boolean): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      userId,
      eventType: 'step_attempted',
      timestamp: new Date(),
      data: {
        equationId,
        stepIndex,
        isCorrect,
        attemptNumber: await this.getAttemptNumber(userId, equationId, stepIndex)
      }
    };

    await this.recordEvent(event);
    
    console.log('Analytics: Step attempt', {
      userId,
      equationId,
      stepIndex,
      isCorrect
    });
  }

  async recordSimilarEquationGeneration(userId: string, baseEquationId: string, newEquationId: string): Promise<void> {
    const event: AnalyticsEvent = {
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

    await this.recordEvent(event);
    
    console.log('Analytics: Similar equation generated', {
      userId,
      baseEquationId,
      newEquationId
    });
  }

  async recordErrorAnalysis(userId: string, analysis: any): Promise<void> {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      userId,
      eventType: 'error_analysis_completed',
      timestamp: new Date(),
      data: {
        analysis,
        analysisTimestamp: new Date()
      }
    };

    await this.recordEvent(event);
    
    console.log('Analytics: Error analysis completed', {
      userId,
      commonErrors: analysis.commonErrors?.length || 0,
      weakTopics: analysis.weakTopics?.length || 0
    });
  }

  async recordError(userId: string, operation: string, error: string): Promise<void> {
    const event: AnalyticsEvent = {
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

    await this.recordEvent(event);
    
    console.log('Analytics: Error occurred', {
      userId,
      operation,
      error: error.substring(0, 100) + (error.length > 100 ? '...' : ''),
      timestamp: new Date()
    });
  }

  // ============================================================================
  // MÉTRICAS Y REPORTES
  // ============================================================================

  async getUserMetrics(userId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
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
  }

  async getSystemMetrics(): Promise<any> {
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
  }

  async getPerformanceMetrics(): Promise<any> {
    const allEvents = Array.from(this.events.values()).flat();
    const parseEvents = allEvents.filter(e => e.eventType === 'equation_created');
    
    return {
      averageParseTime: this.calculateAverageParseTime(parseEvents),
      slowestParses: this.getSlowestParses(parseEvents),
      errorRate: allEvents.filter(e => e.eventType === 'error_occurred').length / allEvents.length,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================

  private async recordEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.events.has(event.userId)) {
      this.events.set(event.userId, []);
    }
    
    this.events.get(event.userId)!.push(event);
    
    // Simular latencia de logging
    await this.delay(5);
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getAttemptNumber(userId: string, equationId: string, stepIndex: number): Promise<number> {
    const userEvents = this.events.get(userId) || [];
    
    const stepAttempts = userEvents.filter(event => 
      event.eventType === 'step_attempted' &&
      event.data.equationId === equationId &&
      event.data.stepIndex === stepIndex
    );
    
    return stepAttempts.length + 1;
  }

  private categorizeError(error: string): 'low' | 'medium' | 'high' | 'critical' {
    if (error.toLowerCase().includes('critical') || error.toLowerCase().includes('crash')) {
      return 'critical';
    } else if (error.toLowerCase().includes('validation') || error.toLowerCase().includes('parsing')) {
      return 'medium';
    } else if (error.toLowerCase().includes('timeout') || error.toLowerCase().includes('network')) {
      return 'high';
    } else {
      return 'low';
    }
  }

  private getCutoffDate(timeframe: 'day' | 'week' | 'month'): Date {
    const now = Date.now();
    const timeframes = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    
    return new Date(now - timeframes[timeframe]);
  }

  private calculateSuccessRate(events: AnalyticsEvent[]): number {
    const stepEvents = events.filter(e => e.eventType === 'step_attempted');
    if (stepEvents.length === 0) return 0;
    
    const successfulSteps = stepEvents.filter(e => e.data.isCorrect).length;
    return successfulSteps / stepEvents.length;
  }

  private calculateAverageComplexity(events: AnalyticsEvent[]): number {
    const equationEvents = events.filter(e => e.eventType === 'equation_created');
    if (equationEvents.length === 0) return 0;
    
    const totalComplexity = equationEvents.reduce((sum, e) => sum + (e.data.complexity || 0), 0);
    return totalComplexity / equationEvents.length;
  }

  private calculateTimeSpent(events: AnalyticsEvent[]): number {
    if (events.length < 2) return 0;
    
    const sortedEvents = events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    
    return lastEvent.timestamp.getTime() - firstEvent.timestamp.getTime();
  }

  private calculateErrorRate(events: AnalyticsEvent[]): number {
    if (events.length === 0) return 0;
    
    const errorEvents = events.filter(e => e.eventType === 'error_occurred').length;
    return errorEvents / events.length;
  }

  private getMostCommonErrors(events: AnalyticsEvent[]): string[] {
    const errorEvents = events.filter(e => e.eventType === 'error_occurred');
    const errorCounts: { [key: string]: number } = {};
    
    errorEvents.forEach(event => {
      const operation = event.data.operation;
      errorCounts[operation] = (errorCounts[operation] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([operation]) => operation);
  }

  private getTopEquationTypes(events: AnalyticsEvent[]): { [type: string]: number } {
    const equationEvents = events.filter(e => e.eventType === 'equation_created');
    const typeCounts: { [type: string]: number } = {};
    
    equationEvents.forEach(event => {
      const type = event.data.equationType;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return typeCounts;
  }

  private calculateAverageResponseTime(events: AnalyticsEvent[]): number {
    // Simulado - en implementación real usaría timestamps de request/response
    return Math.random() * 100 + 50; // 50-150ms
  }

  private calculateAverageParseTime(events: AnalyticsEvent[]): number {
    // Simulado - en implementación real extraería parseTime de los datos
    return Math.random() * 50 + 20; // 20-70ms
  }

  private getSlowestParses(events: AnalyticsEvent[]): any[] {
    // Simulado - retornar algunos ejemplos
    return events.slice(0, 3).map(event => ({
      equationId: event.data.equationId,
      parseTime: Math.random() * 200 + 100,
      complexity: event.data.complexity
    }));
  }

  private estimateMemoryUsage(): string {
    const sizeInBytes = JSON.stringify(Array.from(this.events.entries())).length;
    
    if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // MÉTODOS DE ADMINISTRACIÓN
  // ============================================================================

  public getStats() {
    const allEvents = Array.from(this.events.values()).flat();
    
    return {
      totalUsers: this.events.size,
      totalEvents: allEvents.length,
      memoryUsage: this.estimateMemoryUsage(),
      uptime: Date.now() - this.sessionStart.getTime(),
      isSimulated: true
    };
  }

  public clearUserData(userId: string): void {
    this.events.delete(userId);
    console.log(`Analytics: Cleared data for user ${userId}`);
  }

  public clearAllData(): void {
    this.events.clear();
    console.log('Analytics: All data cleared');
  }
}