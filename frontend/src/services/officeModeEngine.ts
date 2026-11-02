import { auditoryEngine } from './auditoryEngine';
import { generateIntervalQuestion, INTERVAL_CATALOG, transposeNote, generateRandomPitchSequence } from './musicTheoryService';
import { OfficeQuestion, OfficeQuestionOption } from '../store/slices/officeModeSlice';
import { useAppStore } from '../store/useAppStore';

export { noteToSolfege, sequenceToSolfege } from './pitchRecallKeyMap';
import { noteToSolfege, sequenceToSolfege, RULE_INFO_MAP } from './pitchRecallKeyMap';

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
   * Tạo câu hỏi tổng quát dựa trên cấu hình exerciseSlug đang chọn ('pitch-recall' | 'interval-identify')
   */
  public generateNextQuestion(): OfficeQuestion {
    const store = useAppStore.getState();
    const slug = store.officeSettings?.exerciseSlug || 'pitch-recall';

    if (slug === 'pitch-recall') {
      return this.generatePitchRecallQuestion();
    }
    return this.generateIntervalQuestion();
  }

  /**
   * Tạo câu hỏi cho bài tập "Nhớ Cao Độ" (Pitch Recall)
   */
  public generatePitchRecallQuestion(): OfficeQuestion {
    const store = useAppStore.getState();
    const effectiveLevel = store.getExerciseLevel('pitch-recall') || store.currentLevel || 1;
    const isInfinity = effectiveLevel >= 13;

    // Chiều dài chuỗi nốt theo cấp độ
    let seqLength = 3;
    if (effectiveLevel >= 5 || isInfinity) {
      seqLength = 5;
    } else if (effectiveLevel >= 3) {
      seqLength = 4;
    }

    const octaves = effectiveLevel >= 5 || isInfinity ? [4, 5] : [4];
    const includeAccidentals = effectiveLevel >= 4 || isInfinity;

    // 1. Sinh chuỗi nốt mục tiêu
    const targetSeq = generateRandomPitchSequence(seqLength, octaves, includeAccidentals);

    // 2. Tạo 3 chuỗi gây nhiễu (distractors)
    const diatonicPool = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
    const pool = includeAccidentals
      ? ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5']
      : diatonicPool;

    const distractors: string[][] = [];
    const maxTries = 30;
    let tries = 0;

    while (distractors.length < 3 && tries < maxTries) {
      tries++;
      const candidate = [...targetSeq];
      const modifyIdx = Math.floor(Math.random() * seqLength);
      const randomNote = pool[Math.floor(Math.random() * pool.length)];

      if (randomNote !== candidate[modifyIdx]) {
        candidate[modifyIdx] = randomNote;
        const candidateKey = candidate.join('-');
        const isDuplicateTarget = candidateKey === targetSeq.join('-');
        const isDuplicateDistractor = distractors.some(d => d.join('-') === candidateKey);

        if (!isDuplicateTarget && !isDuplicateDistractor) {
          distractors.push(candidate);
        }
      }
    }

    // Fallback nếu không đủ 3 distractor
    while (distractors.length < 3) {
      const fallback = generateRandomPitchSequence(seqLength, octaves, includeAccidentals);
      if (fallback.join('-') !== targetSeq.join('-')) {
        distractors.push(fallback);
      }
    }

    // 3. Xáo trộn đáp án
    const allCandidates = [
      { notes: targetSeq, isCorrect: true },
      ...distractors.map(d => ({ notes: d, isCorrect: false }))
    ].sort(() => 0.5 - Math.random());

    const mappedOptions: OfficeQuestionOption[] = allCandidates.map((c, idx) => ({
      index: idx + 1,
      code: c.notes.join('-'),
      label: `${sequenceToSolfege(c.notes)} (${c.notes.join(' ')})`,
      isCorrect: c.isCorrect,
      notes: c.notes
    }));

    return {
      id: `office-pitch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      exerciseSlug: 'pitch-recall',
      level: effectiveLevel,
      rootNote: targetSeq[0],
      sequenceNotes: targetSeq,
      options: mappedOptions,
      createdAt: Date.now(),
      replays: 0
    };
  }

  /**
   * Tạo câu hỏi mới cho bài tập Nhận Diện Quãng (Interval Identify)
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
      const sorted = [...confusionKeys].sort((a, b) => (confusion[b] || 0) - (confusion[a] || 0));
      const topPair = sorted[0];
      const pairParts = topPair.split(':');
      const validCandidate = pairParts.find(p => intervalPool.includes(p));
      if (validCandidate) {
        intervalPool = [validCandidate, ...intervalPool.filter(c => c !== validCandidate)];
      }
    }

    // 3. Chế độ phát âm thanh
    let playbackMode: 'ascending' | 'descending' | 'harmonic' | 'mixed' = 'ascending';
    if (effectiveLevel >= 7 || effectiveLevel === 22) {
      playbackMode = 'harmonic';
    } else if (effectiveLevel >= 4) {
      playbackMode = 'mixed';
    }

    const optionsCount = effectiveLevel >= 8 || isInfinity ? 5 : 4;
    const rawQ = generateIntervalQuestion(intervalPool, playbackMode, optionsCount);

    const mappedOptions: OfficeQuestionOption[] = rawQ.options.map((opt, idx) => ({
      index: idx + 1,
      code: opt.code,
      label: opt.nameVi,
      isCorrect: opt.code === rawQ.intervalCode,
      semitones: opt.semitones
    }));

    return {
      id: `office-int-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

      // Xử lý phát theo từng loại bài tập
      if (question.exerciseSlug === 'pitch-recall' && question.sequenceNotes && question.sequenceNotes.length > 0) {
        // Phát chuỗi nốt Nhớ Cao Độ
        for (const note of question.sequenceNotes) {
          auditoryEngine.playNote(note, 0.45, { volume });
          await new Promise(r => setTimeout(r, 460));
        }
      } else {
        // Phát bài Nhận Diện Quãng
        if (settings?.enableTonicBefore && !isReplay) {
          await auditoryEngine.playTonicAnchor(question.rootNote, 'single', volume * 0.6);
          await new Promise(r => setTimeout(r, 260));
        }

        if (question.targetNote && question.playbackDirection) {
          await auditoryEngine.playInterval(
            question.rootNote,
            question.targetNote,
            question.playbackDirection,
            0.6,
            420
          );
        }
      }
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

      if (question.exerciseSlug === 'pitch-recall' && opt.notes && opt.notes.length > 0) {
        for (const note of opt.notes) {
          auditoryEngine.playNote(note, 0.42, { volume });
          await new Promise(r => setTimeout(r, 430));
        }
      } else if (opt.code && question.playbackDirection) {
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
      }
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
        await new Promise(r => setTimeout(r, 450));
        const store = useAppStore.getState();
        const volume = store.officeSettings?.volume ?? 0.7;

        if (question.exerciseSlug === 'pitch-recall' && question.sequenceNotes) {
          for (const note of question.sequenceNotes) {
            auditoryEngine.playNote(note, 0.45, { volume });
            await new Promise(r => setTimeout(r, 460));
          }
        } else if (question.targetNote && question.playbackDirection) {
          await auditoryEngine.playInterval(
            question.rootNote,
            question.targetNote,
            question.playbackDirection,
            0.6,
            400
          );
        }
      }
    } catch (e) {
      console.warn('Wrong feedback error:', e);
    }
  }

  /**
   * Gửi thông báo Desktop khi tab đang chạy ngầm (Background)
   */
  public showBackgroundNotification(question: OfficeQuestion): void {
    if (typeof window === 'undefined') return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (!document.hidden) return; // Chỉ gửi khi tab đang bị che hoặc ở tab khác

    try {
      const store = useAppStore.getState();
      const rule = store.officeSettings?.pitchRecallInputRule || 'scale-degrees';
      const isPitch = question.exerciseSlug === 'pitch-recall';
      const seqLen = question.sequenceNotes?.length || 3;

      const title = isPitch
        ? `🎵 Nhớ Cao Độ (Cấp ${question.level}): Vừa phát ${seqLen} nốt!`
        : `🎵 Nhận Diện Quãng: Đã phát câu hỏi mới!`;

      const ruleGuide = RULE_INFO_MAP[rule]?.hotkeyGuide || 'Phím 1..7';
      const body = isPitch
        ? `Nhấp vào đây để quay lại gõ phím trả lời (${ruleGuide}, hoặc Alt+R nghe lại).`
        : 'Bấm vào thông báo này để quay lại tab trả lời (Alt+1..4).';

      const notif = new Notification(title, {
        body,
        icon: '/favicon.png',
        tag: 'office-mode-question'
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('Failed to send notification:', e);
    }
  }
}

export const officeModeEngine = new OfficeModeEngine();
