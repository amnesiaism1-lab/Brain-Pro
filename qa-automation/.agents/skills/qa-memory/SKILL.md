---
name: qa-memory
description: Quản trị và khai thác Bộ Não Tri Thức QA (qa-memory/) có cấu trúc, truy vết nguồn gốc (provenance), quản lý hạn sử dụng (last_verified) và đề xuất tự sửa lỗi có kiểm soát (Controlled Self-Healing).
---

# Kỹ Năng: Quản Trị Tri Thức & Tự Sửa Lỗi Có Kiểm Soát (QA Memory)

Kỹ năng này biến toàn bộ kinh nghiệm chẩn đoán, sửa lỗi và tối ưu kịch bản thành một **Kho Tri Thức Có Cấu Trúc Của Tổ Chức (Versioned Organizational Knowledge Base)** thay vì là một thư mục chứa log phế thải.

---

## 1. Cấu Trúc Phân Loại Tri Thức Trong `qa-memory/`

```
qa-memory/
├── known-issues/         # Lỗi sản phẩm đã biết, có issue tracker ref & workaround
├── flaky-tests/          # Test chập chờn, nguyên nhân timing/race condition & cách trị
├── locator-patterns/     # Thư viện locator vàng cho các widget phức tạp (Datepicker, Table, Modal)
├── environment-problems/ # Sự cố hạ tầng (CORS, token expiry, rate limit, slow network)
├── common-failures/      # Các mã lỗi Playwright phổ biến (TimeoutError, TargetClosed)
└── lessons-learned/      # Bài học kinh nghiệm & heuristics rút ra sau mỗi đợt kiểm thử
```

---

## 2. Chuẩn Metadata Bắt Buộc Của Một Knowledge Item (KI)

Mỗi tài liệu trong `qa-memory/` bắt buộc phải có phần Frontmatter chuẩn hóa:

```yaml
---
id: "KI-FLAKE-0021"
title: "Xử lý race condition khi Modal xuất hiện với CSS fade-in animation"
type: "flaky-test"      # [known-issue | flaky-test | locator-pattern | env-problem | common-failure | lesson-learned]
status: "active"        # [active | resolved | deprecated | under-review]
confidence: "high"      # [high | medium | low]
app_applicability:
  target: "OmniFlow Banking"
  stack: ["React", "Headless UI", "TailwindCSS"]
  environment: ["staging", "production"]
first_seen: "2026-04-12"
last_verified: "2026-09-13" # CỰC KỲ QUAN TRỌNG: Ngăn chặn dùng workaround cũ kỹ sau 6 tháng!
source:
  execution_id: "EXEC-20260913-0045"
  author: "Automation-Engineer-Agent"
  reviewed_by: "QA-Lead"
problem: "Hành động click() vào nút bên trong Dialog đôi khi bị lỗi 'Element is not clickable at point (x, y)' do animation đang phóng to."
root_cause: "Playwright actionability checks thấy phần tử visible nhưng opacity/transform đang chuyển động, vị trí bounding box thay đổi liên tục trong 200ms."
solution: "Sử dụng page.getByRole('dialog') kết hợp waitFor({ state: 'visible' }) và click({ trial: false }) hoặc chờ animation kết thúc."
evidence_ref: "evidence/traces/EXEC-20260913-0045.zip"
---
```

---

## 3. Vòng Đời Tái Sử Dụng Tri Thức: Problem -> Search -> Propose -> Verify -> Apply

```
[Gặp Vấn Đề Khi Test]
         │
         ▼
1. Tra cứu qa-memory/ bằng Error Signature, Target, hoặc Component
         │
         ▼
2. Kiểm tra tính hợp lệ:
   - status == "active"
   - confidence in ["high", "medium"]
   - last_verified < 180 ngày (Không dùng đồ cổ quá hạn!)
         │
         ▼
3. Sinh bản đề xuất khắc phục (Fix Proposal)
   - Nếu là sửa Locator/Wait: Tự động chạy Sandbox Verification
   - Nếu chạm vào Test Oracle: Bắt buộc trình QA Lead phê duyệt
         │
         ▼
4. Sau khi giải quyết thành công:
   - Cập nhật last_verified = ngày hiện tại
   - Hoặc tạo Knowledge Item mới nếu đây là bài học hoàn toàn mới!
```

---

## 4. Quy Tắc Vàng Ngăn Ngừa Lạm Dụng
1. **Tuyệt đối không biến `qa-memory` thành nơi chứa rác**: Mỗi file tạo ra phải có bài toán (Problem), nguyên nhân gốc rễ (Root Cause), và giải pháp cụ thể (Solution).
2. **Không tự động vá test làm yếu khẳng định**: Nếu giải pháp trong memory đề xuất bỏ qua một assertion, Agent phải gắn cờ báo động cho QA Lead thay vì tự tiện thực hiện.
