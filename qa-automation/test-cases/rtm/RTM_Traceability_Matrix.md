# Ma Trận Truy Vết Yêu Cầu (Requirements Traceability Matrix - RTM)

> **Cơ sở tiêu chuẩn**: ISO/IEC/IEEE 29119-3 (Test Documentation) & ISTQB CTFL 4.0  
> **Mục tiêu**: Đảm bảo 100% yêu cầu nghiệp vụ được bao phủ bởi điều kiện kiểm thử, ca kiểm thử và kịch bản tự động hóa; không có test case nào thừa thãi hoặc mồ côi.

---

## 1. Bảng Ma Trận Truy Vết 4 Chiều (4-Way Traceability Table)

| Requirement ID | Tên Yêu Cầu / Tính Năng | Rủi Ro (Risk) | Test Condition ID | Test Case ID | Test Spec Path | Status |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **REQ-AUTH-01** | Đăng nhập tài khoản với phân quyền RBAC | **P1 (Critical)** | COND-AUTH-001<br>COND-AUTH-002 | TC-AUTH-001 (Happy Path Admin)<br>TC-AUTH-002 (Locked User Negative) | `tests/specs/suites/auth-rbac.spec.ts` | **ACTIVE** |
| **REQ-TRANS-01**| Chuyển khoản trong hạn mức quy định | **P1 (Critical)** | COND-TRANS-001<br>COND-TRANS-002 | TC-TRANS-001 (Nominal Valid)<br>TC-TRANS-002 (BVA Min: $1.00)<br>TC-TRANS-003 (BVA Max: $5,000.00) | `tests/specs/suites/financial-bva-ep.spec.ts` | **ACTIVE** |
| **REQ-TRANS-02**| Chặn chuyển khoản vượt hạn mức hoặc số dư âm | **P1 (Critical)** | COND-TRANS-003 | TC-TRANS-004 (BVA Min-: $0.00)<br>TC-TRANS-005 (BVA Max+: $5,001.00) | `tests/specs/suites/financial-bva-ep.spec.ts` | **ACTIVE** |
| **REQ-WF-01**   | Quy trình xét duyệt tài liệu đa trạng thái | **P2 (High)** | COND-WF-001<br>COND-WF-002 | TC-WF-001 (Draft -> Submitted)<br>TC-WF-002 (Submitted -> Approved) | `tests/specs/suites/workflow-stm.spec.ts` | **ACTIVE** |
| **REQ-WF-02**   | Chặn chuyển dịch trạng thái bất hợp lệ (Sneak Paths) | **P2 (High)** | COND-WF-003 | TC-WF-003 (Draft -> Approved Bị Chặn) | `tests/specs/suites/workflow-stm.spec.ts` | **ACTIVE** |

---

## 2. Thống Kê Độ Bao Phủ (Coverage Metrics)
- **Tổng số Requirements**: 5
- **Requirements Đã Có Test**: 5 (100% Coverage)
- **Tổng số Test Cases Thiết Kế**: 10
- **Tỷ lệ Tự Động Hóa (Automation Ratio)**: 100%
