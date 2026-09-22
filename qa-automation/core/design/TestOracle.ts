/**
 * Test Oracle Engine: Quản lý và thẩm định chân lý kiểm thử độc lập
 * Cơ sở: ISTQB CTFL 4.0, CTAI / CT-GenAI (The Oracle Problem)
 */

export type OracleType = 
  | 'MATHEMATICAL_INVARIANT'  // e.g. Balance_after = Balance_before - Amount - Fee
  | 'STATE_TRANSITION'        // e.g. State changes from DRAFT to SUBMITTED
  | 'MULTI_CHANNEL_CONSISTENCY' // e.g. UI == API == DB
  | 'BOUNDARY_CONSTRAINT'     // e.g. 1.00 <= Amount <= 5000.00
  | 'SECURITY_AUTHORIZATION'; // e.g. Only Role.ADMIN can access /audit-logs

export interface OracleInvariant<TInput, TState> {
  name: string;
  description: string;
  type: OracleType;
  evaluate: (input: TInput, beforeState: TState, afterState: TState) => OracleEvaluationResult;
}

export interface OracleEvaluationResult {
  isSatisfied: boolean;
  expectedValue: any;
  actualValue: any;
  explanation: string;
  channel: 'UI' | 'API' | 'DATABASE' | 'SYSTEM_LOG';
}

export class TestOracle<TInput = any, TState = any> {
  readonly id: string;
  readonly testCaseId: string;
  private invariants: OracleInvariant<TInput, TState>[] = [];

  constructor(id: string, testCaseId: string) {
    this.id = id;
    this.testCaseId = testCaseId;
  }

  addInvariant(invariant: OracleInvariant<TInput, TState>): this {
    this.invariants.push(invariant);
    return this;
  }

  /**
   * Thẩm định toàn bộ chân lý của ca kiểm thử dựa trên trạng thái trước và sau
   */
  evaluateAll(input: TInput, beforeState: TState, afterState: TState): OracleEvaluationResult[] {
    return this.invariants.map(inv => inv.evaluate(input, beforeState, afterState));
  }

  /**
   * Kiểm tra nhanh xem tất cả các bất biến có được thỏa mãn hay không
   */
  isCompletelySatisfied(input: TInput, beforeState: TState, afterState: TState): boolean {
    const results = this.evaluateAll(input, beforeState, afterState);
    return results.every(r => r.isSatisfied);
  }
}
