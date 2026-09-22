/**
 * Decision Table Engine: Quản lý và tối ưu hóa bảng quyết định
 * Cơ sở: ISTQB CTFL 4.0, CTAL-TA (Completeness & Consistency checking)
 */

export interface DecisionCondition {
  id: string;
  name: string;
}

export interface DecisionAction {
  id: string;
  name: string;
}

export interface DecisionRule {
  id: string;
  conditionValues: Map<string, boolean | null>; // true, false, hoặc null (Don't care '-')
  actionsToTake: Map<string, boolean>;           // true: thực thi action, false: không
}

export class DecisionTableEngine {
  readonly conditions: DecisionCondition[] = [];
  readonly actions: DecisionAction[] = [];
  readonly rules: DecisionRule[] = [];

  addCondition(condition: DecisionCondition): this {
    this.conditions.push(condition);
    return this;
  }

  addAction(action: DecisionAction): this {
    this.actions.push(action);
    return this;
  }

  addRule(rule: DecisionRule): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * Tính số lượng quy tắc đầy đủ lý thuyết: 2^N (với N là số lượng điều kiện nhị phân)
   */
  getTheoreticalFullRuleCount(): number {
    return Math.pow(2, this.conditions.length);
  }

  /**
   * Tìm kiếm hành động tương ứng với một tập hợp điều kiện đầu vào
   */
  evaluate(inputConditions: Map<string, boolean>): Map<string, boolean> | null {
    for (const rule of this.rules) {
      let isMatch = true;
      for (const [condId, expectedVal] of rule.conditionValues.entries()) {
        if (expectedVal !== null && inputConditions.get(condId) !== expectedVal) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        return rule.actionsToTake;
      }
    }
    return null;
  }
}
