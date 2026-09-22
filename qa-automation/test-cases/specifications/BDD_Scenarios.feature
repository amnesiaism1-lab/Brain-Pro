# language: vi
Tính năng: Chuyển Khoản & Phân Quyền Hạn Mức Tự Động
  Là một nhân viên vận hành (Operator) hoặc Quản trị viên (Admin)
  Tôi muốn thực hiện chuyển khoản an toàn
  Để phục vụ hoạt động thanh toán nội bộ của doanh nghiệp

  Bối cảnh:
    Giả sử tài khoản người dùng "operator@omniflow.io" đã đăng nhập thành công
    Và số dư khả dụng ban đầu là "2000.00" USD

  @smoke @p1
  Kịch bản: Chuyển khoản thành công trong hạn mức tự động duyệt (<= $1,000)
    Khi người dùng mở biểu mẫu chuyển tiền
    Và nhập số tài khoản nhận là "9988776655"
    Và nhập số tiền là "250.00" USD
    Và nhấn nút "Xác nhận chuyển tiền"
    Thì hệ thống phải thông báo giao dịch "COMPLETED"
    Và số dư tài khoản mới phải là "1750.00" USD
    Và bản ghi giao dịch mới phải xuất hiện trong bảng lịch sử

  @regression @p2
  Kịch bản: Giao dịch vượt hạn mức $1,000 chuyển sang trạng thái Chờ Phê Duyệt
    Khi người dùng mở biểu mẫu chuyển tiền
    Và nhập số tài khoản nhận là "9988776655"
    Và nhập số tiền là "2500.00" USD
    Và nhấn nút "Xác nhận chuyển tiền"
    Thì hệ thống phải thông báo "Giao dịch đã được gửi tới Approver phê duyệt"
    Và trạng thái của yêu cầu chuyển tiền là "PENDING_APPROVAL"
    Và số dư tài khoản nguồn tạm thời chưa bị khấu trừ

  @negative @bva @p1
  Kịch bản: Từ chối chuyển khoản với số tiền bằng $0.00 (Biên dưới bất hợp lệ)
    Khi người dùng mở biểu mẫu chuyển tiền
    Và nhập số tiền là "0.00" USD
    Và nhấn nút "Xác nhận chuyển tiền"
    Thì hệ thống phải hiển thị thông báo lỗi "Số tiền chuyển tối thiểu là $1.00"
    Và số dư tài khoản vẫn giữ nguyên là "2000.00" USD
