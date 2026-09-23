import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { 
  Brain, Zap, Sparkles, Star, Flame, Eye, Target, Compass, 
  Heart, Gem, Sun, Moon, Rocket, Feather, Crown, RefreshCw,
  Infinity as InfinityIcon, Globe
} from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { 
  infinityApiService, 
  BILINGUAL_WORD_PAIRS, 
  EMOJI_WORD_PAIRS, 
  SYNONYM_PAIRS, 
  POS_TRIADS, 
  NASA_OFFLINE_CARDS 
} from '../../services/infinityApiService';
import { INFINITY_ROMAN_NUMERALS, getInfinityTier, getInfinityLabel } from '@brain-exercises/shared';

interface CardItem {
  id: string;
  symbolIndex: number;
  matchKey: string;
  cardType: 'icon' | 'word_en' | 'word_vi' | 'emoji' | 'triad_noun' | 'triad_verb' | 'triad_adj' | 'space';
  displayText: string;
  subText?: string;
  emoji?: string;
  colorClass?: string;
  isFlipped: boolean;
  isMatched: boolean;
  isTrap?: boolean;
}

const CARD_ICONS = [
  { icon: Brain, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40', name: 'Brain' },
  { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40', name: 'Zap' },
  { icon: Sparkles, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-950/40', name: 'Sparkles' },
  { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/40', name: 'Star' },
  { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40', name: 'Flame' },
  { icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', name: 'Eye' },
  { icon: Target, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40', name: 'Target' },
  { icon: Compass, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/40', name: 'Compass' },
  { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/40', name: 'Heart' },
  { icon: Gem, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/40', name: 'Gem' },
  { icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/40', name: 'Sun' },
  { icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/40', name: 'Moon' },
  { icon: Rocket, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40', name: 'Rocket' },
  { icon: Feather, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/40', name: 'Feather' },
  { icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/40', name: 'Crown' }
];

export const CardFlipGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastMatchTimeRef = useRef<number>(Date.now());
  const effectiveLevel = getExerciseLevel('card-flip') || currentLevel;

  // Level-specific mode flags
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = getInfinityTier(effectiveLevel);

  // Standard modes
  const isTripleMatch = effectiveLevel === 9 || effectiveLevel === 15 || effectiveLevel === 17; // Level 9, ∞-III (Triad Concept) or ∞-V (POS Triad)
  const isShuffleTrap = effectiveLevel === 10 || effectiveLevel === 19; // Level 10 or ∞-VII (Matrix Drift)
  const isOrbiting = effectiveLevel === 18; // ∞-VI: Orbiting Cosmic Rows
  const isSpeedDecay = effectiveLevel === 20; // ∞-VIII: Rapid Decay Flash

  const pairCount = useMemo(() => {
    if (isTripleMatch) return 6; // 6 triads of 3 = 18 cards
    if (effectiveLevel <= 2) return 6; // 12 cards
    if (effectiveLevel <= 4) return 8; // 16 cards
    if (effectiveLevel <= 6) return 10; // 20 cards
    if (effectiveLevel === 7) return 12; // 24 cards
    if (effectiveLevel === 8) return 14; // 28 cards
    if (effectiveLevel >= 13) return 12; // 24 cards for high levels
    return 16; // 32 cards
  }, [effectiveLevel, isTripleMatch]);

  const initialTimeLimit = useMemo(() => {
    if (effectiveLevel <= 2) return 45;
    if (effectiveLevel <= 4) return 50;
    if (effectiveLevel <= 6) return 60;
    if (effectiveLevel <= 8) return 75;
    if (effectiveLevel >= 13) return 85;
    return 85;
  }, [effectiveLevel]);

  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flipsCount, setFlipsCount] = useState(0);
  const [matchedPairsCount, setMatchedPairsCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initialTimeLimit);
  const [isFinished, setIsFinished] = useState(false);
  const [sonarPulsesLeft, setSonarPulsesLeft] = useState(2);
  const [isSonaring, setIsSonaring] = useState(false);

  const initGame = useCallback(() => {
    const cardDeck: CardItem[] = [];

    if (!isInfinity) {
      // Standard Icon Matching (Levels 1-12)
      const selectedIconIndices: number[] = [];
      const availablePool = Array.from({ length: CARD_ICONS.length }, (_, i) => i);
      
      for (let i = availablePool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availablePool[i], availablePool[j]] = [availablePool[j], availablePool[i]];
      }

      for (let i = 0; i < pairCount; i++) {
        selectedIconIndices.push(availablePool[i % availablePool.length]);
      }

      selectedIconIndices.forEach((symIdx, idx) => {
        const copies = isTripleMatch ? 3 : 2;
        for (let c = 0; c < copies; c++) {
          cardDeck.push({
            id: `card-${idx}-${c}-${Math.random()}`,
            symbolIndex: symIdx,
            matchKey: `icon-${symIdx}`,
            cardType: 'icon',
            displayText: CARD_ICONS[symIdx].name,
            isFlipped: false,
            isMatched: false
          });
        }
      });
    } else {
      // Infinity Levels (13 to 22)
      switch (effectiveLevel) {
        case 13: {
          // ∞-I: English Word Pairs (12 pairs = 24 cards)
          const enPairs = infinityApiService.getBilingualPairs(pairCount);
          enPairs.forEach((pair, idx) => {
            for (let c = 0; c < 2; c++) {
              cardDeck.push({
                id: `card-en-${idx}-${c}-${Math.random()}`,
                symbolIndex: idx % CARD_ICONS.length,
                matchKey: pair.en,
                cardType: 'word_en',
                displayText: pair.en,
                subText: pair.category,
                isFlipped: false,
                isMatched: false
              });
            }
          });
          break;
        }

        case 14: {
          // ∞-II: VI-EN Translation Pairs (Side A: Vietnamese, Side B: English)
          const biPairs = infinityApiService.getBilingualPairs(pairCount);
          biPairs.forEach((pair, idx) => {
            // Card A: Vietnamese
            cardDeck.push({
              id: `card-vi-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: pair.en,
              cardType: 'word_vi',
              displayText: pair.vi,
              subText: 'Tiếng Việt',
              isFlipped: false,
              isMatched: false
            });
            // Card B: English
            cardDeck.push({
              id: `card-en-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: pair.en,
              cardType: 'word_en',
              displayText: pair.en,
              subText: 'English',
              isFlipped: false,
              isMatched: false
            });
          });
          break;
        }

        case 15: {
          // ∞-III: Triad Concept Matching (Card 1: EN Word, Card 2: VI Meaning, Card 3: Symbol Emoji)
          const triads = infinityApiService.getTriadConcepts(6);
          triads.forEach((tc, idx) => {
            const mKey = `triad-concept-${tc.id}`;
            // Card A: English Word
            cardDeck.push({
              id: `card-tc-en-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: mKey,
              cardType: 'word_en',
              displayText: tc.word,
              subText: 'Từ Tiếng Anh',
              isFlipped: false,
              isMatched: false
            });
            // Card B: Vietnamese Meaning
            cardDeck.push({
              id: `card-tc-vi-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: mKey,
              cardType: 'word_vi',
              displayText: tc.viMeaning,
              subText: 'Nghĩa Tiếng Việt',
              isFlipped: false,
              isMatched: false
            });
            // Card C: Symbol Emoji
            cardDeck.push({
              id: `card-tc-sym-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: mKey,
              cardType: 'emoji',
              displayText: tc.symbol,
              emoji: tc.symbol,
              subText: tc.category,
              isFlipped: false,
              isMatched: false
            });
          });
          break;
        }

        case 16: {
          // ∞-IV: Semantic Synonym Pairs (Side A: Word A, Side B: Word B)
          const synPairs = infinityApiService.getSynonymPairs(pairCount);
          synPairs.forEach((pair, idx) => {
            const mKey = `syn-${pair.wordA}-${pair.wordB}`;
            cardDeck.push({
              id: `card-synA-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: mKey,
              cardType: 'word_en',
              displayText: pair.wordA,
              subText: pair.commonMeaning,
              isFlipped: false,
              isMatched: false
            });
            cardDeck.push({
              id: `card-synB-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: mKey,
              cardType: 'word_en',
              displayText: pair.wordB,
              subText: pair.commonMeaning,
              isFlipped: false,
              isMatched: false
            });
          });
          break;
        }

        case 17: {
          // ∞-V: Parts of Speech Triad (Noun + Verb + Adjective)
          const triads = infinityApiService.getPosTriads(6);
          triads.forEach((triad, idx) => {
            const mKey = `triad-${idx}`;
            cardDeck.push({
              id: `card-noun-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: mKey,
              cardType: 'triad_noun',
              displayText: triad.noun,
              subText: 'DANH TỪ',
              isFlipped: false,
              isMatched: false
            });
            cardDeck.push({
              id: `card-verb-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: mKey,
              cardType: 'triad_verb',
              displayText: triad.verb,
              subText: 'ĐỘNG TỪ',
              isFlipped: false,
              isMatched: false
            });
            cardDeck.push({
              id: `card-adj-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: mKey,
              cardType: 'triad_adj',
              displayText: triad.adjective,
              subText: 'TÍNH TỪ',
              isFlipped: false,
              isMatched: false
            });
          });
          break;
        }

        case 18: {
          // ∞-VI: NASA Cosmic Astronomy Cards
          const spaceCards = infinityApiService.getNasaCards(8);
          spaceCards.forEach((item, idx) => {
            const mKey = item.enLabel;
            cardDeck.push({
              id: `card-spaceA-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: mKey,
              cardType: 'space',
              displayText: item.enLabel,
              emoji: item.emoji,
              subText: 'Vũ Trụ NASA',
              isFlipped: false,
              isMatched: false
            });
            cardDeck.push({
              id: `card-spaceB-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: mKey,
              cardType: 'space',
              displayText: item.viLabel,
              emoji: item.emoji,
              subText: 'NASA APOD',
              isFlipped: false,
              isMatched: false
            });
          });
          break;
        }

        case 19: {
          // ∞-VII: Antonym Opposites Matching (Hot vs Cold, Chaos vs Order)
          const antonyms = infinityApiService.getAntonymPairs(pairCount);
          antonyms.forEach((pair, idx) => {
            const mKey = `ant-${pair.wordA}-${pair.wordB}`;
            cardDeck.push({
              id: `card-antA-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: mKey,
              cardType: 'word_en',
              displayText: pair.wordA,
              subText: pair.viConcept,
              isFlipped: false,
              isMatched: false
            });
            cardDeck.push({
              id: `card-antB-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: mKey,
              cardType: 'word_en',
              displayText: pair.wordB,
              subText: 'Từ Trái Nghĩa',
              isFlipped: false,
              isMatched: false
            });
          });
          break;
        }

        case 20: {
          // ∞-VIII: Rapid Decay Flash (Flipped cards close fast)
          const biPairs = infinityApiService.getBilingualPairs(pairCount);
          biPairs.forEach((pair, idx) => {
            cardDeck.push({
              id: `card-decayA-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: pair.en,
              cardType: 'word_en',
              displayText: pair.en,
              subText: pair.category,
              isFlipped: false,
              isMatched: false
            });
            cardDeck.push({
              id: `card-decayB-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: pair.en,
              cardType: 'word_vi',
              displayText: pair.vi,
              subText: '1.5s Decay',
              isFlipped: false,
              isMatched: false
            });
          });
          break;
        }

        case 21: {
          // ∞-IX: Multi-Domain Synthesis Deck (Hybrid mix of Emojis, NASA, Antonyms, Bilingual)
          const emojis = infinityApiService.getEmojiWordPairs(3);
          const space = infinityApiService.getNasaCards(3);
          const antonyms = infinityApiService.getAntonymPairs(3);
          const bilingual = infinityApiService.getBilingualPairs(3);

          emojis.forEach((pair, idx) => {
            cardDeck.push({
              id: `card-syn-emA-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: `em-${pair.word}`,
              cardType: 'emoji',
              displayText: pair.emoji,
              subText: 'Biểu Tượng',
              isFlipped: false,
              isMatched: false
            });
            cardDeck.push({
              id: `card-syn-emB-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: `em-${pair.word}`,
              cardType: 'word_en',
              displayText: pair.word,
              subText: pair.vi,
              isFlipped: false,
              isMatched: false
            });
          });

          space.forEach((item, idx) => {
            cardDeck.push({
              id: `card-syn-spA-${idx}-${Math.random()}`,
              symbolIndex: (idx + 3) % CARD_ICONS.length,
              matchKey: `sp-${item.enLabel}`,
              cardType: 'space',
              displayText: item.enLabel,
              emoji: item.emoji,
              subText: 'Vũ Trụ',
              isFlipped: false,
              isMatched: false
            });
            cardDeck.push({
              id: `card-syn-spB-${idx}-${Math.random()}`,
              symbolIndex: (idx + 3) % CARD_ICONS.length,
              matchKey: `sp-${item.enLabel}`,
              cardType: 'space',
              displayText: item.viLabel,
              emoji: item.emoji,
              subText: 'Thiên Văn',
              isFlipped: false,
              isMatched: false
            });
          });

          antonyms.forEach((pair, idx) => {
            cardDeck.push({
              id: `card-syn-antA-${idx}-${Math.random()}`,
              symbolIndex: (idx + 6) % CARD_ICONS.length,
              matchKey: `ant-${pair.wordA}-${pair.wordB}`,
              cardType: 'word_en',
              displayText: pair.wordA,
              subText: 'Trái Nghĩa',
              isFlipped: false,
              isMatched: false
            });
            cardDeck.push({
              id: `card-syn-antB-${idx}-${Math.random()}`,
              symbolIndex: (idx + 6) % CARD_ICONS.length,
              matchKey: `ant-${pair.wordA}-${pair.wordB}`,
              cardType: 'word_en',
              displayText: pair.wordB,
              subText: pair.viConcept,
              isFlipped: false,
              isMatched: false
            });
          });

          bilingual.forEach((pair, idx) => {
            cardDeck.push({
              id: `card-syn-biA-${idx}-${Math.random()}`,
              symbolIndex: (idx + 9) % CARD_ICONS.length,
              matchKey: `bi-${pair.en}`,
              cardType: 'word_vi',
              displayText: pair.vi,
              subText: 'Tiếng Việt',
              isFlipped: false,
              isMatched: false
            });
            cardDeck.push({
              id: `card-syn-biB-${idx}-${Math.random()}`,
              symbolIndex: (idx + 9) % CARD_ICONS.length,
              matchKey: `bi-${pair.en}`,
              cardType: 'word_en',
              displayText: pair.en,
              subText: 'English',
              isFlipped: false,
              isMatched: false
            });
          });
          break;
        }

        default: {
          // ∞-X: Infinite Endless Deck (Level 22)
          const biPairs = infinityApiService.getBilingualPairs(pairCount);
          biPairs.forEach((pair, idx) => {
            cardDeck.push({
              id: `card-endlessA-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: pair.en,
              cardType: 'word_en',
              displayText: pair.en,
              subText: pair.category,
              isFlipped: false,
              isMatched: false
            });
            cardDeck.push({
              id: `card-endlessB-${idx}-${Math.random()}`,
              symbolIndex: idx % CARD_ICONS.length,
              matchKey: pair.en,
              cardType: 'word_vi',
              displayText: pair.vi,
              subText: 'Cascade',
              isFlipped: false,
              isMatched: false
            });
          });
          break;
        }
      }
    }

    // Shuffle deck (Fisher-Yates)
    for (let i = cardDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardDeck[i], cardDeck[j]] = [cardDeck[j], cardDeck[i]];
    }

    setCards(cardDeck);
    setFlippedIndices([]);
    setIsProcessing(false);
    setMatchedPairsCount(0);
    setFlipsCount(0);
    setCombo(0);
    setScore(0);
    setTimeLeft(initialTimeLimit);
    setIsFinished(false);
    setSonarPulsesLeft(2);
    setIsSonaring(false);
  }, [pairCount, initialTimeLimit, isTripleMatch, isInfinity, effectiveLevel]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Countdown timer & Shuffle Trap / Matrix Drift / Orbiting Rows
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }

        // Shuffle trap at level 10 or ∞-VII: every 8-10s shuffle unmatched unrevealed cards
        if (isShuffleTrap && t > 1 && t % 8 === 0) {
          setCards(prev => {
            const indicesToShuffle: number[] = [];
            prev.forEach((c, idx) => {
              if (!c.isMatched && !c.isFlipped) indicesToShuffle.push(idx);
            });
            if (indicesToShuffle.length > 2) {
              const updated = [...prev];
              for (let i = indicesToShuffle.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const idxA = indicesToShuffle[i];
                const idxB = indicesToShuffle[j];
                const temp = updated[idxA];
                updated[idxA] = updated[idxB];
                updated[idxB] = temp;
              }
              return updated;
            }
            return prev;
          });
        }

        // Orbiting Rows at level 18 (∞-VI): shift rows circularly every 9s
        if (isOrbiting && t > 1 && t % 9 === 0) {
          setCards(prev => {
            if (prev.length < 6) return prev;
            const updated = [...prev];
            const chunk = updated.splice(0, 6);
            chunk.push(chunk.shift()!);
            return [...chunk, ...updated];
          });
        }

        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, isShuffleTrap, isOrbiting]);

  const handleTriggerSonar = () => {
    if (sonarPulsesLeft <= 0 || isProcessing || isSonaring || isFinished) return;
    playSound('click');
    setSonarPulsesLeft(p => p - 1);
    setIsSonaring(true);
    const unmatchedIndices: number[] = [];
    cards.forEach((c, idx) => {
      if (!c.isMatched && !c.isFlipped) unmatchedIndices.push(idx);
    });
    const sample = unmatchedIndices.sort(() => Math.random() - 0.5).slice(0, 4);
    if (sample.length === 0) {
      setIsSonaring(false);
      return;
    }
    setCards(prev => prev.map((c, idx) => sample.includes(idx) ? { ...c, isFlipped: true } : c));
    setTimeout(() => {
      setCards(prev => prev.map((c, idx) => sample.includes(idx) ? { ...c, isFlipped: false } : c));
      setIsSonaring(false);
    }, 700);
  };

  // Speed Decay for Level 20 (∞-VIII): Flipped cards close after 2 seconds if not matched
  useEffect(() => {
    if (!isSpeedDecay || flippedIndices.length === 0 || isProcessing) return;
    const decayTimer = setTimeout(() => {
      setCards(prev => {
        const updated = [...prev];
        flippedIndices.forEach(idx => {
          if (!updated[idx].isMatched) updated[idx].isFlipped = false;
        });
        return updated;
      });
      setFlippedIndices([]);
    }, 2000);
    return () => clearTimeout(decayTimer);
  }, [isSpeedDecay, flippedIndices, isProcessing]);

  const requiredMatches = isTripleMatch ? 3 : 2;

  const handleCardClick = (index: number) => {
    if (isProcessing || isFinished) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    playSound('click');
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === requiredMatches) {
      setIsProcessing(true);
      setFlipsCount(c => c + 1);

      const firstKey = newCards[newFlipped[0]].matchKey;
      const isAllMatched = newFlipped.every(idx => newCards[idx].matchKey === firstKey);
      const now = Date.now();
      const respMs = Math.min(15000, Math.max(100, now - lastMatchTimeRef.current));
      lastMatchTimeRef.current = now;

      emitTrialEvent({
        exerciseSlug: 'card-flip',
        level: effectiveLevel,
        relationId: isInfinity ? 'IDENTITY_MATCH' : 'SPATIAL_TRANSFORM',
        relationWeight: 1.0,
        entities: { matchKey: firstKey, flippedIndices: newFlipped, isMatched: isAllMatched },
        stateBefore: `matched:${matchedPairsCount}`,
        stateAfter: isAllMatched ? `matched:${matchedPairsCount + 1}` : `matched:${matchedPairsCount}`,
        responseMs: respMs,
        correct: isAllMatched
      });

      if (isAllMatched) {
        // MATCH!
        playSound('correct');
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        const addedScore = (isTripleMatch ? 300 : 160) + (nextCombo * 45) + (effectiveLevel * 25);
        setScore(s => s + addedScore);

        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            newFlipped.forEach(idx => {
              updated[idx].isMatched = true;
            });
            return updated;
          });
          const nextMatchedCount = matchedPairsCount + 1;
          setMatchedPairsCount(nextMatchedCount);
          setFlippedIndices([]);
          setIsProcessing(false);

          const totalRequiredSets = isTripleMatch ? Math.floor(cards.length / 3) : Math.floor(cards.length / 2);
          if (nextMatchedCount >= totalRequiredSets) {
            setIsFinished(true);
          }
        }, 400);
      } else {
        // MISMATCH
        playSound('wrong');
        setCombo(0);
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            newFlipped.forEach(idx => {
              updated[idx].isFlipped = false;
            });
            return updated;
          });
          setFlippedIndices([]);
          setIsProcessing(false);
        }, 850);
      }
    }
  };

  const gridColsClass = useMemo(() => {
    if (cards.length <= 12) return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6';
    if (cards.length <= 16) return 'grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8';
    if (cards.length <= 20) return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8';
    if (cards.length <= 24) return 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-8';
    return 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-8';
  }, [cards.length]);

  const accuracyRate = flipsCount > 0 
    ? Math.min(100, Math.round((matchedPairsCount / flipsCount) * 100)) 
    : 100;

  const totalRequiredSets = isTripleMatch ? Math.floor(cards.length / 3) : Math.floor(cards.length / 2);

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
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
            {score}
            {combo > 1 && <span className="text-xs text-amber-500 ml-1.5 font-bold">x{combo}</span>}
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">
            {isTripleMatch ? 'Bộ 3 đã ghép' : 'Ghép đôi'}
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">
            {matchedPairsCount} / {totalRequiredSets}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Thời gian</span>
          <div className={`text-2xl sm:text-3xl font-black mt-0.5 ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Instruction Tip & Sonar Pulse Scaffolding */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex-1 text-center sm:text-left">
          {isInfinity ? (
            effectiveLevel === 14 ? (
              '🌌 Cấp Vô Cực ∞-II: Ghép cặp từ Tiếng Việt với từ Tiếng Anh dịch nghĩa tương ứng!'
            ) : effectiveLevel === 15 ? (
              '🌌 Cấp Vô Cực ∞-III (Tam Hợp): Lật mở trọn vẹn Bộ 3: Từ Tiếng Anh + Nghĩa Tiếng Việt + Biểu tượng!'
            ) : effectiveLevel === 16 ? (
              '🌌 Cấp Vô Cực ∞-IV: Ghép các từ Đồng Nghĩa (Synonyms) Tiếng Anh có chung ngữ nghĩa!'
            ) : effectiveLevel === 17 ? (
              '🌌 Cấp Vô Cực ∞-V: Lật mở trọn vẹn Bộ 3: Danh Từ + Động Từ + Tính Từ cùng chủ đề!'
            ) : effectiveLevel === 18 ? (
              '🌌 Cấp Vô Cực ∞-VI: Thẻ Thiên Văn NASA - Bàn cờ chuyển động dịch chuyển theo quỹ đạo!'
            ) : (
              '🌌 Cấp Vô Cực: Lật mở và kết nối các cặp thực thể song ngữ, ghi nhớ thần tốc!'
            )
          ) : (
            'Lật mở từng thẻ để ghép cặp các biểu tượng giống nhau. Lật đúng liên tiếp để nhân điểm combo!'
          )}
        </div>

        {isInfinity && (
          <button
            onClick={handleTriggerSonar}
            disabled={sonarPulsesLeft <= 0 || isProcessing || isSonaring}
            className={`px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5 rounded-xl border transition-all shrink-0 ${
              sonarPulsesLeft <= 0 || isProcessing || isSonaring
                ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400'
                : 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 hover:scale-105 active:scale-95 shadow-sm'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Radar quét sóng ({sonarPulsesLeft}/2)</span>
          </button>
        )}
      </div>

      {/* 3D Card Grid */}
      <div className={`grid ${gridColsClass} gap-2.5 sm:gap-4 perspective-1000`}>
        {cards.map((card, idx) => {
          const iconMeta = CARD_ICONS[card.symbolIndex % CARD_ICONS.length];
          const IconComp = iconMeta.icon;

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className="relative aspect-square cursor-pointer select-none group"
              style={{ perspective: '1000px' }}
            >
              <div 
                className={`w-full h-full rounded-2xl sm:rounded-3xl transition-transform duration-500 shadow-md ${
                  card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: card.isFlipped || card.isMatched ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Back of Card (Hidden Face) */}
                <div 
                  className={`absolute inset-0 rounded-2xl sm:rounded-3xl flex items-center justify-center border-2 border-brand-200 dark:border-brand-900/60 text-white font-black shadow-lg backface-hidden ${
                    isInfinity 
                      ? 'bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600'
                      : 'bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-600'
                  } ${!card.isMatched && 'hover:scale-[1.04] active:scale-95 transition-transform'}`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  {isInfinity ? (
                    <InfinityIcon className="w-6 h-6 sm:w-8 sm:h-8 opacity-90 group-hover:rotate-180 transition-transform duration-700" />
                  ) : (
                    <Sparkles className="w-7 h-7 sm:w-9 sm:h-9 opacity-80 group-hover:rotate-12 transition-transform" />
                  )}
                </div>

                {/* Front of Card (Revealed Symbol / Text / Emoji) */}
                <div 
                  className={`absolute inset-0 rounded-2xl sm:rounded-3xl flex items-center justify-center p-2 border-2 shadow-lg backface-hidden transition-all ${
                    card.isMatched 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 opacity-90' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  {card.cardType === 'icon' ? (
                    <IconComp className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${card.isMatched ? 'text-emerald-500 scale-110' : iconMeta.color} transition-transform`} />
                  ) : card.cardType === 'emoji' ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-3xl sm:text-4xl">{card.emoji}</span>
                      {card.subText && (
                        <span className="text-[8px] sm:text-[9px] font-bold text-purple-600 dark:text-purple-400 mt-0.5 uppercase tracking-wider">
                          {card.subText}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center px-1">
                      {card.emoji && <span className="text-xl sm:text-2xl mb-0.5">{card.emoji}</span>}
                      <span className={`font-black text-xs sm:text-sm tracking-tight leading-tight uppercase ${
                        card.isMatched 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-slate-800 dark:text-white'
                      }`}>
                        {card.displayText}
                      </span>
                      {card.subText && (
                        <span className="text-[8px] sm:text-[9px] font-bold text-purple-600 dark:text-purple-400 mt-0.5 uppercase tracking-wider">
                          {card.subText}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={initGame}
          className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Xáo bài lại
        </button>
      </div>

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={accuracyRate}
          timeSpentSec={initialTimeLimit - timeLeft}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            initGame();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
