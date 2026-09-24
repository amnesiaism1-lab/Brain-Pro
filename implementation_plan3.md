# 🎵 Kế Hoạch v3 — Module Trí Nhớ Âm Thanh & Cảm Âm (bản mở rộng)

> Nâng cấp từ `implementation_plan2.md`: chọn công nghệ có kiểm chứng, sửa các điểm không khả thi về mặt âm học/kỹ thuật, và chia lộ trình triển khai chi tiết.
>
> **Giả định stack:** React + TypeScript, monorepo `frontend/` + `shared/`, bundler kiểu Vite. Nếu khác, chỉ cần đổi phần cấu hình build/PWA.
> **Ký hiệu:** ⚠️ = mình chưa xác minh được 100%, cần kiểm tra khi triển khai (đã đưa vào Spike ở Phase 0).

---

## 0. Tóm tắt nhanh

1. **Không cần API ngoài nào.** Toàn bộ dữ liệu âm nhạc sinh ra được offline bằng Tonal.js. Riêng `chords.alday.dev` trong v2: mình tìm không thấy tài liệu hay dấu vết nào xác nhận API này tồn tại → **bỏ**, và cũng không cần vì bài tập chỉ cần *cao độ* chứ không cần *ngón bấm*.
2. **Stack cốt lõi giữ nguyên hướng v2:** Web Audio + Tonal.js + Tone.js (lazy-load). Bổ sung: PRNG có seed, thuật toán staircase, Service Worker cache sample, Pointer Events + audio clock cho bài nhịp.
3. **Thay đổi kiến trúc lớn nhất:** thay hàng chục method `playXxx()` bằng **một `AudioEngine.play(stimulus)`** nhận dữ liệu khai báo (`AudioEvent[]`). Generator sinh đề là hàm thuần, có seed → test được không cần loa, chống gian lận được, tái hiện lỗi được.
4. **5 điểm trong v2 không chạy đúng như mô tả** (chi tiết §1): Enharmonic Trap (A4 vs d5 là cùng một âm trong 12-TET), HRTF elevation, "Binaural Beats" (thực chất là ITD), Doppler của PannerNode, Cocktail Party bằng giọng nói (SpeechSynthesis không đi qua Web Audio).
5. **Thiếu hẳn:** calibration (tai nghe, âm lượng, độ trễ), an toàn thính giác, mô hình dữ liệu để làm analytics, accessibility, i18n (Đô-Rê-Mi).
6. **Lộ trình đề xuất:** Phase 0 (nền móng + spike) → 1 (Interval + Pitch) → 2 (Chord + Rhythm) → 3 (Timbre + Localization) → 4 (hardening + insights). Ước lượng **~45–58 ngày công** cho 1 dev (±30%). 43/60 tier Infinity vào MVP, 14 tier để "Sau", 3 tier "Hoãn".

---

## 1. Đánh giá v2: giữ gì, sửa gì

| # | Điểm trong v2 | Vấn đề | Đề xuất |
|---|---------------|--------|---------|
| 1 | Chords API `chords.alday.dev` | Không xác minh được tồn tại; phụ thuộc bên thứ ba; không cần thiết | Bỏ. Dùng `Tonal.Chord` + `Voicing` offline. Nếu sau này cần *hiển thị ngón bấm guitar*: `@tombatossals/chords-db` (JSON offline) ⚠️ |
| 2 | Salamander piano "public domain", host tại `tonejs.github.io` | Theo mình nhớ Salamander Grand Piano V3 là **CC BY 3.0** (phải ghi credit) ⚠️ kiểm tra lại trên trang gốc. GitHub Pages không phải CDN có SLA | Tự host trong `public/samples/`, cắt subset, cache bằng Service Worker, ghi credit trong trang "Giới thiệu" |
| 3 | Tap detection bằng `performance.now()` | Clock JS và clock âm thanh lệch nhau; mỗi thiết bị có độ trễ khác nhau | Chấm theo **audio clock** (§3.4), ánh xạ qua `getOutputTimestamp()`, thêm calibration, chấm theo khoảng cách giữa các nhịp (IOI) thay vì thời điểm tuyệt đối |
| 4 | `panner.setPosition(...)` | Đã deprecated. Công thức tọa độ cũng sai khi elevation ≠ 0 (x, z chưa nhân `cos(el)` nên khoảng cách thực ≠ `distance`) | Dùng `positionX/Y/Z` (AudioParam); sửa công thức (§3.5) |
| 5 | Bài 6 level 10–12: HRTF 3D elevation | HRTF mặc định của trình duyệt là **dữ liệu chung, không cá nhân hóa** → nhiều người nhầm trước/sau, elevation gần như không phân biệt được | Chỉ chấm azimuth phía trước (±90°) ở MVP. Elevation/trước-sau là chế độ "thử nghiệm", dung sai rộng, không tính vào điểm chính |
| 6 | Bài 6 ∞-V "Binaural Beats" | Nhầm khái niệm: binaural beats (2 tần số hơi khác nhau ở 2 tai) ≠ ITD (chênh lệch thời gian giữa 2 tai) | Đổi tên **"ITD Precision"**. Không đưa bất kỳ tuyên bố sức khỏe/tăng trí nhớ nào |
| 7 | Bài 2 ∞-VIII "Enharmonic Trap" (A4 vs d5) | Trong 12-TET (thứ mà mọi synth/piano mặc định dùng), A4 và d5 **cùng 6 semitone, cùng tần số** → không thể phân biệt bằng tai | Thiết kế lại: cho **ngữ cảnh giải quyết** (A4 thường mở ra ngoài thành quãng 6; d5 thu vào trong thành quãng 3), hoặc dùng just intonation (chênh ~20 cent). Xem §4.2 |
| 8 | Bài 6 ∞-IV Doppler bằng PannerNode | Doppler built-in của PannerNode không còn đáng tin cậy ⚠️ | Tự tính bằng automation `detune`/`playbackRate`: `f_nghe = f · c / (c − v)` (v > 0 khi nguồn tiến lại gần) |
| 9 | Bài 6 ∞-VIII Cocktail Party (giọng nói) | `speechSynthesis` không định tuyến được vào Web Audio graph → không pan/không xử lý được | Dùng clip thu sẵn (kiểm license) hoặc nhiều dòng giai điệu/timbre khác nhau; **hoãn** |
| 10 | Trùng lặp giữa các bài | Bài 1 có Interval Echo/Scale Detective/Binaural/Timbre Shift, trùng Bài 2/5/6 → loãng vai trò, tốn công | Tách vai trò: Bài 1 = *trí nhớ chuỗi*; các bài khác = *nhận diện/phân biệt* (bảng tier §4) |
| 11 | Nhiễu (confound) âm học | Sine nghe nhỏ hơn square cùng biên độ; nốt rất thấp/cao nghe nhỏ; root cố định C4 khiến người chơi nhớ *nốt* thay vì *quãng* | Chuẩn hóa loudness, **roving level** (ngẫu nhiên ±3 dB phần không liên quan), **random root**, thêm fade 5–10 ms tránh "click" lộ đáp án |
| 12 | Chỉ có level cố định | Các tác vụ đo *ngưỡng* (cent, ms, độ, dB) không hợp level cố định | Dùng **staircase thích ứng** (§5) → ra ngưỡng thật, ví dụ "ngưỡng phân biệt cao độ của bạn: 18 cent" |
| 13 | Tên `cat-6: AUDITORY_MEMORY` | Chỉ Bài 1 là *memory*; 5 bài còn lại là *perception/discrimination* | Giữ ID `cat-6`, đổi nhãn hiển thị thành **"Thính Giác & Cảm Âm"** |
| 14 | Không có calibration/an toàn | Bài spatial vô nghĩa nếu dùng loa; âm lượng quá lớn gây hại; Bluetooth trễ 100–300 ms phá bài nhịp | Onboarding có headphone check, chỉnh âm lượng, đo độ trễ (§6) |
| 15 | Không có mô hình dữ liệu | Không làm được confusion matrix, hồ sơ tai, lặp lại có trọng số | Log từng trial (§7) |
| 16 | Tier "gimmick" (Fibonacci Tempo/Duration) | Vui nhưng ít giá trị luyện tập | Giữ nhưng xếp cuối ("Sau") |

