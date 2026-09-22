---
id: "KI-FAIL-001"
title: "Khắc Phục Lỗi 'Element Click Intercepted' Do Toast Message Hoặc Spinner Che Khuất"
type: "common-failure"
status: "active"
confidence: "high"
app_applicability:
  target: "Universal"
  stack: ["Playwright", "WebUI"]
  environment: ["local", "staging", "production"]
first_seen: "2026-02-14"
last_verified: "2026-09-13"
source:
  execution_id: "EXEC-20260214-0019"
  author: "Automation-Engineer-Agent"
  reviewed_by: "QA-Lead"
problem: "Playwright báo lỗi: 'locator.click: Element is not clickable at point ... other element <div class=\"toast-notification\"> would receive the click'."
root_cause: "Sau khi thực hiện một thao tác, hệ thống hiển thị thông báo Toast ở góc màn hình hoặc Spinner che phủ toàn bộ màn hình, chặn sự kiện click chuột của bước tiếp theo."
solution: "1. Chờ Spinner/Overlay biến mất bằng cách dùng await expect(overlay).toBeHidden(); 2. Hoặc đóng Toast trước khi thực hiện bước tiếp theo; 3. Tuyệt đối không dùng force: true nếu đó là hành động của người dùng thực tế."
evidence_ref: "evidence/traces/EXEC-20260214-0019.zip"
---

# Hướng Dẫn: Xử Lý Hiện Tượng Click Bị Đè (Click Interception)

### Quy Tắc Chống "force: true":
Nhiều kỹ sư tự động hóa non kinh nghiệm thường lạm dụng `{ force: true }`:
```typescript
// ❌ CÁCH LÀM XẤU:
await page.getByRole('button', { name: 'Lưu' }).click({ force: true });
```
*Hậu quả*: Trình duyệt ép bắn sự kiện click kể cả khi nút đang bị ẩn, bị vô hiệu hóa (disabled), hoặc bị che khuất. Người dùng thật ngoài đời không thể click được, nhưng test vẫn PASS!

### Giải Pháp Đúng Đắn:
```typescript
// ✅ CÁCH LÀM CHUẨN MỰC:
// 1. Chờ loading overlay biến mất hoàn toàn
await expect(page.getByTestId('global-loading-spinner')).toBeHidden({ timeout: 10000 });

// 2. Click tự nhiên vào nút
await page.getByRole('button', { name: 'Lưu' }).click();
```
