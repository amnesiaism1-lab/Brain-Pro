---
id: "KI-LOC-001"
title: "Mẫu Locator Bền Vững Cho Accessible Combobox & Select Dropdown"
type: "locator-pattern"
status: "active"
confidence: "high"
app_applicability:
  target: "Universal"
  stack: ["ARIA", "HTML5", "Select2", "React-Select"]
  environment: ["local", "staging", "production"]
first_seen: "2026-04-01"
last_verified: "2026-09-13"
source:
  execution_id: "EXEC-20260401-0005"
  author: "Test-Designer-Agent"
  reviewed_by: "QA-Lead"
problem: "Không thể dùng page.selectOption() trên các custom component dropdown (như React-Select, Ant Design Select) vì chúng không dùng thẻ <select> nguyên bản mà render bằng <div> và <ul>."
root_cause: "Các thư viện UI hiện đại giả lập Select bằng input ẩn kết hợp với danh sách portal render ngoài root DOM."
solution: "Tương tác theo chuẩn ARIA Accessibility: Click vào combobox role -> Điền text tìm kiếm -> Chọn option theo role('option', { name: '...' })."
evidence_ref: "evidence/traces/EXEC-20260401-0005.zip"
---

# Mẫu Locator Vàng: Tương Tác Custom Combobox

### 1. Phân Tích Cấu Trúc ARIA
Các component chuẩn mực luôn có cấu trúc:
- Container mở: `role="combobox"`
- Danh sách thả xuống: `role="listbox"`
- Từng dòng lựa chọn: `role="option"`

### 2. Triển Khai Trong Playwright
```typescript
// 1. Mở dropdown bằng semantic locator
const combobox = page.getByRole('combobox', { name: 'Chọn ngân hàng thụ hưởng' });
await combobox.click();

// 2. Nếu có ô search bên trong:
await combobox.fill('Vietcombank');

// 3. Chọn item theo role option
const targetOption = page.getByRole('option', { name: 'Vietcombank - Ngân hàng Ngoại thương' });
await expect(targetOption).toBeVisible();
await targetOption.click();

// 4. Khẳng định giá trị đã được chọn
await expect(combobox).toHaveText(/Vietcombank/);
```
