import React, { useState, useEffect } from 'react';
import {
  Search,
  Music2,
  Check,
  Sparkles,
  AlertTriangle,
  X,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { IVocalAnalysisResult } from '../../../services/vocalFileAnalysisService';
import {
  type ISongLyricCandidate,
  searchSongLyricCandidates,
  realignLyricsToAnalysisResult,
  parseLrcContent,
} from '../../../services/lyricAlignmentService';

interface ISongCandidateModalProps {
  isOpen: boolean;
  analysisResult: IVocalAnalysisResult;
  onClose: () => void;
  onApplyUpdatedResult: (updated: IVocalAnalysisResult) => void;
}

export const SongCandidateModal: React.FC<ISongCandidateModalProps> = ({
  isOpen,
  analysisResult,
  onClose,
  onApplyUpdatedResult,
}) => {
  const [candidates, setCandidates] = useState<ISongLyricCandidate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);
  const [customLrcText, setCustomLrcText] = useState('');
  const [activeTab, setActiveTab] = useState<'candidates' | 'search' | 'manual'>('candidates');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Initialize candidates when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (analysisResult.lyricCandidates && analysisResult.lyricCandidates.length > 0) {
      setCandidates(analysisResult.lyricCandidates);
    } else {
      // Trigger search if not pre-populated
      handleRunSearch(analysisResult.fileName);
    }

    const defaultSearch =
      analysisResult.fileName.replace(/\.[^/.]+$/, '').replace(/[._-]+/g, ' ') || '';
    setSearchQuery(defaultSearch);
    setStatusMessage(null);
  }, [isOpen, analysisResult]);

  if (!isOpen) return null;

  const handleRunSearch = async (queryToRun?: string) => {
    const q = (queryToRun ?? searchQuery).trim();
    if (!q) return;
    setIsSearching(true);
    setStatusMessage(null);
    try {
      const results = await searchSongLyricCandidates(
        analysisResult.fileName,
        analysisResult.durationMs,
        q
      );
      setCandidates(results);
      if (results.length === 0) {
        setStatusMessage('Không tìm thấy bài hát khớp với từ khóa. Bạn có thể thử từ khóa khác hoặc dán lời ở tab Tự Dán Lời.');
      }
    } catch {
      setStatusMessage('Đã có lỗi khi tìm kiếm bài hát. Vui lòng kiểm tra lại kết nối mạng.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCandidate = (candidate: ISongLyricCandidate) => {
    const lyricsToApply = candidate.syncedLyrics || candidate.plainLyrics;
    if (!lyricsToApply) {
      alert('Bài hát này chưa có dữ liệu lời hát.');
      return;
    }

    const isSynced = Boolean(candidate.syncedLyrics);
    const trackTitle = `${candidate.trackName} – ${candidate.artistName}`;

    const updated = realignLyricsToAnalysisResult(
      analysisResult,
      lyricsToApply,
      isSynced,
      trackTitle
    );

    onApplyUpdatedResult(updated);
    onClose();
  };

  const handleApplyCustomLrc = () => {
    if (!customLrcText.trim()) return;
    const lrcLines = parseLrcContent(customLrcText);
    const isSynced = lrcLines.length >= 2;

    const updated = realignLyricsToAnalysisResult(
      analysisResult,
      customLrcText.trim(),
      isSynced,
      'Lời người dùng tự nhập'
    );

    onApplyUpdatedResult(updated);
    onClose();
  };

  const currentMatched = analysisResult.matchedTrackTitle || 'Chưa định danh';
  const hasMismatchWarning = Boolean(analysisResult.candidateWarning);

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Music2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Chọn Đúng Bài Hát &amp; Duyệt Kỹ Lời Hát</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">
                  Deep Verification
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Khớp chuẩn xác lời, âm tiết và cao độ từng nốt nhạc NewTone chỉ với 1 click
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

        {/* Warning Banner if Title Mismatch */}
        {hasMismatchWarning && (
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-300">
                Phát hiện lệch bài hát giữa Tên File và Lời Hệ Thống Khớp
              </div>
              <p className="text-slate-300 leading-relaxed">
                {analysisResult.candidateWarning}
              </p>
              <div className="text-[11px] text-slate-400 pt-1">
                Tên file của bạn: <span className="font-mono text-white">"{analysisResult.fileName}"</span> • Đang hiển thị: <span className="font-mono text-amber-300">"{currentMatched}"</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="px-5 pt-3 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('candidates')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeTab === 'candidates'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gợi Ý Phù Hợp ({candidates.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeTab === 'search'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm Kiếm Bài Khác</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tự Dán Lời / .LRC</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Thời lượng file: {Math.round(analysisResult.durationMs / 60000)}:{(Math.round((analysisResult.durationMs % 60000) / 1000) + '').padStart(2, '0')}</span>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Search bar inside 'search' or top of 'candidates' */}
          {activeTab === 'search' && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <label className="text-xs font-semibold text-slate-300">
                Nhập tên bài hát hoặc ca sĩ để tìm kiếm trên kho lời:
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRunSearch();
                    }}
                    placeholder="VD: Trời Giấu Trời Mang Đi, Giữa Đại Lộ Đông Tây, Nàng Thơ..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <button
                  type="button"
                  disabled={isSearching}
                  onClick={() => handleRunSearch()}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Tìm Kiếm</span>
                </button>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 rounded-2xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-200">
              {statusMessage}
            </div>
          )}

          {/* Candidates List View */}
          {(activeTab === 'candidates' || activeTab === 'search') && (
            <div className="space-y-3">
              {candidates.length === 0 && !isSearching && (
                <div className="p-8 text-center rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-2">
                  <Music2 className="w-8 h-8 text-slate-600 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">
                    Chưa có ứng viên bài hát phù hợp
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Hãy chuyển qua tab "Tìm Kiếm Bài Khác" để nhập tên bài hát, hoặc dán file lời bài hát của bạn.
                  </p>
                </div>
              )}

              {candidates.map((cand) => {
                const isCurrent =
                  currentMatched.toLowerCase().includes(cand.trackName.toLowerCase()) ||
                  cand.trackName.toLowerCase().includes(currentMatched.toLowerCase());
                const isExpanded = expandedPreviewId === cand.id;

                const lyricsPreview = (cand.syncedLyrics || cand.plainLyrics || '')
                  .split('\n')
                  .filter((l) => l.trim().length > 0)
                  .slice(0, 4)
                  .join('\n');

                return (
                  <div
                    key={cand.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-sky-950/30 border-sky-500/50 shadow-md shadow-sky-500/10'
                        : cand.confidenceLevel === 'high'
                        ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-850'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Song Meta */}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{cand.trackName}</span>
                            <span className="text-slate-400 font-normal">• {cand.artistName}</span>
                          </h4>

                          {cand.confidenceLevel === 'high' && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{cand.confidencePct}% Khớp</span>
                            </span>
                          )}

                          {cand.confidenceLevel === 'medium' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                              {cand.confidencePct}% Khớp một phần
                            </span>
                          )}

                          {cand.confidenceLevel === 'low' && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-[10px] font-bold text-rose-300">
                              {cand.confidencePct}% Khác tên file
                            </span>
                          )}

                          {cand.hasSyncedLyrics && (
                            <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-[10px] font-bold text-sky-300">
                              ✓ Có lời .LRC đồng bộ
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400">
                          {cand.matchReasonVi}
                        </p>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedPreviewId(isExpanded ? null : cand.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <span>Xem lời</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isCurrent ? (
                          <div className="px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>Đang Áp Dụng</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectCandidate(cand)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Áp Dụng Bài Này</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Lyrics Preview */}
                    {isExpanded && lyricsPreview && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-line animate-fade-in leading-relaxed">
                        {lyricsPreview}
                        <div className="text-[10px] text-slate-500 italic mt-1.5">
                          ... và các câu hát tiếp theo
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Manual LRC Paste View */}
          {activeTab === 'manual' && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Dán Lời Bài Hát Hoặc File .LRC Của Riêng Bạn
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nếu bạn có lời bài hát (mỗi câu 1 dòng) hoặc file có timestamp dạng <code>[00:15.50] Lời câu...</code>, hãy dán vào đây:
                </p>
              </div>

              <textarea
                rows={10}
                value={customLrcText}
                onChange={(e) => setCustomLrcText(e.target.value)}
                placeholder="[00:15.50] Nếu có bao giờ, nhìn lại quãng thời gian qua&#10;[00:20.10] Em có tiếc nuối những điều đã diễn ra&#10;..."
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-700/80 font-mono text-xs text-white focus:outline-none focus:border-sky-400 leading-relaxed custom-scrollbar"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={!customLrcText.trim()}
                  onClick={handleApplyCustomLrc}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Áp Dụng &amp; Căng Đều Theo Nốt NewTone</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Hệ thống hỗ trợ tự động đối chiếu âm học &amp; thanh điệu Tiếng Việt (Bằng - Huyền - Sắc - Nặng)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
