# Mô Hình Bảng Quyết Định (Decision Tables)

> **Cơ sở tiêu chuẩn**: ISTQB CTFL 4.0 & CTAL-TA  
> **Nghiệp vụ**: Ma trận phê duyệt giao dịch tài chính (Financial Transfer Approval Matrix)

---

## 1. Bảng Quyết Định Chi Tiết (Full 16-Rule Decision Table)

Hệ thống có 4 điều kiện đầu vào:
- **C1**: Tài khoản có đủ số dư thanh toán? (True / False)
- **C2**: Số tiền chuyển nằm trong hạn mức tối đa một lần (<= $5,000)? (True / False)
- **C3**: Giao dịch vượt ngưỡng cần phê duyệt (> $1,000)? (True / False)
- **C4**: Vai trò của người thực hiện là Quản trị viên/Approver? (True / False)

Số quy tắc lý thuyết: $2^4 = 16$ Rules. Dưới đây là bảng đã rút gọn các trường hợp bất khả thi hoặc tương đương:

| Điều Kiện / Hành Động | R1 | R2 | R3 | R4 | R5 | R6 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **C1: Đủ số dư?** | **False** | True | True | True | True | True |
| **C2: Trong hạn mức (<= $5,000)?** | - | **False** | True | True | True | True |
| **C3: Vượt ngưỡng (> $1,000)?** | - | - | **False** | **False** | **True** | **True** |
| **C4: Là Approver / Admin?** | - | - | False | True | **False** | **True** |
| **A1: Báo lỗi "Số dư không đủ"** | **X** | | | | | |
| **A2: Báo lỗi "Vượt quá hạn mức tối đa"** | | **X** | | | | |
| **A3: Thực hiện giao dịch NGAY LẬP TỨC** | | | **X** | **X** | | **X** |
| **A4: Chuyển sang trạng thái "CHỜ DUYỆT" (Pending)** | | | | | **X** | |

---

## 2. Ánh Xạ Thành Test Cases Tương Ứng
- **R1 -> TC-DT-001**: Chuyển tiền khi số dư không đủ -> Báo lỗi A1.
- **R2 -> TC-DT-002**: Chuyển số tiền $6,000 -> Báo lỗi A2.
- **R3 -> TC-DT-003**: Operator chuyển $500 (<= $1,000) -> Xử lý ngay A3.
- **R5 -> TC-DT-004**: Operator chuyển $2,500 (> $1,000) -> Chuyển sang Chờ duyệt A4.
- **R6 -> TC-DT-005**: Admin chuyển $2,500 (> $1,000) -> Tự động duyệt ngay A3.
