# Kế hoạch: thuộc tính · thực thể · quan hệ âm nhạc còn thiếu

**Phiên bản:** 1.0  
**Ngày:** 2026-09-25  
**Nguồn:** `đánh giá 1.txt` + `implementation_plan3.md` + `KE_HOACH_PHAT_TRIEN_DAY_DU.md` + ADR-001 (12 quan hệ) + metadata 6 slug `cat-6`  
**Nguyên tắc:** không nở catalog thực thể. Quan hệ vẫn 12 gốc. Game mới tối đa **1 slug**. Còn lại = thuộc tính trên `AudioEvent` + variant/tier của 6 bài đã có.

---

## 0. Câu trả lời ngắn

**Có.** Đánh giá 1 đã chỉ đúng 4 miền chưa chạm (điệu thức/chuyển điệu/bồi âm; phách–tempo–nhịp hòa âm; động lực–phối khí; kết cấu–hình thức). Đó vẫn chưa phải bản đồ đầy đủ các **thành phần chính của âm nhạc**.

Còn thiếu chủ yếu vì đánh giá 1 nhìn theo *miền cảm âm*, còn nhạc lý nhìn theo *tham số âm thanh + tổ chức nhạc*. Hai lớp đó không trùng hết.

Ba kết luận để phát triển:

1. **Không thiếu thực thể DB mới.** Thiếu **thuộc tính trên sự kiện âm thanh** và **quan hệ giữa các lớp nhạc** (giai điệu ↔ hòa âm ↔ nhịp ↔ kết cấu).
2. **Không thiếu enum quan hệ mới.** 12 quan hệ ADR đủ. Thiếu **cặp (thực thể nhạc × quan hệ × thực thể nhạc)** chưa được gán vào bài.
3. **Không ship 10 game mới.** Gắn thuộc tính vào 6 slug hiện có; chỉ mở **1 slug** nếu làm Voice tracking (Stroop thính giác) vì nó không phải biến thể trung thực của bài nào đang có.

---

## 1. Ontology: đừng nhầm 3 tầng

| Tầng | Là gì | Ví dụ | Lưu ở đâu |
|---|---|---|---|
| **Thực thể nhạc** (domain object) | Đối tượng người nghe *chỉ vào được* | Nốt, nghỉ, phách, ô nhịp, quãng, hợp âm, bè, câu, đoạn, điệu thức, tempo | Generator + `answerKey`, không phải bảng SQL |
| **Thuộc tính** (HAS-A) | Giá trị trên một thực thể | midi, cents, vel, dur, pan, voice, articulation, accent | `AudioEvent` |
| **Quan hệ nhận thức** (ADR) | Não phải giữ liên kết nào | `PART_WHOLE`, `TARGET_DISTRACTOR`, `TEMPORAL_PREDICT`, `CONTEXT_MEANING`… | `exercise-relation-map.ts` + `relationEvents[]` |

`ENTITY_RELATIONSHIPS_ANALYSIS.md` là ERD *sản phẩm* (user, attempt, exercise). **Không** nhét `Chord` / `Mode` thành bảng PostgreSQL. Nhạc là stimulus sinh ra, log trial là đủ.

---

## 2. Bản đồ phủ hiện tại (6 bài × thành phần nhạc)

Sáu slug: `pitch-recall`, `interval-identify`, `rhythm-recall`, `chord-identify`, `timbre-match`, `sound-localization`.