**Những gì v2 làm tốt, giữ nguyên:** cấu trúc 12 level + 10 tier Infinity, bộ 4 UI component, phân phase theo độ khó, cảnh báo tai nghe, hướng lazy-load Tone.js.

---

## 2. Công nghệ & API đề xuất

### 2.1 Bảng công nghệ

Mức: **Must** = cần cho MVP · **Should** = nên có · **Opt** = tùy chọn.

| Lớp | Công nghệ | Dùng để | Mức | Ghi chú |
|-----|-----------|---------|-----|---------|
| Audio | **Web Audio API** (native) | `StereoPannerNode`, `PannerNode` (HRTF), `ConvolverNode`, `AnalyserNode`, `OfflineAudioContext`, `PeriodicWave`, `DelayNode` (ITD) | Must | Nền tảng, không tốn bundle |
| Audio | **Tone.js** | Scheduling, PolySynth, `AMSynth`/`FMSynth`, `Reverb`, `BitCrusher`, `StereoWidener`, `Panner3D`, `Sampler`, `Limiter`, `Draw` (đồng bộ hình với âm) | Must (lazy) | Chỉ `import()` trong chunk của game âm thanh |
| Audio | `smplr` | Sampler/soundfont nhẹ, cùng tác giả với Tonal | Opt | So sánh với `Tone.Sampler` trong Spike A; chỉ chọn 1 |
| Sample | Salamander Grand Piano | Piano thật | Must | Tự host, subset, ghi credit (⚠️ xác minh license) |
| Sample | `tonejs-instruments` hoặc soundfont | Guitar, nhạc cụ khác | Should | Kiểm license từng bộ ⚠️ |
| Percussion | `Tone.MembraneSynth` / `NoiseSynth` / `MetalSynth` | Kick / snare / hi-hat / tom | Must | Tổng hợp trực tiếp, **không cần sample** |
| Lý thuyết nhạc | **Tonal.js** (import theo module) | Note, Interval, Scale, Chord, Mode, Progression, Voicing, Midi, Range | Must | Import `@tonaljs/*` thay vì gói `tonal` để tree-shake |
| Nhịp | Bjorklund (Euclidean) | Rhythm Euclidean | Must | Tonal có module rhythm-patterns ⚠️; nếu không, tự viết ~15 dòng |
| Input | **Pointer Events** + `event.timeStamp` | Tap chính xác, không bị trễ 300 ms (`touch-action: none`) | Must | |
| Input | Keyboard events | Chơi piano bằng phím máy tính, accessibility | Should | |
| Input | **Web MIDI API** | Nhập bằng đàn MIDI thật | Opt | Không có trên iOS Safari |
| Input | `getUserMedia` + `pitchy` | Bài "hát lại" (Backlog) | Opt | Tắt `echoCancellation`, `noiseSuppression`, `autoGainControl` |
| Nền tảng | Page Visibility API | Tạm dừng khi rời tab | Must | |
| Nền tảng | Screen Wake Lock API | Không tắt màn hình khi đang tập | Should | |
| Nền tảng | `navigator.audioSession` (iOS) | Phát âm cả khi bật silent switch ⚠️ | Should | Feature-detect |
| Nền tảng | Service Worker + Cache Storage (`vite-plugin-pwa`/Workbox) | Cache sample, chạy offline | Should | |
| Nền tảng | IndexedDB (`idb`) | Hàng đợi trial offline, đồng bộ lại khi có mạng | Should | |
| Hiển thị | Canvas 2D / SVG tự viết | Piano, spectrum, radar, grid | Must | Không cần thư viện piano (các lib phổ biến ít bảo trì) |
| Hiển thị | `abcjs` / VexFlow | Hiện khuông nhạc ở chế độ xem lại | Opt | Nặng, để Backlog |
| Chất lượng | **Vitest**, **fast-check**, **Playwright**, bundle visualizer | Test, property-based test, E2E, đo bundle | Must | |
| Chất lượng | Sentry, `web-vitals` | Theo dõi lỗi `AudioContext`, hiệu năng | Should | |

### 2.2 API bên ngoài

**Kết luận: MVP không phụ thuộc API ngoài nào.** Ưu điểm: không có điểm chết (single point of failure), chạy offline, không lo rate limit, không lộ dữ liệu người dùng.

Chỉ cân nhắc sau MVP, và chỉ khi có nhu cầu rõ:
- **Freesound API**: âm thanh môi trường cho bài Localization. Cần API key, license *từng* âm thanh khác nhau, tải về tự host.
- Bỏ: Hooktheory (cần tài khoản, giá trị thấp cho bài tập), Chords API v2.

### 2.3 Cài đặt

```bash
npm i tone
npm i @tonaljs/note @tonaljs/interval @tonaljs/scale @tonaljs/chord \
      @tonaljs/mode @tonaljs/progression @tonaljs/voicing @tonaljs/midi @tonaljs/range
# tùy chọn
npm i idb pitchy
npm i -D vitest fast-check @playwright/test vite-plugin-pwa
```

> ⚠️ Khi cài, kiểm tra API thật của Tonal: `Scale.detect`, `Voicing.search`, `Progression.fromRomanNumerals`, module rhythm-patterns. Ghi kết quả vào Spike A.

---

## 3. Kiến trúc

### 3.1 Các lớp

```
UI (React)          PianoKeyboard · RhythmGrid · SpatialRadar · FrequencySpectrum · FeedbackPanel
   │ props / events
Game hooks          useTrialLoop (state machine) · useAdaptiveDifficulty · useAudioProfile
   │
Domain (TS thuần)   Generators (có seed) · Scorers · Staircase · musicTheoryService
   │   Stimulus = AudioEvent[]   ← dữ liệu thuần, test được không cần loa
Audio (browser)     AudioEngine: unlock · scheduler · voices · master bus · analyser · clockSync
   │
Platform            Tone.js · Web Audio · Cache Storage · IndexedDB
```

**5 nguyên tắc:**
1. Generator và Scorer là **hàm thuần**, nhận `rng` có seed.
2. Stimulus là **dữ liệu khai báo**; Engine chỉ "biểu diễn" nó.
3. Một `AudioEngine.play(stimulus)` cho mọi bài (thay cho `playNoteSequence`, `playInterval`, `playChord`, `playRhythmPattern`, ...).
4. Tier Infinity là **config dữ liệu** (override tham số sinh đề), không phải code riêng.
5. Mọi trial đều được **log** (§7).

### 3.2 Kiểu dữ liệu cốt lõi

```typescript
// shared/src/audio/types.ts
export type VoiceId =
  | 'sine' | 'triangle' | 'sawtooth' | 'square'
  | 'piano' | 'guitar'
  | 'kick' | 'snare' | 'hihat' | 'tom';

export interface AudioEvent {
  t: number;            // giây, tính từ đầu stimulus (KHÔNG phải Date.now)
  dur: number;          // giây
  midi?: number;        // ưu tiên midi + cents để dễ test
  freq?: number;        // dùng khi không theo hệ 12-TET
  cents?: number;       // lệch cao độ (microtonal, detune)
  vel: number;          // 0..1
  pan?: number;         // -1..1 (StereoPanner)
  spatial?: { azimuth: number; elevation: number; distance: number };
  voice: VoiceId;
  layer?: 'A' | 'B' | 'C';  // dual channel, polyrhythm
  tag?: string;             // để UI highlight đúng nốt (đồng bộ qua Tone.Draw)
}

export interface Stimulus {
  events: AudioEvent[];
  totalDur: number;
  meta?: Record<string, unknown>;
}

export interface TrialSpec<A> {
  id: string;
  seed: number;
  stimulus: Stimulus;
  answerKey: A;           // đáp án đúng (server có thể tái tạo từ seed để kiểm chứng)
  choices?: string[];
}

export interface ExerciseGenerator<P, A> {
  slug: string;
  generate(params: P, rng: () => number): TrialSpec<A>;
  score(spec: TrialSpec<A>, response: unknown): TrialResult;
}
```

