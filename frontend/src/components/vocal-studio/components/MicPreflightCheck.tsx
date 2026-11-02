import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Headphones,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  vocalRecordingEngine,
  IAudioInputConfig,
  IMicCheckResult,
} from '../../../services/vocalRecordingEngine';
import { formatTimeMs } from '../utils/vocalHelpers';

interface MicPreflightCheckProps {
  onCheckCompleted: (isReady: boolean) => void;
  beatCurrentTimeSec: number;
  beatDurationSec: number;
  selectedStartPointSec: number;
  onSetStartPointSec: (sec: number) => void;
  onPreviewBeatSeek?: (sec: number) => void;
  onTogglePreviewBeat?: () => void;
  isPreviewingBeat?: boolean;
}

export const MicPreflightCheck: React.FC<MicPreflightCheckProps> = ({
  onCheckCompleted,
  beatCurrentTimeSec,
  beatDurationSec,
  selectedStartPointSec,
  onSetStartPointSec,
  onPreviewBeatSeek,
  onTogglePreviewBeat,
  isPreviewingBeat,
}) => {
  // Device & DSP settings
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [dspConfig, setDspConfig] = useState<IAudioInputConfig>({
    echoCancellation: false, // Default off for headset studio recording
    noiseSuppression: true,
    autoGainControl: false,
  });

  // Mic test state
  const [isChecking, setIsChecking] = useState(false);
  const [countdownSec, setCountdownSec] = useState(5);
  const [vuRms, setVuRms] = useState(0);
  const [vuDb, setVuDb] = useState(-80);
  const [checkResult, setCheckResult] = useState<IMicCheckResult | null>(null);

  // Headphone confirmation
  const [hasHeadphones, setHasHeadphones] = useState(true);

  // Device dropdown toggle
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [showAdvancedDsp, setShowAdvancedDsp] = useState(false);

  // Fetch devices on mount
  useEffect(() => {
    vocalRecordingEngine.getAvailableMicrophones().then((list) => {
      setDevices(list);
      if (list.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(list[0].deviceId);
      }
    });
  }, []);

  // Run 5-second mic check
  const handleStartMicCheck = async () => {
    setIsChecking(true);
    setCheckResult(null);
    setCountdownSec(5);

    const timer = setInterval(() => {
      setCountdownSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const result = await vocalRecordingEngine.runMicCheck((rms, db, isDetected) => {
        setVuRms(rms);
        setVuDb(db);
      }, 5000);

      setCheckResult(result);
      onCheckCompleted(result.hasSignal);
    } catch (err: any) {
      setCheckResult({
        hasSignal: false,
        peakDb: -80,
        averageDb: -80,
        message: 'Không thể truy cập microphone. Vui lòng cấp quyền micro trong trình duyệt.',
      });
      onCheckCompleted(false);
    } finally {
      clearInterval(timer);
      setIsChecking(false);
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setIsDeviceMenuOpen(false);
    await vocalRecordingEngine.switchMicrophone(deviceId);
  };

  const handleToggleDsp = async (key: keyof IAudioInputConfig) => {
    const next = { ...dspConfig, [key]: !dspConfig[key] };
    setDspConfig(next);
    await vocalRecordingEngine.updateDspSettings(next);
  };

  const activeDeviceLabel =
    devices.find((d) => d.deviceId === selectedDeviceId)?.label ||
    (devices.length > 0 ? 'Microphone mặc định' : 'Chưa tìm thấy Mic');

  return (
    <div className="space-y-4">
      {/* 1. HEADPHONE REMINDER BANNER (CRITICAL STEP) */}
      <div className={`p-4 rounded-2xl border transition-all ${
        hasHeadphones
          ? 'bg-slate-900/80 border-slate-800'
          : 'bg-amber-950/30 border-amber-500/40'
      }`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Nhắc nhở: Đeo tai nghe khi thu</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  Bắt buộc
                </span>
              </h4>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
              Nếu không dùng tai nghe, tiếng beat từ loa ngoài sẽ lọt ngược vào micro, khiến bản thu bị vang (echo) và lệch pha không thể sửa được.
            </p>
            <label className="inline-flex items-center gap-2 mt-2.5 cursor-pointer text-xs font-semibold text-slate-200 hover:text-white">
              <input
                type="checkbox"
                checked={hasHeadphones}
                onChange={(e) => setHasHeadphones(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-400 cursor-pointer"
              />
              <span>Tôi xác nhận đã đeo tai nghe</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2. MICROPHONE SELECTION & 5-SECOND CHECK */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Mic className="w-4 h-4 text-sky-400" />
              <span>Kiểm Tra Tín Hiệu Microphone (5 Giây)</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Kiểm tra xem âm thanh mic có vào tốt không trước khi bấm thu thật
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartMicCheck}
            disabled={isChecking}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/10 cursor-pointer disabled:opacity-50"
          >
            {isChecking ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang thử mic ({countdownSec}s)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bắt đầu kiểm tra 5s</span>
              </>
            )}
          </button>
        </div>

        {/* Real-time VU Meter Bar */}
        <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              Mức âm lượng đầu vào:
            </span>
            <span className={`font-bold ${vuDb > -30 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isChecking ? `${Math.round(vuDb)} dBFS` : '-- dBFS'}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                vuDb > -12
                  ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500'
                  : vuDb > -36
                  ? 'bg-gradient-to-r from-emerald-500 to-sky-400'
                  : 'bg-emerald-600'
              }`}
              style={{
                width: isChecking ? `${Math.min(100, Math.max(2, (vuDb + 60) * 1.8))}%` : '2%',
              }}
            />
          </div>

          {/* Test Status Feedback */}
          {checkResult && (
            <div className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
              checkResult.hasSignal
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {checkResult.hasSignal ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="font-semibold">{checkResult.message}</span>
            </div>
          )}
        </div>

        {/* Device Selection & Advanced DSP Settings */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Device dropdown */}
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Mic className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{activeDeviceLabel}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-2 shrink-0" />
            </button>

            {isDeviceMenuOpen && (
              <div className="absolute left-0 right-0 bottom-full mb-1.5 z-30 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 max-h-48 overflow-y-auto">
                {devices.map((device) => (
                  <button
                    key={device.deviceId}
                    type="button"
                    onClick={() => handleDeviceChange(device.deviceId)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition truncate cursor-pointer ${
                      device.deviceId === selectedDeviceId
                        ? 'bg-sky-500/20 text-sky-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    {device.label || `Microphone (${device.deviceId.slice(0, 8)})`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle DSP panel */}
          <button
            type="button"
            onClick={() => setShowAdvancedDsp(!showAdvancedDsp)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Xử lý âm thanh (DSP)</span>
          </button>
        </div>

        {/* DSP Options Drawer */}
        {showAdvancedDsp && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="font-semibold text-white block">Khử tiếng vang (Echo Cancellation)</span>
                <span className="text-[10px] text-slate-400">
                  Tắt khi dùng tai nghe để giọng mộc tự nhiên không bị méo.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleDsp('echoCancellation')}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  dspConfig.echoCancellation ? 'bg-sky-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    dspConfig.echoCancellation ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-slate-800/60">
              <div>
                <span className="font-semibold text-white block">Lọc tạp âm (Noise Suppression)</span>
                <span className="text-[10px] text-slate-400">Giảm tiếng quạt gió và tiếng ồn môi trường.</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleDsp('noiseSuppression')}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  dspConfig.noiseSuppression ? 'bg-sky-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    dspConfig.noiseSuppression ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-slate-800/60">
              <div>
                <span className="font-semibold text-white block">Tự động chỉnh Gain (AGC)</span>
                <span className="text-[10px] text-slate-400">Nên tắt để giữ trọn vẹn sắc thái to/nhỏ của bài hát.</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleDsp('autoGainControl')}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  dspConfig.autoGainControl ? 'bg-sky-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    dspConfig.autoGainControl ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. CHỌN ĐIỂM BẮT ĐẦU HÁT TRONG BEAT (SKIP INTRO) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Điểm Bắt Đầu Hát Trong Beat</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Bỏ qua đoạn intro nhạc dạo dài để tiết kiệm thời gian và vào hát đúng nhịp
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onTogglePreviewBeat && (
              <button
                type="button"
                onClick={onTogglePreviewBeat}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isPreviewingBeat
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isPreviewingBeat ? 'Dừng nghe thử' : 'Nghe thử beat tại mốc này'}
              >
                {isPreviewingBeat ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPreviewingBeat ? 'Dừng' : 'Nghe thử'}</span>
              </button>
            )}
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {formatTimeMs(Math.round(selectedStartPointSec * 1000))}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={Math.max(10, beatDurationSec || 240)}
            step={1}
            value={selectedStartPointSec}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onSetStartPointSec(val);
              onPreviewBeatSeek?.(val);
            }}
            className="w-full accent-emerald-400 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>00:00 (Đầu beat)</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onSetStartPointSec(beatCurrentTimeSec);
                }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition cursor-pointer"
              >
                Lấy mốc đang nghe ({formatTimeMs(Math.round(beatCurrentTimeSec * 1000))})
              </button>
              <button
                type="button"
                onClick={() => onSetStartPointSec(0)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-semibold transition cursor-pointer"
              >
                Đặt về 0s
              </button>
            </div>
            <span>{formatTimeMs(Math.round((beatDurationSec || 240) * 1000))}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