| Thành phần chính | Đã có (metadata / plan3 / engine) | Đánh giá 1 đề xuất | **Vẫn trống** |
|---|---|---|---|
| Cao độ tuyệt đối / chuỗi nốt | pitch-recall | — | — |
| Cao độ tương đối (quãng) | interval-identify | — | — |
| Đường nét giai điệu (contour) | plan3 đổi ∞-II → Parsons U/D/R | — | Runtime chưa có |
| Điệu thức / màu thang âm | chord ∞-VIII Modal Harmony (plan3) | Mode color | Tonic finding, bậc thang âm, nốt ngoại điệu |
| Chuyển điệu | — | Modulation detection | Tonicization (V/V) nhỏ hơn modulation |
| Bồi âm / hài âm | timbre L9 missing harmonic; engine additive | Overtone spotting | Expose từng partial có thể bật/tắt |
| Nhịp / IOI / syncopation / swing / polyrhythm | rhythm-recall + plan3 | — | — |
| **Phách / meter / phase** (đâu là beat 1) | plan3 ∞-II time signature | Meter feel | Pickup/anacrusis, half-time vs double-time |
| Tempo / accelerando | rhythm L11 TEMPO_WARP | JND BPM, accel/rit | Rubato (co giãn rồi về tempo) |
| Nhịp hòa âm | — | Harmonic rhythm | — |
| Âm sắc / lọc / ADSR / detune | timbre-match | — | — |
| **Động lực (loudness contour)** | `velocity` trong engine, **không có bài** | Dynamic contour | Accent vs crescendo vs terraced dynamics |
| Phối khí (timbre × chord tone) | — | Orchestration spotting | — |
| Hợp âm chất / đảo / jazz | chord-identify | — | — |
| Cadence / tiến trình | chord L11 PROGRESSION_CADENCE | Cadence types | Voice leading, root motion, spacing |
| Không gian / ITD | sound-localization | — | — |
| **Nghỉ / im lặng** | không | không | Rest as entity |
| **Cách phát âm (articulation)** | ADSR = envelope synth, khác legato/staccato nhạc | không | Staccato / legato / tenuto / slur |
| **Kết cấu (số bè, homophony/polyphony)** | polyphonic echo = nhớ chuỗi, không theo dõi bè | Voice tracking | Density, pedal/drone, ostinato |
| Hình thức câu | — | Phrase symmetry | Motive transform (đảo, nghịch đảo, kéo nhịp) |
| Hòa âm ngầm | — | — | Implied harmony từ giai điệu |
| Intonation / just vs 12-TET | plan3 microtonal + enharmonic trap | — | Beating / comma (nâng cao) |
| Groove microtiming | swing ratio plan3 | — | Laid-back vs rushed (cùng pattern) |

---

## 3. Những thành phần chính còn sót (ngoài đánh giá 1)

Đây là phần “còn sáng tạo được gì” — **không trùng** 4 miền đánh giá 1, hoặc chỉ chạm mép.

### 3.1 Im lặng (Rest) — thực thể bị bỏ quên nhất

Âm nhạc = nốt **và** chỗ không nốt. Hiện generator chỉ nghĩ onset.

| Bài tập | Quan hệ | Gắn vào |
|---|---|---|
| **Rest spotting:** chuỗi nốt đều, một slot bị cắt — bấm đúng ô nghỉ | `IDENTITY_MATCH` + `INHIBITION` (không bấm khi có nốt) | `rhythm-recall` variant |
| **Negative space:** hai pattern cùng onset, khác chỗ nghỉ — chọn pattern nào có nghỉ dài hơn | `SIMILARITY_DIFF` | `rhythm-recall` |
| **Gap filling:** nốt bị che noise; hỏi cao độ bị che (analog phonemic restoration) | `CONTEXT_MEANING` + `PART_WHOLE` | `pitch-recall` tier |

### 3.2 Articulation ≠ ADSR

`timbre-match` L7 `adsrProfiles` là *hình dạng envelope của một tiếng synth*. Articulation nhạc là *cách nối các nốt trong câu*: staccato, legato, portato, accent, tenuto.

| Bài tập | Quan hệ | Gắn vào |
|---|---|---|
| Nghe 4 nốt cùng pitch/rhythm, khác articulation — chọn nhãn | `SIMILARITY_DIFF` | `timbre-match` (thuộc tính `articulation` trên event, không đổi bài) |
| “Nốt nào được accent?” trong chuỗi đều | `TARGET_DISTRACTOR` | Cùng dynamic contour (đánh giá 1) |

`AudioEvent` cần: `articulation?: 'legato' | 'staccato' | 'tenuto' | 'accent'` — legato = overlap release; staccato = dur × 0.35.

