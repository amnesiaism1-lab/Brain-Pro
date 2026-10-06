import React from 'react';
import { Mic, MicOff, AlertCircle, Loader2 } from 'lucide-react';
import { MicStatus } from '../types';

interface MicStatusBadgeProps {
  status: MicStatus;
  volumeDb?: number;
  isSinging?: boolean;
  onRetry?: () => void;
  onOpenPreflight?: () => void;
}

export const MicStatusBadge: React.FC<MicStatusBadgeProps> = ({
  status,
  volumeDb = -100,
  isSinging = false,
  onRetry,
  onOpenPreflight,
}) => {
  // Normalize volume Db (-60 to 0) to 0..100%
  const normalizedLevel = Math.max(0, Math.min(100, ((volumeDb + 60) / 60) * 100));

  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-950/70 border border-sky-500/40 text-sky-300 text-xs font-semibold">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
        <span>Đang kết nối Mic...</span>
      </div>
    );
  }

  if (status === 'permission_denied' || status === 'error') {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold">
        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>Chưa cấp quyền Micro</span>
        {onOpenPreflight && (
          <button
            type="button"
            onClick={onOpenPreflight}
            className="underline hover:text-white text-[11px] font-bold"
          >
            Kiểm tra
          </button>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-1.5 py-0.5 rounded bg-rose-800/80 text-[10px] font-bold hover:bg-rose-700"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (status === 'listening') {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-700/80 backdrop-blur-sm text-xs">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSinging ? 'bg-emerald-400' : 'bg-sky-400'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isSinging ? 'bg-emerald-500' : 'bg-sky-500'}`} />
          </span>
          <Mic className={`w-3.5 h-3.5 ${isSinging ? 'text-emerald-400' : 'text-slate-300'}`} />
          <span className="font-mono text-[11px] text-slate-300 hidden sm:inline">
            {isSinging ? 'Đang hát' : 'Micro sẵn sàng'}
          </span>
        </div>

        {/* Real-time mini VU level meter bar */}
        <div className="w-10 h-1.5 bg-slate-800 rounded-full overflow-hidden flex items-center" title={`Âm lượng: ${Math.round(volumeDb)} dB`}>
          <div
            className={`h-full transition-all duration-75 rounded-full ${
              isSinging ? 'bg-emerald-400' : 'bg-sky-400'
            }`}
            style={{ width: `${normalizedLevel}%` }}
          />
        </div>
      </div>
    );
  }

  // Idle
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
      <MicOff className="w-3.5 h-3.5" />
      <span>Micro tắt</span>
    </div>
  );
};
