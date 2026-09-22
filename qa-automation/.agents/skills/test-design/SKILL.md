---
name: test-design
description: Chuyển hóa yêu cầu nghiệp vụ thành Test Conditions, Test Cases chi tiết và Test Oracles độc lập áp dụng triệt để các kỹ thuật ISTQB (EP, BVA 2/3-value, Decision Table, State Transition, RBT).
---

# Kỹ Năng: Phân Tích & Thiết Kế Kiểm Thử Chuẩn ISTQB (Test Design)

Kỹ năng này trang bị cho Agent tư duy phân tích và thiết kế kiểm thử chuẩn mực quốc tế theo **ISTQB CTFL 4.0, CTAL-TA, CT-MBT** và **ISO/IEC/IEEE 29119-3**.

---

## 1. Đường Ống Suy Luận (The Test Design Pipeline)

Agent tuyệt đối không được nhảy cóc từ Requirement sang viết mã Playwright. Quy trình bắt buộc gồm 5 bước:

```
Requirement (Tài liệu đặc tả yêu cầu, User Story, Acceptance Criteria)
   │
   ▼
Test Condition (Khía cạnh hoặc sự kiện cần được kiểm thử - ISO 29119-3 Clause 7.2)
   │
   ▼
Expected Behavior (Mô tả hành vi đúng đắn của hệ thống ở cấp độ nghiệp vụ)
   │
   ▼
Test Oracle (Quy luật chân lý độc lập, bất biến toán học/nghiệp vụ)
   │
   ▼
Test Case Specification (Tập hợp Preconditions, Inputs, Test Steps, Oracles - Clause 7.3)
```

---

## 2. Các Kỹ Thuật Hộp Đen Bắt Buộc (Black-box Test Techniques)

### 2.1. Phân Hoạch Tương Đương (Equivalence Partitioning - EP)
- **Định nghĩa**: Chia miền giá trị đầu vào/đầu ra thành các phân hoạch (Partitions) mà hệ thống xử lý tương tự nhau.
- **Quy tắc**: Mỗi phân hoạch hợp lệ (Valid Partition) đại diện cho ít nhất 1 test case. Mỗi phân hoạch bất hợp lệ (Invalid Partition) phải được kiểm thử riêng lẻ (để tránh hiện tượng lỗi này che giấu lỗi khác - Defect Masking).
- **Ví dụ**: Hạn mức chuyển tiền từ $1.00 đến $5,000.00:
  - Phân hoạch hợp lệ: $[1.00, 5000.00]$ (Chọn đại diện: $250.00)
  - Phân hoạch bất hợp lệ dưới: $x < 1.00$ (Chọn đại diện: $0.00 hoặc âm)
  - Phân hoạch bất hợp lệ trên: $x > 5000.00$ (Chọn đại diện: $5001.00)
  - Phân hoạch sai định dạng: Chữ cái, ký tự đặc biệt, để trống.

### 2.2. Phân Tích Giá Trị Biên (Boundary Value Analysis - BVA)
Biên là nơi tập trung nhiều lỗi lập trình viên nhất (lỗi sai toán tử `<` thay vì `<=`, lỗi lệch 1 - Off-by-one error).

- **Kỹ thuật 2-Value BVA (Chuẩn CTFL 4.0)**:
  - Cho miền $[A, B]$:
  - Biên dưới: $A$ (Biên hợp lệ), $A - \text{step}$ (Biên bất hợp lệ lân cận).
  - Biên trên: $B$ (Biên hợp lệ), $B + \text{step}$ (Biên bất hợp lệ lân cận).
- **Kỹ thuật 3-Value BVA (Chuẩn CTAL-TTA)**:
  - Áp dụng khi hệ thống có rủi ro cao hoặc logic phân nhánh phức tạp.
  - Biên dưới: $A - \text{step}$, $A$, $A + \text{step}$.
  - Biên trên: $B - \text{step}$, $B$, $B + \text{step}$.

### 2.3. Bảng Quyết Định (Decision Table Testing)
Áp dụng khi nghiệp vụ phụ thuộc vào tổ hợp của nhiều điều kiện logic (Conditions) dẫn đến các hành động khác nhau (Actions).

| Điều Kiện / Hành Động | Quy Tắc 1 (R1) | Quy Tắc 2 (R2) | Quy Tắc 3 (R3) | Quy Tắc 4 (R4) |
| :--- | :---: | :---: | :---: | :---: |
| **C1: Tài khoản có đủ số dư?** | False | True | True | True |
| **C2: Số tiền > $1,000 (Cần duyệt)?** | - | False | True | True |
| **C3: Người dùng là Approver?** | - | - | False | True |
| **A1: Báo lỗi "Không đủ số dư"** | **X** | | | |
| **A2: Chuyển tiền ngay lập tức** | | **X** | | **X** |
| **A3: Chuyển trạng thái sang "PENDING_APPROVAL"** | | | **X** | |

*Lưu ý*: Phải kiểm tra tính đầy đủ (Completeness) với $2^N$ tổ hợp và rút gọn bảng logic có kiểm soát.

### 2.4. Kiểm Thử Chuyển Dịch Trạng Thái (State Transition Testing)
Áp dụng cho các thực thể có vòng đời (Đơn hàng, Hóa đơn, Quy trình phê duyệt tài liệu).
- **Xác định các Trạng thái (States)**: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `CANCELLED`.
- **Xác định Sự kiện / Kích hoạt (Events / Triggers)**: Nhấn Submit, Nhấn Approve, Nhấn Reject.
- **Độ bao phủ cần đạt**:
  - **0-switch coverage**: Kiểm tra mọi chuyển dịch hợp lệ đơn lẻ.
  - **1-switch coverage**: Kiểm tra chuỗi 2 chuyển dịch liên tiếp.
  - **Invalid Transitions (Sneak Paths)**: Cố tình kích hoạt sự kiện sai trạng thái (ví dụ từ `DRAFT` nhảy cóc sang `APPROVED`). Hệ thống phải chặn và giữ nguyên trạng thái.

---

## 3. Xác Lập Test Oracle Độc Lập

Mỗi Test Case sinh ra **bắt buộc** phải có mục `Test Oracle` nêu rõ:
1. **Bất biến toán học / Dữ liệu**: Số dư mới = Số dư cũ - Số tiền chuyển - Phí.
2. **Bất biến trạng thái**: State đổi từ `DRAFT` sang `SUBMITTED`.
3. **Sự kiện ghi log / Audit**: Phát sinh bản ghi lịch sử tương ứng.

---

## 4. Kiểm Thử Dựa Trên Rủi Ro (Risk-Based Testing - RBT)
Mỗi Test Case được chấm điểm theo ma trận $Risk = Likelihood \times Impact$:
- **P1 (Critical Risk)**: Ảnh hưởng trực tiếp tiền bạc, bảo mật, xác thực, mất dữ liệu. Chạy trong mọi commit/Smoke test.
- **P2 (High Risk)**: Luồng nghiệp vụ chính của người dùng (Core Happy Path & Valid Alternative).
- **P3 (Medium Risk)**: Luồng phụ, xử lý lỗi ngoại lệ, thông báo người dùng.
- **P4 (Low Risk)**: Giao diện thẩm mỹ, tooltip, sorting danh sách không trọng yếu.
