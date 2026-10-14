import React, { useState, useRef, useEffect } from 'react';
import { auditoryEngine } from '../../services/auditoryEngine';
import { Compass, Volume2, Headphones, ArrowRight, Play, Sparkles, Orbit, CheckCircle2, XCircle, Trophy } from 'lucide-react';
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
  const { setActiveTab, setSelectedExerciseSlug, markTheoryModuleMastered, masteredTheoryModules } = useAppStore();

  const [activeAngle, setActiveAngle] = useState<number>(0);
  const [distance, setDistance] = useState<number>(2.5); // meters (0.5m to 10m)
  const [stereoPan, setStereoPan] = useState<number>(0); // -1 to 1
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);

  // Chapter 7 Mastery Quiz State
  const [quizStep, setQuizStep] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const orbitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePlaySpatialPing = (angle = activeAngle, dist = distance) => {
    auditoryEngine.resumeAudioContext().catch(() => {});
    auditoryEngine.play3DSpatialTone('C5', angle, 0, dist, 0.6);
  };

  const handlePlayStereoPan = (panVal: number) => {
    auditoryEngine.resumeAudioContext().catch(() => {});
    auditoryEngine.playNote('A4', 0.5, { pan: panVal, volume: 0.45 });
  };

  // 360-Degree Moving Source Trajectory (Orbit)
  const handleToggleOrbit = async () => {
    if (isOrbiting) {
      if (orbitTimerRef.current) clearInterval(orbitTimerRef.current);
      setIsOrbiting(false);
      return;
    }

    await auditoryEngine.resumeAudioContext();
    setIsOrbiting(true);

    let currentAngle = 0;
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    let step = 0;

    orbitTimerRef.current = setInterval(() => {
      currentAngle = angles[step];
      setActiveAngle(currentAngle);
      auditoryEngine.play3DSpatialTone('G4', currentAngle, 0, distance, 0.35);

      step++;
      if (step >= angles.length) {
        step = 0;
      }
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (orbitTimerRef.current) clearInterval(orbitTimerRef.current);
    };
  }, []);

  const handleStartLocalizationExercise = () => {
    setSelectedExerciseSlug('sound-localization');
    setActiveTab('exercises');
  };

  // Chapter 7 Mastery Questions
  const SPATIAL_QUESTIONS = [
    {
      id: 'qs1',
      title: 'Câu 1: Cơ chế ITD (Interaural Time Difference) đo lường điều gì?',
      options: [
        { id: 'a', label: 'Chênh lệch thời gian cực nhỏ (< 0.7 ms) khi âm thanh tới tai gần trước tai xa', isCorrect: true },
        { id: 'b', label: 'Thời gian bài hát diễn ra trong bao lâu', isCorrect: false },
        { id: 'c', label: 'Tốc độ sóng âm truyền trong chân không', isCorrect: false },
        { id: 'd', label: 'Độ dài của ống tai trong', isCorrect: false }
      ],
      explanation: 'Chính xác! ITD là sự chênh lệch thời gian dưới 0.7 mili-giây giữa 2 tai, là manh mối chính để vỏ não định vị phương vị trái/phải ở tần số thấp.'
    },
    {
      id: 'qs2',
      title: 'Câu 2: Tại sao ta phân biệt được âm thanh phát ra từ "Trước mặt" hay "Phía sau"?',
      options: [
        { id: 'a', label: 'Nhờ nếp gấp vành tai (HRTF) lọc bớt dải tần số cao khi âm phát từ phía sau', isCorrect: true },
        { id: 'b', label: 'Vì tai phía sau không thể nghe được âm thanh', isCorrect: false },
        { id: 'c', label: 'Do mắt nhìn thấy nguồn âm phát ra', isCorrect: false },
        { id: 'd', label: 'Nhờ sự thay đổi cao độ nốt nhạc', isCorrect: false }
      ],
      explanation: 'Chính xác! Vành tai ngoài hoạt động như một bộ lọc quang phổ (HRTF), làm suy hao dải 3-6kHz khi nguồn âm ở phía sau lưng.'
    },
    {
      id: 'qs3',
      title: 'Câu 3: Khi nguồn âm di chuyển ra xa (từ 1m đến 10m), thuộc tính nào thay đổi mạnh nhất?',
      options: [
        { id: 'a', label: 'Cường độ giảm theo luật nghịch đảo bình phương và tần số cao bị không khí hấp thụ bớt', isCorrect: true },
        { id: 'b', label: 'Cao độ nốt nhạc bị biến đổi sang nốt khác', isCorrect: false },
        { id: 'c', label: 'Âm thanh biến thành sóng hình sin hoàn toàn', isCorrect: false },
        { id: 'd', label: 'Không có thuộc tính nào thay đổi', isCorrect: false }
      ],
      explanation: 'Chính xác! Khoảng cách càng xa, năng lượng tổng thể càng suy giảm và hiện tượng hấp thụ không khí (Air Absorption) sẽ làm mờ các dải treble cao.'
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
          markTheoryModuleMastered('spatial');
        }
      }
    }, 1500);
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
            <span>⚠️ Đeo tai nghe stereo để trải nghiệm không gian 3D chuẩn xác</span>
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              Radar Tương Tác 360° (HRTF Spatial Acoustic Radar)
            </h3>
            <p className="text-xs text-slate-400">
              Bấm vào bất kỳ góc nào trên radar hoặc bật chế độ Quỹ đạo xoay vòng để trải nghiệm nguồn âm chuyển động
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleOrbit}
              className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                isOrbiting
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
              }`}
            >
              <Orbit className="w-4 h-4" />
              <span>{isOrbiting ? 'Dừng Quỹ Đạo' : 'Quỹ Đạo Chuyển Động 360°'}</span>
            </button>
          </div>
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
                className={`absolute w-10 h-10 rounded-full font-mono text-[10px] font-bold flex items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer ${
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

        {/* Distance Slider & Direction Controls */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
                className="px-6 py-3 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-400/30 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Phát Xung Âm 3D</span>
              </button>
            </div>
          </div>

          {/* Distance Slider */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>0.5m (Cực gần)</span>
              <span className="text-cyan-400 font-bold">{distance.toFixed(1)} mét</span>
              <span>10.0m (Xa vời vợi)</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={10.0}
              step={0.5}
              value={distance}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDistance(val);
                handlePlaySpatialPing(activeAngle, val);
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
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

        <div className="space-y-3 max-w-lg mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
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
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-2 active:scale-95 shadow-sm cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Phát Nốt Tại Vị Trí Này</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK MASTERY CHECK (Mini-Game 3 Câu Chương 7) */}
      <div className="p-6 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/30 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyan-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Thử Thách Nhanh: Làm Chủ Định Vị 3D Không Gian (3 Câu)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
            {masteredTheoryModules.includes('spatial') ? '✅ Đã làm chủ chương 7' : `Câu ${quizStep + 1} / 3`}
          </span>
        </div>

        {!quizFinished ? (
          (() => {
            const currentQ = SPATIAL_QUESTIONS[quizStep];
            return (
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                  {currentQ.title}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentQ.options.map(opt => {
                    const isSelected = quizSelectedOption === opt.id;
                    let btnStyle = 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-cyan-400';
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
                  <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-xs text-cyan-900 dark:text-cyan-200 animate-fadeIn">
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
              {quizScore >= 2 ? '🎉 Xuất sắc! Bạn đã làm chủ chương Âm Thanh 3D Không Gian' : 'Hãy thử lại để đạt chuẩn làm chủ nhé!'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Bạn đạt <strong>{quizScore}/3 câu đúng</strong>. Huy hiệu làm chủ chương 7 đã được ghi nhận vào học viện.
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
      <div className="p-6 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/30 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">
            Thử thách khả năng định vị âm thanh 3D?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Lắng nghe âm thanh phát ra trong không gian và chấm đúng vị trí trên radar trong trò chơi!
          </p>
        </div>
        <button
          onClick={handleStartLocalizationExercise}
          className="px-6 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <span>Luyện Tập: Định Vị Âm Thanh 3D (Sound Localization)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
