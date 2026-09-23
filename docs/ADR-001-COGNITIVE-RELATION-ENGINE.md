# ADR-001: Kiến Trúc Cognitive Relationship Engine (Brain-Pro v2.0)

**Trạng thái:** Được chấp thuận (Approved)  
**Ngày:** 2026-09-23  
**Tác giả:** Brain-Pro Core Engineering Team  

---

## 1. Bối Cảnh (Context)

Brain-Pro ban đầu được thiết kế như một tập hợp 19 bài tập đọc nhanh và rèn luyện trí não độc lập (React/Vite + NestJS in-memory + Zustand store). Mỗi bài tập ghi nhận điểm số, độ chính xác, và thăng cấp level theo slug riêng biệt. Điều này dẫn đến sự phân mảnh:
- Kỹ năng luyện trong một bài (ví dụ: quét vị trí trong Schulte Table) không được chuyển giao hay ghi nhận sang bài tập tương đồng (như Spatial Memory hay Find Number).
- Tiến trình người chơi chỉ nhìn thấy 5 chỉ số radar tổng thể hoặc điểm số bề mặt của từng game.
- Một số tài liệu trước đây chứa các tuyên bố y khoa/giải phẫu học thần kinh chưa được chứng thực lâm sàng.
- Backend chạy RAM-only, trong khi script khởi tạo Supabase PostgreSQL (`init-supabase.js`) đã tồn tại trong repository.

---

## 2. Các Quyết Định Kiến Trúc (Decisions)

### 2.1. Đơn Vị Huấn Luyện Cốt Lõi: 12 Quan Hệ Nhận Thức (Cognitive Relations)
Thay vì tạo ra hàng chục quan hệ phức tạp, chúng tôi chuẩn hóa một bộ danh mục tĩnh gồm **12 quan hệ nhận thức gốc** trong gói `@brain-exercises/shared`:
1. `TARGET_POSITION`
2. `ORDER_SEQUENCE`
3. `IDENTITY_MATCH`
4. `SIMILARITY_DIFF`
5. `TARGET_DISTRACTOR`
6. `RULE_ACTION`
7. `INHIBITION`
8. `PART_WHOLE`
9. `FOCUS_FIELD`
10. `SPATIAL_TRANSFORM`
11. `TEMPORAL_PREDICT`
12. `CONTEXT_MEANING`

Mọi bài tập (19 slug) đều được ánh xạ rõ ràng tới một **Quan hệ chính (Primary Relation)**, các **Quan hệ phụ (Secondary Relations)** và quan hệ mở rộng theo từng cấp độ (1–12).

### 2.2. Chiến Lược Lưu Trữ Dữ Liệu: Supabase PostgreSQL + Resilient Fallback
- Cơ sở dữ liệu chính thức là **Supabase PostgreSQL** (`aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`, project `ogsemefehnlaedkwigyl`), đã được khởi tạo qua `init-supabase.js`.
- `DataStoreService` kết nối trực tiếp đến PostgreSQL khi biến môi trường `DATABASE_URL` tồn tại, đồng thời trang bị cơ chế tự động chuyển sang In-Memory Fallback nếu kết nối mạng tạm thời gián đoạn.
- Khi người dùng ở chế độ offline, frontend kích hoạt bộ đệm `useOfflineSync` để lưu các attempt chưa gửi và tự động đồng bộ lại khi online.

### 2.3. Schema Telemetry & Event Versioning (`schemaVersion: 'v1'`)
Mỗi lượt chơi của người dùng ghi nhận các sự kiện nhận thức chi tiết dạng `IRelationEvent`. Mọi payload gửi lên backend qua `rawMetricsJson` bắt buộc chứa trường `schemaVersion: 'v1'` để đảm bảo tính tương thích xuôi và ngược. Giới hạn tối đa là 500 sự kiện cho mỗi attempt để tối ưu hóa hiệu năng truyền tải mạng.

### 2.4. Dual Mastery Model (Chạy Song Song Hai Hệ Thống Tiến Trình)
- Tiếp tục duy trì `exerciseMasteries: Record<ExerciseSlug, IUserExerciseMastery>` để người dùng hiện tại không bị gián đoạn trải nghiệm hay mất cấp độ của từng bài tập.
- Bổ sung `relationshipMasteries: Record<RelationId, IRelationshipMastery>` trong Zustand store và API backend, cập nhật theo mô hình Exponential Moving Average ($\alpha = 0.08$), đo lường độ ổn định (stability) và khả năng chuyển giao (transfer score).

### 2.5. Chính Sách Ngôn Ngữ Khoa Học & Chuẩn Hóa Type
- Đổi tên trường `overallBrainAge` trong `IUserCognitiveSnapshot` thành `overallTrainingIndex` (Chỉ số Luyện tập Tổng thể), loại bỏ thuật ngữ gây hiểu lầm y khoa.
- Rà soát toàn bộ `scientificBasis` của 19 bài tập và mô tả `EXERCISE_SYNERGIES`: tập trung vào các paradigm thực nghiệm kinh điển (Schulte, Stroop, Corsi, RSVP, Digit Span), loại bỏ các tuyên bố giải phẫu học chưa kiểm chứng.

---

## 3. Hệ Quả & Lợi Ích (Consequences)

- **Tính toàn vẹn dữ liệu:** Toàn bộ lịch sử luyện tập được lưu trữ bền vững trên Supabase.
- **Giá trị người dùng:** Người dùng nhìn thấy rõ ràng năng lực nhận thức của mình ở cấp độ cấu trúc tư duy thông qua Bản Đồ Nhận Thức (Brain Map 12 nút).
- **Tính ổn định cao:** Giao diện có Error Boundary, cơ chế Offline-First, và serverless handler tối ưu cho hạ tầng Vercel.
