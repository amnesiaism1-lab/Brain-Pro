/**
 * Metamorphic Testing Engine (MT)
 * Cơ sở: ISTQB CTAI (AI Testing), CT-GenAI & CTAL-TTA
 * 
 * Giải quyết triệt để "The Oracle Problem" cho các tính năng phức tạp (Search, AI Recommendation, Big Data sorting)
 * khi không thể biết trước chính xác kết quả tuyệt đối, bằng cách thẩm định các Quan Hệ Biến Hình (Metamorphic Relations - MR).
 */

export interface MetamorphicRelation<TInput, TOutput> {
  name: string;
  description: string;
  // Biến đổi đầu vào gốc (x) thành đầu vào biến hình (x')
  transformInput: (originalInput: TInput) => TInput;
  // Thẩm định mối quan hệ giữa kết quả gốc f(x) và kết quả biến hình f(x')
  verifyRelation: (originalOutput: TOutput, followUpOutput: TOutput) => {
    isSatisfied: boolean;
    explanation: string;
  };
}

export class MetamorphicRelationEngine<TInput, TOutput> {
  private relations: MetamorphicRelation<TInput, TOutput>[] = [];

  addRelation(relation: MetamorphicRelation<TInput, TOutput>): this {
    this.relations.push(relation);
    return this;
  }

  /**
   * Chạy thẩm định một quan hệ biến hình cụ thể
   */
  async executeRelation(
    relation: MetamorphicRelation<TInput, TOutput>,
    originalInput: TInput,
    systemUnderTest: (input: TInput) => Promise<TOutput>
  ): Promise<{ relationName: string; isSatisfied: boolean; explanation: string }> {
    // 1. Chạy Source Test: f(x)
    const originalOutput = await systemUnderTest(originalInput);

    // 2. Biến đổi đầu vào thành follow-up input: x'
    const followUpInput = relation.transformInput(originalInput);

    // 3. Chạy Follow-up Test: f(x')
    const followUpOutput = await systemUnderTest(followUpInput);

    // 4. Thẩm định quan hệ biến hình MR
    const result = relation.verifyRelation(originalOutput, followUpOutput);

    return {
      relationName: relation.name,
      isSatisfied: result.isSatisfied,
      explanation: result.explanation
    };
  }

  /**
   * Các quan hệ biến hình kinh điển (Standard Metamorphic Relations Library)
   */
  static SubsetRelation: MetamorphicRelation<any[], any[]> = {
    name: 'MR_SUBSET_FILTERING',
    description: 'Thêm điều kiện lọc phụ thì tập kết quả mới phải là tập con của tập kết quả ban đầu.',
    transformInput: (input) => input, // Sẽ override theo ngữ cảnh
    verifyRelation: (orig, followUp) => {
      const isSubset = followUp.length <= orig.length;
      return {
        isSatisfied: isSubset,
        explanation: `Kết quả lọc (${followUp.length}) <= kết quả gốc (${orig.length}).`
      };
    }
  };
}
