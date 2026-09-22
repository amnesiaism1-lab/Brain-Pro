# Phương Pháp Cây Phân Loại (Classification Tree Method - CTM)

> **Cơ sở tiêu chuẩn**: ISTQB CTAL-TA (Test Analyst) & CTFL 4.0  
> **Nghiệp vụ**: Thiết kế tổ hợp kịch bản Chuyển Tiền & Phân Quyền Hạn Mức

---

## 1. Cấu Trúc Cây Phân Loại (Classification Tree Hierarchy)

```text
Chuyển Khoản & Phân Quyền
├── 1. Vai Trò Người Dùng (User Role)
│   ├── [C1.1] Admin (Toàn quyền)
│   ├── [C1.2] Approver (Người phê duyệt)
│   ├── [C1.3] Operator (Người khởi tạo)
│   └── [C1.4] Suspended User (Tài khoản bị khóa)
│
├── 2. Số Dư Tài Khoản Nguồn (Account Balance)
│   ├── [C2.1] Không đủ số dư (Balance < Amount)
│   ├── [C2.2] Vừa đủ số dư (Balance == Amount)
│   └── [C2.3] Dư dả (Balance > Amount)
│
├── 3. Hạn Mức Giao Dịch (Transfer Amount Range)
│   ├── [C3.1] Dưới biên hợp lệ ($0.00 hoặc âm) [Invalid]
│   ├── [C3.2] Hạn mức nhỏ (<= $1,000.00) [Tự động duyệt]
│   ├── [C3.3] Hạn mức lớn ($1,001.00 - $5,000.00) [Cần Approver]
│   └── [C3.4] Vượt hạn mức tối đa (> $5,000.00) [Invalid]
│
└── 4. Kênh Giao Dịch (Channel)
    ├── [C4.1] Web Portal
    └── [C4.2] Mobile App / API
```

---

## 2. Bảng Tổ Hợp Ca Kiểm Thử Tối Ưu (Combination Grid)

| Test Case ID | User Role | Account Balance | Amount Range | Channel | Kết Quả Kỳ Vọng (Oracle) |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **TC-CTM-01** | Admin (C1.1) | Dư dả (C2.3) | Lớn (C3.3) | Web (C4.1) | **Duyệt ngay lập tức (A3)** |
| **TC-CTM-02** | Operator (C1.3) | Dư dả (C2.3) | Lớn (C3.3) | Web (C4.1) | **Chuyển sang "Chờ duyệt" (A4)** |
| **TC-CTM-03** | Operator (C1.3) | Không đủ (C2.1)| Nhỏ (C3.2) | Web (C4.1) | **Báo lỗi thiếu số dư (A1)** |
| **TC-CTM-04** | Operator (C1.3) | Dư dả (C2.3) | Vượt max (C3.4)| Web (C4.1) | **Báo lỗi vượt hạn mức (A2)** |
| **TC-CTM-05** | Suspended (C1.4)| - | - | Web (C4.1) | **Chặn ngay tại cổng Login** |
