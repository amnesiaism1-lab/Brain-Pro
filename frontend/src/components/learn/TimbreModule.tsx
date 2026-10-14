import React, { useState } from 'react';
import { auditoryEngine, IADSREnvelope } from '../../services/auditoryEngine';
import { InteractiveOscilloscope } from '../ui/InteractiveOscilloscope';
import { Play, Volume2, Sparkles, Sliders, ArrowRight, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const WAVEFORMS: Array<{ type: OscillatorType; nameVi: string; desc: string; harmonics: string }> = [
  { type: 'sine', nameVi: 'Sóng Sine (Hình Sin)', desc: 'Âm thanh thuần khiết nhất trong tự nhiên, êm dịu, không có bồi âm', harmonics: 'Chỉ có tần số cơ bản f' },
  { type: 'triangle', nameVi: 'Sóng Tam Giác (Triangle)', desc: 'Mềm mại như tiếng sáo flute, clarinet, piano ấm', harmonics: 'Chỉ gồm bồi âm lẻ (1, 3, 5...), suy giảm nhanh (1/n²)' },
  { type: 'square', nameVi: 'Sóng Vuông (Square)', desc: 'Âm thanh âm hưởng retro 8-bit chiptune máy chơi game cổ', harmonics: 'Chỉ gồm bồi âm lẻ (1, 3, 5...), suy giảm chậm hơn (1/n)' },
  { type: 'sawtooth', nameVi: 'Sóng Răng Cưa (Sawtooth)', desc: 'Âm thanh sắc bén, sáng rực, dùng cho lead synth và kèn đồng', harmonics: 'Đầy đủ tất cả bồi âm chẵn và lẻ (1, 2, 3, 4...)' },
];

export const TimbreModule: React.FC = () => {
  const { setActiveTab, setSelectedExerciseSlug, markTheoryModuleMastered, masteredTheoryModules } = useAppStore();

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

  // Chapter 6 Mastery Quiz State
  const [quizStep, setQuizStep] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

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

  // Chapter 6 Mastery Quiz Questions
  const TIMBRE_QUESTIONS = [
    {
      id: 'qt1',
      title: 'Câu 1: Dạng sóng nào KHÔNG chứa bất kỳ bồi âm (harmonics) bậc cao nào, thuần khiết 100%?',
      options: [
        { id: 'a', label: 'Sóng Sine (Hình Sin)', isCorrect: true },
        { id: 'b', label: 'Sóng Răng Cưa (Sawtooth)', isCorrect: false },
        { id: 'c', label: 'Sóng Vuông (Square)', isCorrect: false },
        { id: 'd', label: 'Sóng Tam Giác (Triangle)', isCorrect: false }
      ],
      explanation: 'Chính xác! Sóng Sine là dao động điều hòa đơn giản nhất trong vật lý, chỉ có duy nhất 1 tần số cơ bản f, không có bồi âm.'
    },
    {
      id: 'qt2',
      title: 'Câu 2: Trong bao hình ADSR, tham số nào điều khiển âm lượng khi phím đàn tiếp tục được giữ nguyên?',
      options: [
        { id: 'a', label: 'Sustain (Mức âm lượng duy trì)', isCorrect: true },
        { id: 'b', label: 'Attack (Thời gian bốc lên)', isCorrect: false },
        { id: 'c', label: 'Release (Thời gian tắt dần)', isCorrect: false },
        { id: 'd', label: 'Decay (Thời gian hạ)', isCorrect: false }
      ],
      explanation: 'Chính xác! Sustain là giá trị biên độ (gain) giữ liên tục trong lúc nốt đang ngân, khác với Attack/Decay/Release vốn là các khoảng thời gian (ms).'
    },
    {
      id: 'qt3',
      title: 'Câu 3: Bộ lọc Low-Pass Filter khi bị hạ Cutoff xuống 400Hz sẽ tạo ra cảm giác âm thanh như thế nào?',
      options: [
        { id: 'a', label: 'Âm thanh trở nên tối, nghẹt, ấm và mờ như nghe từ sau bức tường', isCorrect: true },
        { id: 'b', label: 'Âm thanh chói gắt, bén ngót', isCorrect: false },
        { id: 'c', label: 'Âm thanh biến thành tiếng sấm sét', isCorrect: false },
        { id: 'd', label: 'Cao độ bị đổi sang một giọng khác hoàn toàn', isCorrect: false }
      ],
      explanation: 'Chính xác! Low-pass filter chặn toàn bộ các tần số cao trên 400Hz, chỉ cho dải trầm đi qua, khiến âm thanh bị mờ đục và ấm lại.'
    }
  ];

  const handleSelectQuizOption = (opt: { id: string; label: string; isCorrect: boolean }) => {
    if (quizSelectedOption) return;
    setQuizSelectedOption(opt.id);
    if (opt.isCorrect) {
      auditoryEngine.playFeedback(true);
      setQuizScore(prev => prev + 1);
    } else {
      auditoryEngine.playFeedback(false);
    }

    setTimeout(() => {
      if (quizStep < 2) {
        setQuizStep(prev => prev + 1);
        setQuizSelectedOption(null);
      } else {
        setQuizFinished(true);
        if (quizScore + (opt.isCorrect ? 1 : 0) >= 2) {
          markTheoryModuleMastered('timbre');
        }
      }
    }, 1500);
  };

  // ADSR Graph calculations for reactive SVG
  const attackW = Math.max(16, adsr.attack * 85);
  const decayW = Math.max(16, adsr.decay * 65);
  const sustainW = 45;
  const releaseW = Math.max(16, adsr.release * 55);
  const totalW = attackW + decayW + sustainW + releaseW;

  const svgH = 65;
  const peakY = 8;
  const sustainY = Math.max(peakY, svgH - 6 - adsr.sustain * (svgH - peakY - 8));
  const baseY = svgH - 6;

  const attackX = (attackW / totalW) * 260;
  const decayX = attackX + (decayW / totalW) * 260;
  const sustainX = decayX + (sustainW / totalW) * 260;
  const releaseX = 260;

  // Filter curve calculations
  // Log scale for 100Hz to 10000Hz (width = 260px)
  const normCutoff = Math.max(0.05, Math.min(0.95, Math.log10(filterCutoff / 100) / 2));
  const cutoffX = normCutoff * 260;

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
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                  pitch === p ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Oscilloscope Canvas with Dual Mode Waveform/FFT */}
        <InteractiveOscilloscope height={120} lineColor="#22d3ee" isActive={true} showModeToggle={true} />

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
                className={`p-4 rounded-2xl text-left border-2 transition-all active:scale-95 cursor-pointer ${
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
            className="px-8 py-3.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-lg shadow-cyan-400/30 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Phát Âm Sắc Hiện Tại ({selectedWaveform.toUpperCase()} - {pitch})</span>
          </button>
        </div>
      </div>

      {/* ADSR Envelope & Filter Studio with Dynamic Animated Curves */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-600" />
            Studio Thiết Kế Bao Hình ADSR & Bộ Lọc Tần Số
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Kéo các thanh trượt bên dưới để quan sát đồ thị bao hình và đáp ứng tần số biến đổi theo thời gian thực
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ADSR Sliders with Dynamic Reactive SVG Graph */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Bao Hình Năng Lượng (ADSR Envelope)
              </h4>
              <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                Đồ thị đường bao động
              </span>
            </div>

            {/* Dynamic ADSR Curve SVG */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-purple-500/30 flex items-center justify-center">
              <svg viewBox="0 0 260 70" className="w-full h-16 overflow-visible">
                <defs>
                  <linearGradient id="adsrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {/* Baseline */}
                <line x1="0" y1={baseY} x2="260" y2={baseY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                {/* Envelope Area Fill */}
                <polygon
                  points={`0,${baseY} ${attackX},${peakY} ${decayX},${sustainY} ${sustainX},${sustainY} ${releaseX},${baseY}`}
                  fill="url(#adsrGrad)"
                />
                {/* Envelope Stroke Line */}
                <polyline
                  points={`0,${baseY} ${attackX},${peakY} ${decayX},${sustainY} ${sustainX},${sustainY} ${releaseX},${baseY}`}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Points & Stage Labels */}
                <circle cx={attackX} cy={peakY} r="3.5" fill="#f43f5e" />
                <circle cx={decayX} cy={sustainY} r="3" fill="#eab308" />
                <circle cx={sustainX} cy={sustainY} r="3" fill="#3b82f6" />
                <circle cx={releaseX} cy={baseY} r="3" fill="#10b981" />

                <text x={attackX / 2} y={baseY - 4} fill="#a855f7" fontSize="9" fontWeight="bold">A</text>
                <text x={(attackX + decayX) / 2} y={baseY - 4} fill="#eab308" fontSize="9" fontWeight="bold">D</text>
                <text x={(decayX + sustainX) / 2} y={baseY - 4} fill="#3b82f6" fontSize="9" fontWeight="bold">S</text>
                <text x={(sustainX + releaseX) / 2} y={baseY - 4} fill="#10b981" fontSize="9" fontWeight="bold">R</text>
              </svg>
            </div>

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

          {/* Filter Cutoff Slider with Dynamic Frequency Curve */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Bộ Lọc Lowpass (Filter Cutoff Sweep)
                </h4>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                  Đáp ứng tần số (-12dB/oct)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Lọc bỏ các tần số cao hơn mức giới hạn. Cắt thấp tạo âm thanh mờ đục, mở rộng tạo âm thanh sắc bén.
              </p>
            </div>

            {/* Dynamic Lowpass Curve SVG */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center">
              <svg viewBox="0 0 260 70" className="w-full h-16 overflow-visible">
                <defs>
                  <linearGradient id="filterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {/* Axis lines */}
                <line x1="0" y1="62" x2="260" y2="62" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                {/* Rolloff Curve */}
                <path
                  d={`M 0,16 L ${cutoffX},16 Q ${cutoffX + 35},20 ${Math.min(260, cutoffX + 75)},62 L 260,62 L 260,62 L 0,62 Z`}
                  fill="url(#filterGrad)"
                />
                <path
                  d={`M 0,16 L ${cutoffX},16 Q ${cutoffX + 35},20 ${Math.min(260, cutoffX + 75)},62`}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                />
                {/* Cutoff Marker */}
                <circle cx={cutoffX} cy="16" r="4" fill="#38bdf8" />
                <line x1={cutoffX} y1="16" x2={cutoffX} y2="62" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />

                <text x="5" y="58" fill="#64748b" fontSize="8" fontFamily="monospace">100Hz</text>
                <text x="120" y="58" fill="#64748b" fontSize="8" fontFamily="monospace">1kHz</text>
                <text x="225" y="58" fill="#64748b" fontSize="8" fontFamily="monospace">10kHz</text>
                <text x={Math.max(5, Math.min(195, cutoffX - 20))} y="12" fill="#38bdf8" fontSize="9" fontWeight="bold">
                  {filterCutoff}Hz
                </text>
              </svg>
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
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Thử Nghiệm Âm Thanh Vừa Chỉnh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bồi Âm & Hoạ Âm (Harmonic Overtones) with Dark Surface Fix */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Bồi Âm Tự Nhiên & Dãy Họa Âm (Harmonic Series)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Khi một dây đàn rung lên ở tần số cơ bản f, nó đồng thời rung ở các phân số 2f, 3f, 4f...
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
            <div key={h.num} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                  {h.ratio} · {h.interval}
                </span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                  {h.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {h.desc}
                </p>
              </div>
              <button
                onClick={async () => {
                  await auditoryEngine.resumeAudioContext();
                  auditoryEngine.playOvertoneStimulus('C3', h.num, 10, 1.6);
                }}
                className="w-full py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-emerald-500/20 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Nghe Thử</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cách Phát Âm (Articulations) with Dark Surface Fix */}
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
            <div key={art.type} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
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
                className="w-full py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-purple-500/20 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Nghe Câu 4 Nốt</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK MASTERY CHECK (Mini-Game 3 Câu Chương 6) */}
      <div className="p-6 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-purple-500/30 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Thử Thách Nhanh: Làm Chủ Âm Sắc & Bội Âm (3 Câu)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
            {masteredTheoryModules.includes('timbre') ? '✅ Đã làm chủ chương 6' : `Câu ${quizStep + 1} / 3`}
          </span>
        </div>

        {!quizFinished ? (
          (() => {
            const currentQ = TIMBRE_QUESTIONS[quizStep];
            return (
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                  {currentQ.title}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentQ.options.map(opt => {
                    const isSelected = quizSelectedOption === opt.id;
                    let btnStyle = 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-400';
                    if (quizSelectedOption) {
                      if (opt.isCorrect) btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                      else if (isSelected) btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200';
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={quizSelectedOption !== null}
                        onClick={() => handleSelectQuizOption(opt)}
                        className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between cursor-pointer active:scale-98 ${btnStyle}`}
                      >
                        <span>{opt.label}</span>
                        {quizSelectedOption && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />}
                        {quizSelectedOption && isSelected && !opt.isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {quizSelectedOption && (
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 animate-fadeIn">
                    {currentQ.explanation}
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="p-5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/30 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {quizScore >= 2 ? '🎉 Xuất sắc! Bạn đã làm chủ chương Âm Sắc' : 'Hãy thử lại để đạt chuẩn làm chủ nhé!'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Bạn đạt <strong>{quizScore}/3 câu đúng</strong>. Huy hiệu làm chủ chương 6 đã được ghi nhận vào học viện.
            </p>
            <button
              onClick={() => {
                setQuizStep(0);
                setQuizScore(0);
                setQuizSelectedOption(null);
                setQuizFinished(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Làm lại bài kiểm tra
            </button>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="p-6 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border border-purple-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Bạn đã tinh thông phân biệt âm sắc?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Luyện tai đoán đúng dạng sóng (Sine, Triangle, Square, Sawtooth) và bộ lọc trong trò chơi!
          </p>
        </div>
        <button
          onClick={handleStartTimbreExercise}
          className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <span>Luyện Tập: Phân Biệt Âm Sắc (Timbre Match)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
