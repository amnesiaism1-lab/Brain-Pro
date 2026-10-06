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
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          fetchDevices();
          setIsOpen(!isOpen);
        }}
        className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition"
        title="Chọn thiết bị Micro"
      >
        <Mic className="w-3.5 h-3.5 text-sky-400" />
        <span className="max-w-[120px] truncate">{deviceLabel}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-72 p-2 rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95">
          <div className="px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
            <span>Thiết Bị Micro Thu Âm</span>
            <button
              type="button"
              onClick={fetchDevices}
              className="hover:text-white flex items-center gap-1"
              title="Làm mới danh sách"
            >
              <RefreshCw className="w-2.5 h-2.5" />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto py-1 space-y-0.5 custom-scrollbar">
            {devices.length === 0 ? (
              <div className="p-2 text-slate-500 italic text-center">
                Chưa tìm thấy micro. Hãy kiểm tra quyền truy cập.
              </div>
            ) : (
              devices.map((dev, i) => {
                const isSelected = dev.deviceId === selectedDeviceId || (!selectedDeviceId && i === 0);
                return (
                  <button
                    key={dev.deviceId || i}
                    type="button"
                    onClick={() => handleSelectDevice(dev.deviceId)}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-sky-500/15 text-sky-300 font-bold border border-sky-500/30'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{dev.label || `Microphone ${i + 1}`}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Action Tools */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <button
              type="button"
              onClick={handleCalibrate}
              disabled={isCalibrating}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-between transition"
            >
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-sky-400" />
                <span>{isCalibrating ? 'Đang đo tiếng ồn...' : 'Hiệu chuẩn tạp âm (1.5s)'}</span>
              </div>
              {calibrationResult && <span className="text-[10px] text-emerald-400">{calibrationResult}</span>}
            </button>

            {onOpenPreflightModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPreflightModal();
                }}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Mở Bảng Kiểm Tra &amp; Thử Giọng Toàn Diện</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