### 3.3 Contour giai điệu (hình, không phải nốt)

Pitch-recall đòi *đúng midi*. Não người mới nghe *lên / xuống / đứng*. Plan3 đã đổi ∞-II thành Parsons code — **giữ và đưa lên level thường**, không để Infinity.

| Bài tập | Quan hệ |
|---|---|
| Nghe cụm 5 nốt, chọn đồ thị contour (∧ ∨ / \ −) | `SPATIAL_TRANSFORM` (pitch-height) + `ORDER_SEQUENCE` |
| Hai cụm khác nốt, cùng hình — “cùng contour?” (transposition) | `IDENTITY_MATCH` trên *hình*, không trên pitch class |

Đây là cầu nối digit-span ↔ âm nhạc: nhớ cấu trúc, không nhớ token.

### 3.4 Tonic / bậc thang âm / nốt ngoại điệu (lẻ hơn “mode color”)

Mode color hỏi *màu*. Còn thiếu *trọng tâm* và *thành viên tập hợp*.

| Bài tập | Quan hệ | Ghi chú khoa học |
|---|---|---|
| **Tonic finding:** đoạn 4–8 nốt diatonic, hỏi “nốt nhà là nốt nào?” (chọn 3 ứng viên) | `CONTEXT_MEANING` | Không cần biết tên mode |
| **Scale-degree oddball:** giai điệu in-key, 1 nốt chromatic — bấm khi “sai nhà” | `INHIBITION` + `CONTEXT_MEANING` | Cùng paradigm MMN / even-odd |
| **Tendency tone:** 7 (leading) hoặc 4 — đoán nốt giải quyết | `TEMPORAL_PREDICT` + `RULE_ACTION` | Rẻ: 2 nốt, 2 lựa chọn |

Khác modulation (đánh giá 1): oddball không đổi điệu, chỉ *xâm nhập*.

### 3.5 Voice leading & spacing (hòa âm chuyển động, không phải nhãn hợp âm)

Chord-identify hỏi *loại*. Não nhạc sĩ nghe *các bè đi đâu*.

| Bài tập | Quan hệ | Gắn vào |
|---|---|---|
| Hai hợp âm liên tiếp: chuyển động bè **song song / ngược / tĩnh** | `SPATIAL_TRANSFORM` + `ORDER_SEQUENCE` | `chord-identify` variant |
| Cùng hợp âm C: close vs open vs drop-2 — “voicing nào rộng hơn?” | `PART_WHOLE` + `SIMILARITY_DIFF` | plan3 ∞-VI đã có open voicing — thêm **so sánh** không chỉ nhận diện |
| **Root motion:** I→V vs I→ii vs I→bVII — khoảng bass | `SIMILARITY_DIFF` | Sau cadence |

### 3.6 Hòa âm ngầm (implied harmony)

Giai điệu đơn âm vẫn “mang” hợp âm. Đây là `CONTEXT_MEANING` cấp câu, khác chord-identify (stimulus đã là hợp âm).

| Bài tập | Quan hệ |
|---|---|
| Arpeggio / giai điệu vỡ, hỏi chất hợp âm ngầm (Trưởng/Thứ/dom7) | `PART_WHOLE` |
| Cùng nốt giai điệu, bass khác → hợp âm đổi — “bass nào khớp?” | `CONTEXT_MEANING` |

### 3.7 Motive transform (hình thức nhỏ hơn phrase symmetry)

Phrase symmetry (đánh giá 1) = hỏi–đáp. Motive = *một tế bào* bị biến hình.

| Phép | Analog thị giác | Quan hệ |
|---|---|---|
| Đảo ngược (inversion) | mirror | `SPATIAL_TRANSFORM` |
| Nghịch đảo thời gian (retrograde) | reverse span | `ORDER_SEQUENCE` |
| Augmentation / diminution | stretch | `TEMPORAL_PREDICT` |
| Sequence (lặp dịch bậc) | transposición | `IDENTITY_MATCH` + `CONTEXT_MEANING` |

