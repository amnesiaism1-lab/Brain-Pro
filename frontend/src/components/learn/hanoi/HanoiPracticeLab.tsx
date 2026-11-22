import React, { useState, useMemo } from 'react';
import {
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  Zap,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import {
  HANOI_QUIZ_BANK,
  HANOI_FLASHCARDS,
  HanoiQuizDomain,
  IHanoiFlashcard
} from '@brain-exercises/shared';

interface HanoiPracticeLabProps {
  onJumpToChapter: (chapterNumber: number) => void;
  onMastered: () => void;
  onLaunchExercise: (mode?: string) => void;
}

const FLASHCARD_STORAGE_KEY = 'be_hanoi_mastered_flashcards_v1';

export const HanoiPracticeLab: React.FC<HanoiPracticeLabProps> = ({
  onJumpToChapter,
  onMastered,
  onLaunchExercise
}) => {
  const [labMode, setLabMode] = useState<'flashcards' | 'diagnostic_quiz'>('flashcards');

  // =========================================================================
  // FLASHCARDS STATE
  // =========================================================================
  const [fcCategory, setFcCategory] = useState<'ALL' | IHanoiFlashcard['category']>('ALL');
  const [fcIndex, setFcIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCardIds, setMasteredCardIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FLASHCARD_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const filteredCards = useMemo(() => {
    if (fcCategory === 'ALL') return HANOI_FLASHCARDS;
    return HANOI_FLASHCARDS.filter((c) => c.category === fcCategory);
  }, [fcCategory]);

  const activeCard = filteredCards[fcIndex] || filteredCards[0];

  const toggleMasteredCard = (id: string, known: boolean) => {
    setMasteredCardIds((prev) => {
      const next = known
        ? Array.from(new Set([...prev, id]))
        : prev.filter((item) => item !== id);
      try {
        localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setIsFlipped(false);
    setFcIndex((idx) => (idx + 1) % filteredCards.length);
  };

  // =========================================================================
  // DIAGNOSTIC QUIZ STATE
  // =========================================================================
  const [quizScope, setQuizScope] = useState<'quick_8' | 'full_20' | HanoiQuizDomain>('quick_8');
  const [quizStep, setQuizStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answersRecord, setAnswersRecord] = useState<Record<string, boolean>>({});
  const [quizFinished, setQuizFinished] = useState(false);

  const activeQuizList = useMemo(() => {
    if (quizScope === 'full_20') return HANOI_QUIZ_BANK;
    if (quizScope === 'quick_8') {
      // Balanced 8 flagship questions across all 5 domains
      return [
        HANOI_QUIZ_BANK[0],
        HANOI_QUIZ_BANK[1],
        HANOI_QUIZ_BANK[4],
        HANOI_QUIZ_BANK[5],
        HANOI_QUIZ_BANK[8],
        HANOI_QUIZ_BANK[9],
        HANOI_QUIZ_BANK[13],
        HANOI_QUIZ_BANK[16]
      ];
    }
    return HANOI_QUIZ_BANK.filter((q) => q.domain === quizScope);
  }, [quizScope]);

  const currentQ = activeQuizList[quizStep] || activeQuizList[0];

  const resetQuiz = (newScope?: typeof quizScope) => {
    if (newScope) setQuizScope(newScope);
    setQuizStep(0);
    setSelectedOption(null);
    setAnswersRecord({});
    setQuizFinished(false);
  };

  const handleChooseQuizOption = (idx: number) => {
    if (selectedOption !== null || !currentQ) return;
    setSelectedOption(idx);
    const isRight = idx === currentQ.correctIndex;
    setAnswersRecord((prev) => ({ ...prev, [currentQ.id]: isRight }));
  };

  const handleNextQuizStep = () => {
    if (quizStep + 1 < activeQuizList.length) {
      setQuizStep((s) => s + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
      const totalRight = Object.values(answersRecord).filter(Boolean).length;
      if (totalRight / Math.max(1, activeQuizList.length) >= 0.7) {
        onMastered();
      }
    }
  };

  const correctCount = Object.values(answersRecord).filter(Boolean).length;
  const accuracyPct = Math.round((correctCount / Math.max(1, activeQuizList.length)) * 100);

  return (
    <div className="space-y-6">
      {/* Mode Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setLabMode('flashcards')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-colors cursor-pointer ${
              labMode === 'flashcards'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Thẻ Lật Phản Xạ (24 Flashcards)</span>
          </button>

          <button
            onClick={() => setLabMode('diagnostic_quiz')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-colors cursor-pointer ${
              labMode === 'diagnostic_quiz'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>2. Kiểm Tra Chẩn Đoán (8 hoặc 20 Câu)</span>
          </button>
        </div>

        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
          Đã thuộc chắc: {masteredCardIds.length} / {HANOI_FLASHCARDS.length} thẻ cốt lõi
        </div>
      </div>

      {/* =====================================================================
          MODE 1: ACTIVE-RECALL FLASHCARDS
         ===================================================================== */}
      {labMode === 'flashcards' && activeCard && (
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'ALL', label: 'Tất cả (24)' },
                  { id: 'Cầu & Sông', label: 'Cầu & Sông' },
                  { id: 'Vành đai & Trục', label: 'Vành đai & Trục' },
                  { id: 'Phố Pháp & 1 Chiều', label: 'Phố Pháp & 1 Chiều' },
                  { id: 'Ô Phố & Cổng Phụ', label: 'Ô Phố & Cổng Phụ' }
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setFcCategory(cat.id);
                    setFcIndex(0);
                    setIsFlipped(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                    fcCategory === cat.id
                      ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 border-transparent'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-mono font-bold text-slate-500">
              Thẻ {fcIndex + 1} / {filteredCards.length}
            </span>
          </div>

          {/* Interactive Card */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsFlipped((f) => !f)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsFlipped((f) => !f);
              }
            }}
            className={`p-7 sm:p-10 rounded-3xl border-2 shadow-xl min-h-[290px] flex flex-col justify-between transition-all cursor-pointer select-none ${
              isFlipped
                ? 'bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 border-emerald-500/50'
                : 'bg-white dark:bg-slate-900 border-[#D5CBB9] dark:border-slate-700 hover:border-amber-500/70'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                {activeCard.category}
              </span>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {isFlipped ? 'Đang hiện đáp án (Bấm để úp lại)' : 'Tự nhẩm đáp án rồi bấm để lật thẻ'}
              </span>
            </div>

            {!isFlipped ? (
              <div className="my-6 space-y-3">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                  {activeCard.frontPrompt}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                  Gợi ý nhớ nhanh: {activeCard.frontHint}
                </p>
              </div>
            ) : (
              <div className="my-5 space-y-4">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Đáp Án Chuẩn Xác:
                </div>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white whitespace-pre-line leading-relaxed">
                  {activeCard.backAnswer}
                </p>
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Mẹo khắc ghi:</strong> {activeCard.backMnemonic}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-200/70 dark:border-slate-800">
              <span>
                {masteredCardIds.includes(activeCard.id)
                  ? 'Trạng thái: Đã thuộc chắc thẻ này'
                  : 'Trạng thái: Đang ôn luyện'}
              </span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Phím tắt: Space / Enter để lật
              </span>
            </div>
          </div>

          {/* Navigation & Self-Grading Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setFcIndex((i) => (i - 1 + filteredCards.length) % filteredCards.length);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" /> Thẻ trước
              </button>
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setFcIndex((i) => (i + 1) % filteredCards.length);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Thẻ tiếp <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleMasteredCard(activeCard.id, false)}
                className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer"
              >
                Cần ôn lại
              </button>
              <button
                onClick={() => toggleMasteredCard(activeCard.id, true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer btn-press"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã thuộc lòng!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE 2: DIAGNOSTIC MULTI-DOMAIN QUIZ (8 OR 20 QUESTIONS)
         ===================================================================== */}
      {labMode === 'diagnostic_quiz' && currentQ && (
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Quiz Scope Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'quick_8', label: 'Đề Nhanh 8 Câu Trọng Tâm' },
                { id: 'full_20', label: 'Đề Toàn Diện 20 Câu Chuẩn Hóa' },
                { id: 'hydrology_bridges', label: 'Chuyên đề: Sông & Cầu' },
                { id: 'rings_radials', label: 'Chuyên đề: Vành đai & Trục' },
                { id: 'french_grid_oneway', label: 'Chuyên đề: Phố Pháp & 1 Chiều' },
                { id: 'solar_skyline', label: 'Chuyên đề: Nắng & Skyline' },
                { id: 'routing_address', label: 'Chuyên đề: Làn xe & Lập tuyến' }
              ] as const
            ).map((sc) => (
              <button
                key={sc.id}
                onClick={() => resetQuiz(sc.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                  quizScope === sc.id
                    ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 border-transparent'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-9 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-xl space-y-6">
            {!quizFinished ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      Câu {quizStep + 1} / {activeQuizList.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {currentQ.domainLabelVi}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold">
                      {currentQ.difficulty}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Đúng: {correctCount} câu
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${((quizStep + 1) / activeQuizList.length) * 100}%` }}
                  />
                </div>

                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                  {currentQ.question}
                </h3>

                <div className="space-y-3">
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = selectedOption === oIdx;
                    const isRight = oIdx === currentQ.correctIndex;
                    const showRes = selectedOption !== null;

                    let styleCls =
                      'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-800 dark:text-slate-200';
                    if (showRes) {
                      if (isRight) {
                        styleCls =
                          'bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                      } else if (isSelected) {
                        styleCls =
                          'bg-rose-500/15 border-rose-500 text-rose-900 dark:text-rose-200 font-bold';
                      } else {
                        styleCls = 'opacity-50 border-slate-200 dark:border-slate-800';
                      }
                    }

                    return (
                      <button
                        key={opt}
                        disabled={showRes}
                        onClick={() => handleChooseQuizOption(oIdx)}
                        className={`w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${styleCls}`}
                      >
                        <span className="leading-relaxed">{opt}</span>
                        {showRes && isRight && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                        {showRes && isSelected && !isRight && (
                          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedOption !== null && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/35 border border-amber-300/60 dark:border-amber-800/60 text-xs sm:text-sm text-slate-800 dark:text-amber-100 leading-relaxed space-y-2">
                      <div>
                        <strong className="text-amber-800 dark:text-amber-300">
                          Phân tích bản đồ học:
                        </strong>{' '}
                        {currentQ.explanation}
                      </div>
                      <button
                        onClick={() => onJumpToChapter(currentQ.relatedChapterNumber)}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Mở đọc chi tiết tại Chương {currentQ.relatedChapterNumber}</span>
                      </button>
                    </div>

                    <button
                      onClick={handleNextQuizStep}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer btn-press"
                    >
                      <span>
                        {quizStep + 1 === activeQuizList.length
                          ? 'Xem Báo Cáo Chẩn Đoán Năng Lực'
                          : 'Sang Câu Tiếp Theo'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/40">
                  <Trophy className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    Kết Quả Chẩn Đoán: {correctCount} / {activeQuizList.length} ({accuracyPct}%)
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {accuracyPct >= 70
                      ? 'Xuất sắc! Bạn đã nắm vững cấu trúc không gian cốt lõi của Thủ đô Hà Nội và mở khóa chứng nhận hoàn thành lý thuyết.'
                      : 'Bạn đang đi đúng hướng! Hãy ôn lại các thẻ Flashcards hoặc chương liên quan rồi thử sức lại để đạt trên 70%.'}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    onClick={() => resetQuiz()}
                    className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Làm Lại Bài Thi</span>
                  </button>
                  <button
                    onClick={() => onLaunchExercise()}
                    className="px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 cursor-pointer btn-press"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Vào Game Thực Chiến Ngay</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
