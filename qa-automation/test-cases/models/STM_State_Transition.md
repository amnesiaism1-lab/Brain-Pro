# Mô Hình Chuyển Dịch Trạng Thái (State Transition Model - STM)

> **Cơ sở tiêu chuẩn**: ISTQB CT-MBT (Model-Based Testing) & CTAL-TA  
> **Thực thể mô hình hóa**: Vòng đời Yêu cầu thanh toán / Hồ sơ nghiệp vụ (Payment Request Lifecycle)

---

## 1. Định Nghĩa Trạng Thái & Sự Kiện (States & Events)

### Các Trạng Thái (States)
- `S1: DRAFT` (Bản nháp mới tạo)
- `S2: SUBMITTED` (Đã nộp, chờ xem xét)
- `S3: UNDER_REVIEW` (Đang được người có thẩm quyền kiểm tra)
- `S4: APPROVED` (Đã phê duyệt thành công)
- `S5: REJECTED` (Bị từ chối)
- `S6: CANCELLED` (Đã hủy bởi người tạo)

### Các Sự Kiện / Hành Động Kích Hoạt (Triggers)
- `E1: SUBMIT` (Nộp yêu cầu)
- `E2: START_REVIEW` (Bắt đầu thẩm định)
- `E3: APPROVE` (Chấp thuận)
- `E4: REJECT` (Từ chối)
- `E5: CANCEL` (Hủy yêu cầu)

---

## 2. Ma Trận Chuyển Dịch Trạng Thái (State Transition Matrix)

| Từ Trạng Thái (From State) | E1: SUBMIT | E2: START_REVIEW | E3: APPROVE | E4: REJECT | E5: CANCEL |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **S1: DRAFT** | **S2 (SUBMITTED)** | Invalid (Chặn) | **Sneak Path (Chặn)** | Invalid (Chặn) | **S6 (CANCELLED)** |
| **S2: SUBMITTED** | Invalid (Chặn) | **S3 (UNDER_REVIEW)**| Invalid (Chặn) | Invalid (Chặn) | **S6 (CANCELLED)** |
| **S3: UNDER_REVIEW**| Invalid (Chặn) | Invalid (Chặn) | **S4 (APPROVED)** | **S5 (REJECTED)** | Invalid (Chặn) |
| **S4: APPROVED** | Terminal | Terminal | Terminal | Terminal | Terminal |
| **S5: REJECTED** | Terminal | Terminal | Terminal | Terminal | Terminal |
| **S6: CANCELLED**| Terminal | Terminal | Terminal | Terminal | Terminal |

---

## 3. Độ Bao Phủ & Kịch Bản Kiểm Thử Bắt Buộc

### 1. Bao phủ 0-Switch (Mọi chuyển dịch hợp lệ đơn lẻ)
- `TC-STM-001`: S1 (DRAFT) --[E1: SUBMIT]--> S2 (SUBMITTED)
- `TC-STM-002`: S2 (SUBMITTED) --[E2: START_REVIEW]--> S3 (UNDER_REVIEW)
- `TC-STM-003`: S3 (UNDER_REVIEW) --[E3: APPROVE]--> S4 (APPROVED)
- `TC-STM-004`: S3 (UNDER_REVIEW) --[E4: REJECT]--> S5 (REJECTED)
- `TC-STM-005`: S1 (DRAFT) --[E5: CANCEL]--> S6 (CANCELLED)

### 2. Kiểm thử Sneak Paths (Các chuyển dịch bị cấm tuyệt đối)
- `TC-STM-SNEAK-01`: Cố tình gọi API/click duyệt khi hồ sơ đang ở `S1: DRAFT`:
  - **TEST ORACLE**: Hệ thống từ chối với lỗi `HTTP 400: Không thể phê duyệt hồ sơ ở trạng thái Bản nháp`. Trạng thái giữ nguyên `S1: DRAFT`.
