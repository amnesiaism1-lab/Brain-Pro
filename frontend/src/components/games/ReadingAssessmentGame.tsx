import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateWpm, calculateEffectiveWpm, IReadingText, SAMPLE_READING_TEXTS } from '@brain-exercises/shared';
import { CheckCircle2, BookOpen } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { ReadingTextSourceModal } from '../common/ReadingTextSourceModal';
import { readingContentService } from '../../services/readingContentService';

export const ReadingAssessmentGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastAnsTimeRef = useRef<number>(Date.now());
  const currentLevel = getExerciseLevel('reading-assessment');

  const allTexts = readingContentService.getAllTexts();
  const [currentArticle, setCurrentArticle] = useState<IReadingText>(() => {
    return allTexts[(currentLevel - 1) % allTexts.length] || SAMPLE_READING_TEXTS[0];
  });
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const questions = currentArticle.questions && currentArticle.questions.length > 0 
    ? currentArticle.questions 
    : (SAMPLE_READING_TEXTS[0].questions || []);

  const [phase, setPhase] = useState<'reading' | 'quiz'>('reading');
  const [readingTimeSec, setReadingTimeSec] = useState(0);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    const isCorrect = questions[currentQIndex]?.correctOption === opt;
    const now = Date.now();
    const respMs = Math.min(20000, Math.max(100, now - lastAnsTimeRef.current));
    lastAnsTimeRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'reading-assessment',
      level: currentLevel,
      relationId: 'CONTEXT_MEANING',
      relationWeight: 1.0,
      entities: {
        questionId: qId,
        choice: opt,
        correctOption: questions[currentQIndex]?.correctOption,
        rawWpm,
        articleTitle: currentArticle.title
      },
      stateBefore: `q:${currentQIndex}`,
      stateAfter: `q:${currentQIndex + 1}`,
      responseMs: respMs,
      correct: isCorrect
    });

    const updated = { ...selectedAnswers, [qId]: opt };
    setSelectedAnswers(updated);

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      playSound('victory');
      setIsFinished(true);
    }
  };

  const handleSelectNewArticle = (article: IReadingText) => {
    setCurrentArticle(article);
    setPhase('reading');
    setReadingTimeSec(0);
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setIsFinished(false);
  };

  const rawWpm = calculateWpm(currentArticle.wordCount, Math.max(5, readingTimeSec));
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

        <button
          onClick={() => {
            playSound('click');
            setIsSourceModalOpen(true);
          }}
          className="py-2 px-3 sm:px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all btn-press shadow-sm"
        >
          <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Đổi bài đọc</span>
        </button>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Thời gian đọc</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
            {readingTimeSec}s
          </div>
        </div>
      </div>

      {phase === 'reading' ? (
        <div className="space-y-6">
          <div className="bg-[#FDFBF7] dark:bg-slate-900 p-6 sm:p-10 md:p-12 rounded-3xl border border-[#D5CBB9] dark:border-slate-800 shadow-xl space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
              {currentArticle.title}
            </h2>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 pb-3 border-b border-[#E6DDCE] dark:border-slate-800">
              <span className="font-bold text-brand-600">{currentArticle.category}</span>
              <span>&bull;</span>
              <span>{currentArticle.wordCount} từ</span>
              <span>&bull;</span>
              <span>Tác giả: {currentArticle.author}</span>
            </div>
            <div className="text-base sm:text-lg md:text-xl leading-relaxed sm:leading-loose text-slate-700 dark:text-slate-300 space-y-4 whitespace-pre-line text-justify font-serif">
              {currentArticle.content}
            </div>
          </div>

          <button
            onClick={handleFinishReading}
            className="w-full py-4 sm:py-5 rounded-2xl sm:rounded-3xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-black text-lg sm:text-xl shadow-xl shadow-brand-600/30 flex items-center justify-center gap-3 btn-press"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>Tôi đã đọc xong toàn văn (Chuyển sang làm trắc nghiệm)</span>
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
                className="w-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-left text-sm sm:text-base md:text-lg font-bold border border-slate-200 dark:border-slate-700 hover:bg-brand-50 dark:hover:bg-slate-700 hover:border-brand-500 text-slate-800 dark:text-white transition-all btn-press flex items-center gap-4"
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

      {/* Text Source Selection Modal */}
      <ReadingTextSourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        currentText={currentArticle}
        onSelectText={handleSelectNewArticle}
      />

      {isFinished && (
        <GameResultModal
          score={effectiveWpm}
          accuracyRate={comprehensionPercent}
          timeSpentSec={readingTimeSec}
          effectiveWpm={effectiveWpm}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
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
