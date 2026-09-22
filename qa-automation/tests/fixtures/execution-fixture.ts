import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ExecutionRecord, FailureCategory } from '../../core/execution/ExecutionRecord';
import { FailureClassifier } from '../../core/execution/FailureClassifier';

type ExecutionFixture = {
  executionRecord: ExecutionRecord;
};

export const test = base.extend<ExecutionFixture>({
  executionRecord: async ({ page }, use, testInfo) => {
    const executionId = `EXEC-${Date.now()}`;
    const startTime = new Date().toISOString();

    const record: ExecutionRecord = {
      executionId,
      testCaseId: testInfo.title.split(':')[0].trim(),
      targetId: process.env.TARGET_ID || 'TARGET-DEFAULT',
      buildVersion: process.env.BUILD_VERSION || 'local-build',
      environment: process.env.TEST_ENV || 'local',
      browser: testInfo.project.name,
      startTime,
      endTime: '',
      durationMs: 0,
      status: 'PASSED',
      evidence: {
        screenshots: []
      },
      oracleEvaluations: []
    };

    // Chạy test body
    await use(record);

    // Thu thập sau khi test hoàn tất
    record.endTime = new Date().toISOString();
    record.durationMs = testInfo.duration;

    if (testInfo.status === 'passed') {
      record.status = 'PASSED';
    } else if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
      record.status = 'FAILED';
      const errorMsg = testInfo.error?.message || 'Unknown failure';
      record.failureMessage = errorMsg;
      record.failureCategory = FailureClassifier.classify(errorMsg, undefined, testInfo.retry > 0);
    } else {
      record.status = 'SKIPPED';
    }

    // Ghi nhận file ExecutionRecord vào executions/history/
    const historyDir = path.resolve(__dirname, '../../executions/history');
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    const recordFilePath = path.join(historyDir, `${executionId}.json`);
    try {
      fs.writeFileSync(recordFilePath, JSON.stringify(record, null, 2), 'utf-8');
    } catch {
      // Bỏ qua lỗi ghi file nếu môi trường bị hạn chế quyền
    }
  }
});

export { expect };
