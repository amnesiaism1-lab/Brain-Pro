# Quality Gates: Bộ Tiêu Chí Chặn Cửa Chất Lượng Kiểm Thử

> **Cấp độ tài liệu**: Quy chuẩn bắt buộc (.agents/rules/quality-gates.md)  
> **Cơ sở tiêu chuẩn**: ISO/IEC/IEEE 29119-2 (Test Processes), CTAL-TAE (Test Architecture)

---

## 1. Mục Đích
Quality Gates là các rào chắn kỹ thuật ngăn chặn những kịch bản kiểm thử kém chất lượng, chạy lấy lệ, hoặc chứa đựng rủi ro flaky lọt vào hệ sinh thái kiểm thử chính thức.

---

## 2. Các Cổng Chất Lượng Bắt Buộc (The 5 Mandatory Gates)

### Gate 1: RTM & Traceability Gate (Truy Vết Đầy Đủ)
- **Tiêu chí**: 100% Test Case phải truy vết ngược về ít nhất một Requirement ID hoặc Risk ID trong `RTM_Traceability_Matrix.md`.
- **Vi phạm**: Tạo test case trôi nổi không gắn với mục tiêu nghiệp vụ.

### Gate 2: Test Oracle Fidelity Gate (Độ Trung Thực Của Oracle)
- **Tiêu chí**: Mỗi Test Case phải có định nghĩa **Test Oracle độc lập** nêu rõ chân lý đúng đắn của dữ liệu/trạng thái.
- **Quy tắc cấm (Shallow Assertion Ban)**:
  - ❌ **CẤM**: Chỉ assert `expect(page.url()).toContain('/dashboard')` để kết luận đăng nhập thành công.
  - ✅ **BẮT BUỘC**: Phải assert thêm User Profile Name, Role Badge, Menu Quyền Hạn, và Data Integrity (ví dụ Balance, Account ID).
  - ❌ **CẤM**: Chỉ kiểm tra Toast Message "Tạo đơn hàng thành công".
  - ✅ **BẮT BUỘC**: Phải kiểm tra Order ID được sinh ra, hiển thị đúng trong Data Table, và trạng thái khởi tạo là DRAFT/PENDING.

### Gate 3: Web-First & Flakiness Prevention Gate
- **Tiêu chí**: Toàn bộ tương tác và assertion phải dựa trên Web-First APIs của Playwright có tính năng tự động thử lại (Auto-retrying).
- **Quy tắc cấm**:
  - ❌ **CẤM TUYỆT ĐỐI**: `await page.waitForTimeout(milliseconds)` (Arbitrary Sleep). Thay thế bằng `toBeVisible()`, `toHaveText()`, hoặc `page.waitForResponse()`.
  - ❌ **CẤM**: Dùng boolean assertion làm mất auto-retry: `expect(await locator.isVisible()).toBe(true)`.
  - ✅ **BẮT BUỘC**: Dùng Web-First: `await expect(locator).toBeVisible({ timeout: 5000 })`.

### Gate 4: Robust Locator Gate (Quy Chuẩn Định Danh Bền Vững)
- **Thứ tự ưu tiên locator**:
  1. `page.getByRole('button', { name: 'Submit' })` (Semantic Accessibility)
  2. `page.getByLabel('Email address')` (Form Controls)
  3. `page.getByPlaceholder('Enter amount')`
  4. `page.getByTestId('transaction-submit-btn')` (Chống thay đổi layout/styling)
  5. `page.getByText('Confirm Payment')`
- **Quy tắc cấm**:
  - ❌ **CẤM**: CSS Selector phụ thuộc cấu trúc DOM: `div.content > div:nth-child(2) > button`.
  - ❌ **CẤM**: Absolute XPath: `/html/body/div[1]/section/form/div[3]/input`.
  - ❌ **CẤM**: Class tự sinh của bundler/CSS modules: `.css-19zjn8v`.

### Gate 5: Test Isolation & Independence Gate
- **Tiêu chí**: Mỗi kịch bản test phải là một đơn vị độc lập (Self-contained).
- **Yêu cầu**:
  - Mỗi test chạy trên một Browser Context / Storage State riêng biệt.
  - Không được phụ thuộc vào kết quả của test chạy trước đó (ví dụ: Test B chỉ chạy được nếu Test A đã tạo user).
  - Dữ liệu test phải được chuẩn bị qua Test Fixtures hoặc Mock Service.
