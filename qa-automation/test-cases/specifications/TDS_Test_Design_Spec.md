# Đặc Tả Thiết Kế Kiểm Thử (Test Design Specification - TDS)

> **Mã tài liệu**: TDS-OMNIFLOW-001  
> **Cơ sở tiêu chuẩn**: ISO/IEC/IEEE 29119-3 Clause 7.2  
> **Phạm vi**: Hệ thống vận hành tài chính & phân quyền OmniFlow

---

## 1. Feature Sets (Tập Hợp Tính Năng Cần Kiểm Thử)

### Feature Set 1: Phân Quyền & Xác Thực (RBAC Authentication)
- **Mô tả**: Kiểm soát truy cập dựa trên vai trò (Admin, Approver, Operator, Suspended).
- **Mục tiêu**: Đảm bảo chỉ người dùng hợp lệ mới có thể vào hệ thống và chỉ thấy đúng menu, quyền hạn tương ứng.

### Feature Set 2: Chuyển Khoản & Kiểm Soát Hạn Mức (Financial Transfers & Limits)
- **Mô tả**: Cho phép chuyển tiền với kiểm soát số dư và hạn mức giao dịch từ $1.00 đến $5,000.00.
- **Mục tiêu**: Tính toán khấu trừ số dư chính xác và từ chối các giao dịch vượt biên.

### Feature Set 3: Máy Trạng Thái Quy Trình (Workflow State Machine)
- **Mô tả**: Vòng đời tài liệu: `DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED / REJECTED`.
- **Mục tiêu**: Đảm bảo các chuyển dịch tuân thủ đúng quy chế và chặn mọi đường tắt bất hợp lệ.

---

## 2. Test Conditions (Danh Sách Điều Kiện Kiểm Thử)

| Test Condition ID | Feature Set | Điều Kiện Kiểm Thử Chi Tiết | Kỹ Thuật Áp Dụng | Mức Rủi Ro |
| :--- | :--- | :--- | :--- | :---: |
| **COND-AUTH-001** | RBAC Auth | Đăng nhập thành công với vai trò Quản trị viên (Admin), hiển thị toàn bộ quyền | Equivalence Partitioning | P1 |
| **COND-AUTH-002** | RBAC Auth | Từ chối đăng nhập với tài khoản bị khóa (Suspended User), giữ nguyên màn hình | Negative Testing | P1 |
| **COND-TRANS-001**| Transfers | Chuyển khoản với số tiền danh nghĩa hợp lệ ($250.00) trong hạn mức | EP (Valid Partition) | P1 |
| **COND-TRANS-002**| Transfers | Chuyển khoản với giá trị biên dưới hợp lệ ($1.00) và biên trên hợp lệ ($5,000.00) | 2-Value BVA (Min, Max) | P1 |
| **COND-TRANS-003**| Transfers | Từ chối chuyển khoản với giá trị biên dưới bất hợp lệ ($0.00) và biên trên ($5,001.00)| 2-Value BVA (Min-, Max+) | P1 |
| **COND-WF-001**   | Workflow | Chuyển dịch tuần tự từ DRAFT sang SUBMITTED thành công | 0-Switch State Transition | P2 |
| **COND-WF-002**   | Workflow | Phê duyệt yêu cầu từ SUBMITTED sang APPROVED bởi Approver | 0-Switch State Transition | P2 |
| **COND-WF-003**   | Workflow | Chặn nỗ lực duyệt thẳng từ DRAFT sang APPROVED (Invalid Transition) | Sneak Path Testing | P2 |
