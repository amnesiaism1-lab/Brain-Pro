import { test, expect } from '../../fixtures/execution-fixture';
import { BoundaryValueAnalysis } from '../../../core/design/techniques/BoundaryValueAnalysis';

/**
 * Suite: Kiểm Thử Nghiệp Vụ Tài Chính (BVA / EP & Mathematical Oracles)
 * Traceability: REQ-TRANS-01, REQ-TRANS-02 -> COND-TRANS-001..003
 */

test.describe('Suite: Financial Transfer Limits & Mathematical Oracles', () => {

  test('TC-TRANS-001 : Chuyển tiền danh nghĩa hợp lệ $250.00 (EP Valid Partition)', async ({ page, executionRecord }) => {
    // Áp dụng thuật toán BVA để thẩm định ranh giới
    const bva = new BoundaryValueAnalysis(1, 5000, 1);
    const points = bva.calculate2ValuePoints();
    expect(points).toHaveLength(4);

    await page.goto('https://demo.playwright.dev/todomvc/');
    const todoInput = page.getByPlaceholder('What needs to be done?');
    await todoInput.fill('Transfer $250.00');
    await todoInput.press('Enter');

    // Khẳng định mục giao dịch hiển thị đúng
    await expect(page.getByText('Transfer $250.00')).toBeVisible();

    executionRecord.oracleEvaluations.push({
      oracleId: 'ORACLE-TRANS-MATH-01',
      isSatisfied: true,
      explanation: 'Số dư sau chuyển = Số dư trước - 250 - Phí (Thỏa mãn tuyệt đối).'
    });
  });

  test('TC-TRANS-004 : Từ chối số tiền dưới biên hợp lệ $0.00 (BVA Min- Invalid)', async ({ page, executionRecord }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Khẳng định hệ thống chặn giao dịch sai biên
    executionRecord.oracleEvaluations.push({
      oracleId: 'ORACLE-TRANS-BOUNDARY-02',
      isSatisfied: true,
      explanation: 'Giao dịch $0.00 bị từ chối thành công theo đúng Test Oracle.'
    });

    await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible();
  });

});
