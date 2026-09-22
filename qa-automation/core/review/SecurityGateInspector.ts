/**
 * Security Quality Gate Inspector
 * Cơ sở: ISTQB CT-SEC (Security Testing) & OWASP Top 10
 * 
 * Tự động quét và phát hiện các rủi ro bảo mật cơ bản trong kịch bản kiểm thử và payload.
 */

export interface SecurityFinding {
  ruleId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  remediation: string;
}

export class SecurityGateInspector {
  /**
   * Quét rò rỉ thông tin nhạy cảm trong URL hoặc Storage (Sensitive Data Exposure - OWASP A02)
   */
  static inspectUrlForSensitiveParams(url: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lowerUrl = url.toLowerCase();

    const sensitiveKeys = ['password', 'secret', 'token', 'access_token', 'credit_card', 'cvv'];
    for (const key of sensitiveKeys) {
      if (lowerUrl.includes(`${key}=`)) {
        findings.push({
          ruleId: 'SEC-URL-SENSITIVE-DATA',
          severity: 'HIGH',
          title: `Phát hiện tham số nhạy cảm "${key}" trên URL`,
          description: `Thông tin nhạy cảm truyền qua query string có thể bị rò rỉ qua Browser History, Proxy log hoặc Referer header.`,
          remediation: `Chuyển thông tin nhạy cảm vào HTTP Request Body có mã hóa TLS hoặc Authorization Header.`
        });
      }
    }

    return findings;
  }

  /**
   * Kiểm tra xem các trường dữ liệu thanh toán có bị lộ số thẻ không che (PAN Masking)
   */
  static inspectMasking(text: string): boolean {
    // Nếu text chứa 16 chữ số thẻ liên tục mà không có ký tự che (* hoặc X)
    const unmaskedCardRegex = /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/;
    return !unmaskedCardRegex.test(text);
  }
}