Bài: nghe motif A rồi B — “B là đảo / lùi / kéo nhịp / sequence / khác hẳn?”  
Gắn `pitch-recall` (đã có reverse) hoặc `interval-identify` chain. **Không** slug mới.

### 3.8 Meter phase, hemiola, half-time (lẻ hơn “3/4 vs 4/4”)

Đánh giá 1: gõ phách mạnh để nhận meter. Còn:

| Bài tập | Quan hệ |
|---|---|
| **Where is 1?** Cùng pulse, accent lệch — chọn ô nhịp bắt đầu | `TEMPORAL_PREDICT` + `RULE_ACTION` |
| **Hemiola:** 3 nhóm 2 trong 6/8 vs 2 nhóm 3 — “nhóm nào?” | `PART_WHOLE` trên phách |
| **Half vs double:** cùng audio, người chơi chọn đang đếm 1-2-3-4 hay 1-2 | `CONTEXT_MEANING` |

### 3.9 Groove feel (microtiming), không phải nhớ pattern

Rhythm-recall = nhớ *ô nào có nốt*. Groove = *nốt đúng ô nhưng lệch ms*.

| Bài tập | Quan hệ | Kỹ thuật |
|---|---|---|
| Cùng Euclidean pattern: straight / laid-back (~+20–40 ms) / rushed | `SIMILARITY_DIFF` trên thời gian | ClockSync đã có trong plan3 |
| Ghost note: onset có/không, gần ngưỡng dB | `TARGET_DISTRACTOR` | plan3 ∞-III |

### 3.10 Pedal, ostinato, drone (kết cấu tĩnh)

Voice tracking (đánh giá 1) = 2–3 giai điệu *cùng chuyển*. Pedal = 1 nốt *không chuyển* + hòa âm đổi.

| Bài tập | Quan hệ |
|---|---|
| Drone C, hợp âm đổi — “hợp âm nào căng với drone?” | `CONTEXT_MEANING` + `SIMILARITY_DIFF` |
| Ostinato 4 nốt + giai điệu mới — nhớ **chỉ** ostinato | `TARGET_DISTRACTOR` + `INHIBITION` | Tiền tố rẻ của voice tracking |

### 3.11 Density / số bè

| Bài tập | Quan hệ |
|---|---|
| “Bao nhiêu tiếng đang kêu?” 1 / 2 / 3 / 4 | `PART_WHOLE` |
| Homophony (cùng rhythm) vs polyphony (rhythm lệch) | `SIMILARITY_DIFF` + `TEMPORAL_PREDICT` |

Bài này **rẻ** và chuẩn bị tai cho voice tracking.

### 3.12 Tuning: beating, không chỉ “bao nhiêu cent”

Microtonal staircase (plan3) hỏi *lệch cao độ*. Beating hỏi *hiện tượng vật lý* khi 2 nốt gần nhau.

| Bài tập | Quan hệ |
|---|---|
| Unison vs hơi lệch — “có nhịp rung (beat) không?” rồi staircase tần số beat | `SIMILARITY_DIFF` | `timbre-match` / interval |
| Just fifth (3:2) vs equal fifth — “cái nào êm hơn?” | continuum như ranking dissonance | Sau; cần loudness match |

### 3.13 Không gian như thuộc tính nhạc, không chỉ “bên trái”

Localization đã là bài riêng. Thuộc tính còn thiếu: **cùng giai điệu, khác độ ướt reverb** (plan3 timbre ∞-VI) gắn *câu nhạc* — “câu nào ở trong phòng lớn?” = `CONTEXT_MEANING` không gian.

Không tạo slug. Parameter `reverbWet` trên `Stimulus.meta`.

---

## 4. Công thức chơi đùa — bản đầy đủ 12 quan hệ

Đánh giá 1 dùng 4 quan hệ. ADR có 12. Bảng dưới là máy sinh ý tưởng: **cột quan hệ cố định, đổi thực thể nhạc**.

