---
name: playwright-automation
description: Chuyển hóa Test Cases và Test Oracles thành mã kiểm thử Playwright tự động chuẩn mực, áp dụng Page Object Model, semantic locators, web-first assertions, test isolation và loại bỏ hoàn toàn flakiness.
---

# Kỹ Năng: Tự Động Hóa Playwright Chuẩn CTAL-TAE (Playwright Automation)

Kỹ năng này trang bị cho Agent phương pháp hiện thực hóa các ca kiểm thử hộp đen thành mã **Playwright E2E/API** vững chắc, bền bỉ, dễ bảo trì theo kiến trúc **gTAA (Generic Test Automation Architecture)**.

---

## 1. Vòng Đời Thực Thi Mã (Automation Lifecycle)

```
Test Case & Oracle (Từ test-design)
   │
   ▼
1. Map UI (Khám phá cấu trúc trang, xác định semantic elements)
   │
   ▼
2. Locator Selection (Chọn locator bền vững: Role > Label > TestId)
   │
   ▼
3. Action (Tương tác có chủ đích: click, fill, select, check)
   │
   ▼
4. Web-First Assertion (Khẳng định trạng thái phản ánh Test Oracle)
   │
   ▼
5. Evidence & Trace Logging (Tự động ghi nhận Screenshot, Video, Trace, HAR)
   │
   ▼
6. Execution Record (Ghi nhận kết quả vào executions/ và thông báo QA Lead)
```

---

## 2. Quy Chuẩn Định Danh Bền Vững (Locator Best Practices)

### Thứ Tự Ưu Tiên Tuyệt Đối
1. **User-Facing Role (Tốt nhất cho trải nghiệm & accessibility)**:
   ```typescript
   await page.getByRole('button', { name: 'Xác nhận chuyển tiền' }).click();
   await page.getByRole('heading', { name: 'Bảng điều khiển', level: 1 }).toBeVisible();
   await page.getByRole('link', { name: 'Lịch sử giao dịch' }).click();
   ```
2. **Form Label & Placeholder (Dành cho biểu mẫu nhập liệu)**:
   ```typescript
   await page.getByLabel('Số tài khoản nhận').fill('9988776655');
   await page.getByPlaceholder('Nhập số tiền ($)').fill('250.00');
   ```
3. **Data Test ID (Dành cho widget phức tạp hoặc container đặc thù)**:
   ```typescript
   await page.getByTestId('account-balance-card').toBeVisible();
   await page.getByTestId('transaction-row-TX1092').click();
   ```
4. **Text Content (Khi văn bản mang tính định danh duy nhất)**:
   ```typescript
   await expect(page.getByText('Mã xác thực không hợp lệ')).toBeVisible();
   ```

### Các Kiểu Locator Bị CẤM TUYỆT ĐỐI
- ❌ **CẤM XPath phụ thuộc DOM**: `page.locator('//div[2]/div/form/div[3]/button')`
- ❌ **CẤM CSS phân cấp mỏng manh**: `page.locator('#app > main > div.container > button.btn-primary')`
- ❌ **CẤM Class động từ CSS modules**: `page.locator('.css-1x8zq9')`

---

## 3. Khẳng Định Phản Ánh Oracle (Web-First Assertions)

### Nguyên Tắc Vàng
> **Assertion kỹ thuật trong Playwright là cảm biến đo đạc trạng thái thực tế để so sánh với Test Oracle.**

### Mẫu Khẳng Định Đúng vs Sai

| Tình Huống | Vi Phạm Cần Tránh (Sai) | Chuẩn Mực Bắt Buộc (Đúng) |
| :--- | :--- | :--- |
| **Kiểm tra hiển thị** | `expect(await page.locator('.modal').isVisible()).toBe(true)`<br>*(Mất cơ chế auto-retry, dễ flaky)* | `await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })`<br>*(Tự động retry đến khi render xong)* |
| **Kiểm tra nội dung** | `expect(await page.locator('#val').innerText()).toContain('100')` | `await expect(page.getByTestId('balance')).toHaveText('$100.00')` |
| **Kiểm tra Oracle số dư** | Chỉ kiểm tra thông báo Toast "Chuyển tiền thành công" *(Shallow)* | Kiểm tra cả Toast, số dư mới bị trừ đúng công thức Oracle, và dòng giao dịch mới sinh ra trong bảng. |

---

## 4. Quy Tắc Loại Bỏ Hoàn Toàn Flakiness (Zero-Flakiness Rules)

### 1. Cấm Tuyệt Đối `page.waitForTimeout()`
- ❌ **CẤM**: `await page.waitForTimeout(3000); // Ngủ vu vơ chờ API`
- ✅ **ĐÚNG**:
  ```typescript
  // Chờ network response tương ứng hoàn tất
  const responsePromise = page.waitForResponse(resp => resp.url().includes('/api/transactions') && resp.status() === 200);
  await page.getByRole('button', { name: 'Thanh toán' }).click();
  await responsePromise;
  
  // Hoặc dựa vào trạng thái UI biến đổi
  await expect(page.getByTestId('success-banner')).toBeVisible();
  ```

### 2. Cô Lập Môi Trường Kiểm Thử (Test Isolation)
- Mỗi bài test chạy trên một `browserContext` mới, không lưu cache/cookies của bài trước.
- Không dùng tài khoản dùng chung nếu test có hành động ghi đè dữ liệu hoặc đổi mật khẩu.

---

## 5. Kiến Trúc Page Object Model (POM)

Mọi tương tác với trang phải được đóng gói trong lớp Page Object kế thừa từ `BasePage`:
```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class TransactionPage extends BasePage {
  readonly recipientInput: Locator;
  readonly amountInput: Locator;
  readonly submitButton: Locator;
  readonly balanceDisplay: Locator;

  constructor(page: Page) {
    super(page);
    this.recipientInput = page.getByLabel('Số tài khoản nhận');
    this.amountInput = page.getByLabel('Số tiền');
    this.submitButton = page.getByRole('button', { name: 'Chuyển tiền' });
    this.balanceDisplay = page.getByTestId('account-balance');
  }

  async executeTransfer(recipient: string, amount: string): Promise<void> {
    await this.recipientInput.fill(recipient);
    await this.amountInput.fill(amount);
    await this.submitButton.click();
  }

  async verifyBalanceAfterTransfer(expectedBalance: string): Promise<void> {
    await expect(this.balanceDisplay).toHaveText(expectedBalance);
  }
}
```
