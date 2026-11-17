import React, { useState } from 'react';
import { AlertTriangle, Sparkles, RefreshCw, Wand2, Edit3, X, Loader2 } from 'lucide-react';
import type { IAlignmentHealthReport } from '../../../services/lyricAlignmentService';

interface AlignmentHealthBannerProps {
  audit?: IAlignmentHealthReport;
  onAiFillMissingGaps: () => Promise<void>;
  onStripTimestampsRealign: () => void;
  onOpenSongCandidateModal?: () => void;
  onOpenLyricEditor?: () => void;
}

export const AlignmentHealthBanner: React.FC<AlignmentHealthBannerProps> = ({
  audit,
  onAiFillMissingGaps,
  onStripTimestampsRealign,
  onOpenSongCandidateModal,
  onOpenLyricEditor,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [isPatching, setIsPatching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!audit || dismissed) return null;
  if (audit.status !== 'partial_gaps' && audit.status !== 'mismatch_suspected') return null;

  const isMismatch = audit.status === 'mismatch_suspected';

  const handleGapFillClick = async () => {
    setIsPatching(true);
    setErrorMsg(null);
    try {
      await onAiFillMissingGaps();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể vá lời AI. Hãy mở tab Tạo Lời AI để kiểm tra Key.');
    } finally {
      setIsPatching(false);
    }
  };

  return (
    <div
      className={`rounded-2xl p-3.5 border flex flex-col gap-2.5 animate-fade-in shadow-md ${
        isMismatch
          ? 'bg-rose-950/60 border-rose-500/40 text-rose-100'
          : 'bg-amber-950/50 border-amber-500/40 text-amber-100'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              isMismatch ? 'text-rose-400' : 'text-amber-400'
            }`}
          />
          <div className="text-xs">
            <div className="font-black">
              {isMismatch
                ? 'Phát hiện bản LRC không khớp với bài hát hiện tại'
                : `Phát hiện ${audit.missingGapRanges.length} đoạn hát bị thiếu lời trong LRC`}
            </div>
            <p className="text-[11px] opacity-85 mt-0.5">{audit.summaryVi}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isMismatch && onOpenSongCandidateModal && (
            <button
              type="button"
              onClick={onOpenSongCandidateModal}
              className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đổi Bản LRC Khác</span>
            </button>
          )}

          {isMismatch && (
            <button
              type="button"
              onClick={onStripTimestampsRealign}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
              title="Bỏ mốc thời gian cũ bị sai và tự căng lời vào các cụm nốt nhạc thực tế"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Bỏ Giờ LRC Lệch &amp; Căn Lại</span>
            </button>
          )}

          {!isMismatch && audit.missingGapRanges.length > 0 && (
            <button
              type="button"
              disabled={isPatching}
              onClick={handleGapFillClick}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Chỉ gửi đúng các đoạn giây bị thiếu sang AI bóc lời và giữ nguyên các câu đã khớp"
            >
              {isPatching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isPatching ? 'Đang vá...' : `AI Vá ${audit.missingGapRanges.length} Đoạn Thiếu`}</span>
            </button>
          )}

          {onOpenLyricEditor && (
            <button
              type="button"
              onClick={onOpenLyricEditor}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Sửa / Tap-Sync</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Ẩn thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="text-[11px] text-rose-200 bg-black/30 px-3 py-1.5 rounded-xl">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
