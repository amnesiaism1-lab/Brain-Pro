/**
 * ISO/IEC/IEEE 29119-3 Clause 7.10 & 7.11: Test Execution Record
 * Thực thể trung tâm lưu trữ toàn bộ thông số của một lần thực thi kiểm thử.
 */

export type ExecutionStatus = 'PASSED' | 'FAILED' | 'BLOCKED' | 'INCONCLUSIVE' | 'SKIPPED';

export type FailureCategory = 
  | 'APPLICATION_BUG'       // Lỗi sản phẩm thật (logic sai, 500 error)
  | 'AUTOMATION_SCRIPT_BUG' // Lỗi mã test (selector lỗi thời, assertion sai)
  | 'ENVIRONMENT_PROBLEM'   // Lỗi môi trường (server down, timeout mạng, CORS)
  | 'TEST_DATA_PROBLEM'     // Lỗi dữ liệu kiểm thử (user locked, hết số dư)
  | 'FLAKY_RACE_CONDITION'  // Test chập chờn do race condition / animation
  | 'UNCLASSIFIED';

export interface EvidenceLinks {
  tracePath?: string;
  videoPath?: string;
  screenshots: string[];
  harPath?: string;
  consoleLogPath?: string;
}

export interface OracleEvaluationSummary {
  oracleId: string;
  isSatisfied: boolean;
  explanation: string;
}

export interface ExecutionRecord {
  executionId: string;           // e.g. EXEC-20260913-0001
  testCaseId: string;            // e.g. TC-TRANS-001
  targetId: string;              // e.g. TARGET-OMNIFLOW-STAGING
  buildVersion: string;          // e.g. v1.4.2-rev882
  environment: string;           // e.g. staging
  browser: string;               // e.g. chromium-128
  startTime: string;             // ISO-8601
  endTime: string;               // ISO-8601
  durationMs: number;
  status: ExecutionStatus;
  failureCategory?: FailureCategory;
  failureMessage?: string;
  evidence: EvidenceLinks;
  oracleEvaluations: OracleEvaluationSummary[];
  agentMetadata?: {
    designerId?: string;
    engineerId?: string;
    reviewerId?: string;
  };
}
