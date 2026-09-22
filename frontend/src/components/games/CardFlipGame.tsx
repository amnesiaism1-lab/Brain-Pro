import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { 
  Brain, Zap, Sparkles, Star, Flame, Eye, Target, Compass, 
  Heart, Gem, Sun, Moon, Rocket, Feather, Crown, RefreshCw
} from 'lucide-react';

interface CardItem {
  id: string;
  symbolIndex: number;
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
  const effectiveLevel = getExerciseLevel('card-flip') || currentLevel;

  const isTripleMatch = effectiveLevel === 9;
  const isShuffleTrap = effectiveLevel === 10;

  const pairCount = useMemo(() => {
    if (isTripleMatch) return 6; // 6 sets of 3 = 18 cards
    if (effectiveLevel <= 2) return 6; // 12 cards
    if (effectiveLevel <= 4) return 8; // 16 cards
    if (effectiveLevel <= 6) return 10; // 20 cards
    if (effectiveLevel === 7) return 12; // 24 cards
    if (effectiveLevel === 8) return 15; // 30 cards
    return 16; // 32 cards for high levels
  }, [effectiveLevel, isTripleMatch]);

  const initialTimeLimit = useMemo(() => {
    if (effectiveLevel <= 2) return 45;
    if (effectiveLevel <= 4) return 50;
    if (effectiveLevel <= 6) return 60;
    if (effectiveLevel <= 8) return 75;
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

  const initGame = useCallback(() => {
    const selectedIconIndices: number[] = [];
    const availablePool = Array.from({ length: CARD_ICONS.length }, (_, i) => i);
    
    // Fisher-Yates shuffle pool
    for (let i = availablePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePool[i], availablePool[j]] = [availablePool[j], availablePool[i]];
    }

    for (let i = 0; i < pairCount; i++) {
      selectedIconIndices.push(availablePool[i % availablePool.length]);
    }

    const cardDeck: CardItem[] = [];
    selectedIconIndices.forEach((symIdx, idx) => {
      // If triple match, create 3 of each symbol
      const copies = isTripleMatch ? 3 : 2;
      for (let c = 0; c < copies; c++) {
        cardDeck.push({
          id: `card-${idx}-${c}-${Math.random()}`,
          symbolIndex: symIdx,
          isFlipped: false,
          isMatched: false
        });
      }
    });

    // Shuffle deck
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
  }, [pairCount, initialTimeLimit, isTripleMatch]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Countdown timer & Shuffle Trap
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }

        // Shuffle trap at level 10: every 10s shuffle unmatched unrevealed cards
        if (isShuffleTrap && t > 1 && t % 10 === 0) {
          setCards(prev => {
            const indicesToShuffle: number[] = [];
            prev.forEach((c, idx) => {
              if (!c.isMatched && !c.isFlipped) indicesToShuffle.push(idx);
            });
            if (indicesToShuffle.length > 2) {
              const updated = [...prev];
              // Shuffle the items at these indices
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

        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, isShuffleTrap]);

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

      const firstSymbol = newCards[newFlipped[0]].symbolIndex;
      const isAllMatched = newFlipped.every(idx => newCards[idx].symbolIndex === firstSymbol);

      if (isAllMatched) {
        // MATCH!
        playSound('correct');
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        const addedScore = (isTripleMatch ? 250 : 150) + (nextCombo * 40) + (effectiveLevel * 20);
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

          if (nextMatchedCount >= pairCount) {
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

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Điểm (Chuỗi: x{combo})</span>
          <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 mt-0.5">
            {score}
          </div>
        </div>

        <div className="text-center">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Ghép đôi</span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">
            {matchedPairsCount} / {pairCount}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Thời gian</span>
          <div className={`text-2xl sm:text-3xl font-black mt-0.5 ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Instruction Tip */}
      <div className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
        Lật mở từng thẻ để ghép cặp các biểu tượng giống nhau. Lật đúng liên tiếp để nhân điểm combo!
      </div>

      {/* 3D Card Grid */}
      <div className={`grid ${gridColsClass} gap-2.5 sm:gap-4 perspective-1000`}>
        {cards.map((card, idx) => {
          const iconMeta = CARD_ICONS[card.symbolIndex];
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
                  className={`absolute inset-0 rounded-2xl sm:rounded-3xl flex items-center justify-center border-2 border-brand-200 dark:border-brand-900/60 bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-600 text-white font-black shadow-lg backface-hidden ${
                    !card.isMatched && 'hover:scale-[1.04] active:scale-95 transition-transform'
                  }`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <Sparkles className="w-7 h-7 sm:w-9 sm:h-9 opacity-80 group-hover:rotate-12 transition-transform" />
                </div>

                {/* Front of Card (Revealed Symbol) */}
                <div 
                  className={`absolute inset-0 rounded-2xl sm:rounded-3xl flex items-center justify-center border-2 shadow-lg backface-hidden transition-all ${
                    card.isMatched 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 opacity-90' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <IconComp className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${card.isMatched ? 'text-emerald-500 scale-110' : iconMeta.color} transition-transform`} />
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
          onRestart={initGame}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
