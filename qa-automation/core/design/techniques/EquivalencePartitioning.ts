/**
 * Equivalence Partitioning (EP): Thuật toán phân hoạch tương đương
 * Cơ sở: ISTQB CTFL 4.0 & ISO/IEC/IEEE 29119-4 (Test Techniques)
 */

export interface EquivalencePartition<T> {
  id: string;
  name: string;
  isValid: boolean;
  sampleValue: T;
  description: string;
  predicate: (value: T) => boolean;
}

export class EquivalencePartitioner<T> {
  private partitions: EquivalencePartition<T>[] = [];

  addPartition(partition: EquivalencePartition<T>): this {
    this.partitions.push(partition);
    return this;
  }

  /**
   * Xác định giá trị thuộc phân hoạch nào
   */
  classify(value: T): EquivalencePartition<T> | undefined {
    return this.partitions.find(p => p.predicate(value));
  }

  getValidPartitions(): EquivalencePartition<T>[] {
    return this.partitions.filter(p => p.isValid);
  }

  getInvalidPartitions(): EquivalencePartition<T>[] {
    return this.partitions.filter(p => !p.isValid);
  }

  getAllPartitions(): EquivalencePartition<T>[] {
    return [...this.partitions];
  }
}
