# CẨM NANG TRIỂN KHAI HỆ THỐNG BRAIN EXERCISES PRO (VERCEL & PRODUCTION)

Tài liệu này hướng dẫn chi tiết quy trình đóng gói, kiểm thử và triển khai nền tảng **Brain Exercises Pro** lên **Vercel** cũng như thiết lập cơ sở dữ liệu PostgreSQL (Neon, Supabase, Vercel Postgres) và chạy trên môi trường cục bộ.

---

## 1. KIẾN TRÚC TRIỂN KHAI VERCEL (MULTI-SERVICE MONOREPO)

Dự án áp dụng cấu trúc Monorepo phân tách rõ ràng 3 tầng:
- **`frontend/`**: Ứng dụng Single Page Application (SPA) xây dựng bằng React 18, Vite và TailwindCSS, được biên dịch thành các tài nguyên tĩnh siêu nhanh.
- **`backend/`**: NestJS v11 API Engine đóng gói dưới dạng Serverless Function chạy tại `backend/api/index.js` thông qua bộ điều hợp Express tích hợp NFT (Node File Trace) resolver.
- **`shared/`**: Thư viện dùng chung chứa Types, DTOs, Enums và hằng số cấu hình.

---

## 2. QUY TRÌNH TRIỂN KHAI TỰ ĐỘNG LÊN VERCEL

### Bước 1: Chuẩn bị mã nguồn trên GitHub
Khởi tạo git và push mã nguồn lên repository cá nhân trên GitHub:
```bash
git init
git add .
git commit -m "feat: initial brain exercises pro fullstack monorepo"
git branch -M main
git remote add origin https://github.com/<your-username>/brain-exercises-pro.git
git push -u origin main
```

### Bước 2: Nhập dự án vào Vercel (Import Project)
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com).
2. Nhấp vào **"Add New..."** -> **"Project"**.
3. Chọn kho lưu trữ `brain-exercises-pro` từ danh sách GitHub repositories.

### Bước 3: Cấu hình Build & Output Settings trên Vercel
Vercel sẽ tự động đọc file [vercel.json](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/vercel.json) ở thư mục gốc:
- **Framework Preset**: Other (hoặc Vite)
- **Root Directory**: `./` (để trống hoặc đặt là `.`)
- **Build Command**: `npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install --legacy-peer-deps`

### Bước 4: Thiết lập Biến Môi Trường (Environment Variables) trên Vercel
Thêm các biến môi trường sau trong mục **Settings > Environment Variables**:

| Tên biến (Key) | Giá trị mẫu | Mô tả |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:password@ep-cool-fog-123.ap-southeast-1.aws.neon.tech/brain_db?sslmode=require` | Chuỗi kết nối PostgreSQL (Neon, Supabase hoặc Vercel Postgres). Nếu để trống, backend sẽ tự động kích hoạt chế độ In-Memory an toàn không bị sập. |
| `JWT_SECRET` | `super-secret-brain-jwt-token-key-2026` | Khóa bí mật ký JWT Token |
| `NODE_ENV` | `production` | Môi trường triển khai |

---

## 3. CƠ CHẾ RESILIENCE & FALLBACK AN TOÀN TRÊN VERCEL

1. **Cold Start & Module Resolution**:
   Bộ điều hợp `backend/api/index.js` tự động bổ sung đường dẫn `node_modules` vào `Module.globalPaths` và cài đặt hook `_resolveFilename` đặc biệt, khắc phục hoàn toàn lỗi `MODULE_NOT_FOUND` thường gặp khi deploy NestJS Monorepo lên môi trường Vercel AWS Lambda.

2. **In-Memory Graceful Fallback**:
   Nếu cơ sở dữ liệu PostgreSQL chưa kịp thiết lập hoặc gặp sự cố mạng, dịch vụ TypeORM tự động chuyển sang chế độ lưu trữ trong bộ nhớ tạm (In-Memory Repository), trả về mã 200 OK kèm đầy đủ dữ liệu mẫu của 15 bài tập, đảm bảo người dùng truy cập web luôn mượt mà.

---

## 4. HƯỚNG DẪN CHẠY DỰ ÁN Ở MÔI TRƯỜNG LOCAL DEVELOPMENT

### 1. Cài đặt toàn bộ thư viện:
```bash
npm install --legacy-peer-deps
```

### 2. Biên dịch thư viện dùng chung `shared/`:
```bash
npm run build:shared
```

### 3. Chạy đồng thời cả Frontend và Backend:
Mở 2 cửa sổ terminal:
- **Terminal 1 (Backend NestJS)**:
  ```bash
  npm run start:backend
  ```
  API Server sẽ khởi chạy tại: `http://localhost:3001` (Swagger Docs tại `http://localhost:3001/api/docs`).

- **Terminal 2 (Frontend React + Vite)**:
  ```bash
  npm run start:frontend
  ```
  Giao diện Web sẽ chạy tại: `http://localhost:5173`.
