import React, { useState, useEffect, useRef } from 'react';
import { Mic, ChevronDown, Check, Sliders, ShieldCheck, RefreshCw } from 'lucide-react';
import { vocalPitchService } from '../../../services/vocalPitchService';

interface MicDeviceSelectorProps {
  onOpenPreflightModal?: () => void;
}

export const MicDeviceSelector: React.FC<MicDeviceSelectorProps> = ({
  onOpenPreflightModal,
}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationResult, setCalibrationResult] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchDevices = async () => {
    try {
      const devList = await vocalPitchService.getAudioInputDevices();
      setDevices(devList);
      const current = vocalPitchService.getCurrentDeviceId();
      if (current) {
        setSelectedDeviceId(current);
      } else if (devList.length > 0) {
        setSelectedDeviceId(devList[0].deviceId);
      }
    } catch (e) {
      console.warn('Failed to get audio devices:', e);
    }
  };

  useEffect(() => {
    fetchDevices();

    // Listen for device changes (e.g. plugging in headphones)
    if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange !== undefined) {
      navigator.mediaDevices.ondevicechange = () => {
        fetchDevices();
      };
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDevice = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setIsOpen(false);
    await vocalPitchService.switchAudioInputDevice(deviceId);
  };

  const handleCalibrate = async () => {
    setIsCalibrating(true);
    setCalibrationResult(null);
    try {
      const res = await vocalPitchService.calibrateNoiseFloor(1500);
      setCalibrationResult(`Đã đặt ngưỡng lọc ồn: ${res.suggestedGateDb} dB`);
      setTimeout(() => setCalibrationResult(null), 3000);
    } catch {
      setCalibrationResult('Hiệu chuẩn không thành công');
      setTimeout(() => setCalibrationResult(null), 3000);
    } finally {
      setIsCalibrating(false);
    }
  };

  const activeDevice = devices.find((d) => d.deviceId === selectedDeviceId);
  const deviceLabel = activeDevice?.label || (devices.length > 0 ? 'Microphone mặc định' : 'Microphone');

  return (
    <div className="w-full space-y-2" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          fetchDevices();
          setIsOpen(!isOpen);
        }}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-200 hover:text-white hover:border-slate-700 flex items-center justify-between text-xs font-semibold transition shadow-sm group"
        title="Chọn thiết bị Microphone"
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <Mic className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate text-left">{deviceLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-slate-400 font-mono">
            {devices.length > 0 ? `${devices.length} mic` : ''}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-sky-400' : 'group-hover:text-slate-300'
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="w-full p-2.5 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-xl space-y-2 animate-in fade-in duration-150">
          <div className="px-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Danh Sách Micro Thu Âm</span>
            <button
              type="button"
              onClick={fetchDevices}
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[10px] font-sans transition"
              title="Quét lại các cổng micro"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Quét lại</span>
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
            {devices.length === 0 ? (
              <div className="p-2.5 text-slate-400 italic text-center text-[11px] bg-slate-950/60 rounded-xl">
                Chưa tìm thấy micro. Hãy kiểm tra quyền truy cập micro trên trình duyệt.
              </div>
            ) : (
              devices.map((dev, i) => {
                const isSelected =
                  dev.deviceId === selectedDeviceId || (!selectedDeviceId && i === 0);
                return (
                  <button
                    key={dev.deviceId || i}
                    type="button"
                    onClick={() => handleSelectDevice(dev.deviceId)}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="truncate text-xs">
                      {dev.label || `Microphone ${i + 1}`}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Action Tools */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <button
              type="button"
              onClick={handleCalibrate}
              disabled={isCalibrating}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-between transition border border-slate-800"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  {isCalibrating ? 'Đang đo tiếng ồn...' : 'Hiệu chuẩn tạp âm (1.5s)'}
                </span>
              </div>
              {calibrationResult && (
                <span className="text-[10px] text-emerald-400 font-medium truncate max-w-[150px]">
                  {calibrationResult}
                </span>
              )}
            </button>

            {onOpenPreflightModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPreflightModal();
                }}
                className="w-full px-2.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition border border-slate-800"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bảng Kiểm Tra &amp; Thử Giọng Toàn Diện</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