| Quan hệ ADR | Công thức | Ý bài (ưu tiên) |
|---|---|---|
| `TARGET_POSITION` | Nguồn âm HAS vị trí | Đã có localization |
| `ORDER_SEQUENCE` | Nốt/phách HAS thứ tự | Pitch-recall, rhythm; + motif retrograde |
| `IDENTITY_MATCH` | A cùng lớp với B | Transposed contour; cùng hợp âm khác voicing |
| `SIMILARITY_DIFF` | A khác B đúng 1 thuộc tính | Articulation; groove feel; open vs close |
| `TARGET_DISTRACTOR` | Dòng đích vs dòng nhiễu | Voice tracking; ostinato; orchestration “chỉ nghe nốt gốc” |
| `RULE_ACTION` | Nếu X thì bấm Y | Tendency tone; accent rule; “chỉ gõ phách mạnh” |
| `INHIBITION` | Kỳ vọng sai → không theo | Modulation clash; chromatic oddball; rest (không bấm) |
| `PART_WHOLE` | Bộ phận ↔ khối | Overtone; density; implied chord; phrase |
| `FOCUS_FIELD` | Thu hẹp “vùng nghe” | Nghe bè trầm / dải tần / một tai |
| `SPATIAL_TRANSFORM` | Hình bị xoay/đảo/dịch | Contour inversion; register jump; voice leading direction |
| `TEMPORAL_PREDICT` | Cái tiếp theo / khi nào | Cadence; harmonic rhythm; meter phase; leading tone |
| `CONTEXT_MEANING` | Nghĩa phụ thuộc khung | Mode color; tonic; in-key vs out; half-time feel |

**Ràng buộc chống nổ scope:** mỗi ý tưởng mới phải trả lời được 3 câu:

1. Thuộc tính nào *đã có* trên `AudioEvent` (hoặc thêm 1 field)?  
2. Quan hệ chính là quan hệ nào trong 12?  
3. Gắn slug nào — hay bắt buộc slug mới vì confounds bài cũ?

Nếu (3) = slug mới **và** không phải Voice tracking → **hoãn**.

---

## 5. Máy sinh 2 thực thể × 1 quan hệ (bổ sung bảng đánh giá 1)

| Thực thể A | Quan hệ | Thực thể B | Bài | Slug | Phase |
|---|---|---|---|---|---|
| Nốt | HAS-A | Cường độ | Dynamic contour | timbre hoặc rhythm | M1 |
| Hợp âm | INTERACTS-WITH | Âm sắc | Orchestration spotting | chord-identify | M1 |
| Giai điệu | TARGET_DISTRACTOR | Giai điệu | Voice tracking | **slug mới** | M2 |
| Hợp âm | TEMPORAL_PREDICT | Hợp âm | Cadence | chord L11 (làm thật) | M1 |
| Nhịp hòa âm | USES | Nhịp giai điệu | Harmonic rhythm | chord + rhythm params | M2 |
| Bậc thang | CONTEXT_MEANING | Điệu thức | Mode color, modulation | chord / interval | M2 |
| Nghỉ | INHIBITION | Phách | Rest spotting | rhythm-recall | M0 |
| Motif | SPATIAL_TRANSFORM | Motif′ | Inversion/sequence | pitch-recall | M1 |
| Giai điệu | PART_WHOLE | Hợp âm ngầm | Implied harmony | chord-identify | M1 |
| Nốt in-key | CONTEXT_MEANING | Nốt chromatic | Oddball | interval hoặc pitch | M0 |
| Pulse | CONTEXT_MEANING | Accent grid | Meter / where-is-1 | rhythm-recall | M1 |
| Nốt | HAS-A | Articulation | Legato vs staccato | timbre-match | M0 |
| Bè tĩnh (pedal) | CONTEXT_MEANING | Hợp âm đổi | Drone tension | chord-identify | M1 |
| Pattern | SIMILARITY_DIFF | Microtiming | Groove feel | rhythm-recall | M2 |
| Partial | PART_WHOLE | Nốt phức | Overtone spotting | timbre-match | M0 |
| Câu | PART_WHOLE | Câu | Phrase symmetry | pitch + rhythm | M2 |
| Bass | ORDER_SEQUENCE | Soprano | Voice leading type | chord-identify | M2 |
| Unison | SIMILARITY_DIFF | Beating | Intonation | timbre/interval | M2 |

