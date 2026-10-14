import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Metronome } from '../ui/Metronome';
import { auditoryEngine } from '../../services/auditoryEngine';
import { 
  Play, 
  Square, 
  Volume2, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Timer,
  Brain
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const DRUM_TYPES = ['kick', 'snare', 'hihat'] as const;

interface ITapRecord {
  beatNumber: number;
  offsetMs: number;
  expectedTimeMs: number;
  actualTimeMs: number;
}

export const RhythmModule: React.FC = () => {
  const { setActiveTab, setSelectedExerciseSlug, markTheoryModuleMastered, masteredTheoryModules } = useAppStore();

  // 16-Step Sequencer State
  const [bpm, setBpm] = useState(110);
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 3 tracks x 16 steps
  const [grid, setGrid] = useState<Record<'kick' | 'snare' | 'hihat', boolean[]>>({
    hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    kick: [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false]
  });

  const seqTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleCell = (drum: 'kick' | 'snare' | 'hihat', step: number) => {
    setGrid(prev => {
      const row = [...prev[drum]];
      row[step] = !row[step];
      return { ...prev, [drum]: row };
    });
  };

  const loadPreset = (presetName: 'rock' | 'dance' | 'hiphop') => {
    if (presetName === 'rock') {
      setBpm(115);
      setGrid({
        hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        kick: [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false]
      });
    } else if (presetName === 'dance') {
      setBpm(126);
      setGrid({
        hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false]
      });
    } else {
      // hiphop
      setBpm(90);
      setGrid({
        hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        kick: [true, false, false, true, false, false, false, false, false, false, true, false, false, false, false, false]
      });
    }
  };

  useEffect(() => {
    if (!isPlayingSeq) {
      if (seqTimerRef.current) clearInterval(seqTimerRef.current);
      setCurrentStep(0);
      return;
    }

    const stepMs = Math.round((60000 / bpm) / 4); // 16th notes
    let step = 0;

    seqTimerRef.current = setInterval(() => {
      auditoryEngine.resumeAudioContext().catch(() => {});
      if (grid.kick[step]) auditoryEngine.playDrum('kick', 1.0);
      if (grid.snare[step]) auditoryEngine.playDrum('snare', 0.85);
      if (grid.hihat[step]) auditoryEngine.playDrum('hihat', 0.6);

      setCurrentStep(step);
      step = (step + 1) % 16;
    }, stepMs);

    return () => {
      if (seqTimerRef.current) clearInterval(seqTimerRef.current);
    };
  }, [isPlayingSeq, bpm, grid]);

  // ===================== TIMING OFFSET DRILL STATE =====================
  const [timingBpm, setTimingBpm] = useState(100);
  const [timingPhase, setTimingPhase] = useState<'idle' | 'listening' | 'tapping' | 'finished'>('idle');
  const [activeLeadBeat, setActiveLeadBeat] = useState<number>(0);
  const [tapRecords, setTapRecords] = useState<ITapRecord[]>([]);
  const drillStartRef = useRef<number>(0);
  const leadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beatDurationMs = Math.round(60000 / timingBpm);

  const startTimingDrill = async () => {
    await auditoryEngine.resumeAudioContext();
    setTapRecords([]);
    setTimingPhase('listening');
    setActiveLeadBeat(1);

    const now = performance.now();
    drillStartRef.current = now;

    // Play 4 lead-in beats
    for (let i = 1; i <= 4; i++) {
      leadTimerRef.current = setTimeout(() => {
        setActiveLeadBeat(i);
        auditoryEngine.playDrum(i === 1 ? 'kick' : 'hihat', i === 1 ? 0.9 : 0.6);

        if (i === 4) {
          // Transition to user tapping phase
          setTimeout(() => {
            setTimingPhase('tapping');
            setActiveLeadBeat(0);
          }, beatDurationMs);
        }
      }, (i - 1) * beatDurationMs);
    }
  };

  const handleUserTap = useCallback(() => {
    if (timingPhase !== 'tapping') return;

    auditoryEngine.playDrum('snare', 0.8);
    const now = performance.now();
    const currentTapIndex = tapRecords.length; // 0, 1, 2, 3 corresponding to beats 5, 6, 7, 8
    if (currentTapIndex >= 4) return;

    const expectedTime = drillStartRef.current + (4 + currentTapIndex) * beatDurationMs;
    const offset = Math.round(now - expectedTime);

    const newRecord: ITapRecord = {
      beatNumber: 5 + currentTapIndex,
      offsetMs: offset,
      expectedTimeMs: expectedTime,
      actualTimeMs: now
    };

    const nextRecords = [...tapRecords, newRecord];
    setTapRecords(nextRecords);

    if (nextRecords.length === 4) {
      setTimeout(() => {
        setTimingPhase('finished');
      }, 500);
    }
  }, [timingPhase, tapRecords, beatDurationMs]);

  // Spacebar hotkey for tapping drill
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && timingPhase === 'tapping') {
        e.preventDefault();
        handleUserTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUserTap, timingPhase]);

  // Cleanup drill timers
  useEffect(() => {
    return () => {
      if (leadTimerRef.current) clearTimeout(leadTimerRef.current);
    };
  }, []);

  const avgOffset = tapRecords.length > 0
    ? Math.round(tapRecords.reduce((acc, r) => acc + Math.abs(r.offsetMs), 0) / tapRecords.length)
    : 0;

  // ===================== QUICK MASTERY CHECK (3 Qs) =====================
  const RHYTHM_QUESTIONS = [
    {
      id: 'q1',
      title: 'Câu 1: Nhịp 4/4 có trọng âm mạnh nhất ở đâu?',
      options: [
        { id: 'a', label: 'Phách 1 (Downbeat - Đầu ô nhịp)', isCorrect: true },
        { id: 'b', label: 'Phách 2 (Upbeat)', isCorrect: false },
        { id: 'c', label: 'Phách 4 (Phách nhẹ chuyển giao)', isCorrect: false },
        { id: 'd', label: 'Tất cả các phách đều mạnh như nhau', isCorrect: false }
      ],
      explanation: 'Chính xác! Phách 1 (Downbeat) luôn là trụ cột chịu lực mạnh nhất neo giữ cấu trúc ô nhịp trong âm nhạc Tây phương.'
    },
    {
      id: 'q2',
      title: 'Câu 2: "Đảo phách" (Syncopation) hoạt động theo cơ chế nào?',
      options: [
        { id: 'a', label: 'Chơi chậm lại một nửa nhịp (Half time)', isCorrect: false },
        { id: 'b', label: 'Nhấn trọng âm bất ngờ vào phách yếu hoặc nửa phách (off-beat)', isCorrect: true },
        { id: 'c', label: 'Tăng tốc độ bài hát lên gấp đôi', isCorrect: false },
        { id: 'd', label: 'Loại bỏ hoàn toàn tiếng trống bass', isCorrect: false }
      ],
      explanation: 'Chính xác! Đảo phách dịch chuyển điểm nhấn từ phách chính sang phách yếu hoặc phần lẻ giữa 2 phách, tạo lực lắc lư lôi cuốn trong Funk, Jazz và R&B.'
    },
    {
      id: 'q3',
      title: 'Câu 3: Trong nhận thức thính giác, Dấu Nghỉ (Musical Rest) đóng vai trò gì?',
      options: [
        { id: 'a', label: 'Chỉ là sự thụ động chờ nhạc công đánh tiếp', isCorrect: false },
        { id: 'b', label: 'Không có tác động thần kinh nào', isCorrect: false },
        { id: 'c', label: 'Khoảng lặng chủ động, kích hoạt sự ức chế phản xạ (Inhibition Control)', isCorrect: true },
        { id: 'd', label: 'Làm hỏng mạch cảm xúc của bài hát', isCorrect: false }
      ],
      explanation: 'Chính xác! Não bộ xử lý dấu nghỉ như một thực thể âm nhạc có tính nén năng lượng, đòi hỏi vỏ não trước trán kích hoạt cơ chế ức chế phản xạ.'
    }
  ];

  const [quizStep, setQuizStep] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleSelectQuizOption = (opt: { id: string; label: string; isCorrect: boolean }) => {
    if (quizSelectedOption) return;
    setQuizSelectedOption(opt.id);
    if (opt.isCorrect) {
      auditoryEngine.playFeedback(true);
      setQuizScore(prev => prev + 1);
    } else {
      auditoryEngine.playFeedback(false);
    }

    setTimeout(() => {
      if (quizStep < 2) {
        setQuizStep(prev => prev + 1);
        setQuizSelectedOption(null);
      } else {
        setQuizFinished(true);
        if (quizScore + (opt.isCorrect ? 1 : 0) >= 2) {
          markTheoryModuleMastered('rhythm');
        }
      }
    }, 1500);
  };

  const handleStartRhythmExercise = () => {
    setSelectedExerciseSlug('rhythm-recall');
    setActiveTab('exercises');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Theory Introduction */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🥁</span>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Khái Niệm 5: Nhịp Điệu & Phách (Rhythm & Time)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Cấu trúc thời gian của âm nhạc — nhịp phách, giá trị nốt, đảo phách và tốc độ (BPM)
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
          <p>
            <strong>Nhịp điệu (Rhythm)</strong> là sự phân bổ các âm thanh và khoảng lặng theo chu kỳ thời gian. Không có nhịp điệu, âm nhạc chỉ là những nốt cao độ rời rạc.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 not-prose my-3">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <span className="font-bold text-amber-700 dark:text-amber-400 text-sm block">1. Nhịp 4/4 (Thông Dụng)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Mỗi ô nhịp có 4 phách. Phách 1 mạnh nhất (Downbeat), phách 3 mạnh vừa, phách 2 và 4 nhẹ.
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 text-sm block">2. Nhịp 3/4 (Waltz)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Điệu Valse bồng bềnh: <strong>Mạnh - Nhẹ - Nhẹ</strong> (Bùm - Chát - Chát).
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs">
              <span className="font-bold text-purple-700 dark:text-purple-400 text-sm block">3. Đảo Phách (Syncopation)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Nhấn trọng âm vào phách yếu hoặc nửa phách (off-beat). Tạo cảm giác lắc lư cuốn hút của Funk, Jazz và Reggae.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 16-Step Drum Sequencer */}
      <div className="p-6 bg-slate-950 text-white rounded-3xl shadow-2xl border border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-amber-400" />
              Bàn Phối Nhịp Tương Tác 16-Step Sequencer
            </h3>
            <p className="text-xs text-slate-400">
              Bật/tắt các ô trên lưới 16 bước để lập trình tiết tấu loop riêng của bạn
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Mẫu sẵn:</span>
            <button
              onClick={() => loadPreset('rock')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 transition-colors"
            >
              Rock Beat
            </button>
            <button
              onClick={() => loadPreset('dance')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 transition-colors"
            >
              Four-on-Floor
            </button>
            <button
              onClick={() => loadPreset('hiphop')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-purple-300 transition-colors"
            >
              Hip-hop Groove
            </button>
          </div>
        </div>

        {/* Step Sequencer Grid - Explicitly 16 Columns Grid to guarantee horizontal layout */}
        <div className="space-y-3 overflow-x-auto pb-2">
          {DRUM_TYPES.map(drum => (
            <div key={drum} className="flex items-center gap-2 min-w-[620px]">
              <div className="w-20 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between shrink-0">
                <span>{drum === 'kick' ? '🥁 Kick' : drum === 'snare' ? '💥 Snare' : '✨ Hi-hat'}</span>
              </div>
              <div
                className="flex-1 grid gap-1.5"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(16, minmax(0, 1fr))'
                }}
              >
                {grid[drum].map((active, stepIdx) => {
                  const isCurrent = isPlayingSeq && currentStep === stepIdx;
                  const isDownbeat = stepIdx % 4 === 0;

                  return (
                    <button
                      key={stepIdx}
                      type="button"
                      onClick={() => toggleCell(drum, stepIdx)}
                      className={`h-11 rounded-lg transition-all font-mono text-[10px] flex items-center justify-center font-bold cursor-pointer active:scale-95 ${
                        isCurrent
                          ? 'ring-2 ring-white scale-105 z-10'
                          : ''
                      } ${
                        active
                          ? drum === 'kick'
                            ? 'bg-amber-500 shadow-md shadow-amber-500/50 text-slate-950 font-black'
                            : drum === 'snare'
                            ? 'bg-rose-500 shadow-md shadow-rose-500/50 text-white font-black'
                            : 'bg-cyan-400 shadow-md shadow-cyan-400/50 text-slate-950 font-black'
                          : isDownbeat
                          ? 'bg-slate-800/80 border border-slate-700 text-slate-400 hover:bg-slate-750'
                          : 'bg-slate-900 border border-slate-800/80 text-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      {stepIdx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sequencer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlayingSeq(!isPlayingSeq)}
              className={`px-6 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer ${
                isPlayingSeq
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/30'
              }`}
            >
              {isPlayingSeq ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Dừng Beat</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Chạy Beat Loop</span>
                </>
              )}
            </button>

            <span className="text-xs font-mono text-slate-400">
              Tốc độ: <strong className="text-amber-400">{bpm} BPM</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">BPM:</span>
            <input
              type="range"
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>
      </div>

      {/* NEW: THỬ THÁCH ĐO ĐỘ LỆCH NHỊP THẦN KINH (Timing Offset Accuracy Drill ±ms) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Phòng Đo Độ Lệch Nhịp Thần Kinh (Neural Timing Accuracy ±ms)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đo khả năng nội tại hóa chu kỳ thời gian (Internal Clocking) và độ trễ phản xạ vận động
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Tốc độ test:</span>
            {[80, 100, 120].map(val => (
              <button
                key={val}
                disabled={timingPhase === 'listening' || timingPhase === 'tapping'}
                onClick={() => setTimingBpm(val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  timingBpm === val
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {val} BPM
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4 text-center">
          {timingPhase === 'idle' && (
            <div className="space-y-3 py-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
                Quy trình: Máy đếm nhịp sẽ gõ <strong>4 phách mẫu (1, 2, 3, 4)</strong>. Ngay sau đó âm thanh sẽ tắt đi, bạn hãy gõ phím <strong>Spacebar</strong> (hoặc nút bấm) tiếp nối chuẩn xác <strong>4 phách tiếp theo (5, 6, 7, 8)</strong>!
              </p>
              <button
                onClick={startTimingDrill}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Bắt Đầu Đo Phản Xạ Nhịp ({timingBpm} BPM)
              </button>
            </div>
          )}

          {timingPhase === 'listening' && (
            <div className="space-y-4 py-4">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                Đang lắng nghe 4 phách mồi nhịp... Hãy cảm nhận chu kỳ!
              </span>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4].map(b => (
                  <div
                    key={b}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-black text-lg transition-all ${
                      activeLeadBeat === b
                        ? 'bg-amber-500 text-slate-950 scale-110 shadow-lg shadow-amber-500/40 ring-4 ring-amber-300'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {b}
                  </div>
                ))}
              </div>
            </div>
          )}

          {timingPhase === 'tapping' && (
            <div className="space-y-4 py-3 animate-fadeIn">
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>ÂM THANH ĐÃ TẮT! GÕ PHÍM THEO NHỊP NỘI TẠI ({tapRecords.length}/4 phách)</span>
              </div>

              <div className="flex justify-center gap-3">
                {[5, 6, 7, 8].map((b, idx) => {
                  const record = tapRecords[idx];
                  return (
                    <div
                      key={b}
                      className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-mono transition-all ${
                        record
                          ? Math.abs(record.offsetMs) <= 30
                            ? 'bg-emerald-500 text-white shadow-md'
                            : Math.abs(record.offsetMs) <= 70
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-rose-500 text-white shadow-md'
                          : 'bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <span className="text-sm font-black">{b}</span>
                      {record && (
                        <span className="text-[9px] font-bold">
                          {record.offsetMs > 0 ? `+${record.offsetMs}ms` : `${record.offsetMs}ms`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleUserTap}
                  className="w-full max-w-md py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-sm shadow-xl active:scale-95 transition-all cursor-pointer"
                >
                  BẤM VÀO ĐÂY (HOẶC NHẤN SPACEBAR)
                </button>
              </div>
            </div>
          )}

          {timingPhase === 'finished' && (
            <div className="space-y-4 py-3 animate-fadeIn">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                <Trophy className="w-4 h-4" />
                <span>Hoàn Thành Đo Nhịp Nội Tại</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto">
                {tapRecords.map((r, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-mono text-xs">
                    <span className="text-slate-400 text-[10px] block">Phách {r.beatNumber}</span>
                    <strong className={Math.abs(r.offsetMs) <= 35 ? 'text-emerald-500' : 'text-amber-500'}>
                      {r.offsetMs > 0 ? `+${r.offsetMs}ms` : `${r.offsetMs}ms`}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 max-w-md mx-auto">
                Độ lệch trung bình: <strong>±{avgOffset} ms</strong> — {
                  avgOffset < 30 ? 'Cực kỳ chuẩn xác! Bản đồng hồ sinh học xuất sắc.' :
                  avgOffset < 65 ? 'Rất tốt! Khả năng giữ nhịp vững vàng.' :
                  'Cần luyện tập thêm để giữ nhịp không bị vội hoặc chậm.'
                }
              </div>

              <button
                onClick={startTimingDrill}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Thử Lại Lần Nữa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Standalone Metronome Tool */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          ⏱️ Máy Đếm Nhịp Cá Nhân (Metronome Pro)
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Sử dụng máy đếm nhịp để tập gõ nhịp đều đặn hoặc tìm nhịp độ bằng Tap Tempo:
        </p>

        <div className="max-w-md mx-auto">
          <Metronome initialBpm={100} />
        </div>
      </div>

      {/* Dấu Nghỉ (Rests as Musical Entities) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤫</span>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Dấu Nghỉ & Không Gian Âm Bản (Musical Rests & Negative Space)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Âm nhạc được tạo nên bởi nốt nhạc VÀ chỗ không nốt. Dấu nghỉ đòi hỏi sự ức chế phản xạ (Inhibition Control)
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Nhiều người nghĩ im lặng là thụ động. Nhưng trong tiết tấu, dấu nghỉ là một cú nén năng lượng đầy chủ động. 
          Rèn luyện khả năng phát hiện đúng vị trí ô nghỉ (Rest Spotting) giúp bạn giữ nhịp vững vàng không bị cuốn theo tốc độ.
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(step => (
              <div
                key={step}
                className={`w-9 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold font-mono border ${
                  step === 4
                    ? 'bg-rose-500/10 border-rose-400 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span>{step === 4 ? '𝄽' : '♩'}</span>
                <span className="text-[9px] text-slate-400">{step}</span>
              </div>
            ))}
          </div>

          <button
            onClick={async () => {
              await auditoryEngine.resumeAudioContext();
              // 8-step groove with step 4 silent
              for (let i = 1; i <= 8; i++) {
                if (i !== 4) {
                  auditoryEngine.playDrum(i === 1 ? 'kick' : i === 5 ? 'snare' : 'hihat', i === 1 ? 0.9 : 0.6);
                }
                await new Promise(r => setTimeout(r, 220));
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Nghe Mẫu Tiết Tấu Có Ô Nghỉ (Bước 4)</span>
          </button>
        </div>
      </div>

      {/* Cảm Nhận Phách & Loại Nhịp */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🥁</span>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Cảm Nhận Nhịp Phách & Điểm Nhấn Phách 1 (Meter Feel & Downbeat)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Phách 1 (Downbeat) luôn là phách mạnh nhất neo giữ toàn bộ cấu trúc bài nhạc
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              meter: 'Nhịp 2/4 (Hành khúc)',
              feel: 'Mạnh - Nhẹ (1 - 2)',
              steps: [1.0, 0.4]
            },
            {
              meter: 'Nhịp 3/4 (Valse khiêu vũ)',
              feel: 'Mạnh - Nhẹ - Nhẹ (1 - 2 - 3)',
              steps: [1.0, 0.4, 0.4]
            },
            {
              meter: 'Nhịp 4/4 (Pop/Rock thông dụng)',
              feel: 'Mạnh - Nhẹ - Vừa - Nhẹ (1 - 2 - 3 - 4)',
              steps: [1.0, 0.4, 0.7, 0.4]
            }
          ].map(m => (
            <button
              key={m.meter}
              onClick={async () => {
                await auditoryEngine.resumeAudioContext();
                for (let round = 0; round < 2; round++) {
                  for (let i = 0; i < m.steps.length; i++) {
                    const vol = m.steps[i];
                    auditoryEngine.playDrum(i === 0 ? 'kick' : 'hihat', vol);
                    await new Promise(r => setTimeout(r, 320));
                  }
                }
              }}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-left hover:border-amber-400 transition-all active:scale-98 flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  {m.meter}
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
                  {m.feel}
                </span>
              </div>
              <Play className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* QUICK MASTERY CHECK (Mini-Game 3 Câu Chương 5) */}
      <div className="p-6 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-500/30 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Thử Thách Nhanh: Làm Chủ Nhịp Điệu (3 Câu)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
            {masteredTheoryModules.includes('rhythm') ? '✅ Đã làm chủ chương 5' : `Câu ${quizStep + 1} / 3`}
          </span>
        </div>

        {!quizFinished ? (
          (() => {
            const currentQ = RHYTHM_QUESTIONS[quizStep];
            return (
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                  {currentQ.title}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentQ.options.map(opt => {
                    const isSelected = quizSelectedOption === opt.id;
                    let btnStyle = 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400';
                    if (quizSelectedOption) {
                      if (opt.isCorrect) btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                      else if (isSelected) btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200';
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={quizSelectedOption !== null}
                        onClick={() => handleSelectQuizOption(opt)}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between cursor-pointer active:scale-98 ${btnStyle}`}
                      >
                        <span>{opt.label}</span>
                        {quizSelectedOption && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />}
                        {quizSelectedOption && isSelected && !opt.isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {quizSelectedOption && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
                    {currentQ.explanation}
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/30 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {quizScore >= 2 ? '🎉 Xuất sắc! Bạn đã làm chủ chương Nhịp Điệu & Phách' : 'Hãy thử lại để đạt chuẩn làm chủ nhé!'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Bạn đạt <strong>{quizScore}/3 câu đúng</strong>. Huy hiệu làm chủ chương 5 đã được ghi nhận vào học viện.
            </p>
            <button
              onClick={() => {
                setQuizStep(0);
                setQuizScore(0);
                setQuizSelectedOption(null);
                setQuizFinished(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Làm lại bài kiểm tra
            </button>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="p-6 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 border border-amber-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Thử thách phản xạ nhịp điệu thực chiến?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Lắng nghe chuỗi tiết tấu và gõ lại thật chuẩn xác theo từng phách trong game!
          </p>
        </div>
        <button
          onClick={handleStartRhythmExercise}
          className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <span>Luyện Tập: Nhớ Nhịp Điệu (Rhythm Recall)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
