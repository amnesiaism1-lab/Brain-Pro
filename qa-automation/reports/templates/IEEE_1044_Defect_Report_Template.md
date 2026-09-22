# [MÃ_DEFECT] Defect Incident Report

> **Cơ sở tiêu chuẩn**: IEEE 1044 (Standard Classification for Software Anomalies) & ISO/IEC/IEEE 29119-3 Clause 7.12

---

## 1. Defect Identification (Thông Tin Định Danh)
- **Defect ID**: {{DEFECT_ID}} (ví dụ: DEF-001)
- **Tiêu đề ngắn**: {{TITLE}}
- **Test Case Ref**: {{TEST_CASE_ID}} (ví dụ: TC-TRANS-004)
- **Execution Ref**: {{EXECUTION_ID}} (ví dụ: EXEC-20260913-0005)
- **Ngày phát hiện**: {{DATE_DETECTED}}
- **Người phát hiện**: {{REPORTER}} (Automation Agent / QA Lead)

---

## 2. Classification (Phân Loại Lỗi Chuẩn IEEE 1044)
- **Severity (Mức độ nghiêm trọng)**:
  - `[ ] Critical` (Sập hệ thống, mất dữ liệu, lỗ hổng bảo mật nghiêm trọng)
  - `[ ] Major` (Tính năng cốt lõi sai lệch, không có workaround)
  - `[ ] Moderate` (Tính năng phụ lỗi, có workaround)
  - `[ ] Minor` (Lỗi giao diện, typo, thẩm mỹ)
- **Priority (Mức độ ưu tiên khắc phục)**:
  - `[ ] P1 - Immediate` (Sửa ngay lập tức trong phiên làm việc)
  - `[ ] P2 - High` (Sửa trước khi kết thúc chu kỳ kiểm thử)
  - `[ ] P3 - Normal` (Đưa vào sprint tiếp theo)
  - `[ ] P4 - Low` (Khi có thời gian)

---

## 3. Environment Context (Ngữ Cảnh Môi Trường)
- **Target Application**: {{TARGET_APP}}
- **Môi trường**: {{ENVIRONMENT}} (Local / Staging / Production)
- **Build / Commit**: {{BUILD_VERSION}}
- **Trình duyệt / OS**: {{BROWSER_INFO}}

---

## 4. Description & Steps to Reproduce (Mô Tả & Các Bước Tái Lập)
### Các bước thực hiện:
1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

### Kết quả thực tế quan sát được (Actual Result):
{{ACTUAL_RESULT}}

### Kết quả kỳ vọng / Test Oracle (Expected Result):
{{EXPECTED_RESULT_ORACLE}}

---

## 5. Forensic Evidence (Bằng Chứng Pháp Y Số Đính Kèm)
- **Trace file**: [trace.zip]({{TRACE_PATH}})
- **Video thực thi**: [video.webm]({{VIDEO_PATH}})
- **Ảnh chụp màn hình**: ![Screenshot]({{SCREENSHOT_PATH}})
- **Network HAR**: [network.har]({{HAR_PATH}})
- **Console error log**:
```text
{{CONSOLE_ERROR_TEXT}}
```

---

## 6. Root Cause Hypothesis & Resolution (Giả Thuyết Nguyên Nhân & Khắc Phục)
- **Giả thuyết nguyên nhân gốc rễ**: {{ROOT_CAUSE}}
- **Đề xuất khắc phục (nếu có)**: {{SUGGESTED_FIX}}
