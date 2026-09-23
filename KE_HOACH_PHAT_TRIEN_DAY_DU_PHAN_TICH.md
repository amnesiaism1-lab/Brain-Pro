# Phân tích & Kế hoạch hoàn thiện — Brain-Pro

> Dựa trên đối chiếu trực tiếp `KE_HOACH_PHAT_TRIEN_DAY_DU.md` với code thật trong repo.

---

## Kết luận chính: Kế hoạch về cơ bản HỢP LÝ — nhưng cần 5 nhóm chỉnh sửa

Kế hoạch hiện tại (v1.0) có **hướng chiến lược đúng** và **chẩn đoán kỹ thuật chính xác**. Tuy nhiên sau khi đối chiếu với code thật, có **5 nhóm vấn đề** cần bổ sung, điều chỉnh, hoặc làm rõ thêm để kế hoạch thực sự triển khai được.

---

## Nhóm 1 — Những điểm kế hoạch đúng, code xác nhận ✅

| Điểm kế hoạch | Code xác nhận |
|---|---|
| Backend chạy RAM-only, entities TypeORM không gắn vào AppModule | ✅ Xác nhận: `AppModule.imports = []`, chỉ có `DataStoreService` in-memory |
| `rawMetricsJson` tồn tại trên entity nhưng chưa có schema event | ✅ Xác nhận: `GameAttempt.rawMetricsJson: Record<string, unknown>` không có typing |
| Radar 5 trục hardcode fallback | ✅ Xác nhận: `getUserStats()` trả về cố định `{speedReadingScore: 78, peripheralVisionScore: 85...}` |
| Mastery theo slug, không theo relation | ✅ Xác nhận: `exerciseMasteries: Record<string, IUserExerciseMastery>` — key là slug |
| 5 category trong store vs 6 kỹ năng trong spec | ✅ Xác nhận: `CognitiveCategoryCode` có đúng 5 type |
| `scientificBasis` có nội dung quá mạnh (anatomy giả) | ✅ Xác nhận: Anagram có `"Kích thích vùng Wernicke và Broca"` |
| 19 game component tồn tại và chơi được | ✅ Xác nhận: 21 file trong `frontend/src/components/games/` (bao gồm container + modal) |

---

## Nhóm 2 — Thiếu sót kế hoạch chưa đề cập (cần bổ sung)

### 2.1 Thiếu: Chiến lược xử lý `supabase init` đang tồn tại

**Vấn đề phát hiện:** File `backend/src/database/init-supabase.js` (10.9KB) tồn tại trong repo nhưng kế hoạch **không đề cập đến Supabase** và chỉ nói "bật TypeORM khi có `DATABASE_URL`". Đây là mâu thuẫn — dự án đã có một migration script cho Supabase, nhưng plan lại hướng đến PostgreSQL thuần túy.

**Cần làm rõ trong kế hoạch:**
- Dự án dùng Supabase hay PostgreSQL tự host?
- `init-supabase.js` có được dùng không, hay bỏ?
- Phase 1.5 cần nói rõ: "Supabase PostgreSQL" hay "raw PostgreSQL + TypeORM"

### 2.2 Thiếu: `calculateRecommendedNextLevel` đang làm gì thật sự

**Vấn đề phát hiện:** Kế hoạch nói "xóa mâu thuẫn max 8" nhưng không biết hàm hiện tại tính toán như thế nào. Trong `DataStoreService.saveGameAttempt()` hàm này được gọi với `(level, accuracyRate, timeSpentSec, timeLimit)`. Kế hoạch Phase 3 nói "thay/gộp" — cần audit code thật của hàm này trước.

### 2.3 Thiếu: QA-automation hiện đang test gì

**Vấn đề:** Kế hoạch đề cập "mở rộng oracle" nhưng không audit Playwright suite hiện có. Không rõ coverage hiện tại — không có baseline thì không biết "mở rộng" từ đâu.

### 2.4 Thiếu: `SpeedPacerGame.tsx` — slug không khớp

**Vấn đề phát hiện:** Trong games/ có file `SpeedPacerGame.tsx` nhưng `ExerciseSlug` type chỉ có `'reading-pacer'`. File component này có thể là alias hoặc orphan. Kế hoạch đề cập `reading-pacer` nhưng không note sự bất nhất tên file.

### 2.5 Thiếu: Chiến lược auth thật

**Vấn đề:** `DataStoreService` dùng `currentUser = { id: 'user-demo-1', ... }` hardcode. Có `AuthController` trong AppModule nhưng kế hoạch Phase 1.5 chỉ nói "Auth thật hoặc rõ 'local profile'" — quá mơ hồ. Cần quyết định: JWT local? Supabase Auth? Guest mode localStorage?

### 2.6 Thiếu: `IUserCognitiveSnapshot.overallBrainAge` — cần đổi tên

**Vấn đề:** Kế hoạch mục 10.3 nói "không dùng brain age như claim y khoa" nhưng `IUserCognitiveSnapshot` trong types vẫn có field `overallBrainAge: number`. Cần rename field này ngay ở Phase 0.

### 2.7 Thiếu: Kế hoạch migration cho `IUserExerciseMastery`

**Vấn đề:** Khi Phase 2 thêm `IRelationshipMastery`, store Zustand có `exerciseMasteries: Record<string, IUserExerciseMastery>`. Cần kế hoạch **chạy song song** 2 mastery systems — không phá UX của user đang có lịch sử.

