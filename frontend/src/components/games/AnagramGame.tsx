import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  VIETNAMESE_WORDS_DICTIONARY, 
  COMMON_ENGLISH_ANAGRAM_DICTIONARY,
  VIETNAMESE_WORD_KNOWLEDGE,
  EXERCISES_METADATA,
  generateAnagram, 
  INFINITY_ROMAN_NUMERALS, 
  getInfinityTier, 
  getInfinityLabel 
} from '@brain-exercises/shared';
import { useAppStore } from '../../store/useAppStore';
import { useExerciseSessionConfig } from '../../hooks/useExerciseSessionConfig';
import { GameResultModal } from './GameResultModal';
import { 
  RotateCcw, Sparkles, Infinity as InfinityIcon, BookOpen, Lightbulb, 
  Clock, AlertTriangle, Pause, Play, CheckCircle2, ArrowRight, Eye, HelpCircle, XCircle 
} from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';
import { readingContentService, THEMED_VOCABULARY } from '../../services/readingContentService';
import { 
  infinityApiService,
  CURATED_DICTIONARY, 
  EMOJI_WORD_PAIRS, 
  SYNONYM_PAIRS,
  ANTONYM_PAIRS,
  BILINGUAL_WORD_PAIRS,
  NASA_OFFLINE_CARDS,
  IDictionaryEntry
} from '../../services/infinityApiService';

const COSMIC_COLLOCATIONS = [
  'BIG BANG', 'DEEP LEARNING', 'BLACK HOLE', 'DARK MATTER', 
  'NEURAL NET', 'SOLAR FLARE', 'QUANTUM LEAP', 'EVENT HORIZON', 
  'BRAIN WAVE', 'SPEED LIGHT', 'COSMIC RAY', 'WHITE DWARF'
];

interface IWordDebriefData {
  word: string;
  partOfSpeech?: string;
  viMeaning?: string;
  definition?: string;
  example?: string;
  synonyms?: string[];
  wasSkipped?: boolean;
}

