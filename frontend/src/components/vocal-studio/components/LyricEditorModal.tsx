import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Search,
  Mic,
  Check,
  Music2,
  FileText,
  Wand2,
  Loader2,
} from 'lucide-react';
import {
  IVocalAnalysisResult,
  IVocalNoteBar,
  IVocalPhrase,
} from '../../../services/vocalFileAnalysisService';
import {
  parseLrcContent,
  alignLrcLinesToPhrases,
  alignPlainTextToPhrases,
  alignWordsToPhraseNoteBars,
  buildSmartLyricQueries,
  classifyPhraseSectionsAndContours,
  fetchAutoLyricsFromLrclib,
  saveLyricsToLocalCache,
} from '../../../services/lyricAlignmentService';
import { formatTimeMs } from '../utils/vocalHelpers';

interface LyricEditorModalProps {
  isOpen: boolean;
  analysisResult: IVocalAnalysisResult;
  onClose: () => void;
  onApplyUpdatedResult: (updated: IVocalAnalysisResult) => void;
  onPreviewPhraseAudio?: (startMs: number) => void;
}

export const LyricEditorModal: React.FC<LyricEditorModalProps> = ({
  isOpen,
  analysisResult,
  onClose,
  onApplyUpdatedResult,
  onPreviewPhraseAudio,
}) => {
  const [mode, setMode] = useState<'phrase_list' | 'bulk_paste' | 'cloud_search'>('phrase_list');
  const [workingPhrases, setWorkingPhrases] = useState<IVocalPhrase[]>([]);
  const [workingBars, setWorkingBars] = useState<IVocalNoteBar[]>([]);
  const [phraseTexts, setPhraseTexts] = useState<Record<number, string>>({});
  const [phraseVocalizeFlags, setPhraseVocalizeFlags] = useState<Record<number, boolean>>({});
  const [bulkText, setBulkText] = useState('');
  const [cloudQuery, setCloudQuery] = useState('');
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);
  const [dictatingPhraseIdx, setDictatingPhraseIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !analysisResult) return;
    const initMap: Record<number, string> = {};
    const initFlags: Record<number, boolean> = {};
    const lines: string[] = [];

    analysisResult.phrases.forEach((p) => {
      initMap[p.phraseIndex] = p.lyricText || '';
      initFlags[p.phraseIndex] = Boolean(p.isInstrumentalOrVocalize);
      lines.push(p.lyricText || '');
    });

    setWorkingPhrases(analysisResult.phrases.map((p) => ({ ...p })));
    setWorkingBars(analysisResult.noteBars.map((b) => ({ ...b })));
    setPhraseTexts(initMap);
    setPhraseVocalizeFlags(initFlags);
    setBulkText(lines.join('\n'));
    const smartDefaultQuery =
      buildSmartLyricQueries(analysisResult.fileName)[0] ||
      analysisResult.fileName.replace(/\.[^/.]+$/, '').replace(/[._-]+/g, ' ');
    setCloudQuery(analysisResult.matchedTrackTitle || smartDefaultQuery);
    setCloudMessage(null);
  }, [isOpen, analysisResult]);

  if (!isOpen) return null;

  const getRawMonoPcm = (): Float32Array | null =>
    typeof analysisResult.audioBuffer?.getChannelData === 'function'
      ? analysisResult.audioBuffer.getChannelData(0)
      : null;

  const syncStateFromAlignedPhrases = (
    clonedPhrases: IVocalPhrase[],
    clonedBars: IVocalNoteBar[]
  ) => {
    const nextMap: Record<number, string> = {};
    const nextFlags: Record<number, boolean> = {};
    clonedPhrases.forEach((p) => {
      nextMap[p.phraseIndex] = p.lyricText || '';
      nextFlags[p.phraseIndex] = Boolean(p.isInstrumentalOrVocalize);
    });
    setWorkingPhrases(clonedPhrases);
    setWorkingBars(clonedBars);
    setPhraseTexts(nextMap);
    setPhraseVocalizeFlags(nextFlags);
    setBulkText(clonedPhrases.map((p) => p.lyricText || '').join('\n'));
  };

  const handleFileImport = async (file: File) => {
    const text = await file.text();
    const lrcLines = parseLrcContent(text);
    const clonedPhrases = analysisResult.phrases.map((p) => ({ ...p }));
    const clonedBars = analysisResult.noteBars.map((b) => ({ ...b }));
    const rawMonoPcm = getRawMonoPcm();

    if (lrcLines.length > 0) {
      alignLrcLinesToPhrases(
        clonedPhrases,
        clonedBars,
        lrcLines,
        rawMonoPcm,
        analysisResult.sampleRate,
        analysisResult.pitchTrack
      );
    } else {
      alignPlainTextToPhrases(
        clonedPhrases,
        clonedBars,
        text,
        rawMonoPcm,
        analysisResult.sampleRate,
        analysisResult.pitchTrack
      );
    }

    syncStateFromAlignedPhrases(clonedPhrases, clonedBars);
    setMode('phrase_list');
  };

  const handleBulkAutoAlign = () => {
    const lrcLines = parseLrcContent(bulkText);
    const clonedPhrases = analysisResult.phrases.map((p) => ({ ...p }));
    const clonedBars = analysisResult.noteBars.map((b) => ({ ...b }));
    const rawMonoPcm = getRawMonoPcm();

    if (lrcLines.length > 0) {
      alignLrcLinesToPhrases(
        clonedPhrases,
        clonedBars,
        lrcLines,
        rawMonoPcm,
        analysisResult.sampleRate,
        analysisResult.pitchTrack
      );
    } else {
      alignPlainTextToPhrases(
        clonedPhrases,
        clonedBars,
        bulkText,
        rawMonoPcm,
        analysisResult.sampleRate,
        analysisResult.pitchTrack
      );
    }

    syncStateFromAlignedPhrases(clonedPhrases, clonedBars);
    setMode('phrase_list');
  };

  const handleCloudLookup = async () => {
    if (!cloudQuery.trim()) return;
    setIsSearchingCloud(true);
    setCloudMessage(null);
    try {
      const found = await fetchAutoLyricsFromLrclib(cloudQuery.trim(), analysisResult.durationMs);
      if (!found || (!found.syncedLyrics && !found.plainLyrics)) {
        setCloudMessage('Không tìm thấy lời bài hát khớp trên kho LRCLIB. Bạn có thể dán lời trực tiếp ở tab Dán Nhanh.');
      } else {
        const clonedPhrases = analysisResult.phrases.map((p) => ({ ...p }));
        const clonedBars = analysisResult.noteBars.map((b) => ({ ...b }));
        const rawMonoPcm = getRawMonoPcm();
        if (found.syncedLyrics) {
          const lrc = parseLrcContent(found.syncedLyrics);
          alignLrcLinesToPhrases(
            clonedPhrases,
            clonedBars,
            lrc,
            rawMonoPcm,
            analysisResult.sampleRate,
            analysisResult.pitchTrack
          );
        } else if (found.plainLyrics) {
          alignPlainTextToPhrases(
            clonedPhrases,
            clonedBars,
            found.plainLyrics,
            rawMonoPcm,
            analysisResult.sampleRate,
            analysisResult.pitchTrack
          );
        }
        syncStateFromAlignedPhrases(clonedPhrases, clonedBars);
        setCloudMessage(`Đã khớp lời tự động từ bài: "${found.matchedTitle || cloudQuery}"!`);
        setMode('phrase_list');
      }
    } finally {
      setIsSearchingCloud(false);
    }
  };

  const handleStartVoiceDictation = (phraseIndex: number) => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      alert('Trình duyệt hiện tại không hỗ trợ Web Speech API. Vui lòng nhập trực tiếp vào ô văn bản.');
      return;
    }

    if (dictatingPhraseIdx === phraseIndex) {
      setDictatingPhraseIdx(null);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setDictatingPhraseIdx(phraseIndex);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setPhraseTexts((prev) => ({
          ...prev,
          [phraseIndex]: transcript.trim(),
        }));
      }
      setDictatingPhraseIdx(null);
    };
    recognition.onerror = () => {
      setDictatingPhraseIdx(null);
    };
    recognition.onend = () => {
      setDictatingPhraseIdx(null);
    };
    recognition.start();
  };

  const activePhrases = workingPhrases.length > 0 ? workingPhrases : analysisResult.phrases;

  const handleSaveAll = () => {
    const baseBars = workingBars.length > 0 ? workingBars : analysisResult.noteBars;
    const clonedBars = baseBars.map((b) => ({ ...b }));
    const rawMonoPcm = getRawMonoPcm();

    const updatedPhrases = activePhrases.map((p) => {
      const text = phraseTexts[p.phraseIndex] ?? p.lyricText ?? '';
      const isVoc = Boolean(phraseVocalizeFlags[p.phraseIndex]);
      const copy = {
        ...p,
        isInstrumentalOrVocalize: isVoc,
      };
      alignWordsToPhraseNoteBars(
        copy,
        clonedBars,
        text,
        rawMonoPcm,
        analysisResult.sampleRate,
        analysisResult.pitchTrack
      );
      return copy;
    });

    classifyPhraseSectionsAndContours(
      updatedPhrases,
      clonedBars,
      analysisResult.durationMs,
      analysisResult.vocalRange.lowestMidi,
      analysisResult.vocalRange.highestMidi
    );

    const updatedResult: IVocalAnalysisResult = {
      ...analysisResult,
      noteBars: clonedBars,
      phrases: updatedPhrases,
      lyricSource: 'manual',
      lyricStatus: 'complete',
    };
    saveLyricsToLocalCache(updatedResult);
    onApplyUpdatedResult(updatedResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Đồng Bộ &amp; Chỉnh Sửa Lời Bài Hát Theo Câu ({activePhrases.length} câu)
              </h3>
              <p className="text-[11px] text-slate-400">
                Lời bài hát tự động khớp từng chữ vào các nốt nhạc NewTone để hiển thị Karaoke &amp; tìm kiếm nhanh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Bar */}
        <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMode('phrase_list')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                mode === 'phrase_list'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music2 className="w-3.5 h-3.5" />
              <span>Theo Từng Câu ({activePhrases.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('bulk_paste')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                mode === 'bulk_paste'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Dán Nhanh Toàn Bài / .LRC</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('cloud_search')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                mode === 'cloud_search'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tra Lời Tự Động (LRCLIB)</span>
            </button>
          </div>

          {/* Import .LRC / .TXT File Button */}
          <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition">
            <Upload className="w-3.5 h-3.5" />
            <span>Nhập file .LRC / .TXT</span>
            <input
              type="file"
              accept=".lrc,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileImport(e.target.files[0]);
              }}
            />
          </label>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {cloudMessage && (
            <div className="p-3 rounded-2xl bg-sky-950/50 border border-sky-500/40 text-xs text-sky-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{cloudMessage}</span>
            </div>
          )}

          {mode === 'cloud_search' && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Tra cứu lời bài hát có sẵn mốc thời gian (.LRC)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Nhập tên bài hát (và ca sĩ nếu có). Hệ thống sẽ tự động tải lời chuẩn kèm timestamp và khớp vào {activePhrases.length} câu hát của bạn.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={cloudQuery}
                  onChange={(e) => setCloudQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCloudLookup();
                  }}
                  placeholder="VD: Nơi Này Có Anh Sơn Tùng..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-400"
                />
                <button
                  type="button"
                  disabled={isSearchingCloud}
                  onClick={handleCloudLookup}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isSearchingCloud ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Tìm &amp; Khớp Ngay</span>
                </button>
              </div>
            </div>
          )}

          {mode === 'bulk_paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-300">
                  Dán toàn bộ lời bài hát (mỗi câu 1 dòng) hoặc nội dung file <code>[mm:ss.xx]</code> (.LRC) vào dưới đây:
                </p>
                <button
                  type="button"
                  onClick={handleBulkAutoAlign}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Gán Tự Động Vào {activePhrases.length} Câu</span>
                </button>
              </div>

              <textarea
                rows={12}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`[00:01.20] Câu hát thứ nhất...\n[00:05.50] Câu hát thứ hai...\nHoặc dán văn bản thường mỗi dòng 1 câu`}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {mode === 'phrase_list' && (
            <div className="space-y-2.5">
              {activePhrases.map((phrase) => {
                const isVocalize = Boolean(phraseVocalizeFlags[phrase.phraseIndex]);
                const isDictating = dictatingPhraseIdx === phrase.phraseIndex;

                return (
                  <div
                    key={phrase.id}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    {/* Left Info */}
                    <div className="sm:w-56 shrink-0 flex items-center justify-between sm:block">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-white font-bold text-xs">
                          Câu {phrase.phraseIndex}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                          {phrase.sectionLabel || 'Phiên khúc'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400">
                        <span>
                          {formatTimeMs(phrase.startMs)} – {formatTimeMs(phrase.endMs)}
                        </span>
                        <span className="text-sky-400">
                          ({phrase.lowestNote}→{phrase.highestNote})
                        </span>
                        {onPreviewPhraseAudio && (
                          <button
                            type="button"
                            onClick={() => onPreviewPhraseAudio(phrase.startMs)}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px]"
                            title="Nghe đoạn này"
                          >
                            ▶ Nghe
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Input Field */}
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        disabled={isVocalize}
                        value={
                          isVocalize
                            ? '🎵 Đoạn ngân / Không lời (Vocalize)'
                            : phraseTexts[phrase.phraseIndex] ?? ''
                        }
                        onChange={(e) =>
                          setPhraseTexts((prev) => ({
                            ...prev,
                            [phrase.phraseIndex]: e.target.value,
                          }))
                        }
                        placeholder={`Lời câu ${phrase.phraseIndex} (Xướng âm: ${phrase.solfegeText})...`}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400 disabled:opacity-60"
                      />

                      {/* Voice Dictation Button */}
                      <button
                        type="button"
                        onClick={() => handleStartVoiceDictation(phrase.phraseIndex)}
                        className={`p-2 rounded-xl border text-xs transition ${
                          isDictating
                            ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                        title="Đọc lời bằng giọng nói (Web Speech ASR)"
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      {/* Toggle Vocalize / Instrumental */}
                      <button
                        type="button"
                        onClick={() =>
                          setPhraseVocalizeFlags((prev) => ({
                            ...prev,
                            [phrase.phraseIndex]: !prev[phrase.phraseIndex],
                          }))
                        }
                        className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition shrink-0 ${
                          isVocalize
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Đánh dấu câu này là đoạn dạo nhạc hoặc ngân không lời"
                      >
                        Ngân/Không lời
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            Mẹo: Hệ thống tự động chia từng âm tiết khớp vào đúng các thanh nốt nhạc trong mỗi câu.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
            >
              <Check className="w-4 h-4" />
              <span>Lưu &amp; Đồng Bộ Lời Bài Hát</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

