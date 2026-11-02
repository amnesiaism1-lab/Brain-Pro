import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  UploadCloud,
  FileAudio,
  CheckCircle2,
  Sparkles,
  Loader2,
  ShieldAlert,
  Copy,
  Check,
  Music,
  Radio,
  Sliders,
  Square,
  Play,
  Volume2,
  Mic,
  Disc,
} from 'lucide-react';
import { IYouTubeTake, IYouTubeSession, youtubeTakeStorageService } from '../../../services/youtubeTakeStorageService';
import { youtubeSyncMixer, IOfflineMixOptions } from '../../../services/youtubeSyncMixer';
import { formatTimeMs } from '../utils/vocalHelpers';

interface ExportMixModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: IYouTubeSession | null;
  activeTake: IYouTubeTake | null;
  takes: IYouTubeTake[];
  beatVolume?: number;
  vocalVolume?: number;
  nudgeOffsetMs?: number;
  isReverb?: boolean;
  isCompressor?: boolean;
  ytPlayerInstance?: any;
}

type ExportTab = 'full_mix' | 'solo_vocal' | 'session_package';
type MixMethod = 'live_capture' | 'offline_beat_file';

export const ExportMixModal: React.FC<ExportMixModalProps> = ({
  isOpen,
  onClose,
  session,
  activeTake,
  takes,
  beatVolume = 0.8,
  vocalVolume = 1.0,
  nudgeOffsetMs = 0,
  isReverb = false,
  isCompressor = true,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<ExportTab>('full_mix');
  const [mixMethod, setMixMethod] = useState<MixMethod>('live_capture');

  // Custom Mix Parameters
  const [customBeatVol, setCustomBeatVol] = useState<number>(beatVolume);
  const [customVocalVol, setCustomVocalVol] = useState<number>(vocalVolume);
  const [customNudgeMs, setCustomNudgeMs] = useState<number>(nudgeOffsetMs);
  const [customReverb, setCustomReverb] = useState<boolean>(isReverb);
  const [customCompressor, setCustomCompressor] = useState<boolean>(isCompressor);
  const [trimToTake, setTrimToTake] = useState<boolean>(true);

  // Method A: Live Master Capture state
  const [isLiveRecording, setIsLiveRecording] = useState(false);
  const [liveElapsedSec, setLiveElapsedSec] = useState(0);
  const liveMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveTimerRef = useRef<any>(null);

  // Method B: Offline Beat File state
  const [localBeatFile, setLocalBeatFile] = useState<File | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  // General feedback
  const [renderSuccess, setRenderSuccess] = useState<string | null>(null);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // Sync state when props change
  useEffect(() => {
    if (isOpen) {
      setCustomBeatVol(beatVolume);
      setCustomVocalVol(vocalVolume);
      setCustomNudgeMs(nudgeOffsetMs);
      setCustomReverb(isReverb);
      setCustomCompressor(isCompressor);
      setRenderSuccess(null);
    }
  }, [isOpen, beatVolume, vocalVolume, nudgeOffsetMs, isReverb, isCompressor]);

  // Clean up on unmount or modal close
  useEffect(() => {
    return () => {
      if (liveTimerRef.current) {
        clearInterval(liveTimerRef.current);
      }
      if (liveStreamRef.current) {
        liveStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  const youtubeWatchUrl = session?.videoId
    ? `https://www.youtube.com/watch?v=${session.videoId}`
    : '';

  const handleCopyLink = () => {
    if (!youtubeWatchUrl) return;
    navigator.clipboard.writeText(youtubeWatchUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2000);
  };

  // Solo Vocal WAV download
  const handleDownloadSoloWav = () => {
    if (!activeTake) return;
    youtubeTakeStorageService.downloadVocalTake(
      activeTake,
      `vocal-solo-${session?.videoId || 'take'}`
    );
    setRenderSuccess('Đã tải về file giọng thu mộc WAV 16-bit Lossless!');
  };

  // Export Session Package JSON
  const handleExportSession = () => {
    if (!session) return;
    youtubeTakeStorageService.exportSessionPackage(session, takes);
    setRenderSuccess('Đã xuất file Session JSON thành công!');
  };

  // Select Beat file
  const handleSelectBeatFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLocalBeatFile(e.target.files[0]);
    }
  };

  // METHOD A: LIVE MASTER CAPTURE (Record Tab Audio)
  const handleStartLiveCapture = async () => {
    if (!activeTake) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert(
        'Trình duyệt của bạn chưa hỗ trợ tính năng thu âm thẻ tab trực tiếp. Vui lòng sử dụng tính năng "Trộn Siêu Tốc (Nạp File Beat)" hoặc sử dụng Chrome / Edge trên máy tính.'
      );
      return;
    }

    try {
      // In Chrome/Edge, getDisplayMedia requires video: true to capture audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } as any,
      });

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        // User forgot to check "Share audio"
        stream.getTracks().forEach((t) => t.stop());
        alert(
          'Bạn chưa tích chọn "Chia sẻ âm thanh của thẻ" (Share audio).\n\nVui lòng thử lại và nhớ tích chọn ô "Chia sẻ âm thanh" khi chọn thẻ trình duyệt!'
        );
        return;
      }

      // Stop video track immediately to save 100% video encoding CPU
      stream.getVideoTracks().forEach((t) => t.stop());
      liveStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(new MediaStream(audioTracks), {
        mimeType,
        audioBitsPerSecond: 256000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Clean up stream tracks
        audioTracks.forEach((t) => t.stop());
        liveStreamRef.current = null;
        if (liveTimerRef.current) {
          clearInterval(liveTimerRef.current);
          liveTimerRef.current = null;
        }
        setIsLiveRecording(false);

        if (chunks.length === 0) return;

        const recordedBlob = new Blob(chunks, { type: mimeType });

        // Convert Opus/WebM to 16-bit PCM WAV for universal compatibility
        try {
          const arrayBuf = await recordedBlob.arrayBuffer();
          const ctx = youtubeSyncMixer.getAudioContext();
          const audioBuffer = await ctx.decodeAudioData(arrayBuf);
          const wavBlob = youtubeSyncMixer.encodeAudioBufferToWav(audioBuffer);

          const url = URL.createObjectURL(wavBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Master-Mix-Take${activeTake.takeNumber}-${session?.videoId || 'song'}-${Date.now()}.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 3000);
          setRenderSuccess('Đã thu âm & xuất thành công file Master WAV (Beat + Giọng)!');
        } catch (e) {
          // Direct fallback to recorded WebM / MP4
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const url = URL.createObjectURL(recordedBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Master-Mix-Take${activeTake.takeNumber}-${session?.videoId || 'song'}-${Date.now()}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 3000);
          setRenderSuccess(`Đã thu âm & xuất file Master .${ext} (Beat + Giọng) thành công!`);
        }
      };

      liveMediaRecorderRef.current = recorder;
      recorder.start(250);

      // Seek & play synchronized Take + Beat
      const playStartSec = Math.max(0, activeTake.startPointSec - 0.5);
      youtubeSyncMixer.seekTo(playStartSec);
      await youtubeSyncMixer.play();

      setIsLiveRecording(true);
      setLiveElapsedSec(0);
      setRenderSuccess(null);

      const startTime = Date.now();
      const maxDurationSec = (activeTake.durationSec || 60) + 2.5;

      liveTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setLiveElapsedSec(elapsed);

        // Auto finish when vocal take finishes
        if (elapsed >= maxDurationSec) {
          handleStopLiveCapture();
        }
      }, 250);
    } catch (err: any) {
      console.error('Live capture error:', err);
      if (err.name !== 'NotAllowedError') {
        alert(`Không thể bắt đầu thu Master: ${err.message || 'Lỗi không xác định'}`);
      }
    }
  };

  const handleStopLiveCapture = () => {
    if (liveTimerRef.current) {
      clearInterval(liveTimerRef.current);
      liveTimerRef.current = null;
    }
    youtubeSyncMixer.pause();

    if (liveMediaRecorderRef.current && liveMediaRecorderRef.current.state !== 'inactive') {
      try {
        liveMediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach((t) => t.stop());
      liveStreamRef.current = null;
    }
    setIsLiveRecording(false);
  };

  // METHOD B: OFFLINE MIXDOWN (With uploaded beat file)
  const handleRenderOfflineMix = async () => {
    if (!localBeatFile || !activeTake) return;
    setIsRendering(true);
    setRenderProgress(10);
    setRenderSuccess(null);

    const mixOptions: IOfflineMixOptions = {
      beatVolume: customBeatVol,
      vocalVolume: customVocalVol,
      nudgeOffsetMs: customNudgeMs,
      isReverbEnabled: customReverb,
      reverbLevel: 0.28,
      isCompressorEnabled: customCompressor,
      trimToTake: trimToTake,
    };

    try {
      const mixedBlob = await youtubeSyncMixer.renderOfflineMixdown(
        localBeatFile,
        activeTake,
        (pct) => setRenderProgress(pct),
        mixOptions
      );

      // Trigger download
      const url = URL.createObjectURL(mixedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Master-Studio-Take${activeTake.takeNumber}-${session?.videoId || 'song'}-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 3000);

      setRenderSuccess('Đã trộn và tải về thành công bản phối Master WAV 16-bit Lossless!');
    } catch (err) {
      console.error('Offline mixdown failed:', err);
      alert('Không thể xuất bản phối. Vui lòng kiểm tra file nhạc beat (định dạng MP3, WAV, M4A).');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Disc className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Xuất Bản Phối Âm Thanh</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Cả Beat + Giọng Thu
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Xuất file bài hát hoàn chỉnh để lưu vào máy, nghe trên điện thoại hoặc chia sẻ.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('full_mix')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'full_mix'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xuất Cả Beat + Giọng (Đầy Đủ)</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold">
              Mới
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('solo_vocal')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'solo_vocal'
                ? 'border-sky-500 text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Chỉ Giọng Thu Mộc (WAV)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('session_package')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'session_package'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileAudio className="w-3.5 h-3.5" />
            <span>Lưu Gói Session (JSON)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Active Take Quick Badge */}
          {activeTake && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">
                  Take #{activeTake.takeNumber}
                  {activeTake.isBestTake && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      ★ Best Take
                    </span>
                  )}
                </span>
                <span className="text-slate-400 text-[11px]">
                  ({Math.round(activeTake.durationSec)}s • WAV 44.1kHz • Bắt đầu lúc {formatTimeMs(Math.round(activeTake.startPointSec * 1000))})
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-medium">
                Sẵn sàng xuất file
              </span>
            </div>
          )}

          {/* Success Banner */}
          {renderSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{renderSuccess}</span>
            </div>
          )}

          {/* TAB 1: FULL BEAT + VOCAL MIX */}
          {activeTab === 'full_mix' && (
            <div className="space-y-4">
              {/* Method Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setMixMethod('live_capture')}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                    mixMethod === 'live_capture'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Cách 1: Thu Master Trực Tiếp (1 Chạm)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMixMethod('offline_beat_file')}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                    mixMethod === 'offline_beat_file'
                      ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cách 2: Trộn Siêu Tốc (Nạp Beat 1 Giây)</span>
                </button>
              </div>

              {/* METHOD A: LIVE MASTER CAPTURE */}
              {mixMethod === 'live_capture' && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                      <Radio className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Thu Âm Bản Phối Master Trực Tiếp (Không Cần File Beat Ngoài)
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                        Trình duyệt sẽ phát bài hát và ghi âm trực tiếp toàn bộ luồng âm thanh
                        (cả nhạc nền YouTube + giọng hát đã mix) thành file Master WAV chất lượng cao!
                      </p>
                    </div>
                  </div>

                  {/* Instructions */}
                  {!isLiveRecording ? (
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] space-y-1.5 text-slate-300">
                      <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                        <span>💡 Hướng dẫn 3 bước cực kỳ đơn giản:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-300">
                        <li>Bấm nút <strong>&quot;Bắt Đầu Thu Master Trực Tiếp&quot;</strong> bên dưới.</li>
                        <li>
                          Hộp thoại trình duyệt hiện lên: chọn thẻ <strong>&quot;Thẻ này (This Tab)&quot;</strong> và nhớ
                          <span className="text-emerald-400 font-bold"> tích chọn ô &quot;Chia sẻ âm thanh&quot; (Share tab audio)</span>.
                        </li>
                        <li>
                          Hệ thống sẽ phát bản nhạc. Khi hát xong, file âm thanh <strong>Master (Beat + Giọng)</strong> sẽ tự động tải về máy bạn!
                        </li>
                      </ol>

                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={handleStartLiveCapture}
                          disabled={!activeTake}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-400 hover:to-red-400 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 cursor-pointer disabled:opacity-40"
                        >
                          <Radio className="w-4 h-4" />
                          <span>Bắt Đầu Thu Master Trực Tiếp (Beat + Giọng)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Live Recording In-Progress Banner */
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-center space-y-3 animate-pulse">
                      <div className="flex items-center justify-center gap-2 text-rose-300 text-xs font-bold">
                        <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                        <span>ĐANG GHI ÂM MASTER TRỰC TIẾP...</span>
                      </div>

                      {/* Visualizer animation waves */}
                      <div className="flex items-center justify-center gap-1 h-8">
                        {[40, 75, 55, 90, 65, 80, 45, 95, 70, 50, 85, 60].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-rose-400 rounded-full transition-all duration-150 animate-bounce"
                            style={{
                              height: `${h}%`,
                              animationDelay: `${i * 70}ms`,
                              animationDuration: '600ms',
                            }}
                          />
                        ))}
                      </div>

                      <div className="text-lg font-mono font-bold text-white">
                        {formatTimeMs(Math.round(liveElapsedSec * 1000))} / {formatTimeMs(Math.round((activeTake?.durationSec || 60) * 1000))}
                      </div>

                      <p className="text-[11px] text-slate-300">
                        Đang ghi âm lại trọn vẹn nhạc beat YouTube + giọng thu. Bạn có thể bấm nút dưới để dừng và nhận file ngay.
                      </p>

                      <button
                        type="button"
                        onClick={handleStopLiveCapture}
                        className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 mx-auto cursor-pointer border border-slate-700"
                      >
                        <Square className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        <span>Dừng & Tải File Master Ngay</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* METHOD B: OFFLINE BEAT FILE MIXDOWN */}
              {mixMethod === 'offline_beat_file' && (
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          Trộn File Phối Studio Siêu Tốc (WAV 16-bit Lossless)
                        </h4>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Nạp file nhạc beat của bài hát. Engine xử lý trong 1 giây xuất ra file WAV
                          chuẩn phòng thu kèm đầy đủ hiệu ứng Reverb & Compressor!
                        </p>
                      </div>
                    </div>

                    {/* Copy YouTube Link Quick Button */}
                    {youtubeWatchUrl && (
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        title="Sao chép link YouTube của video này để tải beat"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {isCopiedLink ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Đã chép link</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-sky-400" />
                            <span>Chép link YouTube</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* File Upload Drop Area */}
                  <label className="block p-4 rounded-xl bg-slate-950 border border-dashed border-indigo-500/40 hover:border-indigo-400 transition text-center cursor-pointer">
                    <UploadCloud className="w-6 h-6 text-indigo-400 mx-auto mb-1.5" />
                    <span className="text-xs font-bold text-white block">
                      {localBeatFile ? localBeatFile.name : 'Chọn hoặc thả file Beat (MP3, WAV, M4A, OGG)...'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {localBeatFile
                        ? `${(localBeatFile.size / 1024 / 1024).toFixed(1)} MB • Bấm để đổi file khác`
                        : 'Hỗ trợ tất cả định dạng âm thanh phổ biến'}
                    </span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleSelectBeatFile}
                      className="hidden"
                    />
                  </label>

                  {/* Mix Controls & Fine-Tuning */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-sky-400" />
                        <span>Tùy chỉnh thông số xuất bản phối:</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Beat Volume */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Âm lượng Beat</span>
                          <span className="font-mono text-sky-400 font-bold">{Math.round(customBeatVol * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={customBeatVol}
                          onChange={(e) => setCustomBeatVol(parseFloat(e.target.value))}
                          className="w-full accent-sky-400 cursor-pointer"
                        />
                      </div>

                      {/* Vocal Volume */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Âm lượng Giọng hát</span>
                          <span className="font-mono text-emerald-400 font-bold">{Math.round(customVocalVol * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1.5}
                          step={0.05}
                          value={customVocalVol}
                          onChange={(e) => setCustomVocalVol(parseFloat(e.target.value))}
                          className="w-full accent-emerald-400 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* FX Toggles & Trim Option */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/80 text-[11px] text-slate-300">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customReverb}
                          onChange={(e) => setCustomReverb(e.target.checked)}
                          className="rounded text-sky-500 focus:ring-0"
                        />
                        <span>Reverb Không Gian</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customCompressor}
                          onChange={(e) => setCustomCompressor(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-0"
                        />
                        <span>Compressor Giữ Lực Giọng</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer ml-auto text-sky-400 font-medium">
                        <input
                          type="checkbox"
                          checked={trimToTake}
                          onChange={(e) => setTrimToTake(e.target.checked)}
                          className="rounded text-sky-500 focus:ring-0"
                        />
                        <span>Chỉ xuất đoạn có giọng thu</span>
                      </label>
                    </div>
                  </div>

                  {/* Render Button */}
                  <button
                    type="button"
                    onClick={handleRenderOfflineMix}
                    disabled={!localBeatFile || !activeTake || isRendering}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isRendering ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Đang xử lý xuất bản phối ({renderProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>Trộn & Tải File Phối Studio WAV (16-bit Lossless)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SOLO VOCAL TRACK WAV */}
          {activeTab === 'solo_vocal' && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Tải Riêng Giọng Thu Mộc (Solo Vocal Track)
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                    Xuất file WAV 16-bit 44.1kHz nguyên bản của Take #{activeTake?.takeNumber || 1}.
                    File này không có nhạc nền beat, cực kỳ thích hợp để nhập vào các phần mềm DAW
                    chuyên nghiệp (Reaper, FL Studio, Audacity, Logic Pro) để tự hòa âm phối khí!
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadSoloWav}
                  disabled={!activeTake}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Về Giọng Mộc WAV (Take #{activeTake?.takeNumber || 1})</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SESSION PACKAGE JSON */}
          {activeTab === 'session_package' && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                  <FileAudio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Xuất Gói Cấu Hình Phiên Làm Việc (Session JSON)
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                    Lưu trữ mốc thời gian bắt đầu, độ lệch mili-giây (nudge ms), ghi chú từng Take
                    và các thiết lập âm lượng để sao lưu hoặc nạp lại dự án sau này.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExportSession}
                  disabled={!session}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất File Gói Session JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* Compact Copyright & Attribution Note */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              ⚖️ Nhạc nền beat thuộc bản quyền tác giả trên YouTube. Bản thu này phục vụ cho mục đích học tập và luyện giọng cá nhân.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {activeTake && (
              <span>Đang chọn: <strong>Take #{activeTake.takeNumber}</strong></span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
