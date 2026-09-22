/**
 * Performance Metrics Tracker & SLA Budgeting
 * Cơ sở: ISTQB CT-PT (Performance Testing)
 * 
 * Tự động thu thập chỉ số hiệu năng (Latency, Response Time, Duration) và kiểm định theo ngân sách SLA.
 */

export interface PerformanceBudget {
  maxPageLoadMs: number;       // e.g. 3000ms
  maxApiResponseTimeMs: number; // e.g. 500ms
  maxDomInteractionMs: number;  // e.g. 300ms
}

export interface PerformanceMetricSample {
  name: string;
  type: 'PAGE_LOAD' | 'API_CALL' | 'UI_ACTION';
  durationMs: number;
  timestamp: string;
}

export class PerformanceMetricsTracker {
  private samples: PerformanceMetricSample[] = [];
  readonly budget: PerformanceBudget;

  constructor(budget: PerformanceBudget = { maxPageLoadMs: 3000, maxApiResponseTimeMs: 500, maxDomInteractionMs: 300 }) {
    this.budget = budget;
  }

  recordSample(name: string, type: 'PAGE_LOAD' | 'API_CALL' | 'UI_ACTION', durationMs: number): void {
    this.samples.push({
      name,
      type,
      durationMs,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Tính toán phân vị (Percentile) thời gian phản hồi (p50, p90, p95, p99)
   */
  calculatePercentile(percentile: number): number {
    if (this.samples.length === 0) return 0;
    const sorted = [...this.samples].map(s => s.durationMs).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Đánh giá xem đợt kiểm thử có vi phạm Performance SLA Budget không
   */
  evaluateBudgetCompliance(): { isCompliant: boolean; violations: string[] } {
    const violations: string[] = [];
    
    for (const sample of this.samples) {
      if (sample.type === 'PAGE_LOAD' && sample.durationMs > this.budget.maxPageLoadMs) {
        violations.push(`Page Load "${sample.name}" mất ${sample.durationMs}ms (Vượt SLA ${this.budget.maxPageLoadMs}ms)`);
      }
      if (sample.type === 'API_CALL' && sample.durationMs > this.budget.maxApiResponseTimeMs) {
        violations.push(`API "${sample.name}" mất ${sample.durationMs}ms (Vượt SLA ${this.budget.maxApiResponseTimeMs}ms)`);
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations
    };
  }
}
