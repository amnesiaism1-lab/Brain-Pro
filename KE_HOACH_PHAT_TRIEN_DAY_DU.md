# Kế hoạch phát triển đầy đủ — Brain-Pro (Cognitive Relationship Training)

**Phiên bản:** 2.0 (nâng cấp từ v1.0 — sau audit code thật)  
**Ngày:** 2026-09-23  
**Nguồn đánh giá gốc:** `đánh giá 1.txt` (đã chỉnh, bổ sung, siết cho khớp repo)  
**Repo:** `amnesiaism1-lab/Brain-Pro` — workspace `Brain exercises`  
**Nguyên tắc khoa học:** tách **metric game**, **proxy nhận thức**, **claim khoa học**. Không tuyên bố tăng IQ, tái cấu trúc synapse, hay "não phát triển X%".

Tài liệu này là bản **kế hoạch sản phẩm + kỹ thuật + curriculum** duy nhất. Đánh giá gốc giữ hướng đúng (quan hệ là đơn vị huấn luyện), nhưng còn lệch code, phóng đại README, và đề xuất quá nhiều thực thể cùng lúc. Bản này sửa những chỗ đó rồi triển khai thành lộ trình làm được.

> **v2.0 vs v1.0:** Giữ nguyên triết lý và kiến trúc. Bổ sung 5 nhóm vấn đề phát hiện qua audit code thật: (1) chiến lược Supabase/DB chưa quyết định, (2) trường `overallBrainAge` vi phạm chính sách copy, (3) auth hardcode không scale, (4) thiếu offline-first buffer, (5) thiếu schema versioning cho `rawMetricsJson`. Tách Phase 2 thành 2a/2b. Timeline thực tế điều chỉnh lên 4–5 tháng.

---

## 0. Cách dùng tài liệu này

| Người đọc | Đọc phần |
|---|---|
| Product / founder | 1, 2, 4, 5, 12, 15 |
| Engineer | 3, 6–11, 13–14, 16–18 |
| Designer | 5, 8, 10, 12 |
| QA | 11, 14, 16 |
| Viết copy / khoa học | 4.7, 15 |

**Không rewrite 19 game cùng lúc.** Xương sống 6 bài trước, 13 bài còn lại gắn vào cùng ontology.

---

## 1. Tóm tắt điều hành

Brain-Pro hiện là **bộ bài tập nhận thức + đọc nhanh** (React/Vite + NestJS in-memory + shared metadata 19 slug, level 1–12, mastery theo bài, synergy XP, workout theo thời lượng). Nó **chưa** là engine quan hệ nhận thức.

Hướng đúng (giữ từ đánh giá gốc):

> Game chỉ là giao diện biểu diễn. **Quan hệ** mới là đơn vị huấn luyện.

Hướng sai nếu làm nguyên si đánh giá gốc:

- Thêm 6 thực thể blocking trước khi có telemetry.
- Ép mọi bài thành 12 “tầng quan hệ” khác nhau dù logic thật mới tăng lưới/thời gian.
- Biến Green Dot thành modifier-only và mất bài độc lập cho người mới.
- Sinh game tự động (generative) quá sớm.

**Quyết định kiến trúc (ADR ngắn):**

1. **Quan hệ = catalog tĩnh trong `shared/`**, không phải 18 enum chồng chéo. Dùng **12 quan hệ gốc + composition**.
2. **Evidence trước, bảng mastery sau.** Phase 1 ghi `relationEvents[]` vào `rawMetricsJson`. Phase 2a tính EMA client. Phase 2b mới tách bảng SQL.
3. **Level 1–12 vẫn là bề mặt sản phẩm.** Bên dưới map sang **4 bậc phức tạp quan hệ** (Single → Noise/Speed → Dual/Conflict → Transfer/Compose).
4. **Synergy hiện tại (XP + gợi ý bài kế) giữ**, rồi thay dần bằng **chuỗi quan hệ + transfer score**.
5. **Backend TypeORM entities đã có nhưng AppModule không gắn DB.** Persistence thật là Phase 1.5, **và phải quyết định Supabase vs PostgreSQL trước khi bắt đầu Phase 1.5** — `init-supabase.js` (10.9KB) đã tồn tại trong repo nhưng chưa được gọi từ đâu.

**Quyết định kiến trúc mới (v2.0 — bắt buộc chốt trước Phase 1.5):**

6. **Auth strategy:** Chọn 1 trong 3 — (a) Supabase Auth, (b) JWT local NestJS, (c) Guest mode localStorage. `currentUser` hardcode `user-demo-1` không scale. Phải quyết định ở Phase 0.
7. **`overallBrainAge` rename sang `overallTrainingIndex`** trong `IUserCognitiveSnapshot` — field này vi phạm chính sách copy ngay trong type definition. Làm ở Phase 0.
8. **`rawMetricsJson` cần `schemaVersion`** từ Phase 1 để Phase 2b parse được data cũ: `{ schemaVersion: 'v1', relationEvents: [...] }`.
9. **`SpeedPacerGame.tsx` cần audit** — component tồn tại trong games/ nhưng `ExerciseSlug` chỉ có `'reading-pacer'`. Cần xác nhận slug mapping trước Phase 0.5.

Khi xương sống chạy, não người chơi (và hệ thống) nhìn thấy cùng một cấu trúc lặp lại ở nhiều ngữ cảnh: Position → Order → Sequence → Filter → Rule → Meaning.

---

## 2. Chẩn đoán repo hiện tại (sự thật vs tài liệu)

### 2.1 Stack thật

| Lớp | Hiện trạng |
|---|---|
| Frontend | React 18, Vite, Tailwind, Zustand (`useAppStore`), Lucide, 19 game component |
| Shared | Types + `EXERCISES_METADATA` level 1–12 + variants + synergies + content pool |
| Backend | NestJS, `DataStoreService` **in-memory**, demo user, attempts không bền |
| Entities TypeORM | Có file (`game_attempts`, users, routines…) nhưng **không import vào `AppModule`** |
| QA | Playwright suite trong `qa-automation/` |
| Deploy | Vercel monorepo (`vercel.json`) |

### 2.2 19 bài thực sự có trong code (slug)

`anagram`, `schulte-table`, `find-letter`, `find-number`, `even-odd`, `digit-span`, `rsvp-speed-reader`, `word-search`, `twin-words`, `peripheral-vision`, `green-dot`, `word-chunking`, `reading-assessment`, `reading-pacer`, `text-scanning`, `card-flip`, `stroop-clash`, `spatial-memory`, `saccade-tracker`.

### 2.3 README / spec đang phóng đại hoặc lệch

| Tài liệu nói | Code thật |
|---|---|
| Dual N-Back, MOT, Tháp Hà Nội, Mental Rotation | **Không có slug / component** |
| 15 bài | **19 slug** |
| `GAME_LOGIC_SPECIFICATION.md` DDA max level 8 | Metadata **12 level** |
| Ma trận 6 kỹ năng (tập trung, WPM, ức chế, vận nhãn, không gian) | Store/profile dùng **5 category**: Đọc nhanh, Thị giác, Tập trung, Trí nhớ, Phản xạ |
| Synergy “tăng 30% diện tích tiếp nhận” | Chỉ **bonus XP + toast + suggested next** |
| TypeORM + PostgreSQL production | Runtime **RAM**, mất dữ liệu khi restart |
| Find Number L10 `MATH_TARGET`, L11 sequence | `FindNumberGame.tsx` chỉ so khớp **số đích ngẫu nhiên**, tăng lưới |
| Even/Odd prime / pattern switch / dual sum | `EvenOddGame.tsx` chủ yếu số + invert + phương trình L≥10 |
| Profile radar | Snapshot **hardcode fallback** 84/88/79/90/85 nếu chưa có lịch sử |
| **[MỚI v2.0]** `overallBrainAge: number` | Field **vi phạm chính sách copy** ngay trong `IUserCognitiveSnapshot` |
| **[MỚI v2.0]** Auth multi-user | `currentUser = { id: 'user-demo-1' }` hardcode trong `DataStoreService` |
| **[MỚI v2.0]** `init-supabase.js` chưa rõ trạng thái | Script 10.9KB tồn tại nhưng **không được gọi từ đâu** trong codebase |

