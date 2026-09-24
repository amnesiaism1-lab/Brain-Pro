import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  BookOpen, 
  ArrowRight, 
  Pause, 
  Play, 
  Sparkles, 
  Music,
  ChevronDown,
  ChevronUp,
  Headphones
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { PianoKeyboard } from './PianoKeyboard';

export interface IEarTrainingLearningCardProps {
  // Module info
  theoryModuleId: 'intervals' | 'chords' | 'notes' | 'scales' | 'rhythm' | 'timbre' | 'spatial';
  theoryTitle: string;
  
  // Game state
  isAnswered: boolean;
  isCorrect?: boolean;
  
  // Target question details
  questionTitle?: string;
  rootNote: string;
  targetNotes: string[]; // Keys to highlight on piano
  correctName: string;
  correctCode: string;
  correctDescription?: string;
  mnemonicSong?: string;
  pedagogicalTip?: string;
  
  // User selection details (if answered)
  userChoiceName?: string;
  userChoiceCode?: string;
  
  // Sound playback callbacks for A/B/C listening comparison
  onPlayQuestion: () => void;
  onPlayUserChoice?: () => void;
  onPlayCorrectSample: () => void;
  
  // Next round callback
  onNextRound: () => void;
  isLastRound?: boolean;
  
  // Custom hints to display prior to answering
  preAnswerHints?: Array<{
    code: string;
    name: string;
    description: string;
    mnemonic?: string;
    onPreviewAudio?: () => void;
  }>;
}

