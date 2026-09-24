import React, { useState } from 'react';
import { auditoryEngine } from '../../services/auditoryEngine';
import { Compass, Volume2, Headphones, ArrowRight, Play, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const DIRECTIONS_8 = [
  { name: 'Trước Mặt (Front)', angle: 0, label: '0° N' },
  { name: 'Trước - Phải (NE)', angle: 45, label: '45° NE' },
  { name: 'Bên Phải (Right)', angle: 90, label: '90° E' },
  { name: 'Sau - Phải (SE)', angle: 135, label: '135° SE' },
  { name: 'Phía Sau (Behind)', angle: 180, label: '180° S' },
  { name: 'Sau - Trái (SW)', angle: 225, label: '225° SW' },
  { name: 'Bên Trái (Left)', angle: 270, label: '270° W' },
  { name: 'Trước - Trái (NW)', angle: 315, label: '315° NW' },
];

export const SpatialAudioModule: React.FC = () => {
  const { setActiveTab, setSelectedExerciseSlug } = useAppStore();

  const [activeAngle, setActiveAngle] = useState<number>(0);
  const [distance, setDistance] = useState<number>(2.5); // meters
  const [stereoPan, setStereoPan] = useState<number>(0); // -1 to 1

  const handlePlaySpatialPing = (angle = activeAngle, dist = distance) => {
    auditoryEngine.resumeAudioContext().catch(() => {});
    auditoryEngine.play3DSpatialTone('C5', angle, 0, dist, 0.6);
  };

  const handlePlayStereoPan = (panVal: number) => {
    auditoryEngine.resumeAudioContext().catch(() => {});
    auditoryEngine.playNote('A4', 0.5, { pan: panVal, volume: 0.45 });
  };

  const handleStartLocalizationExercise = () => {
    setSelectedExerciseSlug('sound-localization');
    setActiveTab('exercises');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Theory Introduction */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔊</span>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Khái Niệm 7: Âm Thanh Không Gian & Định Vị 3D (Spatial Audio)
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Bộ não người xác định vị trí nguồn âm trong không gian 3 chiều như thế nào?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold">
            <Headphones className="w-4 h-4 text-amber-500" />
            <span>⚠️ Đeo tai nghe để trải nghiệm không gian 3D</span>
          </div>
        </div>

        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
          <p>
            Tai người có thể xác định chính xác góc và khoảng cách nguồn âm nhờ 3 cơ chế sinh học tinh vi:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 not-prose my-3">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 text-sm block">1. ITD (Chênh Lệch Thời Gian)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Âm thanh từ bên phải truyền đến tai phải sớm hơn tai trái một khoảng cực nhỏ <strong>dưới 0.7 mili giây</strong>.
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs">
              <span className="font-bold text-purple-700 dark:text-purple-400 text-sm block">2. ILD (Chênh Lệch Cường Độ)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Hộp sọ hoạt động như một vật cản cơ học, làm giảm âm lượng của các tần số cao tới tai xa hơn.
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm block">3. HRTF & Vành Tai</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Nếp gấp vành tai lọc bớt dải tần số cao khi âm thanh phát ra <em>từ phía sau</em>, giúp ta phân biệt Trước vs Sau.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 360° Radar Canvas & Direction Controls */}
      <div className="p-6 bg-slate-950 text-white rounded-3xl shadow-2xl border border-white/10 space-y-6">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            Radar Tương Tác 360° (HRTF Spatial Acoustic Radar)
          </h3>
          <p className="text-xs text-slate-400">
            Bấm vào bất kỳ hướng nào trên radar tròn để phát xung âm thanh 3D binaural đến vị trí đó
          </p>
        </div>

        {/* 360 Degree Radar Visualizer */}
        <div className="relative w-72 h-72 mx-auto rounded-full border-2 border-cyan-500/30 bg-slate-900/90 shadow-2xl shadow-cyan-500/10 flex items-center justify-center p-2">
          {/* Concentric distance rings */}
          <div className="absolute inset-8 rounded-full border border-cyan-500/20 pointer-events-none" />
          <div className="absolute inset-16 rounded-full border border-cyan-500/20 pointer-events-none" />
          <div className="absolute inset-24 rounded-full border border-cyan-500/20 pointer-events-none" />

          {/* Crosshairs */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-500/20 pointer-events-none" />
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-cyan-500/20 pointer-events-none" />

          {/* Center Listener Head */}
          <div className="w-14 h-14 rounded-full bg-cyan-600/30 border-2 border-cyan-400 flex flex-col items-center justify-center text-white z-10 shadow-lg">
            <Headphones className="w-6 h-6 text-cyan-300" />
            <span className="text-[8px] font-black uppercase tracking-tight text-cyan-200">Bạn</span>
          </div>

          {/* 8 Radial Direction Buttons */}
          {DIRECTIONS_8.map((dir) => {
            const rad = ((dir.angle - 90) * Math.PI) / 180;
            const r = 115; // px from center
            const x = r * Math.cos(rad);
            const y = r * Math.sin(rad);
            const isSelected = activeAngle === dir.angle;

            return (
              <button
                key={dir.angle}
                type="button"
                onClick={() => {
                  setActiveAngle(dir.angle);
                  handlePlaySpatialPing(dir.angle);
                }}
                style={{
                  transform: `translate(${x}px, ${y}px)`
                }}
                className={`absolute w-10 h-10 rounded-full font-mono text-[10px] font-bold flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                  isSelected
                    ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/50 scale-110 z-20 font-black'
                    : 'bg-slate-800 text-cyan-300 border border-cyan-500/40 hover:bg-slate-700'
                }`}
              >
                {dir.angle}°
              </button>
            );
          })}
        </div>

        {/* Selected Direction Status & Play Button */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 font-black text-base font-mono">
                {activeAngle}°
              </span>
              <h4 className="text-base font-black text-white">
                {DIRECTIONS_8.find(d => d.angle === activeAngle)?.name || `${activeAngle}°`}
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Khoảng cách nguồn âm: <strong className="text-cyan-400">{distance.toFixed(1)} mét</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePlaySpatialPing()}
              className="px-6 py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-400/30 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Phát Xung Âm 3D</span>
            </button>
          </div>
        </div>
      </div>

      {/* Basic Stereo Panning Slider */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          🎛️ Thử Nghiệm Stereo Panning (Trái ↔ Phải)
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Kéo thanh trượt để di chuyển âm thanh hoàn toàn sang tai trái hoặc sang tai phải:
        </p>

        <div className="space-y-3 max-w-lg mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between text-xs font-bold font-mono">
            <span className="text-rose-600">◀ 100% Tai Trái</span>
            <span className="text-slate-700 dark:text-slate-300">
              {stereoPan === 0 ? 'Chính Giữa' : `${Math.round(stereoPan * 100)}%`}
            </span>
            <span className="text-blue-600">100% Tai Phải ▶</span>
          </div>

          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={stereoPan}
            onChange={(e) => {
              const val = Number(e.target.value);
              setStereoPan(val);
              handlePlayStereoPan(val);
            }}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />

          <div className="flex justify-center pt-1">
            <button
              onClick={() => handlePlayStereoPan(stereoPan)}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-2 active:scale-95 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Phát Nốt Tại Vị Trí Này</span>
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-6 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Thử thách khả năng định vị âm thanh 3D?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Lắng nghe âm thanh phát ra trong không gian và chấm đúng vị trí trên radar!
          </p>
        </div>
        <button
          onClick={handleStartLocalizationExercise}
          className="px-6 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-600/30 active:scale-95 transition-all"
        >
          <span>Luyện Tập: Định Vị Âm Thanh 3D (Sound Localization)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
