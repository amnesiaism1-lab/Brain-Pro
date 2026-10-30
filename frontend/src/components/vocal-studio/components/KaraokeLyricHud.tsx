import React, { useState } from 'react';
import {
  MapPin,
  Sparkles,
  Edit3,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Music,
  TrendingUp,
} from 'lucide-react';
import { IVocalPhrase } from '../../../services/vocalFileAnalysisService';
import { LyricDisplayMode, LyricSourceType } from '../../../services/lyricAlignmentService';
import { SingSessionStats } from '../types';
import { formatTimeMs } from '../utils/vocalHelpers';

interface KaraokeLyricHudProps {
  phrases: IVocalPhrase[];
  currentTimeMs: number;
  activePhrase: IVocalPhrase | null;
  sessionStats: SingSessionStats;
  lyricSource?: LyricSourceType;
  matchedTrackTitle?: string;
  isLoopingActive: boolean;
  onSeek: (timeMs: number) => void;
  onLoopPhrase: (phrase: IVocalPhrase) => void;
  onOpenLyricModal: () => void;
  onQuickUpdatePhraseLyric?: (phraseIndex: number, newText: string) => void;
}

const SOURCE_LABELS: Record<LyricSourceType, { label: string; colorClass: string }> = {
  demo_builtin: {
    label: 'Lời chuẩn bài mẫu',
    colorClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  embedded_tag: {
    label: 'Lời trích xuất từ File Audio',
    colorClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  auto_lrclib: {
    label: 'Lời khớp tự động (LRCLIB)',
    colorClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  acoustic_relative: {
    label: 'Phổ Formant Nguyên Âm (F1-F2) & Quỹ Đạo Lên/Xuống',
    colorClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  lrc: {
    label: 'Đã đồng bộ file .LRC',
    colorClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  manual: {
    label: 'Lời đã chỉnh sửa',
    colorClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
};

export const KaraokeLyricHud: React.FC<KaraokeLyricHudProps> = ({
  phrases,
  currentTimeMs,
  activePhrase,
  sessionStats,
  lyricSource = 'acoustic_relative',
  matchedTrackTitle,
  isLoopingActive,
  onSeek,
  onLoopPhrase,
  onOpenLyricModal,
  onQuickUpdatePhraseLyric,
}) => {
  const [displayMode, setDisplayMode] = useState<LyricDisplayMode>('bilingual');
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineDraft, setInlineDraft] = useState('');

  const currentOrUpcomingPhrase = React.useMemo(() => {
    if (activePhrase) return activePhrase;
    if (phrases.length === 0) return null;
    const upcoming = phrases.find((p) => p.startMs > currentTimeMs);
    return upcoming || phrases[phrases.length - 1];
  }, [activePhrase, phrases, currentTimeMs]);

  const nextPhrase = React.useMemo(() => {
    if (!currentOrUpcomingPhrase) return null;
    return (
      phrases.find((p) => p.phraseIndex === currentOrUpcomingPhrase.phraseIndex + 1) || null
    );
  }, [currentOrUpcomingPhrase, phrases]);

  const prevPhrase = React.useMemo(() => {
    if (!currentOrUpcomingPhrase) return null;
    return (
      phrases.find((p) => p.phraseIndex === currentOrUpcomingPhrase.phraseIndex - 1) || null
    );
  }, [currentOrUpcomingPhrase, phrases]);

  if (!currentOrUpcomingPhrase) return null;

  const isWaitingForEntrance =
    !activePhrase && currentOrUpcomingPhrase.startMs > currentTimeMs;
  const countdownSec = isWaitingForEntrance
    ? Math.max(0, (currentOrUpcomingPhrase.startMs - currentTimeMs) / 1000).toFixed(1)
    : null;

  const words = currentOrUpcomingPhrase.words || [];
  const activeWord = words.find(
    (w) => currentTimeMs >= w.startMs - 40 && currentTimeMs <= w.endMs + 40
  );

  const sourceBadge = SOURCE_LABELS[lyricSource] || SOURCE_LABELS.acoustic_relative;

  const handleStartInlineEdit = () => {
    setInlineDraft(currentOrUpcomingPhrase.lyricText || '');
    setIsEditingInline(true);
  };

  const handleSaveInlineEdit = () => {
    if (onQuickUpdatePhraseLyric && inlineDraft.trim()) {
      onQuickUpdatePhraseLyric(currentOrUpcomingPhrase.phraseIndex, inlineDraft.trim());
    }
    setIsEditingInline(false);
  };

  return (
    <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-950 via-slate-900/95 to-slate-950 border-b border-slate-800/90 flex flex-col gap-2">
      {/* Top Row: Section Landmark Locator ("Đang ở đoạn nào") + Active Vowel & Pitch Trajectory */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Prev / Next Phrase quick buttons */}
          <div className="flex items-center gap-0.5 bg-slate-900 rounded-lg border border-slate-800 p-0.5">
            <button
              type="button"
              disabled={!prevPhrase}
              onClick={() => prevPhrase && onSeek(prevPhrase.startMs)}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition"
              title="Câu trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-black font-mono text-sky-400">
              Câu {currentOrUpcomingPhrase.phraseIndex}/{phrases.length}
            </span>
            <button
              type="button"
              disabled={!nextPhrase}
              onClick={() => nextPhrase && onSeek(nextPhrase.startMs)}
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition"
              title="Câu tiếp theo"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section Landmark Badge */}
          <div className="px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>{currentOrUpcomingPhrase.sectionLabel || 'Phiên khúc'}</span>
            <span className="text-slate-500 font-mono">
              ({formatTimeMs(currentOrUpcomingPhrase.startMs)}–{formatTimeMs(currentOrUpcomingPhrase.endMs)})
            </span>
          </div>

          {/* Melodic Contour Tag */}
          {currentOrUpcomingPhrase.contourLabel && (
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium">
              {currentOrUpcomingPhrase.contourLabel}
            </span>
          )}

          {/* Active Vowel Formant & Pitch Trajectory Live Pill */}
          {activeWord && (
            <div className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-bold text-emerald-300 flex items-center gap-1.5 animate-fade-in">
              <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>
                Nguyên âm /{activeWord.vowelPhoneme || 'A'}/ ({activeWord.vowelHint || 'Mở rộng'})
              </span>
              {activeWord.trajectoryLabel && (
                <span className="text-sky-300 font-mono">• {activeWord.trajectoryLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Right Controls: Display Mode & Edit Lyric */}
        <div className="flex items-center gap-1.5">
          <span
            className={`hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-medium ${sourceBadge.colorClass}`}
            title={matchedTrackTitle ? `Khớp bài: ${matchedTrackTitle}` : undefined}
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>{sourceBadge.label}</span>
          </span>

          {/* Display Mode Switcher */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setDisplayMode('bilingual')}
              className={`px-2 py-1 rounded-lg font-bold transition ${
                displayMode === 'bilingual'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Hiện lời/nguyên âm kèm nốt nhạc và hướng đi lên/xuống của từng từ"
            >
              Lời + Quỹ Đạo
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('vowel_trajectory')}
              className={`px-2 py-1 rounded-lg font-bold transition ${
                displayMode === 'vowel_trajectory'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tập trung vào Nguyên âm (A, Ê, I, Ô, U, Ơi) và hướng đi lên/xuống (↗ ↘ ⤴ 〰)"
            >
              Nguyên Âm ↗↘
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('solfege')}
              className={`px-2 py-1 rounded-lg font-bold transition ${
                displayMode === 'solfege'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Hiện xướng âm Đô - Rê - Mi kèm hướng lên/xuống"
            >
              Xướng Âm
            </button>
          </div>

          <button
            type="button"
            onClick={() => onLoopPhrase(currentOrUpcomingPhrase)}
            className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition ${
              isLoopingActive
                ? 'bg-indigo-500 text-slate-950 border-indigo-400'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Lặp câu đang hiển thị"
          >
            <Repeat className="w-3 h-3" />
            <span className="hidden sm:inline">Lặp câu</span>
          </button>

          <button
            type="button"
            onClick={onOpenLyricModal}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-[11px] font-bold flex items-center gap-1 transition"
            title="Nhập / Đồng bộ lời bài hát hoặc tra cứu .LRC"
          >
            <Edit3 className="w-3 h-3" />
            <span className="hidden sm:inline">Lời bài hát</span>
          </button>
        </div>
      </div>

      {/* Center Karaoke Line: Word-by-word synchronized display with Vowel & Pitch Trajectory */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
        {isEditingInline ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={inlineDraft}
              onChange={(e) => setInlineDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveInlineEdit();
                if (e.key === 'Escape') setIsEditingInline(false);
              }}
              autoFocus
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-sky-400 text-sm text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveInlineEdit}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setIsEditingInline(false)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
            >
              Hủy
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-wrap items-center gap-x-2 gap-y-1.5 min-h-[38px]">
            {isWaitingForEntrance && countdownSec && (
              <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-mono font-bold animate-pulse">
                Vào nhịp sau {countdownSec}s:
              </span>
            )}

            {words.length > 0 ? (
              words.map((word) => {
                const isWordActive =
                  currentTimeMs >= word.startMs - 35 && currentTimeMs <= word.endMs + 35;
                const isWordPast = currentTimeMs > word.endMs + 35;
                const wordKey = `${currentOrUpcomingPhrase.phraseIndex}_${word.wordIndex}`;
                const stat = sessionStats.wordScores?.[wordKey];

                const step = word.stepSemitones ?? 0;
                const stepStr = step > 0 ? `+${step}` : step < 0 ? `${step}` : '';
                const arrow = word.trajectorySymbol || '→';
                const vowelTag = word.vowelPhoneme ? `/${word.vowelPhoneme}/` : '';

                const hasMultiNoteGlide =
                  (word.noteSequence && word.noteSequence.length > 1) ||
                  (word.endNoteName && word.endNoteName !== word.noteName);
                const noteDisplay =
                  word.noteSequence && word.noteSequence.length > 1
                    ? word.noteSequence.join('→')
                    : word.endNoteName && word.endNoteName !== word.noteName
                    ? `${word.noteName}→${word.endNoteName}`
                    : word.noteName;
                const solfegeDisplay =
                  word.solfegeSequence && word.solfegeSequence.length > 1
                    ? word.solfegeSequence.join('→')
                    : word.endSolfege && word.endSolfege !== word.solfege
                    ? `${word.solfege}→${word.endSolfege}`
                    : word.solfege;

                const glideSt = word.glideSemitones ?? 0;
                const glideTag =
                  hasMultiNoteGlide && glideSt !== 0
                    ? `${arrow}${glideSt > 0 ? `+${glideSt}` : glideSt}st`
                    : `${arrow}${stepStr}`;
                const sustainBadge =
                  word.isSustained && word.durationMs
                    ? ` ⏳${(word.durationMs / 1000).toFixed(1)}s`
                    : '';

                const activeProgressPct = isWordActive
                  ? Math.max(
                      0,
                      Math.min(
                        100,
                        ((currentTimeMs - word.startMs) / Math.max(80, word.endMs - word.startMs)) *
                          100
                      )
                    )
                  : 0;

                // Color word based on real-time singing pitch accuracy!
                let wordColorClass = 'text-slate-200 hover:text-white';
                let subBadgeClass = 'text-slate-300 bg-slate-900/90 border-slate-700/70';

                // Color code direction badge when unpracticed so user sees up/down movement at a glance
                if (hasMultiNoteGlide) {
                  subBadgeClass = 'text-purple-200 bg-purple-950/75 border-purple-500/45';
                } else if (
                  step >= 2 ||
                  word.pitchTrajectory === 'rising' ||
                  word.pitchTrajectory === 'arch'
                ) {
                  subBadgeClass = 'text-sky-300 bg-sky-950/70 border-sky-500/40';
                } else if (step <= -2 || word.pitchTrajectory === 'falling') {
                  subBadgeClass = 'text-amber-300 bg-amber-950/70 border-amber-500/40';
                } else if (word.isSustained) {
                  subBadgeClass = 'text-cyan-200 bg-cyan-950/70 border-cyan-500/40';
                }

                if (isWordActive) {
                  wordColorClass =
                    'text-sky-300 scale-105 font-black underline decoration-sky-400 decoration-2 underline-offset-4 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]';
                  subBadgeClass = 'text-slate-950 bg-sky-400 border-sky-300 font-black';
                } else if (stat && stat.total > 30) {
                  if (stat.status === 'in_tune') {
                    wordColorClass = 'text-emerald-400 font-bold';
                    subBadgeClass = 'text-emerald-300 bg-emerald-950/80 border-emerald-500/40';
                  } else if (stat.status === 'flat') {
                    wordColorClass = 'text-amber-400 font-bold';
                    subBadgeClass = 'text-amber-300 bg-amber-950/80 border-amber-500/40';
                  } else {
                    wordColorClass = 'text-rose-400 font-bold';
                    subBadgeClass = 'text-rose-300 bg-rose-950/80 border-rose-500/40';
                  }
                } else if (isWordPast) {
                  wordColorClass = 'text-slate-400';
                }

                const primaryText =
                  displayMode === 'solfege'
                    ? `${solfegeDisplay}${arrow}`
                    : displayMode === 'vowel_trajectory'
                    ? `${word.vowelPhoneme || word.text}${glideTag}`
                    : word.text;

                const topBadgeText =
                  displayMode === 'vowel_trajectory'
                    ? `${noteDisplay} · ${word.vowelHint?.split(' ')[0] || ''}${sustainBadge}`
                    : `${noteDisplay} ${vowelTag}${glideTag}${sustainBadge}`;

                return (
                  <button
                    key={word.wordIndex}
                    type="button"
                    onClick={() => onSeek(word.startMs)}
                    className={`relative overflow-hidden group inline-flex flex-col items-center transition-all duration-100 px-1.5 py-0.5 rounded-lg hover:bg-slate-800/60 ${wordColorClass}`}
                    title={`"${word.text}" • Nốt: ${noteDisplay} (${solfegeDisplay}) • Nguyên âm: /${
                      word.vowelPhoneme || 'A'
                    }/ (${word.vowelHint || ''}) • ${word.trajectoryLabel || ''}${
                      word.sustainLabel ? ` • ${word.sustainLabel}` : ''
                    }${
                      stat && stat.total > 30
                        ? ` • Độ lệch khi hát: ${
                            stat.avgCentsDiff > 0 ? `+${stat.avgCentsDiff}` : stat.avgCentsDiff
                          } cents`
                        : ''
                    }`}
                  >
                    {isWordActive && (
                      <span
                        className="absolute bottom-0 left-0 h-0.5 bg-sky-400 transition-all duration-75"
                        style={{ width: `${activeProgressPct}%` }}
                      />
                    )}
                    {(displayMode === 'bilingual' || displayMode === 'vowel_trajectory') && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0 rounded border leading-tight mb-0.5 ${subBadgeClass}`}
                      >
                        {topBadgeText}
                      </span>
                    )}
                    <span className="text-sm sm:text-base font-bold tracking-tight leading-snug">
                      {primaryText}
                    </span>
                  </button>
                );
              })
            ) : (
              <span className="text-sm sm:text-base font-bold text-slate-200">
                {currentOrUpcomingPhrase.lyricText || currentOrUpcomingPhrase.solfegeText}
              </span>
            )}

            <button
              type="button"
              onClick={handleStartInlineEdit}
              className="p-1 rounded-lg text-slate-500 hover:text-sky-300 hover:bg-slate-800 transition ml-1"
              title="Sửa nhanh lời câu này"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Next Phrase Preview on the right */}
        {nextPhrase && !isEditingInline && (
          <button
            type="button"
            onClick={() => onSeek(nextPhrase.startMs)}
            className="text-left sm:text-right shrink-0 px-2.5 py-1 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800/80 transition max-w-xs truncate"
            title="Nhấn để chuyển tới câu tiếp theo"
          >
            <div className="text-[9px] font-mono uppercase text-slate-400 flex items-center sm:justify-end gap-1">
              <Music className="w-2.5 h-2.5 text-sky-400" />
              <span>
                Tiếp: Câu {nextPhrase.phraseIndex} ({nextPhrase.sectionLabel || 'Phiên khúc'})
              </span>
            </div>
            <div className="text-xs text-slate-300 font-medium truncate">
              {displayMode === 'solfege'
                ? nextPhrase.solfegeText
                : nextPhrase.lyricText || nextPhrase.solfegeText}
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
