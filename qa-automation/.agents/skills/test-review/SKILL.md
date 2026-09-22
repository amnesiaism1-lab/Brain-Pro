---
name: test-review
description: Đóng vai trò Quality Gatekeeper thẩm định thực chất chất lượng kịch bản kiểm thử, phát hiện và triệt tiêu các khẳng định hời hợt (shallow assertions), đánh giá độ trung thực của Test Oracle và ngăn ngừa flakiness.
---

# Kỹ Năng: Thẩm Định Chất Lượng Kiểm Thử (Test Review)

Kỹ năng này định hướng Agent đóng vai trò **Kiểm Duyệt Viên Độc Lập (Senior QA Auditor)**, chặn cửa tất cả các kịch bản kiểm thử kém chất lượng trước khi được tích hợp vào pipeline kiểm thử chính thức.

---

## 1. Triết Lý Kiểm Duyệt Cốt Lõi

> ⚠️ **Câu Hỏi Bắt Buộc Của Reviewer**:  
> **"Test này có thật sự chứng minh Requirement không?"**  
> Chứ không phải: *"Script này có chạy từ đầu đến đuôi mà không quăng lỗi không?"*

### Thảm Họa Của "Test Xanh Giả Tạo" (False Positive Green)
Một kịch bản test có thể hoàn toàn **PASS (màu xanh)** nhưng thực chất là **vô giá trị** nếu các khẳng định chỉ chạm vào bề mặt giao diện mà bỏ qua tính đúng đắn của dữ liệu nghiệp vụ:

```typescript
// ❌ VÍ DỤ TEST KÉM CHẤT LƯỢNG (SHALLOW TEST):
test('User đăng nhập thành công', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('admin_user');
  await page.getByLabel('Password').fill('Secret@123');
  await page.getByRole('button', { name: 'Login' }).click();

  // Reviewer BẮT LỖI NGAY: Khẳng định này chỉ chứng minh URL đổi, KHÔNG chứng minh user
  // đã đăng nhập đúng tài khoản, đúng role Admin và dữ liệu của Admin có được tải an toàn!
  await expect(page).toHaveURL(/.*dashboard/); 
});
```

```typescript
// ✅ VÍ DỤ TEST CHUẨN MỰC (DEEP ASSERTION PHẢN ÁNH ORACLE):
test('User đăng nhập thành công với vai trò Quản trị viên', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('admin_user');
  await page.getByLabel('Password').fill('Secret@123');
  await page.getByRole('button', { name: 'Login' }).click();

  // 1. Kiểm tra URL chuyển dịch
  await expect(page).toHaveURL(/.*dashboard/);

  // 2. Kiểm tra danh tính người dùng (Identity verification)
  await expect(page.getByTestId('user-display-name')).toHaveText('Nguyễn Văn Admin');

  // 3. Kiểm tra Role Badge & Quyền hạn (Authorization check)
  await expect(page.getByTestId('role-badge')).toHaveText('SUPER_ADMIN');
  await expect(page.getByRole('link', { name: 'Quản lý người dùng' })).toBeVisible();

  // 4. Kiểm tra dữ liệu khởi tạo không bị rỗng hoặc lỗi (Data integrity)
  await expect(page.getByTestId('metrics-total-accounts')).not.toHaveText('0');
  await expect(page.getByTestId('system-status-indicator')).toHaveText('ONLINE');
});
```

---

## 2. Bảng Tiêu Chí Đánh Giá Bắt Buộc (Review Rubric)

Mỗi file test script được Reviewer chấm điểm theo 5 tiêu chí (Đạt / Không Đạt):

| Tiêu Chí | Dấu Hiệu Vi Phạm (Reject) | Chuẩn Mực Bắt Buộc (Approve) |
| :--- | :--- | :--- |
| **1. Oracle Depth (Chiều sâu Oracle)** | Chỉ assert trạng thái UI chung chung (URL, Toast "Success", Modal xuất hiện). | Assert đủ 3 lớp: UI state, Data Mutation (số dư, số lượng, id), Authorization/Role. |
| **2. Flakiness Risk** | Sử dụng `page.waitForTimeout()`, boolean assertion `isVisible().toBe(true)`, hoặc locator mỏng manh. | 100% Web-First assertions, semantic locators, event-driven waiting. |
| **3. Negative Path Coverage** | Chỉ có Happy Path, không kiểm tra phản ứng khi nhập dữ liệu biên sai, lỗi mạng, hoặc truy cập trái phép. | Có bộ test negative tương ứng kiểm tra thông báo lỗi cụ thể và trạng thái hệ thống không bị biến dạng. |
| **4. Test Isolation** | Test phụ thuộc vào state của bài trước; dùng chung tài khoản cố định làm biến đổi dữ liệu bài khác. | Mỗi test độc lập hoàn toàn; dùng fixtures hoặc dọn dẹp state sau khi chạy. |
| **5. Traceability** | Không ghi chú Requirement ID hoặc Test Case ID tương ứng. | Có comment hoặc annotation `@trace TC-AUTH-001` liên kết về RTM. |

---

## 3. Tư Duy Đột Biến (Mutation Testing Heuristic)

Khi kiểm duyệt một kịch bản test, Reviewer hãy tự đặt câu hỏi trong đầu:
> *"Nếu một lập trình viên vô tình làm hỏng tính năng (ví dụ: gỡ bỏ logic tính thuế, hoặc cho phép chuyển tiền khi tài khoản hết sạch số dư), test này có FAIL hay không?"*

- Nếu câu trả lời là **"Không, test vẫn xanh"** -> Test đã thất bại trong việc bảo vệ chất lượng. Trả về cho Automation Engineer viết lại ngay lập tức!
