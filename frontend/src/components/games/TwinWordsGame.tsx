import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { generateTwinWords, VIETNAMESE_WORDS_DICTIONARY, ENGLISH_WORDS_DICTIONARY, INFINITY_ROMAN_NUMERALS, getInfinityTier, getInfinityLabel } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { readingContentService, THEMED_VOCABULARY } from '../../services/readingContentService';
import { BILINGUAL_WORD_PAIRS, CURATED_DICTIONARY } from '../../services/infinityApiService';
import { Infinity as InfinityIcon, Sparkles } from 'lucide-react';

export const TwinWordsGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastChoiceTimeRef = useRef<number>(Date.now());
  const currentLevel = getExerciseLevel('twin-words');
  const isInfinity = currentLevel >= 13;

  const [round, setRound] = useState(1);
  const maxRounds = currentLevel >= 13 ? 15 : currentLevel >= 9 ? 12 : 10;

  const themes = ['Tất cả', 'Khoa Học Não Bộ', 'Công Nghệ & AI', 'Thiên Văn & Vũ Trụ', 'Tâm Lý & Tư Duy'];
  const [selectedTheme, setSelectedTheme] = useState<string>('Tất cả');
  
  const combinedDict = React.useMemo(() => {
    if (currentLevel === 13) {
      return CURATED_DICTIONARY.map(d => d.word.toUpperCase());
    }

    let extra: string[] = [];
    if (selectedTheme !== 'Tất cả' && THEMED_VOCABULARY[selectedTheme]) {
      extra = THEMED_VOCABULARY[selectedTheme];
    } else {
      extra = readingContentService.getVocabularyList();
    }
    const merged = selectedTheme === 'Tất cả' ? [...VIETNAMESE_WORDS_DICTIONARY, ...extra] : extra;
    const sanitized = Array.from(new Set(merged.map(w => w.replace(/\s+/g, '').toUpperCase())));
    return sanitized.length > 0 ? sanitized : ['TRÍTUỆ', 'NÃOBỘ', 'PHẢNXẠ', 'THỊGIÁC'];
  }, [selectedTheme, currentLevel]);

  const [pair, setPair] = useState(() => {
    const word = combinedDict[0] || 'TRÍTUỆ';
    return generateTwinWords(word, true);
  });
  const [subLabels, setSubLabels] = useState<{ labelA?: string; labelB?: string }>({});
  const [showWords, setShowWords] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const nextPair = (dict = combinedDict) => {
    if (currentLevel === 14) {
      // ∞-II: Cross-Language Semantic Match (VI vs EN)
      const shouldMatch = Math.random() < 0.5;
      const pairItem = BILINGUAL_WORD_PAIRS[Math.floor(Math.random() * BILINGUAL_WORD_PAIRS.length)];
      if (shouldMatch) {
        setPair({
          word1: pairItem.vi.toUpperCase(),
          word2: pairItem.en.toUpperCase(),
          isMatch: true
        });
      } else {
        const other = BILINGUAL_WORD_PAIRS[(BILINGUAL_WORD_PAIRS.indexOf(pairItem) + 2) % BILINGUAL_WORD_PAIRS.length];
        setPair({
          word1: pairItem.vi.toUpperCase(),
          word2: other.en.toUpperCase(),
          isMatch: false
        });
      }
      setSubLabels({ labelA: 'TIẾNG VIỆT', labelB: 'TIẾNG ANH' });
    } else {
      const randWord = dict[Math.floor(Math.random() * dict.length)] || 'TRÍTUỆ';
      const shouldMatch = Math.random() < 0.5;
      setPair(generateTwinWords(randWord, shouldMatch));
      setSubLabels({});
    }

    setShowWords(true);
    // At level 9+ or level 19 (∞-VII), words flash and disappear quickly
    if (currentLevel === 19) {
      setTimeout(() => setShowWords(false), 320); // 320ms ultra flash
    } else if (currentLevel >= 9) {
      const flashMs = Math.max(600, 1200 - (currentLevel - 9) * 120);
      setTimeout(() => setShowWords(false), flashMs);
    }
  };

  useEffect(() => {
    nextPair(combinedDict);
  }, [selectedTheme]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [currentLevel]);

  const handleChoice = (isMatchChoice: boolean) => {
    if (isFinished) return;
    const isCorrect = isMatchChoice === pair.isMatch;
    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastChoiceTimeRef.current));
    lastChoiceTimeRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'twin-words',
      level: currentLevel,
      relationId: 'IDENTITY_MATCH',
      relationWeight: 1.0,
      entities: {
        wordA: pair.word1,
        wordB: pair.word2,
        shouldMatch: pair.isMatch,
        choice: isMatchChoice,
        theme: selectedTheme
      },
      stateBefore: `round:${round}`,
      stateAfter: isCorrect ? `round:${round + 1}` : `round:${round}`,
      responseMs: respMs,
      correct: isCorrect
    });

    if (isCorrect) {
      playSound('correct');
      setCorrectCount(c => c + 1);
    } else {
      playSound('wrong');
    }

    if (round >= maxRounds) {
      setIsFinished(true);
    } else {
      setRound(r => r + 1);
      nextPair(combinedDict);
    }
  };

  const accuracy = Math.round((correctCount / maxRounds) * 100);
  const score = (correctCount * 30 * currentLevel) + Math.max(0, (35 - elapsedSec) * 5);

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-5 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm text-slate-500 font-semibold">Tiến trình</span>
            {isInfinity && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center gap-1">
                <InfinityIcon className="w-3 h-3" />
                {getInfinityLabel(currentLevel)}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {round} / {maxRounds}
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Chính xác</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500 mt-0.5">
            {correctCount}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Thời gian</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 mt-0.5">
            {elapsedSec}s
          </div>
        </div>
      </div>

      {/* Instruction Tip */}
      <div className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
        {currentLevel === 14 ? (
          '🌌 Cấp Vô Cực ∞-II: 1 từ Tiếng Việt và 1 từ Tiếng Anh. Chọn GIỐNG NHAU nếu chúng có cùng nghĩa dịch thuật!'
        ) : currentLevel === 13 ? (
          '🌌 Cấp Vô Cực ∞-I: So sánh 2 từ vựng Tiếng Anh. Quan sát thật nhanh xem có bị đột biến ký tự nào không!'
        ) : currentLevel === 19 ? (
          '🌌 Cấp Vô Cực ∞-VII: Cặp từ chỉ chớp sáng 300ms rồi biến mất. Nhớ lại bằng trí nhớ lưu ảnh võng mạc!'
        ) : (
          'Quan sát thật nhanh 2 từ xem chúng có HOÀN TOÀN GIỐNG NHAU hay không.'
        )}
      </div>

      {/* Comparison Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 sm:py-6">
        {/* Word 1 */}
        <div className="h-36 sm:h-44 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-4 shadow-md transition-all select-none">
          {subLabels.labelA && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              {subLabels.labelA}
            </span>
          )}
          <span className="font-mono font-black text-2xl sm:text-3xl md:text-4xl text-slate-800 dark:text-white tracking-widest text-center">
            {showWords ? pair.word1 : '••••••••'}
          </span>
        </div>

        {/* Word 2 */}
        <div className="h-36 sm:h-44 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-4 shadow-md transition-all select-none">
          {subLabels.labelB && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              {subLabels.labelB}
            </span>
          )}
          <span className="font-mono font-black text-2xl sm:text-3xl md:text-4xl text-slate-800 dark:text-white tracking-widest text-center">
            {showWords ? pair.word2 : '••••••••'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <button
          onClick={() => handleChoice(true)}
          className="h-20 sm:h-24 rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xl sm:text-2xl shadow-lg shadow-emerald-600/30 flex flex-col items-center justify-center transition-all btn-press"
        >
          <span>GIỐNG NHAU</span>
          <span className="text-xs opacity-75 font-semibold">Match</span>
        </button>

        <button
          onClick={() => handleChoice(false)}
          className="h-20 sm:h-24 rounded-3xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xl sm:text-2xl shadow-lg shadow-rose-600/30 flex flex-col items-center justify-center transition-all btn-press"
        >
          <span>KHÁC NHAU</span>
          <span className="text-xs opacity-75 font-semibold">Different</span>
        </button>
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracy}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setRound(1);
            setCorrectCount(0);
            setElapsedSec(0);
            setIsFinished(false);
            nextPair();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