### 2.4 Những gì đã tốt (giữ)

- 19 game chơi được, HUD, result modal, workout step, dark mode.
- Level config JSON giàu ý tưởng (Gorbov, reverse span, stroop letter…).
- 8 synergy pair đã **đúng hướng cognitive** (Schulte↔Peripheral, Stroop↔EvenOdd, Digit↔Spatial, RSVP↔Assessment…).
- `rawMetricsJson` trên attempt — chỗ cắm evidence mà không phá schema.
- Schulte đã có mode: standard / gorbov / reverse / alphabet / fading / rotating, tâm ngắm.

### 2.5 Nợ kỹ thuật chặn cognitive engine

1. **Metadata ≠ runtime:** nhiều `variantCode` không được game đọc.
2. **Không có event per-trial:** chỉ score, accuracy, time ở store.
3. **Mastery theo slug**, không theo quan hệ, không transfer.
4. **Workout theo phút** (`QUICK_5M`…), không theo chuỗi quan hệ.
5. **Copy khoa học quá mạnh** trên synergies và README.
6. **Hai nguồn sự thật:** Zustand local vs API in-memory, dễ lệch.
7. **Không có lớp instrumentation chung** — mỗi game tự `recordAttempt` khác nhau (Schulte ghi trực tiếp, nhiều game qua `GameResultModal`).
8. **[MỚI v2.0] Auth hardcode:** `currentUser = { id: 'user-demo-1' }` — không scale được, không multi-device.
9. **[MỚI v2.0] `init-supabase.js` orphan:** migration script tồn tại nhưng không được gọi trong pipeline.
10. **[MỚI v2.0] `overallBrainAge`** field trong `IUserCognitiveSnapshot` vi phạm chính sách ngôn ngữ.
11. **[MỚI v2.0] `rawMetricsJson` không có schema version** — khi cấu trúc event thay đổi, data cũ không parse được.
12. **[MỚI v2.0] `SpeedPacerGame.tsx`** — slug mapping chưa được xác nhận khớp với `reading-pacer` trong ExerciseSlug.

### 2.6 Sửa đánh giá gốc — bảng quyết định

| Ý đánh giá gốc | Giữ / sửa / bỏ |
|---|---|
| Quan hệ là đơn vị huấn luyện | **Giữ** — đây là Bắc đẩu của sản phẩm |
| 18+ `CognitiveRelationType` | **Sửa** → 12 quan hệ gốc, alias map từ tên cũ |
| Chèn Cognitive Profile blocking giữa User và Exercise | **Sửa** → profile **suy ra** từ evidence, không chặn chơi |
| Level = 12 tầng quan hệ khác nhau mỗi bài | **Sửa** → 4 bậc, map lên 12 level; không bịa quan hệ nếu bài không mang |
| Green Dot không còn là game | **Sửa** → **cả hai:** drill độc lập + overlay modifier (flag) |
| Relation HUD + Brain Map | **Giữ**, nhưng HUD ẩn quan hệ ở L1–3, hiện sau attempt |
| Event instrumentation | **Giữ**, schema thống nhất |
| DDA theo relation yếu | **Giữ**, sau khi có ≥N evidence |
| Workout theo relation chain | **Giữ**, song song routine phút hiện tại |
| Generative challenges | **Hoãn** Phase 6; cần generator có test, không phải “ngày mai game mới” |
| Viết lại 19 game | **Bỏ** — spine 6 rồi nhánh |
| “Não hình thành mạng tốc độ cao” trong UI user | **Sửa copy** — nói “luyện cùng cấu trúc ở nhiều ngữ cảnh”, không nói sinh học |

---

## 3. Triết lý sản phẩm (State / Relation / Dynamics)

### 3.1 Ba lens bắt buộc trong mọi bài

| Lens | Câu hỏi | Ví dụ Schulte |
|---|---|---|
| **State** | Não/người chơi đang ở trạng thái nào? | Searching / Locked-on-center / Error-penalty / Recalling-faded |
| **Relation** | Thông tin nào liên kết thông tin nào? | Number→Position, Number→NextNumber |
| **Dynamics** | Khi state đổi, quan hệ nào phải cập nhật? | Click sai → Penalty; Gorbov đỏ xong → stream đen |

### 3.2 Câu hỏi hệ thống (thay “giỏi Schulte chưa?”)

1. Người chơi đã làm chủ **quan hệ nào** mà bài đang dùng?
2. Quan hệ đó đã xuất hiện ở **bao nhiêu ngữ cảnh (bài)**?
3. Đã **chuyển** sang bài khác chưa? (`transferScore`)
4. **Nút thắt** của mạng là edge nào? (yếu, hoặc chỉ local)

### 3.3 Đơn vị huấn luyện

```
CognitiveRelation (catalog)
    ↓ practiced via
Exercise × LevelConfig (surface)
    ↓ produces
Trial / Action (game UI)
    ↓ emits
RelationEvidence (events)
    ↓ updates
RelationshipMastery (node) + TransferEdge (cặp bài)
    ↓ drives
Adaptive policy + Workout chain + Brain Map
```

---

## 4. Ontology quan hệ — catalog chuẩn (12 gốc)

Không dùng song song `WHOLE_PART` và `PART_WHOLE`. Một chiều đủ; chiều ngược là **task polarity**.

### 4.1 Bảng catalog

| ID | Tên hiển thị (VI) | Định nghĩa vận hành | Bài xương sống |
|---|---|---|---|
| `TARGET_POSITION` | Mục tiêu → Vị trí | Ánh xạ một identity tới tọa độ | Schulte, Spatial, Find* |
| `ORDER_SEQUENCE` | Thứ tự → Chuỗi | A đứng trước B; next hợp lệ | Schulte, Digit, Spatial, Chunking |
| `IDENTITY_MATCH` | Đồng nhất | Hai token có cùng identity không | Twin Words L1, Card Flip |
| `SIMILARITY_DIFF` | Giống / Khác | So feature (hình, chữ, nghĩa) | Twin Words, Anagram, Find Letter |
| `TARGET_DISTRACTOR` | Tín hiệu / Nhiễu | Chấp nhận target, ức chế distractor gần | Find Letter/Number, Stroop letter |
| `RULE_ACTION` | Luật → Hành động | Stimulus + rule hiện tại → response | Even/Odd, Stroop |
| `INHIBITION` | Ức chế xung đột | Rule mới thắng habit | Stroop, Even invert, Gorbov |
| `PART_WHOLE` | Bộ phận → Khối | Ký tự/âm tiết → từ → cụm | Anagram, Word Search, Chunking |
| `FOCUS_FIELD` | Tâm → Ngoại vi | Giữ fixation, lấy thông tin quanh | Schulte, Green Dot, Peripheral, Saccade |
| `SPATIAL_TRANSFORM` | Biến đổi không gian | Xoay, lật, dual stream vị trí | Spatial, Card Flip, Rotating Schulte |
| `TEMPORAL_PREDICT` | Dự đoán thời gian | Token t tiên đoán t+1 | RSVP, Pacer, Digit |
| `CONTEXT_MEANING` | Ngữ cảnh → Nghĩa | Quan hệ nhân quả, đồng tham chiếu | Reading Assessment, Chunking cao |

