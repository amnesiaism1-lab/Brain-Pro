import React, { useState } from 'react';
import { auditoryEngine, IADSREnvelope } from '../../services/auditoryEngine';
import { InteractiveOscilloscope } from '../ui/InteractiveOscilloscope';
import { Play, Volume2, Sparkles, Sliders, ArrowRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const WAVEFORMS: Array<{ type: OscillatorType; nameVi: string; desc: string; harmonics: string }> = [
  { type: 'sine', nameVi: 'Sóng Sine (Hình Sin)', desc: 'Âm thanh thuần khiết nhất trong tự nhiên, êm dịu, không có bồi âm', harmonics: 'Chỉ có tần số cơ bản f' },
  { type: 'triangle', nameVi: 'Sóng Tam Giác (Triangle)', desc: 'Mềm mại như tiếng sáo flute, clarinet, piano ấm', harmonics: 'Chỉ gồm bồi âm lẻ (1, 3, 5...), suy giảm nhanh (1/n²)' },
  { type: 'square', nameVi: 'Sóng Vuông (Square)', desc: 'Âm thanh âm hưởng retro 8-bit chiptune máy chơi game cổ', harmonics: 'Chỉ gồm bồi âm lẻ (1, 3, 5...), suy giảm chậm hơn (1/n)' },
  { type: 'sawtooth', nameVi: 'Sóng Răng Cưa (Sawtooth)', desc: 'Âm thanh sắc bén, sáng rực, dùng cho lead synth và kèn đồng', harmonics: 'Đầy đủ tất cả bồi âm chẵn và lẻ (1, 2, 3, 4...)' },
];

export const TimbreModule: React.FC = () => {
  const { setActiveTab, setSelectedExerciseSlug } = useAppStore();

  // Waveform state
  const [selectedWaveform, setSelectedWaveform] = useState<OscillatorType>('sawtooth');
  const [pitch, setPitch] = useState<string>('A4');

  // ADSR Envelope State
  const [adsr, setAdsr] = useState<IADSREnvelope>({
    attack: 0.04,
    decay: 0.2,
    sustain: 0.5,
    release: 0.3
  });

  // Filter state
  const [filterCutoff, setFilterCutoff] = useState<number>(2500);

  const handlePlayWaveform = (wf: OscillatorType = selectedWaveform) => {
    auditoryEngine.resumeAudioContext().catch(() => {});
    auditoryEngine.playNote(pitch, 0.7, {
      waveform: wf,
      adsr,
      filterCutoff
    });
  };

  const handleStartTimbreExercise = () => {
    setSelectedExerciseSlug('timbre-match');
    setActiveTab('exercises');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Theory Introduction */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎸</span>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Khái Niệm 6: Âm Sắc (Timbre & Sound Synthesis)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              "Màu sắc" của âm thanh — tại sao cùng nốt A4 (440Hz) nhưng tiếng piano, guitar và kèn lại khác nhau hoàn toàn?
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
          <p>
            <strong>Âm sắc (Timbre)</strong> là đặc tính phân biệt các nguồn âm thanh khác nhau có cùng cao độ và cường độ. Âm sắc được cấu thành bởi 3 yếu tố cốt lõi:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 not-prose my-3">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs">
              <span className="font-bold text-cyan-700 dark:text-cyan-400 text-sm block">1. Dạng Sóng (Harmonics)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Tỉ lệ và số lượng các dải bồi âm tần số cao (harmonics) tạo nên độ ấm, độ sáng hay độ gắt của âm.
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs">
              <span className="font-bold text-purple-700 dark:text-purple-400 text-sm block">2. Bao Hình ADSR</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Cách năng lượng âm thanh bùng lên (Attack), lắng xuống (Decay), duy trì (Sustain) và tắt dần (Release).
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <span className="font-bold text-amber-700 dark:text-amber-400 text-sm block">3. Bộ Lọc (Filter Cutoff)</span>
              <span className="text-slate-600 dark:text-slate-300 mt-1 block">
                Lọc bớt các dải tần số cao để biến đổi âm thanh từ nghẹt/mờ đục sang trong vắt/chói sáng.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Waveform & Real-time Oscilloscope */}
      <div className="p-6 bg-slate-950 text-white rounded-3xl shadow-2xl border border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-cyan-400" />
              So Sánh 4 Dạng Sóng Chuẩn & Máy Hiện Sóng Real-time
            </h3>
            <p className="text-xs text-slate-400">
              Chọn dạng sóng bên dưới để quan sát trực tiếp dao động trên oscilloscope và nghe âm thanh
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Cao độ:</span>
            {['C4', 'E4', 'A4', 'C5'].map(p => (
              <button
                key={p}
                onClick={() => setPitch(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                  pitch === p ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Oscilloscope Canvas */}
        <InteractiveOscilloscope height={110} lineColor="#22d3ee" isActive={true} />

        {/* 4 Waveform Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WAVEFORMS.map((wf) => {
            const isSelected = selectedWaveform === wf.type;

            return (
              <button
                key={wf.type}
                type="button"
                onClick={() => {
                  setSelectedWaveform(wf.type);
                  handlePlayWaveform(wf.type);
                }}
                className={`p-4 rounded-2xl text-left border-2 transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/20 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs uppercase tracking-wider text-cyan-400 font-mono">
                    {wf.type}
                  </span>
                  <Play className="w-3.5 h-3.5 fill-current opacity-70" />
                </div>
                <div className="font-black text-sm text-white">{wf.nameVi}</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight">{wf.desc}</div>
                <div className="text-[10px] text-amber-300/80 mt-2 font-mono">
                  {wf.harmonics}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => handlePlayWaveform()}
            className="px-8 py-3.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-lg shadow-cyan-400/30 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Phát Âm Sắc Hiện Tại ({selectedWaveform.toUpperCase()} - {pitch})</span>
          </button>
        </div>
      </div>

      {/* ADSR Envelope & Filter Studio */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-600" />
            Studio Thiết Kế Bao Hình ADSR & Bộ Lọc Tần Số
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Kéo các thanh trượt bên dưới để thay đổi hình dạng âm thanh (từ tiếng gõ piano sắc nét sang tiếng pad vĩ cầm ngân dài)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ADSR Sliders */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Bao Hình Năng Lượng (ADSR Envelope)
            </h4>

            {/* Attack */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Attack (Độ nảy ban đầu):</span>
                <span className="font-mono text-purple-600 font-bold">{Math.round(adsr.attack * 1000)} ms</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={0.5}
                step={0.01}
                value={adsr.attack}
                onChange={(e) => setAdsr(prev => ({ ...prev, attack: Number(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* Decay */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Decay (Thời gian hạ):</span>
                <span className="font-mono text-purple-600 font-bold">{Math.round(adsr.decay * 1000)} ms</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.6}
                step={0.01}
                value={adsr.decay}
                onChange={(e) => setAdsr(prev => ({ ...prev, decay: Number(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* Sustain */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Sustain (Âm lượng giữ):</span>
                <span className="font-mono text-purple-600 font-bold">{Math.round(adsr.sustain * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.0}
                max={1.0}
                step={0.05}
                value={adsr.sustain}
                onChange={(e) => setAdsr(prev => ({ ...prev, sustain: Number(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* Release */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Release (Thời gian tắt):</span>
                <span className="font-mono text-purple-600 font-bold">{Math.round(adsr.release * 1000)} ms</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={1.2}
                step={0.05}
                value={adsr.release}
                onChange={(e) => setAdsr(prev => ({ ...prev, release: Number(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          {/* Filter Cutoff Slider */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Bộ Lọc Lowpass (Filter Cutoff Sweep)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Lọc bỏ các tần số cao hơn mức giới hạn. Cắt thấp tạo âm thanh mờ đục, mở rộng tạo âm thanh sắc bén.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-slate-500">300 Hz (Ấm)</span>
                <span className="text-cyan-600 dark:text-cyan-400 text-sm font-black">{filterCutoff} Hz</span>
                <span className="text-slate-500">8000 Hz (Sáng)</span>
              </div>
              <input
                type="range"
                min={300}
                max={8000}
                step={50}
                value={filterCutoff}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFilterCutoff(val);
                }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <button
              onClick={() => handlePlayWaveform()}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Thử Nghiệm Âm Thanh Vừa Chỉnh</span>
            </button>
          </div>
        </div>
      </div>

      {/* NEW: Bồi Âm & Hoạ Âm (Harmonic Overtones & Partials - M0-1) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Bồi Âm Tự Nhiên & Năng Lượng Phổ Âm (Harmonic Overtones)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mỗi nốt nhạc trong tự nhiên không chỉ có 1 tần số đơn độc mà là cả một chuỗi bậc thang họa âm cộng hưởng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { num: 1, name: 'Hài 1: Âm Cơ Bản', ratio: '1f (Root)', interval: 'Đồng âm', desc: 'Trọng tâm cao độ của nốt nhạc' },
            { num: 2, name: 'Hài 2: Bát Độ (Octave)', ratio: '2f', interval: '+12 nửa cung', desc: 'Tạo độ trong trẻo, sáng dịu' },
            { num: 3, name: 'Hài 3: Quãng 5 Đúng', ratio: '3f', interval: '+19 nửa cung', desc: 'Tạo độ đanh, âm sắc kèn đồng' },
            { num: 4, name: 'Hài 4: Bát Độ Thứ 2', ratio: '4f', interval: '+24 nửa cung', desc: 'Mở rộng dải treble lung linh' },
            { num: 5, name: 'Hài 5: Quãng 3 Trưởng', ratio: '5f', interval: '+28 nửa cung', desc: 'Gốc rễ tự nhiên của hợp âm Trưởng' },
          ].map(h => (
            <div key={h.num} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                  {h.ratio} · {h.interval}
                </span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                  {h.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {h.desc}
                </p>
              </div>
              <button
                onClick={async () => {
                  await auditoryEngine.resumeAudioContext();
                  auditoryEngine.playOvertoneStimulus('C3', h.num, 10, 1.6);
                }}
                className="w-full py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-emerald-500/20"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Nghe Thử</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Cách Phát Âm (Articulations - M0-3) */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎻</span>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Cách Phát Âm Trong Câu Nhạc (Musical Articulations)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Không chỉ là envelope đơn nốt, articulation là cách nối kết các nốt nhạc để tạo nên hơi thở âm nhạc
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              type: 'legato',
              nameVi: 'Liền Tiếng (Legato)',
              symbol: '⌒',
              desc: 'Các nốt nhạc gối đầu mượt mà, không ngắt quãng âm thanh giữa chừng.'
            },
            {
              type: 'staccato',
              nameVi: 'Ngắt Tiếng (Staccato)',
              symbol: '•',
              desc: 'Nốt bật nhả sắc nét, ngân chỉ ~35% trường độ như giọt mưa rơi.'
            },
            {
              type: 'tenuto',
              nameVi: 'Ngân Trọn Vẹn (Tenuto)',
              symbol: '—',
              desc: 'Ngân trọn vẹn 100% thời gian với áp lực âm thanh đều đặn, trang trọng.'
            },
            {
              type: 'accent',
              nameVi: 'Nhấn Trọng Âm (Accent)',
              symbol: '>',
              desc: 'Tấn công mạnh mẽ đột ngột (+35% cường độ) ngay ở đầu nốt nhạc.'
            },
          ].map(art => (
            <div key={art.type} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono font-black text-purple-600 dark:text-purple-400">
                    {art.symbol}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                    {art.type}
                  </span>
                </div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white mt-1">
                  {art.nameVi}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {art.desc}
                </p>
              </div>

              <button
                onClick={async () => {
                  await auditoryEngine.resumeAudioContext();
                  auditoryEngine.playArticulatedSequence(['C4', 'E4', 'G4', 'C5'], art.type as any);
                }}
                className="w-full py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-purple-500/20"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Nghe Câu 4 Nốt</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-6 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-purple-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Bạn đã tinh thông phân biệt âm sắc?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Luyện tai đoán đúng dạng sóng (Sine, Triangle, Square, Sawtooth) và bộ lọc!
          </p>
        </div>
        <button
          onClick={handleStartTimbreExercise}
          className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
        >
          <span>Luyện Tập: Phân Biệt Âm Sắc (Timbre Match)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
