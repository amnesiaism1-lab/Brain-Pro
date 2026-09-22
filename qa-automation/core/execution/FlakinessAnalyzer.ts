import { ExecutionRecord } from './ExecutionRecord';

/**
 * Flakiness Analyzer: Phân tích và phát hiện các bài test chập chờn
 * Cơ sở: ISTQB CTAL-TAE (Test Automation Metrics & Flakiness Mitigation)
 */
export class FlakinessAnalyzer {
  /**
   * Tính toán chỉ số Flakiness Index cho một Test Case qua lịch sử chạy
   * Công thức: Số lần đổi trạng thái liên tục giữa PASS/FAIL / Tổng số lần thực thi
   */
  static calculateFlakinessIndex(history: ExecutionRecord[]): number {
    if (history.length < 2) return 0;

    let flipCount = 0;
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1].status;
      const curr = history[i].status;
      if ((prev === 'PASSED' && curr === 'FAILED') || (prev === 'FAILED' && curr === 'PASSED')) {
        flipCount++;
      }
    }

    return parseFloat((flipCount / (history.length - 1)).toFixed(3));
  }

  /**
   * Phân loại mức độ rủi ro flakiness
   */
  static evaluateRisk(flakinessIndex: number): 'STABLE' | 'MODERATE_FLAKY' | 'HIGHLY_FLAKY' {
    if (flakinessIndex > 0.25) return 'HIGHLY_FLAKY';
    if (flakinessIndex > 0.10) return 'MODERATE_FLAKY';
    return 'STABLE';
  }
}