`MULTI_RELATION` **không** là type gốc — là **cờ composition** khi level kích hoạt ≥2 ID cùng lúc.

### 4.2 Alias từ đánh giá gốc

`IDENTITY` → `IDENTITY_MATCH`  
`ORDER` / `SEQUENCE` / `TEMPORAL` → `ORDER_SEQUENCE` + `TEMPORAL_PREDICT`  
`POSITION` / `SPATIAL` → `TARGET_POSITION` / `SPATIAL_TRANSFORM`  
`CAUSE_EFFECT` / `CONTEXT` / `PREDICTION` → `CONTEXT_MEANING` / `TEMPORAL_PREDICT`  
`TRANSFORMATION` → `SPATIAL_TRANSFORM` hoặc `PART_WHOLE` tùy domain  
`DIFFERENCE` / `SIMILARITY` → `SIMILARITY_DIFF`

### 4.3 Thực thể nhận thức (không phải bảng SQL ngay)

Mọi trial gắn **entity instances**:

- `Token` (số, chữ, từ, màu, khối)
- `Slot` (ô lưới, vị trí Corsi, ORP)
- `Stream` (red vs black, visual vs auditory — dual)
- `Rule` (even, invert, name-the-color)
- `Goal` (find next, recall reverse, comprehend)

Quan hệ = cạnh có hướng giữa hai entity (hoặc entity–rule).

### 4.4 Chỉ số mastery mỗi quan hệ

```ts
interface IRelationshipMastery {
  relationId: RelationId;
  exposureCount: number;      // số evidence
  accuracy: number;           // 0–1, EMA
  medianResponseMs: number;
  stability: number;          // 1 - CV của accuracy cửa sổ gần
  localContexts: ExerciseSlug[];
  transferScore: number;      // 0–1, xem 7.3
  interferenceScore: number;  // độ rơi khi có conflict/rule-switch
  currentTier: 1 | 2 | 3 | 4; // map level bands
  updatedAt: string;
}
```

**Ngưỡng tối thiểu trước khi tin mastery:** `exposureCount >= 40` trial (không phải 2 session). Dưới đó hiển thị “đang thu thập”, không kết luận yếu/mạnh.

---

## 5. Bốn bậc phức tạp — map lên level 1–12

Áp dụng **mọi bài**, nhưng nội dung cụ thể khác nhau. Không bắt Schulte L12 phải là “novel composition xuyên domain” nếu UI không chịu nổi; L12 Schulte = dual-stream + fading **trong cùng bài**, transfer thật nằm ở **workout**.

| Bậc | Level | Chính sách quan hệ | UI |
|---|---|---|---|
| **I — Single** | 1–3 | 1 quan hệ chính, scaffold (hint, chậm, lưới nhỏ) | Có thể hiện 1 câu “đang luyện: Mục tiêu → Vị trí” |
| **II — Noise / Speed** | 4–6 | Cùng quan hệ + distractor / time pressure | Ẩn lý thuyết, chỉ hint khi sai lặp |
| **III — Dual / Reverse / Switch** | 7–9 | 2 quan hệ hoặc polarity đảo hoặc rule đổi | Không nói trước rule mới |
| **IV — Conflict / Transfer-ready** | 10–12 | Xung đột, ẩn, dual stream, hoặc rule quan hệ (không chỉ identity) | Debrief sau game: strong/weak relation |

DDA **không** chỉ `accuracy < 60 → level down`. Policy:

- Quan hệ yếu: **tăng exposure** bậc hiện tại (thêm trial, không nhất thiết hạ level).
- Quan hệ mạnh + ổn định: **thêm interference** (distractor giống hơn, invert, dual).
- Cả bài fail vì motor/time: hạ level bề mặt.
- Transfer thấp: đề xuất workout cầu (xem 9).

---

## 6. Kiến trúc kỹ thuật — tiến hóa, không big-bang

### 6.1 Hiện tại

```
User (Zustand demo)
  → Exercise metadata
    → LevelConfig
      → Game component
        → Attempt {score, accuracy, time}
          → exerciseMasteries[slug]
          → synergy toast
```

### 6.2 Đích (không phá đường chơi)

```
User
  → CognitiveProfile (derived)
  → RelationshipMasteryGraph
  → Exercise + LevelConfig.relationProfile
      → RelationshipChallenge (cùng UI game, khác constraint)
      → Game state machine
      → Attempt + RelationEvidence[]
      → Mastery + Transfer edges
      → Next challenge / chain workout
```

### 6.3 Module đề xuất (file)

**Shared**

- `shared/src/cognition/relations.ts` — catalog 12 ID, labels, mô tả
- `shared/src/cognition/exercise-relation-map.ts` — mỗi slug: primary, secondary, per-level
- `shared/src/cognition/evidence.ts` — `IRelationEvent`, validator
- `shared/src/cognition/mastery.ts` — EMA, tier, transfer
- `shared/src/cognition/dda-policy.ts` — input mastery → next level/constraints
- `shared/src/cognition/workouts-relation.ts` — chain templates

**Frontend**

- `hooks/useRelationSession.ts` — buffer events, flush vào `recordAttempt.rawMetricsJson`
- `components/cognition/RelationHud.tsx` — training/debrief
- `components/cognition/BrainMap.tsx` — graph profile
- `components/cognition/FocusOverlay.tsx` — Green Dot / fixation inject
- Chuẩn hóa mọi game gọi `emitRelationEvent` thay vì chỉ score

**Backend**

- Phase 1: nhận `rawMetricsJson.relationEvents`, validate độ dài
- Phase 1.5: bật TypeORM + `DATABASE_URL`, migrate entities hiện có
- Phase 2: bảng `relation_evidence`, `user_relation_mastery`, `relation_transfer_edges`
- `GET /analytics/brain-graph`
- `POST /workouts/recommend-chain`

### 6.4 Schema event (bắt buộc thống nhất) + schema versioning [v2.0]

```ts
interface IRelationEvent {
  t: number;                 // ms từ đầu trial
  exerciseSlug: ExerciseSlug;
  level: number;
  trialId: string;
  relationId: RelationId;
  relationWeight: number;    // 0–1, bài có thể nhấn 2 quan hệ
  entities: {
    target?: string;
    distractor?: string;
    position?: { r: number; c: number } | string;
    rule?: string;
  };
  stateBefore: string;
  stateAfter: string;
  responseMs?: number;
  correct: boolean;
  extra?: Record<string, unknown>; // similarity, expectedNext, etc.
}

// [MỚI v2.0] rawMetricsJson BẮT BUỘC có schemaVersion từ Phase 1
interface IRawMetricsJson {
  schemaVersion: 'v1';       // tăng khi IRelationEvent thay đổi breaking
  relationEvents: IRelationEvent[];
  [key: string]: unknown;    // game-specific metrics vẫn cho phép
}
```

Giới hạn: tối đa ~500 event/attempt hoặc downsample; không gửi heatmap pixel thô. **Backend middleware phải validate `relationEvents.length <= 500`.**

### 6.5 Persistence thứ tự

1. Local Zustand + `rawMetricsJson` (chơi không mất mạch).
2. **[MỚI v2.0] IndexedDB buffer khi offline** (`useOfflineSync.ts`) — không mất attempt khi mất mạng.
3. POST `/attempts` khi có mạng.
4. PostgreSQL / Supabase khi `DATABASE_URL` (entities đã viết sẵn, **nhưng cần quyết định provider ở Phase 0**).
5. Job nightly tính lại mastery (tránh tính nặng trên serverless request).

