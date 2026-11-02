import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useExerciseSessionConfig } from '../../hooks/useExerciseSessionConfig';
import { GameResultModal } from './GameResultModal';
import { 
  generateTwinWords, 
  VIETNAMESE_WORDS_DICTIONARY, 
  INFINITY_ROMAN_NUMERALS, 
  getInfinityTier, 
  getInfinityLabel,
  EXERCISES_METADATA,
  VIETNAMESE_SINGLE_SYLLABLE_PAIRS,
  VIETNAMESE_CONFUSABLE_PAIRS,
  VIETNAMESE_SENTENCE_PAIRS,
  VIETNAMESE_CONTEXTUAL_PAIRS,
  ITwinWordConfusablePair,
  ITwinWordSinglePair,
  ITwinWordSentencePair,
  ITwinWordContextualPair
} from '@brain-exercises/shared';
import { useRelationSession } from '../../hooks/useRelationSession';
import { readingContentService, THEMED_VOCABULARY } from '../../services/readingContentService';
import { 
  BILINGUAL_WORD_PAIRS, 
  CURATED_DICTIONARY,
  SYNONYM_PAIRS,
  ANTONYM_PAIRS,
  EMOJI_WORD_PAIRS,
  FALSE_FRIENDS,
  POS_TRIADS,
  GEOGRAPHY_TRIADS,
  PERIODIC_TABLE_TRIADS
} from '../../services/infinityApiService';
import { 
  Infinity as InfinityIcon, 
  Sparkles, 
  Pause, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  BookOpen, 
  HelpCircle,
  Eye,
  Info,
  Layers,
  ArrowRight,
  RotateCcw,
  X,
  Filter
} from 'lucide-react';

interface IPairItem {
  word1: string;
  word2: string;
  isMatch: boolean;
  diffHighlight?: string;
  correctWord?: string;
  note?: string;
  exampleSentence?: string;
  isSentenceMode?: boolean;
  isMirrorMode?: boolean;
  contextSentence?: string;
}

interface ITrialHistoryItem {
  round: number;
  word1: string;
  word2: string;
  isMatch: boolean;
  userChoice: boolean;
  isCorrect: boolean;
  note?: string;
  exampleSentence?: string;
  correctWord?: string;
  diffHighlight?: string;
  responseMs: number;
}

