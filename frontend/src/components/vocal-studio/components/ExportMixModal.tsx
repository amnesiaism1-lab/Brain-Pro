import React, { useState } from 'react';
import {
  X,
  Download,
  AlertTriangle,
  UploadCloud,
  FileAudio,
  CheckCircle2,
  Sparkles,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { IYouTubeTake, IYouTubeSession, youtubeTakeStorageService } from '../../../services/youtubeTakeStorageService';
import { youtubeSyncMixer } from '../../../services/youtubeSyncMixer';

interface ExportMixModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: IYouTubeSession | null;
  activeTake: IYouTubeTake | null;
  takes: IYouTubeTake[];
}

export const ExportMixModal: React.FC<ExportMixModalProps> = ({
  isOpen,
  onClose,
  session,
  activeTake,
  takes,
}) => {
  const [localBeatFile, setLocalBeatFile] = useState<File | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderSuccess, setRenderSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadSoloWav = () => {
    if (!activeTake) return;
    youtubeTakeStorageService.downloadVocalTake(activeTake, `vocal-solo-${session?.videoId || 'take'}`);
  };

  const handleExportSession = () => {
    if (!session) return;
    youtubeTakeStorageService.exportSessionPackage(session, takes);
  };

  const handleSelectBeatFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLocalBeatFile(e.target.files[0]);
    }
  };

  const handleRenderOfflineMix = async () => {
    if (!localBeatFile || !activeTake) return;
    setIsRendering(true);
    setRenderProgress(10);
    setRenderSuccess(false);

    try {
      const mixedBlob = await youtubeSyncMixer.renderOfflineMixdown(
        localBeatFile,
        activeTake,
        (pct) => setRenderProgress(pct)
      );

      // Trigger download
      const url = URL.createObjectURL(mixedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mixed-master-take${activeTake.takeNumber}-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setRenderSuccess(true);
    } catch (err) {
      console.error('Offline mixdown failed:', err);
      alert('Không thể xuất bản phối. Vui lòng kiểm tra định dạng file beat.');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Xuất File & Bản Quyền Phối Âm</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* 1. TECHNICAL LIMITATION & COPYRIGHT TRANSPARENCY NOTICE */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Giới Hạn Kỹ Thuật YouTube & Bản Quyền Phát Hành</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              <strong>Vì sao không xuất trực tiếp file nhạc đã trộn cả beat YouTube?</strong>
              <br />
              Do chính sách bảo mật Cross-Origin (CORS) của trình duyệt và điều khoản YouTube, luồng âm thanh video YouTube không được phép tải xuống trực tiếp vào máy tính. Beat chỉ được phát đồng bộ trực tiếp (mix ảo) khi nghe trong app.
            </p>
            <p className="text-[10px] text-amber-300/80 italic border-t border-amber-500/20 pt-1.5">
              ⚖️ Lưu ý pháp lý: Beat thuộc bản quyền chủ sở hữu trên YouTube. Bản thu chỉ dùng cho mục đích học tập cá nhân, không tự ý đăng tải thương mại khi chưa có bản quyền beat.
            </p>
          </div>

          {/* Active Take Metadata Preview */}
          {activeTake && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-white flex items-center gap-2">
                  <span>Take #{activeTake.takeNumber}</span>
                  {activeTake.isBestTake && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      ★ Best Take
                    </span>
                  )}
                  <span className="text-slate-400 font-normal">({activeTake.note || 'Bản thu giọng'})</span>
                </span>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span>Thời lượng: {Math.round(activeTake.durationSec)}s</span>
                  <span>•</span>
                  <span>WAV 16-bit PCM / 44.1kHz</span>
                  <span>•</span>
                  <span>~{Math.max(0.1, (activeTake.durationSec * 44100 * 2 * 2 / 1024 / 1024)).toFixed(1)} MB</span>
                </div>
              </div>
              <div className="text-right text-[10px] font-mono text-emerald-400">
                Sẵn sàng xuất file
              </div>
            </div>
          )}

          {/* 2. EXPORT OPTIONS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white">Các tùy chọn xuất file có sẵn:</h4>

            {/* Option A: Solo Vocal Track WAV */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">
                  1. Tải Track Giọng Thu Mộc (WAV 16-bit Lossless)
                </span>
                <span className="text-[11px] text-slate-400">
                  Xuất riêng giọng hát chất lượng cao của Take đang chọn (Take #{activeTake?.takeNumber || 1}) để tự import vào Reaper, FL Studio, Audacity...
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadSoloWav}
                disabled={!activeTake}
                className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải WAV</span>
              </button>
            </div>

            {/* Option B: Export Session JSON */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">
                  2. Xuất Gói Phiên Làm Việc (Session JSON)
                </span>
                <span className="text-[11px] text-slate-400">
                  Lưu cấu hình mốc thời gian, độ lệch mili-giây (nudge), ghi chú các take để lưu trữ hoặc nạp lại.
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportSession}
                disabled={!session}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-40"
              >
                <FileAudio className="w-3.5 h-3.5" />
                <span>Xuất Session</span>
              </button>
            </div>

            {/* Option C: Mixdown with Local Beat File */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-200 block">
                    3. Trộn Bản Phối Hoàn Chỉnh (Có Cả Beat + Giọng Hát)
                  </span>
                  <span className="text-[11px] text-slate-300">
                    Nếu bạn có file beat âm thanh hợp pháp (MP3, WAV, M4A), hãy tải lên tại đây. Engine sẽ tự động căn chuẩn mốc hát, áp dụng Reverb & Compressor và xuất ra file WAV hoàn chỉnh!
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center gap-2">
                <label className="flex-1 w-full px-3 py-2 rounded-xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-400 text-xs text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition">
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                  <span className="truncate">
                    {localBeatFile ? localBeatFile.name : 'Chọn file Beat (MP3/WAV)...'}
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleSelectBeatFile}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleRenderOfflineMix}
                  disabled={!localBeatFile || !activeTake || isRendering}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isRendering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang trộn ({renderProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Trộn & Tải File Phối WAV</span>
                    </>
                  )}
                </button>
              </div>

              {renderSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Đã trộn và tải về thành công bản phối hoàn chỉnh!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
