import React, { useState } from 'react';
import { useMidiInput } from '../../hooks/useMidiInput';
import { auditoryEngine } from '../../services/auditoryEngine';
import { Piano, Check, AlertCircle, ChevronDown, RefreshCw } from 'lucide-react';

interface IMidiStatusIndicatorProps {
  className?: string;
  compact?: boolean;
}

export const MidiStatusIndicator: React.FC<IMidiStatusIndicatorProps> = ({
  className = '',
  compact = false
}) => {
  const { isSupported, isConnected, activeDeviceName, devices, requestAccess, selectDevice } = useMidiInput({
    autoPlayAudio: false // Handled elsewhere or as passive indicator
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    auditoryEngine.resumeAudioContext().catch(() => {});
    setIsConnecting(true);
    try {
      await requestAccess();
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isSupported) {
    if (compact) return null;
    return (
      <div 
        title="Web MIDI API không được hỗ trợ trên trình duyệt này (khuyên dùng Chrome, Edge, Brave)"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-300/60 dark:border-slate-700/60 select-none ${className}`}
      >
        <Piano className="w-3.5 h-3.5 opacity-50" />
        <span>MIDI không hỗ trợ</span>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {isConnected ? (
        <button
          type="button"
          onClick={() => {
            auditoryEngine.resumeAudioContext().catch(() => {});
            setIsOpen(!isOpen);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 shadow-sm transition-all active:scale-95"
          title={`Đã kết nối: ${activeDeviceName}. Bấm để đổi thiết bị.`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Piano className="w-3.5 h-3.5" />
          <span className="max-w-[120px] truncate">{activeDeviceName || 'MIDI Connected'}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          disabled={isConnecting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/20 shadow-sm transition-all active:scale-95 cursor-pointer"
          title="Bấm để kết nối đàn piano MIDI (USB/Bluetooth)"
        >
          {isConnecting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Piano className="w-3.5 h-3.5" />
          )}
          <span>{isConnecting ? 'Đang tìm...' : 'Kết nối MIDI'}</span>
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && isConnected && (
        <div className="absolute right-0 mt-2 w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Piano className="w-3.5 h-3.5 text-brand-500" />
              Thiết Bị MIDI Nhận Được
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Đóng
            </button>
          </div>

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {devices.length === 0 ? (
              <p className="text-xs text-slate-400 p-2">Không tìm thấy thiết bị MIDI nào.</p>
            ) : (
              devices.map(device => {
                const isActive = device.name === activeDeviceName;
                return (
                  <button
                    key={device.id}
                    onClick={() => {
                      selectDevice(device.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{device.name}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-brand-500 shrink-0" />
            <span>Chơi đàn MIDI để nhập nốt trực tiếp!</span>
          </div>
        </div>
      )}
    </div>
  );
};
