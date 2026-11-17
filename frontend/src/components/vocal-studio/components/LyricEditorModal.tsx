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
  Hand,
  Cpu,
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
import {
  getSavedGeminiApiKey,
  saveGeminiApiKey,
  transcribeAndAlignWithAI,
  transcribeMissingGapsWithAI,
} from '../../../services/vocalTranscriptionService';
import { TapSyncPanel } from './TapSyncPanel';
import { formatTimeMs } from '../utils/vocalHelpers';

interface LyricEditorModalProps {
  isOpen: boolean;
  analysisResult: IVocalAnalysisResult;
  initialMode?: 'phrase_list' | 'bulk_paste' | 'cloud_search' | 'tap_sync' | 'ai_transcribe';
  onClose: () => void;
  onApplyUpdatedResult: (updated: IVocalAnalysisResult) => void;
  onPreviewPhraseAudio?: (startMs: number) => void;
}

export const LyricEditorModal: React.FC<LyricEditorModalProps> = ({
  isOpen,
  analysisResult,
  initialMode,
  onClose,
  onApplyUpdatedResult,
  onPreviewPhraseAudio,
}) => {
  const [mode, setMode] = useState<'phrase_list' | 'bulk_paste' | 'cloud_search' | 'tap_sync' | 'ai_transcribe'>(
    initialMode || 'phrase_list'
  );
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => getSavedGeminiApiKey());
  const [aiLanguage, setAiLanguage] = useState<'vi' | 'en'>('vi');
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [aiStatusText, setAiStatusText] = useState<string>('');
  const [onlyFlaggedFilter, setOnlyFlaggedFilter] = useState(false);
  const [patchingPhraseIdx, setPatchingPhraseIdx] = useState<number | null>(null);
  const [workingPhrases, setWorkingPhrases] = useState<IVocalPhrase[]>([]);
  const [workingBars, setWorkingBars] = useState<IVocalNoteBar[]>([]);
  const [phraseTexts, setPhraseTexts] = useState<Record<number, string>>({});
  const [phraseVocalizeFlags, setPhraseVocalizeFlags] = useState<Record<number, boolean>>({});
  const [bulkText, setBulkText] = useState('');
  const [cloudQuery, setCloudQuery] = useState('');
  const [isSearchingCloud, setIsSearchingCloud] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<string | null>(null);
  const [dictatingPhraseIdx, setDictatingPhraseIdx] = useState<number | null>(null);
  const [toastNotice, setToastNotice] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (!isOpen || !analysisResult) return;
    if (initialMode) {
      setMode(initialMode);
    }
    const initMap: Record<number, string> = {};
    const initFlags: Record<number, boolean> = {};
    const lines: string[] = [];

    const isPureFallback = analysisResult.phrases.every(
      (p) =>
        !p.lyricText ||
        p.lyricText.startsWith('Nguyên âm:') ||
        p.lyricText.startsWith('🎵') ||
        p.isInstrumentalOrVocalize
    );

    analysisResult.phrases.forEach((p) => {
      initMap[p.phraseIndex] = p.lyricText || '';
      initFlags[p.phraseIndex] = Boolean(p.isInstrumentalOrVocalize);
      if (!isPureFallback) {
        lines.push(p.lyricText || '');
      }
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
  }, [isOpen, analysisResult, initialMode]);

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
      setToastNotice({
        text: 'Trình duyệt hiện tại không hỗ trợ Web Speech API. Vui lòng nhập trực tiếp vào ô văn bản.',
        type: 'error',
      });
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

            <button
              type="button"
              onClick={() => setMode('tap_sync')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                mode === 'tap_sync'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>Tap-to-Sync</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('ai_transcribe')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                mode === 'ai_transcribe'
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Tạo &amp; Khớp Lời</span>
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
          {toastNotice && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 animate-fade-in ${
                toastNotice.type === 'error'
                  ? 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                  : 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
              }`}
            >
              <span>{toastNotice.text}</span>
              <button
                type="button"
                onClick={() => setToastNotice(null)}
                className="p-1 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {cloudMessage && (
            <div className="p-3 rounded-2xl bg-sky-950/50 border border-sky-500/40 text-xs text-sky-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{cloudMessage}</span>
            </div>
          )}

          {mode === 'tap_sync' && (
            <TapSyncPanel
              audioBuffer={analysisResult.audioBuffer}
              initialLyricsText={bulkText}
              onCompleteEnhancedLrc={(enhancedLrc) => {
                const lrcLines = parseLrcContent(enhancedLrc);
                const clonedPhrases = analysisResult.phrases.map((p) => ({ ...p }));
                const clonedBars = analysisResult.noteBars.map((b) => ({ ...b }));
                alignLrcLinesToPhrases(
                  clonedPhrases,
                  clonedBars,
                  lrcLines,
                  getRawMonoPcm(),
                  analysisResult.sampleRate,
                  analysisResult.pitchTrack,
                  analysisResult.durationMs
                );
                syncStateFromAlignedPhrases(clonedPhrases, clonedBars);
                setToastNotice({
                  text: `Đã gõ nhịp khớp chuẩn từng chữ cho ${lrcLines.length} câu hát!`,
                  type: 'success',
                });
                setMode('phrase_list');
              }}
            />
          )}

          {mode === 'ai_transcribe' && (
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/30 space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span>AI Bóc Lời &amp; Khớp Timestamp Từng Chữ (Gemini Audio)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Nghe trực tiếp giọng hát để tạo lời chuẩn chính tả (nếu chưa có LRC) hoặc căn chỉnh chuẩn từng mili-giây theo lời bạn dán sẵn.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {(['vi', 'en'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setAiLanguage(lang)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        aiLanguage === lang
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang === 'vi' ? 'Tiếng Việt' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">
                    Lời gợi ý (Tùy chọn - để trống nếu muốn AI tự nghe và viết lời):
                  </label>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={4}
                    placeholder="Dán lời bài hát thô nếu bạn muốn AI ép khớp đúng từng chữ..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 block">
                    Gemini API Key (Tùy chọn nếu server chưa cấu hình):
                  </label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => {
                      setGeminiApiKey(e.target.value);
                      saveGeminiApiKey(e.target.value);
                    }}
                    placeholder="AIza... (lưu an toàn tại trình duyệt của bạn)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                  {aiStatusText && (
                    <div className="text-xs text-purple-300 bg-purple-950/40 border border-purple-500/30 px-3 py-2 rounded-xl flex items-center gap-2">
                      {isAiRunning && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                      <span>{aiStatusText}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={isAiRunning}
                onClick={async () => {
                  setIsAiRunning(true);
                  setToastNotice(null);
                  try {
                    const updated = await transcribeAndAlignWithAI({
                      analysisResult,
                      hintLyrics: bulkText.trim() || undefined,
                      language: aiLanguage,
                      apiKey: geminiApiKey,
                      onProgress: (_, st) => setAiStatusText(st),
                    });
                    syncStateFromAlignedPhrases(updated.phrases, updated.noteBars);
                    onApplyUpdatedResult(updated);
                    setToastNotice({
                      text: `AI đã tạo và khớp chuẩn từng chữ cho ${updated.phrases.length} câu hát!`,
                      type: 'success',
                    });
                    setMode('phrase_list');
                  } catch (err: any) {
                    setToastNotice({
                      text: err?.message || 'Không thể kết nối AI Transcription.',
                      type: 'error',
                    });
                  } finally {
                    setIsAiRunning(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {isAiRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Bắt Đầu Tạo &amp; Khớp Lời Chuẩn Từng Chữ</span>
              </button>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs text-slate-300">
                    Dán toàn bộ lời bài hát (mỗi câu 1 dòng) hoặc nội dung file <code>[mm:ss.xx]</code> (.LRC) vào dưới đây:
                  </p>
                  {bulkText.trim() && (
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-slate-400">
                        Đã nhập: <strong className="text-sky-300">{bulkText.split(/\r?\n/).filter((l) => l.trim().length > 0 && !/^\[(verse|chorus|intro|outro|bridge)/i.test(l.trim())).length}</strong> dòng
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">
                        Bài hát: <strong className="text-white">{activePhrases.length}</strong> câu
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleBulkAutoAlign}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition self-start sm:self-auto shadow-md"
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
              {activePhrases.some((p) => p.alignmentIssue || p.isMissingLyricGap) && (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs">
                  <span className="text-amber-200 font-semibold">
                    Phát hiện {activePhrases.filter((p) => p.alignmentIssue || p.isMissingLyricGap).length} câu thiếu lời hoặc nghi ngờ lệch nhịp.
                  </span>
                  <button
                    type="button"
                    onClick={() => setOnlyFlaggedFilter((v) => !v)}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                      onlyFlaggedFilter
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                    }`}
                  >
                    {onlyFlaggedFilter ? 'Hiện tất cả câu' : 'Chỉ xem câu thiếu / lỗi'}
                  </button>
                </div>
              )}

              {activePhrases
                .filter((p) => !onlyFlaggedFilter || Boolean(p.alignmentIssue || p.isMissingLyricGap))
                .map((phrase) => {
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

                    {/* Input Field & Syllable Preview */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
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

                        {/* AI Patch Single Phrase Button */}
                        <button
                          type="button"
                          disabled={patchingPhraseIdx === phrase.phraseIndex}
                          onClick={async () => {
                            setPatchingPhraseIdx(phrase.phraseIndex);
                            setToastNotice(null);
                            try {
                              const updated = await transcribeMissingGapsWithAI({
                                analysisResult: {
                                  ...analysisResult,
                                  phrases: activePhrases,
                                  noteBars: workingBars.length > 0 ? workingBars : analysisResult.noteBars,
                                },
                                targetPhraseIndices: [phrase.phraseIndex],
                                language: aiLanguage,
                                apiKey: geminiApiKey,
                              });
                              syncStateFromAlignedPhrases(updated.phrases, updated.noteBars);
                              setToastNotice({
                                text: `Đã dùng AI bóc lời chuẩn cho Câu ${phrase.phraseIndex}!`,
                                type: 'success',
                              });
                            } catch (err: any) {
                              setToastNotice({
                                text: err?.message || 'Lỗi bóc lời AI cho câu này.',
                                type: 'error',
                              });
                            } finally {
                              setPatchingPhraseIdx(null);
                            }
                          }}
                          className="px-2.5 py-2 rounded-xl border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/30 text-purple-200 text-[11px] font-bold flex items-center gap-1 transition shrink-0 cursor-pointer disabled:opacity-40"
                          title="Dùng AI nghe và bóc lời riêng cho câu này"
                        >
                          {patchingPhraseIdx === phrase.phraseIndex ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                          )}
                          <span className="hidden sm:inline">AI Bóc Câu</span>
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

                      {(phrase.alignmentIssue || phrase.isMissingLyricGap) && (
                        <div className="text-[10px] text-amber-300 bg-amber-950/50 border border-amber-500/30 rounded-lg px-2 py-1">
                          ⚠️ {phrase.alignmentIssueDetailVi || 'Đoạn hát này đang thiếu lời hoặc lệch nốt.'}
                        </div>
                      )}

                      {/* Live Word-to-Note Syllable Preview */}
                      {!isVocalize && (phraseTexts[phrase.phraseIndex] ?? phrase.lyricText) && (
                        <div className="flex flex-wrap items-center gap-1.5 pl-0.5">
                          <span className="text-[10px] font-mono text-slate-500">Xem trước nốt:</span>
                          {(phraseTexts[phrase.phraseIndex] ?? phrase.lyricText ?? '')
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 14)
                            .map((token, tIdx) => {
                              const barNote = phrase.notes[tIdx % Math.max(1, phrase.notes.length)];
                              return (
                                <span
                                  key={tIdx}
                                  className="px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono flex items-center gap-1 text-slate-200"
                                >
                                  <span className="font-semibold text-white">{token}</span>
                                  {barNote && <span className="text-sky-400 font-bold">{barNote}</span>}
                                </span>
                              );
                            })}
                        </div>
                      )}
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

