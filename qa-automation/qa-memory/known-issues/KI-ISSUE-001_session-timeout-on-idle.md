---
id: "KI-ISSUE-001"
title: "Phiên đăng nhập bị ngắt kết nối tự động sau 15 phút không thao tác"
type: "known-issue"
status: "active"
confidence: "high"
app_applicability:
  target: "OmniFlow Operations Portal"
  stack: ["OAuth2", "JWT", "RedisSession"]
  environment: ["staging", "production"]
first_seen: "2026-06-15"
last_verified: "2026-09-13"
source:
  execution_id: "EXEC-20260615-0012"
  author: "QA-Lead"
  reviewed_by: "Security-Architect"
problem: "Khi chạy chuỗi test suites kéo dài hơn 15 phút, các bài test phía sau bị FAIL hàng loạt với lỗi HTTP 401 Unauthorized do Access Token hết hạn."
root_cause: "Chính sách bảo mật hệ thống áp đặt thời gian sống (TTL) của JWT Token là 900 giây (15 phút) nhằm tuân thủ tiêu chuẩn PCI-DSS."
solution: "Không sử dụng một Token cố định cho toàn bộ Suite. Sử dụng Custom Fixture 'authenticatedPage' để tự động làm mới Token trước mỗi test case hoặc tái xác thực tự động khi phát hiện mã 401."
evidence_ref: "evidence/traces/EXEC-20260615-0012.zip"
---

# Hướng Dẫn Kỹ Thuật: Phòng Tránh Session Timeout Trong Test Suites

### 1. Triệu Chứng Nhận Biết
- Lỗi xuất hiện: `locator.click: Target page, context or browser has been closed` hoặc request chuyển hướng đột ngột về `/login?reason=session_expired`.
- Xảy ra khi test suite chạy quá 15 phút mà không tái xác thực.

### 2. Giải Pháp Triển Khai Trong Playwright Fixtures
```typescript
// Trong fixtures/execution-fixture.ts:
export const test = base.extend({
  authenticatedPage: async ({ browser }, use) => {
    // Tạo context mới độc lập có lưu trữ auth state tươi mới
    const context = await browser.newContext({ storageState: 'state/fresh-auth.json' });
    const page = await context.newPage();
    await use(page);
    await context.close();
  }
});
```
