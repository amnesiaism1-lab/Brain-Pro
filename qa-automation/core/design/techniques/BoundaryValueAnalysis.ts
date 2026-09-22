/**
 * Boundary Value Analysis (BVA): Tính toán điểm kiểm thử giá trị biên
 * Cơ sở: ISTQB CTFL 4.0 (2-value BVA) & CTAL-TTA (3-value BVA)
 */

export interface BoundaryPoint {
  value: number;
  type: 'MIN_MINUS_1' | 'MIN' | 'MIN_PLUS_1' | 'MAX_MINUS_1' | 'MAX' | 'MAX_PLUS_1' | 'NOMINAL';
  isValid: boolean;
  bvaStandard: '2-VALUE' | '3-VALUE';
}

export class BoundaryValueAnalysis {
  readonly min: number;
  readonly max: number;
  readonly step: number;

  constructor(min: number, max: number, step: number = 1) {
    if (min >= max) {
      throw new Error(`Giá trị min (${min}) phải nhỏ hơn max (${max})`);
    }
    this.min = min;
    this.max = max;
    this.step = step;
  }

  /**
   * Tính toán 4 điểm biên theo chuẩn 2-value BVA (CTFL 4.0)
   * Biên dưới: min (valid), min - step (invalid)
   * Biên trên: max (valid), max + step (invalid)
   */
  calculate2ValuePoints(): BoundaryPoint[] {
    return [
      { value: this.min - this.step, type: 'MIN_MINUS_1', isValid: false, bvaStandard: '2-VALUE' },
      { value: this.min,             type: 'MIN',         isValid: true,  bvaStandard: '2-VALUE' },
      { value: this.max,             type: 'MAX',         isValid: true,  bvaStandard: '2-VALUE' },
      { value: this.max + this.step, type: 'MAX_PLUS_1', isValid: false, bvaStandard: '2-VALUE' },
    ];
  }

  /**
   * Tính toán 6 điểm biên theo chuẩn 3-value BVA (CTAL-TTA)
   * Biên dưới: min - step, min, min + step
   * Biên trên: max - step, max, max + step
   */
  calculate3ValuePoints(): BoundaryPoint[] {
    return [
      { value: this.min - this.step, type: 'MIN_MINUS_1', isValid: false, bvaStandard: '3-VALUE' },
      { value: this.min,             type: 'MIN',         isValid: true,  bvaStandard: '3-VALUE' },
      { value: this.min + this.step, type: 'MIN_PLUS_1', isValid: true,  bvaStandard: '3-VALUE' },
      { value: this.max - this.step, type: 'MAX_MINUS_1', isValid: true,  bvaStandard: '3-VALUE' },
      { value: this.max,             type: 'MAX',         isValid: true,  bvaStandard: '3-VALUE' },
      { value: this.max + this.step, type: 'MAX_PLUS_1', isValid: false, bvaStandard: '3-VALUE' },
    ];
  }
}
