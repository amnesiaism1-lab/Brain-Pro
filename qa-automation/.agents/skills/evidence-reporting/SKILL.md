---
name: evidence-reporting
description: Đóng gói bằng chứng số pháp y kiểm thử (traces, videos, screenshots, HAR, console logs) và xuất bản báo cáo tổng kết theo chuẩn ISO/IEC/IEEE 29119-3 và IEEE 1044 dưới dạng Antigravity Artifacts.
---

# Kỹ Năng: Đóng Gói Bằng Chứng & Báo Cáo Chuẩn Quốc Tế (Evidence Reporting)

Kỹ năng này chuẩn hóa đầu ra của quá trình kiểm thử, biến các log kỹ thuật khô khan thành **Hồ sơ Bằng chứng Số (Forensic Evidence Bundle)** và các **Báo cáo Chất lượng Điều hành (Executive & Technical Reports)** theo chuẩn **ISO/IEC/IEEE 29119-3** và **IEEE 1044**.

---

## 1. Hồ Sơ Bằng Chứng Số Tiêu Chuẩn (The Evidence Bundle)

Mỗi lần thực thi (`Test Execution`), hệ thống tự động gom các hiện vật số vào thư mục `evidence/` theo định dạng `EXEC-{YYYYMMDD}-{ID}`:

```
evidence/
├── traces/EXEC-20260913-001.zip      # File Playwright Trace (DOM, Network, Action Replay)
├── videos/EXEC-20260913-001.webm     # Video ghi hình thời gian thực
├── screenshots/                      # Ảnh chụp màn hình tại các chốt kiểm tra
│   ├── checkpoint-01-loaded.png
│   └── failure-at-step-04.png
├── har/EXEC-20260913-001.har         # Bản ghi toàn bộ giao vận HTTP Network
└── console-logs/EXEC-20260913-001.log# Log của trình duyệt (Warnings, Errors, Exceptions)
```

---

## 2. Cấu Trúc Báo Cáo Hoàn Tất Kiểm Thử (Test Summary Report - ISO 29119-3 Clause 6.4)

Báo cáo xuất bản dưới dạng **Antigravity Markdown Artifact** để QA Lead và các bên liên quan dễ dàng duyệt:

```markdown
# [TSR-2026-CYCLE-01] Báo Cáo Tổng Kết Kiểm Thử Chu Trình Sprint 42

## 1. Thông Tin Điều Hành (Executive Summary)
- **Mục tiêu**: Đánh giá tính năng Chuyển Khoản Nhanh & Xác thực đa nhân tố.
- **Target / Environment**: OmniFlow Portal (Staging v1.4.2)
- **Thời gian thực hiện**: 2026-09-13 14:00 - 14:35 UTC
- **Kết quả tổng quát**: **PASSED (95.2% Pass Rate)** - 20 Passed, 1 Failed, 0 Blocked.
- **Khuyến nghị phát hành (Sign-off Recommendation)**: **CONDITIONAL GO** (Phát hành với điều kiện khắc phục lỗi Defect DEF-042).

## 2. Số Liệu Kiểm Thử & Phân Tắc
| Hạng Mục | Số Lượng | Tỷ Lệ (%) | Ghi Chú |
| :--- | :---: | :---: | :--- |
| **Tổng số Test Cases** | 21 | 100% | 100% truy vết về RTM |
| **Passed** | 20 | 95.2% | Đạt toàn bộ Happy Path & Boundary P1 |
| **Failed** | 1 | 4.8% | DEF-042 (P2 - Medium Risk) |
| **Blocked** | 0 | 0.0% | Hạ tầng ổn định |

## 3. Danh Mục Lỗi Phát Hiện (Defect Register - IEEE 1044)
- **DEF-042**: Không thể nhập ký tự thập phân ở ranh giới $0.99 trên trình duyệt WebKit.
  - *Mức độ nghiêm trọng (Severity)*: Major
  - *Mức độ ưu tiên (Priority)*: P2
  - *Bằng chứng*: [Trace File](file:///evidence/traces/EXEC-20260913-001.zip), [Screenshot](file:///evidence/screenshots/DEF-042.png)

## 4. Đánh Giá Rủi Ro Còn Lại (Residual Risks)
- Rủi ro giao dịch lẻ dưới $1.00 có thể bị làm tròn sai trên Safari/iOS. Cần hotfix trước khi mở rộng thị trường Mobile Web.
```

---

## 3. Báo Cáo Biến Cố / Lỗi Chuẩn IEEE 1044 (Defect Incident Report - Clause 7.12)

Khi test phát hiện lỗi của phần mềm, Agent tự động khởi tạo hồ sơ lỗi chuẩn mực:
```markdown
# [DEF-042] Lỗi Làm Tròn Tiền Tệ Dưới $1.00 Tại Biểu Mẫu Chuyển Khoản

- **Defect ID**: DEF-042
- **Test Case Tham Chiếu**: TC-BVA-TRANS-003
- **Test Execution ID**: EXEC-20260913-0021
- **Severity**: High (Tính toán tài chính sai lệch)
- **Priority**: P1 (Cần sửa ngay trong chu kỳ hiện tại)
- **Trạng thái**: NEW / OPEN
- **Môi trường**: Staging (Chromium 128, Node v20.15)
- **Mô tả ngắn**: Nhập số tiền $0.99 thì hệ thống tự động làm tròn về $0.00 và báo lỗi "Số tiền phải lớn hơn 0".
- **Các bước tái lập (Steps to Reproduce)**:
  1. Đăng nhập tài khoản `operator@omniflow.io`.
  2. Mở biểu mẫu Chuyển tiền (/transfer).
  3. Nhập số tài khoản đích `12345678`.
  4. Nhập số tiền `0.99`.
  5. Nhấn nút "Tiếp tục".
- **Kết quả thực tế (Actual Result)**: Input field nhảy về `0.00`, thông báo lỗi màu đỏ xuất hiện.
- **Kết quả kỳ vọng (Expected Result / Test Oracle)**: Input giữ nguyên `0.99`, cho phép tiếp tục với phí giao dịch $0.01.
- **Hồ sơ bằng chứng đính kèm**:
  - Screenshot: `evidence/screenshots/DEF-042_input_cleared.png`
  - Network HAR: `evidence/har/EXEC-20260913-0021.har` (Payload gửi lên: `{"amount": 0}`)
```
