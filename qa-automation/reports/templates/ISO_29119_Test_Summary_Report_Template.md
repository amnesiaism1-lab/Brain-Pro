# [MÃ_BÁO_CÁO] Test Completion / Summary Report

> **Cơ sở tiêu chuẩn**: ISO/IEC/IEEE 29119-3 Clause 6.4 & ISTQB CTFL 4.0  
> **Cấp độ**: Báo Cáo Tổng Kết Chu Trình Kiểm Thử (Executive Test Summary Report)

---

## 1. Document Information (Thông Tin Tài Liệu)
- **Report ID**: {{REPORT_ID}} (ví dụ: TSR-2026-CYCLE-01)
- **Target / Environment**: {{TARGET_NAME}} (Môi trường: {{ENVIRONMENT}})
- **Build / Release Version**: {{BUILD_VERSION}}
- **Thời gian thực hiện**: {{START_TIME}} đến {{END_TIME}}
- **Người lập báo cáo**: {{AUTHOR}} (AI Apprentice Agent / Automation Engineer)
- **QA Lead phê duyệt**: {{QA_LEAD}}

---

## 2. Executive Summary (Tóm Tắt Điều Hành)
- **Mục tiêu đợt kiểm thử**: {{OBJECTIVE}}
- **Đánh giá chung**: **{{OVERALL_STATUS}}** (PASSED / FAILED / CONDITIONAL_PASS)
- **Tỷ lệ Pass Rate**: {{PASS_RATE}}%
- **Khuyến nghị phát hành (Release Recommendation)**: **{{RELEASE_RECOMMENDATION}}** (GO / NO-GO / CONDITIONAL_GO)

---

## 3. Test Results & Metrics (Số Liệu Kiểm Thử Chi Tiết)

| Hạng Mục Kiểm Thử | Kế Hoạch (Planned) | Đã Chạy (Executed) | Đạt (Passed) | Thất Bại (Failed) | Bị Chặn (Blocked) | Tỷ Lệ Pass (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Xác thực & RBAC** | | | | | | |
| **Giao dịch & Hạn mức (BVA/EP)**| | | | | | | |
| **Quy trình State Machine** | | | | | | | |
| **TỔNG CỘNG** | | | | | | | |

---

## 4. Defect Analysis (Phân Tích Khuyết Tật & Lỗi - IEEE 1044)

| Defect ID | Tóm Tắt Sự Cố | Severity (Mức Nghiêm Trọng) | Priority (Mức Ưu Tiên) | Test Case Ref | Trạng Thái |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **DEF-001** | | Critical / Major / Minor | P1 / P2 / P3 | | Open / Fixed / Waived |

---

## 5. Residual Risks & Mitigations (Rủi Ro Còn Lại & Biện Pháp Giảm Thiểu)
- **Rủi ro 1**: {{RISK_1_DESCRIPTION}} -> *Biện pháp*: {{MITIGATION_1}}
- **Rủi ro 2**: {{RISK_2_DESCRIPTION}} -> *Biện pháp*: {{MITIGATION_2}}

---

## 6. Sign-off & Approvals (Ký Duyệt Nghiệm Thu)
- **QA Lead Signature**: `[ĐÃ PHÊ DUYỆT]` / `[TỪ CHỐI]`
- **Ngày ký**: {{SIGN_OFF_DATE}}
- **Ghi chú của QA Lead**: {{QA_LEAD_NOTES}}
