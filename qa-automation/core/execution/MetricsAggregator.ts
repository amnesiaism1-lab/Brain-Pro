import { ExecutionRecord } from './ExecutionRecord';

/**
 * Metrics Aggregator: Tổng hợp số liệu đo lường chất lượng toàn diện
 * Cơ sở: ISTQB CT-TAS (Test Automation Strategy), CTAL-TAE (ROI & Metrics) & CT-ATLaS (Quality Metrics at Scale)
 */

export interface TestAutomationMetrics {
  totalExecutions: number;
  passRatePercentage: number;
  failRatePercentage: number;
  meanDurationMs: number;
  flakinessIndex: number;
  defectDensity: number;        // Số lỗi phát hiện / 1000 dòng code hoặc per module
  automationRoiHoursSaved: number; // Ước tính số giờ thủ công tiết kiệm được
}

export class MetricsAggregator {
  /**
   * Tính toán toàn bộ chỉ số KPI kiểm thử từ danh sách ExecutionRecords
   */
  static aggregate(records: ExecutionRecord[], estimatedManualMinutesPerTest: number = 10): TestAutomationMetrics {
    if (records.length === 0) {
      return {
        totalExecutions: 0,
        passRatePercentage: 0,
        failRatePercentage: 0,
        meanDurationMs: 0,
        flakinessIndex: 0,
        defectDensity: 0,
        automationRoiHoursSaved: 0
      };
    }

    const total = records.length;
    const passedCount = records.filter(r => r.status === 'PASSED').length;
    const failedCount = records.filter(r => r.status === 'FAILED').length;
    const totalDuration = records.reduce((sum, r) => sum + r.durationMs, 0);

    const passRate = parseFloat(((passedCount / total) * 100).toFixed(2));
    const failRate = parseFloat(((failedCount / total) * 100).toFixed(2));
    const meanDuration = Math.round(totalDuration / total);

    // Tính toán số giờ tiết kiệm được (Automation ROI)
    const totalManualMinutes = total * estimatedManualMinutesPerTest;
    const totalAutomatedMinutes = totalDuration / (1000 * 60);
    const hoursSaved = parseFloat(((totalManualMinutes - totalAutomatedMinutes) / 60).toFixed(1));

    return {
      totalExecutions: total,
      passRatePercentage: passRate,
      failRatePercentage: failRate,
      meanDurationMs: meanDuration,
      flakinessIndex: 0, // Sẽ tính chi tiết qua FlakinessAnalyzer
      defectDensity: failedCount,
      automationRoiHoursSaved: Math.max(0, hoursSaved)
    };
  }
}
