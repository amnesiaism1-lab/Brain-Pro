# Đặc Tả Quy Trình Thực Thi Kiểm Thử (Test Procedure Specification - TPS)

> **Mã tài liệu**: TPS-OMNIFLOW-001  
> **Cơ sở tiêu chuẩn**: ISO/IEC/IEEE 29119-3 Clause 7.4  
> **Mục tiêu**: Định nghĩa các bước thao tác (Action Steps) và điểm chốt kiểm tra (Checkpoints) chi tiết cho Test Set.

---

## 1. Test Set 1: Quy Trình Kiểm Thử Hạn Mức Giao Dịch BVA (PROC-TRANS-BVA-01)

### Thông Tin Quy Trình
- **Test Case Liên Quan**: `TC-TRANS-001`, `TC-TRANS-002`, `TC-TRANS-003`, `TC-TRANS-004`
- **Môi trường yêu cầu**: Target `TARGET-LOCAL-DEMO` hoặc `TARGET-STAGING-OMNIFLOW`
- **Tài khoản thực thi**: `operator@omniflow.io`

### Tuần Tự Các Bước Thực Hiện (Execution Sequence)

| Bước | Hành Động Thao Tác (Action Step) | Dữ Liệu Nhập (Inputs) | Điểm Chốt Kiểm Tra (Verification Checkpoint) |
| :---: | :--- | :--- | :--- |
| **1** | Mở trình duyệt và điều hướng tới `/login` | URL Target Base | Đảm bảo trang login load < 2000ms |
| **2** | Điền thông tin đăng nhập và nhấn Submit | `operator@omniflow.io` / `Pass@123` | URL chuyển sang `/dashboard`, hiển thị đúng tên User |
| **3** | Click vào menu "Chuyển tiền" trên thanh điều hướng | - | Biểu mẫu chuyển tiền hiển thị sẵn sàng |
| **4** | Ghi nhận số dư ban đầu ($B_0$) | Lấy từ `getByTestId('account-balance')`| Lưu vào biến $B_0$ |
| **5** | Điền thông tin giao dịch kiểm thử BVA | STK: `99881122`, Số tiền: `$250.00` | Input field nhận đúng giá trị không bị format sai |
| **6** | Nhấn nút "Xác nhận chuyển tiền" | - | Spinner xuất hiện rồi biến mất |
| **7** | **CHECKPOINT ORACLE 1 (Số dư mới)** | - | Số dư mới $B_1 = B_0 - 250.00$ |
| **8** | **CHECKPOINT ORACLE 2 (Lịch sử giao dịch)**| - | Dòng giao dịch đầu tiên có Amount = `-$250.00` và Status = `COMPLETED` |
| **9** | Đăng xuất khỏi hệ thống | - | Cookie session được xóa sạch, chuyển về `/login` |