### 6.6 Auth strategy — phải chốt trước Phase 1.5 [MỚI v2.0]

| Option | Ưu | Nhược |
|---|---|---|
| **A — Supabase Auth** | Tích hợp `init-supabase.js` đã có, RLS miễn phí | Lock-in vendor |
| **B — JWT NestJS** | Control hoàn toàn, portable | Phải viết auth flow từ đầu |
| **C — Guest mode + localStorage** | Zero backend, ship nhanh | Không multi-device, mất data |

**Khuyến nghị:** Option A nếu `init-supabase.js` đang được dùng. Option C nếu muốn ship Phase 1 nhanh rồi nâng sau.

---

## 7. Engine mastery, transfer, DDA

### 7.1 Cập nhật mastery (EMA)

```
accuracy' = α * trialCorrect + (1-α) * accuracy
α = 0.08 mặc định (chậm, chống 1 session may rủi)
responseMs' = median cửa sổ 30 trial gần nhất
stability = 1 - stdev(accuracy_window) / max(mean, ε)
```

### 7.2 Interference

Khi `rule` đổi hoặc `similarity(target, distractor) > θ`:

```
interferenceScore' = β * (1 - correct) + (1-β) * interferenceScore
```

Stroop / Even invert / Gorbov là nguồn chính.

### 7.3 Transfer score

Với quan hệ R luyện ở bài A, đo ở bài B (B ≠ A, cùng R trong map):

```
transferScore(R) = mean_B( accuracy_B(R) / max(accuracy_A(R), ε) )  clamped 0–1
```

- Cao ở A, thấp ở B → **local mastery, chưa transfer** → workout cầu A→B→A'.
- Cao cả A và B → edge đồ thị dày trên Brain Map.

Cần tối thiểu 15 trial R trên B trước khi hiện “chưa chuyển ngữ cảnh”.

### 7.4 Policy DDA (thay GAME_LOGIC max 8)

Input: mastery các relation của **bài hiện tại**, không chỉ accuracy tổng.

| Tín hiệu | Hành động |
|---|---|
| Primary relation accuracy EMA < 0.70, exposure đủ | Giữ level, tăng scaffold (hint, chậm 10%) |
| Primary ≥ 0.90, stability ≥ 0.75, 2 session | Tăng level **hoặc** tăng `relationWeight` phụ |
| Secondary yếu, primary mạnh | Không hạ bài; bật constraint của secondary |
| Timeout / motor fail 2 lần | Hạ level bề mặt 1 |
| Transfer(R) < 0.5 với B đã chơi | Suggest chain, không nhốt user ở A |

Đồng bộ `calculateRecommendedNextLevel` trong shared với policy này; xóa mâu thuẫn “max 8”.

---

## 8. Curriculum từng bài — quan hệ, logic, UI

Quy ước cột **Code hôm nay**: hành vi `*.tsx` hiện tại. **Metadata**: `levelConfigs`. **Đích:** logic + UI cần làm.

### 8.1 Xương sống (làm trước)

#### A. Schulte Table — `schulte-table`

**Vai trò mạng:** `TARGET_POSITION` + `ORDER_SEQUENCE` + `FOCUS_FIELD` (+ `INHIBITION` Gorbov, `SPATIAL_TRANSFORM` rotating).

**Thực thể:** TargetNumber, Cell, CenterFixation, Neighbor, Order, Time, (RedStream, BlackStream).

**Code hôm nay:** Grid 3–7, mode theo level, tâm, phạt click sai, Gorbov/fading/rotating một phần. Dual center L12 metadata **chưa chắc runtime**.

**Progression hợp lý (không bịa dual-domain):**

| L | Quan hệ nhấn | Constraint | UI |
|---|---|---|---|
| 1 | TARGET_POSITION | 3×3, chậm, hiện số đang tìm | Tâm + “Tìm số đang sáng quan hệ: số → ô” |
| 2 | TARGET_POSITION | 4×4, distractor chính là ô khác | Tâm bắt buộc |
| 3 | ORDER_SEQUENCE | 5×5 chuẩn, next = current+1 | Hiện `17 → 18` nhỏ |
| 4 | ORDER + noise | 5×5 nhanh hơn | Ẩn next |
| 5 | FOCUS_FIELD | 6×6, phạt nếu hint trung tâm tắt? | Focus core rõ |
| 6 | TARGET_POSITION động | 6×6, optional shuffle 1 hàng sau 10s | Cảnh báo “vị trí đổi” |
| 7 | ORDER predict | Ghost next sai lệch? hoặc fading nhẹ | Ít chữ |
| 8 | Reverse polarity | reverseOrder metadata — **bắt buộc wire** | Không báo “ngược” quá sớm |
| 9 | INHIBITION dual stream | Gorbov đỏ↑ đen↓ | 2 rule chips sau tutorial 1 lần |
| 10 | SPATIAL_TRANSFORM | rotate interval | Lưới xoay, số gắn ô |
| 11 | Memory + position | fading / ghost distractors | Ô đã click biến mất |
| 12 | Dual stream spatial | dualGridMini **implement** hoặc 2 tâm trên 1 lưới | Hai fixation |

**Instrumentation:** mỗi click: `{target, position, expected, correct, responseMs, relationId}`. Click đúng sớm vs đúng muộn phân `ORDER_SEQUENCE` vs `TARGET_POSITION`.

**Không làm:** hai game độc lập trên một màn nếu hit area rối — dual center phải prototype.

#### B. Digit Span — `digit-span`

**Vai trò:** `ORDER_SEQUENCE` + `TEMPORAL_PREDICT` + recall state (`IDENTITY_MATCH` khi nhập).

**Code hôm nay:** tăng độ dài + flash; reverse ở config L8+.

**Đích:** **đừng chỉ tăng N.** Xen kẽ loại quan hệ.

| L | Quan hệ | Constraint |
|---|---|---|
| 1–3 | SEQUENCE xuôi | N=3–5, flash chậm |
| 4–6 | SEQUENCE dài + tốc độ | N=6–8 |
| 7 | Forward ↔ chuẩn bị reverse | N=9, 1 block reverse intro |
| 8–9 | Reverse = polarity ORDER | Wire `reverseMode` |
| 10 | Interleaved digit/letter | `INTERLEAVED_SPAN` — **viết runtime** |
| 11 | Transform before recall | +1 mỗi số hoặc operation-span nhẹ |
| 12 | Dual modal | số + chữ **hoặc** visual positions (cầu Spatial) — alphanumeric |

**UI:** encode phase (chuỗi), delay (trống), recall (numpad). Debrief: “gãy ở vị trí 4” = ORDER slot, không phải “trí nhớ kém”.

**Cấm:** N=15 sớm — Miller 7±2; N>9 chỉ khi reverse/transform, không phải flex độ dài.

#### C. Spatial Memory — `spatial-memory`

**Vai trò:** `TARGET_POSITION` + `ORDER_SEQUENCE` + `SPATIAL_TRANSFORM`.

**Cầu Schulte:** Schulte = number→position; Spatial = position→sequence. Workout bắt buộc `schulte → spatial`.

| L | Đích |
|---|---|
| 1–3 | Corsi xuôi, 3–5 khối |
| 4–6 | Dài hơn + ISI ngắn |
| 7–8 | Reverse tap |
| 9–10 | Path xoay 90° sau encode (transform) |
| 11–12 | Dual path hoặc số hiện trên khối rồi ẩn (chuỗi lai Digit) |

**UI:** lưới Corsi chuẩn, không trang trí che hit. Encode highlight tuần tự.

#### D. Find Letter — `find-letter`

