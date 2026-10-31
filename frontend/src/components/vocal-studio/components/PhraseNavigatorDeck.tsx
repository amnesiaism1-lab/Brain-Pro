import React, { useState, useMemo } from 'react';
import { IVocalPhrase } from '../../../services/vocalFileAnalysisService';
import { PhraseViewMode, SingSessionStats } from '../types';
import { formatTimeMs } from '../utils/vocalHelpers';
import { DifficultyBadge } from './DifficultyBadge';
import {
  searchAndTracePhrases,
  VocalSectionType,
  DuetSingerId,
} from '../../../services/lyricAlignmentService';
import {
  Layers,
  Clock,
  Repeat,
  Play,
  AlertCircle,
  Sparkles,
  Filter,
  Grid3X3,
  Search,
  X,
  MapPin,
  Edit3,
  Scissors,
  Merge,
  Check,
  FileText,
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
  onOpenLyricModal?: () => void;
  onUpdatePhraseLyric?: (phraseIndex: number, newText: string) => void;
  onMergeNextPhrase?: (phraseIndex: number) => void;
  onSplitPhrase?: (phraseIndex: number, splitTimeMs?: number) => void;
  playbackSpeed?: number;
  onChangeSpeed?: (spd: number) => void;
}

const SECTION_BADGE_STYLE: Record<VocalSectionType, string> = {
  intro: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  verse: 'bg-slate-800 text-slate-300 border-slate-700',
  pre_chorus: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  chorus: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  climax: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  bridge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  outro: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
};

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
  onOpenLyricModal,
  onUpdatePhraseLyric,
  onMergeNextPhrase,
  onSplitPhrase,
  playbackSpeed = 1.0,
  onChangeSpeed,
}) => {
  const [viewMode, setViewMode] = useState<PhraseViewMode>('grid');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'Dễ' | 'Trung bình' | 'Thử thách'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpracticed' | 'needs_work' | 'passed'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [singerFilter, setSingerFilter] = useState<'all' | DuetSingerId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedPhraseIdx, setInspectedPhraseIdx] = useState<number | null>(null);
  const [editingPhraseIdx, setEditingPhraseIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const hasDuetVoices = useMemo(
    () =>
      phrases.some(
        (p) => p.singerId === 'voice_a' || p.singerId === 'voice_b' || p.singerId === 'both'
      ),
    [phrases]
  );

  // Group contiguous phrases into structural song landmarks ("Biết đang ở đoạn nào")
  const structuralLandmarks = useMemo(() => {
    const groups: Array<{
      id: string;
      label: string;
      sectionType: VocalSectionType;
      startPhraseIdx: number;
      endPhraseIdx: number;
      startMs: number;
      endMs: number;
    }> = [];

    phrases.forEach((p) => {
      const label = p.sectionLabel || 'Phiên khúc';
      const sType = p.sectionType || 'verse';
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.endPhraseIdx = p.phraseIndex;
        last.endMs = p.endMs;
      } else {
        groups.push({
          id: `sec-${p.phraseIndex}`,
          label,
          sectionType: sType,
          startPhraseIdx: p.phraseIndex,
          endPhraseIdx: p.phraseIndex,
          startMs: p.startMs,
          endMs: p.endMs,
        });
      }
    });
    return groups;
  }, [phrases]);

  // Filter & Search phrases
  const filteredPhrases = useMemo(() => {
    let list = searchQuery.trim()
      ? searchAndTracePhrases(phrases, searchQuery)
      : phrases;

    if (sectionFilter !== 'all') {
      list = list.filter((p) => (p.sectionLabel || 'Phiên khúc') === sectionFilter);
    }

    if (singerFilter !== 'all') {
      list = list.filter(
        (p) => p.singerId === singerFilter || (singerFilter !== 'both' && p.singerId === 'both')
      );
    }

    if (difficultyFilter !== 'all') {
      list = list.filter((p) => p.difficulty === difficultyFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter((p) => {
        const score = sessionStats.phraseScores[p.phraseIndex];
        const pct = score && score.total > 0 ? Math.round((score.inTune / score.total) * 100) : null;
        if (statusFilter === 'unpracticed') return pct === null;
        if (statusFilter === 'needs_work') return pct !== null && pct < 75;
        if (statusFilter === 'passed') return pct !== null && pct >= 75;
        return true;
      });
    }

    if (viewMode === 'needs_practice') {
      list = list.filter((p) => {
        const score = sessionStats.phraseScores[p.phraseIndex];
        const pct = score && score.total > 0 ? (score.inTune / score.total) * 100 : null;
        return p.difficulty === 'Thử thách' || pct === null || pct < 75;
      });
    }

    return list;
  }, [
    phrases,
    searchQuery,
    sectionFilter,
    singerFilter,
    difficultyFilter,
    statusFilter,
    viewMode,
    sessionStats,
  ]);

  // Group phrases by 1-minute blocks for 'timeline_minutes' mode
  const minuteGroups = useMemo(() => {
    const groups: Record<number, IVocalPhrase[]> = {};
    filteredPhrases.forEach((phrase) => {
      const minuteIndex = Math.floor(phrase.startMs / 60000);
      if (!groups[minuteIndex]) {
        groups[minuteIndex] = [];
      }
      groups[minuteIndex].push(phrase);
    });
    return groups;
  }, [filteredPhrases]);

  const focusedPhrase = useMemo(() => {
    const targetIdx = inspectedPhraseIdx ?? selectedPhraseIndex ?? activePhraseIndex;
    if (!targetIdx) return phrases[0] || null;
    return phrases.find((p) => p.phraseIndex === targetIdx) || phrases[0] || null;
  }, [phrases, inspectedPhraseIdx, selectedPhraseIndex, activePhraseIndex]);

  const handleSaveEdit = (phraseIndex: number) => {
    if (onUpdatePhraseLyric && editDraft.trim()) {
      onUpdatePhraseLyric(phraseIndex, editDraft.trim());
    }
    setEditingPhraseIdx(null);
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/75 border border-slate-800 shadow-xl space-y-4">
      {/* 1. Header Bar + Lyric Editor Action + View Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Trình Điều Hướng Câu Hát, Tra Cứu Lyric &amp; Định Vị Đoạn</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {filteredPhrases.length}/{phrases.length} câu ({formatTimeMs(durationMs)})
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Tìm nhanh theo lời bài hát, âm tiết khẩu hình, đoạn cao trào, số câu hoặc mốc thời gian
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenLyricModal && (
            <button
              type="button"
              onClick={onOpenLyricModal}
              className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Đồng Bộ / Sửa Toàn Bộ Lyric</span>
            </button>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Dàn đều các câu kèm lời bài hát"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Danh Sách Câu</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('timeline_minutes')}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
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
              onClick={() => setViewMode('needs_practice')}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
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
      </div>

      {/* 2. Search & Trace Bar + Quick Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tra cứu lyric, âm tiết (La/Ơi/Đô), đoạn ('điệp khúc', 'cao trào'), 'câu 3' hoặc mốc '00:12'..."
            className="w-full pl-9 pr-9 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status & Difficulty Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-0.5" />
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'unpracticed', label: 'Chưa hát' },
              { id: 'needs_work', label: 'Cần luyện (<75%)' },
              { id: 'passed', label: 'Đã đạt (≥75%)' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition ${
                statusFilter === st.id
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          {(['all', 'Thử thách'] as const).map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setDifficultyFilter(difficultyFilter === diff ? 'all' : diff)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition ${
                difficultyFilter === diff && diff !== 'all'
                  ? 'bg-rose-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {diff === 'all' ? 'Mọi độ khó' : '🔥 Câu khó'}
            </button>
          ))}

          {hasDuetVoices && (
            <>
              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />
              {(
                [
                  { id: 'all', label: 'Tất cả giọng' },
                  { id: 'voice_a', label: '🎤 Giọng A (Trầm)' },
                  { id: 'voice_b', label: '✨ Giọng B (Cao)' },
                  { id: 'both', label: '👥 Song ca' },
                ] as const
              ).map((sg) => (
                <button
                  key={sg.id}
                  type="button"
                  onClick={() => setSingerFilter(singerFilter === sg.id ? 'all' : sg.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition ${
                    singerFilter === sg.id && sg.id !== 'all'
                      ? sg.id === 'voice_a'
                        ? 'bg-cyan-500 text-slate-950'
                        : sg.id === 'voice_b'
                        ? 'bg-pink-500 text-slate-950'
                        : 'bg-purple-500 text-slate-950'
                      : singerFilter === 'all' && sg.id === 'all'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {sg.label}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* 3. Structural Section Landmarks ("Bản đồ Đoạn nhạc - Biết đang ở đoạn nào") */}
      {structuralLandmarks.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-indigo-400" />
              <span>Cấu trúc đoạn bài hát (Nhấn vào đoạn để lọc hoặc nhảy tới):</span>
            </span>
            <span>
              Vị trí hiện tại: <strong className="text-sky-400">{formatTimeMs(currentTimeMs)}</strong> / {formatTimeMs(durationMs)}
            </span>
          </div>

          {/* Section Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => setSectionFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 border transition ${
                sectionFilter === 'all'
                  ? 'bg-slate-200 text-slate-950 border-white'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              Toàn bài ({phrases.length} câu)
            </button>

            {structuralLandmarks.map((sec) => {
              const isPlayingHere =
                currentTimeMs >= sec.startMs - 200 && currentTimeMs <= sec.endMs + 200;
              const isSelectedSec = sectionFilter === sec.label;
              const badgeColor =
                SECTION_BADGE_STYLE[sec.sectionType] || SECTION_BADGE_STYLE.verse;

              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setSectionFilter(isSelectedSec ? 'all' : sec.label);
                    onSeekToPhrase(sec.startMs);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 border transition flex items-center gap-1.5 ${
                    isSelectedSec
                      ? 'ring-2 ring-sky-400 bg-sky-950 text-sky-200 border-sky-400'
                      : isPlayingHere
                      ? 'ring-1 ring-emerald-400 bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                      : badgeColor
                  }`}
                >
                  {isPlayingHere && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                  <span>{sec.label}</span>
                  <span className="text-[10px] font-mono opacity-75">
                    (Câu {sec.startPhraseIdx}
                    {sec.endPhraseIdx > sec.startPhraseIdx ? `–${sec.endPhraseIdx}` : ''})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mini-Map Scrubber */}
          <div className="h-4 w-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex relative p-0.5 gap-0.5">
            {phrases.map((phrase) => {
              const widthPct = Math.max(1.5, (phrase.durationMs / Math.max(1, durationMs)) * 100);
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
                blockColor =
                  pct >= 80
                    ? 'bg-emerald-600/70'
                    : pct >= 60
                    ? 'bg-amber-600/70'
                    : 'bg-rose-600/70';
              } else if (phrase.difficulty === 'Thử thách') {
                blockColor = 'bg-rose-950/60 border border-rose-500/30';
              }

              return (
                <button
                  key={phrase.id}
                  type="button"
                  onClick={() => {
                    setInspectedPhraseIdx(phrase.phraseIndex);
                    onSeekToPhrase(phrase.startMs);
                  }}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full rounded-md transition-all relative group shrink-0 ${blockColor}`}
                  title={`Câu ${phrase.phraseIndex} [${phrase.sectionLabel || 'Phiên khúc'}]: "${
                    phrase.lyricText || phrase.solfegeText
                  }" (${formatTimeMs(phrase.startMs)} - ${formatTimeMs(phrase.endMs)})`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SELECTED PHRASE INSPECTOR & WORD-BY-WORD DIAGNOSTIC BAR (Zone 3) */}
      {focusedPhrase && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/95 via-indigo-950/30 to-slate-900/95 border border-indigo-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-indigo-500 text-slate-950 font-black text-xs">
                Đang chọn: Câu {focusedPhrase.phraseIndex}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-sky-300 text-[11px] font-bold">
                {focusedPhrase.sectionLabel || 'Phiên khúc'}
              </span>
              {focusedPhrase.singerId && focusedPhrase.singerId !== 'solo' && (
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                    focusedPhrase.singerId === 'voice_a'
                      ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                      : focusedPhrase.singerId === 'voice_b'
                      ? 'bg-pink-950/80 border-pink-500/40 text-pink-300'
                      : 'bg-purple-950/80 border-purple-500/40 text-purple-300'
                  }`}
                >
                  {focusedPhrase.singerId === 'voice_a'
                    ? `🎤 ${focusedPhrase.singerLabel || 'Giọng A'}`
                    : focusedPhrase.singerId === 'voice_b'
                    ? `✨ ${focusedPhrase.singerLabel || 'Giọng B'}`
                    : `👥 ${focusedPhrase.singerLabel || 'Song ca'}`}
                </span>
              )}
              <span className="text-[11px] font-mono text-slate-400">
                {formatTimeMs(focusedPhrase.startMs)} – {formatTimeMs(focusedPhrase.endMs)} (
                {focusedPhrase.lowestNote} → {focusedPhrase.highestNote})
              </span>
              {focusedPhrase.contourLabel && (
                <span className="text-[10px] text-amber-300 font-medium">
                  • {focusedPhrase.contourLabel}
                </span>
              )}
            </div>

            {/* Legend for Vowel, Multi-Note Glide & Sustain */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
              <span>Quỹ đạo nguyên âm & nốt từng từ:</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-300">
                ↗ Đi lên (+bán âm)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300">
                ↘ Đi xuống (-bán âm)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300">
                ⤴ Luyến nốt (Thấp→Cao) / 〰 Ngân rung
              </span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                ⏳ Ngân dài
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                → Giữ ngang
              </span>
            </div>

            {/* Word-by-word Vowel, Multi-Note Glide, Sustain Duration & Accuracy Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {(focusedPhrase.words || []).map((w) => {
                const wKey = `${focusedPhrase.phraseIndex}_${w.wordIndex}`;
                const wStat = sessionStats.wordScores?.[wKey];
                const step = w.stepSemitones ?? 0;
                const stepTag = step > 0 ? `+${step}` : step < 0 ? `${step}` : '0';
                const arrow = w.trajectorySymbol || '→';
                const vowelBadge =
                  w.vowelPhoneme && !w.text.startsWith(w.vowelPhoneme)
                    ? `/${w.vowelPhoneme}/ `
                    : '';

                const hasMultiNoteGlide =
                  (w.noteSequence && w.noteSequence.length > 1) ||
                  (w.endNoteName && w.endNoteName !== w.noteName);
                const noteDisplay =
                  w.noteSequence && w.noteSequence.length > 1
                    ? w.noteSequence.join('→')
                    : w.endNoteName && w.endNoteName !== w.noteName
                    ? `${w.noteName}→${w.endNoteName}`
                    : w.noteName;
                const solfegeDisplay =
                  w.solfegeSequence && w.solfegeSequence.length > 1
                    ? w.solfegeSequence.join('→')
                    : w.endSolfege && w.endSolfege !== w.solfege
                    ? `${w.solfege}→${w.endSolfege}`
                    : w.solfege;

                const glideSt = w.glideSemitones ?? 0;
                const directionTag =
                  hasMultiNoteGlide && glideSt !== 0
                    ? `${arrow}${glideSt > 0 ? `+${glideSt}` : glideSt}st`
                    : `${arrow}${stepTag}`;

                const durSecStr =
                  w.isSustained && w.durationMs
                    ? ` · ⏳${(w.durationMs / 1000).toFixed(1)}s`
                    : '';

                const isWordPlayingNow =
                  currentTimeMs >= w.startMs - 30 && currentTimeMs <= w.endMs + 30;
                const wordProgressPct = isWordPlayingNow
                  ? Math.max(
                      0,
                      Math.min(
                        100,
                        ((currentTimeMs - w.startMs) / Math.max(80, w.endMs - w.startMs)) * 100
                      )
                    )
                  : 0;

                // Default color reflects melodic direction (Multi-note glide vs Up vs Down vs Sustained)
                let chipColor = 'bg-slate-950/80 border-slate-800 text-slate-200';
                if (
                  hasMultiNoteGlide ||
                  w.pitchTrajectory === 'arch' ||
                  w.pitchTrajectory === 'vibrato' ||
                  w.pitchTrajectory === 'dip'
                ) {
                  chipColor = 'bg-purple-950/45 border-purple-500/40 text-purple-200';
                } else if (step >= 1 || w.pitchTrajectory === 'rising') {
                  chipColor = 'bg-sky-950/45 border-sky-500/35 text-sky-200';
                } else if (step <= -1 || w.pitchTrajectory === 'falling') {
                  chipColor = 'bg-amber-950/40 border-amber-500/35 text-amber-200';
                } else if (w.isSustained) {
                  chipColor = 'bg-cyan-950/40 border-cyan-500/35 text-cyan-200';
                }

                let metaLabel = `${vowelBadge}${noteDisplay} (${directionTag})${durSecStr}`;

                if (wStat && wStat.total > 30) {
                  const cStr =
                    wStat.avgCentsDiff > 0 ? `+${wStat.avgCentsDiff}c` : `${wStat.avgCentsDiff}c`;
                  metaLabel = `${vowelBadge}${noteDisplay} (${directionTag})${durSecStr} · ${cStr}`;
                  if (wStat.status === 'in_tune') {
                    chipColor = 'bg-emerald-950/75 border-emerald-500/50 text-emerald-300';
                  } else if (wStat.status === 'flat') {
                    chipColor = 'bg-amber-950/75 border-amber-500/50 text-amber-300';
                  } else {
                    chipColor = 'bg-rose-950/75 border-rose-500/50 text-rose-300';
                  }
                }

                if (isWordPlayingNow) {
                  chipColor += ' ring-2 ring-sky-400 border-sky-300 shadow-md shadow-sky-500/20';
                }

                return (
                  <button
                    key={w.wordIndex}
                    type="button"
                    onClick={() => onSeekToPhrase(w.startMs)}
                    className={`relative overflow-hidden px-2.5 py-1 rounded-xl border text-xs flex items-center gap-1.5 hover:border-sky-400 transition ${
                      w.isSustained ? 'min-w-[140px] justify-between' : ''
                    } ${chipColor}`}
                    title={`Tua tới "${w.text}" (${solfegeDisplay}, ${
                      w.durationMs ? `${Math.round(w.durationMs)}ms` : ''
                    }) • Nguyên âm: /${w.vowelPhoneme || 'A'}/ (${w.vowelHint || ''})${
                      w.formantsHz ? ` [F1:${w.formantsHz[0]}Hz, F2:${w.formantsHz[1]}Hz]` : ''
                    } • ${w.trajectoryLabel || ''}${w.sustainLabel ? ` • ${w.sustainLabel}` : ''}`}
                  >
                    {isWordPlayingNow && (
                      <span
                        className="absolute inset-y-0 left-0 bg-sky-400/20 pointer-events-none transition-all duration-75"
                        style={{ width: `${wordProgressPct}%` }}
                      />
                    )}
                    <span className="relative z-10 font-black">
                      {w.text.includes(arrow) ? w.text : `${w.text}${arrow}`}
                    </span>
                    <span className="relative z-10 text-[10px] font-mono opacity-90">
                      [{metaLabel}]
                    </span>
                  </button>
                );
              })}
            </div>

            {focusedPhrase.focusTip && (
              <p className="text-[11px] text-slate-400 italic">
                💡 Mẹo luyện câu này: {focusedPhrase.focusTip}
              </p>
            )}
          </div>

          {/* Right Quick Practice Controls (Speed + Loop + Split/Merge) */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {onChangeSpeed && (
              <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px]">
                {[0.75, 0.85, 1.0].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => onChangeSpeed(spd)}
                    className={`px-2 py-1 rounded-lg font-mono font-bold transition ${
                      Math.abs(playbackSpeed - spd) < 0.02
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onLoopPhrase(focusedPhrase)}
              className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs flex items-center gap-1 transition shadow-md"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Luyện Lặp Câu {focusedPhrase.phraseIndex}</span>
            </button>

            {onSplitPhrase && focusedPhrase.durationMs >= 1200 && (
              <button
                type="button"
                onClick={() => onSplitPhrase(focusedPhrase.phraseIndex, currentTimeMs)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition"
                title="Tách câu này làm 2 câu nhỏ để dễ luyện hơn"
              >
                <Scissors className="w-3 h-3" />
                <span>Tách câu</span>
              </button>
            )}

            {onMergeNextPhrase && focusedPhrase.phraseIndex < phrases.length && (
              <button
                type="button"
                onClick={() => onMergeNextPhrase(focusedPhrase.phraseIndex)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition"
                title={`Gộp Câu ${focusedPhrase.phraseIndex} với Câu ${focusedPhrase.phraseIndex + 1}`}
              >
                <Merge className="w-3 h-3" />
                <span>Gộp câu sau</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. PHRASE CARDS DISPLAY */}
      {filteredPhrases.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-400">
            Không tìm thấy câu hát nào khớp với từ khóa hoặc bộ lọc hiện tại.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSectionFilter('all');
              setDifficultyFilter('all');
              setStatusFilter('all');
              setViewMode('grid');
            }}
            className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 text-xs font-bold hover:bg-sky-500/30 transition"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : viewMode === 'timeline_minutes' ? (
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          {Object.entries(minuteGroups).map(([minStr, groupPhrases]) => {
            const minNum = Number(minStr);
            const startLabel = `${minNum}:00`;
            const endLabel = `${minNum + 1}:00`;

            return (
              <div
                key={minStr}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-bold text-white">
                      Khung {startLabel} – {endLabel}
                    </span>
                    <span className="text-[10px] text-slate-400">({groupPhrases.length} câu)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {groupPhrases.map((phrase) => renderPhraseCard(phrase))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {viewMode === 'needs_practice' && (
            <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Danh sách {filteredPhrases.length} câu thử thách hoặc có tỉ lệ chuẩn dưới 75%. Hãy bấm Lặp A-B và tập chậm ở 0.75x!
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredPhrases.map((phrase) => renderPhraseCard(phrase))}
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render individual phrase card with Lyric & Section Landmark
  function renderPhraseCard(phrase: IVocalPhrase) {
    const isCurrent = activePhraseIndex === phrase.phraseIndex;
    const isLoop = isLoopingActive && selectedPhraseIndex === phrase.phraseIndex;
    const isInspected = focusedPhrase?.phraseIndex === phrase.phraseIndex;
    const isEditing = editingPhraseIdx === phrase.phraseIndex;

    const score = sessionStats.phraseScores[phrase.phraseIndex];
    const hasPracticed = score && score.total > 0;
    const pct = hasPracticed ? Math.round((score.inTune / score.total) * 100) : null;

    let cardBorder = 'border-slate-800/90 bg-slate-900/75 hover:border-slate-700';
    if (isLoop) {
      cardBorder =
        'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/60 shadow-lg shadow-indigo-500/10';
    } else if (isCurrent) {
      cardBorder =
        'border-sky-500 bg-sky-950/40 ring-1 ring-sky-500/60 shadow-lg shadow-sky-500/10';
    } else if (isInspected) {
      cardBorder = 'border-slate-600 bg-slate-900/95';
    }

    const secBadgeClass =
      SECTION_BADGE_STYLE[phrase.sectionType || 'verse'] || SECTION_BADGE_STYLE.verse;

    return (
      <div
        key={phrase.id}
        onClick={() => setInspectedPhraseIdx(phrase.phraseIndex)}
        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 cursor-pointer ${cardBorder}`}
      >
        {/* Top Row: Phrase # + Section Badge + Accuracy */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-white text-xs">Câu {phrase.phraseIndex}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold truncate ${secBadgeClass}`}
              >
                {phrase.sectionLabel || 'Phiên khúc'}
              </span>
              {phrase.singerId && phrase.singerId !== 'solo' && (
                <span
                  className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold truncate ${
                    phrase.singerId === 'voice_a'
                      ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300'
                      : phrase.singerId === 'voice_b'
                      ? 'bg-pink-500/15 border-pink-500/35 text-pink-300'
                      : 'bg-purple-500/15 border-purple-500/35 text-purple-300'
                  }`}
                >
                  {phrase.singerId === 'voice_a'
                    ? '🎤 Giọng A'
                    : phrase.singerId === 'voice_b'
                    ? '✨ Giọng B'
                    : '👥 Song ca'}
                </span>
              )}
              <DifficultyBadge difficulty={phrase.difficulty} />
              {isLoop && (
                <span className="px-1.5 py-0.2 rounded bg-indigo-500 text-slate-950 text-[9px] font-black uppercase">
                  Đang lặp
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1">
              <span>
                {formatTimeMs(phrase.startMs)} – {formatTimeMs(phrase.endMs)}
              </span>
              <span className="text-slate-500 ml-1">
                ({Math.max(1, Math.round(phrase.durationMs / 1000))}s)
              </span>
            </div>
          </div>

          {/* Past accuracy badge */}
          {pct !== null ? (
            <div
              className={`text-right shrink-0 ${
                pct >= 75
                  ? 'text-emerald-400'
                  : pct >= 55
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              <div className="text-xs font-black font-mono">{pct}%</div>
              <div className="text-[9px] text-slate-400 uppercase font-mono">
                {pct >= 75 ? 'Đạt' : 'Cần luyện'}
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 italic shrink-0">Chưa hát</div>
          )}
        </div>

        {/* Middle Row: 1-Line Lyric Preview + Solfege Sub-line */}
        <div
          className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(phrase.phraseIndex);
                  if (e.key === 'Escape') setEditingPhraseIdx(null);
                }}
                autoFocus
                className="flex-1 px-2 py-1 rounded bg-slate-900 border border-sky-400 text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleSaveEdit(phrase.phraseIndex)}
                className="p-1 rounded bg-emerald-500 text-slate-950"
                title="Lưu"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <div
                  className="text-xs font-bold text-slate-100 truncate"
                  title={phrase.lyricText || phrase.solfegeText}
                >
                  {phrase.lyricText || phrase.solfegeText}
                </div>
                <div
                  className="text-[10px] font-mono text-sky-400/90 truncate"
                  title={phrase.solfegeText}
                >
                  ♫ {phrase.solfegeText || phrase.notes.join(' · ')}
                </div>
              </div>
              {onUpdatePhraseLyric && (
                <button
                  type="button"
                  onClick={() => {
                    setEditDraft(phrase.lyricText || '');
                    setEditingPhraseIdx(phrase.phraseIndex);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-sky-300 transition shrink-0"
                  title="Sửa lời câu này"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Note span info */}
        <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
          <span>
            Quãng: <strong className="text-sky-300">{phrase.lowestNote}</strong> →{' '}
            <strong className="text-sky-300">{phrase.highestNote}</strong>
          </span>
          <span>Nhảy {phrase.pitchJumpSemitones} bán âm</span>
        </div>

        {/* Action Buttons */}
        <div
          className="flex items-center gap-1.5 pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setInspectedPhraseIdx(phrase.phraseIndex);
              onSeekToPhrase(phrase.startMs);
            }}
            className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition"
          >
            <Play className="w-3 h-3 fill-slate-300" />
            <span>Tua đến</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInspectedPhraseIdx(phrase.phraseIndex);
              if (isLoop) {
                onClearLoop();
              } else {
                onLoopPhrase(phrase);
              }
            }}
            className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition ${
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
