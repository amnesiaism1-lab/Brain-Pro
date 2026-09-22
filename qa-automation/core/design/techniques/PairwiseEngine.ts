/**
 * Combinatorial / Pairwise Testing Engine (All-Pairs Algorithm)
 * Cơ sở: ISTQB CTAL-TTA (Technical Test Analyst) & CTAL-TA
 * 
 * Thuật toán sinh bộ kiểm thử tổ hợp từng cặp (2-way interaction) tối thiểu hóa
 * số lượng test cases nhưng vẫn đảm bảo 100% các cặp tham số (Parameters) được kích hoạt cùng nhau ít nhất 1 lần.
 */

export interface ParameterDimension<T = any> {
  name: string;
  values: T[];
}

export class PairwiseEngine {
  readonly dimensions: ParameterDimension[] = [];

  addDimension(name: string, values: any[]): this {
    if (values.length < 2) {
      throw new Error(`Kích thước tham số "${name}" phải có tối thiểu 2 giá trị.`);
    }
    this.dimensions.push({ name, values });
    return this;
  }

  /**
   * Tính toán tổng số test cases lý thuyết (Cartesian Product / Exhaustive)
   */
  getExhaustiveCount(): number {
    return this.dimensions.reduce((acc, dim) => acc * dim.values.length, 1);
  }

  /**
   * Sinh các cặp giá trị bắt buộc phải xuất hiện cùng nhau (Uncovered Pairs Pool)
   */
  generateAllRequiredPairs(): Set<string> {
    const pairs = new Set<string>();
    for (let i = 0; i < this.dimensions.length - 1; i++) {
      for (let j = i + 1; j < this.dimensions.length; j++) {
        const dim1 = this.dimensions[i];
        const dim2 = this.dimensions[j];
        for (const v1 of dim1.values) {
          for (const v2 of dim2.values) {
            pairs.add(`${dim1.name}=${v1}|${dim2.name}=${v2}`);
          }
        }
      }
    }
    return pairs;
  }

  /**
   * Thuật toán tham lam (Greedy Algorithm) sinh bộ Test Cases Pairwise tối ưu
   */
  generatePairwiseTests(): Record<string, any>[] {
    const uncoveredPairs = this.generateAllRequiredPairs();
    const testCases: Record<string, any>[] = [];

    while (uncoveredPairs.size > 0) {
      let bestCandidate: Record<string, any> | null = null;
      let maxCoveredCount = -1;

      // Thử nghiệm các tổ hợp để tìm test case bao phủ nhiều cặp chưa cover nhất
      for (let attempt = 0; attempt < 50; attempt++) {
        const candidate: Record<string, any> = {};
        for (const dim of this.dimensions) {
          const randomIndex = Math.floor(Math.random() * dim.values.length);
          candidate[dim.name] = dim.values[randomIndex];
        }

        // Đếm số cặp mới mà candidate này bao phủ
        let coveredCount = 0;
        for (let i = 0; i < this.dimensions.length - 1; i++) {
          for (let j = i + 1; j < this.dimensions.length; j++) {
            const pairKey = `${this.dimensions[i].name}=${candidate[this.dimensions[i].name]}|${this.dimensions[j].name}=${candidate[this.dimensions[j].name]}`;
            if (uncoveredPairs.has(pairKey)) {
              coveredCount++;
            }
          }
        }

        if (coveredCount > maxCoveredCount) {
          maxCoveredCount = coveredCount;
          bestCandidate = candidate;
        }
      }

      if (!bestCandidate) break;

      // Loại bỏ các cặp đã được bestCandidate bao phủ khỏi pool
      for (let i = 0; i < this.dimensions.length - 1; i++) {
        for (let j = i + 1; j < this.dimensions.length; j++) {
          const pairKey = `${this.dimensions[i].name}=${bestCandidate[this.dimensions[i].name]}|${this.dimensions[j].name}=${bestCandidate[this.dimensions[j].name]}`;
          uncoveredPairs.delete(pairKey);
        }
      }

      testCases.push(bestCandidate);
    }

    return testCases;
  }
}
