---
id: "KI-LESSON-001"
title: "Bài Học Xương Máu: Tuyệt Đối Không Chỉ Khẳng Định Bằng URL (Shallow Assertion Trap)"
type: "lesson-learned"
status: "active"
confidence: "high"
app_applicability:
  target: "Universal"
  stack: ["Playwright", "Web Testing", "API Testing"]
  environment: ["local", "dev", "staging", "production"]
first_seen: "2026-01-10"
last_verified: "2026-09-13"
source:
  execution_id: "EXEC-INCIDENT-POSTMORTEM-01"
  author: "QA-Lead"
  reviewed_by: "QA-Lead"
problem: "Hệ thống gặp sự cố nghiêm trọng trên Production: Người dùng bấm Đăng nhập bị điều hướng tới /dashboard nhưng hiển thị trắng xóa (White Screen of Death) do lỗi JavaScript ném ra từ widget biểu đồ. Tuy nhiên, toàn bộ E2E Test Suite trước đó vẫn PASS 100%!"
root_cause: "Kịch bản test tự động cũ chỉ khẳng định: await expect(page).toHaveURL(/.*dashboard/). Khi router chuyển trang thành công, test coi như hoàn tất và không thèm kiểm tra xem DOM có render được dữ liệu và widget người dùng hay không."
solution: "Quy tắc 3 Lớp Khẳng Định: Mọi bài test luồng nghiệp vụ bắt buộc phải assert: 1. URL chuyển dịch; 2. Thẻ định danh danh tính người dùng (User Identity); 3. Dữ liệu cốt lõi của tính năng (Core Business Data)."
evidence_ref: "evidence/traces/EXEC-INCIDENT-POSTMORTEM-01.zip"
---

# Bài Học Đúc Kết: Nguyên Tắc Khẳng Định 3 Lớp (3-Layer Assertion Doctrine)

Mỗi kịch bản kiểm thử hành động người dùng bắt buộc phải trải qua 3 lớp kiểm chứng:

```
[Hành Động Người Dùng]
          │
          ▼
Lớp 1: Khẳng Định Chuyển Dịch (Navigation Assertion)
       await expect(page).toHaveURL(/.*dashboard/);
          │
          ▼
Lớp 2: Khẳng Định Định Danh & Quyền Hạn (Identity & Authorization)
       await expect(page.getByTestId('user-name')).toHaveText('Trần Văn B');
       await expect(page.getByTestId('role-badge')).toHaveText('OPERATOR');
          │
          ▼
Lớp 3: Khẳng Định Dữ Liệu Nghiệp Vụ Thực Tế (Data Integrity / Test Oracle)
       await expect(page.getByTestId('account-balance')).toHaveText('$1,500.00');
       await expect(page.getByTestId('transaction-table-rows')).toHaveCount(5);
```
Nếu thiếu Lớp 2 hoặc Lớp 3, kịch bản test sẽ bị Quality Reviewer đánh rớt ngay lập tức!