---

## Nhóm 3 — Điều chỉnh thứ tự ưu tiên

### 3.1 Phase 0 cần thêm: Rename `overallBrainAge`

Hiện tại Phase 0 chỉ sửa README và copy. Nên thêm:
- Rename `IUserCognitiveSnapshot.overallBrainAge` → `overallTrainingIndex`
- Audit toàn bộ `scientificBasis` trong 19 bài trong `shared/src/constants/index.ts`

### 3.2 Phase 0.5 cần audit `SpeedPacerGame.tsx` trước khi wire

Xác nhận slug mapping trước khi làm variants.

### 3.3 Phase 1.5 cần quyết định Supabase vs PostgreSQL

Không thể "bật TypeORM khi có DATABASE_URL" mà không quyết định provider. `init-supabase.js` đã có schema — nên tận dụng hay viết lại?

### 3.4 Phase 2 nên tách thành 2a và 2b

- **Phase 2a:** Backend nhận và lưu `relationEvents` vào `rawMetricsJson` (không cần DB mới)
- **Phase 2b:** Tách bảng `relation_evidence` SQL, tính EMA trên server

Kế hoạch hiện tại gộp cả hai trong "1–2 tuần" — dễ underestimate.

---

## Nhóm 4 — Bổ sung kỹ thuật còn thiếu

### 4.1 Thêm: Error boundary và fallback strategy

Kế hoạch không đề cập error handling khi backend không available. Frontend hiện dùng API calls nhưng không có fallback rõ ràng khi offline.

**Bổ sung vào Phase 0.5:**
```ts
// useRelationSession cần offline-first: buffer → sync khi có mạng
interface RelationSessionBuffer {
  events: IRelationEvent[];
  flushedAt?: string;
  syncStatus: 'local' | 'pending' | 'synced';
}
```

### 4.2 Thêm: Versioning cho `rawMetricsJson`

Khi schema event thay đổi, cần version tag:
```ts
rawMetricsJson: {
  schemaVersion: 'v1',
  relationEvents: IRelationEvent[]
}
```
Thiếu điều này, Phase 2 sẽ không parse được data Phase 1.

### 4.3 Thêm: Rate limiting cho event batch

Kế hoạch nói "cap 500 event/attempt" nhưng không nói validation phía backend. Cần middleware kiểm tra `relationEvents.length <= 500`.

### 4.4 Thêm: Kế hoạch test type `IRelationEvent`

Unit test validator event (Phase 1 checklist) cần đi kèm với schema validation library (Zod hoặc class-validator). Kế hoạch không chỉ định.

---

## Nhóm 5 — Cần làm rõ timeline thực tế

| Phase | Kế hoạch nói | Đánh giá thực tế |
|---|---|---|
| Phase 0 | 3–5 ngày | ✅ Hợp lý |
| Phase 0.5 | 1–2 tuần | ⚠️ Cần audit từng game — có thể 3 tuần nếu có bug runtime |
| Phase 1 | 1–2 tuần | ⚠️ Thiếu: viết unit test + validation Zod thêm ~1 tuần |
| Phase 1.5 | song song | ❌ Không thể song song nếu chưa quyết định Supabase vs PG |
| Phase 2 | 1–2 tuần | ❌ Nên tách 2a/2b, mỗi cái 1 tuần |
| Phase 3 | 1 tuần | ⚠️ DDA cần A/B test framework — thiếu trong kế hoạch |
| Phase 4 | 2 tuần | ✅ Hợp lý nếu Phase 2 xong |
| Phase 5 | 2–3 tuần | ✅ Hợp lý |

**Tổng thời gian thực tế:** ~4–5 tháng (kế hoạch ngầm ~3 tháng)

---

## Bảng tổng hợp: Giữ / Sửa / Bổ sung

| Mục | Đánh giá | Hành động |
|---|---|---|
| Hướng "quan hệ là đơn vị huấn luyện" | ✅ Đúng | Giữ |
| 12 relation catalog | ✅ Đúng | Giữ |
| Phase 0 sửa tài liệu | ✅ Đúng | Thêm: rename `overallBrainAge`, audit scientificBasis |
| Phase 0.5 wire variants | ✅ Đúng | Thêm: audit SpeedPacerGame slug mismatch |
| Phase 1 events | ✅ Đúng | Thêm: Zod validation, schema versioning |
| Phase 1.5 persistence | ⚠️ Mờ | Sửa: quyết định Supabase vs PG; xử lý init-supabase.js |
| Phase 2 mastery | ⚠️ Dồn quá nhiều | Sửa: tách 2a / 2b |
| Phase 3 DDA | ✅ Đúng | Thêm: cần A/B test framework nhỏ |
| Auth strategy | ❌ Thiếu | Bổ sung: quyết định JWT vs Supabase Auth vs guest-only |
| `overallBrainAge` field | ❌ Thiếu | Bổ sung vào Phase 0 |
| `IUserExerciseMastery` migration plan | ❌ Thiếu | Bổ sung vào Phase 2a |
| Error boundary / offline-first | ❌ Thiếu | Bổ sung vào Phase 0.5 |
| QA baseline audit | ❌ Thiếu | Bổ sung vào Phase 0 |
| `init-supabase.js` xử lý | ❌ Thiếu | Làm rõ trong Phase 1.5 |