### 3.3 PRNG có seed

```typescript
// shared/src/audio/rng.ts — mulberry32
export function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

**Lợi ích:** (1) tái hiện lỗi từ `seed` trong log; (2) "Thử thách hằng ngày" mọi người cùng đề; (3) server tái tạo đề từ seed để chống gian lận bảng xếp hạng; (4) test xác định (deterministic).

### 3.4 AudioEngine

**Vòng đời**
- `init()` gọi **trong handler click** (autoplay policy): `await Tone.start()`; nếu có `navigator.audioSession` thì đặt `type = 'playback'` để iOS không bị silent switch làm câm ⚠️.
- `visibilitychange` → suspend/resume context.
- `dispose()` mọi node sau mỗi trial hoặc dùng voice pool (lỗi rò rỉ phổ biến của Tone.js là quên `.dispose()`).
- Chỉ **một** AudioContext sống. Nếu engine cũ `CognitiveAudioEngine` tạo context riêng, suspend nó khi vào game mới (Safari giới hạn số context) — Spike A xác nhận cách chia sẻ context.

> ⚠️ Tone.js dùng `standardized-audio-context` bên dưới, nên node Tone và node native không phải lúc nào cũng nối `.connect()` trực tiếp được. Cách an toàn: **dựng toàn bộ graph mới bằng node của Tone** (`Panner3D`, `Convolver`, `Filter`, `Analyser`...), hoặc nối qua `Tone.connect()`.

**Master bus:** `voices → Gain (loudness) → Panner/FX → masterGain → Limiter(−3 dB) → destination`

**Hằng số nên chuẩn hóa**

| Tham số | Giá trị đề xuất |
|---------|-----------------|
| Attack / Release mặc định | 5–10 ms / 30–100 ms (tránh click) |
| Đỉnh mục tiêu | khoảng −12 dBFS; Limiter −3 dB |
| Roving level | ±3 dB ngẫu nhiên cho tham số không liên quan |
| Ramp âm lượng khi bắt đầu | 100–200 ms (không phát đột ngột) |
| Bù loudness | gain nhẹ theo tần số (nốt < 200 Hz và > 4 kHz nghe nhỏ hơn) |

**Đồng bộ hình ảnh với âm thanh:** dùng `Tone.Draw.schedule(cb, time)` hoặc `requestAnimationFrame` đọc `ctx.currentTime`. **Không** dùng `setTimeout`/`setInterval` để highlight phím.

**Lịch phát:** `play(stimulus)` đặt toàn bộ event lên audio clock với look-ahead (Tone lo phần này), trả về `{ startAudioTime, stop() }`. Tempo thay đổi (accelerando) thì generator tính sẵn thời điểm tuyệt đối từng nốt (tích phân đường cong tempo) — engine không cần biết tempo.

### 3.4b ClockSync cho bài nhịp

```typescript
// frontend/src/audio/clockSync.ts
export function tapToAudioTime(ctx: AudioContext, ev: PointerEvent): number {
  // contextTime: mốc audio đang ra loa; performanceTime: cùng thời điểm đó theo performance.now()
  const { contextTime, performanceTime } = ctx.getOutputTimestamp();
  return contextTime + (ev.timeStamp - performanceTime) / 1000;
}
// sai số: err = tapAudioTime - onsetAudioTime - userLatencyOffset
```

⚠️ Safari/iOS có thể thiếu `getOutputTimestamp`. Fallback: ghép cặp `(ctx.currentTime, performance.now())` lúc bắt đầu stimulus, cộng hiệu chỉnh từ calibration. Spike C sẽ kiểm tra.

**Chấm nhịp bền vững:** trừ độ lệch trung bình (bias) của cả chuỗi và so sánh **khoảng cách giữa các nhịp (IOI)**. Nhờ đó độ trễ cố định của thiết bị (kể cả Bluetooth) gần như không ảnh hưởng điểm.

### 3.5 Âm thanh không gian (đã sửa)

```typescript
// azimuth: 0° = phía trước, +90° = bên phải; elevation: 0° = ngang tai
function setSourcePosition(p: PannerNode, az: number, el: number, d: number, t: number) {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  p.positionX.setValueAtTime(d * Math.sin(a) * Math.cos(e), t);
  p.positionY.setValueAtTime(d * Math.sin(e), t);
  p.positionZ.setValueAtTime(-d * Math.cos(a) * Math.cos(e), t);   // -Z = phía trước
}
// p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 1;
```

Hệ tọa độ Web Audio mặc định: +X phải, +Y lên, −Z phía trước (listener nhìn về −Z).

**ITD/ILD tự dựng (cho bài ITD Precision):** đưa 1 kênh qua `DelayNode` (ITD tối đa của người ≈ 0,6–0,7 ms) và chỉnh gain hai kênh (ILD). Theo "duplex theory": ITD chi phối ở tần số thấp (dưới ~1,5 kHz), ILD ở tần số cao → dùng làm nền cho tier "Frequency-Dependent Pan".

### 3.6 Tier Infinity là dữ liệu

```typescript
// shared/src/constants/infinity/pitchRecall.ts
export interface InfinityTierConfig<P> {
  id: string;                          // 'pitch-recall:inf-8'
  name: string;                        // 'Microtonal Ear'
  generator: Partial<P>;               // override tham số sinh đề
  adaptive?: 'span' | 'staircase';
  requires?: Array<'headphones' | 'sampler' | 'mic'>;
  unlockAfter?: string;                // id tier trước
}
```

Thêm tier mới = thêm một object config (cộng generator nếu cần cơ chế mới), không sửa component game.

### 3.7 Cấu trúc file (thay cho v2)

```
shared/src/audio/                 [NEW]  types.ts · rng.ts · staircase.ts · scoring/*.ts
shared/src/music/                 [NEW]  musicTheoryService.ts (thuần) · notation.ts (C↔Đô) · intervalNames.vi.ts
shared/src/generators/            [NEW]  pitchRecall.ts · intervalIdentify.ts · rhythmRecall.ts
                                         chordIdentify.ts · timbreMatch.ts · soundLocalization.ts
shared/src/constants/index.ts     [MODIFY] cat-6 + 6 exercise metadata
shared/src/constants/infinity/    [NEW]  1 file config / bài (thay vì 1 file infinityConfigs.ts khổng lồ)
shared/src/types/index.ts         [MODIFY] ExerciseSlug mới + CognitiveCategoryCode
shared/src/cognition/exercise-relation-map.ts [MODIFY]

frontend/src/audio/               [NEW]  engine.ts · voices.ts · samples.ts · clockSync.ts · masterBus.ts · unlock.ts
frontend/src/audio/calibration/   [NEW]  HeadphoneCheck.tsx · VolumeSetup.tsx · LatencyTap.tsx
frontend/src/hooks/               [NEW]  useTrialLoop.ts · useAudioEngine.ts · useAdaptiveDifficulty.ts · useAudioProfile.ts
frontend/src/components/games/    [NEW]  6 game component (như v2)
frontend/src/components/ui/       [NEW]  PianoKeyboard · RhythmGrid · FrequencySpectrum · SpatialRadar · AudioGate · FeedbackPanel
frontend/src/components/games/ActiveGameContainer.tsx [MODIFY]
public/samples/                   [NEW]  piano/ · guitar/   (tự host)
```

Đặt generator ở `shared/` để **backend dùng lại** kiểm chứng đáp án từ seed.

---

## 4. Thiết kế từng bài (phần bổ sung so với v2)

> Bảng level 1–12 trong v2 **giữ nguyên**. Phần dưới chỉ ghi thay đổi, công nghệ cụ thể, cách chấm điểm và quyết định cho từng tier Infinity.
>
> **Quyết định:** ✅ Giữ · ✏️ Sửa · 🔁 Gộp/chuyển · ⏸ Hoãn.
> **Công sức:** S ≤ 0,5 ngày · M 1–2 ngày · L ≥ 3 ngày.
> **Phase:** P1/P2/P3 = MVP; **Sau** = sau MVP.

### Quy tắc thiết kế chung cho cả 6 bài
- **Random root** ở mọi bài quãng/hợp âm (không cố định C4).
- **Feedback có giá trị học:** sai thì phát lại "đáp án đúng" rồi "lựa chọn của bạn", ngay sau đó.
- **Chế độ Học (Learn)** trước khi Thi: nghe mẫu từng quãng/hợp âm/kiểu nhịp có tên.
- **Nhạc cụ là tham số** (`voice`), không phải tier riêng.
- **Nhập liệu 2 mức** cho người không có nền tảng nhạc: (a) bàn phím piano; (b) nút số bậc âm 1–7 trong một điệu thức đã cho.
- **Nhãn Việt/Anh:** "quãng 3 trưởng (M3)", "hợp âm thứ (m)" ... kèm toggle Đô-Rê-Mi ↔ C-D-E (§8).

---

### 4.1 Bài 1 — Nhớ Cao Độ (`pitch-recall`)

**Công nghệ:** `Tonal.Range.chromatic`, `Tonal.Scale.get`, `Note.midi`; voices: synth ở level thấp, piano sampler ở level cao; `PianoKeyboard` để nhập.

**Bổ sung thiết kế**
- Chế độ chấm span: đúng 2 lần liên tiếp → +1 nốt; sai 2 lần → −1 nốt (giống Digit Span).
- Điểm từng phần: theo độ dài dãy con chung dài nhất (LCS) + đúng vị trí, không chấm "đúng/sai" cả chuỗi.
- Reverse recall (level 10–12): dùng cùng generator, chỉ đảo `answerKey`.
- Sau khi phát xong, thêm **mặt nạ nhiễu ngắn** (noise burst ~200 ms) cho tier "Absolute Pitch" để không nhớ bằng echoic memory.

| Tier | Quyết định | Ghi chú kỹ thuật | Công sức | Phase |
|------|-----------|------------------|----------|-------|
| ∞-I Chromatic Storm | ✅ | Pool 12 nốt ngẫu nhiên, không theo key | S | P1 |
| ∞-II Interval Echo | 🔁 | Trùng Bài 2. Thay bằng **Contour Memory**: nhớ đường nét lên/xuống/lặp (mã Parsons: U/D/R) | S | P1 |
| ∞-III Scale Detective | ✏️ | `Scale.detect` có thể trả về *nhiều* scale hợp lệ → chấm đúng nếu đáp án nằm trong tập trả về | M | Sau |
| ∞-IV Transposition Challenge | ✅ | Chấm theo "hình dạng" (dãy quãng) sau khi dịch | M | P1 |
| ∞-V Fibonacci Tempo | ✅ | Hạ ưu tiên (gimmick) | S | Sau |
| ∞-VI Binaural Pitch | ✅ | Tương đương *dichotic listening* trong thần kinh học; bắt buộc headphone check | M | P3 |
| ∞-VII Timbre Shift | 🔁 | Đổi thành **Timbre-Tagged Notes**: nhớ *nốt + nhạc cụ*, tránh trùng Bài 5 | M | P3 |
| ∞-VIII Microtonal Ear | ✏️ | Dùng **staircase** trên độ lệch cent (bắt đầu ~50 c, thu nhỏ dần) | M | P1 |
| ∞-IX Polyrhythmic Recall | ✏️ | Đổi thành **Interleaved Melodies**: 2–3 giai điệu xen kẽ, tách bằng timbre/pan (auditory stream segregation) | L | Sau |
| ∞-X Absolute Pitch Test | ✅ | 12 pitch class, 100 ms + mặt nạ. **Ghi rõ trong UI:** khả năng luyện tuyệt đối cao độ còn tranh cãi | M | P1 |

---

### 4.2 Bài 2 — Nhận Diện Quãng (`interval-identify`)

**Công nghệ:** `Interval.distance`, `Interval.invert`, `Note.transpose`, `Midi`; sampler piano/guitar; `PianoKeyboard` (highlight).

**Bổ sung thiết kế**
- **Random root + random direction**, roving level.
- Trọng số lấy mẫu theo lỗi: quãng bạn hay nhầm xuất hiện nhiều hơn (§7).
- Tên quãng tiếng Việt: 2 thứ/trưởng, 3 thứ/trưởng, 4 đúng, 4 tăng, 5 giảm, 5 đúng, 6 thứ/trưởng, 7 thứ/trưởng, 8 đúng.

| Tier | Quyết định | Ghi chú kỹ thuật | Công sức | Phase |
|------|-----------|------------------|----------|-------|
| ∞-I Speed Intervals | ✅ | 150 ms/nốt; đo thêm thời gian phản xạ | S | P1 |
| ∞-II Interval Chain | ✅ | Chấm từng quãng trong chuỗi | M | P1 |
| ∞-III Inversion Mirror | ✅ | `Interval.invert` (M3 ↔ m6) | S | P1 |
| ∞-IV Real Instrument | 🔁 | Thành tham số `voice` xuyên suốt, thêm chế độ "Instrument Roulette" | S | P2 |
| ∞-V Microtonal Intervals | ✅ | Nhãn "neutral third" (~350 c) cho quãng giữa; staircase | M | Sau |
| ∞-VI Context Interval | ✅ | Quãng nằm giữa đoạn giai điệu ngắn | L | Sau |
| ∞-VII Dual Channel | ✅ | Hai quãng, hai tai; headphone check bắt buộc | M | P3 |
| ∞-VIII Enharmonic Trap | ✏️ **Thiết kế lại** | 12-TET không phân biệt được A4/d5. Cách làm: phát quãng rồi **giải quyết** (A4 → quãng 6 mở ra; d5 → quãng 3 thu vào) và hỏi "hướng giải quyết nào hợp lý"; hoặc dùng just intonation | L | Sau |
| ∞-IX Blind Transposition | ✅ | Nghe ở register A, đáp ở register B (nhảy ≥ 2 octave) | S | P1 |
| ∞-X Chromatic Chaos | ✅ | Đáp bằng số semitone, 4 octave | S | P1 |

---

### 4.3 Bài 3 — Nhớ Nhịp (`rhythm-recall`)

**Công nghệ:** `Tone.MembraneSynth/NoiseSynth/MetalSynth`, Bjorklund, `clockSync` (§3.4b), `RhythmGrid`, Pointer Events.

**Bổ sung thiết kế**
- **Calibration độ trễ bắt buộc** trước lần chơi đầu (§6).
- Cửa sổ khớp nhịp: `w = max(60 ms, 0,25 × IOI nhỏ nhất)`. Trong cửa sổ: tap gần nhất được ghép; tap dư bị phạt nhẹ; nhịp không có tap = Miss.
- Xếp hạng theo sai số tương đối: `|err| ≤ 10% IOI` = Perfect, `≤ 20%` = Good, còn lại = Miss.
- Trừ bias trung bình rồi mới tính sai số (§3.4b).
- Người bình thường lặp lại nhịp với sai số ~30–50 ms → tier Chaos Rhythm phải dùng dung sai thích ứng, không đòi chính xác tuyệt đối.
- Cảnh báo tai nghe Bluetooth (độ trễ cao, dao động).

| Tier | Quyết định | Ghi chú kỹ thuật | Công sức | Phase |
|------|-----------|------------------|----------|-------|
| ∞-I Swing Feel | ✅ | Tham số `swingRatio` 1,5–3 (2:1 = triplet swing) | M | P2 |
| ∞-II Time Signature Shift | ✅ | 5/4, 7/8, 6/8; nhấn accent theo nhóm | S | P2 |
| ∞-III Ghost Notes | ✅ | Staircase trên biên độ (dB) thay vì cố định 10% | M | P2 |
| ∞-IV Tempo Morphing | ✅ | Generator tích phân đường cong tempo → thời điểm tuyệt đối; chấm theo IOI | M | P2 |
| ∞-V Metric Modulation | ✏️ | Đổi tên **Meter Change** (metric modulation trong lý thuyết nhạc là kỹ thuật khác) | S | Sau |
| ∞-VI Polymetric | ✅ | 2 layer (`layer: 'A'|'B'`), tap 2 vùng | L | Sau |
| ∞-VII Euclidean Rhythms | ✅ | Bjorklund(k, n) + xoay pha ngẫu nhiên | S | P2 |
| ∞-VIII Percussion Timbre | ✅ | Kick/snare/hihat/tom bằng synth Tone | M | P2 |
| ∞-IX Fibonacci Duration | ✅ | Hạ ưu tiên | S | Sau |
| ∞-X Chaos Rhythm | ✅ | Khoảng cách ngẫu nhiên không quantize; dung sai thích ứng | M | P2 |

---

### 4.4 Bài 4 — Nhận Diện Hợp Âm (`chord-identify`)

**Công nghệ:** `Tonal.Chord.get/detect`, `Voicing`, `Mode`, `Progression.fromRomanNumerals`; **không dùng API ngoài**; sampler piano/guitar.

**Bổ sung thiết kế**
- Voicing sinh cục bộ (close/open/drop-2) từ `Chord.get(name).notes` + quy tắc; một số hợp âm mở rộng có nhiều tên tương đương (vd. Cmaj7 / C∆7) → chuẩn hóa tên trước khi chấm.
- **Bắt buộc có người có nền tảng nhạc lý duyệt đáp án** (đảo, slash chord, sus, alt) — lỗi đáp án là loại lỗi làm mất niềm tin người dùng nhất.
- Slash chord: `Chord.get("C/E")` được hỗ trợ ⚠️ kiểm tra khi cài.

| Tier | Quyết định | Ghi chú kỹ thuật | Công sức | Phase |
|------|-----------|------------------|----------|-------|
| ∞-I Arpeggiated Recognition | ✅ | Chord rải theo thời gian | S | P2 |
| ∞-II Jazz Voicings | ✏️ | Bỏ API; dùng Tonal voicing + luật voicing | M | P2 |
| ∞-III Chord Progression | ✅ | La Mã (I–IV–V–I) sang hợp âm cụ thể theo key ngẫu nhiên | M | P2 |
| ∞-IV Polyphonic Layers | ✏️ | Nghe tách 2 hợp âm chồng nhau (bitonality) rất khó ngay cả với nhạc sĩ → đổi thành "hợp âm + giai điệu" hoặc tách L/R | L | Sau |
| ∞-V Piano/Guitar/Synth | 🔁 | Thành tham số `voice` | S | P2 |
| ∞-VI Open Voicing | ✅ | Trải 3 octave | M | P2 |
| ∞-VII Cluster Chords | ✅ | Nốt cách nhau m2/M2 | S | P2 |
| ∞-VIII Modal Harmony | ✅ | `Mode.get` + hợp âm đặc trưng của mode | M | P2 |
| ∞-IX Slash Chords | ✅ | Bass ≠ root | S | P2 |
| ∞-X Spectral Analysis | ✏️ | Đổi thành **Build the Chord**: nghe → chọn nốt trên `PianoKeyboard`, spectrum hiển thị hỗ trợ | L | Sau |

---

### 4.5 Bài 5 — Phân Biệt Âm Sắc (`timbre-match`)

**Công nghệ:** `PeriodicWave`/`Tone.Oscillator({ partials })` (harmonic series), `Tone.AMSynth/FMSynth`, `Tone.Filter`, `Tone.Reverb`, `Tone.BitCrusher`, `Tone.StereoWidener`, `AnalyserNode` → `FrequencySpectrum`.

**Bổ sung thiết kế**
- **Chuẩn hóa loudness (RMS)** giữa các timbre — nếu không, người chơi trả lời bằng độ to thay vì âm sắc.
- Tác vụ đo ngưỡng (cutoff, detune, số bit) dùng staircase; đơn vị theo octave/cent/bit.
- `Tone.Reverb` sinh IR bất đồng bộ (`await reverb.ready`) — preload trước trial.
- Nhiều tier cần tai nghe; hiển thị cảnh báo theo tier.

| Tier | Quyết định | Ghi chú kỹ thuật | Công sức | Phase |
|------|-----------|------------------|----------|-------|
| ∞-I Harmonic Series | ✅ | Additive synthesis, bỏ 1 hài âm | M | P3 |
| ∞-II ADSR Sculpting | ✅ | `Tone.Synth({ envelope })` | S | P3 |
| ∞-III Filter Sweep | ✅ | Staircase cutoff theo octave | S | P3 |
| ∞-IV Detuned Unison | ✅ | 2 oscillator lệch 5–50 c; staircase | S | P3 |
| ∞-V AM/FM Synthesis | ✅ | `AMSynth` vs `FMSynth`, chuẩn hóa loudness | M | P3 |
| ∞-VI Reverb Space | ✅ | `Reverb.decay` nhỏ/lớn/hội trường | M | P3 |
| ∞-VII Bitcrusher | ✅ | `BitCrusher.bits`; staircase | S | P3 |
| ∞-VIII Stereo Width | ✅ | `StereoWidener.width`; cần tai nghe | M | P3 |
| ∞-IX Phase Cancellation | ✏️ | Đổi thành **Inter-channel Phase**: chỉ ý nghĩa với tai nghe; trên loa bị triệt tiêu | M | Sau |
| ∞-X Spectral Morph | ✅ | Nội suy 2 `PeriodicWave`; hỏi "điểm chuyển ở đâu" | M | Sau |

---

### 4.6 Bài 6 — Định Vị Âm Thanh (`sound-localization`)

**Công nghệ:** `Tone.Panner3D` (HRTF) hoặc `PannerNode` native, `DelayNode` (ITD), `Convolver`/`Reverb` (cue khoảng cách), `SpatialRadar`.

**Bổ sung thiết kế**
- **Headphone check bắt buộc** trước bài này (§6).
- Dùng **staircase góc** (minimum audible angle) ở tier khó thay vì tăng số hướng.
- Trước/sau và elevation: chế độ thử nghiệm, không tính điểm chính (§1 mục 5).
- Cue khoảng cách: giảm gain + lowpass **và tăng tỉ lệ âm phản xạ so với âm trực tiếp** (một trong những cue khoảng cách mạnh nhất).
- Nguồn âm dùng noise/tone; **không** dùng `speechSynthesis`.

| Tier | Quyết định | Ghi chú kỹ thuật | Công sức | Phase |
|------|-----------|------------------|----------|-------|
| ∞-I Moving Source | ✅ | Automation `positionX/Z`; người chơi bấm khi tới đích | M | P3 |
| ∞-II Multi-Source | ✅ | 2–3 nguồn khác timbre để tách | M | P3 |
| ∞-III Distance Perception | ✅ | Gain + lowpass + wet reverb | M | P3 |
| ∞-IV Doppler | ✏️ | Tự tính `f·c/(c−v)` bằng automation | M | Sau |
| ∞-V ITD Precision | ✏️ | `DelayNode` 0–0,7 ms; staircase theo µs | M | P3 |
| ∞-VI Reflection Maze | ⏸ | Cần mô phỏng phản xạ sớm; liên quan precedence effect | L | Hoãn |
| ∞-VII 3D Flight Path | ⏸ | Phụ thuộc HRTF elevation không đáng tin | L | Hoãn |
| ∞-VIII Cocktail Party | ⏸ | Cần clip thu sẵn có license | L | Hoãn |
| ∞-IX Frequency-Dependent Pan | ✏️ | Tách theo dải tần: ILD/ITD khác nhau | S | P3 |
| ∞-X Spatial Sequence | ✅ | Nhớ chuỗi 6–8 vị trí | M | P3 |

---

## 5. Chấm điểm & thích ứng độ khó

### 5.1 Bốn họ tác vụ

| Họ | Bài | Cách thích ứng | Kết quả |
|----|-----|----------------|---------|
| **Span** (nhớ chuỗi) | Bài 1, Bài 6 ∞-X | +1 sau 2 đúng, −1 sau 2 sai | Span tối đa |
| **Nhận diện N lựa chọn** | Bài 2, Bài 4 | Lên level nếu ≥ 80% trong 10 trial gần nhất; xuống nếu < 50% (điều chỉnh theo mức đoán mò 1/N) | Level + ma trận nhầm lẫn |
| **Ngưỡng** (cent, ms, dB, độ, µs) | Bài 1 ∞-VIII, Bài 3 ∞-III, Bài 5, Bài 6 | **Staircase** | Ngưỡng cảm nhận |
| **Thời gian** | Bài 3 | Chấm IOI + Perfect/Good/Miss | Sai số ms, bias |

### 5.2 Staircase 2-down-1-up

Hội tụ khoảng 70,7% đúng (Levitt, 1971). Nên giảm dần kích thước bước sau vài lần đảo chiều (reversal).

```typescript
// shared/src/audio/staircase.ts
export class Staircase {
  reversals: number[] = [];
  private streak = 0;
  private lastDir: 0 | 1 | -1 = 0;

  constructor(
    public value: number,      // vd: 50 (cent)
    private step: number,      // vd: 10
    private min: number,
    private max: number,
  ) {}

  update(correct: boolean) {
    let dir: 0 | 1 | -1 = 0;
    if (correct) {
      if (++this.streak >= 2) { this.streak = 0; dir = -1; }  // đúng 2 lần → khó hơn
    } else {
      this.streak = 0; dir = 1;                               // sai → dễ hơn
    }
    if (dir !== 0) {
      if (this.lastDir !== 0 && dir !== this.lastDir) this.reversals.push(this.value);
      this.lastDir = dir;
      this.value = Math.min(this.max, Math.max(this.min, this.value + dir * this.step));
    }
  }

  /** Ngưỡng ≈ trung bình 6 reversal cuối */
  threshold(): number {
    const r = this.reversals.slice(-6);
    return r.length ? r.reduce((a, b) => a + b, 0) / r.length : this.value;
  }
}
```

**Test staircase:** mô phỏng "người chơi ảo" có ngưỡng thật đã biết (hàm tâm lý học logistic), chạy 200 trial, kiểm tra ước lượng nằm trong ±15% ngưỡng thật.

### 5.3 Lấy mẫu có trọng số (ôn tập thông minh)

Mỗi item (vd `M3`, `maj7`, `swing-2:1`) giữ `ewmaAccuracy`. Xác suất chọn item ∝ `(1 − ewmaAccuracy) + 0,1`. Item hay sai xuất hiện nhiều hơn nhưng vẫn có item dễ xen vào để không nản.

### 5.4 Điểm và phần thưởng

Điểm trial = độ chính xác × hệ số độ khó, thưởng streak; giữ tương thích công thức XP hiện có của Brain Pro (cần bạn đối chiếu với module scoring hiện tại — mình không thấy code đó trong file).

---

## 6. Onboarding, calibration & an toàn thính giác

### 6.1 Luồng lần đầu

```
Giới thiệu + cảnh báo an toàn
  → "Bật âm thanh" (nút bấm → Tone.start(), unlock iOS)
  → Kiểm tra tai nghe
  → Chỉnh âm lượng
  → (Bài 3 / bài dùng tap) Hiệu chỉnh độ trễ
  → Lưu audioProfile
