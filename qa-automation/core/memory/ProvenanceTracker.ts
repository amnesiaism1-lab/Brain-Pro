import { KnowledgeItem } from './MemorySchema';

/**
 * Provenance Tracker: Kiểm tra nguồn gốc và thời hạn sử dụng của tri thức trong qa-memory/
 */
export class ProvenanceTracker {
  private static readonly MAX_VALIDITY_DAYS = 180; // 6 tháng

  /**
   * Kiểm tra xem một Knowledge Item còn hạn sử dụng hay đã bị lỗi thời
   */
  static isStale(item: KnowledgeItem, currentDate: Date = new Date()): boolean {
    const lastVerifiedDate = new Date(item.last_verified);
    const diffTime = Math.abs(currentDate.getTime() - lastVerifiedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > this.MAX_VALIDITY_DAYS;
  }

  /**
   * Kiểm tra xem tri thức có phù hợp với target và môi trường hiện tại hay không
   */
  static isApplicable(item: KnowledgeItem, targetName: string, environment: string): boolean {
    if (item.status === 'deprecated') return false;

    // Nếu là Universal thì luôn áp dụng
    if (item.app_applicability.target === 'Universal') return true;

    // Kiểm tra Target name
    if (item.app_applicability.target !== targetName) return false;

    // Kiểm tra Environment nếu được khai báo
    if (item.app_applicability.environment && item.app_applicability.environment.length > 0) {
      return item.app_applicability.environment.includes(environment);
    }

    return true;
  }
}
