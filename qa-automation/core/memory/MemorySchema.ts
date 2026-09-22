/**
 * Schema Định Nghĩa Dữ Liệu Cho Knowledge Items Trong qa-memory/
 * Đảm bảo tính có cấu trúc, có nguồn gốc (provenance), và có hạn sử dụng (last_verified).
 */

export type KnowledgeType = 
  | 'known-issue' 
  | 'flaky-test' 
  | 'locator-pattern' 
  | 'environment-problem' 
  | 'common-failure' 
  | 'lesson-learned';

export type KnowledgeStatus = 'active' | 'resolved' | 'deprecated' | 'under-review';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface AppApplicability {
  target: string;              // e.g. "OmniFlow Banking" hoặc "Universal"
  stack?: string[];            // e.g. ["React", "Playwright", "TailwindCSS"]
  environment?: string[];      // e.g. ["staging", "production"]
}

export interface KnowledgeProvenance {
  execution_id?: string;
  author: string;
  reviewed_by?: string;
}

export interface KnowledgeItem {
  id: string;                  // e.g. KI-LOC-0042
  title: string;
  type: KnowledgeType;
  status: KnowledgeStatus;
  confidence: ConfidenceLevel;
  app_applicability: AppApplicability;
  first_seen: string;          // YYYY-MM-DD
  last_verified: string;       // YYYY-MM-DD - Ngăn chặn áp dụng kiến thức cũ quá hạn!
  source: KnowledgeProvenance;
  problem: string;
  root_cause: string;
  solution: string;
  evidence_ref?: string;
}

export class MemoryValidator {
  static validate(item: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!item.id || !item.id.startsWith('KI-')) {
      errors.push('id bắt buộc và phải có tiền tố "KI-" (ví dụ KI-LOC-001)');
    }
    if (!item.title || item.title.trim().length < 5) {
      errors.push('title bắt buộc và phải dài tối thiểu 5 ký tự');
    }
    if (!['known-issue', 'flaky-test', 'locator-pattern', 'environment-problem', 'common-failure', 'lesson-learned'].includes(item.type)) {
      errors.push(`type không hợp lệ: ${item.type}`);
    }
    if (!['active', 'resolved', 'deprecated', 'under-review'].includes(item.status)) {
      errors.push(`status không hợp lệ: ${item.status}`);
    }
    if (!['high', 'medium', 'low'].includes(item.confidence)) {
      errors.push(`confidence không hợp lệ: ${item.confidence}`);
    }
    if (!item.last_verified || isNaN(Date.parse(item.last_verified))) {
      errors.push('last_verified bắt buộc và phải là ngày hợp lệ định dạng YYYY-MM-DD');
    }
    if (!item.problem || !item.solution) {
      errors.push('problem và solution là bắt buộc đối với một Knowledge Item');
    }

    return { isValid: errors.length === 0, errors };
  }
}
