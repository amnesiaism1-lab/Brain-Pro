# Đặc Tả Ca Kiểm Thử (Test Case Specification - TCS)

> **Mã tài liệu**: TCS-OMNIFLOW-001  
> **Cơ sở tiêu chuẩn**: ISO/IEC/IEEE 29119-3 Clause 7.3  
> **Điểm nhấn cốt lõi**: Tách bạch rõ ràng giữa Inputs, Expected Behavior, **Test Oracle** và Technical Assertions.

---

## 1. Nhóm Ca Kiểm Thử Xác Thực & RBAC

### TC-AUTH-001: Đăng nhập thành công với vai trò Administrator
- **Test Condition ID**: COND-AUTH-001
- **Mức ưu tiên**: P1 (Critical)
- **Tiền điều kiện (Preconditions)**:
  - Tài khoản `admin@omniflow.io` tồn tại, mật khẩu `Admin@2026!`, trạng thái `ACTIVE`.
- **Dữ liệu đầu vào (Inputs)**:
  - Username: `admin@omniflow.io`
  - Password: `Admin@2026!`
- **Các bước thực hiện (Execution Steps)**:
  1. Truy cập trang `/login`.
  2. Nhập Username và Password.
  3. Nhấn nút "Đăng nhập".
- **Hành vi kỳ vọng (Expected Behavior)**:
  - Chuyển hướng về `/dashboard`.
  - Hiển thị tên `System Administrator` và Role Badge `ADMIN`.
  - Menu hiển thị đủ 4 mục: Dashboard, Transfers, Approvals, Audit Logs.
- **TEST ORACLE (Chân lý kiểm thử)**:
  $$\text{User.IsAuthenticated} = \text{true} \land \text{User.Role} = \text{ADMIN} \land \text{AccessibleMenus} = \{\text{Dashboard, Transfers, Approvals, Audit}\}$$
- **Khẳng định kỹ thuật (Technical Assertions)**:
  - `await expect(page).toHaveURL(/.*dashboard/);`
  - `await expect(page.getByTestId('user-display-name')).toHaveText('System Administrator');`
  - `await expect(page.getByTestId('role-badge')).toHaveText('ADMIN');`
  - `await expect(page.getByRole('link', { name: 'Audit Logs' })).toBeVisible();`

---

### TC-AUTH-002: Từ chối đăng nhập với tài khoản bị khóa (Suspended User)
- **Test Condition ID**: COND-AUTH-002
- **Mức ưu tiên**: P1 (Critical)
- **Tiền điều kiện**:
  - Tài khoản `locked_user@omniflow.io` có trạng thái `SUSPENDED`.
- **Dữ liệu đầu vào**:
  - Username: `locked_user@omniflow.io`, Password: `Password@123`
- **TEST ORACLE**:
  $$\text{User.IsAuthenticated} = \text{false} \land \text{ErrorDisplayed} = \text{"Tài khoản đã bị tạm khóa"} \land \text{CurrentURL} = \text{"/login"}$$
- **Khẳng định kỹ thuật**:
  - `await expect(page).toHaveURL(/.*login/);`
  - `await expect(page.getByTestId('auth-error-alert')).toHaveText('Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên.');`

---

## 2. Nhóm Ca Kiểm Thử Chuyển Khoản & Giá Trị Biên (BVA / EP)

### TC-TRANS-001: Chuyển khoản số tiền danh nghĩa hợp lệ ($250.00)
- **Test Condition ID**: COND-TRANS-001
- **Tiền điều kiện**:
  - Tài khoản nguồn có số dư ban đầu: `Balance_before = $2,000.00`.
  - Phí giao dịch quy định: `Fee = $0.00` (Miễn phí nội bộ).
- **Dữ liệu đầu vào**:
  - Số tài khoản đích: `9988112233`
  - Số tiền: `$250.00`
- **TEST ORACLE**:
  $$\text{Balance}_{\text{after}} = \text{Balance}_{\text{before}} - \text{Amount} - \text{Fee} = \$2,000.00 - \$250.00 - \$0.00 = \$1,750.00$$
  $$\text{Transaction.Status} = \text{"COMPLETED"} \land \text{TransactionRecordGenerated} = \text{true}$$
- **Khẳng định kỹ thuật**:
  - `await expect(page.getByTestId('account-balance')).toHaveText('$1,750.00');`
  - `await expect(page.getByTestId('latest-tx-amount')).toHaveText('-$250.00');`
  - `await expect(page.getByTestId('latest-tx-status')).toHaveText('COMPLETED');`

---

### TC-TRANS-002: Kiểm thử giá trị biên dưới hợp lệ (BVA Min: $1.00)
- **Test Condition ID**: COND-TRANS-002
- **Dữ liệu đầu vào**: Amount = `$1.00`
- **TEST ORACLE**:
  $$\text{Balance}_{\text{after}} = \text{Balance}_{\text{before}} - \$1.00 \land \text{Status} = \text{"COMPLETED"}$$

---

### TC-TRANS-004: Từ chối giá trị biên dưới bất hợp lệ (BVA Min-: $0.00)
- **Test Condition ID**: COND-TRANS-003
- **Dữ liệu đầu vào**: Amount = `$0.00`
- **TEST ORACLE**:
  $$\text{Balance}_{\text{after}} = \text{Balance}_{\text{before}} \land \text{Error} = \text{"Số tiền chuyển tối thiểu là $1.00"}$$
- **Khẳng định kỹ thuật**:
  - `await expect(page.getByTestId('account-balance')).toHaveText('$2,000.00'); // Không đổi`
  - `await expect(page.getByTestId('amount-error-msg')).toHaveText('Số tiền chuyển tối thiểu là $1.00');`
