import React, { useState, useMemo } from 'react';
import { IVocalPhrase } from '../../../services/vocalFileAnalysisService';
import { PhraseViewMode, SingSessionStats } from '../types';
import { formatTimeMs } from '../utils/vocalHelpers';
import { DifficultyBadge } from './DifficultyBadge';
import { 
  Layers, 
  Clock, 
  Repeat, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Filter, 
  Grid3X3, 
  Calendar 
} from 'lucide-react';

interface PhraseNavigatorDeckProps {
  phrases: IVocalPhrase[];
  durationMs: number;
  currentTimeMs: number;
  activePhraseIndex: number | null;
  selectedPhraseIndex: number | null;
  isLoopingActive: boolean;
  sessionStats: SingSessionStats;
  onLoopPhrase: (phrase: IVocalPhrase) => void;
  onSeekToPhrase: (timeMs: number) => void;
  onClearLoop: () => void;
}

export const PhraseNavigatorDeck: React.FC<PhraseNavigatorDeckProps> = ({
  phrases,
  durationMs,
  currentTimeMs,
  activePhraseIndex,
  selectedPhraseIndex,
  isLoopingActive,
  sessionStats,
  onLoopPhrase,
  onSeekToPhrase,
  onClearLoop,
}) => {
  const [viewMode, setViewMode] = useState<PhraseViewMode>('timeline_minutes');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Dễ' | 'Trung bình' | 'Thử thách'>('all');

  // Filter phrases according to current view mode & difficulty filter
  const filteredPhrases = useMemo(() => {
    let list = phrases;
    if (difficultyFilter !== 'all') {
      list = list.filter((p) => p.difficulty === difficultyFilter);
    }
    if (viewMode === 'needs_practice') {
      list = list.filter((p) => {
        const score = sessionStats.phraseScores[p.phraseIndex];
        const pct = score && score.total > 0 ? (score.inTune / score.total) * 100 : null;
        return p.difficulty === 'Thử thách' || pct === null || pct < 75;
      });
    }
    return list;
  }, [phrases, difficultyFilter, viewMode, sessionStats]);

  // Group phrases by 1-minute blocks for 'timeline_minutes' mode
  const minuteGroups = useMemo(() => {
    const groups: Record<number, IVocalPhrase[]> = {};
    phrases.forEach((phrase) => {
      const minuteIndex = Math.floor(phrase.startMs / 60000);
      if (!groups[minuteIndex]) {
        groups[minuteIndex] = [];
      }
      groups[minuteIndex].push(phrase);
    });
    return groups;
  }, [phrases]);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/70 border border-slate-800 shadow-xl space-y-4">
      
      {/* Header Bar with View Mode Selectors and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Trình Điều Hướng Phân Đoạn &amp; Câu Hát</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {phrases.length} câu ({formatTimeMs(durationMs)})
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Chọn câu để tập trung luyện đúng cao độ hoặc bật lặp A-B</p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('timeline_minutes')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
              viewMode === 'timeline_minutes'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Nhóm các câu theo từng phút"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Theo Phút</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
              viewMode === 'grid'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Dàn đều tất cả câu thành nhiều hàng"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Lưới Đa Hàng</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('needs_practice')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
              viewMode === 'needs_practice'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Lọc các câu khó hoặc câu cần cải thiện điểm số"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Cần Luyện Lại</span>
          </button>
        </div>
      </div>

      {/* Mini-Map Overview Timeline Scrubber */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Bản đồ phân đoạn toàn bài (Click vào câu để tua):</span>
          <span>{formatTimeMs(currentTimeMs)} / {formatTimeMs(durationMs)}</span>
        </div>

        <div className="h-4 w-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex relative p-0.5 gap-0.5">
          {phrases.map((phrase) => {
            const widthPct = Math.max(1.5, (phrase.durationMs / durationMs) * 100);
            const isCurrent = activePhraseIndex === phrase.phraseIndex;
            const isLoop = isLoopingActive && selectedPhraseIndex === phrase.phraseIndex;

            const score = sessionStats.phraseScores[phrase.phraseIndex];
            const hasPracticed = score && score.total > 0;
            const pct = hasPracticed ? (score.inTune / score.total) * 100 : null;

            let blockColor = 'bg-slate-800/80 hover:bg-slate-700';
            if (isLoop) {
              blockColor = 'bg-indigo-500 animate-pulse ring-1 ring-white';
            } else if (isCurrent) {
              blockColor = 'bg-sky-400 ring-1 ring-sky-200';
            } else if (pct !== null) {
              blockColor = pct >= 80 ? 'bg-emerald-600/70' : pct >= 60 ? 'bg-amber-600/70' : 'bg-rose-600/70';
            } else if (phrase.difficulty === 'Thử thách') {
              blockColor = 'bg-rose-950/60 border border-rose-500/30';
            }

            return (
              <button
                key={phrase.id}
                type="button"
                onClick={() => onSeekToPhrase(phrase.startMs)}
                style={{ width: `${widthPct}%` }}
                className={`h-full rounded-md transition-all relative group shrink-0 ${blockColor}`}
                title={`Câu ${phrase.phraseIndex} (${formatTimeMs(phrase.startMs)} - ${formatTimeMs(phrase.endMs)})`}
              />
            );
          })}
        </div>
      </div>

      {/* VIEW MODE 1: GROUPED BY MINUTES */}
      {viewMode === 'timeline_minutes' && (
        <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
          {Object.entries(minuteGroups).map(([minStr, groupPhrases]) => {
            const minNum = Number(minStr);
            const startLabel = `${minNum}:00`;
            const endLabel = `${minNum + 1}:00`;

            return (
              <div key={minStr} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-bold text-white">
                      Khung {startLabel} – {endLabel}
                    </span>
                    <span className="text-[10px] text-slate-400">({groupPhrases.length} câu)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
                  {groupPhrases.map((phrase) => renderPhraseCard(phrase))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: MULTI-ROW RESPONSIVE GRID */}
      {viewMode === 'grid' && (
        <div className="space-y-3">
          {/* Quick difficulty filter pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] uppercase font-mono text-slate-500 mr-1">Lọc:</span>
            {(['all', 'Dễ', 'Trung bình', 'Thử thách'] as const).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficultyFilter(diff)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  difficultyFilter === diff
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {diff === 'all' ? 'Tất cả câu' : diff}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredPhrases.map((phrase) => renderPhraseCard(phrase))}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: NEEDS PRACTICE FOCUS */}
      {viewMode === 'needs_practice' && (
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Danh sách {filteredPhrases.length} câu thử thách hoặc có tỉ lệ chuẩn dưới 75%. Hãy luyện lặp chậm từng câu!
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredPhrases.map((phrase) => renderPhraseCard(phrase))}
          </div>
        </div>
      )}

    </div>
  );

  // Helper to render individual phrase card
  function renderPhraseCard(phrase: IVocalPhrase) {
    const isCurrent = activePhraseIndex === phrase.phraseIndex;
    const isLoop = isLoopingActive && selectedPhraseIndex === phrase.phraseIndex;

    const score = sessionStats.phraseScores[phrase.phraseIndex];
    const hasPracticed = score && score.total > 0;
    const pct = hasPracticed ? Math.round((score.inTune / score.total) * 100) : null;

    let cardBorder = 'border-slate-800/90 bg-slate-900/70 hover:border-slate-700';
    if (isLoop) {
      cardBorder = 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/60 shadow-lg shadow-indigo-500/10';
    } else if (isCurrent) {
      cardBorder = 'border-sky-500 bg-sky-950/40 ring-1 ring-sky-500/60 shadow-lg shadow-sky-500/10';
    }

    return (
      <div
        key={phrase.id}
        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${cardBorder}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-xs">Câu {phrase.phraseIndex}</span>
              <DifficultyBadge difficulty={phrase.difficulty} />
              {isLoop && (
                <span className="px-1.5 py-0.2 rounded bg-indigo-500 text-slate-950 text-[9px] font-black uppercase">
                  Đang lặp
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              <span>{formatTimeMs(phrase.startMs)} – {formatTimeMs(phrase.endMs)}</span>
              <span className="text-slate-500 ml-1">({Math.round(phrase.durationMs / 1000)}s)</span>
            </div>
          </div>

          {/* Past accuracy badge */}
          {pct !== null ? (
            <div className={`text-right ${pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
              <div className="text-xs font-black font-mono">{pct}%</div>
              <div className="text-[9px] text-slate-500 uppercase font-mono">Đã đạt</div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 italic">Chưa hát</div>
          )}
        </div>

        {/* Note span info */}
        <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/60">
          <span className="text-slate-400 font-mono text-[10px]">
            Quãng: <strong className="text-sky-300">{phrase.lowestNote}</strong> → <strong className="text-sky-300">{phrase.highestNote}</strong>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Nhảy {phrase.pitchJumpSemitones} bán âm
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => onSeekToPhrase(phrase.startMs)}
            className="flex-1 py-1 px-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition"
          >
            <Play className="w-3 h-3 fill-slate-300" />
            <span>Tua đến</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isLoop) {
                onClearLoop();
              } else {
                onLoopPhrase(phrase);
              }
            }}
            className={`py-1 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition ${
              isLoop
                ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900'
                : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
            }`}
          >
            <Repeat className="w-3 h-3" />
            <span>{isLoop ? 'Hủy Lặp' : 'Lặp A-B'}</span>
          </button>
        </div>
      </div>
    );
  }
};