---

## 6. Quyết định kiến trúc (khớp KE_HOACH + plan3)

1. **Mở rộng `AudioEvent`**, không mở ERD. Field đề xuất thêm (tất cả optional):

```ts
articulation?: 'legato' | 'staccato' | 'tenuto' | 'accent';
partialGains?: number[];      // overtone spotting — engine đã có hài 2, 3
rest?: boolean;               // event không phát, chỉ chiếm slot thời gian
layer?: 'A' | 'B' | 'C';      // đã có trong plan3
harmonyChange?: boolean;      // đánh dấu mốc nhịp hòa âm
```

2. **Tier = dữ liệu.** Ý mới = `variantCode` + `parametersJson`, generator thuần + seed.

3. **1 slug mới tối đa:** `voice-track` (tên hiển thị: Theo dõi bè). Primary: `TARGET_DISTRACTOR`. Secondary: `INHIBITION`, `FOCUS_FIELD`.  
   Cocktail Party giọng nói vẫn **hoãn** (plan3: speechSynthesis không vào Web Audio).

4. **Cadence L11** (`PROGRESSION_CADENCE`) đã ghi trên metadata chord — **làm runtime**, đừng để variant chết như Find Number.

5. **Copy khoa học:** không claim Broca/Heschl. Nói paradigm: relative pitch, auditory streaming (Bregman), meter induction, MMN analog.

6. **Calibration / RMS / random root / headphone** giữ nguyên plan3 §1.11–1.14. Dynamic contour **bắt buộc** loudness calibration nếu không người chơi dùng “độ to tuyệt đối”.

---

## 7. Lộ trình phát triển (chi tiết, theo công sức)

Công sức: **S** < 1 ngày · **M** 2–4 ngày · **L** 5–8 ngày. 1 dev. Không song song với rewrite 19 game thị giác.

### Phase M0 — “hời kỹ thuật” (tuần 1–2)

Tận dụng `auditoryEngine.ts` (additive, velocity) + generator rhythm/pitch. Không UI mới phức tạp.

| # | Mục | Slug | Quan hệ | Việc kỹ thuật | Công sức |
|---|---|---|---|---|---|
| M0-1 | Overtone spotting | `timbre-match` | `PART_WHOLE` | Expose `partialGains`; trial: nhấn mạnh 1 hài, 4 lựa chọn “hài 2/3/4/5” | S |
| M0-2 | Rest spotting | `rhythm-recall` | `INHIBITION` | Slot `rest: true`; UI: gõ mọi onset **trừ** nghỉ / hoặc chỉ ra ô nghỉ | S |
| M0-3 | Articulation 4-way | `timbre-match` | `SIMILARITY_DIFF` | Cùng midi+IOI, khác dur/overlap; chuẩn hóa RMS | S |
| M0-4 | Chromatic oddball | `interval-identify` hoặc pitch | `INHIBITION` + `CONTEXT_MEANING` | Scale C major, 1 nốt #/b; bấm khi lệch | S |
| M0-5 | Dynamic accent | `rhythm-recall` | `TARGET_DISTRACTOR` | Velocity pattern; hỏi “accent ở step nào” | S |

**Tiêu chí xong M0:** mỗi mục có generator + scorer test được bằng seed, 1 variantCode trên metadata, `relationEvents` ghi relationId.

### Phase M1 — thuộc tính × quan hệ trên bài cũ (tuần 3–6)

