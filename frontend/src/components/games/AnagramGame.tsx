import React, { useState, useEffect, useRef, useMemo } from 'react';
import { VIETNAMESE_WORDS_DICTIONARY, generateAnagram, INFINITY_ROMAN_NUMERALS, getInfinityTier, getInfinityLabel } from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { RotateCcw, Sparkles, Infinity as InfinityIcon, BookOpen, Lightbulb, Clock, AlertTriangle } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { readingContentService, THEMED_VOCABULARY } from '../../services/readingContentService';
import { 
  CURATED_DICTIONARY, 
  EMOJI_WORD_PAIRS, 
  SYNONYM_PAIRS,
  ANTONYM_PAIRS,
  NASA_OFFLINE_CARDS
} from '../../services/infinityApiService';

const COSMIC_COLLOCATIONS = [
  'BIG BANG', 'DEEP LEARNING', 'BLACK HOLE', 'DARK MATTER', 
  'NEURAL NET', 'SOLAR FLARE', 'QUANTUM LEAP', 'EVENT HORIZON', 
  'BRAIN WAVE', 'SPEED LIGHT', 'COSMIC RAY', 'WHITE DWARF'
];

export const AnagramGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, enableHints, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastWordTimeRef = useRef<number>(Date.now());
  const effectiveLevel = getExerciseLevel('anagram') || currentLevel;

  const isInfinity = effectiveLevel >= 13;
  const infinityTier = getInfinityTier(effectiveLevel);

  // Infinity specific level flags
  const isSynonymMode = effectiveLevel === 14;
  const isEmojiMode = effectiveLevel === 15;
  const isPhraseMode = effectiveLevel === 16;
  const isAntonymMode = effectiveLevel === 17;
  const isNasaMode = effectiveLevel === 18;
  const isDistractorMode = effectiveLevel === 19;
  const isSpeedTimer = effectiveLevel === 20;
  const isAcademicDefMode = effectiveLevel === 21;
  const isEndlessWave = effectiveLevel === 22;

  // Standard Themes
  const themes = ['Tất cả', 'Khoa Học Não Bộ', 'Công Nghệ & AI', 'Thiên Văn & Vũ Trụ', 'Tâm Lý & Tư Duy'];
  const [selectedTheme, setSelectedTheme] = useState<string>('Tất cả');

  const [roundTimer, setRoundTimer] = useState(18);

  const combinedDict = useMemo(() => {
    if (isInfinity) {
      if (isEmojiMode) {
        return EMOJI_WORD_PAIRS.map(e => e.word.toUpperCase());
      }
      if (isPhraseMode) {
        return COSMIC_COLLOCATIONS.map(p => p.toUpperCase());
      }
      if (isSynonymMode) {
        return SYNONYM_PAIRS.map(s => s.wordA.toUpperCase());
      }
      if (isAntonymMode) {
        return ANTONYM_PAIRS.map(a => a.wordA.toUpperCase());
      }
      if (isNasaMode) {
        return NASA_OFFLINE_CARDS.map(n => n.title.split(' ')[0].toUpperCase()).filter(w => w.length >= 4);
      }
      return CURATED_DICTIONARY.map(d => d.word.toUpperCase());
    }

    let extra: string[] = [];
    if (selectedTheme !== 'Tất cả' && THEMED_VOCABULARY[selectedTheme]) {
      extra = THEMED_VOCABULARY[selectedTheme];
    } else {
      extra = readingContentService.getVocabularyList();
    }
    const merged = selectedTheme === 'Tất cả' ? [...VIETNAMESE_WORDS_DICTIONARY, ...extra] : extra;
    const sanitized = Array.from(new Set(merged.map(w => w.toUpperCase())));
    return sanitized.length > 0 ? sanitized : ['TRÍ TUỆ', 'NÃO BỘ', 'TƯ DUY', 'KÝ ỨC'];
  }, [selectedTheme, isInfinity, effectiveLevel, isEmojiMode, isPhraseMode, isSynonymMode, isAntonymMode, isNasaMode]);

  const wordPool = useMemo(() => {
    if (isInfinity) return combinedDict;
    if (effectiveLevel <= 3) return combinedDict.filter(w => w.replace(/\s+/g, '').length <= 4);
    if (effectiveLevel <= 6) return combinedDict.filter(w => w.replace(/\s+/g, '').length <= 7);
    return combinedDict;
  }, [combinedDict, effectiveLevel, isInfinity]);

  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * 100));
  const activeWordPool = wordPool.length > 0 ? wordPool : combinedDict;
  const rawTarget = activeWordPool[currentIndex % activeWordPool.length] || 'NEURON';
  const targetWord = rawTarget.replace(/\s+/g, '');

  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [availableTiles, setAvailableTiles] = useState<Array<{ id: number; char: string; used: boolean }>>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [scoreAcc, setScoreAcc] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [round, setRound] = useState(1);
  const maxRounds = isEndlessWave ? 25 : 5;

  const [hintsUsedInRound, setHintsUsedInRound] = useState(0);

  const currentHint = useMemo(() => {
    if (!isInfinity) return null;
    if (isPhraseMode) {
      const parts = rawTarget.split(' ');
      return `Cụm thuật ngữ khoa học gồm ${parts.length} từ (${parts.map(p => `${p.length} ký tự`).join(' + ')})`;
    }
    if (isSynonymMode) {
      const syn = SYNONYM_PAIRS.find(s => s.wordA.toUpperCase() === targetWord || s.wordB.toUpperCase() === targetWord);
      if (syn) return `Từ đồng nghĩa với "${syn.wordB === targetWord ? syn.wordA : syn.wordB}": ${syn.commonMeaning}`;
    }
    if (isAntonymMode) {
      const ant = ANTONYM_PAIRS.find(a => a.wordA.toUpperCase() === targetWord || a.wordB.toUpperCase() === targetWord);
      if (ant) return `Từ TRÁI NGHĨA với "${ant.wordB === targetWord ? ant.wordA : ant.wordB}" (${ant.viConcept})`;
    }
    if (isNasaMode) {
      const card = NASA_OFFLINE_CARDS.find(c => c.title.toUpperCase().includes(targetWord) || c.enLabel.toUpperCase().includes(targetWord));
      if (card) return `Thực thể vũ trụ NASA: ${card.emoji} ${card.viLabel} (${card.enLabel})`;
    }
    if (isAcademicDefMode) {
      const foundDict = CURATED_DICTIONARY.find(d => d.word.toUpperCase() === targetWord);
      if (foundDict) return `[${foundDict.partOfSpeech.toUpperCase()}] ${foundDict.viMeaning} • ${foundDict.definition}`;
    }
    const foundDict = CURATED_DICTIONARY.find(d => d.word.toUpperCase() === targetWord);
    if (foundDict) {
      const syl = foundDict.syllables ? ` • Cấu trúc âm tiết: ${foundDict.syllables.join(' - ')}` : '';
      return `[${foundDict.partOfSpeech.toUpperCase()}] ${foundDict.viMeaning}${syl}`;
    }
    const foundEmoji = EMOJI_WORD_PAIRS.find(e => e.word.toUpperCase() === targetWord);
    if (foundEmoji) return `${foundEmoji.emoji} Biểu tượng: ${foundEmoji.vi}`;
    return null;
  }, [isInfinity, targetWord, rawTarget, isPhraseMode, isSynonymMode, isAntonymMode, isNasaMode, isAcademicDefMode]);

  const setupRound = (word: string) => {
    const data = generateAnagram(word);
    let chars = [...data.scrambled];

    // For Level 19 (Distractor Mode): add 2 random distractor letters
    if (isDistractorMode) {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const distractors = [
        alphabet[Math.floor(Math.random() * alphabet.length)],
        alphabet[Math.floor(Math.random() * alphabet.length)]
      ];
      chars = [...chars, ...distractors].sort(() => Math.random() - 0.5);
    }

    setSelectedLetters([]);
    setAvailableTiles(chars.map((c, i) => ({ id: i, char: c, used: false })));
    setRoundTimer(18);
    setHintsUsedInRound(0);
  };

  useEffect(() => {
    setupRound(targetWord);
  }, [currentIndex, targetWord]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Speed Countdown for Level 20
  useEffect(() => {
    if (!isSpeedTimer || isFinished) return;
    const interval = setInterval(() => {
      setRoundTimer(t => {
        if (t <= 1) {
          playSound('wrong');
          if (round >= maxRounds) {
            setIsFinished(true);
          } else {
            setRound(r => r + 1);
            setCurrentIndex(i => i + 1);
          }
          return 18;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSpeedTimer, isFinished, round, maxRounds]);

  const handleTileClick = (tileId: number, char: string) => {
    playSound('click');
    setAvailableTiles(prev => prev.map(t => t.id === tileId ? { ...t, used: true } : t));
    const nextSelected = [...selectedLetters, char];
    setSelectedLetters(nextSelected);

    // Check if word formation complete
    if (nextSelected.length === targetWord.length) {
      const formedWord = nextSelected.join('');
      const isCorrect = formedWord === targetWord;
      const now = Date.now();
      const respMs = Math.min(15000, Math.max(100, now - lastWordTimeRef.current));
      lastWordTimeRef.current = now;

      emitTrialEvent({
        exerciseSlug: 'anagram',
        level: effectiveLevel,
        relationId: 'PART_WHOLE',
        relationWeight: 1.0,
        entities: {
          target: targetWord,
          formed: formedWord,
          theme: selectedTheme
        },
        stateBefore: `round:${round}`,
        stateAfter: isCorrect ? `round:${round + 1}` : `round:${round}`,
        responseMs: respMs,
        correct: isCorrect
      });

      if (isCorrect) {
        playSound('correct');
        setScoreAcc(s => s + 120 * effectiveLevel);
        if (round >= maxRounds) {
          setIsFinished(true);
        } else {
          setRound(r => r + 1);
          setCurrentIndex(i => i + 1);
        }
      } else {
        playSound('wrong');
        setTimeout(() => {
          setupRound(targetWord);
        }, 600);
      }
    }
  };

  const handleResetCurrent = () => {
    playSound('click');
    setupRound(targetWord);
  };

  const handleUseHint = () => {
    if (hintsUsedInRound >= 2 || selectedLetters.length >= targetWord.length) return;
    const nextTargetChar = targetWord[selectedLetters.length];
    const availableTile = availableTiles.find(t => !t.used && t.char === nextTargetChar);
    if (availableTile) {
      playSound('click');
      setHintsUsedInRound(h => h + 1);
      setScoreAcc(s => Math.max(0, s - 25));
      handleTileClick(availableTile.id, availableTile.char);
    }
  };

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm text-slate-500 font-semibold">Điểm số</span>
            {isInfinity && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center gap-1">
                <InfinityIcon className="w-3 h-3" />
                {getInfinityLabel(effectiveLevel)}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {scoreAcc}
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Vòng</span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">
            {round} / {maxRounds}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">
            {isSpeedTimer ? 'Thời gian vòng' : 'Thời gian'}
          </span>
          <div className={`text-2xl sm:text-3xl font-black mt-0.5 ${isSpeedTimer ? (roundTimer <= 5 ? 'text-rose-500 animate-pulse' : 'text-purple-600') : 'text-amber-500'}`}>
            {isSpeedTimer ? `${roundTimer}s` : `${elapsedSec}s`}
          </div>
        </div>
      </div>

      {/* Distractor Warning Banner */}
      {isDistractorMode && (
        <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2 text-xs font-black animate-pulse">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>BẪY TẬP TRUNG: CÓ 2 CHỮ CÁI BẪY KHÔNG THUỘC VỀ TỪ CẦN GHÉP!</span>
        </div>
      )}

      {/* Infinity Hint or Emoji Clue Card */}
      {currentHint && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 flex items-center gap-3 shadow-sm animate-fade-in">
          <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
          <div>
            <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider block">
              Gợi Ý Nghĩa Tiếng Việt & Ngữ Cảnh Học Thuật
            </span>
            <span className="text-xs sm:text-sm font-black text-purple-900 dark:text-purple-200">
              {currentHint}
            </span>
          </div>
        </div>
      )}

      {/* Answer Slots Display */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-lg flex flex-col items-center justify-center min-h-[160px] space-y-4">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {isInfinity ? 'TỪ VỰNG TIẾNG ANH ĐANG GHÉP' : 'TỪ ĐANG GHÉP'}
          </span>
          {isInfinity && targetWord.length >= 6 && (
            <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-3.5 py-1 rounded-full border border-brand-200 dark:border-brand-800 shadow-sm animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>Chữ cái bắt đầu: <strong className="font-mono font-black text-sm text-brand-700 dark:text-brand-300">'{targetWord[0]}'</strong></span>
              {targetWord.length >= 8 && (
                <span className="text-slate-400">| Kết thúc: <strong className="font-mono font-black text-sm text-brand-700 dark:text-brand-300">'{targetWord[targetWord.length - 1]}'</strong></span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {Array.from({ length: targetWord.length }).map((_, idx) => {
            const letter = selectedLetters[idx];
            return (
              <div
                key={idx}
                className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 flex items-center justify-center font-mono font-black text-2xl sm:text-3xl transition-all shadow-sm ${
                  letter
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 scale-105'
                    : 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
              >
                {letter || ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrambled Available Letter Tiles */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 pt-2">
        {availableTiles.map((tile) => (
          <button
            key={tile.id}
            disabled={tile.used}
            onClick={() => handleTileClick(tile.id, tile.char)}
            className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl font-mono font-black text-xl sm:text-2xl shadow-md transition-all duration-150 btn-press flex items-center justify-center ${
              tile.used
                ? 'opacity-20 pointer-events-none scale-90 bg-slate-200 dark:bg-slate-700 text-slate-400'
                : isInfinity
                ? 'bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/25 ring-2 ring-purple-300 dark:ring-purple-800'
                : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-800 dark:text-white'
            }`}
          >
            {tile.char}
          </button>
        ))}
      </div>

      {/* Controls: Reset + Interactive Hint Button */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={handleResetCurrent}
          className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Xếp lại chữ cái
        </button>

        {isInfinity && (
          <button
            onClick={handleUseHint}
            disabled={hintsUsedInRound >= 2 || selectedLetters.length >= targetWord.length}
            className={`px-4 py-2.5 text-xs font-black flex items-center gap-1.5 rounded-xl border transition-all shadow-sm ${
              hintsUsedInRound >= 2 || selectedLetters.length >= targetWord.length
                ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400'
                : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:scale-105 active:scale-95'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Mở khóa 1 ký tự ({2 - hintsUsedInRound}/2)</span>
          </button>
        )}
      </div>

      {isFinished && (
        <GameResultModal
          score={scoreAcc}
          accuracyRate={100}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setScoreAcc(0);
            setRound(1);
            setElapsedSec(0);
            setIsFinished(false);
            setCurrentIndex(i => i + 1);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
