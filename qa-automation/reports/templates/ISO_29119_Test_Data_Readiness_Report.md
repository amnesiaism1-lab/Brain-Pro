# [TDRR] Báo Cáo Mức Độ Sẵn Sàng Của Dữ Liệu Kiểm Thử (Test Data Readiness Report)

> **Cơ sở tiêu chuẩn**: ISO/IEC/IEEE 29119-3 Clause 7.7  
> **Mục tiêu**: Đảm bảo toàn bộ tài khoản, hạn mức, token, và dữ liệu mẫu đã được nạp sẵn sàng trước khi chạy Test Suite.

---

## 1. Thông Tin Đợt Kiểm Thử
- **Report ID**: TDRR-{{DATE}}-{{RUN_ID}}
- **Target Environment**: {{TARGET_NAME}}
- **Người thẩm định dữ liệu**: {{QA_ENGINEER_NAME}}
- **Trạng thái tổng quát**: `[ ] SẴN SÀNG (READY)` / `[ ] CHƯA SẴN SÀNG (NOT READY)`

---

## 2. Danh Mục Dữ Liệu Kiểm Thử Yêu Cầu (Data Requirements Checklist)

| Loại Dữ Liệu | Tài Khoản / Bản Ghi Yêu Cầu | Trạng Thái Ban Đầu | Số Dư / Hạn Mức | Sẵn Sàng? |
| :--- | :--- | :---: | :---: | :---: |
| **Admin User** | `admin@omniflow.io` | ACTIVE | Unlimited | [x] Đã nạp |
| **Approver User** | `approver@omniflow.io` | ACTIVE | Phê duyệt > $1,000 | [x] Đã nạp |
| **Operator User** | `operator@omniflow.io` | ACTIVE | Khởi tạo <= $5,000 | [x] Đã nạp |
| **Locked User** | `locked_user@omniflow.io` | SUSPENDED | $0.00 | [x] Đã nạp |
| **Tài khoản nguồn test** | `ACC-1001-ACTIVE` | ACTIVE | $2,000.00 USD | [x] Đã nạp |
| **Tài khoản đích nhận** | `ACC-9988-DEST` | ACTIVE | $500.00 USD | [x] Đã nạp |

---

## 3. Chiến Lược Dọn Dẹp & Khôi Phục (Teardown & Reset Strategy)
- **Cơ chế khôi phục**: {{RESET_MECHANISM}} (ví dụ: Database Transaction Rollback / API Reset Endpoint sau mỗi test run).
- **Đánh giá rủi ro xung đột dữ liệu**: THẤP (Các test case sử dụng UUID ngẫu nhiên cho mã giao dịch).