| # | Mục | Slug | Quan hệ | Việc | Công sức |
|---|---|---|---|---|---|
| M1-1 | Contour (Parsons) đưa xuống L4–6 | `pitch-recall` | `ORDER_SEQUENCE` + `SPATIAL_TRANSFORM` | UI chọn hình, không piano | M |
| M1-2 | Dynamic contour (cresc/dim) | `timbre-match` | `TEMPORAL_PREDICT` | Ramp `vel` theo event; 3 lựa chọn | S |
| M1-3 | Orchestration spotting | `chord-identify` | `TARGET_DISTRACTOR` + `IDENTITY_MATCH` | Mỗi chord tone một `voice`; hỏi “root = voice nào” | M |
| M1-4 | Cadence 3-way (V–I / I–V / V–vi) | `chord-identify` L11 | `TEMPORAL_PREDICT` + `CONTEXT_MEANING` | `Progression.fromRomanNumerals`; duyệt đáp án nhạc lý | M |
| M1-5 | Meter feel 3/4 vs 4/4 vs 6/8 | `rhythm-recall` | `PART_WHOLE` + `RULE_ACTION` | Accent grid; người chơi gõ **chỉ** downbeat | M |
| M1-6 | Implied harmony | `chord-identify` | `PART_WHOLE` | Chỉ phát arpeggio/melody; options Major/Minor/dom7 | M |
| M1-7 | Motive: inversion vs sequence | `pitch-recall` | `SPATIAL_TRANSFORM` | 2 cụm ngắn, 4 nhãn | M |
| M1-8 | Density 1–4 voices | `chord-identify` hoặc timbre | `PART_WHOLE` | Random voice count, loudness-normalized | S |
| M1-9 | Tonic finding (3 lựa chọn) | `pitch-recall` / learn module | `CONTEXT_MEANING` | Đoạn diatonic 6–8 nốt kết chưa hẳn V–I | M |

### Phase M2 — quan hệ liên-thực-thể (tuần 7–11)

| # | Mục | Slug | Quan hệ | Việc | Công sức |
|---|---|---|---|---|---|
| M2-1 | **Voice tracking** | **`voice-track` mới** | `TARGET_DISTRACTOR` + `INHIBITION` + `FOCUS_FIELD` | 2 rồi 3 layer; cue “nghe bè A”; recall hoặc oddball trên bè đích; tách timbre+pan+register | L |
| M2-2 | Mode color | chord hoặc interval | `CONTEXT_MEANING` | Cùng tonic, khác mode; 3–4 nhãn cảm (không bắt buộc tên Hy Lạp ở L1) | M |
| M2-3 | Modulation detection | chord | `TEMPORAL_PREDICT` + `INHIBITION` | Bấm khi “nhà đổi”; dung sai cửa sổ ±1 hợp âm | L |
| M2-4 | Harmonic rhythm | chord | `TEMPORAL_PREDICT` | Giai điệu nhanh, hợp âm đổi 1/2/4 nốt một lần; hỏi “hợp âm đổi bao lâu” | M |
| M2-5 | Phrase symmetry | pitch+rhythm | `PART_WHOLE` | 2 câu; hỏi–đáp vs lệch độ dài | M |
| M2-6 | Consonance ranking | interval/chord | `SIMILARITY_DIFF` continuum | 3 stimulus, sắp xếp; không nhãn lý thuyết | M |
| M2-7 | Groove feel | rhythm | `SIMILARITY_DIFF` | Cần ClockSync + calibration (plan3) | M |
| M2-8 | Voice leading type | chord | `SPATIAL_TRANSFORM` | Hai block chords, SATB đơn giản | M |
| M2-9 | Pedal/drone tension | chord | `CONTEXT_MEANING` | Drone + 4 hợp âm | S |

### Phase M3 — có chủ đích hoãn

| Mục | Lý do hoãn |
|---|---|
| Cocktail Party lời nói | License clip + routing audio |
| HRTF elevation / trước–sau chấm điểm | plan3: HRTF generic |
| Hát lại (pitchy + mic) | Consent, AGC, tai nghe |
| Metric modulation đúng nghĩa nhạc lý | Dễ nhầm meter change; plan3 đã cảnh báo |
| Just intonation đầy đủ comma | Ít user, nhiều confound loudness |
| Generative “ngày mai bài mới” | KE_HOACH Phase 6 |

---

## 8. Spec vận hành — 3 bài nên làm trước (đủ chi tiết để estimate)

### 8.1 Overtone spotting (M0-1)

