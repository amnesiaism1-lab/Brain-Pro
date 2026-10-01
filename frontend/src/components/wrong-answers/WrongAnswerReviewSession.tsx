import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IWrongAnswer, IConfusionPairStat } from '@brain-exercises/shared';
import { auditoryEngine } from '../../services/auditoryEngine';
import { useAppStore } from '../../store/useAppStore';
import confetti from 'canvas-confetti';
import { 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  GraduationCap, 
  ArrowRight, 
  X,
  Play,
  Trophy,
  Award
} from 'lucide-react';

interface WrongAnswerReviewSessionProps {
  initialWrongAnswer?: IWrongAnswer | null;
  confusionPairStat?: IConfusionPairStat | null;
  onClose: () => void;
  className?: string;
}

export const WrongAnswerReviewSession: React.FC<WrongAnswerReviewSessionProps> = ({
  initialWrongAnswer,
  confusionPairStat,
  onClose,
  className = ''
}) => {
  const markWrongAnswerReviewed = useAppStore(s => s.markWrongAnswerReviewed);

  // Determine Pair details
  const labelA = initialWrongAnswer?.correctAnswer.label || confusionPairStat?.labelA || 'Lựa chọn A';
  const labelB = initialWrongAnswer?.userAnswer.label || confusionPairStat?.labelB || 'Lựa chọn B';
  const codeA = initialWrongAnswer?.correctAnswer.code || confusionPairStat?.codeA || 'A';
  const codeB = initialWrongAnswer?.userAnswer.code || confusionPairStat?.codeB || 'B';
  const pairKey = initialWrongAnswer?.confusionPairKey || confusionPairStat?.pairKey || `${codeA}:${codeB}`;

  // Session state
  const [phase, setPhase] = useState<'study' | 'quiz' | 'feedback' | 'mastered'>('study');
  const [quizTarget, setQuizTarget] = useState<'A' | 'B'>('A');
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const targetStreak = 3;

  // Sound playback helpers
  const playSoundForChoice = useCallback(async (choice: 'A' | 'B') => {
    setIsPlayingAudio(true);
    await auditoryEngine.resumeAudioContext();

    try {
      const isA = choice === 'A';
      const semitones = isA ? initialWrongAnswer?.correctAnswer.semitones : initialWrongAnswer?.userAnswer.semitones;
      const rootNote = initialWrongAnswer?.questionContext.rootNote || 'C4';

      if (semitones !== undefined) {
        // Interval mode
        auditoryEngine.playNote(rootNote, 0.4);
        setTimeout(() => {
          auditoryEngine.playNote('C4', 0.55, { detuneCents: semitones * 100 });
          setIsPlayingAudio(false);
        }, 360);
        return;
      }

      // Chord or pitch fallback
      const code = isA ? codeA : codeB;
      if (initialWrongAnswer?.exerciseSlug === 'chord-identify') {
        const isMinor = code.toLowerCase().includes('minor') || code === '3m';
        const thirdOffset = isMinor ? 300 : 400;
        auditoryEngine.playNote('C4', 0.8);
        auditoryEngine.playNote('C4', 0.8, { detuneCents: thirdOffset });
        auditoryEngine.playNote('G4', 0.8);
      } else {
        auditoryEngine.playNote(code.length <= 4 ? code : 'C4', 0.6);
      }
    } catch (e) {
      console.warn('Playback error:', e);
    } finally {
      setTimeout(() => setIsPlayingAudio(false), 800);
    }
  }, [codeA, codeB, initialWrongAnswer]);

  // Start new random quiz round
  const startNewQuizTrial = useCallback(() => {
    const nextTarget: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
    setQuizTarget(nextTarget);
    setSelectedChoice(null);
    setIsCorrect(null);
    setPhase('quiz');

    // Automatically play target sound after short delay
    setTimeout(() => {
      playSoundForChoice(nextTarget);
    }, 350);
  }, [playSoundForChoice]);

  // Handle user answer during quiz
  const handleAnswerQuiz = (choice: 'A' | 'B') => {
    if (phase !== 'quiz') return;
    setSelectedChoice(choice);
    const correct = choice === quizTarget;
    setIsCorrect(correct);
    setPhase('feedback');

    auditoryEngine.playFeedback(correct);

    if (correct) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);

      if (nextStreak >= targetStreak) {
        // Mastered this pair!
        if (initialWrongAnswer?.id) {
          markWrongAnswerReviewed(initialWrongAnswer.id, 5); // Quality 5: Perfect recall
        }
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch {}
        setTimeout(() => setPhase('mastered'), 900);
        return;
      }

      // Proceed to next quiz trial
      setTimeout(() => {
        startNewQuizTrial();
      }, 1200);
    } else {
      // Wrong answer resets streak
      setStreak(0);
      if (initialWrongAnswer?.id) {
        markWrongAnswerReviewed(initialWrongAnswer.id, 1); // Quality 1: Review needed
      }
    }
  };

  return (
    <div className={`p-6 rounded-3xl bg-slate-900/95 text-white backdrop-blur-2xl border border-slate-800 shadow-2xl flex flex-col justify-between max-w-xl mx-auto min-h-[460px] animate-fadeIn ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Ôn Tập Tập Trung
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                {pairKey}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Phân biệt chuẩn xác giữa 2 lựa chọn hay bị nhầm
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      {phase === 'study' && (
        <div className="flex flex-col gap-4 my-auto py-4">
          <div className="text-center">
            <h4 className="text-lg font-bold text-slate-100">
              Bước 1: Nghe So Sánh Đối Kháng (A/B)
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Hãy nghe lần lượt từng âm thanh để nhận biết nét khác biệt đặc trưng
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Option A */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col items-center justify-center gap-3 text-center">
              <span className="text-xs font-mono font-bold text-cyan-400">LỰA CHỌN A</span>
              <p className="text-sm font-bold text-white">{labelA}</p>
              <button
                onClick={() => playSoundForChoice('A')}
                disabled={isPlayingAudio}
                className="w-full py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe A</span>
              </button>
            </div>

            {/* Option B */}
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex flex-col items-center justify-center gap-3 text-center">
              <span className="text-xs font-mono font-bold text-purple-400">LỰA CHỌN B</span>
              <p className="text-sm font-bold text-white">{labelB}</p>
              <button
                onClick={() => playSoundForChoice('B')}
                disabled={isPlayingAudio}
                className="w-full py-2 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe B</span>
              </button>
            </div>
          </div>

          {initialWrongAnswer?.correctAnswer.explanationVi && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200 leading-relaxed">
                {initialWrongAnswer.correctAnswer.explanationVi}
              </p>
            </div>
          )}

          <button
            onClick={startNewQuizTrial}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4" />
            <span>Tôi đã sẵn sàng — Bắt đầu kiểm tra thử</span>
          </button>
        </div>
      )}

      {(phase === 'quiz' || phase === 'feedback') && (
        <div className="flex flex-col gap-5 my-auto py-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Chuỗi đúng liên tiếp:</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: targetStreak }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    i < streak
                      ? 'bg-emerald-500 border-emerald-400 scale-110 shadow-sm shadow-emerald-500/50'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="text-center flex flex-col items-center gap-2">
            <h4 className="text-base font-bold text-white">
              Âm thanh vừa phát là lựa chọn nào?
            </h4>
            <button
              onClick={() => playSoundForChoice(quizTarget)}
              disabled={isPlayingAudio}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Phát lại âm thanh</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswerQuiz('A')}
              disabled={phase === 'feedback'}
              className={`p-5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 active:scale-95 ${
                phase === 'feedback' && quizTarget === 'A'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black shadow-lg shadow-emerald-950'
                  : phase === 'feedback' && selectedChoice === 'A' && !isCorrect
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                  : 'bg-slate-800/60 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 text-white font-bold'
              }`}
            >
              <span className="text-xs font-mono text-cyan-400">LỰA CHỌN A</span>
              <span className="text-base">{labelA}</span>
            </button>

            <button
              onClick={() => handleAnswerQuiz('B')}
              disabled={phase === 'feedback'}
              className={`p-5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 active:scale-95 ${
                phase === 'feedback' && quizTarget === 'B'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black shadow-lg shadow-emerald-950'
                  : phase === 'feedback' && selectedChoice === 'B' && !isCorrect
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                  : 'bg-slate-800/60 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800 text-white font-bold'
              }`}
            >
              <span className="text-xs font-mono text-purple-400">LỰA CHỌN B</span>
              <span className="text-base">{labelB}</span>
            </button>
          </div>

          {phase === 'feedback' && (
            <div className="text-center animate-fadeIn">
              {isCorrect ? (
                <p className="text-emerald-400 font-bold text-sm flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Chính xác! Tiếp tục phát huy!
                </p>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-rose-400 font-bold text-sm flex items-center justify-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Chưa đúng! Đáp án đúng là {quizTarget === 'A' ? labelA : labelB}.
                  </p>
                  <button
                    onClick={startNewQuizTrial}
                    className="py-1.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Thử lại
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {phase === 'mastered' && (
        <div className="flex flex-col items-center justify-center gap-4 my-auto py-6 text-center animate-scaleUp">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-xl font-black text-white">
              Chúc Mừng! Bạn Đã Nắm Vững Cặp Này!
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm">
              Bạn đã phân biệt chính xác 3 lần liên tiếp giữa <strong>{labelA}</strong> và <strong>{labelB}</strong>. Thuật toán SM-2 đã nâng cấp mức độ thành thạo thính giác của bạn!
            </p>
          </div>
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm active:scale-95 transition-all shadow-lg shadow-emerald-900/30"
          >
            Hoàn tất & Quay lại
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-500">
        <span>Thuật toán SM-2 Spaced Repetition</span>
        <button
          onClick={() => setPhase('study')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          Xem lại đối sánh A/B
        </button>
      </div>
    </div>
  );
};
