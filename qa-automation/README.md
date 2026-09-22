# Universal QA Operating System (Hệ Điều Hành Kiểm Thử Đa Năng)

> **Tiêu chuẩn học thuật**: Tổng hợp tinh hoa từ 59 tài liệu chuẩn ISTQB (CTFL 4.0, CTAL-TAE, CTAL-TTA, CTAL-TA, ISO/IEC/IEEE 29119-3, IEEE 1044, CTAI, CT-GenAI) và kỹ thuật Agentic Engineering từ Agentic Awesome Skills.

---

## 1. Kiến Trúc Phân Tách Tổng Thể

```
                             QA CORE (Logic Cốt Lõi)
               (Test Design • Test Oracle • Quality Gates • Memory)
                                       │
                 ┌─────────────────────┼─────────────────────┐
                 ▼                     ▼                     ▼
            Web Adapter           API Adapter           DB Adapter
         (Playwright Driver)   (HTTP REST Client)   (SQL State Verifier)
                 │                     │                     │
                 ▼                     ▼                     ▼
          Mọi Web App/SaaS       Mọi REST/JSON API     Mọi Database
```

---

## 2. Cấu Trúc Thư Mục Repository

- **`.agents/`**: Hệ thống kỹ năng và quy tắc điều hành AI Apprentice Team:
  - `rules/`: Quy chuẩn làm việc giữa QA Lead (Bạn) và Apprentice AI, Quality Gates, Oracle Definition, Controlled Self-Healing.
  - `skills/`: 6 kỹ năng chuyên sâu (`test-design`, `playwright-automation`, `test-review`, `evidence-reporting`, `qa-debugging`, `qa-memory`).
  - `personas/`: Vai trò chuyên môn hóa (`test-designer`, `automation-engineer`, `quality-reviewer`).
- **`core/`**: Khung logic kiểm thử độc lập công nghệ:
  - Thuật toán EP, BVA (2-value & 3-value), Decision Table, State Transition Model.
  - Test Oracle Engine, Failure Classifier, Flakiness Analyzer.
  - Memory Schema & Provenance Tracker.
- **`adapters/`**: Các bộ điều khiển chuyển tiếp kỹ thuật (Web Playwright, API HTTP, DB SQL).
- **`targets/`**: Cấu hình môi trường mục tiêu (Local, Dev, Staging, Production).
- **`qa-memory/`**: Bộ não tri thức có cấu trúc và provenance (`known-issues`, `flaky-tests`, `locator-patterns`, `environment-problems`, `common-failures`, `lessons-learned`).
- **`test-cases/`**: Tài liệu thiết kế kiểm thử chuẩn ISO/IEC/IEEE 29119-3 (RTM, TDS, TCS kèm Test Oracles).
- **`executions/`**: Hồ sơ nhật ký vòng đời thực thi (`ExecutionRecord`).
- **`tests/`**: Bộ kịch bản kiểm thử Playwright tự động hóa:
  - `specs/atomic-loop.spec.ts`: **STEP 1: Vòng lặp nguyên tử** (1 Test Case -> 1 Execution -> 1 Evidence -> 1 Report).
  - `specs/suites/`: Các test suites hoàn chỉnh (Auth RBAC, BVA/EP, State Machine).
- **`reports/`**: Báo cáo Test Summary Report chuẩn ISO 29119-3 và Defect Report chuẩn IEEE 1044.
- **`evidence/`**: Hồ sơ bằng chứng số (Traces, Videos, Screenshots, HAR, Logs).
- **`docs/`**: Cẩm nang vận hành (`QA_LEAD_PLAYBOOK.md`, `PIPELINE_7_STEPS.md`, `ISTQB_GTAA_BLUEPRINT.md`, `ORACLE_DRIVEN_TESTING.md`).

---

## 3. Khởi Động Nhanh (Quick Start)

### Cài đặt dependencies kiểm thử:
```bash
cd qa-automation/tests
npm install
npx playwright install chromium
```

### Chạy Vòng Lặp Nguyên Tử (STEP 1):
```bash
npm run test:atomic
```

### Kiểm tra bằng chứng và báo cáo:
- Mở Playwright HTML Report: `npm run report:html`
- Xem hồ sơ thực thi sinh ra tại: `executions/history/`
- Xem bằng chứng traces tại: `evidence/traces/`
