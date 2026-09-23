import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { generateTwinWords, VIETNAMESE_WORDS_DICTIONARY, ENGLISH_WORDS_DICTIONARY, INFINITY_ROMAN_NUMERALS, getInfinityTier, getInfinityLabel } from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { readingContentService, THEMED_VOCABULARY } from '../../services/readingContentService';
import { 
  BILINGUAL_WORD_PAIRS, 
  CURATED_DICTIONARY,
  SYNONYM_PAIRS,
  ANTONYM_PAIRS,
  EMOJI_WORD_PAIRS,
  FALSE_FRIENDS,
  POS_TRIADS
} from '../../services/infinityApiService';
import { Infinity as InfinityIcon, Sparkles } from 'lucide-react';

export const TwinWordsGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastChoiceTimeRef = useRef<number>(Date.now());
  const currentLevel = getExerciseLevel('twin-words');
  const isInfinity = currentLevel >= 13;

  const [round, setRound] = useState(1);
  const maxRounds = currentLevel >= 22 ? 20 : currentLevel >= 13 ? 15 : currentLevel >= 9 ? 12 : 10;

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

  const [pair, setPair] = useState<{ word1: string; word2: string; isMatch: boolean }>(() => {
    const word = combinedDict[0] || 'TRÍTUỆ';
    return generateTwinWords(word, true);
  });
  const [subLabels, setSubLabels] = useState<{ labelA?: string; labelB?: string; prompt?: string }>({});
  const [showWords, setShowWords] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const nextPair = (dict = combinedDict) => {
    const shouldMatch = Math.random() < 0.5;

    if (currentLevel === 13) {
      // ∞-I: English Curated Dictionary Exact vs Typo
      const entry = CURATED_DICTIONARY[Math.floor(Math.random() * CURATED_DICTIONARY.length)];
      const target = entry.word.toUpperCase();
      if (shouldMatch) {
        setPair({ word1: target, word2: target, isMatch: true });
      } else {
        // Create 1-letter mutation
        const pos = Math.floor(Math.random() * target.length);
        const mutated = target.substring(0, pos) + (target[pos] === 'A' ? 'O' : 'E') + target.substring(pos + 1);
        setPair({ word1: target, word2: mutated, isMatch: false });
      }
      setSubLabels({ labelA: 'TỪ TIẾNG ANH 1', labelB: 'TỪ TIẾNG ANH 2', prompt: 'Hai từ tiếng Anh có HOÀN TOÀN TRÙNG KHỚP từng chữ cái?' });

    } else if (currentLevel === 14) {
      // ∞-II: Cross-Language Semantic Translation (VI vs EN)
      const pairItem = BILINGUAL_WORD_PAIRS[Math.floor(Math.random() * BILINGUAL_WORD_PAIRS.length)];
      if (shouldMatch) {
        setPair({ word1: pairItem.vi.toUpperCase(), word2: pairItem.en.toUpperCase(), isMatch: true });
      } else {
        const other = BILINGUAL_WORD_PAIRS[(BILINGUAL_WORD_PAIRS.indexOf(pairItem) + 5) % BILINGUAL_WORD_PAIRS.length];
        setPair({ word1: pairItem.vi.toUpperCase(), word2: other.en.toUpperCase(), isMatch: false });
      }
      setSubLabels({ labelA: 'TIẾNG VIỆT', labelB: 'TIẾNG ANH', prompt: 'Từ Tiếng Việt và Tiếng Anh có CÙNG NGHĨA DỊCH THUẬT không?' });

    } else if (currentLevel === 15) {
      // ∞-III: English Synonym Pairs
      const syn = SYNONYM_PAIRS[Math.floor(Math.random() * SYNONYM_PAIRS.length)];
      if (shouldMatch) {
        setPair({ word1: syn.wordA.toUpperCase(), word2: syn.wordB.toUpperCase(), isMatch: true });
      } else {
        const other = SYNONYM_PAIRS[(SYNONYM_PAIRS.indexOf(syn) + 3) % SYNONYM_PAIRS.length];
        setPair({ word1: syn.wordA.toUpperCase(), word2: other.wordB.toUpperCase(), isMatch: false });
      }
      setSubLabels({ labelA: 'TỪ ĐỒNG NGHĨA A', labelB: 'TỪ ĐỒNG NGHĨA B', prompt: 'Hai từ này có phải TỪ ĐỒNG NGHĨA (Synonyms) trong Tiếng Anh?' });

    } else if (currentLevel === 16) {
      // ∞-IV: Antonyms
      const ant = ANTONYM_PAIRS[Math.floor(Math.random() * ANTONYM_PAIRS.length)];
      if (shouldMatch) {
        setPair({ word1: ant.wordA.toUpperCase(), word2: ant.wordB.toUpperCase(), isMatch: true });
      } else {
        const other = ANTONYM_PAIRS[(ANTONYM_PAIRS.indexOf(ant) + 4) % ANTONYM_PAIRS.length];
        setPair({ word1: ant.wordA.toUpperCase(), word2: other.wordB.toUpperCase(), isMatch: false });
      }
      setSubLabels({ labelA: 'TỪ TRÁI NGHĨA A', labelB: 'TỪ TRÁI NGHĨA B', prompt: 'Hai từ này có phải CẶP TỪ TRÁI NGHĨA (Antonyms) không?' });

    } else if (currentLevel === 17) {
      // ∞-V: Visual Emoji vs English Word
      const emo = EMOJI_WORD_PAIRS[Math.floor(Math.random() * EMOJI_WORD_PAIRS.length)];
      if (shouldMatch) {
        setPair({ word1: emo.emoji, word2: emo.word.toUpperCase(), isMatch: true });
      } else {
        const other = EMOJI_WORD_PAIRS[(EMOJI_WORD_PAIRS.indexOf(emo) + 6) % EMOJI_WORD_PAIRS.length];
        setPair({ word1: emo.emoji, word2: other.word.toUpperCase(), isMatch: false });
      }
      setSubLabels({ labelA: 'BIỂU TƯỢNG', labelB: 'TỪ TIẾNG ANH', prompt: 'Biểu tượng hình ảnh và từ vựng Tiếng Anh có TƯƠNG ĐỒNG Ý NGHĨA?' });

    } else if (currentLevel === 18) {
      // ∞-VI: False Friends / Lookalike Confusables
      const ff = FALSE_FRIENDS[Math.floor(Math.random() * FALSE_FRIENDS.length)];
      if (shouldMatch) {
        const pickWord = Math.random() < 0.5 ? ff.wordA : ff.wordB;
        setPair({ word1: pickWord.toUpperCase(), word2: pickWord.toUpperCase(), isMatch: true });
      } else {
        setPair({ word1: ff.wordA.toUpperCase(), word2: ff.wordB.toUpperCase(), isMatch: false });
      }
      setSubLabels({ labelA: 'TỪ DỄ GÂY NHẦM LẪN 1', labelB: 'TỪ DỄ GÂY NHẦM LẪN 2', prompt: 'Phân biệt chính tả: Hai từ này có HOÀN TOÀN LÀ 1 TỪ DUY NHẤT?' });

    } else if (currentLevel === 19) {
      // ∞-VII: Reverse String Identity
      const entry = CURATED_DICTIONARY[Math.floor(Math.random() * CURATED_DICTIONARY.length)];
      const target = entry.word.toUpperCase();
      const rev = target.split('').reverse().join('');
      if (shouldMatch) {
        setPair({ word1: target, word2: rev, isMatch: true });
      } else {
        const other = CURATED_DICTIONARY[(CURATED_DICTIONARY.indexOf(entry) + 4) % CURATED_DICTIONARY.length].word.toUpperCase();
        setPair({ word1: target, word2: other.split('').reverse().join(''), isMatch: false });
      }
      setSubLabels({ labelA: 'CHUỖI XUÔI', labelB: 'CHUỖI ĐẢO NGƯỢC', prompt: 'Chuỗi 2 có phải là BẢN ĐẢO NGƯỢC KÝ TỰ CHÍNH XÁC của Chuỗi 1?' });

    } else if (currentLevel === 20) {
      // ∞-VIII: Tachistoscopic Flash 220ms
      const entry = CURATED_DICTIONARY[Math.floor(Math.random() * CURATED_DICTIONARY.length)];
      const target = entry.word.toUpperCase();
      if (shouldMatch) {
        setPair({ word1: target, word2: target, isMatch: true });
      } else {
        const other = CURATED_DICTIONARY[(CURATED_DICTIONARY.indexOf(entry) + 2) % CURATED_DICTIONARY.length].word.toUpperCase();
        setPair({ word1: target, word2: other, isMatch: false });
      }
      setSubLabels({ labelA: 'FLASH 220ms', labelB: 'FLASH 220ms', prompt: 'Chớp sáng 220ms: Hai từ chớp lóe có giống nhau không?' });

    } else if (currentLevel === 21) {
      // ∞-IX: Part of Speech Grammatical Compatibility
      const triad = POS_TRIADS[Math.floor(Math.random() * POS_TRIADS.length)];
      if (shouldMatch) {
        // Pick two words from same grammatical category across triads
        const otherTriad = POS_TRIADS[(POS_TRIADS.indexOf(triad) + 2) % POS_TRIADS.length];
        const category = (['noun', 'verb', 'adjective'] as const)[Math.floor(Math.random() * 3)];
        setPair({ word1: triad[category].toUpperCase(), word2: otherTriad[category].toUpperCase(), isMatch: true });
        setSubLabels({ labelA: 'TỪ A', labelB: 'TỪ B', prompt: `Cả hai từ có CÙNG TỪ LOẠI (${category.toUpperCase()}) không?` });
      } else {
        setPair({ word1: triad.noun.toUpperCase(), word2: triad.verb.toUpperCase(), isMatch: false });
        setSubLabels({ labelA: 'TỪ A', labelB: 'TỪ B', prompt: 'Cả hai từ có CÙNG TỪ LOẠI (Danh từ / Động từ / Tính từ) không?' });
      }

    } else if (currentLevel === 22) {
      // ∞-X: Rapid Multi-Domain Cognitive Synthesis
      const randDomain = Math.floor(Math.random() * 4);
      if (randDomain === 0) {
        const bp = BILINGUAL_WORD_PAIRS[Math.floor(Math.random() * BILINGUAL_WORD_PAIRS.length)];
        setPair({ word1: bp.vi.toUpperCase(), word2: shouldMatch ? bp.en.toUpperCase() : 'COSMIC', isMatch: shouldMatch });
        setSubLabels({ labelA: 'VIỆT', labelB: 'ANH', prompt: 'Khớp nghĩa dịch thuật VI-EN?' });
      } else if (randDomain === 1) {
        const syn = SYNONYM_PAIRS[Math.floor(Math.random() * SYNONYM_PAIRS.length)];
        setPair({ word1: syn.wordA.toUpperCase(), word2: shouldMatch ? syn.wordB.toUpperCase() : 'RANDOM', isMatch: shouldMatch });
        setSubLabels({ labelA: 'TỪ A', labelB: 'TỪ B', prompt: 'Đồng nghĩa (Synonyms)?' });
      } else if (randDomain === 2) {
        const ant = ANTONYM_PAIRS[Math.floor(Math.random() * ANTONYM_PAIRS.length)];
        setPair({ word1: ant.wordA.toUpperCase(), word2: shouldMatch ? ant.wordB.toUpperCase() : 'HARMONY', isMatch: shouldMatch });
        setSubLabels({ labelA: 'TỪ A', labelB: 'TỪ B', prompt: 'Trái nghĩa (Antonyms)?' });
      } else {
        const emo = EMOJI_WORD_PAIRS[Math.floor(Math.random() * EMOJI_WORD_PAIRS.length)];
        setPair({ word1: emo.emoji, word2: shouldMatch ? emo.word.toUpperCase() : 'STORM', isMatch: shouldMatch });
        setSubLabels({ labelA: 'EMOJI', labelB: 'WORD', prompt: 'Biểu tượng khớp từ vựng?' });
      }

    } else {
      // Standard Levels (1 - 12)
      const randWord = dict[Math.floor(Math.random() * dict.length)] || 'TRÍTUỆ';
      setPair(generateTwinWords(randWord, shouldMatch));
      setSubLabels({});
    }

    setShowWords(true);
    // Flash disappearing mechanics
    if (currentLevel === 20) {
      setTimeout(() => setShowWords(false), 220); // 220ms tachistoscopic flash
    } else if (currentLevel === 19) {
      setTimeout(() => setShowWords(false), 380);
    } else if (currentLevel >= 9 && currentLevel < 13) {
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
      <div className="text-center text-xs sm:text-sm font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-2.5 rounded-2xl shadow-sm">
        {subLabels.prompt ? (
          `🌌 Cấp Vô Cực ${getInfinityLabel(currentLevel)}: ${subLabels.prompt}`
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