**Vai trò:** `TARGET_DISTRACTOR` + `SIMILARITY_DIFF` + `FOCUS_FIELD`.

**Đích đo:** không chỉ “chậm”, mà chậm khi `similarity(target, distractor)` cao.

```ts
interface TargetDistractorEvent {
  target: string;
  distractor: string;
  similarity: number; // 0–1, bảng confusable A/R/P/B, O/Q/0
  responseMs: number;
  decision: 'hit' | 'fa' | 'miss';
}
```

| L | Constraint |
|---|---|
| 1–3 | Lưới nhỏ, distractor khác nét |
| 4–6 | Confusable set, mật độ target thấp |
| 7–8 | Lưới lớn / moving **nếu** implement được 60fps |
| 9 | Case-sensitive |
| 10 | Moving — chỉ bật nếu không gây say; fallback density |
| 11 | Dual target |
| 12 | Stroop color on letters — conflict `INHIBITION` |

**UI:** target pin trên HUD; không nhấp nháy toàn lưới.

#### E. Stroop Clash — `stroop-clash`

**Vai trò:** `RULE_ACTION` + `INHIBITION` + `IDENTITY_MATCH` (màu vs chữ).

| L | Rule |
|---|---|
| 1–3 | Congruent nhiều |
| 4–6 | Incongruent tăng |
| 7–8 | Switch “đọc chữ” / “nói màu” |
| 9–12 | Switch nhanh, dual task nhẹ |

**UI:** stimulus lớn, 4 nút màu; hiện rule pill. Event: congruent flag.

#### F. RSVP + Reading Assessment — `rsvp-speed-reader`, `reading-assessment`

**RSVP vai trò:** `TEMPORAL_PREDICT` + `PART_WHOLE` + (cao) `CONTEXT_MEANING`.

| L RSVP | Đích |
|---|---|
| 1–3 | word→word, 200–400 WPM, ORP đỏ |
| 4–6 | 500–700, ẩn pause |
| 7–8 | probe “từ vừa rồi?” (working memory) |
| 9–10 | chunk 2–3 từ / frame |
| 11–12 | sau 30–40 từ: 1 câu hỏi nghĩa |

**Assessment:** integration test mạng, **không** chỉ WPM + MCQ nông.

Câu hỏi bắt buộc có loại:

- Quan hệ nhân quả (A→B)
- Đồng tham chiếu / synonym (`SIMILARITY_DIFF` ngữ nghĩa)
- Thứ tự sự kiện (`ORDER_SEQUENCE`)
- Chi tiết vị trí trong đoạn (`TARGET_POSITION` trên text — scanning)

**Copy:** “điểm đọc” = proxy tốc độ + hiểu, không phải IQ.

---

### 8.2 Nhánh gắn mạng (sau spine)

#### G. Twin Words — `twin-words`

**Quan hệ:** `IDENTITY_MATCH` → `SIMILARITY_DIFF` (chữ, thứ tự, nghĩa).

Hôm nay: giống/khác 1 ký tự. **Đích level cao không chỉ giống/khác.**

| L | Câu hỏi ẩn |
|---|---|
| 1–3 | Same word? |
| 4–6 | Same letters, other order? |
| 7–8 | Orthographic near-miss tiếng Việt (dấu) |
| 9–10 | Same meaning khác surface (máy tính / computer) — cần pool |
| 11–12 | One transformation? (thêm 1 dấu, 1 letter) |

**Cầu:** Anagram, Word Search, Reading.

**UI:** 2 token, 2–4 nút theo level (Giống / Khác / Cùng nghĩa / Đảo chữ). L1 chỉ 2 nút.

#### H. Anagram — `anagram`

**Quan hệ:** `PART_WHOLE` (char→position→syllable→word).

Không chỉ scramble toàn bộ.

| L | Constraint |
|---|---|
| 1–3 | 3–5 chữ, hint |
| 4–6 | 6–8, không hint |
| 7–8 | Partial slots `T _ Í` |
| 9 | Phrase |
| 10 | Cascade timer |
| 11 | Partial reveal — **wire** |
| 12 | Semantic abstraction (cụm → viết tắt) chỉ khi có bank từ; không ép song ngữ nếu content yếu |

**UI:** tiles + slot; level cao ẩn 30% slot.

#### I. Find Number — `find-number`

**Lệch lớn:** metadata đã có `MATH_TARGET`, `SEQUENCE_FIND`, `VANISHING_GRID`; runtime chỉ identity match.

**Đích:** object matching → **relation matching**.

| L | Task |
|---|---|
| 1–2 | Find N |
| 3–4 | Find N 2 chữ số, lưới dày |
| 5–6 | Multiple hits cùng N |
| 7 | Mini sequence 3 số tăng |
| 8 | Density |
| 9 | Multi-digit identity |
| 10 | `divisibleBy` / `> 50` — **bắt buộc implement** |
| 11 | Sequence rule A, A+k |
| 12 | Compound: A < B, B = A+7 — UI phải hiện rule, không đoán mò |

**UI:** rule bar thay “số đích” khi L≥10.

#### J. Even/Odd — `even-odd`

**Quan hệ:** `RULE_ACTION` + `INHIBITION`.

Wire đủ: invert, prime (thận trọng — số nguyên tố >100 khó), equation, switch interval. **Bỏ dualSum nếu window 320ms không fair** — thay bằng hai số nhỏ.

**UI:** rule chip; flash đỏ = invert; đếm trial tới lần switch.

#### K. Green Dot — `green-dot`

**Hai vai trò:**

1. **Drill:** state machine Focused → Peripheral target → Maintain → Detect.
2. **Modifier:** `FocusOverlay` tiêm vào Schulte / RSVP / Chunking (setting “Khóa tâm ngắm”).

Không xóa bài khỏi catalog — người mới cần drill trống.

#### L. Peripheral Vision — `peripheral-vision`

`FOCUS_FIELD`. Tăng eccentricity, không tăng chaos. Synergy với Schulte: **cùng FOCUS_FIELD, khác surface**.

#### M. Word Search — `word-search`

`PART_WHOLE` + `TARGET_POSITION` + direction.

Level cao: không chỉ list word.

- Tìm pattern (mọi palindrome 3 chữ)
- Tìm semantic set (“thuộc chủ đề não”) — cần tagged lexicon

Cầu Reading / Chunking.

#### N. Word Chunking — `word-chunking`

`PART_WHOLE` + `CONTEXT_MEANING`.

the / quick / brown → the quick / brown fox → semantic chunk. User **gom node**, không đọc từng từ.

#### O. Reading Pacer — `reading-pacer`

Saccade rhythm + `TEMPORAL_PREDICT`. Synergy `saccade-tracker`. Highlight cửa sổ chạy, không RSVP một điểm.

#### P. Text Scanning — `text-scanning`

`TARGET_DISTRACTOR` trên prose. Cầu Word Search. Task: find fact, number, name.

#### Q. Card Flip — `card-flip`

`IDENTITY_MATCH` + `SPATIAL_TRANSFORM` + memory. Contrast Anagram (lexical vs spatial) — synergy giữ, **bỏ copy “cân bằng bán cầu”**.

#### R. Saccade Tracker — `saccade-tracker`

`FOCUS_FIELD` + `ORDER_SEQUENCE` điểm neo. Đo độ lệch click vs target, không đo mắt thật trừ khi webcam (Phase sau, optional, privacy).

---

### 8.3 Bài README hứa nhưng chưa có

