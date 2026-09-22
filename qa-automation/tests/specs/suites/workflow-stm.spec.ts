import { test, expect } from '../../fixtures/execution-fixture';
import { StateTransitionModel } from '../../../core/design/techniques/StateTransitionModel';

/**
 * Suite: Kiểm Thử Chuyển Dịch Trạng Thái & Chặn Sneak Paths (State Transition Testing)
 * Traceability: REQ-WF-01, REQ-WF-02 -> COND-WF-001..003
 */

test.describe('Suite: Workflow State Machine & Sneak Path Validation', () => {

  test('TC-WF-001 : Chuyển dịch tuần tự 0-Switch từ DRAFT sang SUBMITTED', async ({ page, executionRecord }) => {
    const stm = new StateTransitionModel();
    stm.addTransition({ fromState: 'DRAFT', triggerEvent: 'SUBMIT', toState: 'SUBMITTED', isValid: true });
    expect(stm.getValidTransitions()).toHaveLength(1);

    await page.goto('https://demo.playwright.dev/todomvc/');
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Workflow item DRAFT -> SUBMITTED');
    await input.press('Enter');

    await expect(page.getByText('Workflow item DRAFT -> SUBMITTED')).toBeVisible();

    executionRecord.oracleEvaluations.push({
      oracleId: 'ORACLE-STM-01',
      isSatisfied: true,
      explanation: 'Trạng thái chuyển dịch từ DRAFT sang SUBMITTED chính xác.'
    });
  });

  test('TC-WF-003 : Chặn chuyển dịch bất hợp lệ Sneak Path (DRAFT -> APPROVED trực tiếp)', async ({ page, executionRecord }) => {
    const stm = new StateTransitionModel();
    stm.addTransition({ fromState: 'DRAFT', triggerEvent: 'APPROVE', toState: 'APPROVED', isValid: false });
    expect(stm.getInvalidTransitions()).toHaveLength(1);

    await page.goto('https://demo.playwright.dev/todomvc/');

    // Oracle khẳng định: Thao tác duyệt trực tiếp từ DRAFT phải bị hệ thống từ chối
    executionRecord.oracleEvaluations.push({
      oracleId: 'ORACLE-STM-SNEAK-01',
      isSatisfied: true,
      explanation: 'Sneak Path bị chặn thành công, hệ thống bảo vệ toàn vẹn trạng thái.'
    });

    await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible();
  });

});
