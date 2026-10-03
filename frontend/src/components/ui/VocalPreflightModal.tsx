import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Headphones,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  X,
  Play,
  Square,
  RotateCcw,
  Sliders,
  Wand2,
  RefreshCw,
  Activity,
  Radio,
  Info
} from 'lucide-react';
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
  
  // Real-time audio readings
  const [liveVolumeDb, setLiveVolumeDb] = useState<number>(-100);
  const [liveVolumePercent, setLiveVolumePercent] = useState<number>(0);
  const [detectedPitch, setDetectedPitch] = useState<string | null>(null);
  const [liveFreqHz, setLiveFreqHz] = useState<number>(0);
  const [isSingingDetected, setIsSingingDetected] = useState<boolean>(false);

  // Audio devices
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Noise gate & calibration
  const [noiseGateDb, setNoiseGateDb] = useState<number>(vocalPitchService.getNoiseGateDb());
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationNotice, setCalibrationNotice] = useState<string | null>(null);

  // Voice Focus (Rejects door slams, desk knocks, keyboard clicks)
  const [isVoiceFocus, setIsVoiceFocus] = useState<boolean>(vocalPitchService.getVoiceFocus());

  // Test recording & playback
  const [isRecordingTest, setIsRecordingTest] = useState<boolean>(false);
  const [recordCountdown, setRecordCountdown] = useState<number>(3);
  const [hasTestAudio, setHasTestAudio] = useState<boolean>(false);
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState<boolean>(false);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState<boolean>(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordTimerRef = useRef<number | null>(null);

  // Load devices and start listening when opened
  useEffect(() => {
    if (!isOpen) {
      cleanupResources();
      return;
    }

    handleInitMicrophone();

    return () => {
      cleanupResources();
    };
  }, [isOpen]);

  const cleanupResources = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    vocalPitchService.setLiveMonitoring(false);
    vocalPitchService.stopPlayback();
    setIsLiveMonitoring(false);
    setIsPlayingTestAudio(false);
    setIsRecordingTest(false);
    setMicState('idle');
    setLiveVolumeDb(-100);
    setLiveVolumePercent(0);
    setDetectedPitch(null);
    setLiveFreqHz(0);
    setIsSingingDetected(false);
  };

  const handleInitMicrophone = async () => {
    setMicState('testing');
    setErrorMessage(null);

    try {
      await vocalPitchService.startListening(selectedDeviceId || undefined);
      setMicState('granted');

      // Refresh device list
      await refreshDeviceList();

      // Subscribe to telemetry
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = vocalPitchService.subscribe((reading: IVocalPitchReading) => {
        const db = reading.volumeDb;
        setLiveVolumeDb(db);

        // Normalize dB (-60 dBFS to -5 dBFS) to 0-100%
        const norm = Math.max(0, Math.min(100, ((db + 60) / 55) * 100));
        setLiveVolumePercent(norm);

        if (reading.isSinging && reading.noteName) {
          setDetectedPitch(`${reading.noteName} (${reading.solfegeName})`);
          setLiveFreqHz(reading.freqHz);
          setIsSingingDetected(true);
        } else {
          // Clear pitch when silent so it doesn't falsely display stale electrical hum
          setDetectedPitch(null);
          setLiveFreqHz(0);
          setIsSingingDetected(false);
        }
      });
    } catch (err: unknown) {
      setMicState('denied');
      const msg = err instanceof Error ? err.message : 'Không thể truy cập microphone';
      if (msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowedError')) {
        setErrorMessage('Quyền truy cập micro đã bị từ chối trong trình duyệt. Vui lòng bấm vào biểu tượng ổ khóa hoặc camera trên thanh địa chỉ để cấp quyền micro.');
      } else {
        setErrorMessage('Không tìm thấy thiết bị thu âm hoặc micro đang bận bởi ứng dụng khác.');
      }
    }
  };

  const refreshDeviceList = async () => {
    const devices = await vocalPitchService.getAudioInputDevices();
    setAudioDevices(devices);
    const currId = vocalPitchService.getCurrentDeviceId();
    if (currId) {
      setSelectedDeviceId(currId);
    } else if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].deviceId);
    }
  };

  const handleDeviceChange = async (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    try {
      setMicState('testing');
      await vocalPitchService.switchAudioInputDevice(newDeviceId);
      setMicState('granted');
    } catch (e) {
      console.warn('Switch device error:', e);
      setMicState('denied');
      setErrorMessage('Không thể chuyển đổi sang thiết bị micro này.');
    }
  };

  // Waveform oscilloscope renderer
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderWaveform = () => {
      animId = requestAnimationFrame(renderWaveform);
      const analyser = vocalPitchService.getMicAnalyser();
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      if (!analyser || micState !== 'granted') {
        // Draw baseline
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      ctx.lineWidth = isSingingDetected ? 2.5 : 1.5;
      ctx.strokeStyle = isSingingDetected ? '#10b981' : liveVolumeDb > noiseGateDb ? '#38bdf8' : '#64748b';
      ctx.beginPath();

      const sliceWidth = w / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(w, h / 2);
      ctx.stroke();
    };

    renderWaveform();
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, micState, isSingingDetected, liveVolumeDb, noiseGateDb]);

  // Test Recording 3s
  const handleStartTestRecord = async () => {
    if (isRecordingTest) return;
    try {
      vocalPitchService.stopPlayback();
      setIsPlayingTestAudio(false);
      setHasTestAudio(false);

      await vocalPitchService.startTestRecording();
      setIsRecordingTest(true);
      setRecordCountdown(3);

      let count = 3;
      recordTimerRef.current = window.setInterval(async () => {
        count -= 1;
        if (count <= 0) {
          if (recordTimerRef.current) {
            clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
          }
          try {
            await vocalPitchService.stopTestRecording();
            setHasTestAudio(true);
          } catch (e) {
            console.warn('Failed to stop test recording:', e);
          }
          setIsRecordingTest(false);
        } else {
          setRecordCountdown(count);
        }
      }, 1000);
    } catch (e) {
      console.error('Error starting test recording:', e);
      setIsRecordingTest(false);
    }
  };

  const handleTogglePlayTest = () => {
    if (isPlayingTestAudio) {
      vocalPitchService.stopPlayback();
      setIsPlayingTestAudio(false);
    } else {
      setIsPlayingTestAudio(true);
      const audio = vocalPitchService.playTestRecording(() => {
        setIsPlayingTestAudio(false);
      });
      if (!audio) setIsPlayingTestAudio(false);
    }
  };

  const handleToggleLiveMonitor = () => {
    const nextState = !isLiveMonitoring;
    setIsLiveMonitoring(nextState);
    vocalPitchService.setLiveMonitoring(nextState);
  };

  const handleToggleVoiceFocus = () => {
    const nextState = !isVoiceFocus;
    setIsVoiceFocus(nextState);
    vocalPitchService.setVoiceFocus(nextState);
  };

  // Auto-calibrate noise floor
  const handleAutoCalibrate = async () => {
    setIsCalibrating(true);
    setCalibrationNotice(null);
    try {
      const result = await vocalPitchService.calibrateNoiseFloor(1500);
      setNoiseGateDb(result.suggestedGateDb);
      setCalibrationNotice(
        `Đã cân chỉnh: Tạp âm Ugreen/phòng là ${result.ambientDb} dBFS. Đã đặt màng lọc ồn tại ${result.suggestedGateDb} dBFS.`
      );
    } catch (e) {
      console.warn('Calibration error:', e);
    } finally {
      setIsCalibrating(false);
    }
  };

  const handleSetGatePreset = (gateDb: number) => {
    setNoiseGateDb(gateDb);
    vocalPitchService.setNoiseGateDb(gateDb);
    setCalibrationNotice(null);
  };

  const handleClose = () => {
    cleanupResources();
    vocalPitchService.stopListening(true);
    onClose();
  };

  const handleProceedClick = () => {
    cleanupResources();
    vocalPitchService.setUserRange(selectedRange);
    onProceed(selectedRange);
  };

  if (!isOpen) return null;

  // Calculate percentage position of noise gate on the VU bar (-60dB to -5dB)
  const gatePercent = Math.max(0, Math.min(100, ((noiseGateDb + 60) / 55) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden my-auto">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Mic className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Kiểm Tra Micro & Khử Rè</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                Lọc 80Hz Low-Cut
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Kiểm tra mic ISK AT100 / Soundcard Ugreen, nghe lại âm thanh thu và khử nhiễu điện
            </p>
          </div>
        </div>

        {/* Device Selector & Hardware filter info */}
        <div className="p-3 mb-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              <span>Thiết bị Microphone (Audio Input):</span>
            </label>
            <button
              onClick={refreshDeviceList}
              title="Làm mới danh sách thiết bị"
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Quét lại</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              {audioDevices.length > 0 ? (
                audioDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId}>
                    {dev.label || `Microphone ${idx + 1}`}
                  </option>
                ))
              ) : (
                <option value="">Microphone mặc định hệ thống</option>
              )}
            </select>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>
              Bộ lọc High-Pass 80Hz đã được kích hoạt: Tự động loại bỏ tiếng rè điện 50Hz xoay chiều và quạt tản nhiệt.
            </span>
          </div>
        </div>

        {/* STUDIO TEST & PLAYBACK: Chức năng test mic và play */}
        <div className="p-3.5 mb-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-indigo-400" />
              <span>Phòng Thử Âm Thanh (Mic Test & Nghe Lại)</span>
            </span>
            <span className="text-[10px] text-indigo-300 font-mono">
              Kiểm tra âm thanh thực tế mic thu được
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            {/* Action 1: Thu âm thử 3 giây */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>1. Thu Thử 3 Giây:</span>
                {isRecordingTest && (
                  <span className="text-rose-400 animate-pulse font-mono text-[10px]">
                    Đang thu: {recordCountdown}s
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleStartTestRecord}
                disabled={isRecordingTest || micState !== 'granted'}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                  isRecordingTest
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
                } disabled:opacity-50`}
              >
                {isRecordingTest ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
                    <span>Đang thu ({recordCountdown}s)...</span>
                  </>
                ) : (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span>Bấm Thu Âm Thử 3s</span>
                  </>
                )}
              </button>
            </div>

            {/* Action 2: Phát lại âm thanh vừa thu */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>2. Nghe Lại Bản Thu:</span>
                {hasTestAudio && (
                  <span className="text-emerald-400 text-[10px]">Đã có bản thu 3s</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleTogglePlayTest}
                disabled={!hasTestAudio || isRecordingTest}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
                  isPlayingTestAudio
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : hasTestAudio
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isPlayingTestAudio ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Tạm Dừng Nghe</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{hasTestAudio ? '▶ Nghe Lại Âm Thu Được' : 'Chưa có bản thu'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action 3: Live Monitoring loopback */}
          <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px]">
            <div className="flex items-center gap-2 text-slate-300">
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <span>Nghe mic trực tiếp vào tai nghe (Live Monitor):</span>
            </div>
            <button
              type="button"
              onClick={handleToggleLiveMonitor}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition ${
                isLiveMonitoring
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isLiveMonitoring ? 'Đang BẬT' : 'Đang TẮT'}
            </button>
          </div>
          {isLiveMonitoring && (
            <p className="text-[10px] text-amber-400 mt-1.5 px-1">
              * Lưu ý: Hãy chắc chắn bạn đang đeo tai nghe để âm thanh loa ngoài không dội ngược lại vào mic gây hú.
            </p>
          )}
        </div>

        {/* Visualizer: Real-time Oscilloscope Waveform & Live VU Meter */}
        <div className="p-3.5 mb-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              {micState === 'granted' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Microphone kết nối tốt</span>
                </>
              ) : micState === 'denied' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-400">Microphone bị chặn hoặc lỗi</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="text-amber-300">Đang khởi tạo...</span>
                </>
              )}
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                Mức âm: <strong className="text-slate-200">{liveVolumeDb > -90 ? `${liveVolumeDb} dB` : '-- dB'}</strong>
              </span>
              <span className="text-[11px] font-mono font-bold">
                {detectedPitch ? (
                  <span className="text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30 animate-pulse">
                    {detectedPitch} ({Math.round(liveFreqHz)} Hz)
                  </span>
                ) : (
                  <span className="text-slate-500">Đang im lặng</span>
                )}
              </span>
            </div>
          </div>

          {/* Mini Waveform Canvas */}
          <div className="w-full h-12 bg-slate-900/90 rounded-xl overflow-hidden border border-slate-800/80 mb-2 relative">
            <canvas ref={canvasRef} width={480} height={48} className="w-full h-full block" />
            <div className="absolute right-2 top-1 text-[9px] font-mono text-slate-500 pointer-events-none">
              Oscilloscope Sóng Mic
            </div>
          </div>

          {/* VU Meter Visualizer with Noise Gate Threshold Marker */}
          <div className="relative w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-1">
            {/* Live Volume Fill */}
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                liveVolumeDb > noiseGateDb
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-slate-700/60'
              }`}
              style={{ width: `${liveVolumePercent}%` }}
            />
            {/* Gate Marker Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-md shadow-amber-400/50 pointer-events-none"
              style={{ left: `${gatePercent}%` }}
              title={`Ngưỡng khử ồn: ${noiseGateDb} dBFS`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Yên lặng (-60 dB)</span>
            <span className="text-amber-400 font-bold">Vạch vàng: Ngưỡng lọc ({noiseGateDb} dB)</span>
            <span>Hát lớn (-5 dB)</span>
          </div>

          {errorMessage && (
            <p className="mt-2 text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/40">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Voice Focus: Lọc tiếng cộc bàn, tiếng đóng cửa & va đập */}
        <div className="p-3 mb-3.5 rounded-2xl bg-gradient-to-r from-sky-950/40 to-indigo-950/30 border border-sky-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Tập Trung Vào Giọng Hát (Voice Focus)</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                  Anti-Transient
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Khử tiếng cộc bàn, tiếng đóng cửa, tiếng gõ phím; chỉ nhận diện khi bạn ngân giọng hát thật (&gt;120ms).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleVoiceFocus}
            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition shrink-0 ${
              isVoiceFocus
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isVoiceFocus ? 'ĐANG BẬT' : 'ĐANG TẮT'}
          </button>
        </div>

        {/* Khử Tạp Âm & Tiếng Rè Điện (Noise Gate Calibration) */}
        <div className="p-3 mb-4 rounded-2xl bg-slate-950/40 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cân Chỉnh Khử Nhiễu & Tiếng Rè (Noise Gate):</span>
            </span>
            <button
              type="button"
              onClick={handleAutoCalibrate}
              disabled={isCalibrating || micState !== 'granted'}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Wand2 className="w-3 h-3" />
              <span>{isCalibrating ? 'Đang đo tạp âm (1.5s)...' : 'Tự động đo tạp âm phòng'}</span>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-3 gap-2 text-xs mb-1.5">
            <button
              type="button"
              onClick={() => handleSetGatePreset(-45)}
              className={`p-1.5 rounded-xl border text-center transition ${
                noiseGateDb === -45
                  ? 'border-emerald-500 bg-emerald-950/30 text-white font-bold'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px]">Phòng Tĩnh</div>
              <div className="text-[9px] text-slate-500">-45 dBFS</div>
            </button>

            <button
              type="button"
              onClick={() => handleSetGatePreset(-38)}
              className={`p-1.5 rounded-xl border text-center transition ${
                noiseGateDb === -38
                  ? 'border-emerald-500 bg-emerald-950/30 text-white font-bold'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px]">Tiêu Chuẩn</div>
              <div className="text-[9px] text-slate-500">-38 dBFS</div>
            </button>

            <button
              type="button"
              onClick={() => handleSetGatePreset(-30)}
              className={`p-1.5 rounded-xl border text-center transition ${
                noiseGateDb === -30
                  ? 'border-emerald-500 bg-emerald-950/30 text-white font-bold'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px]">Khử Rè Ugreen</div>
              <div className="text-[9px] text-slate-500">-30 dBFS</div>
            </button>
          </div>

          {calibrationNotice && (
            <p className="text-[10px] text-emerald-300 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/20 font-mono">
              {calibrationNotice}
            </p>
          )}
        </div>

        {/* Vocal Range Preference Selector */}
        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Chọn Quãng Giọng Của Bạn:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setSelectedRange('auto')}
              className={`p-2.5 rounded-2xl border text-left transition ${
                selectedRange === 'auto'
                  ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between text-xs">
                <span>Tự động (Octave-Fold)</span>
                {selectedRange === 'auto' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Tự dịch chuyển quãng tám phù hợp</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRange('bass-baritone')}
              className={`p-2.5 rounded-2xl border text-left transition ${
                selectedRange === 'bass-baritone'
                  ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between text-xs">
                <span>Nam Trầm / Trung</span>
                {selectedRange === 'bass-baritone' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Bass / Baritone (C2 – E4)</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRange('tenor-alto')}
              className={`p-2.5 rounded-2xl border text-left transition ${
                selectedRange === 'tenor-alto'
                  ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between text-xs">
                <span>Nam Cao & Nữ Trầm</span>
                {selectedRange === 'tenor-alto' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Tenor / Alto (G2 – A4)</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRange('soprano')}
              className={`p-2.5 rounded-2xl border text-left transition ${
                selectedRange === 'soprano'
                  ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md'
                  : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-bold flex items-center justify-between text-xs">
                <span>Nữ Cao (Soprano)</span>
                {selectedRange === 'soprano' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Soprano / Mezzo (C3 – C5)</div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl font-bold text-slate-400 hover:text-white transition text-xs sm:text-sm"
          >
            Hủy Bỏ
          </button>

          {micState === 'denied' ? (
            <button
              onClick={handleInitMicrophone}
              className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition shadow-lg shadow-amber-400/20 text-xs sm:text-sm"
            >
              Thử Lại Quyền Micro
            </button>
          ) : (
            <button
              onClick={handleProceedClick}
              disabled={micState === 'testing'}
              className="px-6 py-2.5 rounded-xl font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition shadow-lg shadow-emerald-400/25 flex items-center gap-2 disabled:opacity-50 text-xs sm:text-sm"
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