export const AnagramGame: React.FC = () => {
  const { currentLevel: storeLevel, getExerciseLevel, setActiveGameSlug, enableHints, playSound, isGamePaused, setIsGamePaused } = useAppStore();
  const { sessionConfig, isCustom } = useExerciseSessionConfig('anagram');
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const { trackWrongAnswer } = useWrongAnswerTracker('anagram');

  // Exercise Metadata & Level Configs
  const exerciseMeta = useMemo(() => EXERCISES_METADATA.find(e => e.slug === 'anagram'), []);
  const ladderLevel = getExerciseLevel('anagram') || storeLevel || 1;

  // Lock the session level to prevent background jumping when recordAttempt promotes level
  const playedLevelRef = useRef<number>(isCustom ? 0 : ladderLevel);
  const sessionLevel = isCustom ? 0 : playedLevelRef.current;
  const isInfinity = !isCustom && sessionLevel >= 13;

  const standardLevelConfig = useMemo(() => {
    return exerciseMeta?.levelConfigs.find(c => c.level === (sessionLevel || 1));
  }, [exerciseMeta, sessionLevel]);

  // Round count based on config: Custom preset rounds || standard level targetItemCount (L1:3 -> L12:9)
  const maxRounds = useMemo(() => {
    if (isCustom && sessionConfig.rounds && sessionConfig.rounds > 0) {
      return sessionConfig.rounds;
    }
    if (isInfinity) {
      return sessionLevel === 22 ? 25 : 5;
    }
    return standardLevelConfig?.targetItemCount || (sessionLevel <= 2 ? 3 : sessionLevel <= 5 ? 4 : sessionLevel <= 8 ? 5 : sessionLevel <= 11 ? 7 : 9);
  }, [isCustom, sessionConfig.rounds, isInfinity, sessionLevel, standardLevelConfig]);

  // Time limit based on config (countdown)
  const initialTimeLimit = useMemo(() => {
    if (isCustom && sessionConfig.timeLimitSec && sessionConfig.timeLimitSec > 0) {
      return sessionConfig.timeLimitSec;
    }
    return standardLevelConfig?.timeLimitSec || 50;
  }, [isCustom, sessionConfig.timeLimitSec, standardLevelConfig]);

  // Infinity specific level flags
  const isSynonymMode = isInfinity && sessionLevel === 14;
  const isEmojiMode = isInfinity && sessionLevel === 15;
  const isPhraseMode = isInfinity && sessionLevel === 16;
  const isAntonymMode = isInfinity && sessionLevel === 17;
  const isNasaMode = isInfinity && sessionLevel === 18;
  const isDistractorMode = isInfinity && sessionLevel === 19;
  const isSpeedTimer = isInfinity && sessionLevel === 20;
  const isAcademicDefMode = isInfinity && sessionLevel === 21;
  const isEndlessWave = isInfinity && sessionLevel === 22;

  // Standard Themes
  const themes = ['Tất cả', 'Khoa Học Não Bộ', 'Công Nghệ & AI', 'Thiên Văn & Vũ Trụ', 'Tâm Lý & Tư Duy'];
  const [selectedTheme, setSelectedTheme] = useState<string>('Tất cả');

  // Word pool generation
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
  }, [selectedTheme, isInfinity, isEmojiMode, isPhraseMode, isSynonymMode, isAntonymMode, isNasaMode]);

  // Filter word pool according to level parameter wordLength
  const wordPool = useMemo(() => {
    if (isInfinity) return combinedDict;
    const rawLen = (standardLevelConfig?.parametersJson as any)?.wordLength;
    const targetLen = typeof rawLen === 'number' ? rawLen : null;
    if (targetLen) {
      const filtered = combinedDict.filter(w => {
        const cleanLen = w.replace(/\s+/g, '').length;
        return cleanLen >= targetLen - 1 && cleanLen <= targetLen + 1;
      });
      if (filtered.length >= 3) return filtered;
    }
    if (sessionLevel <= 2) return combinedDict.filter(w => w.replace(/\s+/g, '').length <= 4);
    if (sessionLevel <= 5) return combinedDict.filter(w => w.replace(/\s+/g, '').length <= 6);
    if (sessionLevel <= 8) return combinedDict.filter(w => w.replace(/\s+/g, '').length <= 8);
    return combinedDict;
  }, [combinedDict, standardLevelConfig, sessionLevel, isInfinity]);

  // Valid English & Vietnamese Anagram Isomer Dictionary
  const validAnagramDictionary = useMemo(() => {
    const set = new Set<string>();
    combinedDict.forEach(w => set.add(w.replace(/\s+/g, '').toUpperCase()));
    COMMON_ENGLISH_ANAGRAM_DICTIONARY.forEach(w => set.add(w.toUpperCase()));
    CURATED_DICTIONARY.forEach(d => set.add(d.word.toUpperCase()));
    BILINGUAL_WORD_PAIRS.forEach(p => set.add(p.en.toUpperCase()));
    SYNONYM_PAIRS.forEach(s => {
      set.add(s.wordA.toUpperCase());
      set.add(s.wordB.toUpperCase());
    });
    ANTONYM_PAIRS.forEach(a => {
      set.add(a.wordA.toUpperCase());
      set.add(a.wordB.toUpperCase());
    });
    VIETNAMESE_WORDS_DICTIONARY.forEach(w => set.add(w.replace(/\s+/g, '').toUpperCase()));
    return set;
  }, [combinedDict]);

  // Game Progress State
  const [round, setRound] = useState(1);
  const [scoreAcc, setScoreAcc] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [roundFails, setRoundFails] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isShakeError, setIsShakeError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Spaced Repetition / Missed Word Queue
  const [missedQueue, setMissedQueue] = useState<Array<{ raw: string; clean: string }>>([]);
  const [isReviewPhase, setIsReviewPhase] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  // Timers
  const [roundCountdown, setRoundCountdown] = useState(initialTimeLimit);
  const [totalElapsedSec, setTotalElapsedSec] = useState(0);
  const lastWordTimeRef = useRef<number>(Date.now());

  // Current Target Word Selection
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * 100));
  const activeWordPool = wordPool.length > 0 ? wordPool : combinedDict;
  
  const rawTarget = useMemo(() => {
    if (isReviewPhase && missedQueue[reviewIndex]) {
      return missedQueue[reviewIndex].raw;
    }
    return activeWordPool[currentIndex % activeWordPool.length] || 'NEURON';
  }, [isReviewPhase, missedQueue, reviewIndex, activeWordPool, currentIndex]);

  const targetWord = useMemo(() => rawTarget.replace(/\s+/g, ''), [rawTarget]);

  // Letter Tiles State
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [availableTiles, setAvailableTiles] = useState<Array<{ id: number; char: string; used: boolean }>>([]);
  const [hintsUsedInRound, setHintsUsedInRound] = useState(0);
  const [datamuseAssociations, setDatamuseAssociations] = useState<string[]>([]);

  // Educational Debrief Flashcard State
  const [wordDebrief, setWordDebrief] = useState<IWordDebriefData | null>(null);

  // Hints availability: available in Infinity OR in standard levels where hints !== false
  const isHintAllowed = useMemo(() => {
    if (isInfinity) return true;
    if (enableHints) return true;
    return standardLevelConfig?.parametersJson?.hints !== false;
  }, [isInfinity, enableHints, standardLevelConfig]);

  // Fetch clean Datamuse associations
  useEffect(() => {
    if (!isInfinity || !targetWord) {
      setDatamuseAssociations([]);
      return;
    }
    let isMounted = true;
    infinityApiService.getDatamuseAssociations(targetWord).then((words: string[]) => {
      if (isMounted && words && words.length > 0) {
        // Filter out noisy single letters or unrelated strings
        const cleaned = words
          .filter((w: string) => w !== targetWord && w.length >= 3 && w.length <= 10 && /^[A-Z]+$/.test(w))
          .slice(0, 3);
        setDatamuseAssociations(cleaned);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [isInfinity, targetWord]);

  // Compute pedagogical clue for target word
  const currentClue = useMemo(() => {
    if (isInfinity) {
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
    }

    // Vietnamese pedagogical clue
    const viKnowledge = VIETNAMESE_WORD_KNOWLEDGE[targetWord] || VIETNAMESE_WORD_KNOWLEDGE[rawTarget];
    if (viKnowledge) {
      return `[${viKnowledge.partOfSpeech.toUpperCase()}] ${viKnowledge.definition}`;
    }

    if (rawTarget.includes(' ')) {
      const parts = rawTarget.split(' ');
      return `Từ ghép tiếng Việt gồm ${parts.length} tiếng (${parts.map(p => `${p.length} chữ`).join(' + ')})`;
    }
    return `Từ vựng tiếng Việt ${targetWord.length} chữ cái`;
  }, [isInfinity, targetWord, rawTarget, isPhraseMode, isSynonymMode, isAntonymMode, isNasaMode, isAcademicDefMode]);

  // Helper to extract debrief knowledge for answered word
  const getKnowledgeForWord = useCallback((word: string, skipped = false): IWordDebriefData => {
    // Check Curated Dictionary
    const foundDict = CURATED_DICTIONARY.find(d => d.word.toUpperCase() === word);
    if (foundDict) {
      return {
        word: foundDict.word,
        partOfSpeech: foundDict.partOfSpeech,
        viMeaning: foundDict.viMeaning,
        definition: foundDict.definition,
        example: foundDict.example || `The concept of "${foundDict.word}" is central to cognitive science.`,
        synonyms: foundDict.synonyms,
        wasSkipped: skipped
      };
    }
    // Check Bilingual Pairs
    const foundBi = BILINGUAL_WORD_PAIRS.find(b => b.en.toUpperCase() === word || b.vi.replace(/\s+/g, '').toUpperCase() === word);
    if (foundBi) {
      return {
        word: foundBi.en,
        partOfSpeech: 'Từ vựng song ngữ',
        viMeaning: foundBi.vi,
        definition: `Thuật ngữ thuộc chủ đề ${foundBi.category}`,
        wasSkipped: skipped
      };
    }
    // Check Synonyms
    const syn = SYNONYM_PAIRS.find(s => s.wordA.toUpperCase() === word || s.wordB.toUpperCase() === word);
    if (syn) {
      return {
        word,
        partOfSpeech: 'Từ đồng nghĩa (Synonym)',
        viMeaning: syn.commonMeaning,
        definition: `Đồng nghĩa với từ "${syn.wordA === word ? syn.wordB : syn.wordA}"`,
        wasSkipped: skipped
      };
    }
    // Check Vietnamese Knowledge
    const viK = VIETNAMESE_WORD_KNOWLEDGE[word] || VIETNAMESE_WORD_KNOWLEDGE[rawTarget];
    if (viK) {
      return {
        word: viK.word,
        partOfSpeech: viK.partOfSpeech,
        viMeaning: viK.definition,
        definition: viK.definition,
        example: viK.example,
        wasSkipped: skipped
      };
    }
    return {
      word,
      partOfSpeech: 'Từ vựng',
      viMeaning: currentClue || 'Từ vựng rèn luyện nhận thức',
      wasSkipped: skipped
    };
  }, [currentClue, rawTarget]);

  // Round Initialization
  const setupRound = useCallback((word: string) => {
    const data = generateAnagram(word);
    let chars = [...data.scrambled];

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
    setRoundCountdown(initialTimeLimit);
    setHintsUsedInRound(0);
    setRoundFails(0);
    setIsShakeError(false);
    setIsSubmitting(false);
    setWordDebrief(null);
  }, [isDistractorMode, initialTimeLimit]);

  // Initial and Round change effect
  useEffect(() => {
    if (isFinished) return;
    setupRound(targetWord);
  }, [currentIndex, targetWord, reviewIndex, isReviewPhase, isFinished, setupRound]);

  // Overall Session Elapsed Timer
  useEffect(() => {
    if (isFinished || isGamePaused || wordDebrief) return;
    const timer = setInterval(() => setTotalElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isFinished, isGamePaused, wordDebrief]);

  // Advance to next word or trigger review / finish
  const advanceNextStep = useCallback(() => {
    setWordDebrief(null);

    if (isReviewPhase) {
      // In Spaced Review
      if (reviewIndex + 1 < missedQueue.length) {
        setReviewIndex(i => i + 1);
      } else {
        // Completed all review words!
        setIsFinished(true);
      }
    } else {
      // In Regular Rounds
      if (round >= maxRounds) {
        if (missedQueue.length > 0) {
          // Switch to Spaced Review Phase
          setIsReviewPhase(true);
          setReviewIndex(0);
          playSound('victory');
        } else {
          // All perfect execution, finish game!
          setIsFinished(true);
        }
      } else {
        setRound(r => r + 1);
        setCurrentIndex(i => i + 1);
      }
    }
  }, [isReviewPhase, reviewIndex, missedQueue, round, maxRounds, playSound]);

  // Auto-advance timer when debrief card is shown (3.5s)
  useEffect(() => {
    if (!wordDebrief || isFinished) return;
    const timer = setTimeout(() => {
      advanceNextStep();
    }, 3800);
    return () => clearTimeout(timer);
  }, [wordDebrief, isFinished, advanceNextStep]);

  // Escape Hatch: Skip & Reveal Word
  const handleRevealAndSkip = useCallback(() => {
    if (isFinished || wordDebrief) return;
    playSound('wrong');
    setMissCount(m => m + 1);

    // Queue missed word for end-of-session review if not already queued
    setMissedQueue(prev => {
      if (!prev.some(item => item.clean === targetWord)) {
        return [...prev, { raw: rawTarget, clean: targetWord }];
      }
      return prev;
    });

    // Populate all answer slots with target word
    setSelectedLetters(targetWord.split(''));
    setAvailableTiles(prev => prev.map(t => ({ ...t, used: true })));

    trackWrongAnswer({
      round,
      difficultyLevel: sessionLevel || 1,
      sessionId: `anagram-${Date.now()}`,
      responseTimeMs: Math.min(15000, Date.now() - lastWordTimeRef.current),
      questionContext: { prompt: `Đảo ngữ từ: ${targetWord} (Chủ đề: ${selectedTheme})` },
      correctAnswer: { label: targetWord, code: targetWord },
      userAnswer: { label: 'BỎ QUA / KẸT TỪ', code: 'SKIPPED' }
    });

    emitTrialEvent({
      exerciseSlug: 'anagram',
      level: sessionLevel || 1,
      relationId: 'PART_WHOLE',
      relationWeight: 1.0,
      entities: { target: targetWord, skipped: true },
      stateBefore: `round:${round}`,
      stateAfter: `round:${round}`,
      responseMs: Math.min(15000, Date.now() - lastWordTimeRef.current),
      correct: false
    });

    // Display debrief card marked as skipped so user learns the word
    setWordDebrief(getKnowledgeForWord(targetWord, true));
  }, [isFinished, wordDebrief, playSound, targetWord, rawTarget, trackWrongAnswer, round, sessionLevel, selectedTheme, emitTrialEvent, getKnowledgeForWord]);

  // Round Countdown Timer
  useEffect(() => {
    if (isFinished || isGamePaused || wordDebrief) return;
    const interval = setInterval(() => {
      setRoundCountdown(t => {
        if (t <= 1) {
          handleRevealAndSkip();
          return initialTimeLimit;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished, isGamePaused, wordDebrief, initialTimeLimit, handleRevealAndSkip]);

  // Handle Tile Click / Selection
  const handleTileClick = useCallback((tileId: number, char: string) => {
    if (isSubmitting || wordDebrief || isFinished || isGamePaused) return;
    if (selectedLetters.length >= targetWord.length) return;

    playSound('click');
    setAvailableTiles(prev => prev.map(t => t.id === tileId ? { ...t, used: true } : t));
    const nextSelected = [...selectedLetters, char];
    setSelectedLetters(nextSelected);

    // Check if word formation complete
    if (nextSelected.length === targetWord.length) {
      setIsSubmitting(true);
      const formedWord = nextSelected.join('').toUpperCase();
      const targetClean = targetWord.toUpperCase();

      // Check both exact target and valid dictionary anagram isomers using the same letter multiset
      const isSameMultiset = (a: string, b: string) => a.split('').sort().join('') === b.split('').sort().join('');
      const isExactMatch = formedWord === targetClean;
      const isAnagramIsomer = validAnagramDictionary.has(formedWord) && isSameMultiset(formedWord, targetClean);
      const isCorrect = isExactMatch || isAnagramIsomer;

      const now = Date.now();
      const respMs = Math.min(15000, Math.max(100, now - lastWordTimeRef.current));
      lastWordTimeRef.current = now;

      emitTrialEvent({
        exerciseSlug: 'anagram',
        level: sessionLevel || 1,
        relationId: 'PART_WHOLE',
        relationWeight: 1.0,
        entities: {
          target: targetClean,
          formed: formedWord,
          isIsomer: Boolean(isAnagramIsomer && !isExactMatch),
          theme: selectedTheme
        },
        stateBefore: `round:${round}`,
        stateAfter: isCorrect ? `round:${round + 1}` : `round:${round}`,
        responseMs: respMs,
        correct: isCorrect
      });

      if (isCorrect) {
        playSound('correct');
        // Normalized score: max 1200 points per game, scaling nicely with speed
        const speedBonus = Math.round((roundCountdown / initialTimeLimit) * 40);
        const baseScore = Math.round(90 * Math.min(10, Math.max(1, sessionLevel || 1)));
        const roundPoints = Math.min(250, baseScore + speedBonus);
        setScoreAcc(s => s + roundPoints);

        // Show Educational Debrief Flashcard
        setWordDebrief(getKnowledgeForWord(formedWord, false));
        setIsSubmitting(false);
      } else {
        playSound('wrong');
        setIsShakeError(true);
        setMissCount(m => m + 1);
        setRoundFails(f => f + 1);

        trackWrongAnswer({
          round,
          difficultyLevel: sessionLevel || 1,
          sessionId: `anagram-${Date.now()}`,
          responseTimeMs: respMs,
          questionContext: { prompt: `Đảo ngữ từ: ${targetClean} (Chủ đề: ${selectedTheme})` },
          correctAnswer: { label: targetClean, code: targetClean },
          userAnswer: { label: formedWord, code: formedWord }
        });

        // Soft reset after 550ms shake animation without freezing input races
        setTimeout(() => {
          setIsShakeError(false);
          setIsSubmitting(false);
          setSelectedLetters([]);
          setAvailableTiles(prev => prev.map(t => ({ ...t, used: false })));
        }, 550);
      }
    }
  }, [
    isSubmitting, wordDebrief, isFinished, isGamePaused, selectedLetters, targetWord, 
    playSound, validAnagramDictionary, sessionLevel, selectedTheme, round, emitTrialEvent, 
    roundCountdown, initialTimeLimit, getKnowledgeForWord, trackWrongAnswer
  ]);

  // Interactive Letter Unselect (Gỡ từng chữ đã ghép)
  const handleUnselectSlot = useCallback((index: number) => {
    if (isSubmitting || wordDebrief || isFinished || isGamePaused) return;
    const charToRemove = selectedLetters[index];
    if (!charToRemove) return;

    playSound('click');
    const updatedSelected = selectedLetters.filter((_, i) => i !== index);
    setSelectedLetters(updatedSelected);

    // Free the matching used tile in availableTiles
    setAvailableTiles(prev => {
      let freed = false;
      const reversed = [...prev].reverse().map(t => {
        if (!freed && t.used && t.char === charToRemove) {
          freed = true;
          return { ...t, used: false };
        }
        return t;
      });
      return reversed.reverse();
    });
  }, [isSubmitting, wordDebrief, isFinished, isGamePaused, selectedLetters, playSound]);

  // Reset entire current word
  const handleResetCurrent = () => {
    if (isSubmitting || wordDebrief) return;
    playSound('click');
    setSelectedLetters([]);
    setAvailableTiles(prev => prev.map(t => ({ ...t, used: false })));
  };

  // Use Hint (Mở khóa 1 ký tự)
  const handleUseHint = () => {
    if (!isHintAllowed || hintsUsedInRound >= 2 || selectedLetters.length >= targetWord.length) return;
    const nextTargetChar = targetWord[selectedLetters.length];
    const availableTile = availableTiles.find(t => !t.used && t.char === nextTargetChar);
    if (availableTile) {
      playSound('click');
      setHintsUsedInRound(h => h + 1);
      setScoreAcc(s => Math.max(0, s - 20));
      handleTileClick(availableTile.id, availableTile.char);
    }
  };

  // Keyboard navigation & typing listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || isGamePaused) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Advance debrief on Enter or Space
      if (wordDebrief) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          advanceNextStep();
        }
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (selectedLetters.length > 0) {
          handleUnselectSlot(selectedLetters.length - 1);
        }
        return;
      }

      // Letter typing
      const keyUpper = e.key.toUpperCase();
      const matchTile = availableTiles.find(t => !t.used && t.char === keyUpper);
      if (matchTile && selectedLetters.length < targetWord.length) {
        e.preventDefault();
        handleTileClick(matchTile.id, matchTile.char);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, isGamePaused, wordDebrief, selectedLetters, availableTiles, targetWord, advanceNextStep, handleUnselectSlot, handleTileClick]);

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-6 animate-fade-in pb-24 relative">
      
      {/* Spaced Review Phase Notice Banner */}
      {isReviewPhase && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-brand-500/20 border-2 border-amber-400 text-amber-900 dark:text-amber-100 flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">
                🎯 VÒNG CỦNG CỐ NHẬN THỨC
              </span>
              <p className="text-xs font-semibold">
                Ôn luyện lại các từ chưa vượt qua: Từ {reviewIndex + 1}/{missedQueue.length}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-sm">
            Củng cố trí nhớ
          </span>
        </div>
      )}

      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm text-slate-500 font-semibold">Điểm số</span>
            {isCustom ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300">
                TÙY CHỈNH
              </span>
            ) : isInfinity ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center gap-1">
                <InfinityIcon className="w-3 h-3" />
                {getInfinityLabel(sessionLevel)}
              </span>
            ) : (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200">
                CẤP {sessionLevel}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {scoreAcc}
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">
            {isReviewPhase ? 'Ôn từ' : 'Vòng'}
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">
            {isReviewPhase ? `${reviewIndex + 1}/${missedQueue.length}` : `${round}/${maxRounds}`}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs sm:text-sm text-slate-500 font-semibold">Thời gian</span>
            <div className={`text-2xl sm:text-3xl font-black mt-0.5 ${roundCountdown <= 10 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`}>
              {roundCountdown}s
            </div>
          </div>
          {/* Dedicated Pause Toggle Button */}
          <button
            onClick={() => setIsGamePaused(!isGamePaused)}
            aria-label={isGamePaused ? 'Tiếp tục' : 'Tạm dừng'}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 transition-all active:scale-95 shadow-sm"
          >
            {isGamePaused ? <Play className="w-5 h-5 text-emerald-500" /> : <Pause className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Distractor Warning Banner */}
      {isDistractorMode && (
        <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2 text-xs font-black animate-pulse">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>BẪY TẬP TRUNG: CÓ 2 CHỮ CÁI BẪY KHÔNG THUỘC VỀ TỪ CẦN GHÉP!</span>
        </div>
      )}

      {/* Clue Card */}
      {currentClue && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 flex items-start gap-3 shadow-sm animate-fade-in">
          <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider block">
              Gợi Ý Nghĩa & Ngữ Cảnh
            </span>
            <div className="text-xs sm:text-sm font-black text-purple-900 dark:text-purple-200">
              {currentClue}
            </div>
            {datamuseAssociations.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                <span className="text-indigo-500">🌐 Liên tưởng:</span>
                {datamuseAssociations.map((w, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 font-mono text-[10px] text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Answer Slots Display */}
      <div className={`bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border-2 shadow-lg flex flex-col items-center justify-center min-h-[160px] space-y-4 transition-all ${
        isShakeError ? 'border-rose-500 animate-shake' : 'border-slate-200 dark:border-slate-700'
      }`}>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {isInfinity ? 'TỪ VỰNG TIẾNG ANH ĐANG GHÉP' : 'TỪ ĐANG GHÉP'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              (Gõ phím hoặc nhấp chữ để gỡ)
            </span>
          </div>

          {rawTarget.includes(' ') && (
            <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/40 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
              Từ ghép đa âm tiết ({rawTarget.split(' ').map(s => `${s.length} chữ`).join(' + ')})
            </span>
          )}

          {isInfinity && targetWord.length >= 6 && (
            <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-3.5 py-1 rounded-full border border-brand-200 dark:border-brand-800 shadow-sm animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>Bắt đầu: <strong className="font-mono font-black text-sm text-brand-700 dark:text-brand-300">'{targetWord[0]}'</strong></span>
              {targetWord.length >= 8 && (
                <span className="text-slate-400">| Kết thúc: <strong className="font-mono font-black text-sm text-brand-700 dark:text-brand-300">'{targetWord[targetWord.length - 1]}'</strong></span>
              )}
            </div>
          )}
        </div>

        {/* Answer Slots: Click to remove/unselect individual letter */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {Array.from({ length: targetWord.length }).map((_, idx) => {
            const letter = selectedLetters[idx];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleUnselectSlot(idx)}
                title={letter ? "Bấm vào để gỡ ký tự này" : undefined}
                className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 flex items-center justify-center font-mono font-black text-2xl sm:text-3xl transition-all shadow-sm ${
                  letter
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 scale-105 cursor-pointer hover:border-rose-400 hover:text-rose-600'
                    : 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50 cursor-default'
                }`}
              >
                {letter || ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Letter Tiles */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 pt-2">
        {availableTiles.map((tile) => (
          <button
            key={tile.id}
            disabled={tile.used || isSubmitting || Boolean(wordDebrief)}
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

      {/* Controls: Reset + Interactive Hint + Escape Hatch Button */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={handleResetCurrent}
          disabled={selectedLetters.length === 0 || isSubmitting}
          className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Xếp lại chữ cái
        </button>

        {isHintAllowed && (
          <button
            onClick={handleUseHint}
            disabled={hintsUsedInRound >= 2 || selectedLetters.length >= targetWord.length || isSubmitting}
            className={`px-4 py-2.5 text-xs font-black flex items-center gap-1.5 rounded-xl border transition-all shadow-sm ${
              hintsUsedInRound >= 2 || selectedLetters.length >= targetWord.length || isSubmitting
                ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400'
                : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:scale-105 active:scale-95'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Mở khóa 1 ký tự ({2 - hintsUsedInRound}/2)</span>
          </button>
        )}

        {/* Escape Hatch: Reveal & Skip (Never get stuck!) */}
        {(roundFails >= 2 || roundCountdown <= 15) && (
          <button
            onClick={handleRevealAndSkip}
            className="px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all animate-pulse"
          >
            <Eye className="w-3.5 h-3.5 text-rose-500" />
            <span>Xem đáp án & Bỏ qua</span>
          </button>
        )}
      </div>

      {/* Educational Knowledge Debrief Card (Solves: Chơi xong có kiến thức) */}
      {wordDebrief && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-brand-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {wordDebrief.wasSkipped ? (
                  <span className="p-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600">
                    <XCircle className="w-5 h-5" />
                  </span>
                ) : (
                  <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                )}
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {wordDebrief.wasSkipped ? 'Đáp Án Chi Tiết' : 'Chính Xác! Kiến Thức Từ Vựng'}
                </span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200">
                {wordDebrief.partOfSpeech || 'Từ vựng'}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-brand-700 dark:text-brand-300 font-mono tracking-wide">
                {wordDebrief.word}
              </h3>
              {wordDebrief.viMeaning && (
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {wordDebrief.viMeaning}
                </p>
              )}
              {wordDebrief.definition && wordDebrief.definition !== wordDebrief.viMeaning && (
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                  "{wordDebrief.definition}"
                </p>
              )}
              {wordDebrief.example && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-500 block mb-0.5">Ví dụ câu:</span>
                  {wordDebrief.example}
                </div>
              )}
              {wordDebrief.synonyms && wordDebrief.synonyms.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs text-slate-500">
                  <span className="font-bold">Đồng nghĩa:</span>
                  {wordDebrief.synonyms.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={advanceNextStep}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
            >
              <span>Tiếp tục từ tiếp theo</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/25">Enter ↵</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Paused Overlay */}
      {isGamePaused && (
        <div className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white space-y-4 animate-fade-in">
          <Pause className="w-14 h-14 text-amber-400 animate-pulse" />
          <h3 className="text-2xl font-black">Đang Tạm Dừng</h3>
          <p className="text-xs text-slate-300 max-w-xs text-center">
            Thời gian và tiến độ đã được giữ nguyên. Nhấp "Tiếp tục" hoặc nhấn Space để rèn luyện tiếp.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsGamePaused(false)}
              className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 font-black text-white shadow-lg active:scale-95 transition-all"
            >
              Tiếp tục
            </button>
            <button
              onClick={() => {
                setIsGamePaused(false);
                setActiveGameSlug(null);
              }}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 font-bold text-slate-300 hover:text-white active:scale-95 transition-all"
            >
              Thoát bài tập
            </button>
          </div>
        </div>
      )}

      {/* Game Result Modal (Frozen background prevents level promotion leak behind modal) */}
      {isFinished && (
        <GameResultModal
          score={scoreAcc}
          accuracyRate={Math.max(10, Math.round((maxRounds / (maxRounds + missCount)) * 100))}
          timeSpentSec={totalElapsedSec}
          playedLevel={sessionLevel || 1}
          isCustom={isCustom}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            setScoreAcc(0);
            setRound(1);
            setMissCount(0);
            setTotalElapsedSec(0);
            setMissedQueue([]);
            setIsReviewPhase(false);
            setReviewIndex(0);
            setIsFinished(false);
            setCurrentIndex(i => i + 1);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
