import React, { useState } from 'react';
import { IWrongAnswer } from '@brain-exercises/shared';
import { auditoryEngine } from '../../services/auditoryEngine';
import { 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  GraduationCap, 
  AlertCircle,
  HelpCircle,
  Play
} from 'lucide-react';

interface WrongAnswerCardProps {
  wrongAnswer: IWrongAnswer;
  onStartReview?: (wrong: IWrongAnswer) => void;
  className?: string;
}

export const WrongAnswerCard: React.FC<WrongAnswerCardProps> = ({
  wrongAnswer,
  onStartReview,
  className = ''
}) => {
  const [isPlayingCorrect, setIsPlayingCorrect] = useState(false);
  const [isPlayingUser, setIsPlayingUser] = useState(false);

  const {
    exerciseSlug,
    difficultyLevel,
    round,
    correctAnswer,
    userAnswer,
    severity,
    reviewStatus,
    reviewCount,
    timestamp,
    questionContext
  } = wrongAnswer;

  // Format exercise name in Vietnamese
  const getExerciseTitle = (slug: string): string => {
    switch (slug) {
      case 'interval-identify': return 'Nhận Diện Quãng';
      case 'chord-identify': return 'Nhận Diện Hợp Âm';
      case 'pitch-recall': return 'Nhớ Cao Độ';
      case 'timbre-match': return 'Phân Biệt Âm Sắc';
      case 'rhythm-recall': return 'Nhớ Nhịp Điệu';
      case 'sound-localization': return 'Định Vị Âm Thanh 3D';
      case 'vocal-pitch-match': return 'Dò Cao Độ Giọng Hát';
      default: return slug;
    }
  };

  // Format time relative
  const formatTimeAgo = (isoString: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const minutes = Math.floor(diffMs / 60000);
      if (minutes < 1) return 'Vừa xong';
      if (minutes < 60) return `${minutes} phút trước`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} giờ trước`;
      const days = Math.floor(hours / 24);
      return `${days} ngày trước`;
    } catch {
      return 'Gần đây';
    }
  };

  // Clean redundant prefixes like "Chuỗi đúng:" or "Bạn chọn:"
  const cleanDisplayLabel = (label: string): string => {
    if (!label) return '';
    return label.replace(/^(Chuỗi đúng|Bạn chọn)\s*:\s*/i, '').trim();
  };

  // Play audio for correct answer
  const handlePlayCorrect = async () => {
    if (isPlayingCorrect) return;
    setIsPlayingCorrect(true);
    await auditoryEngine.resumeAudioContext();

    try {
      if (exerciseSlug === 'interval-identify' && questionContext.rootNote && questionContext.targetNote) {
        auditoryEngine.playNote(questionContext.rootNote, 0.45);
        setTimeout(() => {
          auditoryEngine.playNote(questionContext.targetNote!, 0.6);
          setIsPlayingCorrect(false);
        }, 360);
        return;
      }

      if (exerciseSlug === 'chord-identify' && questionContext.notes && questionContext.notes.length > 0) {
        questionContext.notes.forEach((n, idx) => {
          setTimeout(() => auditoryEngine.playNote(n, 0.7), idx * 120);
        });
        setTimeout(() => setIsPlayingCorrect(false), questionContext.notes.length * 120 + 700);
        return;
      }

      if (exerciseSlug === 'pitch-recall') {
        const notes = questionContext.sequenceNotes || [correctAnswer.code];
        notes.forEach((n, idx) => {
          setTimeout(() => auditoryEngine.playNote(n, 0.45), idx * 320);
        });
        setTimeout(() => setIsPlayingCorrect(false), notes.length * 320 + 500);
        return;
      }

      if (exerciseSlug === 'timbre-match' && questionContext.targetWaveform) {
        auditoryEngine.playNote('C4', 0.8, { waveform: questionContext.targetWaveform as any });
        setTimeout(() => setIsPlayingCorrect(false), 850);
        return;
      }

      if (exerciseSlug === 'sound-localization' && questionContext.targetAzimuth !== undefined) {
        const rad = (questionContext.targetAzimuth * Math.PI) / 180;
        const pan = Math.sin(rad);
        auditoryEngine.playNote('C4', 0.6, { pan });
        setTimeout(() => setIsPlayingCorrect(false), 650);
        return;
      }

      if (exerciseSlug === 'vocal-pitch-match' && (questionContext.targetNoteName || correctAnswer.code)) {
        auditoryEngine.playNote(questionContext.targetNoteName || correctAnswer.code, 0.9);
        setTimeout(() => setIsPlayingCorrect(false), 950);
        return;
      }

      // Default fallback
      if (correctAnswer.code && correctAnswer.code.length <= 4) {
        auditoryEngine.playNote(correctAnswer.code, 0.5);
      }
    } catch (e) {
      console.warn('Playback error:', e);
    } finally {
      setTimeout(() => setIsPlayingCorrect(false), 800);
    }
  };

  // Play audio for user's wrong answer (if synthesizable)
  const handlePlayUserChoice = async () => {
    if (isPlayingUser) return;
    setIsPlayingUser(true);
    await auditoryEngine.resumeAudioContext();

    try {
      if (exerciseSlug === 'interval-identify' && questionContext.rootNote && userAnswer.semitones !== undefined) {
        auditoryEngine.playNote(questionContext.rootNote, 0.45);
        // Note with user's chosen semitones offset
        setTimeout(() => {
          auditoryEngine.playNote('C4', 0.5, { detuneCents: userAnswer.semitones! * 100 });
          setIsPlayingUser(false);
        }, 360);
        return;
      }

      if (exerciseSlug === 'pitch-recall' && userAnswer.code) {
        auditoryEngine.playNote(userAnswer.code, 0.6);
        setTimeout(() => setIsPlayingUser(false), 650);
        return;
      }

      if (exerciseSlug === 'sound-localization' && userAnswer.azimuthDeg !== undefined) {
        const rad = (userAnswer.azimuthDeg * Math.PI) / 180;
        const pan = Math.sin(rad);
        auditoryEngine.playNote('C4', 0.6, { pan });
        setTimeout(() => setIsPlayingUser(false), 650);
        return;
      }

      if (userAnswer.code && userAnswer.code.length <= 4) {
        auditoryEngine.playNote(userAnswer.code, 0.5);
      }
    } catch (e) {
      console.warn('User choice playback error:', e);
    } finally {
      setTimeout(() => setIsPlayingUser(false), 800);
    }
  };

  const getSeverityBadge = () => {
    switch (severity) {
      case 'minor':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Lỗi nhẹ (Tinh chỉnh)
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Mức trung bình
          </span>
        );
      case 'critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Cần lưu ý cao
          </span>
        );
    }
  };

  const getReviewStatusBadge = () => {
    switch (reviewStatus) {
      case 'mastered':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Đã nắm vững
          </span>
        );
      case 'reviewing':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Đang ôn (Lần {reviewCount})
          </span>
        );
      case 'new':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Câu mới
          </span>
        );
    }
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-xl transition-all flex flex-col justify-between gap-4 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-black text-sm">
            {difficultyLevel}
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {getExerciseTitle(exerciseSlug)}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                (Vòng {round})
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {formatTimeAgo(timestamp)} • Phản hồi {wrongAnswer.responseTimeMs}ms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getSeverityBadge()}
          {getReviewStatusBadge()}
        </div>
      </div>

      {/* Comparison: Correct vs User Answer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Correct Choice (Emerald) */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-500/20">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Đáp án đúng
            </span>
            <button
              onClick={handlePlayCorrect}
              disabled={isPlayingCorrect}
              className={`p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 transition-all flex items-center gap-1 text-[11px] font-semibold active:scale-95 ${
                isPlayingCorrect ? 'animate-pulse ring-2 ring-emerald-500' : ''
              }`}
              title="Nghe lại âm thanh chuẩn"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingCorrect ? 'Đang phát...' : 'Nghe'}</span>
            </button>
          </div>

          <div>
            <p className="text-sm sm:text-base font-bold text-emerald-950 dark:text-emerald-100">
              {cleanDisplayLabel(correctAnswer.label)}
            </p>
            {correctAnswer.semitones !== undefined && (
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                Khoảng cách: {correctAnswer.semitones} bán âm
              </p>
            )}
          </div>
        </div>

        {/* User Choice (Rose) */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-500/20">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Bạn đã chọn
            </span>
            <button
              onClick={handlePlayUserChoice}
              disabled={isPlayingUser}
              className={`p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 transition-all flex items-center gap-1 text-[11px] font-semibold active:scale-95 ${
                isPlayingUser ? 'animate-pulse ring-2 ring-rose-500' : ''
              }`}
              title="Nghe lại đáp án bạn đã chọn"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingUser ? 'Đang phát...' : 'Nghe lại'}</span>
            </button>
          </div>

          <div>
            <p className="text-sm sm:text-base font-bold text-rose-950 dark:text-rose-100">
              {cleanDisplayLabel(userAnswer.label)}
            </p>
            {userAnswer.semitones !== undefined && (
              <p className="text-xs text-rose-700 dark:text-rose-300 font-mono mt-0.5">
                Khoảng cách: {userAnswer.semitones} bán âm
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pedagogical Explanation Tip */}
      {correctAnswer.explanationVi && (
        <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5">
          <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
            {correctAnswer.explanationVi}
          </p>
        </div>
      )}

      {/* Bottom Action Footer */}
      {onStartReview && (
        <div className="flex justify-end pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => onStartReview(wrongAnswer)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-900/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Ôn tập cặp này</span>
          </button>
        </div>
      )}
    </div>
  );
};
