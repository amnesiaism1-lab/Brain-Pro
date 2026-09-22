/**
 * Proposal Engine: Sinh các bản đề xuất tự sửa lỗi có kiểm soát (Controlled Self-Healing)
 * Cơ sở: .agents/rules/controlled-self-healing.md
 */

export interface FixProposal {
  proposalId: string;
  targetId: string;
  executionId: string;
  failureMessage: string;
  knowledgeItemRef: string;
  codeDiff: string;
  affectsTestOracle: boolean; // Nếu true: BẮT BUỘC QA Lead duyệt!
  confidence: 'high' | 'medium' | 'low';
  sandboxVerificationPassed: boolean;
  status: 'PENDING_REVIEW' | 'AUTO_APPLIED' | 'REJECTED';
  generatedAt: string;
}

export class ProposalEngine {
  static createProposal(params: Omit<FixProposal, 'proposalId' | 'status' | 'generatedAt'>): FixProposal {
    const proposalId = `FP-${Date.now().toString().slice(-6)}`;
    const affectsOracle = params.affectsTestOracle;
    const canAutoApply = !affectsOracle && params.confidence === 'high' && params.sandboxVerificationPassed;

    return {
      ...params,
      proposalId,
      status: canAutoApply ? 'AUTO_APPLIED' : 'PENDING_REVIEW',
      generatedAt: new Date().toISOString()
    };
  }

  static formatProposalMarkdown(proposal: FixProposal): string {
    return `
# [FIX-PROPOSAL] ${proposal.proposalId} - Khắc Phục Lỗi Thực Thi

- **Target ID**: ${proposal.targetId}
- **Execution Ref**: ${proposal.executionId}
- **Tri Thức Tham Chiếu**: [${proposal.knowledgeItemRef}]
- **Độ Tin Cậy (Confidence)**: ${proposal.confidence.toUpperCase()}
- **Tác Động Đến Test Oracle**: ${proposal.affectsTestOracle ? '⚠️ CÓ (BẮT BUỘC QA LEAD DUYỆT)' : '✅ KHÔNG'}
- **Kết Quả Sandbox Run**: ${proposal.sandboxVerificationPassed ? 'PASSED' : 'FAILED'}
- **Trạng Thái**: \`${proposal.status}\`

### Thay Đổi Mã Nguồn Đề Xuất:
\`\`\`diff
${proposal.codeDiff}
\`\`\`
`.trim();
  }
}