| Bài | Quyết định |
|---|---|
| Dual N-Back | **Phase 5** — quan hệ `IDENTITY_MATCH` + `ORDER_SEQUENCE` dual stream; rất hợp graph. Không ghi README như đã có. |
| MOT | Hoãn — nặng render |
| Tower of Hanoi | Hoãn — planning graph riêng (`RULE_ACTION` đa bước) |
| Mental Rotation | Có thể **gộp constraint** vào Spatial L9–10 thay game mới |

Cập nhật README cho khớp 19 slug + engine quan hệ, xóa feature giả.

---

## 9. Workout: chuỗi quan hệ (song song routine phút)

Giữ `QUICK_5M` / `REGULAR_10M`… cho người lười chọn.

Thêm **Relation Chain Workouts** (code mới):

### FOCUS → ORDER → MEMORY

1. Green Dot 45s (`FOCUS_FIELD`)
2. Schulte L hiện tại (`TARGET_POSITION`, `ORDER`)
3. Digit Span (`ORDER_SEQUENCE`)
4. Spatial Memory (`POSITION`+`SEQUENCE`)

Não lặp: focus → locate → order → encode → retrieve.

### FILTER → RULE → ACTION

1. Find Letter
2. Stroop
3. Even/Odd

signal → filter → interpret → inhibit → act.

### VISUAL → LEXICAL → SEMANTIC

1. Schulte
2. Word Search
3. Word Chunking
4. RSVP
5. Reading Assessment

location → symbol → word → chunk → meaning.

### TRANSFER BRIDGE (engine)

Nếu `TARGET_POSITION` cao ở Schulte, thấp ở Spatial:

```
Schulte 45s → Spatial 60s → Schulte fading 45s → Spatial reverse 60s
```

Hiển thị: “Cùng quan hệ Mục tiêu → Vị trí, đổi ngữ cảnh.”

---

## 10. UI / UX hệ thống

### 10.1 Relation HUD (thay dần synergy toast)

**Trong game (L≥4 thu gọn):**

```
RELATION TRAINING
● Locate  →  ● Order  →  ○ Recall
```

L1–3: một dòng scaffold. L7+: HUD tối giản, chỉ fixation.

**Sau game (debrief bắt buộc spine):**

- Đã luyện: danh sách relation + weight
- Mạnh / yếu (nếu đủ sample)
- Nút “Luyện đúng điểm yếu” → challenge cùng bài, constraint secondary

### 10.2 Synergy

Giữ toast XP ngắn hạn. Thêm dòng: “Cùng củng cố `INHIBITION`” thay vì “tăng 30% diện tích võng mạc”.

### 10.3 Brain Map (Profile)

Không xóa radar 5 trục ngay — **tab 1:** 5 category (tương thích). **Tab 2:** graph 12 node.

- Node sáng = mastery
- Cạnh dày = đã luyện R ở ≥2 bài, transfer ≥ ngưỡng
- Cạnh mờ = local only
- Click node → bài nào đóng góp

Không dùng “brain age” như claim y khoa; nếu giữ số, gọi **“chỉ số luyện tập”**.

### 10.4 Exercise Detail

Thêm khối “Quan hệ chính / phụ”, “Bài nối (transfer)”, ẩn jargon với beginner (tooltip).

### 10.5 Accessibility

Hit target ≥44px, không chỉ màu (Gorbov đỏ/đen cần shape/label), pause, giảm motion cho rotating/moving grid.

### 10.6 Mobile

Schulte 7×7 trên điện thoại: mode “ô lớn hơn / lưới cuộn cấm” — giảm max grid trên viewport hẹp, bù bằng time pressure (quan hệ giữ, surface đổi).

---

## 11. Đối chiếu metadata ↔ runtime (việc phải wire)

Ưu tiên kỹ thuật **trước khi** thêm quan hệ mới: **làm đúng biến thể đã viết**.

| Slug | Config đã có, runtime thiếu/yếu |
|---|---|
| find-number | MATH_TARGET, SEQUENCE_FIND, VANISHING_GRID |
| even-odd | primeMode, switchInterval, dualSum (review fairness) |
| digit-span | interleaved, operation, alphanumeric |
| anagram | PARTIAL_REVEAL, CROSS_LANGUAGE |
| find-letter | moving, dualTarget, stroopColor |
| schulte | dualGridMini L12, ghostDistractors |
| rsvp | probe câu hỏi L cao |
| twin-words | semantic pair |

Đây là Phase 0.5 — **rẻ hơn** viết engine generative.

---

## 12. Lộ trình triển khai (acceptance rõ)

### Phase 0 — Chỉnh sự thật tài liệu + quyết định chiến lược (1 tuần)

- [ ] README khớp 19 bài, bỏ N-Back/MOT/Hanoi như "đã có"
- [ ] `GAME_LOGIC_SPECIFICATION.md`: DDA 12 level, policy tạm thời
- [ ] Soften copy synergy / scientificBasis quá mạnh trong `shared/src/constants/index.ts`
- [ ] ADR ngắn trong repo: "Relation catalog 12"
- [ ] **[MỚI v2.0]** Rename `IUserCognitiveSnapshot.overallBrainAge` → `overallTrainingIndex` trong `shared/src/types/index.ts`
- [ ] **[MỚI v2.0]** Audit và soften `scientificBasis` của 19 bài — loại bỏ anatomy giả ("Wernicke và Broca", "synapse"...)
- [ ] **[MỚI v2.0]** Quyết định auth strategy: Supabase Auth / JWT NestJS / Guest mode — ghi vào ADR
- [ ] **[MỚI v2.0]** Quyết định DB provider: Supabase / PostgreSQL tự host — xác định `init-supabase.js` có dùng không
- [ ] **[MỚI v2.0]** Audit `SpeedPacerGame.tsx` — xác nhận slug, xóa nếu orphan, document nếu alias
- [ ] **[MỚI v2.0]** Audit QA baseline: Playwright hiện test gì, viết inventory coverage

**Xong khi:** người mới clone không bị hứa feature giả. Auth và DB strategy được document trong ADR. `overallBrainAge` không còn trong codebase.

### Phase 0.5 — Wire variants xương + fix runtime lệch (2–3 tuần)

- [ ] Find Number rule matching L10–12 (`MATH_TARGET`, `divisibleBy`)
- [ ] Digit reverse/interleave tối thiểu (wire `reverseMode`)
- [ ] Even/Odd switch + invert đã công bằng
- [ ] Schulte L8 reverse + L12 dual **hoặc** cắt metadata cho khớp
- [ ] **[MỚI v2.0]** `SpeedPacerGame.tsx` slug fix / cleanup
- [ ] **[MỚI v2.0]** Error boundary: fallback khi backend không available
- [ ] **[MỚI v2.0]** Offline-first skeleton: `useOfflineSync` buffer cơ bản (IndexedDB)

**Xong khi:** chơi L10 Find Number không còn "tìm đúng một số". Restart backend không crash frontend.

### Phase 1 — Catalog + evidence + validation (2–3 tuần)

- [ ] 12 relation IDs + map 19 slug (primary/secondary/per-level) trong `shared/cognition/`
- [ ] `IRelationEvent` với `schemaVersion: 'v1'` — **bắt buộc có version tag**
- [ ] **[MỚI v2.0]** Zod schema cho `IRelationEvent` — validate trên cả frontend và backend
- [ ] `useRelationSession` — buffer events, flush vào `rawMetricsJson` đúng chuẩn `IRawMetricsJson`
- [ ] Spine 6 game emit events (Schulte, Digit, Spatial, FindLetter, Stroop, RSVP)
- [ ] `rawMetricsJson.relationEvents` lưu attempt
- [ ] Unit test: validator event, schema version parsing
- [ ] **[MỚI v2.0]** Backend middleware: reject `relationEvents.length > 500`