```

`audioProfile` lưu: đã qua headphone check chưa, âm lượng chọn, độ trễ ước lượng (ms), thiết bị/trình duyệt. Hết hạn sau ~30 ngày hoặc khi đổi thiết bị.

### 6.2 Kiểm tra tai nghe

Trình duyệt **không** báo được người dùng đang dùng tai nghe hay loa (`enumerateDevices` chỉ cho nhãn thiết bị sau khi xin quyền, và không đáng tin). Dùng bài kiểm tra dựa trên **triệt tiêu pha**: phát các đoạn tone trong đó một đoạn có 2 kênh ngược pha; qua loa, đoạn ngược pha bị triệt tiêu bớt nên người nghe chọn sai, qua tai nghe thì chọn đúng. Đây là phương pháp trong nghiên cứu của Woods và cộng sự (2017) ⚠️ nên đọc lại bài báo để lấy đúng tham số (tần số, mức dB, số trial).

- Bắt buộc pass với: Bài 6, Bài 5 (∞-VIII, ∞-IX), Bài 1 (∞-VI), Bài 2 (∞-VII).
- Không bắt buộc với các bài còn lại nhưng nhắc nhở.

### 6.3 Âm lượng & an toàn

- Bắt đầu ở mức **thấp**, ramp lên; người dùng tự chỉnh bằng tone/noise hiệu chuẩn.
- Master `Limiter` −3 dB; không bao giờ phát đột ngột lớn.
- Nội dung hiển thị: *"Ứng dụng luyện tập, không phải công cụ chẩn đoán thính lực. Nếu khó chịu, dừng lại và giảm âm lượng."*
- Gợi ý nghỉ sau ~10 phút phiên liên tục (mỏi thính giác).

### 6.4 Hiệu chỉnh độ trễ

Người dùng tap theo tiếng click đều (vd 100 BPM, ~16 nhịp), đo độ lệch trung vị → `userLatencyOffset`. Cảnh báo nếu độ dao động (jitter) lớn hoặc offset > 150 ms (thường do Bluetooth) và đề nghị dùng tai nghe có dây.

---

## 7. Dữ liệu & Backend

### 7.1 Lược đồ (SQL minh họa, điều chỉnh theo DB hiện có)

```sql
exercise_session (
  id, user_id, slug, mode,            -- mode: 'level' | 'infinity'
  level_or_tier, seed,
  started_at, ended_at,
  device_json, audio_profile_json
);

