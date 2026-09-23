# 🧠 Brain-Pro: Nền Tảng Rèn Luyện Nhận Thức & Đọc Nhanh Tương Thích

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?logo=nestjs)](https://nestjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://brain-pro-psi.vercel.app/)

> **Brain-Pro** là nền tảng rèn luyện nhận thức đa chiều và phát triển kỹ năng đọc nhanh được xây dựng theo kiến trúc **Cognitive Relationship Engine**: coi quan hệ nhận thức (Cognitive Relation) là đơn vị cốt lõi của quá trình rèn luyện, với 19 bài tập tương tác, hệ thống telemetry per-trial, điều chỉnh độ khó thích ứng (DDA), và bản đồ mạng lưới nhận thức 12 nút (Brain Map).

---

## 🌟 Tính Năng Nổi Bật

### 1. Hệ Thống 19 Bài Tập Huấn Luyện Nhận Thức Chuyên Sâu

Hệ thống bao gồm 19 bài tập chuẩn hóa, hỗ trợ 12 cấp độ thích ứng linh hoạt:

1. **Bảng Schulte (`schulte-table`)**: Tìm số tuần tự từ 1 đến N trên lưới ngẫu nhiên (3x3 đến 9x9), hỗ trợ các chế độ đếm ngược (Reverse), Bảng Đỏ-Đen Gorbov, Bảng Xoay trục và Lưới số ẩn hiện.
2. **Đảo Ngữ (`anagram`)**: Tái tổ hợp các chữ cái xáo trộn thành từ vựng và cụm từ tiếng Việt có nghĩa.
3. **Tìm Chữ Cái (`find-letter`)**: Lọc chữ mục tiêu trong ma trận chữ gây nhiễu cùng nét (Distractor Suppression).
4. **Tìm Số (`find-number`)**: So khớp số mục tiêu và giải quyết quy tắc số học mục tiêu (`MATH_TARGET`) ở cấp độ cao.
5. **Chẵn/Lẻ (`even-odd`)**: Phân loại số chẵn hoặc số lẻ dưới áp lực tốc độ cao, hỗ trợ chuyển đổi luật và đảo viền quy tắc.
6. **Nhớ Dãy Số (`digit-span`)**: Đo lường và mở rộng dung lượng bộ nhớ làm việc theo chuỗi xuôi và chuỗi nhớ ngược (Reverse Recall).
7. **Chữ Chạy RSVP (`rsvp-speed-reader`)**: Trình chiếu từ nối tiếp tốc độ cao tại điểm cố định thị giác ORP (Optimal Recognition Point), tốc độ từ 200 đến 1200 WPM.
8. **Tìm Từ Trong Ma Trận (`word-search`)**: Quét từ vựng theo nhiều phương hướng trong ma trận chữ cái.
9. **So Sánh Từ (`twin-words`)**: Đối chiếu phát hiện sai lệch hình thái học và ngữ nghĩa giữa hai từ ở tốc độ chớp nhoáng.
10. **Tầm Nhìn Ngoại Vi (`peripheral-vision`)**: Mở rộng góc nhìn hai biên trong khi ánh mắt khóa chặt vào tâm ngắm.
11. **Điểm Xanh Cố Định (`green-dot`)**: Bài tập khóa điểm nhìn trung tâm nhằm kích hoạt trạng thái tập trung mềm (Soft Focus) và mở rộng vùng tiếp nhận.
12. **Chuỗi Từ (`word-chunking`)**: Đọc theo từng cụm từ ngữ nghĩa nhấp nháy tuần tự thay vì dừng mắt ở từng từ đơn lẻ.
13. **Đánh Giá Tốc Độ Đọc (`reading-assessment`)**: Đọc văn bản thực tế kết hợp trắc nghiệm đọc hiểu đo lường Tốc độ đọc hiệu dụng (Effective WPM).
14. **Tăng Tốc Độ Đọc (`reading-pacer`)**: Áp dụng định dạng dẫn hướng nhịp đọc và thanh nhịp điệu Pacer để ổn định nhịp quét mắt.
15. **Quét Văn Bản (`text-scanning`)**: Lọc dữ liệu mục tiêu trong văn bản tài liệu thực chiến dưới áp lực thời gian.
16. **Lật Thẻ Trí Nhớ 3D (`card-flip`)**: Rèn luyện trí nhớ không gian và bảng phác thảo thị giác với các cặp thẻ biểu tượng 3D.
17. **Đấu Màu Nhận Thức (`stroop-clash`)**: Hiệu ứng Stroop ức chế phản xạ đọc chữ và nhận dạng chính xác màu mực.
18. **Nhớ Khối Không Gian (`spatial-memory`)**: Thử nghiệm khối Corsi (Corsi Block-Tapping) ghi nhớ và tái hiện chuỗi ô sáng trong không gian.
19. **Theo Dõi Mắt Nhanh (`saccade-tracker`)**: Rèn luyện phản xạ di chuyển điểm nhìn chính xác (Voluntary Saccades) theo mục tiêu chuyển động.

---

### 2. Bản Đồ Mạng Lưới Nhận Thức (12 Cognitive Relations)

Thay vì chỉ đánh giá điểm số bề mặt của từng bài tập đơn lẻ, Brain-Pro liên kết các bài tập thông qua **12 quan hệ nhận thức gốc**:

| Quan Hệ Nhận Thức | Định Nghĩa Vận Hành | Bài Tập Đại Diện |
|---|---|---|
| `TARGET_POSITION` | Ánh xạ mục tiêu tới tọa độ không gian | Schulte Table, Spatial Memory |
| `ORDER_SEQUENCE` | Nhận diện và thiết lập thứ tự hợp lệ | Schulte Table, Digit Span |
| `IDENTITY_MATCH` | Kiểm tra sự trùng khớp về mặt nhận diện | Twin Words, Card Flip |
| `SIMILARITY_DIFF` | So sánh đặc trưng tương đồng và sai khác | Find Letter, Twin Words |
| `TARGET_DISTRACTOR` | Tiếp nhận tín hiệu mục tiêu, ức chế nhiễu | Find Letter, Find Number |
| `RULE_ACTION` | Phản hồi hành động dựa trên quy tắc kích thích | Even/Odd, Stroop Clash |
| `INHIBITION` | Ức chế phản xạ thói quen trước quy tắc mới | Stroop Clash, Even/Odd Invert |
| `PART_WHOLE` | Nhận diện mối liên kết giữa thành phần và chỉnh thể | Anagram, Word Chunking |
| `FOCUS_FIELD` | Giữ điểm nhìn trung tâm, tiếp nhận thông tin ngoại vi | Green Dot, Peripheral Vision |
| `SPATIAL_TRANSFORM` | Biến đổi hình học và tái cấu trúc không gian | Spatial Memory, Rotating Schulte |
| `TEMPORAL_PREDICT` | Tiên đoán thông tin nối tiếp theo dòng thời gian | RSVP Reader, Reading Pacer |
| `CONTEXT_MEANING` | Nắm bắt ngữ nghĩa trong ngữ cảnh rộng | Reading Assessment, Word Chunking |

---

## 🏗️ Cấu Trúc Monorepo

```
Brain-Pro/
├── frontend/             # Ứng dụng React 18 + Vite + TailwindCSS + Zustand + Lucide
│   ├── src/
│   │   ├── components/   # UI Controls, 19 Game Components, Brain Map, Debrief Modal
│   │   ├── hooks/        # useRelationSession, useOfflineSync
│   │   ├── store/        # Zustand Store (dual mastery: exercises & relations)
│   │   └── types/
│   └── vite.config.ts
├── backend/              # NestJS v11 API Engine + Supabase PostgreSQL Persistence
│   ├── src/
│   │   ├── database/     # DataStoreService (PostgreSQL + In-memory fallback)
│   │   ├── modules/      # Exercises, Attempts, Analytics, Workouts, Reading, Reminders
│   │   └── main.ts       # Standalone & Express Adapter for Vercel
│   ├── api/index.js      # Serverless Function Entrypoint cho Vercel Lambda
│   └── tsconfig.json
├── shared/               # Gói TypeScript dùng chung (@brain-exercises/shared)
│   ├── src/
│   │   ├── cognition/    # 12 Relations, Exercise Map, Evidence Schema, Mastery EMA, DDA
│   │   ├── constants/    # 19 Exercises Metadata, Level Configs, Synergies
│   │   ├── types/        # TypeScript Interfaces & DTOs
│   │   └── utils/        # Scoring Algorithms, Level Recommender
│   └── dist/             # Compiled artifacts dùng chung
├── qa-automation/        # Bộ kiểm thử tự động E2E Playwright
├── vercel.json           # Cấu hình Vercel Monorepo Serverless
└── package.json          # Root Monorepo scripts
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Local

### Yêu Cầu Hệ Thống
- **Node.js**: >= 18.x (khuyến nghị Node 20 LTS hoặc 22 LTS)
- **npm**: >= 9.x
- **PostgreSQL / Supabase**: Đã tích hợp sẵn sàng kết nối pooler Supabase

### 1. Cài đặt dependencies:
```bash
npm install --legacy-peer-deps
```

### 2. Biên dịch gói chia sẻ `shared/`:
```bash
npm run build:shared
```

### 3. Cấu hình biến môi trường:
Tạo file `.env` tại thư mục gốc với các thông số:
```env
DATABASE_URL=postgresql://postgres.ogsemefehnlaedkwigyl:5g*Q%3FhqT9N6BU7x@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
DB_HOST=aws-0-ap-northeast-1.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.ogsemefehnlaedkwigyl
DB_PASSWORD=5g*Q?hqT9N6BU7x
DB_NAME=postgres
DB_SSL=true
JWT_SECRET=brain-exercises-pro-secret-2026
PORT=3001
NODE_ENV=development
```

### 4. Khởi chạy dự án:
```bash
# Terminal 1: Backend API (Port 3001)
npm run start:backend

# Terminal 2: Frontend App (Port 5173)
npm run start:frontend
```

---

## 🌐 Triển Khai Vercel

Ứng dụng được cấu hình triển khai liên tục qua Vercel:
- **Production URL**: [https://brain-pro-psi.vercel.app/](https://brain-pro-psi.vercel.app/)
- **Supabase Dashboard**: [https://supabase.com/dashboard/project/ogsemefehnlaedkwigyl](https://supabase.com/dashboard/project/ogsemefehnlaedkwigyl)

---

## 📄 Bản Quyền & Giấy Phép

Phát triển bởi **amnesiaism1-lab**. Giấy phép MIT License.
Mọi đóng góp, báo lỗi (issue) và pull request đều được hoan nghênh nồng nhiệt!