**Xong khi:** 1 session Schulte sinh JSON evidence đúng schema, không vỡ UI. Backend reject event batch quá lớn.

### Phase 1.5 — Persistence (song song)

- [ ] Bật TypeORM khi có `DATABASE_URL`, fallback RAM
- [ ] Auth thật hoặc rõ “local profile”
- [ ] Sync attempts

**Xong khi:** restart server không mất history nếu có DB.

### Phase 2a — Mastery graph on client (1–2 tuần)

- [ ] Tính EMA mastery từ events trong Zustand / shared util
- [ ] `relationshipMasteries` trong store (song song với `exerciseMasteries` — không xóa cũ)
- [ ] **[MỚI v2.0]** Migration plan: `exerciseMasteries` tiếp tục hoạt động trong Phase 2a
- [ ] Debrief UI strong/weak
- [ ] Không kết luận khi `exposureCount < 40`

**Xong khi:** profile hiện 12 thanh (hoặc graph thô) khác 5 radar, không phá mastery level cũ.

### Phase 2b — Mastery graph on server (1–2 tuần, sau Phase 1.5)

- [ ] Bảng SQL: `relation_evidence`, `user_relation_mastery`, `relation_transfer_edges`
- [ ] `GET /analytics/brain-graph`
- [ ] `POST /workouts/recommend-chain`
- [ ] Job nightly tính lại mastery

**Xong khi:** Brain Map phản ánh data server, không chỉ Zustand local.

### Phase 3 — Relation DDA (1 tuần)

- [ ] Thay/gộp `calculateRecommendedNextLevel`
- [ ] Constraint flags trong `parametersJson` theo relation yếu
- [ ] Auto-difficulty dùng policy mới

**Xong khi:** primary 95% / order 65% không hạ cả bài Schulte mà tăng trial ORDER.

### Phase 4 — Transfer + chain workouts (2 tuần)

- [ ] `transferScore`
- [ ] 3 chain cố định + 1 bridge động
- [ ] HUD chuỗi ●○
- [ ] Gợi ý next theo relation, synergy XP vẫn cộng

**Xong khi:** user yếu Spatial sau Schulte giỏi được đề xuất bridge.

### Phase 5 — Brain Map + nhánh games emit events (2–3 tuần)

- [ ] Graph UI
- [ ] 13 bài còn lại emit (không cần rewrite luật hết)
- [ ] Dual N-Back **nếu** resource — hoặc backlog
- [ ] Green Dot overlay flag

**Xong khi:** cạnh graph phản ánh chơi thật.

### Phase 6 — Generative challenges (nghiên cứu)

Chỉ khi Phase 4 ổn định:

- Entity generator + relation + state + constraint
- Mọi challenge generated phải qua **test metamorphic** (đã có phôi trong qa-automation)
- Feature flag `GEN_CHALLENGES`
- Không thay catalog 19 bài

### Phase 7 — Nội dung & khoa học

- [ ] Pool Twin Words semantic VI/EN
- [ ] Câu hỏi assessment theo loại quan hệ
- [ ] Trang “Cách chúng tôi đo” — proxy vs khoa học
- [ ] Privacy: không eye-tracking mặc định

---

## 13. Kế hoạch file-level (checklist engineer)

```
shared/src/cognition/*
shared/src/types/index.ts          # RelationId, events, mastery
shared/src/constants/index.ts      # relationProfile trong mỗi exercise HOẶC file map tách
shared/src/utils/*                 # DDA mới, scoring không đổi công thức điểm hiển thị vội
backend/src/modules/cognition/     # mới
backend/src/database/entities/     # relation_*.entity.ts Phase 2
backend/src/app.module.ts          # TypeORM optional
frontend/src/hooks/useRelationSession.ts
frontend/src/components/cognition/*
frontend/src/components/games/*    # emit; wire variants
frontend/src/components/profile/BrainMap.tsx
frontend/src/store/useAppStore.ts  # relationshipMasteries
qa-automation/tests/...            # debrief, DDA, find-number rules
README.md, GAME_LOGIC_SPECIFICATION.md, ENTITY_RELATIONSHIPS_ANALYSIS.md
```

Cập nhật `ENTITY_RELATIONSHIPS_ANALYSIS.md`: thêm thực thể cognitive **sau** khi bảng SQL tồn tại, không vẽ PlantUML giả trước code.

---

## 14. QA và chấp nhận

### 14.1 Hạng mục

- Regression: 19 game start/finish/recordAttempt
- Find Number L10: click theo rule, không theo identity nếu rule ≠ identity
- Event schema: mọi spine attempt có `relationEvents.length > 0`
- DDA: fixture mastery → expected constraint
- Transfer: synthetic data A high B low → recommend chain
- A11y: Gorbov không chỉ màu
- Mobile Schulte grid
- Copy: grep cấm “tăng IQ”, “synapse”, “30% diện tích võng mạc”

### 14.2 Dùng qa-automation hiện có

Mở rộng oracle: không chỉ URL; assert HUD, rule bar, debrief keys.

---

## 15. Chính sách ngôn ngữ khoa học (bắt buộc)

| Được nói | Không được nói |
|---|---|
| Luyện cùng cấu trúc (thứ tự, nhiễu, luật) ở nhiều bài | Tăng IQ / EQ |
| Thời gian phản hồi, độ chính xác, transfer giữa bài | Tái lập mạch thần kinh / dopamine X% |
| Proxy chú ý, trí nhớ làm việc **trong task** | Chẩn đoán ADHD, Alzheimer |
| Dựa trên paradigm (Schulte, Corsi, Stroop, Digit Span) | “Chuẩn vàng y khoa” nếu không có validation lâm sàng |

`scientificBasis` trong metadata: viết **paradigm + kỹ năng task**, không anatomy giả.

---

## 16. Rủi ro và giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Ontology quá lớn, không ai implement | 12 ID cố định, cấm thêm type 6 tháng |
| Event làm lag | batch, cap 500, worker |
| User thấy HUD như bài giảng | Ẩn L1–3, debrief sau |
| Metadata tiếp tục dối runtime | Test: mỗi `variantCode` phải có branch hoặc bị xóa |
| Generative rác | Phase 6 flag + tests |
| Claim pháp lý sức khỏe | Policy copy Phase 0 |
| Dual center Schulte không chơi được | Prototype; fallback 1 tâm + 2 sequences màu |
| **[MỚI]** `init-supabase.js` không sync với TypeORM entities | Audit và quyết định 1 migration source — không dùng song song |
| **[MỚI]** 2 mastery systems conflict (`exerciseMasteries` vs `relationshipMasteries`) | Song song Phase 2a, không xóa cũ; UI tab tách |
| **[MỚI]** `rawMetricsJson` schema vỡ khi update | `schemaVersion` field bắt buộc từ Phase 1 |
| **[MỚI]** DDA mới làm user cảm giác "reset" progression | Feature flag + A/B test, không hard-replace policy cũ ngay |
| **[MỚI]** Offline attempt bị mất khi mất mạng | `useOfflineSync` IndexedDB buffer từ Phase 0.5 |

---

## 17. Mạng lưới đích (sản phẩm, không phải sinh học)

```
                 CONTEXT_MEANING
                    /        \
        TEMPORAL_PREDICT    PART_WHOLE
               |                 |
        ORDER_SEQUENCE         SIMILARITY_DIFF
               |                 |
        TARGET_POSITION ---- TARGET_DISTRACTOR
               |                 |
         FOCUS_FIELD          RULE_ACTION
               |                 |
         SPATIAL_TRANSFORM    INHIBITION
                                  |
                            IDENTITY_MATCH
```