export const TwinWordsGame: React.FC = () => {
  const { 
    getExerciseLevel, 
    setActiveGameSlug, 
    playSound, 
    isGamePaused, 
    setIsGamePaused, 
    ladderSessionRounds 
  } = useAppStore();
  const { sessionConfig, isCustom } = useExerciseSessionConfig('twin-words');
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  
  const lastChoiceTimeRef = useRef<number>(Date.now());
  const storeLevel = getExerciseLevel('twin-words') || 1;
  const playedLevelRef = useRef<number>(isCustom ? 0 : storeLevel);
  const currentLevel = isCustom ? 0 : playedLevelRef.current;
  const isInfinity = !isCustom && currentLevel >= 13;

  // Exercise Metadata for level configs
  const exerciseMeta = useMemo(() => EXERCISES_METADATA.find(e => e.slug === 'twin-words'), []);
  const levelConfig = useMemo(() => {
    return exerciseMeta?.levelConfigs.find(c => c.level === currentLevel) || exerciseMeta?.levelConfigs[0];
  }, [exerciseMeta, currentLevel]);

  // Round count based on ladderSessionRounds or sessionConfig
  const maxRounds = useMemo(() => {
    if (isCustom && sessionConfig.rounds && sessionConfig.rounds > 0) {
      return sessionConfig.rounds;
    }
    if (ladderSessionRounds && ladderSessionRounds > 0) {
      return ladderSessionRounds;
    }
    return currentLevel >= 22 ? 20 : currentLevel >= 13 ? 15 : currentLevel >= 9 ? 12 : 10;
  }, [isCustom, sessionConfig.rounds, ladderSessionRounds, currentLevel]);

  // Time limit based on levelConfig or sessionConfig (Countdown)
  const initialTimeLimit = useMemo(() => {
    if (isCustom && sessionConfig.timeLimitSec && sessionConfig.timeLimitSec > 0) {
      return sessionConfig.timeLimitSec;
    }
    return levelConfig?.timeLimitSec || 40;
  }, [isCustom, sessionConfig.timeLimitSec, levelConfig]);

  const [round, setRound] = useState(1);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(initialTimeLimit);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showWords, setShowWords] = useState(true);
  const [isErrorFlash, setIsErrorFlash] = useState(false);

  // Immediate learning feedback state
  const [feedback, setFeedback] = useState<{
    show: boolean;
    userChoice: boolean;
    isCorrect: boolean;
    note?: string;
  } | null>(null);

  // Debrief modal state for post-game knowledge retention
  const [showDebriefModal, setShowDebriefModal] = useState(false);
  const [debriefFilter, setDebriefFilter] = useState<'all' | 'missed'>('all');
  const [trialsHistory, setTrialsHistory] = useState<ITrialHistoryItem[]>([]);

  // Themes
  const themes = ['Tất cả', 'Khoa Học Não Bộ', 'Công Nghệ & AI', 'Thiên Văn & Vũ Trụ', 'Tâm Lý & Tư Duy'];
  const [selectedTheme, setSelectedTheme] = useState<string>('Tất cả');

  const combinedDict = useMemo(() => {
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
    const sanitized = Array.from(new Set(merged.map(w => w.toUpperCase())));
    return sanitized.length > 0 ? sanitized : ['TRÍ TUỆ', 'NÃO BỘ', 'PHẢN XẠ', 'THỊ GIÁC'];
  }, [selectedTheme, currentLevel]);

  // Current Pair State
  const [pair, setPair] = useState<IPairItem>(() => {
    const initPair = VIETNAMESE_SINGLE_SYLLABLE_PAIRS[0];
    return {
      word1: initPair.wordA,
      word2: initPair.wordB,
      isMatch: initPair.isMatch,
      note: initPair.meaningA,
      correctWord: initPair.wordA
    };
  });

  const [subLabels, setSubLabels] = useState<{ labelA?: string; labelB?: string; prompt?: string }>({});

  // Generate pair according to the strict pedagogical curriculum of the level
  const generatePairForLevel = useCallback((dict = combinedDict): IPairItem => {
    const shouldMatch = Math.random() < 0.5;

    // CẤP 1: TỪ ĐƠN ÂM TIẾNG VIỆT (100% Single Syllable Words: NÃO, BÃO, SÁCH, BÁCH, MẮT, MẶT,...)
    if (currentLevel === 1) {
      const candidates = VIETNAMESE_SINGLE_SYLLABLE_PAIRS.filter(p => p.isMatch === shouldMatch);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)] || VIETNAMESE_SINGLE_SYLLABLE_PAIRS[0];
      setSubLabels({
        labelA: 'TỪ ĐƠN ÂM 1',
        labelB: 'TỪ ĐƠN ÂM 2',
        prompt: 'Từ đơn âm: Hai từ có HOÀN TOÀN TRÙNG KHỚP từng chữ cái?'
      });
      return {
        word1: chosen.wordA,
        word2: chosen.wordB,
        isMatch: chosen.isMatch,
        diffHighlight: chosen.diffChar,
        note: chosen.isMatch ? chosen.meaningA : `${chosen.meaningA} vs ${chosen.meaningB}`,
        correctWord: chosen.wordA
      };
    }

    // CẤP 2-3: TỪ GHÉP TIẾNG VIỆT CƠ BẢN (2 tiếng có nghĩa & dấu cách chuẩn)
    if (currentLevel >= 2 && currentLevel <= 3) {
      if (shouldMatch) {
        const randWord = dict[Math.floor(Math.random() * dict.length)] || 'TRÍ TUỆ';
        setSubLabels({ labelA: 'TỪ GHÉP 1', labelB: 'TỪ GHÉP 2', prompt: 'So sánh chớp nhoáng: Hai từ ghép có giống nhau?' });
        return {
          word1: randWord,
          word2: randWord,
          isMatch: true,
          note: 'Hai từ ghép trùng khớp hoàn toàn.',
          correctWord: randWord
        };
      } else {
        const confusableCandidates = VIETNAMESE_CONFUSABLE_PAIRS.slice(0, 8);
        const chosen = confusableCandidates[Math.floor(Math.random() * confusableCandidates.length)];
        setSubLabels({ labelA: 'TỪ GHÉP 1', labelB: 'TỪ GHÉP 2', prompt: 'So sánh chớp nhoáng: Hai từ ghép có giống nhau?' });
        return {
          word1: chosen.correct,
          word2: chosen.confusable,
          isMatch: false,
          diffHighlight: `${chosen.correct} ≠ ${chosen.confusable}`,
          correctWord: chosen.correct,
          note: chosen.note,
          exampleSentence: chosen.exampleSentence
        };
      }
    }

    // CẤP 4-8: BỘ CẶP TỪ DỄ SAI CHÍNH TẢ & PHÂN BIỆT TỪ VỰNG KINH ĐIỂN
    if (currentLevel >= 4 && currentLevel <= 8) {
      const confusable = VIETNAMESE_CONFUSABLE_PAIRS[Math.floor(Math.random() * VIETNAMESE_CONFUSABLE_PAIRS.length)];
      setSubLabels({
        labelA: 'TỪ VỰNG A',
        labelB: 'TỪ VỰNG B',
        prompt: 'Phân biệt chính tả tiếng Việt: Hai từ có TRÙNG KHỚP HOÀN TOÀN?'
      });

      if (shouldMatch) {
        const word = Math.random() < 0.7 ? confusable.correct : confusable.confusable;
        return {
          word1: word,
          word2: word,
          isMatch: true,
          correctWord: confusable.correct,
          note: `Từ chuẩn: ${confusable.correct}. ${confusable.note}`,
          exampleSentence: confusable.exampleSentence
        };
      } else {
        return {
          word1: confusable.correct,
          word2: confusable.confusable,
          isMatch: false,
          diffHighlight: `${confusable.correct} ≠ ${confusable.confusable}`,
          correctWord: confusable.correct,
          note: confusable.note,
          exampleSentence: confusable.exampleSentence
        };
      }
    }

    // CẤP 9: TRIPLE_WORDS / TACHISTOSCOPIC FLASH 600ms
    if (currentLevel === 9) {
      const confusable = VIETNAMESE_CONFUSABLE_PAIRS[Math.floor(Math.random() * VIETNAMESE_CONFUSABLE_PAIRS.length)];
      setSubLabels({
        labelA: 'CHỚP NHANH 600ms',
        labelB: 'CHỚP NHANH 600ms',
        prompt: '⚡ Chớp sáng 600ms: Quét nhanh hai từ có giống nhau?'
      });
      if (shouldMatch) {
        return {
          word1: confusable.correct,
          word2: confusable.correct,
          isMatch: true,
          correctWord: confusable.correct,
          note: confusable.note
        };
      } else {
        return {
          word1: confusable.correct,
          word2: confusable.confusable,
          isMatch: false,
          diffHighlight: `${confusable.correct} ≠ ${confusable.confusable}`,
          correctWord: confusable.correct,
          note: confusable.note
        };
      }
    }

    // CẤP 10: SENTENCE_TWINS (So Khớp Hai Câu Ngắn 5-8 từ)
    if (currentLevel === 10) {
      const candidates = VIETNAMESE_SENTENCE_PAIRS.filter(s => s.isMatch === shouldMatch);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)] || VIETNAMESE_SENTENCE_PAIRS[0];
      setSubLabels({
        labelA: 'CÂU VĂN 1',
        labelB: 'CÂU VĂN 2',
        prompt: '📖 So khớp câu ngắn: Hai câu văn có HOÀN TOÀN TRÙNG KHỚP từng chữ?'
      });
      return {
        word1: chosen.sentenceA,
        word2: chosen.sentenceB,
        isMatch: chosen.isMatch,
        diffHighlight: chosen.diffWord,
        note: chosen.note || (chosen.isMatch ? 'Hai câu văn trùng khớp tuyệt đối từng từ.' : 'Có sự sai lệch từ ngữ giữa hai câu.'),
        isSentenceMode: true
      };
    }

    // CẤP 11: MIRROR_WORDS (Từ Phản Chiếu Gương)
    if (currentLevel === 11) {
      const confusable = VIETNAMESE_CONFUSABLE_PAIRS[Math.floor(Math.random() * VIETNAMESE_CONFUSABLE_PAIRS.length)];
      setSubLabels({
        labelA: 'CHUỖI CHUẨN',
        labelB: 'PHẢN CHIẾU GƯƠNG',
        prompt: '🪞 Nhận diện không gian gương: Từ thứ hai có phải là ảnh phản chiếu của từ thứ nhất?'
      });
      const target = confusable.correct;
      if (shouldMatch) {
        return {
          word1: target,
          word2: target,
          isMatch: true,
          isMirrorMode: true,
          correctWord: target,
          note: 'Hình ảnh phản chiếu gương hoàn toàn khớp đối xứng.'
        };
      } else {
        return {
          word1: target,
          word2: confusable.confusable,
          isMatch: false,
          isMirrorMode: true,
          diffHighlight: `${target} ≠ ${confusable.confusable}`,
          correctWord: target,
          note: `Không khớp phản chiếu: Một bên là "${target}", một bên là "${confusable.confusable}".`
        };
      }
    }

    // CẤP 12: CONTEXTUAL_TWINS (Phân Biệt Ngữ Nghĩa Ngữ Cảnh)
    if (currentLevel === 12) {
      const candidates = VIETNAMESE_CONTEXTUAL_PAIRS.filter(c => c.isMatch === shouldMatch);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)] || VIETNAMESE_CONTEXTUAL_PAIRS[0];
      setSubLabels({
        labelA: 'TỪ CHỌN A',
        labelB: 'TỪ CHỌN B',
        prompt: '🎯 Ngữ cảnh câu: Hai phương án điền khuyết có ĐỒNG NHẤT Ý NGHĨA?'
      });
      return {
        word1: chosen.optionA,
        word2: chosen.optionB,
        isMatch: chosen.isMatch,
        correctWord: chosen.correctWord,
        contextSentence: chosen.contextSentence,
        note: chosen.explanation
      };
    }

    // CẤP 13 (∞-I): English Curated Exact vs Typo
    if (currentLevel === 13) {
      const entry = CURATED_DICTIONARY[Math.floor(Math.random() * CURATED_DICTIONARY.length)];
      const target = entry.word.toUpperCase();
      setSubLabels({ labelA: 'ENGLISH WORD 1', labelB: 'ENGLISH WORD 2', prompt: 'Hai từ tiếng Anh có HOÀN TOÀN TRÙNG KHỚP từng chữ cái?' });
      if (shouldMatch) {
        return { word1: target, word2: target, isMatch: true, note: `Nghĩa: ${entry.viMeaning || 'Thuộc từ điển cao cấp'}` };
      } else {
        const pos = Math.floor(Math.random() * target.length);
        const mutated = target.substring(0, pos) + (target[pos] === 'A' ? 'O' : 'E') + target.substring(pos + 1);
        return {
          word1: target,
          word2: mutated,
          isMatch: false,
          diffHighlight: `${target} ≠ ${mutated}`,
          note: `Đúng: ${target}. Đã bị thay đổi ký tự tại vị trí ${pos + 1}.`
        };
      }
    }

    // CẤP 14 (∞-II): Cross-Language Semantic Translation (VI vs EN)
    if (currentLevel === 14) {
      const pairItem = BILINGUAL_WORD_PAIRS[Math.floor(Math.random() * BILINGUAL_WORD_PAIRS.length)];
      setSubLabels({ labelA: 'TIẾNG VIỆT', labelB: 'TIẾNG ANH', prompt: 'Từ Tiếng Việt và Tiếng Anh có CÙNG NGHĨA DỊCH THUẬT không?' });
      if (shouldMatch) {
        return { word1: pairItem.vi.toUpperCase(), word2: pairItem.en.toUpperCase(), isMatch: true, note: `Dịch thuật chuẩn xác: ${pairItem.vi} = ${pairItem.en}` };
      } else {
        const other = BILINGUAL_WORD_PAIRS[(BILINGUAL_WORD_PAIRS.indexOf(pairItem) + 5) % BILINGUAL_WORD_PAIRS.length];
        return {
          word1: pairItem.vi.toUpperCase(),
          word2: other.en.toUpperCase(),
          isMatch: false,
          note: `${pairItem.vi} dịch là ${pairItem.en}, không phải ${other.en}.`
        };
      }
    }

    // CẤP 15 (∞-III): English Synonym Pairs
    if (currentLevel === 15) {
      const syn = SYNONYM_PAIRS[Math.floor(Math.random() * SYNONYM_PAIRS.length)];
      setSubLabels({ labelA: 'SYNONYM A', labelB: 'SYNONYM B', prompt: 'Hai từ này có phải TỪ ĐỒNG NGHĨA (Synonyms) trong Tiếng Anh?' });
      if (shouldMatch) {
        return { word1: syn.wordA.toUpperCase(), word2: syn.wordB.toUpperCase(), isMatch: true, note: `Đồng nghĩa: ${syn.wordA} ≈ ${syn.wordB}` };
      } else {
        const other = SYNONYM_PAIRS[(SYNONYM_PAIRS.indexOf(syn) + 3) % SYNONYM_PAIRS.length];
        return { word1: syn.wordA.toUpperCase(), word2: other.wordB.toUpperCase(), isMatch: false, note: `${syn.wordA} không đồng nghĩa với ${other.wordB}.` };
      }
    }

    // CẤP 16 (∞-IV): Antonyms
    if (currentLevel === 16) {
      const ant = ANTONYM_PAIRS[Math.floor(Math.random() * ANTONYM_PAIRS.length)];
      setSubLabels({ labelA: 'ANTONYM A', labelB: 'ANTONYM B', prompt: 'Hai từ này có phải CẶP TỪ TRÁI NGHĨA (Antonyms) không?' });
      if (shouldMatch) {
        return { word1: ant.wordA.toUpperCase(), word2: ant.wordB.toUpperCase(), isMatch: true, note: `Trái nghĩa: ${ant.wordA} ⟷ ${ant.wordB}` };
      } else {
        const other = ANTONYM_PAIRS[(ANTONYM_PAIRS.indexOf(ant) + 4) % ANTONYM_PAIRS.length];
        return { word1: ant.wordA.toUpperCase(), word2: other.wordB.toUpperCase(), isMatch: false, note: `${ant.wordA} không phải từ trái nghĩa của ${other.wordB}.` };
      }
    }

    // CẤP 17 (∞-V): Visual Emoji vs English Word
    if (currentLevel === 17) {
      const emo = EMOJI_WORD_PAIRS[Math.floor(Math.random() * EMOJI_WORD_PAIRS.length)];
      setSubLabels({ labelA: 'BIỂU TƯỢNG', labelB: 'TỪ TIẾNG ANH', prompt: 'Biểu tượng hình ảnh và từ vựng Tiếng Anh có TƯƠNG ĐỒNG Ý NGHĨA?' });
      if (shouldMatch) {
        return { word1: emo.emoji, word2: emo.word.toUpperCase(), isMatch: true, note: `Khớp biểu tượng: ${emo.emoji} biểu thị ${emo.word}.` };
      } else {
        const other = EMOJI_WORD_PAIRS[(EMOJI_WORD_PAIRS.indexOf(emo) + 6) % EMOJI_WORD_PAIRS.length];
        return { word1: emo.emoji, word2: other.word.toUpperCase(), isMatch: false, note: `${emo.emoji} biểu thị ${emo.word}, không phải ${other.word}.` };
      }
    }

    // CẤP 18 (∞-VI): False Friends / Lookalike Confusables
    if (currentLevel === 18) {
      const ff = FALSE_FRIENDS[Math.floor(Math.random() * FALSE_FRIENDS.length)];
      setSubLabels({ labelA: 'TỪ DỄ NHẦM LẪN 1', labelB: 'TỪ DỄ NHẦM LẪN 2', prompt: 'Phân biệt chính tả: Hai từ này có HOÀN TOÀN LÀ 1 TỪ DUY NHẤT?' });
      if (shouldMatch) {
        const pickWord = Math.random() < 0.5 ? ff.wordA : ff.wordB;
        return { word1: pickWord.toUpperCase(), word2: pickWord.toUpperCase(), isMatch: true, note: 'Trùng khớp chính tả.' };
      } else {
        return { word1: ff.wordA.toUpperCase(), word2: ff.wordB.toUpperCase(), isMatch: false, diffHighlight: `${ff.wordA} ≠ ${ff.wordB}`, note: `Hai từ khác nhau: ${ff.wordA} vs ${ff.wordB}.` };
      }
    }

    // CẤP 19 (∞-VII): Reverse String Identity
    if (currentLevel === 19) {
      const entry = CURATED_DICTIONARY[Math.floor(Math.random() * CURATED_DICTIONARY.length)];
      const target = entry.word.toUpperCase();
      const rev = target.split('').reverse().join('');
      setSubLabels({ labelA: 'CHUỖI XUÔI', labelB: 'CHUỖI ĐẢO NGƯỢC', prompt: 'Chuỗi 2 có phải là BẢN ĐẢO NGƯỢC KÝ TỰ CHÍNH XÁC của Chuỗi 1?' });
      if (shouldMatch) {
        return { word1: target, word2: rev, isMatch: true, note: 'Đảo ngược ký tự chuẩn xác.' };
      } else {
        const other = CURATED_DICTIONARY[(CURATED_DICTIONARY.indexOf(entry) + 4) % CURATED_DICTIONARY.length].word.toUpperCase();
        return { word1: target, word2: other.split('').reverse().join(''), isMatch: false, note: 'Không phải bản đảo ngược chính xác.' };
      }
    }

    // CẤP 20 (∞-VIII): Tachistoscopic Flash 220ms
    if (currentLevel === 20) {
      const entry = CURATED_DICTIONARY[Math.floor(Math.random() * CURATED_DICTIONARY.length)];
      const target = entry.word.toUpperCase();
      setSubLabels({ labelA: 'FLASH 220ms', labelB: 'FLASH 220ms', prompt: '⚡ Chớp sáng 220ms: Hai từ chớp lóe có giống nhau không?' });
      if (shouldMatch) {
        return { word1: target, word2: target, isMatch: true, note: 'Trùng khớp.' };
      } else {
        const other = CURATED_DICTIONARY[(CURATED_DICTIONARY.indexOf(entry) + 2) % CURATED_DICTIONARY.length].word.toUpperCase();
        return { word1: target, word2: other, isMatch: false, note: `${target} ≠ ${other}` };
      }
    }

    // CẤP 21 (∞-IX): Part of Speech Grammatical Compatibility
    if (currentLevel === 21) {
      const triad = POS_TRIADS[Math.floor(Math.random() * POS_TRIADS.length)];
      if (shouldMatch) {
        const otherTriad = POS_TRIADS[(POS_TRIADS.indexOf(triad) + 2) % POS_TRIADS.length];
        const category = (['noun', 'verb', 'adjective'] as const)[Math.floor(Math.random() * 3)];
        setSubLabels({ labelA: 'TỪ A', labelB: 'TỪ B', prompt: `Cả hai từ có CÙNG TỪ LOẠI (${category.toUpperCase()}) không?` });
        return { word1: triad[category].toUpperCase(), word2: otherTriad[category].toUpperCase(), isMatch: true, note: `Cùng từ loại: ${category}` };
      } else {
        setSubLabels({ labelA: 'TỪ A', labelB: 'TỪ B', prompt: 'Cả hai từ có CÙNG TỪ LOẠI (Danh từ / Động từ / Tính từ) không?' });
        return { word1: triad.noun.toUpperCase(), word2: triad.verb.toUpperCase(), isMatch: false, note: `${triad.noun} là Danh từ, ${triad.verb} là Động từ.` };
      }
    }

    // CẤP 22 (∞-X): Rapid Multi-Domain Cognitive Synthesis
    const randDomain = Math.floor(Math.random() * 6);
    if (randDomain === 0) {
      const bp = BILINGUAL_WORD_PAIRS[Math.floor(Math.random() * BILINGUAL_WORD_PAIRS.length)];
      setSubLabels({ labelA: 'VIỆT', labelB: 'ANH', prompt: 'Khớp nghĩa dịch thuật VI-EN?' });
      return { word1: bp.vi.toUpperCase(), word2: shouldMatch ? bp.en.toUpperCase() : 'COSMIC', isMatch: shouldMatch, note: `${bp.vi} = ${bp.en}` };
    } else if (randDomain === 1) {
      const geo = GEOGRAPHY_TRIADS[Math.floor(Math.random() * GEOGRAPHY_TRIADS.length)];
      const otherGeo = GEOGRAPHY_TRIADS[(GEOGRAPHY_TRIADS.indexOf(geo) + 3) % GEOGRAPHY_TRIADS.length];
      setSubLabels({ labelA: 'QUỐC GIA', labelB: 'THỦ ĐÔ', prompt: 'Thủ đô này có CHÍNH XÁC thuộc về Quốc gia hiển thị?' });
      return { word1: `${geo.flag} ${geo.country.toUpperCase()}`, word2: shouldMatch ? geo.capital.toUpperCase() : otherGeo.capital.toUpperCase(), isMatch: shouldMatch, note: `Thủ đô của ${geo.country} là ${geo.capital}.` };
    } else if (randDomain === 2) {
      const elem = PERIODIC_TABLE_TRIADS[Math.floor(Math.random() * PERIODIC_TABLE_TRIADS.length)];
      const otherElem = PERIODIC_TABLE_TRIADS[(PERIODIC_TABLE_TRIADS.indexOf(elem) + 4) % PERIODIC_TABLE_TRIADS.length];
      setSubLabels({ labelA: 'KÝ HIỆU HÓA HỌC', labelB: 'TÊN NGUYÊN TỐ', prompt: 'Ký hiệu hóa học có tương ứng với Nguyên tố?' });
      return { word1: elem.symbol, word2: shouldMatch ? elem.name.toUpperCase() : otherElem.name.toUpperCase(), isMatch: shouldMatch, note: `${elem.symbol} là ký hiệu của ${elem.name}.` };
    } else if (randDomain === 3) {
      const syn = SYNONYM_PAIRS[Math.floor(Math.random() * SYNONYM_PAIRS.length)];
      setSubLabels({ labelA: 'TỪ A', labelB: 'TỪ B', prompt: 'Đồng nghĩa (Synonyms)?' });
      return { word1: syn.wordA.toUpperCase(), word2: shouldMatch ? syn.wordB.toUpperCase() : 'RANDOM', isMatch: shouldMatch, note: `${syn.wordA} ≈ ${syn.wordB}` };
    } else if (randDomain === 4) {
      const ant = ANTONYM_PAIRS[Math.floor(Math.random() * ANTONYM_PAIRS.length)];
      setSubLabels({ labelA: 'TỪ A', labelB: 'TỪ B', prompt: 'Trái nghĩa (Antonyms)?' });
      return { word1: ant.wordA.toUpperCase(), word2: shouldMatch ? ant.wordB.toUpperCase() : 'HARMONY', isMatch: shouldMatch, note: `${ant.wordA} ⟷ ${ant.wordB}` };
    } else {
      const emo = EMOJI_WORD_PAIRS[Math.floor(Math.random() * EMOJI_WORD_PAIRS.length)];
      setSubLabels({ labelA: 'EMOJI', labelB: 'WORD', prompt: 'Biểu tượng khớp từ vựng?' });
      return { word1: emo.emoji, word2: shouldMatch ? emo.word.toUpperCase() : 'STORM', isMatch: shouldMatch, note: `${emo.emoji} là ${emo.word}` };
    }
  }, [currentLevel, combinedDict]);

  const nextPair = useCallback(() => {
    const newPair = generatePairForLevel(combinedDict);
    setPair(newPair);
    setShowWords(true);
    setFeedback(null);

    // Flash disappearing mechanics
    if (currentLevel === 20) {
      setTimeout(() => setShowWords(false), 220);
    } else if (currentLevel === 19) {
      setTimeout(() => setShowWords(false), 380);
    } else if (currentLevel === 9) {
      setTimeout(() => setShowWords(false), 600);
    }
  }, [generatePairForLevel, combinedDict, currentLevel]);

  // Load first pair on mount or theme change
  useEffect(() => {
    nextPair();
  }, [selectedTheme, nextPair]);

  // Countdown Timer & Elapsed Time (Pauses on isGamePaused or isFinished)
  useEffect(() => {
    if (isFinished || isGamePaused) return;

    const timer = setInterval(() => {
      setElapsedSec(s => s + 1);
      setTimeLeftSec(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          playSound('victory');
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, isGamePaused, playSound]);

  // Choice Handler with Immediate Feedback & History Recording
  const handleChoice = useCallback((isMatchChoice: boolean) => {
    if (isFinished || isGamePaused || feedback?.show) return;

    const isCorrect = isMatchChoice === pair.isMatch;
    const now = Date.now();
    const respMs = Math.min(10000, Math.max(50, now - lastChoiceTimeRef.current));
    lastChoiceTimeRef.current = now;

    // Record to history for post-game debrief
    const historyItem: ITrialHistoryItem = {
      round,
      word1: pair.word1,
      word2: pair.word2,
      isMatch: pair.isMatch,
      userChoice: isMatchChoice,
      isCorrect,
      note: pair.note,
      exampleSentence: pair.exampleSentence,
      correctWord: pair.correctWord,
      diffHighlight: pair.diffHighlight,
      responseMs: respMs
    };
    setTrialsHistory(prev => [...prev, historyItem]);

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
        theme: selectedTheme,
        correctWord: pair.correctWord
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
      setIsErrorFlash(true);
      setTimeout(() => setIsErrorFlash(false), 450);
    }

    // Show educational feedback briefly (650ms) before advancing
    setFeedback({
      show: true,
      userChoice: isMatchChoice,
      isCorrect,
      note: pair.note
    });

    setTimeout(() => {
      if (round >= maxRounds) {
        playSound('victory');
        setIsFinished(true);
      } else {
        setRound(r => r + 1);
        nextPair();
      }
    }, 650);
  }, [isFinished, isGamePaused, feedback, pair, round, maxRounds, currentLevel, selectedTheme, emitTrialEvent, playSound, nextPair]);

  // Keyboard navigation:
  // Space or Esc = Pause/Resume
  // ArrowLeft / 1 / A = Match (Giống nhau)
  // ArrowRight / 2 / D = Different (Khác nhau)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        setIsGamePaused(!isGamePaused);
        return;
      }

      if (isGamePaused) return;

      if (e.key === 'ArrowLeft' || e.key === '1' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleChoice(true);
      } else if (e.key === 'ArrowRight' || e.key === '2' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleChoice(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, isGamePaused, setIsGamePaused, handleChoice]);

  const accuracy = Math.round((correctCount / Math.max(1, trialsHistory.length)) * 100);
  const timeBonus = Math.max(0, timeLeftSec * 10);
  const score = (correctCount * 30 * Math.max(1, currentLevel)) + timeBonus;

  // Time progress percentage
  const timeProgressPercent = Math.max(0, Math.min(100, (timeLeftSec / initialTimeLimit) * 100));

  // Filtered trials for Debrief modal
  const displayedTrials = useMemo(() => {
    if (debriefFilter === 'missed') {
      return trialsHistory.filter(t => !t.isCorrect);
    }
    return trialsHistory;
  }, [trialsHistory, debriefFilter]);

  const missedCount = trialsHistory.filter(t => !t.isCorrect).length;

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 py-3 space-y-4 sm:space-y-5 animate-fade-in pb-24 select-none">
      
      {/* Infinity Tier Cognitive Shift Banner (Level 13+) */}
      {isInfinity && (
        <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900/90 text-white p-3 sm:p-4 rounded-3xl border border-purple-500/40 shadow-xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
              <InfinityIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-purple-300">
                  Lộ Trình Vô Cực ({getInfinityLabel(currentLevel)})
                </span>
                <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full font-bold border border-purple-400/30">
                  Bilingual & Cognitive Shift
                </span>
              </div>
              <p className="text-xs text-purple-100/90 mt-0.5">
                Thách thức nhận thức đa chiều: Đối chiếu từ vựng Tiếng Anh - Tiếng Việt, quan hệ ngữ nghĩa và phản xạ chớp nhoáng.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top HUD: Rounds, Accuracy, Countdown Timer & Pause Button */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-between">
        
        {/* Rounds */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGamePaused(!isGamePaused)}
            title={isGamePaused ? 'Tiếp tục (Space)' : 'Tạm dừng (Space / Esc)'}
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
              isGamePaused 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-700' 
                : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 hover:bg-slate-100'
            }`}
          >
            {isGamePaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5" />}
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm text-slate-500 font-semibold">Lượt chơi</span>
              {isInfinity && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center gap-1">
                  <InfinityIcon className="w-3 h-3" />
                  {getInfinityLabel(currentLevel)}
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-black text-brand-600 dark:text-brand-400">
              {round} / {maxRounds}
            </div>
          </div>
        </div>

        {/* Accuracy */}
        <div className="text-center">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Đúng</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-500">
            {correctCount} <span className="text-xs text-slate-400 font-normal">({trialsHistory.length > 0 ? `${accuracy}%` : '100%'})</span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="text-right min-w-[90px]">
          <div className="flex items-center justify-end gap-1 text-xs sm:text-sm text-slate-500 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Còn lại</span>
          </div>
          <div className={`text-xl sm:text-2xl font-black transition-colors ${
            timeLeftSec <= 5 ? 'text-rose-500 animate-pulse' : timeLeftSec <= 10 ? 'text-amber-500' : 'text-slate-800 dark:text-slate-100'
          }`}>
            {timeLeftSec}s
          </div>
        </div>
      </div>

      {/* Visual Time Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${
            timeLeftSec <= 5 ? 'bg-rose-500' : timeLeftSec <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${timeProgressPercent}%` }}
        />
      </div>

      {/* Instruction Prompt */}
      <div className="text-center text-xs sm:text-sm font-semibold text-purple-800 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 p-2.5 sm:p-3 rounded-2xl shadow-sm">
        {subLabels.prompt || 'Quan sát thật nhanh 2 từ xem chúng có HOÀN TOÀN TRÙNG KHỚP hay không.'}
      </div>

      {/* Context Sentence Display for Level 12 */}
      {pair.contextSentence && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 p-3 sm:p-4 rounded-2xl text-center shadow-sm animate-fade-in">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
            Ngữ cảnh sử dụng từ
          </span>
          <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-amber-100">
            "{pair.contextSentence}"
          </p>
        </div>
      )}

      {/* Word Comparison Area (With Absolute Privacy Blur Overlay when Paused) */}
      <div className="relative">
        {/* PRIVACY OVERLAY ON PAUSE (Guarantees zero-leakage of words behind) */}
        {isGamePaused && (
          <div className="absolute inset-0 z-30 bg-slate-900/85 backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in border border-slate-700/60 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3 text-amber-400">
              <Pause className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold">Bài tập đang tạm dừng</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-sm">
              Cặp từ đã được bảo mật che hoàn toàn để đảm bảo tính công bằng phản xạ chớp nhoáng.
            </p>
            <button
              onClick={() => setIsGamePaused(false)}
              className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Tiếp tục chơi (Space)</span>
            </button>
          </div>
        )}

        {/* Word Boxes Grid */}
        <div className={`grid grid-cols-1 ${pair.isSentenceMode ? 'sm:grid-cols-1 gap-3' : 'sm:grid-cols-2 gap-4'} py-2 transition-all duration-150 ${isErrorFlash ? 'animate-shake' : ''}`}>
          
          {/* Word 1 */}
          <div className={`min-h-[120px] sm:min-h-[150px] rounded-3xl border-2 flex flex-col items-center justify-center p-4 shadow-md transition-all ${
            isErrorFlash 
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-4 ring-rose-500/30' 
              : feedback?.show 
                ? (feedback.isCorrect ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400' : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-400')
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}>
            {subLabels.labelA && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                {subLabels.labelA}
              </span>
            )}
            <span className={`font-mono font-black text-center transition-all ${
              pair.isSentenceMode 
                ? 'text-base sm:text-lg text-slate-800 dark:text-white px-2 leading-relaxed' 
                : 'text-2xl sm:text-3xl md:text-4xl text-slate-800 dark:text-white tracking-widest'
            }`}>
              {(!isGamePaused && showWords) ? pair.word1 : '••••••••'}
            </span>
          </div>

          {/* Word 2 */}
          <div className={`min-h-[120px] sm:min-h-[150px] rounded-3xl border-2 flex flex-col items-center justify-center p-4 shadow-md transition-all ${
            isErrorFlash 
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-4 ring-rose-500/30' 
              : feedback?.show 
                ? (feedback.isCorrect ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400' : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-400')
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}>
            {subLabels.labelB && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                {subLabels.labelB}
              </span>
            )}
            <span className={`font-mono font-black text-center transition-all ${
              pair.isMirrorMode ? 'scale-x-[-1] inline-block text-purple-600 dark:text-purple-400' : ''
            } ${
              pair.isSentenceMode 
                ? 'text-base sm:text-lg text-slate-800 dark:text-white px-2 leading-relaxed' 
                : 'text-2xl sm:text-3xl md:text-4xl text-slate-800 dark:text-white tracking-widest'
            }`}>
              {(!isGamePaused && showWords) ? pair.word2 : '••••••••'}
            </span>
          </div>
        </div>

        {/* Immediate Pedagogical Feedback Badge */}
        {feedback?.show && (
          <div className={`mt-2 p-3 rounded-2xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-scale-up ${
            feedback.isCorrect 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-800 dark:text-emerald-200' 
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-800 dark:text-rose-200'
          }`}>
            {feedback.isCorrect ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div className="flex-1">
              <span className="font-bold">
                {feedback.isCorrect ? 'Chính xác! ' : 'Chưa đúng! '}
              </span>
              <span>
                {pair.isMatch 
                  ? 'Hai từ/câu này hoàn toàn giống nhau.' 
                  : (pair.diffHighlight ? `Khác nhau: ${pair.diffHighlight}. ` : 'Hai từ/câu này khác nhau. ')
                }
              </span>
              {feedback.note && (
                <p className="text-[11px] opacity-90 mt-0.5">
                  <strong>Kiến thức:</strong> {feedback.note}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons: GIỐNG NHAU (← / 1 / A) vs KHÁC NHAU (→ / 2 / D) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
        <button
          onClick={() => handleChoice(true)}
          disabled={isGamePaused || Boolean(feedback?.show)}
          className="h-20 sm:h-24 rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-black text-xl sm:text-2xl shadow-lg shadow-emerald-600/30 flex flex-col items-center justify-center transition-all btn-press cursor-pointer relative"
        >
          <span className="flex items-center gap-1.5">
            GIỐNG NHAU
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-emerald-100 hidden sm:inline-block">← / 1</span>
          </span>
          <span className="text-xs opacity-80 font-semibold">Match</span>
        </button>

        <button
          onClick={() => handleChoice(false)}
          disabled={isGamePaused || Boolean(feedback?.show)}
          className="h-20 sm:h-24 rounded-3xl bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 text-white font-black text-xl sm:text-2xl shadow-lg shadow-rose-600/30 flex flex-col items-center justify-center transition-all btn-press cursor-pointer relative"
        >
          <span className="flex items-center gap-1.5">
            KHÁC NHAU
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-rose-100 hidden sm:inline-block">→ / 2</span>
          </span>
          <span className="text-xs opacity-80 font-semibold">Different</span>
        </button>
      </div>

      {/* Key Shortcut Footer Helper & Debrief Trigger */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium pt-1 px-1">
        <div>
          Phím tắt: <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">←</kbd> Giống nhau • <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">→</kbd> Khác nhau • <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Space</kbd> Tạm dừng
        </div>

        {trialsHistory.length > 0 && (
          <button
            onClick={() => {
              playSound('click');
              setIsGamePaused(true);
              setShowDebriefModal(true);
            }}
            className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Xem từ đã làm ({trialsHistory.length})</span>
          </button>
        )}
      </div>

      {/* POST-GAME VOCABULARY DEBRIEF MODAL (Knowledge Retention) */}
      {showDebriefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FDFBF7] dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-brand-600 text-white">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-6 h-6" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold leading-tight">
                    Củng Cố Từ Vựng & Bài Học Chính Tả
                  </h3>
                  <span className="text-[11px] text-brand-100 font-medium">
                    Phiên rèn luyện Cấp {currentLevel > 12 ? getInfinityLabel(currentLevel) : currentLevel} • {trialsHistory.length} câu đã hoàn thành
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  playSound('click');
                  setShowDebriefModal(false);
                  if (!isFinished) setIsGamePaused(false);
                }}
                className="p-1 rounded-full hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Danh sách các cặp từ:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setDebriefFilter('all')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    debriefFilter === 'all'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({trialsHistory.length})
                </button>
                <button
                  onClick={() => setDebriefFilter('missed')}
                  className={`px-3 py-1 rounded-xl font-bold transition-all ${
                    debriefFilter === 'missed'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Cần lưu ý ({missedCount})
                </button>
              </div>
            </div>

            {/* Trials List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
              {displayedTrials.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="font-bold text-sm text-slate-600 dark:text-slate-300">Tuyệt vời! Không có câu nào bị sai.</p>
                  <p className="text-xs text-slate-400 mt-0.5">Bạn đã phân biệt chính xác 100% tất cả các cặp từ trong phiên này.</p>
                </div>
              ) : (
                displayedTrials.map((t, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      t.isCorrect 
                        ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700' 
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          #{t.round}
                        </span>
                        <div className="font-mono font-black text-sm sm:text-base text-slate-800 dark:text-white">
                          <span>{t.word1}</span>
                          <span className="text-slate-400 mx-2">vs</span>
                          <span>{t.word2}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {t.isCorrect ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đúng ({t.responseMs}ms)
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Sai
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Educational Note & Correct Word */}
                    {t.note && (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                        {t.correctWord && (
                          <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                            ✓ Từ chuẩn: {t.correctWord}
                          </p>
                        )}
                        <p className="leading-relaxed">
                          <strong>Phân tích:</strong> {t.note}
                        </p>
                        {t.exampleSentence && (
                          <p className="text-[11px] text-slate-500 italic">
                            Ví dụ: "{t.exampleSentence}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-center">
              <button
                onClick={() => {
                  playSound('click');
                  setShowDebriefModal(false);
                  if (!isFinished) setIsGamePaused(false);
                }}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Đã ghi nhớ kiến thức
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Game Result Modal with Missed Pairs Debrief Access */}
      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracy}
          timeSpentSec={elapsedSec}
          playedLevel={currentLevel || 1}
          isCustom={isCustom}
          rawMetricsJson={{
            ...getRawMetricsJson(),
            trialsCount: trialsHistory.length,
            timeLimitSec: initialTimeLimit,
            timeLeftSec,
            correctCount
          }}
          onRestart={() => {
            resetSession();
            setRound(1);
            setCorrectCount(0);
            setElapsedSec(0);
            setTimeLeftSec(initialTimeLimit);
            setTrialsHistory([]);
            setIsFinished(false);
            setFeedback(null);
            nextPair();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
