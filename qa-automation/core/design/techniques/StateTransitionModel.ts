/**
 * State Transition Model: Mô hình hóa kiểm thử chuyển dịch trạng thái
 * Cơ sở: ISTQB CT-MBT (Model-Based Testing) & CTAL-TA (0-switch, 1-switch, Invalid Transitions)
 */

export interface StateTransition {
  fromState: string;
  triggerEvent: string;
  toState: string;
  guardCondition?: string;
  action?: string;
  isValid: boolean; // true: chuyển dịch hợp lệ, false: sneak path cần kiểm tra chặn
}

export class StateTransitionModel {
  readonly states: Set<string> = new Set();
  readonly events: Set<string> = new Set();
  readonly transitions: StateTransition[] = [];

  addState(state: string): this {
    this.states.add(state);
    return this;
  }

  addEvent(event: string): this {
    this.events.add(event);
    return this;
  }

  addTransition(transition: StateTransition): this {
    this.states.add(transition.fromState);
    this.states.add(transition.toState);
    this.events.add(transition.triggerEvent);
    this.transitions.push(transition);
    return this;
  }

  /**
   * Lấy danh sách toàn bộ chuyển dịch hợp lệ đơn lẻ (0-switch coverage)
   */
  getValidTransitions(): StateTransition[] {
    return this.transitions.filter(t => t.isValid);
  }

  /**
   * Lấy danh sách các chuyển dịch bị cấm (Invalid Transitions / Sneak Paths)
   * Hệ thống phải từ chối chuyển dịch này khi bị kích hoạt
   */
  getInvalidTransitions(): StateTransition[] {
    return this.transitions.filter(t => !t.isValid);
  }

  /**
   * Sinh các chuỗi 2 bước chuyển dịch liên tiếp (1-switch coverage)
   */
  get1SwitchSequences(): [StateTransition, StateTransition][] {
    const valid = this.getValidTransitions();
    const sequences: [StateTransition, StateTransition][] = [];

    for (const t1 of valid) {
      for (const t2 of valid) {
        if (t1.toState === t2.fromState) {
          sequences.push([t1, t2]);
        }
      }
    }
    return sequences;
  }
}
