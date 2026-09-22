# 🧠 Brain-Pro: Nền Tảng Luyện Não & Tăng Tốc Đọc Đỉnh Cao

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs)](https://nestjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/)

> **Brain-Pro** là hệ thống huấn luyện nhận thức (Cognitive Training) và tăng tốc độ đọc (Speed Reading) toàn diện với kiến trúc Monorepo phân lớp, hỗ trợ 15 bài tập tương tác, hệ thống đo lường nhận thức đa chiều, phân tích đồ thị quan hệ thực thể (Entity Relationship Graph) và cơ chế tự thích ứng độ khó (Adaptive Progression).

---

## 🌟 Tính Năng Nổi Bật

### 1. Hệ Thống 15 Bài Tập Huấn Luyện Nhận Thức Chuyên Sâu
- **Bảng Schulte (Schulte Table)**: 6 chế độ bao gồm Cơ bản, Đếm lùi, Bảng chữ cái, Ẩn hiện (Fading), Tự xoay (Rotating), và **Gorbov Đỏ-Đen (25 Đỏ tăng dần xen kẽ 24 Đen giảm dần)**.
- **Thử thách Stroop (Stroop Challenge)**: Ức chế phản xạ tự động giữa màu sắc và ngữ nghĩa từ vựng.
- **Đọc RSVP (Rapid Serial Visual Presentation)**: Đọc từng từ hoặc nhóm từ tốc độ cao từ 200 - 1500 WPM có điểm cố định mắt ORP (Optimal Recognition Point).
- **Thị giác Ngoại biên (Peripheral Vision Expansion)**: Mở rộng trường thị giác ngang & dọc bằng các bài tập mở rộng góc nhìn.
- **Triệt tiêu Tiếng nói thầm (Subvocalization Suppression)**: Luyện gõ nhịp ngón tay hoặc đồng bộ ngữ âm để ngắt thói quen phát âm thầm khi đọc.
- **Trí nhớ N-Back (Dual N-Back Memory)**: Tăng dung lượng bộ nhớ làm việc (Working Memory) với âm thanh và vị trí.
- **Phân biệt Âm vị (Auditory Phoneme Discrimination)**: Rèn luyện khả năng xử lý thính giác tốc độ cao.
- **Chuyển động Mắt Saccade (Saccadic Eye Movement)**: Tăng tốc độ nhảy mắt chuẩn xác giữa các điểm neo chữ.
- **Tháp từ (Word Pyramid Expansion)**: Đọc mở rộng từ đỉnh tháp xuống chân tháp không đảo mắt.
- **Nhớ Dãy số (Digit Span Test)**: Kiểm tra và mở rộng giới hạn trí nhớ tức thời.
- **Tìm kiếm Thị giác (Visual Search Task)**: Lọc tín hiệu mục tiêu trong môi trường nhiễu loạn cao.
- **Ma trận Không gian (Mental Rotation & Spatial Grid)**: Rèn luyện năng lực định hướng và xoay hình học không gian.
- **Thời gian Phản xạ (Simple & Choice Reaction Time)**: Đo mili-giây phản xạ thần kinh thị giác.
- **Theo dõi Đa mục tiêu (Multiple Object Tracking - MOT)**: Theo dõi chuyển động độc lập của 3 - 6 mục tiêu đồng thời.
- **Lập kế hoạch Tháp Hà Nội (Tower of Hanoi)**: Huấn luyện năng lực tư duy đệ quy và giải quyết vấn đề.

### 2. Kiến Trúc Thực Thể Quan Hệ (Entity Architecture)
Mạng lưới quan hệ chuẩn hóa 3NF liên kết chặt chẽ:
- **`User`** ↔ **`UserProfile`**: Chỉ số nhận thức toàn diện, Streak, Level, Rank.
- **`Exercise`** ↔ **`CognitiveSkill`**: Mapped đa-đa (Many-to-Many) tới 6 năng lực não bộ cốt lõi: *Tập trung, Tốc độ xử lý, Trí nhớ làm việc, Ức chế nhận thức, Kiểm soát vận nhãn, Năng lực không gian*.
- **`ExerciseLevel`**: 12 cấp độ thích ứng linh hoạt theo ELO và đường cong học tập.
- **`UserExerciseProgress`**: Lưu vết Best Score, Accuracy, Mastery Score, Level hiện tại.
- **`ExerciseAttempt`**: Bản ghi chi tiết từng lần chơi (thời gian mili-giây, sai sót, streak, nhịp tim ảo, heatmaps).
- **`WorkoutRoutine`** & **`RoutineStep`**: Các bài tập liên hoàn theo chủ đề (ví dụ: *Khởi động buổi sáng 10 phút*, *Luyện đọc sách thần tốc*, *Tập trung sâu trước giờ làm*).
- **`Milestone`** & **`UserMilestone`**: Hệ thống huy hiệu thành tựu và phần thưởng EXP gamification.

---

## 🏗️ Cấu Trúc Monorepo

```
Brain-Pro/
├── frontend/             # Ứng dụng React 18 + Vite + TailwindCSS + Zustand + Lucide
│   ├── src/
│   │   ├── components/   # UI Controls, Game Containers, HUD, Modals
│   │   ├── store/        # Zustand Global State Management
│   │   └── types/
│   └── vite.config.ts
├── backend/              # NestJS v11 API Engine + TypeORM + Serverless Adapter
│   ├── src/
│   │   ├── auth/         # JWT Authentication, Guards & Passport Strategies
│   │   ├── entities/     # TypeORM Entities cho PostgreSQL
│   │   ├── exercises/    # API Controllers & Services cho 15 bài tập
│   │   └── progress/     # API thống kê, phân tích chỉ số nhận thức
│   ├── api/index.js      # Serverless Function Entrypoint cho Vercel Lambda
│   └── tsconfig.json
├── shared/               # TypeScript Type Definitions, DTOs & Constants
│   ├── src/
│   │   ├── types/
│   │   └── utils/        # Schulte generation, Scoring Algorithms, RSVP parsers
│   └── dist/             # Compiled artifacts dùng chung
├── qa-automation/        # Bộ kiểm thử tự động E2E Playwright
├── vercel.json           # Cấu hình đa dịch vụ Vercel Monorepo Serverless
├── package.json          # Root Monorepo scripts
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Local

### Yêu Cầu Hệ Thống
- **Node.js**: >= 18.x (khuyến nghị Node 20 LTS)
- **npm**: >= 9.x
- **PostgreSQL**: Supabase, Neon hoặc Local Postgres (tùy chọn; backend có cơ chế In-Memory Fallback tự động khi chưa có DB)

### 1. Cài đặt toàn bộ dependencies:
```bash
npm install --legacy-peer-deps
```

### 2. Biên dịch gói dùng chung `shared/`:
```bash
npm run build:shared
```

### 3. Cấu hình biến môi trường:
Sao chép `.env.example` thành `.env`:
```bash
cp .env.example .env
```
Cập nhật chuỗi kết nối `DATABASE_URL` và `JWT_SECRET` nếu bạn kết nối Supabase hoặc cơ sở dữ liệu riêng.

### 4. Khởi chạy đồng thời:
```bash
# Terminal 1: Backend NestJS API (Port 3001)
npm run start:backend

# Terminal 2: Frontend Web App (Port 5173)
npm run start:frontend
```
- **Web App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001`
- **Swagger API Docs**: `http://localhost:3001/api/docs`

---

## 🌐 Hướng Dẫn Triển Khai Lên Vercel

Dự án đã được cấu hình sẵn sàng với [vercel.json](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/vercel.json) để deploy fullstack monorepo:

1. **Đăng nhập vào [Vercel Dashboard](https://vercel.com)**.
2. Chọn **"Add New..."** -> **"Project"** và import repository `amnesiaism1-lab/Brain-Pro`.
3. Cấu hình Build & Output Settings:
   - **Framework Preset**: `Other` hoặc `Vite`
   - **Root Directory**: `./` (để trống)
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install --legacy-peer-deps`
4. **Environment Variables**:
   - `DATABASE_URL`: Chuỗi kết nối PostgreSQL (Supabase / Neon)
   - `JWT_SECRET`: Chuỗi khóa bảo mật token JWT
   - `NODE_ENV`: `production`
5. Nhấp **"Deploy"** và trải nghiệm!

---

## 📊 Ma Trận Đóng Góp Năng Lực Nhận Thức (Cognitive Matrix)

| Bài Tập | Tập Trung Chú Ý | Tốc Độ Xử Lý | Trí Nhớ Làm Việc | Ức Chế Phản Xạ | Kiểm Soát Vận Nhãn | Tư Duy Không Gian |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Schulte Table / Gorbov** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐ |
| **Stroop Test** | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐ | ⚪ |
| **RSVP Speed Reading** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⚪ |
| **Dual N-Back** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐ | ⚪ | ⭐⭐ |
| **Visual Search** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐ | ⭐⭐⭐ | ⭐ |
| **Mental Rotation** | ⭐⭐ | ⭐ | ⭐⭐ | ⚪ | ⭐ | ⭐⭐⭐ |

---

## 📄 Bản Quyền & Giấy Phép

Phát triển bởi **amnesiaism1-lab**. Giấy phép MIT License.
Mọi đóng góp, báo lỗi (issue) và pull request đều được hoan nghênh nồng nhiệt!
