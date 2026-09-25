import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { auditoryEngine } from '../../services/auditoryEngine';
import { 
  GitFork, 
  Volume2, 
  Play, 
  Pause, 
  Headphones, 
  Sparkles, 
  CheckCircle, 
  Brain, 
  Sliders, 
  ArrowRight,
  Layers,
  Activity
} from 'lucide-react';

export const PolyphonyModule: React.FC = () => {
  const { setActiveGameSlug, setActiveTab } = useAppStore();

  const [isPlayingStreams, setIsPlayingStreams] = useState(false);
  const [soloVoice, setSoloVoice] = useState<'soprano' | 'alto' | 'bass' | null>(null);

  const sampleCounterpoint = [
    {
      name: 'soprano',
      displayNameVi: 'Bè Cao (Soprano)',
      notes: [
        { note: 'C5', durationSec: 0.6 },
        { note: 'D5', durationSec: 0.6 },
        { note: 'E5', durationSec: 0.6 },
        { note: 'G5', durationSec: 0.6 },
        { note: 'C5', durationSec: 0.8 }
      ],
      waveform: 'triangle' as OscillatorType,
      pan: 0.4,
      volume: 0.35,
      color: '#38BDF8',
      roleVi: 'Giai điệu chủ đạo bay bổng ở dải tần số cao.'
    },
    {
      name: 'alto',
      displayNameVi: 'Bè Giữa (Alto)',
      notes: [
        { note: 'G4', durationSec: 0.6 },
        { note: 'A4', durationSec: 0.6 },
        { note: 'B4', durationSec: 0.6 },
        { note: 'C5', durationSec: 0.6 },
        { note: 'G4', durationSec: 0.8 }
      ],
      waveform: 'sine' as OscillatorType,
      pan: 0.0,
      volume: 0.32,
      color: '#A855F7',
      roleVi: 'Điền đầy dải trung âm, kết nối mượt mà giữa bè cao và trầm.'
    },
    {
      name: 'bass',
      displayNameVi: 'Bè Trầm (Bass)',
      notes: [
        { note: 'C3', durationSec: 0.6 },
        { note: 'F3', durationSec: 0.6 },
        { note: 'G3', durationSec: 0.6 },
        { note: 'E3', durationSec: 0.6 },
        { note: 'C3', durationSec: 0.8 }
      ],
      waveform: 'sawtooth' as OscillatorType,
      pan: -0.4,
      volume: 0.28,
      color: '#F59E0B',
      roleVi: 'Móng nhà hòa âm, giữ nhịp đập và chuyển động bậc nốt gốc.'
    }
  ];

  const handlePlayStreams = async (solo?: 'soprano' | 'alto' | 'bass') => {
    if (isPlayingStreams) return;
    setIsPlayingStreams(true);
    setSoloVoice(solo || null);
    try {
      await auditoryEngine.resumeAudioContext();
      await auditoryEngine.playPolyphonicStreams(sampleCounterpoint, solo);
    } catch (err) {
      console.warn('Polyphony play error:', err);
    } finally {
      setIsPlayingStreams(false);
      setSoloVoice(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Intro Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-violet-500/20">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold">
            <GitFork className="w-3.5 h-3.5" />
            <span>Chương 8: Đa Thanh & Bè Phối (Polyphony & Voice Leading)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Nghệ Thuật Tách Bè & Đối Âm Thính Giác
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Trong âm nhạc phức điệu (Polyphony) như các bản Phú-ga của Bach hay nhạc thính phòng, 
            nhiều giai điệu cùng chuyển động độc lập song song. Học cách điều khiển sự chú ý chọn lọc để theo dõi 
            từng bè riêng biệt là đỉnh cao của năng lực cảm thụ âm nhạc.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setActiveGameSlug('voice-track');
                setActiveTab('exercises');
              }}
              className="px-5 py-2.5 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-violet-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Brain className="w-4 h-4" />
              <span>Luyện Tập Bài "Theo Dõi Bè" Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scientific Principles Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Phân Rã Quang Cảnh Thính Giác
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Nhà tâm lý học Albert Bregman chỉ ra rằng não bộ sử dụng <em>Auditory Scene Analysis</em> để nhóm các tần số 
            gần nhau theo thời gian thành các "dòng thính giác" (Auditory Streams) riêng biệt.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Chú Ý Chọn Lọc (Selective Attention)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Giống như hiệu ứng "Tiệc Cocktail" khi bạn nghe rõ giọng một người giữa khán phòng huyên náo, tai nhạc sĩ 
            có thể phóng to (zoom-in) vào bè Bass hoặc bè Alto trong khi bè Soprano đang hát to nhất.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            3
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Chuyển Động Đối Âm (Counterpoint)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Các bè có thể chuyển động <strong>Song song (Parallel)</strong>, <strong>Ngược hướng (Contrary)</strong>, 
            hoặc <strong>Xiên chéo (Oblique - một bè đứng yên, một bè di chuyển)</strong>.
          </p>
        </div>
      </div>

      {/* Interactive Polyphony Mixer Playground */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Bàn Trộn Đa Bè Tương Tác (Interactive Polyphonic Mixer)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Bấm nghe thử cả 3 bè hòa quyện, hoặc bấm nút "Solo" để cô lập riêng từng bè và rèn luyện tai nghe
            </p>
          </div>

          <button
            onClick={() => handlePlayStreams()}
            disabled={isPlayingStreams}
            className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 ${
              isPlayingStreams && !soloVoice
                ? 'bg-violet-600 text-white animate-pulse'
                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/25'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isPlayingStreams && !soloVoice ? 'Đang Hòa Tấu 3 Bè...' : 'Nghe Cả 3 Bè (Full Ensemble)'}</span>
          </button>
        </div>

        {/* 3 Voice Lanes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleCounterpoint.map(voice => {
            const isThisSolo = soloVoice === voice.name && isPlayingStreams;
            const isPlayingAny = isPlayingStreams && (!soloVoice || soloVoice === voice.name);

            return (
              <div
                key={voice.name}
                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  isThisSolo
                    ? 'ring-2 ring-violet-500 bg-violet-50 dark:bg-violet-950/40 border-violet-400'
                    : 'bg-slate-50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: voice.color }}
                    />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {voice.displayNameVi}
                    </h4>
                  </div>

                  <button
                    onClick={() => handlePlayStreams(voice.name as any)}
                    disabled={isPlayingStreams}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      isThisSolo
                        ? 'bg-violet-600 text-white animate-pulse'
                        : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isThisSolo ? 'Đang Solo' : 'Nghe Riêng'}
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between">
                  <span>Cao độ:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {voice.notes.map(n => n.note).join(' - ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {voice.roleVi}
                </p>

                {/* Animated Mini Spectrum */}
                <div className="flex items-center justify-center gap-1 pt-2 h-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isPlayingAny ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{
                        height: isPlayingAny ? `${6 + (i * 3) % 16}px` : '4px'
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