trial_result (
  id, session_id, idx,
  params_json,                        -- tham số sinh đề (tái tạo từ seed)
  answer_json, response_json,
  correct, score, rt_ms,
  created_at
);

user_item_stats (
  user_id, slug, item_key,            -- 'M3', 'maj7', 'swing-2:1', ...
  attempts, correct, ewma_acc, last_seen
);

user_ear_profile (
  user_id, metric, value, updated_at  -- 'pitch_jnd_cents', 'itd_us', 'rhythm_bias_ms', 'pitch_span'
);
```

### 7.2 Endpoint

| Method | Path | Mục đích |
|--------|------|----------|
| POST | `/api/audio/sessions` | Tạo session (trả `seed` gốc) |
| POST | `/api/audio/sessions/:id/trials` | Gửi batch trial (idempotent theo `idx`) |
| GET | `/api/audio/profile` | Hồ sơ tai + item stats |
| GET | `/api/audio/insights?slug=` | Xu hướng, ma trận nhầm lẫn |

Server dùng lại generator trong `shared/` để **tái tạo đề từ seed và xác nhận `answerKey`** trước khi ghi điểm/bảng xếp hạng.

### 7.3 Offline

Trial ghi vào IndexedDB trước, đồng bộ nền khi có mạng. Nếu server từ chối (seed không khớp), giữ điểm cục bộ nhưng không tính xếp hạng.

### 7.4 Phân tích hiển thị cho người dùng

- **Ear Profile** (radar 6 trục): span cao độ, độ chính xác quãng, sai số nhịp, hợp âm, ngưỡng âm sắc, ngưỡng định vị.
- **Ma trận nhầm lẫn:** vd bạn hay nhầm m3 ↔ M3, m7 ↔ M6.
- **Xu hướng** theo tuần.
- Không gắn tuyên bố về "tăng IQ/trí nhớ chung": bằng chứng chuyển giao xa của các bài luyện nhận thức còn hạn chế; luyện âm nhạc cải thiện kỹ năng thính giác liên quan rõ hơn. Nội dung tiếp thị nên bám vào *kỹ năng nghe cụ thể*.

---

## 8. UI/UX, Accessibility, i18n

**Piano (`PianoKeyboard`)**
- SVG, 2–3 octave, cuộn ngang trên mobile; touch target ≥ 44 px.
- Phím máy tính (A S D F ... / W E T ...) để chơi trên desktop.
- Highlight theo audio clock (qua `Tone.Draw`).

**Nhịp (`RhythmGrid`)** — vùng tap lớn, `touch-action: none`, hiển thị sai số từng nhịp sau khi chấm.

**Spectrum (`FrequencySpectrum`)** — `AnalyserNode` (`fftSize` 2048), vẽ bằng canvas, `requestAnimationFrame`; chỉ chạy khi component hiển thị.

**Radar (`SpatialRadar`)** — SVG hình tròn; người chơi chạm vị trí đoán; hiển thị góc sai.

**i18n**
- Toggle ký hiệu nốt: **C D E F G A B ↔ Đô Rê Mi Fa Sol La Si**.
- Bảng tên quãng/hợp âm Việt–Anh (`intervalNames.vi.ts`).

**Accessibility**
- Không dựa vào màu đơn thuần (thêm icon/nhãn).
- `aria-live` cho phản hồi đúng/sai; focus rõ ràng; điều khiển bằng bàn phím đầy đủ.
- Tôn trọng `prefers-reduced-motion`.
- Nói rõ bài tập cần nghe; người khiếm thính có thể dùng phần trực quan (spectrum, thông tin lý thuyết) nhưng không thay thế được bài luyện.
- Phiên ngắn (5–10 phút), có nút tạm dừng.

---

## 9. Lộ trình triển khai chi tiết

> Ước lượng cho **1 dev quen codebase**, đơn vị ngày công, ±30%. Dev thứ hai hoặc người hỗ trợ nhạc lý có thể rút ngắn Phase 2–3.

| Phase | Nội dung | Ước lượng |
|-------|----------|-----------|
| 0 | Nền móng + 3 Spike | 7–9 ngày |
| 1 | Bài 2 + Bài 1 (MVP nghe cơ bản) | 8–10 ngày |
| 2 | Bài 4 + Bài 3 | 12–15 ngày |
| 3 | Bài 5 + Bài 6 (+ vài tier còn lại của Bài 1/2) | 12–16 ngày |
| 4 | Hardening + insights | 6–8 ngày |
| **Tổng** | | **~45–58 ngày công (≈ 9–12 tuần)** |

### Phase 0 — Nền móng & Spike (tuần 1–2)

**Spike (bắt buộc làm trước, mỗi cái ~1 ngày, ra tài liệu quyết định ngắn):**
- [ ] **P0-1 Spike A — Engine:** Tone.js vs native vs `smplr`; cách chia sẻ AudioContext với `CognitiveAudioEngine`; đo kích thước chunk; xác nhận API Tonal (`Scale.detect`, `Voicing`, rhythm-patterns).
- [ ] **P0-2 Spike B — Sample pipeline:** cắt subset piano (khoảng C2–C7, vài mẫu cách nhau quãng 3 thứ), mã hóa mp3 ~64–96 kbps bằng ffmpeg, tự host, cache SW; đo dung lượng và thời gian tải trên 4G (mục tiêu: piano ≲ 2 MB).
- [ ] **P0-3 Spike C — Thời gian/độ trễ:** trang thử tap-theo-click trên iPhone Safari, Android Chrome, desktop Chrome/Firefox/Safari, tai nghe có dây và Bluetooth; kiểm tra `getOutputTimestamp` và `outputLatency`.

**Xây nền:**
- [ ] P0-4 Types/constants: `cat-6`, 6 `ExerciseSlug`, nhãn "Thính Giác & Cảm Âm", cấu trúc `infinity/*.ts`.
- [ ] P0-5 `rng.ts`, `staircase.ts` + test.
- [ ] P0-6 `musicTheoryService` (thuần) + `notation.ts` + `intervalNames.vi.ts` + test.
- [ ] P0-7 `AudioEngine`: unlock, master bus, scheduler, voices synth, `AudioGate`, voice pool/dispose.
- [ ] P0-8 Calibration: `HeadphoneCheck`, `VolumeSetup`, `LatencyTap`, lưu `audioProfile`.
- [ ] P0-9 `useTrialLoop` + `FeedbackPanel` + logging + khung endpoint (§7).
- [ ] P0-10 CI: Vitest, kiểm tra bundle budget, lint.

**Definition of Done:** bấm một nút là có âm thanh trên iOS/Android/desktop; jitter đã đo và ghi lại; toàn bộ generator/scorer test chạy được không cần trình duyệt.

### Phase 1 — Quãng & Cao độ (Bài 2 + Bài 1)

- [ ] `PianoKeyboard` (SVG, phím máy tính, Storybook nếu dùng).
- [ ] `IntervalIdentifyGame`: level 1–12; tier **∞-I, II, III, IX, X**.
- [ ] `PitchRecallGame`: level 1–12; tier **∞-I, II (Contour), IV, VIII (staircase), X**.
- [ ] Chế độ Học; feedback phát lại; random root; roving.
- [ ] `user_item_stats` + ma trận nhầm lẫn v1.
- [ ] Đăng ký vào `ActiveGameContainer`; relation map.

**DoD:** người dùng mới đi từ onboarding → hoàn thành 1 phiên; dữ liệu trial lưu đúng; đáp án được người có nền nhạc lý duyệt cho Bài 2.

### Phase 2 — Hợp âm & Nhịp (Bài 4 + Bài 3)

- [ ] Tích hợp sampler piano/guitar (lazy) + `AudioGate` hiện tiến trình tải.
- [ ] `ChordIdentifyGame`: level 1–12; tier **∞-I, II, III, V, VI, VII, VIII, IX**; voicing generator.
- [ ] `RhythmGrid`, `clockSync`, calibration độ trễ, scorer IOI.
- [ ] `RhythmRecallGame`: level 1–12; tier **∞-I, II, III, IV, VII, VIII, X**.
- [ ] Bài 2 ∞-IV (Instrument Roulette).

**DoD:** đo được sai số tap p95 trên thiết bị mục tiêu; chuẩn hóa tên hợp âm; nhạc sĩ/giáo viên nhạc duyệt đáp án Bài 4.

### Phase 3 — Âm sắc & Định vị (Bài 5 + Bài 6)

- [ ] `FrequencySpectrum`, `SpatialRadar`.
- [ ] `TimbreMatchGame`: level 1–12; tier **∞-I → VIII** (chuẩn hóa loudness, staircase).
- [ ] `SoundLocalizationGame`: level 1–9 (L/R, 4 hướng, 8 hướng), level 10–12 gắn nhãn thử nghiệm; tier **∞-I, II, III, V, IX, X**.
- [ ] Bài 1 ∞-VI, ∞-VII; Bài 2 ∞-VII (dùng headphone check).
- [ ] Headphone check bắt buộc ở các bài liên quan.

**DoD:** test âm thanh offline (§10) qua; kiểm thử người thật với tai nghe; cảnh báo an toàn hiển thị đúng.

### Phase 4 — Hardening & Insights

- [ ] Ear Profile + trang insight.
- [ ] PWA offline (cache sample, xử lý quota lưu trữ).
- [ ] Audit accessibility, i18n, hiệu năng, bộ nhớ (chơi 30 phút không rò rỉ node).
- [ ] Ma trận thiết bị (§10), feature flag để phát hành dần.
- [ ] Beta 10–20 người; hiệu chỉnh ngưỡng lên/xuống level để độ chính xác người mới ~70–85%.
- [ ] Rà soát nhạc lý toàn bộ đáp án; trang credit (Salamander, v.v.).

### Phase 5 — Backlog sau MVP
Xem §14.

---

## 10. Chiến lược kiểm thử

| Tầng | Công cụ | Kiểm tra |
|------|---------|----------|
| Unit | Vitest | Mỗi level sinh stimulus hợp lệ; cùng seed → cùng đề; scorer đúng biên (rỗng, dư, thiếu) |
| Property | fast-check | `transpose` giữ nguyên quãng; scorer đơn điệu (sai nhiều không được điểm cao hơn); Bjorklund cho đúng số xung |
| Staircase | Vitest | Người chơi ảo hội tụ về ngưỡng thật (§5.2) |
| Audio offline | `OfflineAudioContext` / `Tone.Offline` + FFT | Nốt +50 cent lệch đúng tỉ số `2^(50/1200)`; pan trái/phải đúng kênh; ITD đúng (tương quan chéo); tone không có click ở biên |
| E2E | Playwright (Chromium) | Luồng onboarding → chơi → lưu kết quả; cờ `--autoplay-policy=no-user-gesture-required` |
| Thiết bị thật | Thủ công | iPhone Safari, Android Chrome, desktop Chrome/Firefox/Safari; tai nghe có dây/Bluetooth |
| Hiệu năng | Bundle visualizer | Chunk audio tách riêng; không tăng initial bundle |
| Nhạc lý | Người duyệt | Toàn bộ answer key hợp âm/quãng/mode |

> Playwright không "nghe" được âm thanh; kiểm tra chất lượng âm bằng test offline (render vào buffer rồi phân tích), còn cảm nhận thật phải thử tay.

---

## 11. Ngân sách hiệu năng & PWA

| Chỉ số | Mục tiêu |
|--------|----------|
| Initial bundle | Không tăng (Tone/Tonal chỉ nằm chunk audio) |
| Bấm → có tiếng (synth) | < 300 ms |
| Piano sample lần đầu | ≲ 2 s trên 4G với subset ≲ 2 MB |
| Jitter lịch phát | p95 < 10 ms |
| Bộ nhớ | Chỉ decode sample cần dùng; dispose node sau trial |
| Offline | Sample + shell app cache; hàng đợi trial trong IndexedDB |

Ghi baseline kích thước Tone/Tonal ở Spike A, đặt ngân sách ≤ baseline + 10% trong CI.

---

## 12. Rủi ro & giảm thiểu

| # | Rủi ro | Mức | Giảm thiểu |
|---|--------|-----|-----------|
| R1 | iOS Safari: silent switch, autoplay, giới hạn AudioContext | Cao | `AudioGate`, `audioSession`, 1 context duy nhất, test thiết bị thật sớm (Spike C) |
| R2 | Bluetooth trễ phá bài nhịp | Cao | Calibration, chấm IOI, cảnh báo |
| R3 | Bundle phình do Tone.js | Trung bình | Lazy `import()`, ngân sách CI, cân nhắc `smplr` nếu cần |
| R4 | HRTF chung → định vị kém với nhiều người | Cao | Chỉ azimuth phía trước ở MVP, dung sai rộng, chế độ thử nghiệm |
| R5 | License/CDN sample | Trung bình | Tự host, kiểm license, trang credit |
| R6 | Scope creep (60 tier) | Cao | 43 tier MVP, còn lại "Sau/Hoãn"; tier là config |
| R7 | Đáp án nhạc lý sai | Cao | Người có nền nhạc duyệt, test property, chuẩn hóa tên |
| R8 | Hại thính giác | Cao | Limiter, ramp, âm lượng khởi đầu thấp, gợi ý nghỉ |
| R9 | Người không có nền nhạc bỏ cuộc | Trung bình | Chế độ Học, nhập bằng số bậc, level đầu dễ, feedback phát lại |
| R10 | Tuyên bố quá mức về hiệu quả | Trung bình | Chỉ nói về kỹ năng nghe cụ thể, ghi rõ giới hạn |
| R11 | API Tonal khác giả định | Thấp | Kiểm tra ở Spike A, bọc trong `musicTheoryService` |
| R12 | Rò rỉ bộ nhớ audio node | Trung bình | Voice pool, `dispose()`, test chơi dài |

---

## 13. Trả lời các Open Questions của v2

1. **Ưu tiên phase nào?** **Phase 0 trước** (nền móng + spike), rồi Phase 1 (Quãng + Cao độ). Không làm cả 6 bài cùng lúc: Bài 2 là lõi cảm âm, dùng chung nền với Bài 1 và Bài 4.
2. **Có cần Tone.js?** **Có, nhưng lazy-load.** Synth thuần ở level thấp (ít cue nhiễu, nốt "sạch"), piano/guitar thật ở tier/level cao để chuyển giao sang nhạc thật. Tone.js đáng giá nhất cho Bài 3 (scheduling), Bài 5 (AM/FM, Reverb, BitCrusher), Bài 6 (Panner3D). Spike A xác nhận lại bằng số liệu thực.
3. **Chords API có cần offline fallback?** **Không dùng API.** Sinh hợp âm và voicing offline bằng Tonal, nên không có gì để "fallback".

---

## 14. Backlog sau MVP

- **Bài 7 — Hát lại (vocal matching):** `getUserMedia` + `pitchy` đo cao độ giọng, chấm sai số cent. Yêu cầu tai nghe, tắt echo cancellation/noise suppression/AGC, không lưu audio thô, xin consent rõ ràng.
- **Nhập bằng MIDI (Web MIDI)** cho người có đàn.
- **Khuông nhạc** (`abcjs`/VexFlow) ở chế độ xem lại.
- **Thử thách hằng ngày** (seed theo ngày) + bảng xếp hạng có xác minh từ seed.
- **Ngũ cung Việt:** thư viện thang 5 âm (Cung–Thương–Giốc–Chủy–Vũ) cho bài nhận diện thang; lưu ý nhạc truyền thống có thể lệch khỏi 12-TET nên cần nêu rõ khi dùng bản xấp xỉ.
- **Tier "Sau"/"Hoãn"** trong §4.
- **Tùy chọn cá nhân hóa HRTF** (nếu có nguồn dữ liệu phù hợp) cho Bài 6.

---

## 15. Checklist trước khi phát hành

- [ ] Mọi bài chạy được trên iOS Safari, Android Chrome, desktop (3 trình duyệt)
- [ ] Onboarding: unlock âm thanh, headphone check, âm lượng, độ trễ
- [ ] Limiter, ramp, cảnh báo an toàn hiển thị
- [ ] Đáp án nhạc lý đã được người có chuyên môn duyệt
- [ ] Generator thuần, test seed xác định; server xác nhận đáp án từ seed
- [ ] Trial được log; hàng đợi offline hoạt động
- [ ] Chunk audio tách riêng; ngân sách bundle qua CI
- [ ] Sample tự host, credit đầy đủ, license đã kiểm
- [ ] Accessibility: bàn phím, aria-live, reduced motion, không chỉ dựa vào màu
- [ ] Toggle Đô-Rê-Mi và nhãn Việt–Anh đầy đủ
- [ ] Chơi liên tục 30 phút không rò rỉ bộ nhớ/không tụt hiệu năng
- [ ] Nội dung không có tuyên bố y tế/hiệu quả quá mức
- [ ] Beta test xong, ngưỡng lên/xuống level đã hiệu chỉnh
