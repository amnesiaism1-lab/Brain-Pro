# Lộ Trình 7 Bước: Xây Dựng & Vận Hành Hệ Thống QA Automation

> **Phương châm**: *"Đừng bắt đầu bằng Multi-Agent phức tạp. Hãy bắt đầu bằng: 1 Test Case → 1 Browser Execution → 1 Evidence → 1 Report. Khi cái pipeline nhỏ này chạy chắc chắn, hãy nhân rộng nó lên."*

---

## Bản Đồ 7 Bước Tiến Hóa

```
[STEP 1: Atomic Test Loop] 
  │  1 TC -> 1 Browser Exec -> 1 Evidence -> 1 Report
  ▼
[STEP 2: Skills Mastery]
  │  Nạp 6 kỹ năng chuẩn ISTQB & AAS vào Agent
  ▼
[STEP 3: 2 Core Agents]
  │  Phân vai Designer (Logic) & Automation Engineer (Code)
  ▼
[STEP 4: Reviewer Gatekeeper]
  │  Kiểm duyệt viên chặn đứng test rởm & shallow assertion
  ▼
[STEP 5: Forensic Evidence System]
  │  Thu thập Trace, Video, Screenshot, HAR, Console
  ▼
[STEP 6: Antigravity Orchestration]
  │  Điều phối toàn bộ chuỗi mắt xích tự động
  ▼
[STEP 7: Knowledge Base (QA Memory)]
     Tích lũy kinh nghiệm, tái sử dụng giải pháp & Tự sửa lỗi có kiểm soát
```

---

### STEP 1: Vòng Lặp Nguyên Tử (The Atomic Test Loop)
- **Hành động**: Chạy file `tests/specs/atomic-loop.spec.ts`.
- **Mục tiêu đạt được**:
  - Trình duyệt Playwright khởi động thành công.
  - Tương tác với phần tử semantic (Link, Heading).
  - Web-First assertion thẩm định Oracle.
  - Tự động sinh ra file `ExecutionRecord` và Trace file.
- **Tiêu chuẩn vượt qua**: 100% PASS, thời gian chạy dưới 5 giây.

### STEP 2: Nạp Bộ 6 Kỹ Năng (Skills Integration)
- Nạp toàn bộ 6 kỹ năng tại `.agents/skills/` (`test-design`, `playwright-automation`, `test-review`, `evidence-reporting`, `qa-debugging`, `qa-memory`).
- Agent hiểu rõ cách dùng EP, BVA, Decision Table, State Transition, Web-first assertions.

### STEP 3: Phân Vai 2 Agent Lõi (Designer & Automation Engineer)
- Designer Agent: Tiếp nhận Requirement từ QA Lead -> Viết Test Cases với Test Oracles tường minh.
- Automation Engineer: Tiếp nhận Test Cases -> Viết mã Playwright dựa trên Page Object Model.

### STEP 4: Kích Hoạt Reviewer Agent (Quality Gate)
- Reviewer Agent chặn cửa trước khi test được chạy chính thức.
- Bắt lỗi test xanh giả tạo, kiểm tra chiều sâu khẳng định (3-layer assertion).

### STEP 5: Hệ Thống Bằng Chứng Pháp Y Số (Forensic Evidence System)
- Khi test fail, hệ thống tự động gom trọn gói: Trace, Video, Screenshot, Network HAR, Console logs.
- Báo cáo lỗi xuất bản theo chuẩn IEEE 1044.

### STEP 6: Dàn Nhạc Điều Phối Antigravity (Orchestration)
- Kết nối các mắt xích thành một dòng chảy liền mạch từ Requirement thô đến Báo cáo Test Summary Report chuẩn ISO 29119-3.

### STEP 7: Bộ Não Tri Thức Tích Lũy (`qa-memory/`)
- Gặp lỗi -> Chẩn đoán gốc rễ -> Tra cứu tri thức cũ -> Tạo Fix Proposal có kiểm soát -> Xác minh Sandbox -> QA Lead phê duyệt -> Ghi bài học mới vào `qa-memory/`.
