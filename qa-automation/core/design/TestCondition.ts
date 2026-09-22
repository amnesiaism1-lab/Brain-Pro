/**
 * ISO/IEC/IEEE 29119-3 Clause 7.2: Test Condition Representation
 * Định nghĩa điều kiện kiểm thử ở mức phân tích logic, độc lập với công nghệ tự động hóa.
 */

export type RiskLevel = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';

export interface TestCondition {
  id: string;                    // e.g. COND-AUTH-001
  requirementId: string;         // e.g. REQ-AUTH-01
  feature: string;               // e.g. "Xác thực người dùng"
  description: string;           // Mô tả khía cạnh kiểm thử
  riskLevel: RiskLevel;
  type: 'FUNCTIONAL' | 'SECURITY' | 'PERFORMANCE' | 'USABILITY';
  createdAt: string;
}

export class TestConditionRegistry {
  private conditions: Map<string, TestCondition> = new Map();

  register(condition: TestCondition): void {
    if (this.conditions.has(condition.id)) {
      throw new Error(`TestCondition ${condition.id} đã tồn tại trong registry!`);
    }
    this.conditions.set(condition.id, condition);
  }

  get(id: string): TestCondition | undefined {
    return this.conditions.get(id);
  }

  getByRequirement(requirementId: string): TestCondition[] {
    return Array.from(this.conditions.values()).filter(c => c.requirementId === requirementId);
  }

  getAll(): TestCondition[] {
    return Array.from(this.conditions.values());
  }
}
