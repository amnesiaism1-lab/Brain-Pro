---
id: "KI-FLAKE-001"
title: "Xử lý race condition khi Modal Dialog xuất hiện với CSS scale/fade animation"
type: "flaky-test"
status: "active"
confidence: "high"
app_applicability:
  target: "Universal"
  stack: ["React", "HeadlessUI", "RadixUI", "TailwindCSS"]
  environment: ["local", "staging", "production"]
first_seen: "2026-05-10"
last_verified: "2026-09-13"
source:
  execution_id: "EXEC-20260510-0088"
  author: "Automation-Engineer-Agent"
  reviewed_by: "QA-Lead"
problem: "Hành động click() vào nút bên trong Modal Dialog thỉnh thoảng bị lỗi 'Element is not clickable at point (x, y) because another element obscures it' hoặc click trượt tọa độ khi chạy Headless."
root_cause: "Framework UI thực hiện hiệu ứng CSS transform scale(0.95 -> 1.0) và opacity(0 -> 1) kéo dài 200ms. Playwright actionability check thấy element có trong DOM và visible nhưng tọa độ bounding box đang di chuyển liên tục."
solution: "Không dùng waitForTimeout. Sử dụng page.getByRole('dialog') kết hợp waitFor({ state: 'visible' }) và chờ phần tử ổn định vị trí, hoặc dùng trial click để kiểm tra actionability."
evidence_ref: "evidence/traces/EXEC-20260510-0088.zip"
---

# Hướng Dẫn Kỹ Thuật: Ổn Định Tương Tác Modal Dialog

### 1. Triệu Chứng Nhận Biết
- Lỗi xuất hiện ngẫu nhiên (chỉ bị 1/5 lần chạy, đặc biệt là trên CI/CD runner yếu):
  `Error: locator.click: Target closed or element detached`
  `Error: element is receiving pointer events but another element is covering it`

### 2. Mẫu Khắc Phục Chuẩn Mực
```typescript
// ❌ CÁCH LÀM DỄ FLAKY:
await page.getByRole('button', { name: 'Mở xác nhận' }).click();
await page.getByRole('button', { name: 'Đồng ý' }).click(); // Click ngay khi modal đang phóng to

// ✅ CÁCH LÀM VỮNG CHẮC (ZERO FLAKINESS):
await page.getByRole('button', { name: 'Mở xác nhận' }).click();

// 1. Chờ Dialog container ổn định
const dialog = page.getByRole('dialog');
await expect(dialog).toBeVisible();

// 2. Chờ nút bấm bên trong dialog hiển thị và sẵn sàng tương tác
const confirmBtn = dialog.getByRole('button', { name: 'Đồng ý' });
await expect(confirmBtn).toBeEnabled();

// 3. Thực hiện tương tác
await confirmBtn.click();
```
