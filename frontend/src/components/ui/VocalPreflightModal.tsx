import React, { useState, useEffect, useRef } from 'react';
import { Mic, Headphones, Volume2, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, X } from 'lucide-react';
import { vocalPitchService, IVocalPitchReading } from '../../services/vocalPitchService';
import { VocalRangePreference } from '@brain-exercises/shared';

interface VocalPreflightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (selectedRange: VocalRangePreference) => void;
}

export const VocalPreflightModal: React.FC<VocalPreflightModalProps> = ({
  isOpen,
  onClose,
  onProceed,
}) => {
  const [micState, setMicState] = useState<'idle' | 'testing' | 'granted' | 'denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<VocalRangePreference>('auto');
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [detectedPitch, setDetectedPitch] = useState<string>('--');
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setMicState('idle');
      setLiveVolume(0);
      setDetectedPitch('--');
      return;
    }

    // Auto-test mic when opened
    handleTestMic();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    vocalPitchService.stopListening(true);
    onClose();
  };

  const handleProceedClick = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    onProceed(selectedRange);
  };

  const handleTestMic = async () => {
    setMicState('testing');
    setErrorMessage(null);

    try {
      await vocalPitchService.startListening();
      setMicState('granted');

      // Subscribe to test volume
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      unsubscribeRef.current = vocalPitchService.subscribe((reading: IVocalPitchReading) => {
        const db = reading.volumeDb;
        const norm = Math.max(0, Math.min(100, ((db + 50) / 45) * 100));
        setLiveVolume(norm);
        if (reading.isSinging && reading.noteName) {
          setDetectedPitch(`${reading.noteName} (${reading.solfegeName})`);
        }
      });
    } catch (err: unknown) {
      setMicState('denied');
      const msg = err instanceof Error ? err.message : 'Không thể truy cập microphone';
      if (msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowedError')) {
        setErrorMessage('Quyền truy cập micro đã bị từ chối trong trình duyệt. Vui lòng bấm vào biểu tượng ổ khóa hoặc camera trên thanh địa chỉ để mở quyền micro.');
      } else {
        setErrorMessage('Không tìm thấy thiết bị thu âm hoặc micro đang bận bởi ứng dụng khác.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Icon */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Mic className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Chuẩn Bị Luyện Giọng Hát</h3>
            <p className="text-xs text-slate-400">Kiểm tra kết nối Microphone & Quãng giọng của bạn</p>
          </div>
        </div>

        {/* Headphones Recommendation Alert */}
        <div className="flex items-start gap-3 p-3.5 mb-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300">
          <Headphones className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white block mb-0.5">Khuyến nghị đeo tai nghe</span>
            Đeo tai nghe giúp micro không thu lại âm thanh của loa ngoài, đảm bảo thuật toán nhận diện cao độ giọng bạn chuẩn xác 100%.
          </div>
        </div>

        {/* Mic Status & Live VU Meter */}
        <div className="p-4 mb-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              {micState === 'granted' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Microphone đang hoạt động tốt</span>
                </>
              ) : micState === 'denied' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-400">Microphone bị chặn hoặc lỗi</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-amber-300">Đang khởi tạo âm thanh...</span>
                </>
              )}
            </span>

            {micState === 'granted' && (
              <span className="text-[11px] font-mono font-bold text-slate-400">
                Cao độ thử: <span className="text-emerald-300">{detectedPitch}</span>
              </span>
            )}
          </div>

          {/* VU Meter Visualizer */}
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-1">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                liveVolume > 75 ? 'bg-rose-500' : liveVolume > 20 ? 'bg-emerald-400' : 'bg-slate-700'
              }`}
              style={{ width: `${liveVolume}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 block text-right font-mono">
            {micState === 'granted' ? 'Hãy thử "Aaaa" để kiểm tra sóng âm thanh' : 'Đang chờ cấp quyền...'}
          </span>

          {errorMessage && (
            <p className="mt-2 text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Vocal Range Preference Selector */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Chọn Quãng Giọng Tự Nhiên Của Bạn:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSelectedRange('auto')}
              className={`p-3 rounded-2xl border text-left transition ${
                selectedRange === 'auto'
                  ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>Tự động (Octave-Fold)</span>
                {selectedRange === 'auto' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Mọi quãng giọng (Tự dịch chuyển quãng tám)</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRange('bass-baritone')}
              className={`p-3 rounded-2xl border text-left transition ${
                selectedRange === 'bass-baritone'
                  ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>Nam Trầm / Trung</span>
                {selectedRange === 'bass-baritone' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Bass / Baritone (C2 – E4)</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRange('tenor-alto')}
              className={`p-3 rounded-2xl border text-left transition ${
                selectedRange === 'tenor-alto'
                  ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>Nam Cao & Nữ Trầm</span>
                {selectedRange === 'tenor-alto' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Tenor / Alto (G2 – A4)</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRange('soprano')}
              className={`p-3 rounded-2xl border text-left transition ${
                selectedRange === 'soprano'
                  ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between">
                <span>Nữ Cao (Soprano)</span>
                {selectedRange === 'soprano' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Soprano / Mezzo (C3 – C5)</div>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white transition"
          >
            Hủy Bỏ
          </button>

          {micState === 'denied' ? (
            <button
              onClick={handleTestMic}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition shadow-lg shadow-amber-400/20"
            >
              Thử Lại Micro
            </button>
          ) : (
            <button
              onClick={handleProceedClick}
              disabled={micState === 'testing'}
              className="px-6 py-2.5 rounded-xl font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition shadow-lg shadow-emerald-400/25 flex items-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Bắt Đầu Luyện Giọng</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
