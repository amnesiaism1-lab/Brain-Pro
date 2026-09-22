# QA Lead Playbook: Sổ Tay Chỉ Huy Biệt Đội QA Apprentice AI

> **Dành riêng cho**: Bạn (QA Lead)  
> **Sứ mệnh**: Lãnh đạo hệ thống Antigravity AI như một team kiểm thử tinh nhuệ, vừa rèn luyện kỹ năng thực chiến vừa kiểm soát chất lượng tuyệt đối.

---

## 1. Tâm Thế Của QA Lead Trong Kỷ Nguyên Agentic AI
Bạn không phải là người gõ từng dòng lệnh test script hay ngồi click tay nhàm chán. Nhưng bạn cũng **không phó mặc cho AI làm bừa**.
Bạn là **Kiến Trúc Sư Chất Lượng (Quality Architect)**:

- **Bạn Nắm Giữ Chân Lý (Test Oracle)**: AI có thể tạo test rất nhanh, nhưng chỉ có bạn mới hiểu sâu sắc nghiệp vụ kinh doanh và biết kết quả như thế nào là thực sự đúng.
- **Bạn Giữ Chặn Cửa Rủi Ro (Quality Gate)**: Bạn quyết định tính năng nào quan trọng cần test kỹ (P1), tính năng nào có thể chấp nhận rủi ro (P4).
- **Bạn Là Người Ký Duyệt (Sign-off)**: Một bản phát hành có được đưa lên Production hay không là quyết định của bạn dựa trên bằng chứng do AI thu thập.

---

## 2. Quy Trình Vận Hành Hàng Ngày (Daily Workflow)

```
[Buổi sáng: Nhận Yêu Cầu / User Story mới]
                     │
                     ▼
Bước 1: QA Lead Giao Việc (Prompting The Designer)
- Cung cấp Requirement, gán nhãn Risk (P1/P2)
- Định nghĩa Test Oracle cốt lõi
                     │
                     ▼
Bước 2: Review Test Design Spec
- Đọc file TCS_Test_Case_Spec.md do Designer Agent tạo
- Phê duyệt các ca kiểm thử và biên giá trị BVA
                     │
                     ▼
Bước 3: Lệnh Cho Automation Engineer Viết Mã
- Chỉ thị áp dụng Web Adapter (Playwright) hoặc API Adapter
- Yêu cầu tuân thủ Zero-Sleep và Semantic Locators
                     │
                     ▼
Bước 4: Quality Gate Review
- Kiểm duyệt viên AI báo cáo: Có assertion nào bị shallow không?
- Bạn ký duyệt merge kịch bản test
                     │
                     ▼
Bước 5: Xem Xét Bằng Chứng & Nghiệm Thu
- Đọc Test Summary Report (TSR)
- Duyệt các đề xuất Fix Proposal (nếu có lỗi cần tự sửa)
- Ký duyệt phát hành (Release Sign-off)
```

---

## 3. Các Câu Lệnh Mẫu Để Bạn Điều Khiển Agent

### Giao việc thiết kế test:
> *"Chào Apprentice Designer. Hãy đọc User Story US-105 về nạp tiền qua thẻ tín dụng. Hãy phân tích các phân hoạch tương đương (EP) cho số tiền, phân tích 3-value BVA cho hạn mức $10 - $10,000, và thiết lập bảng quyết định cho 3 cổng thanh toán. Hãy tạo Test Case Spec kèm Test Oracle tường minh."*

### Yêu cầu thẩm định chất lượng test:
> *"Apprentice Reviewer hãy kiểm tra file `tests/specs/suites/payment.spec.ts`. Hãy tìm xem có assertion nào bị shallow chỉ kiểm tra URL hay không? Có chỗ nào dùng `waitForTimeout` không? Hãy báo cáo cho tôi."*

### Xử lý khi có đề xuất tự sửa lỗi (Fix Proposal):
> *"Tôi thấy đề xuất FP-001 thay đổi selector từ `.btn-pay` sang `getByRole('button', { name: 'Thanh toán' })`. Độ tin cậy HIGH và đã pass Sandbox. Tôi PHÊ DUYỆT áp dụng và cập nhật vào `qa-memory/`."*
