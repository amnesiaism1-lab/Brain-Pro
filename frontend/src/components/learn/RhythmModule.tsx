import React, { useState, useEffect, useRef } from 'react';
import { Metronome } from '../ui/Metronome';
import { auditoryEngine } from '../../services/auditoryEngine';
import { Play, Square, Volume2, ArrowRight, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const DRUM_TYPES = ['kick', 'snare', 'hihat'] as const;

export const RhythmModule: React.FC = () => {
  const { setActiveTab, setSelectedExerciseSlug } = useAppStore();

  // 16-Step Sequencer State
  const [bpm, setBpm] = useState(110);
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 3 tracks x 16 steps
  const [grid, setGrid] = useState<Record<'kick' | 'snare' | 'hihat', boolean[]>>({
    hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    kick: [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false]
  });

  const seqTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleCell = (drum: 'kick' | 'snare' | 'hihat', step: number) => {
    setGrid(prev => {
      const row = [...prev[drum]];
      row[step] = !row[step];
      return { ...prev, [drum]: row };
    });
  };

  const loadPreset = (presetName: 'rock' | 'dance' | 'hiphop') => {
    if (presetName === 'rock') {
      setBpm(115);
      setGrid({
        hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        kick: [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false]
      });
    } else if (presetName === 'dance') {
      setBpm(126);
      setGrid({
        hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false]
      });
    } else {
      // hiphop
      setBpm(90);
      setGrid({
        hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        kick: [true, false, false, true, false, false, false, false, false, false, true, false, false, false, false, false]
      });
    }
  };

  useEffect(() => {
    if (!isPlayingSeq) {
      if (seqTimerRef.current) clearInterval(seqTimerRef.current);
      setCurrentStep(0);
      return;
    }

    const stepMs = Math.round((60000 / bpm) / 4); // 16th notes
    let step = 0;

    seqTimerRef.current = setInterval(() => {
      // Play hits for current step
      auditoryEngine.resumeAudioContext().catch(() => {});
      if (grid.kick[step]) auditoryEngine.playDrum('kick', 1.0);
      if (grid.snare[step]) auditoryEngine.playDrum('snare', 0.85);
      if (grid.hihat[step]) auditoryEngine.playDrum('hihat', 0.6);

      setCurrentStep(step);
      step = (step + 1) % 16;
    }, stepMs);

    return () => {
      if (seqTimerRef.current) clearInterval(seqTimerRef.current);
    };
  }, [isPlayingSeq, bpm, grid]);

  const handleStartRhythmExercise = () => {
    setSelectedExerciseSlug('rhythm-recall');
    setActiveTab('exercises');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Theory Introduction */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🥁</span>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Khái Niệm 5: Nhịp Điệu & Phách (Rhythm & Time)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Cấu trúc thời gian của âm nhạc — nhịp phách, giá trị nốt, đảo phách và tốc độ (BPM)
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
          <p>
            <strong>Nhịp điệu (Rhythm)</strong> là sự phân bổ các âm thanh và khoảng lặng theo chu kỳ thời gian. Không có nhịp điệu, âm nhạc chỉ là những nốt cao độ rời rạc.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 not-prose my-3">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <span className="font-bold text-amber-700 dark:text-amber-400 text-sm block">1. Nhịp 4/4 (Thông Dụng)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Mỗi ô nhịp có 4 phách. Phách 1 mạnh nhất (Downbeat), phách 3 mạnh vừa, phách 2 và 4 nhẹ.
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 text-sm block">2. Nhịp 3/4 (Waltz)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Điệu Valse bồng bềnh: <strong>Mạnh - Nhẹ - Nhẹ</strong> (Bùm - Chát - Chát).
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs">
              <span className="font-bold text-purple-700 dark:text-purple-400 text-sm block">3. Đảo Phách (Syncopation)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Nhấn trọng âm vào phách yếu hoặc nửa phách (off-beat). Tạo cảm giác lắc lư, nhảy múa cuốn hút của Funk, Jazz và Reggae.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 16-Step Drum Sequencer */}
      <div className="p-6 bg-slate-950 text-white rounded-3xl shadow-2xl border border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-amber-400" />
              Bàn Phối Nhịp Tương Tác 16-Step Sequencer
            </h3>
            <p className="text-xs text-slate-400">
              Bật/tắt các ô bên dưới để tạo tiết tấu riêng của bạn và nhấn Chạy Nhịp
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Mẫu sẵn:</span>
            <button
              onClick={() => loadPreset('rock')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300"
            >
              Rock Beat
            </button>
            <button
              onClick={() => loadPreset('dance')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300"
            >
              Four-on-Floor
            </button>
            <button
              onClick={() => loadPreset('hiphop')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-purple-300"
            >
              Hip-hop Groove
            </button>
          </div>
        </div>

        {/* Step Sequencer Grid */}
        <div className="space-y-3 overflow-x-auto pb-2">
          {DRUM_TYPES.map(drum => (
            <div key={drum} className="flex items-center gap-2 min-w-[620px]">
              <div className="w-20 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>{drum === 'kick' ? '🥁 Kick' : drum === 'snare' ? '💥 Snare' : '✨ Hi-hat'}</span>
              </div>
              <div className="flex-1 grid grid-cols-16 gap-1">
                {grid[drum].map((active, stepIdx) => {
                  const isCurrent = isPlayingSeq && currentStep === stepIdx;
                  const isDownbeat = stepIdx % 4 === 0;

                  return (
                    <button
                      key={stepIdx}
                      type="button"
                      onClick={() => toggleCell(drum, stepIdx)}
                      className={`h-11 rounded-lg transition-all font-mono text-[9px] flex items-center justify-center font-bold ${
                        isCurrent
                          ? 'ring-2 ring-white scale-105 z-10'
                          : ''
                      } ${
                        active
                          ? drum === 'kick'
                            ? 'bg-amber-500 shadow-md shadow-amber-500/50 text-slate-950'
                            : drum === 'snare'
                            ? 'bg-rose-500 shadow-md shadow-rose-500/50 text-white'
                            : 'bg-cyan-400 shadow-md shadow-cyan-400/50 text-slate-950'
                          : isDownbeat
                          ? 'bg-slate-800/80 border border-slate-700 text-slate-500 hover:bg-slate-800'
                          : 'bg-slate-900 border border-slate-800 text-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      {stepIdx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sequencer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlayingSeq(!isPlayingSeq)}
              className={`px-6 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg active:scale-95 ${
                isPlayingSeq
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/30'
              }`}
            >
              {isPlayingSeq ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Dừng Beat</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Chạy Beat Loop</span>
                </>
              )}
            </button>

            <span className="text-xs font-mono text-slate-400">
              Tốc độ: <strong className="text-amber-400">{bpm} BPM</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">BPM:</span>
            <input
              type="range"
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Standalone Metronome Tool */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          ⏱️ Máy Đếm Nhịp Cá Nhân (Metronome Pro)
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Sử dụng máy đếm nhịp để tập gõ nhịp đều đặn hoặc tìm nhịp độ bằng Tap Tempo:
        </p>

        <div className="max-w-md mx-auto">
          <Metronome initialBpm={100} />
        </div>
      </div>

      {/* CTA */}
      <div className="p-6 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 border border-amber-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Thử thách phản xạ nhịp điệu của bạn?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Lắng nghe chuỗi tiết tấu và gõ lại thật chuẩn xác theo từng phách!
          </p>
        </div>
        <button
          onClick={handleStartRhythmExercise}
          className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
        >
          <span>Luyện Tập: Nhớ Nhịp Điệu (Rhythm Recall)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
