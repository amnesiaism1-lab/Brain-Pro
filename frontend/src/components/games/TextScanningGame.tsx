import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { calculateGameScore, IReadingText, SAMPLE_READING_TEXTS } from '@brain-exercises/shared';
import { Search, BookOpen, Check, Target, Sparkles, RotateCcw } from 'lucide-react';
import { useRelationSession } from '../../hooks/useRelationSession';
import { ReadingTextSourceModal } from '../common/ReadingTextSourceModal';
import { readingContentService } from '../../services/readingContentService';

export const TextScanningGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const lastScanTimeRef = useRef<number>(Date.now());
  const effectiveLevel = getExerciseLevel('text-scanning') || currentLevel;
  const isInfinity = effectiveLevel >= 13;
  const infinityTier = isInfinity ? effectiveLevel - 12 : 0;

  // Level 9-12 or Infinity is MULTI_TARGET_SCAN (3 to 6 keywords simultaneously)
  const isMultiTarget = effectiveLevel >= 9;
  const targetCount = isInfinity 
    ? Math.min(6, 3 + Math.floor(infinityTier / 2)) 
    : isMultiTarget ? 3 : 1;

  const allTexts = readingContentService.getAllTexts();
  const englishTexts = allTexts.filter(t => t.language === 'en');
  const [currentArticle, setCurrentArticle] = useState<IReadingText>(() => {
    if (isInfinity && englishTexts.length > 0) {
      return englishTexts[(effectiveLevel - 13) % englishTexts.length];
    }
    return allTexts[(effectiveLevel - 1) % allTexts.length] || SAMPLE_READING_TEXTS[0];
  });
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const rawText = currentArticle.content;
  const words = useMemo(() => rawText.split(/\s+/).filter(Boolean), [rawText]);

  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundIndices, setFoundIndices] = useState<number[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Pick target keywords from text
  const initTargets = (articleText: string) => {
    const candidates = readingContentService.extractKeywordsFromArticle(articleText, 4, 8, 20);
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, targetCount);

    if (selected.length < targetCount) {
      const vocab = readingContentService.getVocabularyList();
      for (const v of vocab) {
        if (!selected.includes(v.toLowerCase()) && selected.length < targetCount) {
          selected.push(v.toLowerCase());
        }
      }
    }

    setTargetWords(selected);
    setFoundWords([]);
    setFoundIndices([]);
    setElapsedSec(0);
    setIsFinished(false);
  };

  useEffect(() => {
    initTargets(currentArticle.content);
    const timer = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [currentArticle, currentLevel]);

  const handleWordClick = (word: string, idx: number) => {
    if (isFinished) return;
    playSound('click');

    const cleanWord = word.replace(/[.,()—":;?!]/g, '').trim().toLowerCase();
    
    // Check if clicked word matches any unfound target
    const matchedTarget = targetWords.find(t => {
      const cleanTarget = t.toLowerCase();
      return cleanWord.includes(cleanTarget) || cleanTarget.includes(cleanWord);
    });

    const isCorrect = Boolean(matchedTarget && !foundWords.includes(matchedTarget));
    const now = Date.now();
    const respMs = Math.min(20000, Math.max(100, now - lastScanTimeRef.current));
    lastScanTimeRef.current = now;

    emitTrialEvent({
      exerciseSlug: 'text-scanning',
      level: effectiveLevel,
      relationId: 'TARGET_DISTRACTOR',
      relationWeight: 1.0,
      entities: { 
        target: matchedTarget || targetWords.join(', '), 
        clicked: cleanWord, 
        index: idx,
        isMultiTarget,
        articleTitle: currentArticle.title
      },
      stateBefore: `found:${foundWords.length}`,
      stateAfter: isCorrect ? `found:${foundWords.length + 1}` : `found:${foundWords.length}`,
      responseMs: respMs,
      correct: isCorrect
    });

    if (isCorrect && matchedTarget) {
      playSound('correct');
      const nextFoundWords = [...foundWords, matchedTarget];
      const nextIndices = [...foundIndices, idx];
      setFoundWords(nextFoundWords);
      setFoundIndices(nextIndices);

      if (nextFoundWords.length >= targetWords.length) {
        playSound('victory');
        setTimeout(() => {
          setIsFinished(true);
        }, 500);
      }
    } else {
      playSound('wrong');
    }
  };

  const handleSelectNewArticle = (article: IReadingText) => {
    setCurrentArticle(article);
  };

  const handleRestart = () => {
    playSound('click');
    initTargets(currentArticle.content);
  };

  const score = calculateGameScore({
    level: effectiveLevel,
    accuracyRate: 100,
    timeLimitSec: 45,
    timeSpentSec: elapsedSec
  });

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Infinity Level Badge Banner */}
      {isInfinity && (
        <div className="rounded-2xl p-3 bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-pink-900/50 border border-purple-500/40 text-purple-200 text-xs shadow-lg backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-400/30">
              ∞-{['I','II','III','IV','V','VI','VII','VIII','IX','X'][effectiveLevel - 13]}
            </span>
            <span className="font-semibold text-white">
              {effectiveLevel === 13 ? 'English Technical Scanning (Quét từ khóa chuyên môn Anh ngữ)' :
               effectiveLevel === 14 ? 'Bilingual Scanning (Quét song ngữ Anh - Việt)' :
               effectiveLevel === 15 ? 'High Density Multi-Target (Quét 4 từ khóa đồng thời)' :
               effectiveLevel === 16 ? 'Live News Keyword Scan (Quét nhanh dòng sự kiện)' :
               effectiveLevel === 17 ? 'Speed Rush Scan (Quét tốc hành dưới 30s)' :
               effectiveLevel === 18 ? 'Semantic Concept Scan (Nhận diện khái niệm trừu tượng)' :
               effectiveLevel === 19 ? 'Noisy Camouflage Scan (Vượt lớp ngụy trang nhiễu)' :
               effectiveLevel === 20 ? 'Scientific Article Deep Scan (Khảo sát bài nghiên cứu)' :
               effectiveLevel === 21 ? 'Mirror Orientation Scan (Đảo góc định hướng)' :
               'Chaos Blitz Scanning (6 từ khóa đồng thời Vô cực)'}
            </span>
          </div>
          <span className="text-[11px] text-purple-300/80 hidden sm:inline">Thử thách Vô Cực</span>
        </div>
      )}

      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Tiến trình quét từ</span>
            <div className="text-base sm:text-2xl font-black text-slate-800 dark:text-white">
              {foundWords.length} / {targetWords.length} từ
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            playSound('click');
            setIsSourceModalOpen(true);
          }}
          className="py-2 px-3.5 sm:px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all btn-press shadow-sm"
        >
          <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Đổi bài đọc / Tải Wikipedia</span>
        </button>

        <div className="text-right">
          <span className="text-xs text-slate-500 font-medium">Thời gian</span>
          <div className="text-xl sm:text-3xl font-black text-slate-800 dark:text-white">
            {elapsedSec}s
          </div>
        </div>
      </div>

      {/* Target Word Mission Panel */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-600" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300">
              {isMultiTarget ? 'Nhiệm vụ: Quét tìm 3 từ khóa đồng thời' : 'Nhiệm vụ: Quét nhanh từ khóa'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-full">
            {isMultiTarget ? 'Biến thể Siêu phẩm Cấp 9+' : 'Tìm kiếm mục tiêu'}
          </span>
        </div>

        {/* Target Words Badges */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          {targetWords.map((target, idx) => {
            const isFound = foundWords.includes(target);
            return (
              <div
                key={idx}
                className={`py-2 px-3.5 rounded-2xl border flex items-center gap-2 transition-all duration-300 ${
                  isFound
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-400/30'
                    : 'bg-brand-50/80 dark:bg-slate-700/60 border-brand-200 dark:border-slate-600 text-brand-700 dark:text-brand-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                  isFound ? 'bg-emerald-500 text-white' : 'bg-brand-600 text-white'
                }`}>
                  {isFound ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                </div>
                <span className={`text-sm sm:text-base font-black ${isFound ? 'line-through opacity-80' : ''}`}>
                  "{target}"
                </span>
                {isFound && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Đã tìm thấy!
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Parchment Text Area with Clickable Scanning Words */}
      <div className="rounded-3xl bg-[#FDFBF7] dark:bg-slate-900 border-2 border-[#D5CBB9] dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
        {/* Article Meta Bar */}
        <div className="px-6 py-3.5 bg-[#F5EFE6] dark:bg-slate-800/80 border-b border-[#E6DDCE] dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-[11px] font-black shrink-0">
              {currentArticle.category}
            </span>
            <span className="truncate font-bold text-slate-800 dark:text-slate-100">
              {currentArticle.title}
            </span>
          </div>
          <span className="text-slate-400 text-[11px] shrink-0 pl-2">
            {words.length} từ
          </span>
        </div>

        {/* Text Area Matrix with Natural Inline Flow (Zero Overlap & Zero Collapse) */}
        <div className="p-6 sm:p-10 md:p-12 leading-[2.6] sm:leading-[3.0] text-base sm:text-lg md:text-xl text-slate-800 dark:text-slate-200 select-none max-h-[420px] overflow-y-auto">
          {words.map((word, idx) => {
            const isFound = foundIndices.includes(idx);
            return (
              <React.Fragment key={idx}>
                <span
                  onClick={() => handleWordClick(word, idx)}
                  className={`inline align-baseline px-1.5 py-0.5 rounded-md cursor-pointer transition-colors duration-150 font-medium ${
                    isFound
                      ? 'bg-emerald-500 text-white font-bold shadow-sm ring-2 ring-emerald-300'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-amber-200/80 dark:hover:bg-slate-700'
                  }`}
                >
                  {word}
                </span>
                {' '}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleRestart}
          className="py-3 px-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-50 flex items-center gap-2 btn-press"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Tìm từ khóa khác trong bài</span>
        </button>
      </div>

      {/* Text Source Selection Modal */}
      <ReadingTextSourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        currentText={currentArticle}
        onSelectText={handleSelectNewArticle}
      />

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={100}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            handleRestart();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
