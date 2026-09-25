# 🧠 BÁO CÁO PHÂN TÍCH TOÀN DIỆN DỰ ÁN BRAIN-PRO (VERSION 1.0)
> **Tài liệu đặc tả kiến trúc, công nghệ, API, cơ sở dữ liệu và 25 bài tập nhận thức**  
> *Dành cho việc cung cấp ngữ cảnh hoàn chỉnh (Context Injection) để phân tích, đánh giá kiến trúc và tiếp tục mở rộng phát triển.*

---

## 📑 MỤC LỤC
1. [Tổng Quan Dự Án & Sứ Mệnh](#1-tổng-quan-dự-án--sứ-mệnh)
2. [Kiến Trúc Tổng Thể & Tech Stack](#2-kiến-trúc-tổng-thể--tech-stack)
3. [Phân Tích Chi Tiết Backend (NestJS 11 + Serverless)](#3-phân-tích-chi-tiết-backend-nestjs-11--serverless)
4. [Đặc Tả Đầy Đủ API (API Specification)](#4-đặc-tả-đầy-đủ-api-api-specification)
5. [Cơ Sở Dữ Liệu & Lược Đồ Thực Thể (Database & Entity Models)](#5-cơ-sở-dữ-liệu--lược-đồ-thực-thể-database--entity-models)
6. [Phân Tích Chi Tiết Frontend (React 18 + Vite + Zustand)](#6-phân-tích-chi-tiết-frontend-react-18--vite--zustand)
7. [Danh Mục 25 Bài Tập Nhận Thức & Đọc Nhanh](#7-danh-mục-25-bài-tập-nhận-thức--đọc-nhanh)
8. [Hệ Thống 10 Tầng Cấp Vô Cực (10 Infinity Tiers: ∞-I đến ∞-X)](#8-hệ-thống-10-tầng-cấp-vô-cực-10-infinity-tiers--i-đến--x)
9. [Các Phân Hệ Chuyên Sâu Độc Đáo](#9-các-phân-hệ-chuyên-sâu-độc-đáo)
   - 9.1. [Phân Hệ Âm Thanh & Nhạc Lý (Auditory Engine & Music Theory)](#91-phân-hệ-âm-thanh--nhạc-lý-auditory-engine--music-theory)
   - 9.2. [Phân Hệ Đọc Nhanh & Trình Quản Lý Nguồn Đọc](#92-phân-hệ-đọc-nhanh--trình-quản-lý-nguồn-đọc)
   - 9.3. [Kiến Trúc Nhận Thức Tương Quan (12 Cognitive Relations & Brain Map)](#93-kiến-trúc-nhận-thức-tương-quan-12-cognitive-relations--brain-map)
   - 9.4. [Hệ Thống Luyện Tập Theo Lộ Trình (Workouts & Synergies)](#94-hệ-thống-luyện-tập-theo-lộ-trình-workouts--synergies)
10. [Cấu Hình Hệ Thống & Biến Môi Trường (Configuration & Environment)](#10-cấu-hình-hệ-thống--biến-môi-trường-configuration--environment)
11. [Quy Trình Build, Triển Khai & Kiểm Thử](#11-quy-trình-build-triển-khai--kiểm-thử)
12. [Đánh Giá Hiện Trạng & Lộ Trình Phát Triển Tương Lai](#12-đánh-giá-hiện-trạng--lộ-trình-phát-triển-tương-lai)

---

## 1. TỔNG QUAN DỰ ÁN & SỨ MỆNH

- **Tên dự án**: **Brain-Pro** (Adaptive Speed Reading & Cognitive Brain Training Platform).
- **Mã nguồn**: Cấu trúc Monorepo TypeScript gồm 3 gói: `shared/`, `backend/`, `frontend/`.
- **Mục tiêu**:
  - Xây dựng một nền tảng rèn luyện não bộ toàn diện chuẩn khoa học, kết hợp giữa **Kỹ thuật Đọc Siêu Tốc (Speed Reading)**, **Nhận Thức Thị Giác / Chú Ý / Trí Nhớ Làm Việc (Cognitive Faculties)**, và **Cảm Âm / Trí Nhớ Thính Giác (Auditory Memory & Ear Training)**.
  - Vượt qua các ứng dụng rèn luyện não bộ truyền thống (vốn chỉ chấm điểm bài thi độc lập) bằng cách triển khai **Kiến trúc Quan hệ Nhận thức (Cognitive Relational Architecture)**: Ánh xạ mọi tương tác người dùng vào 12 Quan hệ Nhận thức cốt lõi (`RelationId`), lưu vết bằng chứng chi tiết từng lượt thử (`trial-level evidence`), làm mượt độ thông thạo bằng thuật toán EMA ($\alpha = 0.08$), và điều chỉnh độ khó thích ứng (DDA).
  - Cung cấp **25 bài tập tương tác hoàn chỉnh**, hỗ trợ dải cấp độ từ **Cấp 1 đến Cấp 22** (trong đó từ Cấp 13 đến Cấp 22 là **10 Cấp Vô Cực $\infty$-I đến $\infty$-X** tích hợp dữ liệu ngoại vi thời gian thực từ các API mở toàn cầu).

---

## 2. KIẾN TRÚC TỔNG THỂ & TECH STACK

### 2.1. Cấu trúc thư mục Monorepo

```
Brain-Pro/
├── shared/                       # Thư viện dùng chung (@brain-exercises/shared)
│   ├── src/
│   │   ├── types/                # Type definitions, interfaces, DTOs
│   │   ├── constants/            # Metadata 25 bài tập, level configs, workout routines, synergies
│   │   │   ├── index.ts          # Metadata chính (118KB)
│   │   │   └── infinityConfigs.ts# Cấu hình 10 Tầng Infinity (94KB)
│   │   ├── cognition/            # 12 Relations, Evidence schema, Mastery EMA, DDA policy, Brain Graph
│   │   └── utils/                # Thuật toán tính WPM, Schulte grid, Anagram, Word Search, DDA recommender
│   └── package.json
│
├── backend/                      # API Backend (NestJS 11 + Express Adapter)
│   ├── src/
│   │   ├── app.module.ts         # Module gốc đăng ký controller, providers, JWT
│   │   ├── main.ts               # Khởi chạy Express/NestJS, CORS, Helmet, Swagger, Vercel handler
│   │   ├── database/
│   │   │   ├── data-store.service.ts # Hybrid In-Memory & Supabase PostgreSQL pool (19KB)
│   │   │   ├── init-supabase.js      # Script tạo 12 bảng cơ sở dữ liệu
│   │   │   ├── migrate-cognitive-tables.js # Script tạo bảng telemetry nhận thức
│   │   │   └── entities/             # TypeORM entities dự phòng
│   │   └── modules/
│   │       ├── auth/             # Google OAuth, JWT authentication, guest sync
│   │       ├── exercises/        # Metadata bài tập, stimuli, từ vựng
│   │       ├── attempts/         # Tiếp nhận kết quả bài chơi, telemetry rawMetricsJson
│   │       ├── workouts/         # Các gói bài tập theo thời gian (5m, 10m, 30m, 60m)
│   │       ├── reading-assessment/# Đọc hiểu, ngân hàng văn bản đọc, chấm Effective WPM
│   │       ├── analytics/        # Radar nhận thức, Brain Graph 12 nút, gợi ý chuỗi nhận thức
│   │       └── reminders/        # Lịch nhắc nhở luyện tập
│   ├── api/
│   │   └── index.js              # Serverless entrypoint đóng gói chạy trên Vercel Lambda
│   └── package.json
│
├── frontend/                     # Ứng dụng Web Single Page App (React 18 + Vite 6 + TailwindCSS)
│   ├── src/
│   │   ├── App.tsx               # Root component, router dạng state, modals, theme handler
│   │   ├── store/
│   │   │   └── useAppStore.ts    # Zustand Global Store (offline-first, localStorage, cloud sync)
│   │   ├── services/
│   │   │   ├── auditoryEngine.ts     # Synthesizer Web Audio API + Tone.js, 3D Spatial Panner, ADSR
│   │   │   ├── musicTheoryService.ts # Thư viện nhạc lý, tra cứu thang âm, hợp âm, tần số nốt
│   │   │   ├── midiService.ts        # Web MIDI API kết nối đàn Keyboard vật lý
│   │   │   ├── infinityApiService.ts # Tích hợp Dictionary, Datamuse, Wiki, NASA, Trivia + offline DB
│   │   │   └── readingContentService.ts# Quản lý nguồn văn bản đọc, import text/URL, Bionic formatting
│   │   ├── hooks/
│   │   │   ├── useMidiInput.ts       # Hook lắng nghe phím đàn MIDI thời gian thực
│   │   │   ├── useOfflineSync.ts     # Hook tự động đồng bộ telemetry lên Supabase khi online
│   │   │   └── useRelationSession.ts # Hook thu thập bằng chứng nhận thức per-trial
│   │   ├── components/
│   │   │   ├── games/            # 25 game components + ActiveGameContainer + GameResultModal
│   │   │   ├── cognition/        # BrainMap 12 nút, RelationDebriefModal, FocusOverlay
│   │   │   ├── exercises/        # ExercisesListView, ExerciseDetailModal
│   │   │   ├── learn/            # 7 Music Theory modules + MusicTheoryView
│   │   │   ├── ui/               # PianoKeyboard, Oscilloscope, Spectrum, Metronome, SpatialRadar, MidiStatus
│   │   │   ├── layout/           # Header, Navbar
│   │   │   ├── home/             # HomeView (Dashboard, Daily Routine, Weekly Challenges, Quick Stats)
│   │   │   ├── profile/          # ProfileView (Cognitive Radar, Brain Graph, History, Account)
│   │   │   ├── settings/         # SettingsView (Sound, Theme, Auto-difficulty, Reminders)
│   │   │   ├── auth/             # AuthModal (Google One-Tap / OAuth, Fallback Guest Login)
│   │   │   └── common/           # ErrorBoundary, ReadingTextSourceModal
│   └── package.json
│
├── qa-automation/                # Bộ kiểm thử tự động E2E (Playwright)
├── vercel.json                   # Cấu hình định tuyến Monorepo Vercel Serverless
├── package.json                  # Root package quản lý scripts build monorepo
└── README.md                     # Tài liệu hướng dẫn sử dụng
```

### 2.2. Bảng tổng hợp Công nghệ (Tech Stack Table)

| Tầng (Layer) | Công nghệ chính | Mục đích / Vai trò |
|---|---|---|
| **Ngôn ngữ** | TypeScript 5.7+ | Đồng nhất Type-safe từ Shared, Backend đến Frontend |
| **Frontend Core** | React 18.3, Vite 6.2 | Render giao diện SPA cực nhanh, module bundler hiện đại |
| **Styling & UI** | TailwindCSS 3.4, Lucide React, Canvas API | Thiết kế giao diện Glassmorphism, Dark/Light mode linh hoạt |
| **State Management** | Zustand 5.0 | Store toàn cục, lưu trữ offline `localStorage`, phân phối state tối giản |
| **Audio Synthesis** | Web Audio API + Tone.js 15.0 | Tổng hợp âm thanh vật lý (Additive Synthesizer), 3D Spatial Audio, Piano Acoustics |
| **Hardware I/O** | Web MIDI API (`navigator.requestMIDIAccess`) | Kết nối bàn phím đàn Piano MIDI thật với độ nhạy lực gõ (velocity) |
| **Backend Framework** | NestJS 11.0, Express 4.x | Cấu trúc Module hướng đối tượng (IoC, DI), controller rõ ràng |
| **API Documentation** | Swagger / OpenAPI 3.0 (`@nestjs/swagger`) | Tự động tạo tài liệu API tại `/api/docs` |
| **Database** | PostgreSQL (Supabase Pooler), pg driver | Lưu trữ dữ liệu quan hệ, UUID, JSONB cho telemetry phức tạp |
| **Data Resilience** | Hybrid Fallback (In-Memory + Supabase) | Đảm bảo hệ thống hoạt động 100% ngay cả khi database ngắt kết nối |
| **Authentication** | Google OAuth 2.0 (`google-auth-library`), JWT | Đăng nhập tài khoản Google thống nhất, chuyển đổi dữ liệu từ Khách (Guest) |
| **Triển khai (Deploy)** | Vercel Serverless Functions | Monorepo đa dịch vụ (Frontend Static + Backend Node Serverless Lambda) |
| **Kiểm thử & Linter** | Oxlint, Playwright | Kiểm tra cú pháp siêu tốc và kiểm thử tự động tương tác |

---

## 3. PHÂN TÍCH CHI TIẾT BACKEND (NESTJS 11 + SERVERLESS)

### 3.1. Cơ chế Bootstrap & Serverless Compatibility
Tệp [`backend/src/main.ts`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/backend/src/main.ts) được thiết kế theo mô hình **kép** (Dual-mode):
1. **Chế độ Standalone Server** (Local development / Docker): Khi chạy độc lập trên cổng `3001` (hoặc biến `PORT`), khởi động Express HTTP server, nạp Swagger UI tại `/api/docs`.
2. **Chế độ Vercel Serverless Handler**: Xuất hàm `handler(req, res)` thông qua [`backend/api/index.js`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/backend/api/index.js). Hàm tự động định tuyến lại URL, chuẩn hóa body buffer và chuyển giao cho NestJS Express instance đã khởi tạo một lần (Singleton instance cache).

### 3.2. Middleware & Bảo Mật
- **Helmet**: Bảo vệ header HTTP, tắt Content-Security-Policy cứng nhắc để tránh xung đột tải nhạc/audio và Google Identity Services script.
- **Cookie Parser**: Đọc cookie phiên làm việc.
- **CORS Dynamic Resolver**: Cho phép gọi chéo domain từ frontend Vercel, localhost, hoặc custom domains với `credentials: true`.
- **ValidationPipe toàn cục**: Kích hoạt `whitelist: true`, `transform: true`, tự động chuyển đổi kiểu dữ liệu DTO.

### 3.3. Các Controller & Phân Hệ Chức Năng

#### 1. `AuthController` ([`auth.controller.ts`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/backend/src/modules/auth/auth.controller.ts))
- **`POST /api/auth/google`**: Tiếp nhận Google ID Token (`credential`), xác thực chữ ký qua Google API. Nếu người dùng trước đó đang chơi ở chế độ Khách (Guest), hệ thống sẽ **hợp nhất telemetry** (XP, Level, Streak) của khách vào tài nguyên Supabase của user thật.
- **`GET /api/auth/me`**: Trả về hồ sơ người dùng hiện tại dựa trên Bearer JWT Token.
- **`POST /api/auth/sync`**: Đồng bộ điểm số, cấp độ, chuỗi ngày luyện tập từ client lên đám mây.
- **`POST /api/auth/login`** & **`POST /api/auth/register`**: Endpoint fallback dạng email dành cho môi trường offline.

#### 2. `ExercisesController` ([`exercises.controller.ts`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/backend/src/modules/exercises/exercises.controller.ts))
- **`GET /api/exercises`**: Trả về danh sách metadata đầy đủ của 25 bài tập kèm danh mục, thời gian mặc định, căn cứ khoa học và cấu hình 12 cấp độ.
- **`GET /api/exercises/:slug`**: Lấy chi tiết bài tập theo định danh slug.
- **`GET /api/exercises/word-search/vocabulary`**: Tự động trích xuất tập từ vựng ngẫu nhiên tiếng Việt (3-8 ký tự) từ kho ngữ liệu đọc hiểu để làm đề bài cho game Tìm Từ.
- **`GET /api/exercises/peripheral-vision/stimuli`**: Trích xuất các kích thích thị giác 2-6 ký tự cho bài tập tầm nhìn ngoại vi.

#### 3. `AttemptsController` ([`attempts.controller.ts`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/backend/src/modules/attempts/attempts.controller.ts))
- **`POST /api/attempts`**: Lưu trữ kết quả hoàn thành bài chơi.
  - Kiểm tra tính hợp lệ của `rawMetricsJson` (giới hạn tối đa 50 sự kiện `relationEvents` mỗi lượt để chống spam payload).
  - Tính toán XP nhận được, cấp độ mới.
  - Gọi thuật toán DDA tính toán cấp độ khuyến nghị tiếp theo (`recommendedNextLevel`).
  - Ghi nhận `relation_evidence` vào Supabase và cập nhật `user_relation_mastery`.

#### 4. `WorkoutsController` ([`workouts.controller.ts`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/backend/src/modules/workouts/workouts.controller.ts))
- **`GET /api/workouts`**: Danh sách 4 quy trình luyện tập định sẵn:
  - `QUICK_5M`: Khởi động nhanh 5 phút (Schulte Table -> Word Chunking -> Stroop Clash).
  - `REGULAR_10M`: Tiêu chuẩn 10 phút (Saccade Tracker -> RSVP Reader -> Digit Span -> Peripheral Vision).
  - `OPTIMAL_30M`: Toàn diện 30 phút rèn luyện phối hợp thị giác, trí nhớ và phản xạ.
  - `INTENSIVE_60M`: Chuyên sâu 60 phút chinh phục các tầng nhận thức cao.
- **`GET /api/workouts/:code`**: Lấy chi tiết một quy trình.

#### 5. `ReadingAssessmentController` ([`reading-assessment.controller.ts`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/backend/src/modules/reading-assessment/reading-assessment.controller.ts))
- **`GET /api/reading-assessments/texts`**: Lấy danh sách các bài đọc mẫu có sẵn trong hệ thống (kèm độ khó, số lượng từ vựng).
- **`GET /api/reading-assessments/texts/:id`**: Chi tiết một bài đọc kèm bộ câu hỏi trắc nghiệm kiểm tra độ thấu hiểu.
- **`POST /api/reading-assessments/submit`**: Chấm điểm bài đánh giá:
  - Tính **Tốc độ đọc thô (Raw WPM)** = $(\text{WordCount} / \text{TimeSpentSec}) \times 60$.
  - Tính **Tỷ lệ thấu hiểu (Comprehension Score %)** dựa trên câu trả lời trắc nghiệm đúng.
  - Tính **Tốc độ đọc hiệu dụng (Effective WPM)** = $\text{RawWPM} \times (\text{ComprehensionRate} / 100)$.
  - Trả về lời nhận xét sư phạm và XP thưởng.

#### 6. `AnalyticsController` ([`analytics.controller.ts`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/backend/src/modules/analytics/analytics.controller.ts))
- **`GET /api/analytics/stats`**: Thống kê tổng XP, cấp độ, streak, tổng số phút đã luyện tập, điểm Ngũ giác Nhận thức (Cognitive Radar).
- **`GET /api/analytics/radar`**: 5 chỉ số năng lực: Đọc nhanh, Thị giác ngoại vi, Trí nhớ, Chú ý tập trung, Phản xạ.
- **`GET /api/analytics/brain-graph`**: Cấu trúc đồ thị mạng lưới nhận thức 12 nút (nút, cạnh liên kết, điểm thông thạo từng quan hệ).
- **`GET|POST /api/analytics/recommend-chain`**: Thuật toán tự động tìm ra quan hệ nhận thức đang là "nút thắt cổ chai" (bottleneck) có điểm accuracy thấp nhất và đề xuất chuỗi bài tập khắc phục tối ưu.

#### 7. `RemindersController` ([`reminders.controller.ts`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/backend/src/modules/reminders/reminders.controller.ts))
- **`GET /api/reminders`**: Danh sách lịch nhắc nhở luyện tập của người dùng.
- **`PUT /api/reminders`**: Cập nhật danh sách nhắc nhở (giờ thông báo, ngày trong tuần, trạng thái bật/tắt).

### 3.4. Lớp Dữ Liệu Lai (Hybrid Resilience DataStoreService)
Dịch vụ [`DataStoreService`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/backend/src/database/data-store.service.ts) là "trái tim" dữ liệu của backend:
- Khi khởi động (`onModuleInit`), dịch vụ kiểm tra chuỗi kết nối `DATABASE_URL` tới Supabase PostgreSQL.
- Nếu kết nối thành công: Mọi thao tác ghi kết quả attempt, telemetry evidence, upsert relation mastery sẽ được đẩy bất đồng bộ vào cơ sở dữ liệu Postgres.
- Nếu không có mạng hoặc chưa cấu hình Supabase: Dịch vụ tự động chuyển đổi sang **In-Memory Store** với đầy đủ dữ liệu mẫu (Seeded demo user, 25 exercises, 4 workouts, reading texts). Đảm bảo hệ sinh thái không bao giờ bị sập (Zero-downtime tolerance).

---

## 4. ĐẶC TẢ ĐẦY ĐỦ API (API SPECIFICATION)

Dưới đây là bảng tổng hợp toàn bộ 16 API endpoint của hệ thống:

| STT | Phương thức | Đường dẫn API | Mô tả chức năng | Yêu cầu Body / Params | Định dạng phản hồi chính |
|:---:|:---:|---|---|---|---|
| **1** | `POST` | `/api/auth/google` | Đăng nhập / Đăng ký qua Google OAuth | `{ credential, guestTelemetry? }` | `{ success: true, data: { token, user } }` |
| **2** | `GET` | `/api/auth/me` | Lấy thông tin user hiện tại | Header: `Bearer <token>` | `{ success: true, data: IUser }` |
| **3** | `POST` | `/api/auth/sync` | Đồng bộ telemetry XP/Level | `{ xp, level, streak, bestStreak }` | `{ success: true, data: IUser }` |
| **4** | `POST` | `/api/auth/login` | Đăng nhập fallback (email) | `{ email }` | `{ success: true, data: { token, user } }` |
| **5** | `POST` | `/api/auth/register` | Đăng ký fallback | `{ email, username }` | `{ success: true, data: { token, user } }` |
| **6** | `POST` | `/api/auth/logout` | Đăng xuất phiên làm việc | Không | `{ success: true, message: string }` |
| **7** | `GET` | `/api/exercises` | Lấy danh mục 25 bài tập | Không | `{ success: true, data: IExercise[] }` |
| **8** | `GET` | `/api/exercises/:slug` | Lấy chi tiết 1 bài tập | Param: `slug` | `{ success: true, data: IExercise }` |
| **9** | `GET` | `/api/exercises/word-search/vocabulary` | Sinh từ vựng cho Tìm Từ | Không | `{ success: true, data: string[] }` |
| **10**| `GET` | `/api/exercises/peripheral-vision/stimuli` | Sinh kích thích cho Tầm Nhìn | Không | `{ success: true, data: string[] }` |
| **11**| `POST` | `/api/attempts` | Lưu kết quả lượt chơi & telemetry | `IGameAttemptRequest` | `{ success: true, data: IGameAttemptResponse }` |
| **12**| `GET` | `/api/workouts` | Lấy 4 quy trình luyện tập | Không | `{ success: true, data: IWorkoutRoutine[] }` |
| **13**| `GET` | `/api/workouts/:code` | Lấy chi tiết 1 quy trình | Param: `code` | `{ success: true, data: IWorkoutRoutine }` |
| **14**| `GET` | `/api/reading-assessments/texts` | Danh sách văn bản đọc hiểu | Không | `{ success: true, data: IReadingText[] }` |
| **15**| `GET` | `/api/reading-assessments/texts/:id` | Chi tiết văn bản kèm câu hỏi | Param: `id` | `{ success: true, data: IReadingText }` |
| **16**| `POST` | `/api/reading-assessments/submit` | Nộp bài kiểm tra đọc hiểu | `IUserAssessmentRequest` | `{ success: true, data: IUserAssessmentResponse }` |
| **17**| `GET` | `/api/analytics/stats` | Thống kê tổng thể user | Không | `{ success: true, data: IUserStats }` |
| **18**| `GET` | `/api/analytics/radar` | Điểm ngũ giác nhận thức | Không | `{ success: true, data: ICognitiveRadar }` |
| **19**| `GET` | `/api/analytics/brain-graph` | Đồ thị mạng lưới 12 nút | Không | `{ success: true, data: { nodes, edges, overallIndex } }` |
| **20**| `GET` | `/api/analytics/recommend-chain` | Gợi ý chuỗi luyện tập nhận thức | Không | `{ success: true, data: { bottleneckRelation, recommendedChain } }` |
| **21**| `GET` | `/api/reminders` | Lấy danh sách lịch nhắc nhở | Không | `{ success: true, data: IUserReminder[] }` |
| **22**| `PUT` | `/api/reminders` | Cập nhật lịch nhắc nhở | `{ reminders: IUserReminder[] }` | `{ success: true, data: IUserReminder[] }` |

---

## 5. CƠ SỞ DỮ LIỆU & LƯỢC ĐỒ THỰC THỂ (DATABASE & ENTITY MODELS)

Cơ sở dữ liệu được xây dựng trên nền tảng **PostgreSQL (Supabase)**, sử dụng UUID khóa chính (`uuid_generate_v4()`). Hệ thống bao gồm 14 bảng quan hệ được chia thành 3 nhóm chức năng:

```mermaid
erDiagram
    users ||--o| user_profiles : "has"
    users ||--o{ game_attempts : "records"
    users ||--o{ user_assessments : "completes"
    users ||--o{ daily_streaks : "maintains"
    users ||--o{ user_reminders : "schedules"
    users ||--o{ relation_evidence : "produces"
    users ||--o{ user_relation_mastery : "develops"
    users ||--o{ user_cognitive_snapshots : "tracks"
    
    exercises ||--o{ exercise_level_configs : "defines"
    reading_texts ||--o{ reading_questions : "contains"
    reading_texts ||--o{ user_assessments : "evaluated_in"
    game_attempts ||--o{ relation_evidence : "details"
```

### 5.1. Nhóm Bảng Người Dùng & Quản Trị
1. **`users`**: Quản lý tài khoản (id, email, username, google_id, auth_provider, total_xp, current_level, current_streak, best_streak).
2. **`user_profiles`**: Cài đặt cá nhân (target_wpm, daily_goal_minutes, sound_enabled, theme, auto_difficulty_default, preferred_language).
3. **`daily_streaks`**: Lịch sử điểm danh và duy trì chuỗi ngày liên tiếp (streak_date, completed_exercises_count, total_xp_gained).
4. **`user_reminders`**: Lịch hẹn thông báo đẩy (reminder_time, days_of_week, is_enabled, label).

### 5.2. Nhóm Bảng Nội Dung & Cấu Hình Bài Tập
5. **`exercise_categories`**: Phân loại năng lực (SPEED_READING, PERIPHERAL_VISION, MEMORY, ATTENTION, REACTION, AUDITORY_MEMORY).
6. **`exercises`**: Danh mục 25 bài tập (slug, title, subtitle, scientific_basis, instructions, rules_summary, default_duration_sec).
7. **`exercise_level_configs`**: Cấu hình chi tiết từng level (1-22) của từng bài (level, grid_rows, grid_cols, time_limit_sec, speed_wpm, parameters_json).
8. **`workout_routines`**: Các bài tập liên hoàn theo thời gian (code, title, duration_minutes, items_json).
9. **`reading_texts`**: Kho văn bản đọc hiểu tiếng Việt & Anh (title, category, word_count, difficulty_level, content).
10. **`reading_questions`**: Bộ câu hỏi trắc nghiệm A-B-C-D đo lường độ hiểu sau khi đọc (question_text, option_a/b/c/d, correct_option).

### 5.3. Nhóm Bảng Telemetry & Quan Hệ Nhận Thức Chuyên Sâu
11. **`game_attempts`**: Lịch sử mỗi lần hoàn thành bài tập (exercise_slug, difficulty_level, score, accuracy_rate, time_spent_sec, effective_wpm, raw_metrics_json).
12. **`relation_evidence`**: Lưu vết chi tiết **từng lượt thử nhỏ (per-trial evidence)** trong game:
    - `attempt_id`: Khóa ngoại trỏ về lượt chơi.
    - `relation_id`: 1 trong 12 mã quan hệ nhận thức (`TARGET_POSITION`, `INHIBITION`, v.v.).
    - `trial_id`: Mã định danh lượt thử trong game.
    - `entities_json`: Trạng thái thực thể của câu hỏi.
    - `state_before` / `state_after`: Trạng thái trước và sau khi kích hoạt.
    - `response_ms`: Thời gian phản xạ mili-giây.
    - `correct`: Đúng hoặc sai.
13. **`user_relation_mastery`**: Bảng tổng kết độ thông thạo 12 quan hệ của người dùng:
    - `accuracy`: Tỷ lệ chính xác mượt hóa theo công thức EMA.
    - `stability`: Độ ổn định nhận thức (1 - variance ratio).
    - `current_tier`: Tầng thông thạo (Tier 1: Single, Tier 2: Noise, Tier 3: Dual/Switch, Tier 4: Transfer).
    - `transfer_score`: Khả năng vận dụng quan hệ trên nhiều bối cảnh bài tập khác nhau.
14. **`user_cognitive_snapshots`**: Ảnh chụp định kỳ chỉ số não bộ (speed_reading, peripheral_vision, memory, attention, reaction, overall_training_index).

---

## 6. PHÂN TÍCH CHI TIẾT FRONTEND (REACT 18 + VITE + ZUSTAND)

### 6.1. Quản Lý Trạng Thái Tập Trung (`useAppStore.ts`)
Frontend được quản lý toàn diện bởi một Zustand Store duy nhất ([`useAppStore.ts`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/store/useAppStore.ts)) kết hợp cơ chế lưu trữ bền vững:
- **Tự động lưu Offline (`localStorage`)**: Mọi tiến trình cấp độ (1-22), điểm số cao nhất, lịch sử bài tập, thiết lập âm thanh, dark mode, trạng thái nhắc nhở đều được lưu tức thời trên máy người dùng.
- **Tiến trình kép (Dual-Progression Model)**:
  1. *Tiến trình bề mặt*: Cấp độ từng bài tập (Level 1 đến Level 22) lưu trong `exerciseMasteries`.
  2. *Tiến trình nhận thức sâu*: Điểm thông thạo 12 quan hệ nhận thức lưu trong `relationshipMasteries`.
- **Hệ thống Combo & Hiệp Đồng (Exercise Synergies)**: Khi người chơi vừa hoàn thành bài tập A, hệ thống sẽ tự động phát hiện bài tập B có tính hiệp đồng (ví dụ: *Schulte Table* kết hợp *RSVP Speed Reader*) và kích hoạt huy hiệu thưởng thêm **+15% đến +25% XP**.
- **Bộ Thử Thách Tuần (Weekly Challenges)**: 3 thử thách xoay tua định kỳ trao thưởng hàng trăm XP khi hoàn thành.
- **Đồng Bộ Đám Mây Tự Động (`useOfflineSync`)**: Khi có kết nối mạng và người dùng đã đăng nhập Google, hook sẽ tự động gửi dữ liệu tích lũy lên Supabase.

### 6.2. Cấu Trúc Các View Giao Diện
1. **HomeView** ([`HomeView.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/home/HomeView.tsx)): Dashboard chính hiển thị Banner chào đón, Chuỗi ngày Streak, Nút chọn nhanh Lộ trình luyện tập (5p - 60p), Thẻ hiệp đồng nhận thức (Synergy Card), Thử thách tuần, và Lối tắt vào bài tập nổi bật.
2. **ExercisesListView** ([`ExercisesListView.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/exercises/ExercisesListView.tsx)): Bộ sưu tập toàn bộ 25 bài tập, có bộ lọc theo 6 nhóm kỹ năng, thanh tìm kiếm, nhãn cấp độ hiện tại, và trạng thái Featured.
3. **ExerciseDetailModal** ([`ExerciseDetailModal.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/exercises/ExerciseDetailModal.tsx)): Modal chi tiết bài tập trước khi bắt đầu, hiển thị Căn cứ khoa học, Hướng dẫn luật chơi, Bộ chọn cấp độ trực quan (Cấp 1 - 12 Chuẩn và Cấp 13 - 22 Cấp Vô Cực có nhãn La Mã $\infty$-I đến $\infty$-X), Bảng thông số kỹ thuật (Grid size, WPM, Time Limit).
4. **ActiveGameContainer** ([`ActiveGameContainer.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/games/ActiveGameContainer.tsx)): Khung điều khiển khi đang chơi game, tích hợp thanh HUD Variant phát sáng cho các cấp độ cao, nút thoát khẩn cấp, banner gợi ý bài tập tiếp theo.
5. **MusicTheoryView** ([`MusicTheoryView.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/learn/MusicTheoryView.tsx)): Trung tâm đào tạo nhạc lý tương tác với 7 module trực quan.
6. **ProfileView** ([`ProfileView.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/profile/ProfileView.tsx)): Hồ sơ cá nhân tích hợp Biểu đồ Ngũ giác Nhận thức (Cognitive Radar), Bản đồ Não bộ tương tác 12 nút (Brain Map), và Lịch sử các lượt chơi gần nhất.
7. **SettingsView** ([`SettingsView.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/settings/SettingsView.tsx)): Tùy chỉnh âm thanh, tự động điều chỉnh độ khó DDA, chế độ hiển thị Dark/Light/Sepia, và quản lý lịch thông báo nhắc nhở.

---

## 7. DANH MỤC 25 BÀI TẬP NHẬN THỨC & ĐỌC NHANH

Brain-Pro sở hữu danh mục 25 bài tập chuyên sâu phân chia thành 6 Nhóm Kỹ Năng Nhận Thức:

### Nhóm 1: Đọc Nhanh (SPEED_READING) - 5 Bài Tập
1. **Chữ Chạy RSVP (`rsvp-speed-reader`)**:
   - *Cơ chế*: Trình chiếu từng từ nối tiếp với tốc độ 200 – 1200 WPM tại Điểm Nhận Diện Tối Ưu (ORP - ký tự trung tâm được highlight màu đỏ). Giúp triệt tiêu thời gian chuyển động mắt lãng phí và khử đọc thầm.
   - *Quan hệ nhận thức*: `TEMPORAL_PREDICT`, `PART_WHOLE`, `CONTEXT_MEANING`.
2. **Tăng Tốc Độ Đọc (`reading-pacer`)**:
   - *Cơ chế*: Áp dụng kỹ thuật định dạng Bionic Reading (in đậm 2-3 ký tự đầu của mỗi từ) kết hợp thanh dẫn nhịp Pacer di chuyển tự động qua các dòng văn bản theo tốc độ đặt trước.
   - *Quan hệ nhận thức*: `TEMPORAL_PREDICT`, `FOCUS_FIELD`.
3. **Quét Văn Bản (`text-scanning`)**:
   - *Cơ chế*: Người chơi nhận một câu hỏi hoặc từ khóa mục tiêu, sau đó phải lướt nhanh toàn bộ văn bản thực chiến trong thời gian ngắn nhất để nhấp chọn chính xác vị trí từ khóa.
   - *Quan hệ nhận thức*: `TARGET_DISTRACTOR`, `CONTEXT_MEANING`.
4. **Chuỗi Từ (`word-chunking`)**:
   - *Cơ chế*: Văn bản được chia thành các cụm từ ngữ nghĩa 2-4 từ. Các khối từ nhấp nháy tuần tự để huấn luyện mắt mở rộng khẩu độ đọc theo cụm thay vì dừng mắt ở từng từ đơn lẻ.
   - *Quan hệ nhận thức*: `PART_WHOLE`, `CONTEXT_MEANING`.
5. **Đánh Giá Tốc Độ Đọc (`reading-assessment`)**:
   - *Cơ chế*: Bài kiểm tra chuẩn hóa đo lường tốc độ đọc văn bản tự nhiên, kết thúc bằng bộ 4 câu hỏi trắc nghiệm đọc hiểu nhằm tính toán chỉ số Tốc độ đọc hiệu dụng (Effective WPM).
   - *Quan hệ nhận thức*: `CONTEXT_MEANING`, `ORDER_SEQUENCE`.

### Nhóm 2: Thị Giác Ngoại Vi (PERIPHERAL_VISION) - 4 Bài Tập
6. **Bảng Schulte (`schulte-table`)**:
   - *Cơ chế*: Lưới số ngẫu nhiên từ 3x3 đến 9x9. Mắt khóa chặt vào tâm lưới, dùng thị giác biên để tìm và bấm lần lượt các số tăng dần từ 1 đến N.
   - *Biến thể cấp cao*: Reverse (đếm ngược), Gorbov Red-Black (xen kẽ Đỏ tăng dần - Đen giảm dần), Rotating Schulte (lưới tự xoay quanh tâm), Fading Schulte (số ẩn hiện).
   - *Quan hệ nhận thức*: `TARGET_POSITION`, `ORDER_SEQUENCE`, `FOCUS_FIELD`, `INHIBITION`.
7. **Tầm Nhìn Ngoại Vi (`peripheral-vision`)**:
   - *Cơ chế*: Khóa điểm nhìn vào chữ thập trung tâm. Hai ký tự hoặc biểu tượng chớp sáng ở hai biên màn hình với góc mở rộng dần. Người chơi phải xác nhận chính xác ký tự biên mà không được liếc mắt.
   - *Quan hệ nhận thức*: `FOCUS_FIELD`, `TARGET_POSITION`.
8. **Điểm Xanh Cố Định (`green-dot`)**:
   - *Cơ chế*: Người chơi nhìn chăm chú vào chấm tròn xanh lục ở tâm đoạn văn trong 60 giây để kích hoạt trạng thái "Tập trung mềm" (Soft Focus), sau đó trả lời trắc nghiệm các chi tiết nằm ở rìa trang sách.
   - *Quan hệ nhận thức*: `FOCUS_FIELD`, `TARGET_DISTRACTOR`.
9. **Theo Dõi Mắt Nhanh (`saccade-tracker`)**:
   - *Cơ chế*: Rèn luyện phản xạ đảo mắt có chủ ý (Voluntary Saccades). Một mục tiêu di chuyển nhanh hoặc nhảy cóc giữa các góc màn hình, người chơi phải phản ứng bấm bắt mục tiêu tức thì.
   - *Quan hệ nhận thức*: `FOCUS_FIELD`, `TARGET_POSITION`.

### Nhóm 3: Chú Ý Tập Trung (ATTENTION) - 4 Bài Tập
10. **Tìm Chữ Cái (`find-letter`)**:
    - *Cơ chế*: Tìm các chữ cái mục tiêu trong ma trận chữ gây nhiễu có cùng đặc trưng nét (ví dụ: tìm chữ 'E' trong ma trận toàn chữ 'F', tìm 'O' giữa rừng chữ 'Q', 'C', 'D').
    - *Quan hệ nhận thức*: `TARGET_DISTRACTOR`, `SIMILARITY_DIFF`.
11. **Tìm Số (`find-number`)**:
    - *Cơ chế*: Quét số mục tiêu trên lưới số dày đặc. Ở cấp độ nâng cao, người chơi phải tìm số thỏa mãn điều kiện số học (chia hết cho 3, tổng chữ số bằng K, v.v.).
    - *Quan hệ nhận thức*: `TARGET_DISTRACTOR`, `RULE_ACTION`.
12. **Tìm Từ Trong Ma Trận (`word-search`)**:
    - *Cơ chế*: Ma trận chữ cái kích thước lớn (lên đến 20x20). Tìm danh sách từ vựng ẩn giấu theo chiều ngang, dọc, chéo xuôi và ngược.
    - *Quan hệ nhận thức*: `PART_WHOLE`, `TARGET_POSITION`.
13. **So Sánh Từ Sinh Đôi (`twin-words`)**:
    - *Cơ chế*: Hiển thị hai từ cạnh nhau trong 1-2 giây. Xác định xem hai từ đó là "GIỐNG NHAU" hay "KHÁC NHAU" (thường chỉ sai lệch 1 dấu hoặc 1 ký tự tinh vi).
    - *Quan hệ nhận thức*: `IDENTITY_MATCH`, `SIMILARITY_DIFF`.

### Nhóm 4: Trí Nhớ Làm Việc (MEMORY) - 4 Bài Tập
14. **Đảo Ngữ (`anagram`)**:
    - *Cơ chế*: Các ký tự của một từ bị xáo trộn. Người chơi phải quan sát và gõ lại hoặc bấm chọn các chữ cái theo đúng trật tự ban đầu để tạo thành từ có nghĩa.
    - *Quan hệ nhận thức*: `PART_WHOLE`, `ORDER_SEQUENCE`.
15. **Nhớ Dãy Số (`digit-span`)**:
    - *Cơ chế*: Dãy số từ 3 đến 12 chữ số xuất hiện lần lượt. Người chơi phải nhớ và nhập lại chính xác theo chiều xuôi (Forward Span) hoặc đảo ngược hoàn toàn (Reverse Span).
    - *Quan hệ nhận thức*: `ORDER_SEQUENCE`, `TEMPORAL_PREDICT`.
16. **Lật Thẻ Trí Nhớ 3D (`card-flip`)**:
    - *Cơ chế*: Bàn cờ thẻ bài 3D úp ngược. Người chơi lật từng cặp thẻ để tìm hai hình trùng khớp với số lượt lật và thời gian tối thiểu. Cấp cao bổ sung hiệu ứng thẻ tự tráo vị trí.
    - *Quan hệ nhận thức*: `IDENTITY_MATCH`, `SPATIAL_TRANSFORM`, `TARGET_POSITION`.
17. **Nhớ Khối Không Gian (`spatial-memory` - Corsi Block Tapping)**:
    - *Cơ chế*: Lưới các khối hình học trong không gian. Một chuỗi các khối phát sáng tuần tự. Người chơi phải chạm lại đúng trình tự các khối trong không gian 2D/3D.
    - *Quan hệ nhận thức*: `SPATIAL_TRANSFORM`, `ORDER_SEQUENCE`, `TARGET_POSITION`.

### Nhóm 5: Phản Xạ Nhận Thức (REACTION) - 2 Bài Tập
18. **Chẵn/Lẻ (`even-odd`)**:
    - *Cơ chế*: Phân loại số chẵn hoặc số lẻ dưới áp lực thời gian cực gấp. Khi màn hình chuyển viền đỏ (Inverted Rule), người chơi phải ức chế phản xạ tự nhiên và bấm ngược lại quy tắc thông thường.
    - *Quan hệ nhận thức*: `RULE_ACTION`, `INHIBITION`.
19. **Đấu Màu Nhận Thức (`stroop-clash` - Stroop Effect)**:
    - *Cơ chế*: Từ vựng chỉ màu sắc (ví dụ: chữ "ĐỎ") được in bằng màu mực khác (ví dụ: màu Xanh Dương). Người chơi phải chọn đúng màu mực hiển thị và ức chế hoàn toàn phản xạ đọc chữ.
    - *Quan hệ nhận thức*: `INHIBITION`, `RULE_ACTION`.

### Nhóm 6: Trí Nhớ Âm Thanh & Cảm Âm (AUDITORY_MEMORY) - 6 Bài Tập
20. **Nhớ Cao Độ (`pitch-recall`)**:
    - *Cơ chế*: Hệ thống phát một chuỗi các nốt nhạc Piano. Người chơi lắng nghe và đánh lại đúng chuỗi nốt trên bàn phím Piano ảo (hoặc đàn MIDI thật).
    - *Quan hệ nhận thức*: `ORDER_SEQUENCE`, `TEMPORAL_PREDICT`.
21. **Nhận Diện Quãng (`interval-identify`)**:
    - *Cơ chế*: Phát hai nốt nhạc nối tiếp hoặc đồng thời. Người chơi xác định tên quãng âm học (Quãng 2 Trưởng, Quãng 3 Thứ, Quãng 5 Đúng, Quãng 8 Octave...).
    - *Quan hệ nhận thức*: `SIMILARITY_DIFF`, `IDENTITY_MATCH`.
22. **Nhớ Nhịp Điệu (`rhythm-recall`)**:
    - *Cơ chế*: Trống điện tử (Kick, Snare, Hi-Hat) gõ một tiết tấu theo nhịp Metronome. Người chơi dùng Drum Pad để gõ lại đúng tiết tấu và trường độ.
    - *Quan hệ nhận thức*: `ORDER_SEQUENCE`, `TEMPORAL_PREDICT`.
23. **Nhận Diện Hợp Âm (`chord-identify`)**:
    - *Cơ chế*: Phát các hợp âm đồng thời (Trưởng Major, Thứ Minor, Giảm Diminished, Tăng Augmented, Hợp âm 7th). Người chơi lắng nghe màu sắc hòa âm để nhận diện.
    - *Quan hệ nhận thức*: `PART_WHOLE`, `SIMILARITY_DIFF`.
24. **Phân Biệt Âm Sắc (`timbre-match`)**:
    - *Cơ chế*: Cùng một cao độ nốt nhạc nhưng được phát bằng các dạng sóng âm khác nhau (Sine, Triangle, Sawtooth, Square, Acoustic Piano). Người chơi phân biệt dạng sóng dựa trên cấu trúc sóng âm hiển thị trên Oscilloscope.
    - *Quan hệ nhận thức*: `SIMILARITY_DIFF`, `IDENTITY_MATCH`.
25. **Định Vị Âm Thanh 3D (`sound-localization`)**:
    - *Cơ chế*: Tận dụng bộ xử lý âm thanh không gian (Binaural 3D Spatial Audio). Một tín hiệu âm thanh phát ra từ một góc tọa độ bất kỳ trong không gian 360 độ quanh đầu người nghe. Người chơi định vị và nhấp vào Radar đa hướng để xác định nguồn âm.
    - *Quan hệ nhận thức*: `TARGET_POSITION`, `SPATIAL_TRANSFORM`.

---

## 8. HỆ THỐNG 10 TẦNG CẤP VÔ CỰC (10 INFINITY TIERS: ∞-I ĐẾN ∞-X)

Mỗi bài tập trong số 25 bài tập của Brain-Pro được thiết kế với **22 cấp độ**:
- **Cấp 1 đến 12**: Cấp độ tiến trình chuẩn hóa (Standard Progression), tăng dần độ khó thuật toán nội tại.
- **Cấp 13 đến 22**: **10 Cấp Vô Cực (Infinity Tiers)** mang ký hiệu La Mã từ **$\infty$-I đến $\infty$-X**.

### 8.1. Ý nghĩa sư phạm & Cấu trúc 10 Tầng
Hệ thống Infinity Tier đưa nhận thức người chơi vượt ra ngoài các bộ dữ liệu tĩnh, kết nối trực tiếp với tri thức thực tế toàn cầu:
- **$\infty$-I**: *Cross-Language Bridge* (Giao thoa song ngữ Anh - Việt, yêu cầu cầu nối dịch thuật tức thì).
- **$\infty$-II**: *Synonym & Antonym Race* (Truy xuất từ đồng nghĩa, trái nghĩa tốc độ cao).
- **$\infty$-III**: *Visual & Semantic Clash* (Giải mã Emoji và biểu tượng kết hợp ngôn ngữ).
- **$\infty$-IV**: *Collocation & Phrase Blast* (Xử lý các cụm thành ngữ, thuật ngữ học thuật dài).
- **$\infty$-V**: *Fibonacci Procedural Pattern* (Áp dụng dãy số tự nhiên Fibonacci để điều phối nhịp độ câu hỏi).
- **$\infty$-VI**: *Domain-Specific Clusters* (Tri thức chuyên ngành: Khoa học vũ trụ, Y sinh, Công nghệ).
- **$\infty$-VII**: *Open Trivia & General Knowledge* (Câu hỏi kiến thức tổng hợp đa lĩnh vực).
- **$\infty$-VIII**: *Chaotic / Reverse Distraction* (Đảo ngược quy tắc liên tục, môi trường nhiễu cực đại).
- **$\infty$-IX**: *Pendulum / Cascade Rhythm* (Nhịp độ biến thiên hình sin, thử thách sự thích ứng áp lực).
- **$\infty$-X**: *Singularity Infinite Stream* (Dòng chảy nhận thức vô cực kết hợp đa giác quan).

### 8.2. Dịch vụ Tri Thức Ngoại Vi & Ngoại Tuyến Bền Vững (`infinityApiService.ts`)
Tệp [`frontend/src/services/infinityApiService.ts`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/services/infinityApiService.ts) (87KB) tích hợp:
1. **Free Dictionary API**: Tra cứu định nghĩa học thuật, từ loại, phiên âm IPA theo thời gian thực.
2. **Datamuse API**: Tìm kiếm từ liên quan ngữ nghĩa, vần điệu, từ đồng nghĩa.
3. **Wikipedia REST API**: Trích xuất đoạn trích kiến thức bách khoa toàn thư thế giới.
4. **Open Trivia DB**: Cung cấp ngân hàng câu hỏi kiến thức phong phú.
5. **NASA APOD API**: Dữ liệu thiên văn và thuật ngữ không gian.
6. **Kho Ngữ Liệu Offline Dự Phòng (100% Offline-Resilient)**: Chứa hơn 150 cặp từ song ngữ Anh - Việt học thuật, 85 mục từ điển đầy đủ, 50 bộ từ trái nghĩa/đồng nghĩa giúp game chạy trơn tru ngay cả khi rớt mạng hoặc các API ngoài gặp sự cố mạng.

---

## 9. CÁC PHÂN HỆ CHUYÊN SÂU ĐỘC ĐÁO

### 9.1. Phân Hệ Âm Thanh & Nhạc Lý (Auditory Engine & Music Theory)

#### 1. Bộ Tổng Hợp Âm Thanh Vật Lý (`auditoryEngine.ts`)
- **Acoustic Piano Modeling**: Mô phỏng âm thanh búa đàn gõ vào dây đàn thông qua kỹ thuật Additive Synthesis:
  - Hài âm cơ bản (Fundamental Frequency).
  - Hài âm bậc 2 (2nd Harmonic - Octave overtone).
  - Hài âm bậc 3 (3rd Harmonic - Twelfth hammer bite khi gõ mạnh).
- **ADSR Envelope & Velocity Sensitivity**:
  - Gõ phím nhẹ (velocity thấp): Attack mềm (15ms), lọc Lowpass cắt ở tần số trầm, âm thanh ấm và tối.
  - Gõ phím mạnh (velocity cao): Attack đanh (2.5ms), mở rộng Lowpass lên đến 14.5kHz, âm thanh sáng và vang.
- **3D Spatial Audio Engine**: Cấu hình tọa độ `AudioListener` và `PannerNode` theo mô hình chuẩn HRTF, cho phép âm thanh di chuyển tự do trong không gian ba chiều (trái/phải, trước/sau, trên/dưới).
- **Trực quan hóa thời gian thực**:
  - [`InteractiveOscilloscope.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/ui/InteractiveOscilloscope.tsx): Vẽ đồ thị dạng sóng âm theo thời gian thực qua AnalyserNode.
  - [`FrequencySpectrum.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/ui/FrequencySpectrum.tsx): Biểu đồ phân tích phổ tần số 256 dải FFT.
  - [`Metronome.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/ui/Metronome.tsx): Bộ đếm nhịp âm học hỗ trợ nhịp 2/4, 3/4, 4/4, 6/8 từ 40 đến 240 BPM.
  - [`SpatialRadar.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/ui/SpatialRadar.tsx): Màn hình radar quét tọa độ âm thanh 360 độ.

#### 2. Kết Nối Thiết Bị Phần Cứng Ngoài (`midiService.ts` & `useMidiInput.ts`)
- Tích hợp chuẩn **Web MIDI API**: Tự động nhận diện khi người dùng cắm đàn Organ / Keyboard Piano qua cổng USB-MIDI.
- Chuyển đổi mã phím MIDI (Note On / Note Off, Velocity 1-127) thành tín hiệu âm thanh và thao tác chơi trong game.
- Đèn báo trạng thái kết nối [`MidiStatusIndicator.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/ui/MidiStatusIndicator.tsx).

#### 3. Trung Tâm Học Nhạc Lý Tương Tác ([`MusicTheoryView.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/learn/MusicTheoryView.tsx))
Bao gồm 7 module đào tạo chuyên sâu:
1. `NotesAndPitchModule`: Nhận diện nốt nhạc trên khuông nhạc và phím đàn.
2. `IntervalsModule`: Tìm hiểu cấu tạo 12 quãng âm thanh.
3. `ChordsModule`: Khám phá công thức hợp âm 3 nốt (Triads) và hợp âm 7 (Seventh chords).
4. `ScalesModule`: Học thang âm Trưởng (Major), Thứ (Minor), Pentatonic, Blues.
5. `RhythmModule`: Nắm bắt giá trị nốt tròn, trắng, đen, móc đơn, liên ba (triplets).
6. `TimbreModule`: Khám phá phổ tần số các loại nhạc cụ và dạng sóng âm.
7. `SpatialAudioModule`: Trải nghiệm nguyên lý âm thanh hai tai (Binaural Hearing) và độ trễ liên tai (ITD / ILD).

---

### 9.2. Phân Hệ Đọc Nhanh & Trình Quản Lý Nguồn Đọc

- **Công nghệ ORP (Optimal Recognition Point)**: Giúp mắt định vị ký tự trung tâm của mỗi từ trong bài tập RSVP, tăng tốc độ xử lý của vỏ não thị giác.
- **Trình Quản Lý Nguồn Đọc (`ReadingTextSourceModal.tsx`)**:
  - Tải bài đọc chuẩn từ thư viện hệ thống.
  - Nhập văn bản tùy chỉnh bất kỳ (Custom Text Input).
  - Tải tài liệu từ file `.txt`, `.md`.
  - Tải nội dung từ liên kết URL thông qua dịch vụ đọc dữ liệu.
  - Trình tạo văn bản giả lập theo độ dài và chủ đề.

---

### 9.3. Kiến Trúc Nhận Thức Tương Quan (12 Cognitive Relations & Brain Map)

Hệ thống định nghĩa **12 Quan Hệ Nhận Thức cốt lõi**:
1. `TARGET_POSITION`: Ánh xạ mục tiêu vào tọa độ không gian.
2. `ORDER_SEQUENCE`: Nhận diện và duy trì thứ tự chuỗi.
3. `IDENTITY_MATCH`: Xác định sự trùng khớp đồng nhất.
4. `SIMILARITY_DIFF`: Phân biệt điểm tương đồng và dị biệt.
5. `TARGET_DISTRACTOR`: Lọc tín hiệu mục tiêu, ức chế nhiễu.
6. `RULE_ACTION`: Phản hồi hành vi dựa trên quy tắc điều kiện.
7. `INHIBITION`: Ức chế phản xạ thói quen trước tín hiệu xung đột.
8. `PART_WHOLE`: Nhận diện mối liên kết giữa bộ phận và tổng thể.
9. `FOCUS_FIELD`: Giữ cố định tâm nhìn, tiếp nhận thông tin ngoại vi.
10. `SPATIAL_TRANSFORM`: Biến đổi và tái lập tọa độ không gian.
11. `TEMPORAL_PREDICT`: Đón đầu tín hiệu tiếp nối theo dòng thời gian.
12. `CONTEXT_MEANING`: Thấu hiểu ý nghĩa trong ngữ cảnh rộng.

#### Công Thức Tính Mượt Hóa Điểm Thông Thạo (Mastery EMA):
Mỗi lượt thử $i$ (đúng = 1.0, sai = 0.0), điểm Accuracy của quan hệ được cập nhật:
$$\text{Accuracy}_{i} = \alpha \times \text{TrialValue} + (1 - \alpha) \times \text{Accuracy}_{i-1} \quad (\text{với } \alpha = 0.08)$$

#### Bản Đồ Não Bộ Tương Tác ([`BrainMap.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/frontend/src/components/cognition/BrainMap.tsx)):
Hiển thị mạng lưới 12 nút nhận thức kết nối bằng các cạnh quan hệ (Edges). Mỗi nút hiển thị điểm Mastery (0-100%), Tier năng lực (Tier 1 đến Tier 4) và danh sách các bài tập đại diện giúp cải thiện nút đó.

#### Thuật Toán Đề Xuất Chuỗi Nhận Thức (Cognitive Chain):
Hệ thống tự động tìm quan hệ nhận thức có điểm thấp nhất:
$$\text{Bottleneck} = \arg\min_{r \in \text{Relations}} (0.7 \times \text{Accuracy}_r + 0.3 \times \text{TransferScore}_r)$$
và kích hoạt chuỗi bài tập can thiệp đặc hiệu để bồi dưỡng mắt xích yếu nhất.

---

### 9.4. Hệ Thống Luyện Tập Theo Lộ Trình (Workouts & Synergies)

- **4 Gói Luyện Tập Tự Động**: `QUICK_5M`, `REGULAR_10M`, `OPTIMAL_30M`, `INTENSIVE_60M`. Chuyển tiếp tự động giữa các bài tập với bộ đếm giờ countdown và báo cáo tổng kết chuỗi.
- **Hệ Thống Hiệp Đồng (Exercise Synergies)**: Thưởng điểm XP liên kết khi chơi các cặp bài tập bổ trợ lẫn nhau (ví dụ: *Anagram* + *Word Chunking*, *Schulte Table* + *Spatial Memory*).

---

## 10. CẤU HÌNH HỆ THỐNG & BIẾN MÔI TRƯỜNG (CONFIGURATION & ENVIRONMENT)

Dự án sử dụng các biến môi trường để cấu hình toàn bộ hệ thống:

### 10.1. File `.env` gốc (Root / Backend)
```env
# Kết nối PostgreSQL Supabase (Pooler Mode - Port 6543)
DATABASE_URL=postgresql://postgres.ogsemefehnlaedkwigyl:5g*Q%3FhqT9N6BU7x@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
DB_HOST=aws-0-ap-northeast-1.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.ogsemefehnlaedkwigyl
DB_PASSWORD=5g*Q?hqT9N6BU7x
DB_NAME=postgres
DB_SSL=true

# Bảo mật JWT
JWT_SECRET=brain-exercises-pro-secret-2026

# Cấu hình máy chủ
PORT=3001
NODE_ENV=development

# Google OAuth Server-side
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
SUPABASE_URL=https://ogsemefehnlaedkwigyl.supabase.co
```

### 10.2. File `frontend/.env`
```env
# Google OAuth Client-side (One-Tap & Popup)
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_SUPABASE_URL=https://ogsemefehnlaedkwigyl.supabase.co

# API Tri Thức Ngoại Vi cho Cấp Vô Cực (Infinity Tiers)
VITE_DICTIONARY_API_URL=https://api.dictionaryapi.dev/api/v2/entries/en
VITE_DATAMUSE_API_URL=https://api.datamuse.com/words
VITE_WIKIPEDIA_API_URL=https://en.wikipedia.org/api/rest_v1/page
VITE_NASA_API_KEY=DEMO_KEY
VITE_OPEN_TRIVIA_URL=https://opentdb.com/api.php
```

### 10.3. Cấu hình Vercel ([`vercel.json`](file:///c:/Users/Admin/OneDrive/Desktop/Brain%20exercises/vercel.json))
Tệp cấu hình định tuyến đa dịch vụ trên Vercel:
- Dịch vụ `frontend`: Thư mục gốc `frontend`, framework `vite`.
- Dịch vụ `backend`: Thư mục gốc `backend`, framework `express`, entrypoint `api/index.js`.
- Rewrites:
  - Mọi yêu cầu `/api/(.*)` chuyển tới dịch vụ `backend`.
  - Mọi yêu cầu khác `/(.*)` chuyển tới dịch vụ `frontend`.

---

## 11. QUY TRÌNH BUILD, TRIỂN KHAI & KIỂM THỬ

### 11.1. Chạy Môi Trường Phát Triển Cục Bộ (Local Development)

```bash
# 1. Cài đặt toàn bộ dependencies
npm install

# 2. Build gói thư viện dùng chung (@brain-exercises/shared)
npm run build:shared

# 3. Chạy Backend NestJS (Cổng 3001)
npm run start:backend

# 4. Chạy Frontend Vite (Cổng 5173 - tab terminal khác)
npm run start:frontend
```

Truy cập ứng dụng tại: `http://localhost:5173`  
Xem tài liệu Swagger API tại: `http://localhost:3001/api/docs`

### 11.2. Khởi Tạo Cơ Sở Dữ Liệu Supabase

```bash
# Tạo 12 bảng cơ sở và nạp dữ liệu mẫu ban đầu
node backend/src/database/init-supabase.js

# Tạo các bảng nhận thức nâng cao (relation_evidence, user_relation_mastery)
node backend/src/database/migrate-cognitive-tables.js
```

### 11.3. Kiểm Tra Mã Nguồn & Build Sản Phẩm

```bash
# Kiểm tra kiểu TypeScript trên toàn bộ 3 gói
npm run typecheck

# Quét linter siêu tốc bằng Oxlint
npm run lint

# Build production bundle cho cả 3 gói
npm run build
```

---

## 12. ĐÁNH GIÁ HIỆN TRẠNG & LỘ TRÌNH PHÁT TRIỂN TƯƠNG LAI

### 12.1. Đánh Giá Điểm Mạnh Hiện Tại (Strengths)
1. **Kiến Trúc Khoa Học Sâu Sắc**: Việc chuyển dịch từ việc chấm điểm game bề mặt sang mô hình 12 Quan Hệ Nhận Thức (`Cognitive Relational Architecture`) biến Brain-Pro thành một hệ thống huấn luyện chuẩn y sinh và tâm lý học nhận thức.
2. **Quy Mô Tính Năng Vượt Trội**: 25 bài tập tương tác, 22 cấp độ thích ứng, 10 Tầng Infinity kết nối API thời gian thực, trung tâm nhạc lý 7 module và synthesizer vật lý mô phỏng tiếng đàn Piano sống động.
3. **Độ Bền Vững Ngoại Tuyến (Offline Resilience)**: Hoạt động trơn tru 100% ngay cả khi mất mạng nhờ Zustand `localStorage` persist, bộ dữ liệu offline phong phú và cơ chế DataStoreService fallback.
4. **Trải Nghiệm Đa Nền Tảng & Thiết Bị Ngoại Vi**: Hỗ trợ đầy đủ phím bấm bàn phím máy tính, màn hình cảm ứng điện thoại/máy tính bảng, và bàn phím đàn Piano MIDI vật lý.
5. **Giao Diện Hiện Đại (High Aesthetics)**: Thiết kế tông màu kem sang trọng (`#ECE5D8`), hỗ trợ Dark Mode hoàn hảo, đồ thị Brain Map tương tác mượt mà.

### 12.2. Điểm Cần Cải Thiện & Tối Ưu Hóa (Areas for Improvement)
1. **Tối ưu hóa Bundle Size**: Thư viện Tone.js và Lucide React chiếm dung lượng bundle tương đối lớn. Có thể xem xét Dynamic Import (`React.lazy`) cho các game âm thanh khi người dùng kích hoạt tab Nhạc lý hoặc bài chơi âm thanh.
2. **Bảo Mật Xác Thực Token**: Cần tích hợp Refresh Token xoay vòng (Rotating Refresh Tokens) trong HttpOnly Cookie thay vì chỉ dùng Bearer Token lưu trữ trong bộ nhớ tạm.
3. **Công Cụ Quản Trị Dữ Liệu (ORM Migration Tool)**: Hiện tại script tạo bảng dùng raw SQL trong Node.js. Trong tương lai nên chuẩn hóa qua Prisma ORM hoặc TypeORM Migrations để quản lý phiên bản cơ sở dữ liệu chuyên nghiệp hơn.

### 12.3. Lộ Trình Phát Triển Đề Xuất (Roadmap v2.0)
- **Giai đoạn 1: Đấu Đấu Trí Trực Tiếp (Multiplayer Cognitive Duel)**
  - Tích hợp WebSocket (Socket.io) cho phép 2 người chơi thi đấu đối kháng trực tiếp các bài tập phản xạ (Schulte Table, Stroop Clash, Even/Odd).
- **Giai đoạn 2: Trợ Lý AI Phân Tích Não Bộ (AI Cognitive Coach)**
  - Sử dụng LLM để sinh báo cáo phân tích năng lực nhận thức định kỳ hàng tuần, đưa ra lời khuyên về thói quen sinh hoạt, dinh dưỡng và chế độ rèn luyện cá nhân hóa.
- **Giai đoạn 3: Ứng Dụng Di Động Native (Mobile App)**
  - Đóng gói ứng dụng di động iOS & Android thông qua Capacitor hoặc React Native, tích hợp thông báo đẩy cục bộ (Local Push Notifications) để nhắc nhở luyện tập đúng giờ.
- **Giai đoạn 4: Mở Rộng Thư Viện Sách Điện Tử (EPUB Reader Integration)**
  - Cho phép người dùng tải lên sách điện tử định dạng EPUB/PDF để đọc bằng chế độ RSVP Reader hoặc Bionic Pacer Reader trực tiếp trong ứng dụng.

---
*Tài liệu này được biên soạn đầy đủ để làm tài liệu chuẩn bàn giao, đánh giá và định hướng phát triển cho nền tảng Brain-Pro.*
