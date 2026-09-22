# Oracle Definition: Quy Chuẩn Tách Rời Test Oracle Khỏi Assertion

> **Cấp độ tài liệu**: Quy chuẩn phương pháp luận (.agents/rules/oracle-definition.md)  
> **Cơ sở tiêu chuẩn**: ISTQB CTFL 4.0 (Glossary & Principles), CTAI / CT-GenAI (The Oracle Problem)

---

## 1. Bản Chất Của Test Oracle Trong ISTQB
Theo định nghĩa chuẩn của ISTQB:
> **Test Oracle**: Nguồn chân lý độc lập dùng để xác định kết quả kỳ vọng (Expected Result) nhằm so sánh với kết quả thực tế (Actual Result) của phần mềm đang được kiểm thử.

### Sự Khác Biệt Giữa Expected Behavior, Oracle và Assertion

| Khái Niệm | Tầng Nhận Thức | Ví Dụ Nghiệp Vụ | Công Cụ Thể Hiện |
| :--- | :--- | :--- | :--- |
| **Requirement** | Yêu cầu nghiệp vụ | "Người dùng chuyển $500, số dư bị trừ tương ứng và phát sinh phí $2." | User Story / PRD |
| **Test Condition** | Điều kiện kiểm thử | "Kiểm thử khấu trừ số dư và ghi nhận phí giao dịch khi chuyển tiền hợp lệ." | Test Design Spec (ISO 29119-3) |
| **Expected Behavior** | Hành vi mong đợi | "Số dư mới giảm đúng $502; trạng thái giao dịch là COMPLETED." | Test Case Spec |
| **Test Oracle** | **Quy luật chân lý toán học/nghiệp vụ** | $$\text{Balance}_{\text{new}} = \text{Balance}_{\text{old}} - \text{Amount} - \text{Fee}$$ | Biểu thức logic / Bất biến (Invariant) |
| **Assertion** | **Cảm biến quan sát kỹ thuật** | `expect(page.getByTestId('balance')).toHaveText('$498.00')` | Playwright / API / SQL Assertion |

---

## 2. Các Loại Test Oracle Bắt Buộc Sử Dụng

### 2.1. Algebraic & State Invariants (Bất Biến Đại Số & Trạng Thái)
Mô tả mối quan hệ giữa trạng thái trước và sau khi thực hiện hành động:
- **Ngân hàng / Ví điện tử**: 
  $$\text{SenderBalance}_{\text{after}} + \text{ReceiverBalance}_{\text{after}} = \text{SenderBalance}_{\text{before}} + \text{ReceiverBalance}_{\text{before}} - \text{SystemFee}$$
- **Giỏ hàng / E-commerce**: 
  $$\text{TotalPayment} = \sum (\text{ItemPrice} \times \text{Quantity}) - \text{Discount} + \text{ShippingFee} + \text{Tax}$$

### 2.2. State Transition Oracles (Chân Lý Chuyển Dịch Trạng Thái)
Dựa trên mô hình Finite State Machine (FSM):
- Một hóa đơn chỉ có thể chuyển sang `PAID` nếu và chỉ nếu nó đang ở trạng thái `ISSUED` hoặc `OVERDUE`.
- Khi cố tình chuyển từ `DRAFT` sang `PAID` mà bỏ qua `SUBMITTED`: Oracle khẳng định hệ thống phải từ chối (REJECT) và giữ nguyên trạng thái `DRAFT`.

### 2.3. Multi-Channel Consistency Oracles (Chân Lý Nhất Quán Đa Kênh)
- Trạng thái nhìn thấy trên UI (Web Adapter) phải phản ánh đúng dữ liệu trả về từ API (API Adapter) và dữ liệu lưu trong cơ sở dữ liệu (DB Adapter).

---

## 3. Hướng Dẫn Soạn Thảo Test Oracle Cho Agent
Khi tạo bất kỳ Test Case nào trong `test-cases/specifications/`, Agent bắt buộc phải điền trường `oracle`:

```markdown
### Test Case: TC-TRANS-001 - Chuyển khoản thành công trong hạn mức
- **Input Data**: Amount = $150.00, Recipient = "ACC-99881122"
- **Preconditions**: Sender Balance = $1,000.00, Fee Rate = 1% ($1.50)
- **Test Oracle**:
  - `Expected_Sender_Balance == $1000.00 - $150.00 - $1.50 == $848.50`
  - `Expected_Transaction_Status == "COMPLETED"`
  - `Expected_Audit_Log_Event == "FUNDS_TRANSFERRED"`
- **Technical Observations (Assertions)**:
  - Web UI: `await expect(page.getByTestId('account-balance')).toHaveText('$848.50')`
  - Web UI: `await expect(page.getByTestId('tx-status')).toHaveText('COMPLETED')`
```
