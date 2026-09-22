---
name: qa-debugging
description: Cung cấp cây quyết định phân loại thất bại kiểm thử (Application Bug vs Automation Bug vs Environment vs Test Data vs Flaky) và phương pháp khám nghiệm bằng chứng số để tìm nguyên nhân gốc rễ.
---

# Kỹ Năng: Chẩn Đoán & Điều Tra Nguyên Nhân Thất Bại (QA Debugging)

Kỹ năng này ngăn chặn Agent rơi vào cái bẫy quy kết vội vã: *"Hễ test FAIL là lỗi của sản phẩm"* hoặc *"Hễ test FAIL là vội vàng sửa script"*.

---

## 1. Cây Quyết Định Phân Loại Thất Bại (Triage Decision Tree)

Khi một Test Execution kết thúc với trạng thái **FAILED**:

```
                              [TEST FAILED]
                                    │
                                    ▼
                Bước 1: Kiểm Tra Trạng Thái Mạng & Server (HAR/Logs)
                                    │
           ┌────────────────────────┴────────────────────────┐
        (HTTP 502/503/504,                            (HTTP 200/400 bình thường)
      Connection Refused, CORS)                              │
           │                                                 ▼
           ▼                               Bước 2: Kiểm Tra Trạng Thái Dữ Liệu
  [ENVIRONMENT PROBLEM]                                      │
  - Server sập hoặc mạng lỗi                      ┌──────────┴──────────┐
  - Gắn nhãn: BLOCKED                    (User bị lock,         (Dữ liệu test
  - Báo hạ tầng / DevOps                  hết số dư từ           được seed đúng)
                                          test trước)                   │
                                                  │                     ▼
                                                  ▼             Bước 3: Khám Nghiệm
                                          [TEST DATA ISSUE]     DOM & Trình Duyệt
                                          - Test thiếu cô lập           │
                                          - Cải thiện Seed/Teardown     ▼
                                                                (TimeoutError,
                                                                 Selector không tìm thấy)
                                                                        │
                                                  ┌─────────────────────┴─────────────────────┐
                                                  ▼                                           ▼
                                        (Lỗi sau 3 lần chạy lại                     (Chạy lại thì lúc PASS
                                         vẫn y hệt, DOM đổi class)                  lúc FAIL không đổi code)
                                                  │                                           │
                                                  ▼                                           ▼
                                        [AUTOMATION SCRIPT BUG]                         [FLAKY TEST]
                                        - Selector lỗi thời                         - Race condition animation
                                        - Assertion sai timing                      - Font/script render chậm
                                        - Tự đề xuất Fix Proposal                   - Thiếu web-first wait
                                                  │
                                                  ▼
                                 Bước 4: Kiểm Tra Test Oracle
                                                  │
                                    (DOM hiển thị sai giá trị,
                                     tính toán sai, 500 Application Error)
                                                  │
                                                  ▼
                                        [APPLICATION BUG]
                                        - Lỗi sản phẩm thật sự!
                                        - Tạo Defect Ticket chuẩn IEEE 1044
```

---

## 2. Các Bước Khám Nghiệm Hiện Trường Pháp Y Số

### Bước 1: Khám Phá File Playwright Trace (`trace.zip`)
- Mở trace để xem lại dòng thời gian: Action nào là action cuối cùng thành công?
- DOM Snapshot tại thời điểm ném lỗi trông như thế nào?
- Nút bấm có bị che khuất bởi một modal backdrop, toast thông báo hay spinner loading không?

### Bước 2: Khám Phá Console Logs
- Có lỗi JavaScript chưa bắt (`Uncaught TypeError: Cannot read properties of undefined`) không?
- Có lỗi vi phạm Content Security Policy (CSP) không?

### Bước 3: Khám Phá Network HAR
- Request API tương ứng trả về mã trạng thái gì?
- Response payload có chứa thông báo lỗi chi tiết của backend không?

---

## 3. Bản Kết Luận Điều Tra (Investigation Report)
Mỗi ca thất bại phải được Agent tổng hợp thành một kết luận ngắn gọn trước khi hành động:
1. **Phân loại**: `[Application Bug | Automation Bug | Environment | Test Data | Flaky]`
2. **Triệu chứng**: Thông báo lỗi cụ thể và bước xảy ra sự cố.
3. **Nguyên nhân gốc rễ (Root Cause)**: Lý giải tại sao sự cố xảy ra dựa trên bằng chứng trace/network.
4. **Hành động tiếp theo**:
   - Nếu là Application Bug -> Khởi tạo Defect Ticket đính kèm bằng chứng.
   - Nếu là Automation Bug -> Tra cứu `qa-memory/` và tạo Fix Proposal.
   - Nếu là Flaky -> Áp dụng Web-First waiting và ghi nhận vào `qa-memory/flaky-tests/`.
