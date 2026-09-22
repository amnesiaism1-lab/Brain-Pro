# Bản Đồ Kiến Trúc gTAA & Tổng Hợp Tri Thức 59 Tài Liệu ISTQB

> **Cơ sở học thuật**: Tổng hợp tinh hoa từ 59 tài liệu giáo trình và đề thi chuẩn quốc tế của ISTQB:
> - **Cốt lõi**: CTFL 4.0 (Foundations), CTAL-TAE (Test Automation Engineering), CTAL-TTA (Technical Test Analyst), CTAL-TA (Test Analyst)
> - **Tiêu chuẩn tài liệu**: ISO/IEC/IEEE 29119-3 (Test Documentation) & IEEE 1044 (Defect Classification)
> - **Chuyên đề mở rộng**: CT-TAS (Strategy), CT-SEC (Security), CT-PT (Performance), CT-MAT (Mobile), CT-MBT (Model-Based), CTAI & CT-GenAI (AI Testing)

---

## 1. Kiến Trúc Tự Động Hóa Kiểm Thử Tổng Quát (gTAA - Generic Test Automation Architecture)

Kiến trúc `qa-automation/` được thiết kế tương thích 100% với mô hình 4 tầng chuẩn **ISTQB CTAL-TAE**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. TEST GENERATION LAYER (Tầng Khởi Tạo Kiểm Thử)                       │
│    - Test Designer Agent (.agents/personas/test-designer.md)           │
│    - Test Design Skill (.agents/skills/test-design/SKILL.md)           │
│    - Kỹ thuật: EP, BVA (2 & 3-value), Decision Tables, State Machines  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 2. TEST DEFINITION LAYER (Tầng Định Nghĩa Kiểm Thử)                    │
│    - RTM Traceability Matrix (test-cases/rtm/)                         │
│    - Test Case Specifications & Test Oracles (test-cases/specifications)│
│    - Test Data Fixtures & Storage States (tests/fixtures/)             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 3. TEST EXECUTION LAYER (Tầng Điều Khiển Thực Thi)                     │
│    - Test Execution Entity & History (executions/)                     │
│    - Playwright Test Runner (tests/playwright.config.ts)               │
│    - Quality Reviewer Gatekeeper (.agents/skills/test-review/)         │
│    - Failure Classifier & Flakiness Analyzer (core/execution/)         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│ 4. TEST ADAPTATION LAYER (Tầng Chuyển Tiếp Công Nghệ)                  │
│    - Web Adapter: Playwright Driver & BasePage (adapters/web/)         │
│    - API Adapter: HttpClient REST (adapters/api/)                      │
│    - DB Adapter: SQL StateVerifier (adapters/db/)                      │
│    - Target Configurations (targets/)                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Bảng Ánh Xạ Toàn Diện 59 Tài Liệu ISTQB Vào Repository

| Tài Liệu / Chứng Chỉ ISTQB | Khái Niệm Trọng Tâm | Thành Phần Tương Ứng Trong Repo |
| :--- | :--- | :--- |
| **ISO/IEC/IEEE 29119-3** | Đặc tả thiết kế, ca kiểm thử, nhật ký thực thi, báo cáo tổng kết | `test-cases/specifications/`, `executions/`, `reports/templates/` |
| **ISTQB CTFL 4.0** | Quy trình kiểm thử, kỹ thuật hộp đen (EP, BVA, Decision Table, STM), 7 nguyên lý | `.agents/skills/test-design/`, `core/design/techniques/` |
| **ISTQB CTAL-TAE** | Kiến trúc gTAA, bảo trì test, loại trừ flakiness, chỉ số tự động hóa | `adapters/`, `core/execution/FlakinessAnalyzer.ts`, `qa-memory/` |
| **ISTQB CTAL-TTA** | 3-value BVA, kiểm thử cấu trúc, tự động hóa dựa trên từ khóa & dữ liệu | `core/design/techniques/BoundaryValueAnalysis.ts` |
| **ISTQB CTAL-TA** | Kiểm thử dựa trên rủi ro (RBT), kỹ thuật kiểm thử theo nghiệp vụ | `.agents/rules/qa-lead-protocol.md`, `test-cases/models/` |
| **ISTQB CT-MBT** | Kiểm thử hướng mô hình (Model-Based), 0-switch, 1-switch, sneak paths | `core/design/techniques/StateTransitionModel.ts` |
| **ISTQB CT-SEC** | Phân quyền RBAC, kiểm tra ranh giới ủy quyền, chống bypass | `tests/specs/suites/auth-rbac.spec.ts` |
| **ISTQB CTAI & CT-GenAI** | Bài toán Test Oracle trong AI, Agentic workflows, chống hallucination | `.agents/rules/oracle-definition.md`, `.agents/rules/controlled-self-healing.md` |
| **IEEE 1044** | Phân loại lỗi theo mức độ nghiêm trọng (Severity) và ưu tiên (Priority) | `reports/templates/IEEE_1044_Defect_Report_Template.md` |

---

## 3. Các Nguyên Lý Kiểm Thử Áp Dụng Thực Tế (ISTQB 7 Testing Principles)

1. **Testing shows the presence of defects, not their absence**: Test pass không có nghĩa phần mềm không còn lỗi. Test chỉ chứng minh tính năng đạt các tiêu chí trong Test Oracle.
2. **Exhaustive testing is impossible**: Không thể test mọi giá trị đầu vào. Áp dụng EP và BVA để chọn lọc các mẫu đại diện có xác suất tìm thấy lỗi cao nhất.
3. **Early testing saves time and money**: Reviewer Agent chặn các lỗi thiết kế kịch bản ngay từ tầng đặc tả, trước khi mã hóa thành automation script.
4. **Defects cluster together**: Lỗi thường tập trung ở các module nhạy cảm (Giao dịch, Phân quyền, State Machine). Tập trung các kịch bản P1 vào đây.
5. **Beware of the pesticide paradox**: Nếu chạy mãi một tập test cũ, hệ thống sẽ kháng test. Định kỳ rà soát `qa-memory/` để cập nhật các kịch bản kiểm thử mới.
6. **Testing is context-dependent**: Kiểm thử Web khác kiểm thử API hay Database. Phân tách rõ ràng qua Target Adapters.
7. **Absence-of-errors is a fallacy**: Một hệ thống chạy trơn tru không lỗi nhưng không đáp ứng đúng nhu cầu người dùng vẫn là một hệ thống thất bại. Test Oracle bảo vệ tính đúng đắn về nghiệp vụ.