- Mỗi game **chạm một vùng**, không cần phủ hết.
- Workout **nối vùng**.
- Attempt = evidence.
- Mastery cập nhật node + cạnh.
- Adaptive chọn relation yếu hoặc chưa transfer.

---

## 18. Thứ tự làm trong repo (siết từ đánh giá gốc)

1. Sự thật tài liệu + copy  
2. Wire variants lệch (Find Number, Digit, Even/Odd, Schulte L8/L12)  
3. CognitiveRelation catalog 12  
4. RelationshipMastery derived  
5. RelationEvidence trên spine  
6. Relation-aware DDA  
7. Cross-game transfer + chain workouts  
8. Relation HUD + Brain Map  
9. Emit events các nhánh + Green Dot overlay  
10. Dual N-Back (optional)  
11. Generative challenges (flag)  
12. Metric/reporting khoa học  

Xương sống:

```
Schulte → Digit Span → Spatial Memory → Find Letter → Stroop → RSVP/Assessment
Position → Order → Sequence → Memory → Target/Distractor → Rule/Inhibition → Prediction → Meaning
```

Nhánh: Word Search, Anagram, Twin Words, Chunking, Saccade, Peripheral, Green Dot, Card Flip, Pacer, Text Scanning, Find Number, Even/Odd.

---

## 19. Định nghĩa xong sản phẩm (Definition of Done tổng)

Não **trong sản phẩm** nghĩa là: người dùng lặp lại **cùng quan hệ** ở **nhiều bề mặt**, hệ thống **đo được** chỗ gãy (vị trí, nhiễu, luật, nghĩa), và **đề xuất** bài kế theo cạnh yếu — không phải thêm mini-game.

DoD kỹ thuật:

- 6 spine emit evidence  
- 12 mastery hiển thị trung thực (kèm cỡ mẫu)  
- ≥1 transfer bridge chạy  
- Metadata L9–12 của spine khớp runtime  
- README không còn feature ma  
- Copy không claim y khoa  

DoD trải nghiệm:

- Chơi xong Schulte hiểu “mình chậm khi tìm số **kế tiếp**, không phải khi thấy số”  
- Được mời Spatial vì cùng vị trí, khác luật nhớ  
- Profile graph sáng đúng chỗ đã luyện  

---

## 20. Phụ lục A — Map slug → quan hệ (v1)

| Slug | Primary | Secondary |
|---|---|---|
| schulte-table | TARGET_POSITION | ORDER_SEQUENCE, FOCUS_FIELD, INHIBITION |
| digit-span | ORDER_SEQUENCE | TEMPORAL_PREDICT, IDENTITY_MATCH |
| spatial-memory | TARGET_POSITION | ORDER_SEQUENCE, SPATIAL_TRANSFORM |
| find-letter | TARGET_DISTRACTOR | SIMILARITY_DIFF, FOCUS_FIELD |
| find-number | TARGET_DISTRACTOR | ORDER_SEQUENCE, RULE_ACTION |
| stroop-clash | INHIBITION | RULE_ACTION, IDENTITY_MATCH |
| even-odd | RULE_ACTION | INHIBITION |
| rsvp-speed-reader | TEMPORAL_PREDICT | PART_WHOLE, CONTEXT_MEANING |
| reading-assessment | CONTEXT_MEANING | TEMPORAL_PREDICT, ORDER_SEQUENCE |
| reading-pacer | TEMPORAL_PREDICT | FOCUS_FIELD |
| word-chunking | PART_WHOLE | CONTEXT_MEANING |
| word-search | PART_WHOLE | TARGET_POSITION |
| text-scanning | TARGET_DISTRACTOR | CONTEXT_MEANING |
| twin-words | IDENTITY_MATCH | SIMILARITY_DIFF |
| anagram | PART_WHOLE | ORDER_SEQUENCE |
| green-dot | FOCUS_FIELD | TARGET_DISTRACTOR |
| peripheral-vision | FOCUS_FIELD | TARGET_POSITION |
| saccade-tracker | FOCUS_FIELD | ORDER_SEQUENCE |
| card-flip | IDENTITY_MATCH | SPATIAL_TRANSFORM, TARGET_POSITION |

---

## 21. Phụ lục B — Trạng thái game gợi ý (Dynamics)

Dùng string ổn định để analytics:

`idle | encoding | searching | fixating | deciding | inhibited_conflict | recalling | predicting | penalized | debrief`

Mỗi chuyển phải gắn `relationId` khi có quyết định.

---

## 22. Phụ lục C — Công thức điểm hiển thị

**Không đổi** công thức XP/score người chơi thấy trong Phase 1–2 (tránh cảm giác “reset tiến trình”). Relation engine chạy **song song**. Phase 3 có thể thêm bonus nhỏ `relationCombo` đã giải thích trên UI.

Giữ:

```
Score = (BasePoints × Level × Accuracy%) + max(0, (TimeLimit − TimeSpent) × 10 × Level)
```

cho đến khi A/B test.

---

## 23. Phụ lục D — Câu debrief mẫu (VI)

- “Bạn gắn **số → ô** tốt, nhưng chậm khi phải biết **số kế tiếp** là gì.”
- “Bạn lọc chữ mục tiêu khỏe khi chữ nhiễu **khác nét**; yếu khi nhiễu **cùng họ hình** (R/A/P).”
- “Luật chẵn/lẻ ổn; khi luật **đảo** (viền đỏ), bạn còn bấm theo thói quen.”
- “Chuỗi số xuôi ổn; **nhập ngược** gãy — cùng trí nhớ, khác quan hệ thứ tự.”
- “Schulte tốt nhưng Corsi yếu: vị trí chưa **chuyển ngữ cảnh**.”

---

## 24. Phụ lục E — Timeline thực tế v2.0 [MỚI]

| Phase | Tên | Thời gian ước tính |
|---|---|---|
| 0 | Sự thật tài liệu + quyết định chiến lược | 1 tuần |
| 0.5 | Wire variants + offline-first skeleton | 2–3 tuần |
| 1 | Catalog + evidence + Zod validation | 2–3 tuần |
| 1.5 | Persistence thật (song song Phase 1, phụ thuộc quyết định Phase 0) | 2 tuần |
| 2a | Mastery on client | 1–2 tuần |
| 2b | Mastery on server | 1–2 tuần |
| 3 | Relation DDA + feature flag A/B | 1–2 tuần |
| 4 | Transfer + chain workouts | 2 tuần |
| 5 | Brain Map + nhánh emit | 2–3 tuần |
| 6+ | Generative / content / science | TBD |
| **Tổng** | | **~4–5 tháng** |

> v1.0 ước ~3 tháng — underestimate do không tính audit SpeedPacer, Zod validation, auth flow, offline buffer, Phase 2 tách đôi.

---

## 25. Phụ lục F — Audit checklist trước Phase 1.5 [MỚI]

Các quyết định PHẢI được chốt trước khi bắt đầu bất kỳ code Phase 1.5 nào:

- [ ] **DB provider:** Supabase / PostgreSQL tự host
- [ ] **Auth strategy:** Supabase Auth / JWT NestJS / Guest mode
- [ ] **`init-supabase.js`:** dùng làm migration source chính thức, hay viết TypeORM migrations mới
- [ ] **`SpeedPacerGame.tsx`:** slug xác nhận là `reading-pacer`, hay component orphan
- [ ] **QA baseline:** list test cases hiện có trong `qa-automation/`

---

*Hết kế hoạch v2.0. Đánh giá gốc `đánh giá 1.txt` giữ làm tài liệu ý tưởng. Kế hoạch v1.0 giữ trong git history. Tài liệu này là nguồn sự thật để triển khai.*
