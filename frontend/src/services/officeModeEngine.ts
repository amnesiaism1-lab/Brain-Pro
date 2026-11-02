import { auditoryEngine } from './auditoryEngine';
import { generateIntervalQuestion, INTERVAL_CATALOG, transposeNote } from './musicTheoryService';
import { OfficeQuestion, OfficeQuestionOption } from '../store/slices/officeModeSlice';
import { useAppStore } from '../store/useAppStore';

class OfficeModeEngine {
  private recentKeystrokes: number[] = [];
  private isListeningKeys = false;
  private isPlayingAudio = false;

  constructor() {
    this.setupTypingListener();
  }

  /**
   * Theo dõi tần suất gõ phím của người dùng (ngoại trừ tổ hợp Alt)
   * để phát hiện user có đang tập trung gõ văn bản/code hay không.
   */
  private setupTypingListener(): void {
    if (typeof window === 'undefined' || this.isListeningKeys) return;
    this.isListeningKeys = true;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Bỏ qua các phím điều khiển hệ thống và tổ hợp phím tắt Alt
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

      const now = Date.now();
      this.recentKeystrokes.push(now);

      // Chỉ giữ lại các phím trong 3 giây gần nhất
      const cutoff = now - 3000;
      this.recentKeystrokes = this.recentKeystrokes.filter(t => t > cutoff);
    }, { passive: true });
  }

  /**
   * Kiểm tra xem user có đang gõ phím tích cực (≥3 phím trong 2 giây gần nhất) hay không
   */
  public isUserActivelyTyping(): boolean {
    const now = Date.now();
    const cutoff = now - 2000;
    const count = this.recentKeystrokes.filter(t => t > cutoff).length;
    return count >= 3;
  }

  /**
   * Tạo câu hỏi mới cho bài tập Nhận Diện Quãng
   */
  public generateIntervalQuestion(): OfficeQuestion {
    const store = useAppStore.getState();
    const effectiveLevel = store.getExerciseLevel('interval-identify') || store.currentLevel || 1;
    const isInfinity = effectiveLevel >= 13;

    // 1. Phân bổ pool quãng theo cấp độ khoa học thần kinh
    let intervalPool: string[];
    if (effectiveLevel <= 2) {
      intervalPool = ['1P', '3M', '5P', '8P'];
    } else if (effectiveLevel <= 4) {
      intervalPool = ['2M', '3M', '4P', '5P', '6M', '8P'];
    } else if (effectiveLevel <= 6) {
      intervalPool = ['2m', '2M', '3m', '3M', '4P', '5P', '6m', '6M', '7m', '7M', '8P'];
    } else {
      intervalPool = ['2m', '2M', '3m', '3M', '4P', '4A', '5P', '6m', '6M', '7m', '7M', '8P'];
    }

    // 2. Tích hợp ma trận nhầm lẫn (Confusion Matrix): 30% tỷ lệ ưu tiên các cặp hay nhầm
    const confusion = store.earConfusionMatrix || {};
    const confusionKeys = Object.keys(confusion);
    if (confusionKeys.length > 0 && Math.random() < 0.3) {
      // Tìm cặp có số lần nhầm nhiều nhất
      const sorted = [...confusionKeys].sort((a, b) => (confusion[b] || 0) - (confusion[a] || 0));
      const topPair = sorted[0]; // e.g. "3m:3M"
      const pairParts = topPair.split(':');
      const validCandidate = pairParts.find(p => intervalPool.includes(p));
      if (validCandidate) {
        // Đặt quãng này lên đầu pool để tăng xác suất chọn
        intervalPool = [validCandidate, ...intervalPool.filter(c => c !== validCandidate)];
      }
    }

    // 3. Chế độ phát âm thanh (playback direction)
    let playbackMode: 'ascending' | 'descending' | 'harmonic' | 'mixed' = 'ascending';
    if (effectiveLevel >= 7 || effectiveLevel === 22) {
      playbackMode = 'harmonic';
    } else if (effectiveLevel >= 4) {
      playbackMode = 'mixed';
    }

    // 4. Số lượng đáp án (4..6)
    const optionsCount = effectiveLevel >= 8 || isInfinity ? 5 : 4;

    // 5. Sinh câu hỏi bằng musicTheoryService
    const rawQ = generateIntervalQuestion(intervalPool, playbackMode, optionsCount);

    const mappedOptions: OfficeQuestionOption[] = rawQ.options.map((opt, idx) => ({
      index: idx + 1,
      code: opt.code,
      label: opt.nameVi,
      isCorrect: opt.code === rawQ.intervalCode,
      semitones: opt.semitones
    }));

    return {
      id: `office-q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      exerciseSlug: 'interval-identify',
      level: effectiveLevel,
      rootNote: rawQ.rootNote,
      targetNote: rawQ.targetNote,
      intervalCode: rawQ.intervalCode,
      playbackDirection: rawQ.playbackDirection,
      options: mappedOptions,
      createdAt: Date.now(),
      replays: 0
    };
  }

  /**
   * Phát âm thanh câu hỏi
   */
  public async playQuestionAudio(question: OfficeQuestion, isReplay = false): Promise<void> {
    if (this.isPlayingAudio) return;
    this.isPlayingAudio = true;

    try {
      const store = useAppStore.getState();
      const settings = store.officeSettings;
      const volume = settings?.volume ?? 0.7;

      await auditoryEngine.resumeAudioContext();

      // Âm báo trước nhẹ (chime) trước câu hỏi mới
      if (!isReplay) {
        auditoryEngine.playNote('A5', 0.08, { volume: volume * 0.2, waveform: 'sine' });
        await new Promise(r => setTimeout(r, 450));
      }

      // Phát nốt chủ âm (Tonic Anchor) nếu được bật
      if (settings?.enableTonicBefore && !isReplay) {
        await auditoryEngine.playTonicAnchor(question.rootNote, 'single', volume * 0.6);
        await new Promise(r => setTimeout(r, 260));
      }

      // Phát quãng âm chính
      await auditoryEngine.playInterval(
        question.rootNote,
        question.targetNote,
        question.playbackDirection,
        0.6,
        420
      );
    } catch (err) {
      console.warn('Office mode audio playback error:', err);
    } finally {
      this.isPlayingAudio = false;
    }
  }

  /**
   * Phát âm thanh của một đáp án cụ thể (dành cho chế độ Freestyle và nghe thử đối chiếu)
   */
  public async playOptionAudio(question: OfficeQuestion, optionIndex: number): Promise<void> {
    const opt = question.options.find(o => o.index === optionIndex);
    if (!opt) return;

    try {
      const store = useAppStore.getState();
      const settings = store.officeSettings;
      const volume = settings?.volume ?? 0.7;

      await auditoryEngine.resumeAudioContext();
      const targetNote = question.playbackDirection === 'descending'
        ? transposeNote(question.rootNote, '-' + opt.code)
        : transposeNote(question.rootNote, opt.code);

      await auditoryEngine.playInterval(
        question.rootNote,
        targetNote,
        question.playbackDirection,
        0.55,
        380
      );
    } catch (err) {
      console.warn('Play option audio error:', err);
    }
  }

  /**
   * Phát phản hồi âm thanh khi trả lời đúng
   */
  public async playCorrectFeedback(): Promise<void> {
    try {
      await auditoryEngine.resumeAudioContext();
      auditoryEngine.playFeedback(true);
    } catch (e) {
      console.warn('Feedback sound error:', e);
    }
  }

  /**
   * Phát phản hồi khi trả lời sai (tiếng buzz + tự động phát lại đáp án đúng)
   */
  public async playWrongFeedback(question: OfficeQuestion, autoReplay = true): Promise<void> {
    try {
      await auditoryEngine.resumeAudioContext();
      auditoryEngine.playFeedback(false);

      if (autoReplay) {
        await new Promise(r => setTimeout(r, 400));
        await auditoryEngine.playInterval(
          question.rootNote,
          question.targetNote,
          question.playbackDirection,
          0.6,
          400
        );
      }
    } catch (e) {
      console.warn('Wrong feedback error:', e);
    }
  }
}

export const officeModeEngine = new OfficeModeEngine();
