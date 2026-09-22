# Controlled Self-Healing: Quy Tắc Tự Sửa Lỗi Có Kiểm Soát

> **Cấp độ tài liệu**: Quy chuẩn an toàn & đạo đức kiểm thử (.agents/rules/controlled-self-healing.md)  
> **Cơ sở tiêu chuẩn**: ISTQB CTAL-TAE (Test Maintenance), CTAI (Safety & Reliability in AI Testing)

---

## 1. Mối Nguy Hại Của "Tự Sửa Lỗi Tự Do" (Uncontrolled Self-Healing)
Nếu cho phép Agent tự do sửa test script mỗi khi test FAIL:
- Agent có thể **hạ thấp tiêu chí kiểm thử** (ví dụ: xóa bỏ assertion kiểm tra số dư, hoặc đổi expected result từ `$848.50` thành `$1000.00`) chỉ để test PASS!
- Hệ quả: Test trở nên vô dụng, các lỗi nghiêm trọng (Critical Bugs) của phần mềm bị che giấu hoàn toàn.

---

## 2. Quy Trình Tự Sửa Lỗi Có Kiểm Soát (The 5-Stage Protocol)

```
                       [Test Execution FAILS]
                                  │
                                  ▼
                     Stage 1: Failure Diagnostics
              (Phân loại: App Bug vs Automation Flaw)
                                  │
                                  ▼
                     Stage 2: Memory Retrieval
        (Tra cứu qa-memory/ tìm giải pháp đã xác minh có provenance)
                                  │
                                  ▼
                   Stage 3: Proposal Generation
               (Agent tạo Fix Proposal có cấu trúc)
                                  │
                                  ▼
                  Stage 4: Sandbox Verification
               (Chạy thử nghiệm cô lập để chứng minh)
                                  │
                                  ▼
                  Stage 5: Decision Boundary Gate
                                  │
           ┌──────────────────────┴──────────────────────┐
           ▼                                             ▼
[Loại A: Sửa Locator thuần túy]               [Loại B: Chạm vào Logic / Oracle]
(Đổi selector UI, tăng wait hợp lệ)           (Đổi Expected Result, sửa flow nghiệp vụ)
           │                                             │
           ▼                                             ▼
Áp dụng tự động NẾU:                         BẮT BUỘC DỪNG LẠI:
- Confidence == "high"                       - Trình Fix Proposal lên QA Lead
- last_verified < 30 ngày                    - Chỉ áp dụng sau khi QA Lead duyệt
- Pass 100% Sandbox run
```

---

## 3. Cấu Trúc Bắt Buộc Của Một Fix Proposal
Khi đề xuất sửa đổi, Agent phải tạo một tài liệu theo định dạng sau:

```markdown
# [FIX-PROPOSAL] FP-2026-001: Khắc phục Locator Timeout tại Nút Thanh Toán

- **Target / Environment**: OmniFlow Portal (Staging v1.4)
- **Execution ID Gốc**: EXEC-20260913-0102
- **Lỗi Quan Sát Được**: `TimeoutError: locator.click: Timeout 5000ms exceeded waiting for locator('.btn-checkout')`
- **Phân Loại Gốc Rễ**: Automation Bug (Frontend chuyển sang dùng component thư viện mới, class `.btn-checkout` bị loại bỏ).
- **Tri Thức Tham Chiếu (`qa-memory/`)**:
  - Item ID: `KI-LOC-0012`
  - Provenance: Đã xác minh ngày 2026-08-20, độ tin cậy HIGH.
- **Thay Đổi Đề Xuất (Code Diff)**:
  ```diff
  - await page.locator('.btn-checkout').click();
  + await page.getByRole('button', { name: 'Thanh toán ngay' }).click();
  ```
- **Tác Động Đến Test Oracle**: **KHÔNG**. Không làm thay đổi bất kỳ assertion logic nghiệp vụ nào.
- **Kết Quả Sandbox Run**: Đã chạy thử nghiệm 3 lần liên tiếp: PASS 3/3, thời gian phản hồi 210ms.
- **Trạng Thái Đề Xuất**: `PENDING_QA_LEAD_REVIEW` (hoặc `AUTO_APPLIED` nếu là Loại A).
```

---

## 4. Các Điều Cấm Kỵ Tuyệt Đối (Zero Tolerance Rules)
1. **CẤM** tự ý thay đổi giá trị mong đợi trong Assertion (ví dụ: đổi `expect(x).toBe(10)` thành `expect(x).toBe(20)`) nếu không có văn bản chấp thuận thay đổi yêu cầu từ QA Lead.
2. **CẤM** bọc các assertion đang fail vào khối `try...catch` để nuốt lỗi.
3. **CẤM** chèn `// @ts-ignore` hoặc bỏ qua kiểm tra kiểu dữ liệu để vượt qua lint.
4. **CẤM** áp dụng tri thức từ `qa-memory/` nếu mục đó có trạng thái `deprecated` hoặc `last_verified` quá 180 ngày mà chưa qua kiểm định lại.
