import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { SAMPLE_READING_TEXTS, calculateWpm, calculateEffectiveWpm } from '@brain-exercises/shared';
import { CheckCircle2 } from 'lucide-react';

export const ReadingAssessmentGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const currentLevel = getExerciseLevel('reading-assessment');
  
  const [textIndex, setTextIndex] = useState(() => (currentLevel - 1) % SAMPLE_READING_TEXTS.length);
  const article = SAMPLE_READING_TEXTS[textIndex] || SAMPLE_READING_TEXTS[0];
  const questions = article.questions || [];

  const [phase, setPhase] = useState<'reading' | 'quiz'>('reading');
  const [readingTimeSec, setReadingTimeSec] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setReadingTimeSec(Math.round((Date.now() - start) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleFinishReading = () => {
    playSound('click');
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('quiz');
  };

  const handleSelectOption = (qId: string, opt: 'A' | 'B' | 'C' | 'D') => {
    playSound('click');
    const updated = { ...selectedAnswers, [qId]: opt };
    setSelectedAnswers(updated);

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      playSound('victory');
      setIsFinished(true);
    }
  };

  const rawWpm = calculateWpm(article.wordCount, Math.max(5, readingTimeSec));
  let correctCount = 0;
  questions.forEach(q => {
    if (selectedAnswers[q.id] === q.correctOption) {
      correctCount++;
    }
  });
  const totalQuestions = Math.max(1, questions.length);
  const comprehensionPercent = Math.round((correctCount / totalQuestions) * 100);
  const effectiveWpm = calculateEffectiveWpm(rawWpm, comprehensionPercent);

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-4 space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Chế độ đánh giá</span>
          <div className="text-base sm:text-xl font-black text-brand-600 dark:text-brand-400">
            {phase === 'reading' ? 'Đang đọc bài viết (Tính WPM)' : `Trắc nghiệm hiểu (${currentQIndex + 1}/${questions.length})`}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Thời gian đọc</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
            {readingTimeSec}s
          </div>
        </div>
      </div>

      {phase === 'reading' ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-10 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
              {article.title}
            </h2>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-700">
              <span className="font-bold text-brand-600">{article.category}</span>
              <span>&bull;</span>
              <span>{article.wordCount} từ</span>
              <span>&bull;</span>
              <span>Tác giả: {article.author}</span>
            </div>
            <div className="text-base sm:text-lg md:text-xl leading-relaxed sm:leading-loose text-slate-700 dark:text-slate-300 space-y-4 whitespace-pre-line text-justify font-serif">
              {article.content}
            </div>
          </div>

          <button
            onClick={handleFinishReading}
            className="w-full py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-black text-lg sm:text-xl shadow-xl shadow-brand-600/30 flex items-center justify-center gap-3 btn-press"
          >
            <CheckCircle2 className="w-6 h-6" />
            Tôi đã đọc xong toàn văn (Chuyển sang làm trắc nghiệm)
          </button>
        </div>
      ) : (
        /* Quiz Questions */
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-10 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl space-y-6">
          <span className="text-xs sm:text-sm font-black text-brand-600 uppercase tracking-wider">
            Câu {currentQIndex + 1} trên {questions.length}
          </span>
          <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
            {questions[currentQIndex]?.questionText}
          </h3>

          <div className="space-y-3 sm:space-y-4">
            {[
              { opt: 'A', text: questions[currentQIndex]?.optionA },
              { opt: 'B', text: questions[currentQIndex]?.optionB },
              { opt: 'C', text: questions[currentQIndex]?.optionC },
              { opt: 'D', text: questions[currentQIndex]?.optionD }
            ].map((choice) => (
              <button
                key={choice.opt}
                onClick={() => handleSelectOption(questions[currentQIndex].id, choice.opt as any)}
                className="w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-left text-sm sm:text-base md:text-lg font-bold border border-slate-200 dark:border-slate-700 hover:bg-brand-50 hover:border-brand-500 text-slate-800 dark:text-white transition-all btn-press flex items-center gap-4"
              >
                <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-black text-sm sm:text-base text-brand-600 dark:text-brand-400 shrink-0 shadow-sm">
                  {choice.opt}
                </span>
                <span>{choice.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isFinished && (
        <GameResultModal
          score={effectiveWpm}
          accuracyRate={comprehensionPercent}
          timeSpentSec={readingTimeSec}
          effectiveWpm={effectiveWpm}
          onRestart={() => {
            setTextIndex(prev => (prev + 1) % SAMPLE_READING_TEXTS.length);
            setPhase('reading');
            setReadingTimeSec(0);
            setCurrentQIndex(0);
            setSelectedAnswers({});
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