export const EarTrainingLearningCard: React.FC<IEarTrainingLearningCardProps> = ({
  theoryModuleId,
  theoryTitle,
  isAnswered,
  isCorrect = false,
  questionTitle,
  rootNote,
  targetNotes,
  correctName,
  correctCode,
  correctDescription,
  mnemonicSong,
  pedagogicalTip,
  userChoiceName,
  userChoiceCode,
  onPlayQuestion,
  onPlayUserChoice,
  onPlayCorrectSample,
  onNextRound,
  isLastRound = false,
  preAnswerHints = []
}) => {
  const { navigateToTheory } = useAppStore();
  
  // UI states
  const [isPreAnswerHintOpen, setIsPreAnswerHintOpen] = useState(false);
  const [isAutoAdvancePaused, setIsAutoAdvancePaused] = useState(false);
  const [countdown, setCountdown] = useState<number>(7);
  const [activeAudioTag, setActiveAudioTag] = useState<'question' | 'user' | 'correct' | null>(null);

  // Auto-advance countdown when answered
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAnswered) {
      setCountdown(7);
      setIsAutoAdvancePaused(false);
      setActiveAudioTag(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    // When answered, start countdown if not paused
    if (!isAutoAdvancePaused) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            onNextRound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAnswered, isAutoAdvancePaused, onNextRound]);

  const handlePlayAudio = (tag: 'question' | 'user' | 'correct') => {
    setActiveAudioTag(tag);
    if (tag === 'question') onPlayQuestion();
    else if (tag === 'user' && onPlayUserChoice) onPlayUserChoice();
    else if (tag === 'correct') onPlayCorrectSample();

    setTimeout(() => {
      setActiveAudioTag(null);
    }, 1200);
  };

  const handleOpenTheory = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    navigateToTheory(theoryModuleId);
  };

  // Determine piano octave range based on notes
  const octaveRange: [number, number] = React.useMemo(() => {
    const allNotes = [rootNote, ...targetNotes].filter(Boolean);
    const octaves = allNotes.map(n => parseInt(n.slice(-1), 10)).filter(n => !isNaN(n));
    if (octaves.length === 0) return [4, 5];
    const min = Math.min(...octaves);
    const max = Math.max(...octaves);
    return [Math.max(3, min), Math.max(min + 1, Math.min(6, max))];
  }, [rootNote, targetNotes]);

  // Merge piano active notes
  const pianoNotes = React.useMemo(() => {
    return Array.from(new Set([rootNote, ...targetNotes].filter(Boolean)));
  }, [rootNote, targetNotes]);

  return (
    <div className="w-full max-w-2xl mx-auto my-3 transition-all duration-300">
      {/* 1. PRE-ANSWER GUIDANCE ACCORDION (When still answering) */}
      {!isAnswered && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 overflow-hidden shadow-sm transition-all">
          <button
            type="button"
            onClick={() => setIsPreAnswerHintOpen(!isPreAnswerHintOpen)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Gợi ý cảm âm & Mẹo phân biệt bằng tai</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] opacity-80">
              <span>{isPreAnswerHintOpen ? 'Thu gọn' : 'Bấm để xem mẹo nhớ'}</span>
              {isPreAnswerHintOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {isPreAnswerHintOpen && (
            <div className="p-4 pt-2 border-t border-amber-500/20 space-y-3 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in duration-200">
              <p className="text-slate-500 dark:text-slate-400 italic">
                💡 <strong>Bí quyết luyện tai:</strong> Đừng chỉ đoán mò! Bấm nút loa nhỏ <Volume2 className="w-3.5 h-3.5 inline text-cyan-500" /> ở góc mỗi đáp án để nghe thử mẫu và đối chiếu với âm thanh câu hỏi.
              </p>

              {preAnswerHints.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {preAnswerHints.map((hint) => (
                    <div 
                      key={hint.code}
                      className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-amber-500/20 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{hint.name}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                            {hint.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                          {hint.description}
                        </p>
                        {hint.mnemonic && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-1 flex items-center gap-1">
                            🎵 <em>{hint.mnemonic}</em>
                          </p>
                        )}
                      </div>

                      {hint.onPreviewAudio && (
                        <button
                          type="button"
                          onClick={hint.onPreviewAudio}
                          className="mt-2 w-full py-1 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Nghe thử mẫu này</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleOpenTheory}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Mở bài học: {theoryTitle}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. POST-ANSWER DEEP LEARNING & COMPARISON PANEL */}
      {isAnswered && (
        <div className={`p-5 rounded-3xl border shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-250 ${
          isCorrect 
            ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30' 
            : 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30'
        }`}>
          {/* Header result banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              {isCorrect ? (
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
                  <XCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  {isCorrect ? 'Chính Xác Hoàn Hảo!' : 'Chưa Đúng — Cùng Luyện Tai Ngay'}
                  {isCorrect && <Sparkles className="w-4 h-4 text-emerald-500" />}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isCorrect 
                    ? `Bạn đã nhận diện chuẩn xác: ${correctName}`
                    : `Bạn đã chọn: ${userChoiceName || userChoiceCode || 'Khác'} • Đáp án đúng là: ${correctName}`
                  }
                </p>
              </div>
            </div>

            {/* Auto-advance timer pill */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAutoAdvancePaused(!isAutoAdvancePaused)}
                className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
                title={isAutoAdvancePaused ? 'Bật tự động chuyển câu' : 'Dừng tự chuyển để nghiên cứu kỹ hơn'}
              >
                {isAutoAdvancePaused ? (
                  <>
                    <Play className="w-3 h-3 text-emerald-500 fill-current" />
                    <span>Tiếp tục đếm</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-amber-500" />
                    <span>Dừng chuyển ({countdown}s)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onNextRound}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>{isLastRound ? 'Xem kết quả' : 'Câu kế tiếp'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Direct A / B Listening Comparison Station */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Headphones className="w-4 h-4 text-cyan-500" />
                <span>Đài Hiệu Chỉnh Đôi Tai (A / B Auditory Calibration)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Bấm để nghe đối chiếu</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Button 1: Replay Question */}
              <button
                type="button"
                onClick={() => handlePlayAudio('question')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                  activeAudioTag === 'question'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md ring-2 ring-cyan-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <RotateCcw className={`w-3.5 h-3.5 ${activeAudioTag === 'question' ? 'animate-spin' : ''}`} />
                <span>Nghe Lại Câu Hỏi</span>
              </button>

              {/* Button 2: Replay User Choice (if wrong) */}
              {!isCorrect && userChoiceName && onPlayUserChoice && (
                <button
                  type="button"
                  onClick={() => handlePlayAudio('user')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                    activeAudioTag === 'user'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md ring-2 ring-rose-500/30'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Nghe Lại Lựa Chọn Của Bạn</span>
                </button>
              )}

              {/* Button 3: Play Correct Reference */}
              <button
                type="button"
                onClick={() => handlePlayAudio('correct')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                  activeAudioTag === 'correct'
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nghe Chuẩn: {correctCode}</span>
              </button>
            </div>
          </div>

          {/* Visual Piano Pattern Insight */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-500" />
                Khuôn Hình Nốt Trên Đàn Piano: <span className="font-mono text-cyan-600 dark:text-cyan-400 font-black">{pianoNotes.join(' - ')}</span>
              </span>
              {correctDescription && (
                <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                  {correctDescription}
                </span>
              )}
            </div>

            <div className="flex justify-center overflow-x-auto py-1">
              <PianoKeyboard
                octaveRange={octaveRange}
                selectedNotes={pianoNotes}
                disabled={true}
                showLabels={true}
                autoPlayAudio={false}
                showVelocityMeter={false}
                className="scale-90 sm:scale-100 origin-center"
              />
            </div>
          </div>

          {/* Mnemonic and Ear-training Knowledge Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {mnemonicSong && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                  🎵 Bài Hát Gợi Nhớ Nhanh:
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  {mnemonicSong}
                </p>
              </div>
            )}

            {pedagogicalTip && (
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="font-bold text-cyan-800 dark:text-cyan-300 block mb-0.5">
                  🧠 Cảm Nhận Âm Học:
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  {pedagogicalTip}
                </p>
              </div>
            )}
          </div>

          {/* Link to theory module */}
          <div className="pt-1 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Muốn hiểu sâu bản chất vật lý & công thức?
            </span>
            <button
              type="button"
              onClick={handleOpenTheory}
              className="inline-flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Xem Lý thuyết: {theoryTitle}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