- **Stimulus:** 1 nốt midi cố định (vd. C3), additive 5 partial; 1 partial gain ×3 trong 400 ms giữa.
- **Confound:** RMS tổng không đổi khi nhấn hài; random root sau L3 để không nhớ “âm sắc C3”.
- **Answer:** index partial 2–5.
- **DDA:** staircase trên *độ nhấn* (dB) khi accuracy > 80%.
- **Log:** `{ relationId: 'PART_WHOLE', partialIndex, boostDb, correct }`.

### 8.2 Voice tracking (M2-1) — bài đáng làm nhất của đánh giá 1

- **L1–3:** 2 bè, khác hẳn register + timbre; hỏi “bè trầm đi lên hay xuống?”
- **L4–7:** 2 bè gần register hơn; oddball trên bè đích.
- **L8–12:** 3 bè; đổi target giữa trial (rule switch = `INHIBITION`).
- **Không** dùng lời nói.
- **Synergy:** map `TARGET_DISTRACTOR` sang find-letter / stroop — cùng HUD quan hệ.
- **An toàn:** limiter −3 dB; không pan cực + loudness lệch (người chơi “gian lận” bằng tai trái).

### 8.3 Cadence (M1-4) — metadata đã hứa

- Pool: Authentic (V–I), Half (x–V), Deceptive (V–vi). Key ngẫu nhiên.
- L1: chỉ V–I vs x–V. L4+: thêm deceptive. Không hỏi tên tiếng Anh ở L1 (“dứt / lửng / hụt”).
- **Bắt buộc** review đáp án người biết nhạc lý (plan3).
- Confound: cùng voicing, cùng rhythm, cùng loudness — chỉ đổi cấp chức năng.

---

## 9. Telemetry & mastery (không bảng SQL mới ở M0–M1)

Ghi trong `rawMetricsJson` (`schemaVersion: 'v1'`):

```ts
{
  schemaVersion: 'v1',
  music: {
    entity: 'partial' | 'rest' | 'contour' | 'cadence' | 'voice' | 'meter' | ...,
    attribute: 'gain' | 'velocity' | 'articulation' | 'layer' | ...,
    relationId: 'PART_WHOLE' | 'TARGET_DISTRACTOR' | ...
  },
  relationEvents: [ /* như ADR */ ]
}
```

Phase 2b KE_HOACH mới rollup `relationshipMasteries`. Music entity **không** thành cột DB.

---

## 10. Thứ tự ưu tiên nếu chỉ chọn 7 mục

1. Overtone spotting (engine sẵn)  
2. Rest + oddball (quan hệ ức chế, rẻ)  
3. Articulation + dynamic accent (thuộc tính vel/dur sẵn)  
4. Cadence runtime (đã ghi L11)  
5. Contour Parsons (plan3, sửa trùng interval)  
6. Orchestration spotting (chơi đùa timbre × chord)  
7. Voice tracking (slug mới, kiến trúc ATTENTION)

Meter feel, mode, modulation, harmonic rhythm, phrase, ranking dissonance, groove, voice leading — **sau** khi 7 mục trên có evidence thật.

---

## 11. Những gì *không* làm

- Không thêm bảng `notes`, `chords`, `scales` trên Postgres.
- Không thêm quan hệ thứ 13 (`HARMONIC_RHYTHM` v.v.) — đó là *cặp thực thể*, map vào 12 gốc.
- Không tuyên bố tuyệt đối cao độ “luyện được cho mọi người”.
- Không biến Green Dot / Schulte thành nhạc. Transfer = cùng `relationId`, khác modality.
- Không implement 18 hàng §5 trong một sprint.

---

## 12. Định nghĩa xong

Sau M0: tai người chơi (và hệ thống) nhìn thấy cùng skeleton: **đối tượng nhạc có thuộc tính, thuộc tính bị quan hệ 12 chiều kéo**. Game chỉ là mặt nạ.

Tài liệu này **bổ sung** `đánh giá 1.txt` và `implementation_plan3.md`; không thay ADR hay KE_HOACH xương sống 19 bài thị giác/đọc.
