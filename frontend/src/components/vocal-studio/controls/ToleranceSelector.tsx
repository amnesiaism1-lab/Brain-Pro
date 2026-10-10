import React from 'react';
import { TuningTolerance } from '../types';
import { Sliders } from 'lucide-react';

interface ToleranceSelectorProps {
  value: TuningTolerance;
  onChange: (val: TuningTolerance) => void;
  size?: 'sm' | 'md';
}

const TOLERANCE_OPTIONS: Array<{
  value: TuningTolerance;
  label: string;
  hint: string;
  badgeClass: string;
}> = [
  { value: 50, label: 'Dễ (±50¢)', hint: 'Cho người mới tập, dải chấp nhận nửa bán âm', badgeClass: 'hover:border-emerald-500' },
  { value: 35, label: 'Chuẩn (±35¢)', hint: 'Cân bằng tự nhiên cho luyện thanh hàng ngày', badgeClass: 'hover:border-sky-500' },
  { value: 20, label: 'Khó (±20¢)', hint: 'Yêu cầu kiểm soát cơ thanh đới chính xác cao', badgeClass: 'hover:border-amber-500' },
  { value: 10, label: 'Chuyên gia (±10¢)', hint: 'Tiêu chuẩn ca sĩ chuyên nghiệp / phòng thu', badgeClass: 'hover:border-purple-500' },
];

export const ToleranceSelector: React.FC<ToleranceSelectorProps> = ({
  value,
  onChange,
  size = 'md',
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
        <Sliders className="w-3.5 h-3.5 text-sky-400" />
        <span>Dung sai nốt (Tuning Tolerance):</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {TOLERANCE_OPTIONS.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.hint}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition text-center ${
                isActive
                  ? 'border-sky-500 bg-sky-500/20 text-sky-200 shadow-sm shadow-sky-500/20'
                  : `border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white ${opt.badgeClass}`
              } ${size === 'sm' ? 'text-[11px] py-1' : ''}`}
            >
              <div>{opt.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
