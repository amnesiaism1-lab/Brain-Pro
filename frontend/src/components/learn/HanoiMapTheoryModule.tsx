import React, { useState, useMemo } from 'react';
import {
  Compass,
  Map as MapIcon,
  Layers,
  Sun,
  Eye,
  EyeOff,
  RotateCw,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Trophy,
  Navigation,
  ShieldAlert,
  Maximize2,
  BookOpen,
  Info,
  Clock,
  Zap,
  Target,
  Brain
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  ALL_HANOI_ENTITIES,
  HANOI_WATER_EDGES,
  HANOI_BRIDGES,
  HANOI_RING_ROADS,
  HANOI_RADIAL_CORRIDORS,
  HANOI_FRENCH_GRID_STREETS,
  HANOI_LANDMARKS,
  HANOI_JUNCTIONS,
  HANOI_THEORY_CHAPTERS,
  getHanoiSolarAzimuth,
  getHanoiShadowBearing,
  bearingToCardinalName,
  IHanoiEntity
} from '@brain-exercises/shared';
import { HanoiMarkdownContent } from './HanoiMarkdownContent';

export const HanoiMapTheoryModule: React.FC = () => {
  const {
    setSelectedExerciseSlug,
    setActiveGameSlug,
    markTheoryModuleMastered,
    masteredTheoryModules
  } = useAppStore();

  // Active Tab: Map View vs Theory Chapters vs Knowledge Quiz
  const [activeMainTab, setActiveMainTab] = useState<'interactive_map' | 'theory_chapters' | 'quick_quiz'>('interactive_map');

  // Interactive Map Layer Toggles
  const [showWater, setShowWater] = useState(true);
  const [showRings, setShowRings] = useState(true);
  const [showRadials, setShowRadials] = useState(true);
  const [showBridges, setShowBridges] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showFrenchGrid, setShowFrenchGrid] = useState(true);
  const [silentMode, setSilentMode] = useState(false); // Hide street/landmark names for testing
  const [mapRotation, setMapRotation] = useState<number>(0); // 0, 90, 180, 270 degrees

  // Solar simulation state (Hour in day: 6 to 18)
  const [simulatedHour, setSimulatedHour] = useState<number>(16.5); // 16h30 chiều

  // Selected Entity for Detail Drawer
  const [selectedEntity, setSelectedEntity] = useState<IHanoiEntity | null>(null);

  // Active Theory Chapter index
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  // Knowledge Quiz state
  const [quizStep, setQuizStep] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Calculate current solar azimuth and shadow bearing
  const currentSunAzimuth = useMemo(() => getHanoiSolarAzimuth(simulatedHour), [simulatedHour]);
  const currentShadowBearing = useMemo(() => getHanoiShadowBearing(simulatedHour), [simulatedHour]);
  const currentSunDirectionName = useMemo(() => bearingToCardinalName(currentSunAzimuth), [currentSunAzimuth]);

  // Quiz questions
  const QUIZ_QUESTIONS = [
    {
      question: 'Theo thứ tự từ BẮC xuống NAM, chuỗi cầu bắc qua sông Hồng nào sau đây là chính xác?',
      options: [
        'Cầu Long Biên → Cầu Thăng Long → Cầu Chương Dương → Cầu Vĩnh Tuy',
        'Cầu Nhật Tân → Cầu Thăng Long → Cầu Long Biên → Cầu Chương Dương → Cầu Vĩnh Tuy → Cầu Thanh Trì',
        'Cầu Thăng Long → Cầu Nhật Tân → Cầu Vĩnh Tuy → Cầu Long Biên → Cầu Thanh Trì',
        'Cầu Chương Dương → Cầu Long Biên → Cầu Nhật Tân → Cầu Vĩnh Tuy'
      ],
      correctIndex: 1,
      explanation: 'Chuỗi bất biến từ Bắc xuống Nam: Nhật Tân (2015, dây văng) → Thăng Long (1985, giàn thép) → Long Biên (1902, thép Eiffel) → Chương Dương (1985) → Vĩnh Tuy (8 làn) → Thanh Trì (cực Nam Vành đai 3).'
    },
    {
      question: 'Trong khu phố Pháp (quận Hoàn Kiếm), cặp đường nào sau đây có quan hệ SONG SONG (//)?',
      options: [
        'Trần Hưng Đạo và Bà Triệu',
        'Lý Thường Kiệt và Hàng Bài',
        'Hai Bà Trưng và Lý Thường Kiệt',
        'Quang Trung và Tràng Thi'
      ],
      correctIndex: 2,
      explanation: 'Các trục Đông - Tây chạy song song (//) với nhau gồm: Trần Hưng Đạo // Lý Thường Kiệt // Hai Bà Trưng // Tràng Thi. Bà Triệu, Hàng Bài, Quang Trung là các trục Bắc - Nam vuông góc (⟂) với nhóm này.'
    },
    {
      question: 'Lúc 16h45 chiều mùa hè tại Hà Nội, bạn lái xe trên đường mà ánh nắng mặt trời rọi thẳng chói mắt phía trước mặt. Bạn đang di chuyển theo hướng nào?',
      options: [
        'Hướng Đông (về phía Sông Hồng và Cầu Chương Dương)',
        'Hướng Tây (về phía Cầu Giấy, Mỹ Đình, Hà Đông)',
        'Hướng Nam (về phía Giải Phóng, Giáp Bát)',
        'Hướng Bắc (về phía Hồ Tây, Cầu Nhật Tân)'
      ],
      correctIndex: 1,
      explanation: 'Tại Hà Nội, buổi chiều (16h - 17h30) mặt trời lặn ở hướng Tây / Tây Nam (azimuth ~260° - 275°). Nếu nắng chiếu thẳng vào mắt, bạn chắc chắn đang đi về hướng TÂY (ví dụ trên trục Xuân Thủy, Nguyễn Trãi, Trần Duy Hưng).'
    },
    {
      question: 'Cặp đường một chiều đối xứng nổi tiếng kẹp giữa hồ Hoàn Kiếm và Vành đai 1 là:',
      options: [
        'Phố Huế (1 chiều Nam) và Bà Triệu (1 chiều Bắc)',
        'Trần Hưng Đạo (1 chiều Đông) và Lý Thường Kiệt (1 chiều Tây)',
        'Giải Phóng (1 chiều Nam) và Lê Duẩn (1 chiều Bắc)',
        'Đường Láng (1 chiều Bắc) và Nguyễn Trãi (1 chiều Nam)'
      ],
      correctIndex: 0,
      explanation: 'Phố Huế chỉ chạy một chiều từ Bắc xuống Nam (từ Hàng Bài xuống Đại Cồ Việt). Để quay ngược lại lên Bờ Hồ, bạn phải đi đường Bà Triệu song song một chiều từ Nam lên Bắc.'
    }
  ];

  const handleSelectQuizOption = (index: number) => {
    if (selectedQuizOption !== null) return;
    setSelectedQuizOption(index);
    if (index === QUIZ_QUESTIONS[quizStep].correctIndex) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    if (quizStep + 1 < QUIZ_QUESTIONS.length) {
      setQuizStep(prev => prev + 1);
      setSelectedQuizOption(null);
    } else {
      setQuizFinished(true);
      markTheoryModuleMastered('hanoi-map');
    }
  };

  const handleLaunchExercise = (modeParam?: string) => {
    setSelectedExerciseSlug('hanoi-navigation');
    setActiveGameSlug('hanoi-navigation');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fadeIn">
      {/* Top Banner Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950 text-white p-6 sm:p-10 shadow-2xl border border-amber-500/20">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide">
              <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span>BẢN ĐỒ NHẬN THỨC ĐÔ THỊ · KHOA HỌC KHÔNG GIAN HÀ NỘI</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Lý Thuyết & Cách Tư Duy <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-orange-400">Bản Đồ Hà Nội</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Giải mã toàn diện cấu trúc Thủ đô theo mô hình 5 thành phần của Kevin Lynch:
              <strong> 3 Tuyến Vành đai Đồng tâm</strong>, <strong>8 Trục Hướng tâm</strong>,
              <strong> Chuỗi 6 Cầu Sông Hồng</strong>, <strong>Lưới Phố Pháp Ô Bàn Cờ</strong> và
              <strong> La Bàn Mặt Trời Theo Giờ</strong> để không bao giờ lạc đường.
            </p>

            {/* Quick Stats Badges */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md text-xs font-semibold text-slate-200 border border-white/10">
                🌊 1 Sông Hồng & 8 Hồ Lớn
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md text-xs font-semibold text-slate-200 border border-white/10">
                🌉 6 Cầu Sông Hồng
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md text-xs font-semibold text-slate-200 border border-white/10">
                ⭕ 3 Vành Đai Đồng Tâm
              </span>
              <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md text-xs font-semibold text-slate-200 border border-white/10">
                ☀️ La Bàn Mặt Trời 21.03°N
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold">
                🎯 5 Chế Độ Bài Tập Thực Chiến
              </span>
            </div>
          </div>

          {/* Direct CTA Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleLaunchExercise()}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base shadow-xl hover:shadow-amber-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 btn-press"
            >
              <Zap className="w-5 h-5 fill-slate-950" />
              <span>Vào Luyện Tập Ngay</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="text-center text-xs text-slate-400">
              {masteredTheoryModules.includes('hanoi-map') ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã nắm vững lý thuyết
                </span>
              ) : (
                '12 Cấp độ chuẩn + 10 Cấp Vô Cực'
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveMainTab('interactive_map')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${activeMainTab === 'interactive_map'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/15'
              }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>1. Bản Đồ Tương Tác Vector & Mặt Trời</span>
          </button>
          <button
            onClick={() => setActiveMainTab('theory_chapters')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${activeMainTab === 'theory_chapters'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/15'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Giáo Trình 10 Chương Thực Chiến & Không Giới Hạn</span>
          </button>
          <button
            onClick={() => setActiveMainTab('quick_quiz')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${activeMainTab === 'quick_quiz'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/15'
              }`}
          >
            <Trophy className="w-4 h-4" />
            <span>3. Kiểm Tra Nhận Thức Nhanh (Quiz)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: INTERACTIVE VECTOR MAP & SOLAR SIMULATION
          ========================================================================= */}
      {activeMainTab === 'interactive_map' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Layer Toggles */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Lớp:
              </span>
              <button
                onClick={() => setShowWater(!showWater)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${showWater ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
              >
                🌊 Sông & Hồ
              </button>
              <button
                onClick={() => setShowRings(!showRings)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${showRings ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
              >
                ⭕ 3 Vành Đai
              </button>
              <button
                onClick={() => setShowRadials(!showRadials)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${showRadials ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
              >
                ⚡ Trục Hướng Tâm
              </button>
              <button
                onClick={() => setShowBridges(!showBridges)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${showBridges ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
              >
                🌉 6 Cầu Sông Hồng
              </button>
              <button
                onClick={() => setShowLandmarks(!showLandmarks)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${showLandmarks ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
              >
                🏛️ Điểm Neo (Landmarks)
              </button>
              <button
                onClick={() => setShowFrenchGrid(!showFrenchGrid)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${showFrenchGrid ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
              >
                📐 Ô Phố Pháp
              </button>
            </div>

            {/* Silent Mode & Map Rotation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSilentMode(!silentMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${silentMode ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                title="Ẩn toàn bộ nhãn tên phố để thử thách trí nhớ"
              >
                {silentMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{silentMode ? 'Bản Đồ Câm (Đang Bật)' : 'Chế Độ Học (Có Nhãn)'}</span>
              </button>

              <button
                onClick={() => setMapRotation(prev => (prev + 90) % 360)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all"
                title="Xoay góc bản đồ để luyện phản xạ Mental Rotation"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Xoay: {mapRotation}°</span>
              </button>
            </div>
          </div>

          {/* Interactive Map Canvas Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white/95 dark:bg-slate-950 rounded-3xl p-4 sm:p-6 border border-[#D5CBB9] dark:border-slate-800 relative overflow-hidden shadow-lg dark:shadow-2xl flex flex-col justify-between min-h-[540px]">
              {/* Solar Azimuth Overlay Header */}
              <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-[#D5CBB9] dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400">
                    <Sun className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Mô phỏng giờ trong ngày tại Hà Nội:</div>
                    <div className="text-sm font-black text-amber-600 dark:text-amber-300 flex items-center gap-2">
                      <span>{Math.floor(simulatedHour)}h{Math.round((simulatedHour % 1) * 60).toString().padStart(2, '0')}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        Nắng {currentSunDirectionName} ({currentSunAzimuth}°)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Slider */}
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <span className="text-[10px] text-slate-500 font-bold">06h</span>
                  <input
                    type="range"
                    min="6"
                    max="18"
                    step="0.5"
                    value={simulatedHour}
                    onChange={(e) => setSimulatedHour(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <span className="text-[10px] text-slate-500 font-bold">18h</span>
                </div>
              </div>

              {/* Main SVG Vector Canvas */}
              <div className="relative w-full flex-1 my-4 flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 800 650"
                  className="w-full h-full max-h-[500px] transition-transform duration-500"
                  style={{ transform: `rotate(${mapRotation}deg)` }}
                >
                  <defs>
                    {/* Gradients */}
                    <linearGradient id="redRiverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
                      <stop offset="50%" stopColor="#f97316" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="westLakeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="sunRayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Dynamic Solar Ray Beam */}
                  <g className="transition-all duration-300 pointer-events-none">
                    <line
                      x1={400 + 350 * Math.cos(((currentSunAzimuth - 90) * Math.PI) / 180)}
                      y1={325 + 350 * Math.sin(((currentSunAzimuth - 90) * Math.PI) / 180)}
                      x2="400"
                      y2="325"
                      stroke="#fbbf24"
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      opacity="0.6"
                    />
                    <circle
                      cx={400 + 350 * Math.cos(((currentSunAzimuth - 90) * Math.PI) / 180)}
                      cy={325 + 350 * Math.sin(((currentSunAzimuth - 90) * Math.PI) / 180)}
                      r="16"
                      fill="#f59e0b"
                      opacity="0.9"
                    />
                    <text
                      x={400 + 350 * Math.cos(((currentSunAzimuth - 90) * Math.PI) / 180)}
                      y={325 + 350 * Math.sin(((currentSunAzimuth - 90) * Math.PI) / 180) + 4}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ☀️
                    </text>
                  </g>

                  {/* 1. LAYER: WATER BODIES & RIVERS */}
                  {showWater && (
                    <g id="layer-water">
                      {/* Sông Hồng (Tây Bắc -> Đông Nam) */}
                      <path
                        d="M 120,0 C 220,90 350,150 480,240 C 580,310 650,420 780,580 L 800,560 C 670,400 600,290 500,220 C 370,130 240,70 140,0 Z"
                        fill="url(#redRiverGrad)"
                        opacity="0.85"
                        className="cursor-pointer hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedEntity(HANOI_WATER_EDGES[0])}
                      />
                      {!silentMode && (
                        <text x="590" y="340" fill="#fecaca" fontSize="12" fontWeight="bold" letterSpacing="2">
                          SÔNG HỒNG (NHỊ HÀ)
                        </text>
                      )}

                      {/* Sông Tô Lịch uốn lượn */}
                      <path
                        d="M 330,220 C 310,290 290,360 300,430 C 310,500 360,560 410,630"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="5"
                        strokeDasharray="4 2"
                        opacity="0.75"
                        className="cursor-pointer"
                        onClick={() => setSelectedEntity(HANOI_WATER_EDGES[1])}
                      />
                      {!silentMode && (
                        <text x="250" y="360" fill="#67e8f9" fontSize="10" fontStyle="italic">
                          Sông Tô Lịch
                        </text>
                      )}

                      {/* Hồ Tây */}
                      <path
                        d="M 350,110 C 430,90 470,140 450,210 C 420,240 360,230 330,190 C 310,150 320,120 350,110 Z"
                        fill="url(#westLakeGrad)"
                        className="cursor-pointer hover:stroke-cyan-300 hover:stroke-2"
                        onClick={() => setSelectedEntity(HANOI_WATER_EDGES[2])}
                      />
                      {!silentMode && (
                        <text x="375" y="170" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
                          HỒ TÂY
                        </text>
                      )}

                      {/* Hồ Trúc Bạch */}
                      <ellipse
                        cx="460"
                        cy="200"
                        rx="16"
                        ry="12"
                        fill="#38bdf8"
                        className="cursor-pointer"
                        onClick={() => setSelectedEntity(HANOI_WATER_EDGES[3])}
                      />

                      {/* Hồ Hoàn Kiếm (Root Anchor) */}
                      <ellipse
                        cx="500"
                        cy="300"
                        rx="16"
                        ry="24"
                        fill="#10b981"
                        stroke="#34d399"
                        strokeWidth="2"
                        className="cursor-pointer animate-pulse"
                        onClick={() => setSelectedEntity(HANOI_WATER_EDGES[4])}
                      />
                      {!silentMode && (
                        <text x="500" y="304" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                          HỒ GƯƠM
                        </text>
                      )}

                      {/* Hồ Bảy Mẫu (Công viên Thống Nhất) */}
                      <circle
                        cx="470"
                        cy="380"
                        r="18"
                        fill="#0284c7"
                        className="cursor-pointer"
                        onClick={() => setSelectedEntity(HANOI_WATER_EDGES[5])}
                      />
                      {!silentMode && (
                        <text x="470" y="384" fill="#ffffff" fontSize="8" textAnchor="middle">
                          Bảy Mẫu
                        </text>
                      )}

                      {/* Hồ Thủ Lệ */}
                      <circle
                        cx="320"
                        cy="260"
                        r="14"
                        fill="#0284c7"
                        className="cursor-pointer"
                        onClick={() => setSelectedEntity(HANOI_WATER_EDGES[6])}
                      />
                    </g>
                  )}

                  {/* 2. LAYER: RING ROADS (VÀNH ĐAI ĐỒNG TÂM) */}
                  {showRings && (
                    <g id="layer-rings">
                      {/* Vành đai 1 (Vàng) */}
                      <ellipse
                        cx="460"
                        cy="330"
                        rx="110"
                        ry="100"
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="3.5"
                        strokeDasharray="6 3"
                        className="cursor-pointer hover:stroke-yellow-200"
                        onClick={() => setSelectedEntity(HANOI_RING_ROADS[0])}
                      />
                      {!silentMode && (
                        <text x="460" y="440" fill="#fef08a" fontSize="10" fontWeight="bold" textAnchor="middle">
                          VÀNH ĐAI 1 (Xã Đàn - Đại Cồ Việt)
                        </text>
                      )}

                      {/* Vành đai 2 (Xanh Neon) */}
                      <ellipse
                        cx="430"
                        cy="310"
                        rx="180"
                        ry="170"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="4"
                        className="cursor-pointer hover:stroke-cyan-200"
                        onClick={() => setSelectedEntity(HANOI_RING_ROADS[1])}
                      />
                      {!silentMode && (
                        <text x="430" y="490" fill="#a5f3fc" fontSize="11" fontWeight="bold" textAnchor="middle">
                          VÀNH ĐAI 2 (Minh Khai - Trường Chinh - Láng - Bưởi)
                        </text>
                      )}

                      {/* Vành đai 3 (Tím/Đỏ Cao Tốc) */}
                      <ellipse
                        cx="390"
                        cy="320"
                        rx="280"
                        ry="260"
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="5"
                        className="cursor-pointer hover:stroke-purple-200"
                        onClick={() => setSelectedEntity(HANOI_RING_ROADS[3])}
                      />
                      {!silentMode && (
                        <text x="390" y="590" fill="#e9d5ff" fontSize="12" fontWeight="bold" textAnchor="middle">
                          VÀNH ĐAI 3 (Phạm Hùng - Khuất Duy Tiến - Nguyễn Xiển)
                        </text>
                      )}
                    </g>
                  )}

                  {/* 3. LAYER: RADIALS (TRỤC HƯỚNG TÂM) */}
                  {showRadials && (
                    <g id="layer-radials">
                      {/* Trục Tây Nam: Tôn Đức Thắng - Nguyễn Trãi */}
                      <line
                        x1="490" y1="310" x2="200" y2="520"
                        stroke="#f97316" strokeWidth="4"
                        className="cursor-pointer hover:stroke-orange-300"
                        onClick={() => setSelectedEntity(HANOI_JUNCTIONS[0])}
                      />
                      {!silentMode && (
                        <text x="280" y="470" fill="#fdba74" fontSize="10" fontWeight="bold" transform="rotate(-35 280 470)">
                          Trục Nguyễn Trãi - Hà Đông
                        </text>
                      )}

                      {/* Trục Nam: Giải Phóng */}
                      <line
                        x1="480" y1="340" x2="480" y2="620"
                        stroke="#ec4899" strokeWidth="4"
                        className="cursor-pointer"
                        onClick={() => setSelectedEntity(HANOI_JUNCTIONS[2])}
                      />
                      {!silentMode && (
                        <text x="488" y="540" fill="#fbcfe8" fontSize="10" fontWeight="bold">
                          Trục Giải Phóng (QL1A)
                        </text>
                      )}

                      {/* Trục Tây Bắc: Cầu Giấy - Xuân Thủy */}
                      <line
                        x1="460" y1="280" x2="160" y2="210"
                        stroke="#10b981" strokeWidth="4"
                        className="cursor-pointer"
                        onClick={() => setSelectedEntity(HANOI_JUNCTIONS[5])}
                      />
                      {!silentMode && (
                        <text x="210" y="240" fill="#a7f3d0" fontSize="10" fontWeight="bold">
                          Trục Cầu Giấy - Xuân Thủy
                        </text>
                      )}

                      {/* Trục Tây Ba Đình: Văn Cao - Liễu Giai - Trần Duy Hưng */}
                      <line
                        x1="390" y1="190" x2="230" y2="400"
                        stroke="#38bdf8" strokeWidth="3.5"
                        className="cursor-pointer"
                        onClick={() => setSelectedEntity(HANOI_JUNCTIONS[3])}
                      />

                      {/* Trục Giảng Võ - Láng Hạ - Lê Văn Lương */}
                      <line
                        x1="440" y1="290" x2="210" y2="460"
                        stroke="#eab308" strokeWidth="3"
                        className="cursor-pointer"
                      />

                      {/* Trục Sân Bay: Võ Chí Công - Cầu Nhật Tân */}
                      <line
                        x1="330" y1="180" x2="350" y2="10"
                        stroke="#6366f1" strokeWidth="4.5"
                        className="cursor-pointer"
                        onClick={() => setSelectedEntity(HANOI_BRIDGES[0])}
                      />
                      {!silentMode && (
                        <text x="358" y="80" fill="#c7d2fe" fontSize="10" fontWeight="bold">
                          Trục Võ Chí Công - Nội Bài
                        </text>
                      )}
                    </g>
                  )}

                  {/* 4. LAYER: BRIDGES ACROSS RED RIVER */}
                  {showBridges && (
                    <g id="layer-bridges">
                      {HANOI_BRIDGES.map((br, idx) => {
                        // Estimated bridge crossing coords on red river curve
                        const bridgePos = [
                          { x: 350, y: 35, name: 'Nhật Tân' },
                          { x: 260, y: 70, name: 'Thăng Long' },
                          { x: 535, y: 260, name: 'Long Biên' },
                          { x: 550, y: 285, name: 'Chương Dương' },
                          { x: 640, y: 400, name: 'Vĩnh Tuy' },
                          { x: 740, y: 530, name: 'Thanh Trì' }
                        ][idx];

                        return (
                          <g
                            key={br.id}
                            className="cursor-pointer group"
                            onClick={() => setSelectedEntity(br)}
                          >
                            <circle
                              cx={bridgePos.x}
                              cy={bridgePos.y}
                              r="8"
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth="2"
                              className="group-hover:scale-125 transition-transform"
                            />
                            {!silentMode && (
                              <text
                                x={bridgePos.x + 12}
                                y={bridgePos.y + 4}
                                fill="#ffffff"
                                fontSize="10"
                                fontWeight="bold"
                                className="drop-shadow"
                              >
                                {idx + 1}. Cầu {bridgePos.name}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* 5. LAYER: FRENCH GRID STREETS (Phố Pháp) */}
                  {showFrenchGrid && (
                    <g id="layer-french-grid">
                      {/* Khối ô cờ Hoàn Kiếm */}
                      <rect x="470" y="315" width="85" height="45" fill="none" stroke="#c084fc" strokeWidth="1" strokeDasharray="2 2" />
                      {/* Trần Hưng Đạo */}
                      <line x1="450" y1="350" x2="560" y2="350" stroke="#a855f7" strokeWidth="2.5" />
                      {/* Lý Thường Kiệt */}
                      <line x1="460" y1="335" x2="560" y2="335" stroke="#a855f7" strokeWidth="2" />
                      {/* Hai Bà Trưng */}
                      <line x1="470" y1="320" x2="560" y2="320" stroke="#a855f7" strokeWidth="2" />
                      {/* Bà Triệu & Phố Huế */}
                      <line x1="510" y1="310" x2="510" y2="410" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 2" />
                      <line x1="535" y1="310" x2="535" y2="410" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 2" />
                    </g>
                  )}

                  {/* 6. LAYER: KEY LANDMARKS */}
                  {showLandmarks && (
                    <g id="layer-landmarks">
                      {/* Keangnam Landmark 72 (Phía Tây Nam) */}
                      <g className="cursor-pointer" onClick={() => setSelectedEntity(HANOI_LANDMARKS[0])}>
                        <rect x="220" y="360" width="16" height="16" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                        {!silentMode && (
                          <text x="242" y="373" fill="#fde68a" fontSize="10" fontWeight="bold">
                            Keangnam 72 (Tây Nam)
                          </text>
                        )}
                      </g>

                      {/* Lotte Center (Ba Đình) */}
                      <g className="cursor-pointer" onClick={() => setSelectedEntity(HANOI_LANDMARKS[1])}>
                        <polygon points="345,245 355,265 335,265" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                        {!silentMode && (
                          <text x="360" y="260" fill="#bae6fd" fontSize="9" fontWeight="bold">
                            Lotte Liễu Giai
                          </text>
                        )}
                      </g>

                      {/* Lăng Bác */}
                      <g className="cursor-pointer" onClick={() => setSelectedEntity(HANOI_LANDMARKS[3])}>
                        <rect x="425" y="240" width="14" height="12" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                        {!silentMode && (
                          <text x="425" y="235" fill="#fca5a5" fontSize="8" fontWeight="bold" textAnchor="middle">
                            Lăng Bác
                          </text>
                        )}
                      </g>

                      {/* Ga Hà Nội */}
                      <g className="cursor-pointer" onClick={() => setSelectedEntity(HANOI_LANDMARKS[6])}>
                        <circle cx="450" cy="335" r="5" fill="#e2e8f0" stroke="#3b82f6" strokeWidth="2" />
                        {!silentMode && (
                          <text x="430" y="338" fill="#cbd5e1" fontSize="8" textAnchor="end">
                            Ga Hà Nội
                          </text>
                        )}
                      </g>
                    </g>
                  )}
                </svg>
              </div>

              {/* Bottom Interactive Legend / Status */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-[#D5CBB9] dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Click vào bất kỳ sông, cầu, vành đai hoặc landmark để xem chi tiết & mẹo định vị</span>
                </div>
                <div className="text-amber-600 dark:text-amber-300 font-medium">
                  Góc phương vị mặt trời hiện tại: <strong>{currentSunAzimuth}°</strong> · Hướng bóng đổ: <strong>{currentShadowBearing}°</strong>
                </div>
              </div>
            </div>

            {/* Entity Detail Drawer / Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              {selectedEntity ? (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 animate-fadeIn">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {selectedEntity.type} · {selectedEntity.category}
                      </span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                        {selectedEntity.name}
                      </h3>
                      {selectedEntity.alias && (
                        <p className="text-xs text-slate-500 italic">{selectedEntity.alias}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedEntity(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Quận / Địa phận:</span>
                      <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">{selectedEntity.district}</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">Mô tả đặc trưng:</span>
                      <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">
                        {selectedEntity.description}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-xs">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Mẹo Tư Duy Định Vị Khi Đi Đường:</span>
                      </div>
                      <p className="text-xs text-amber-900/90 dark:text-amber-200/90 mt-1.5 leading-relaxed">
                        {selectedEntity.cognitiveTip}
                      </p>
                    </div>

                    {selectedEntity.isOneWay && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                        <div>
                          <strong>Lưu ý đường một chiều:</strong> {selectedEntity.oneWayDirection || 'Chỉ lưu thông theo chiều quy định.'}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleLaunchExercise()}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Target className="w-4 h-4" />
                    <span>Luyện Tập Ngay Thực Thể Này</span>
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <Info className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">
                    Chạm Để Khám Phá
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Click vào bất kỳ điểm cầu, tuyến vành đai, trục hướng tâm hay landmark trên bản đồ để mở khóa hồ sơ chi tiết và mẹo tư duy không gian.
                  </p>
                </div>
              )}

              {/* 5 Game Modes Fast Launcher Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-indigo-500/20 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-amber-400" />
                  <h4 className="font-black text-sm tracking-wide uppercase text-amber-300">
                    5 Chế Độ Luyện Tập
                  </h4>
                </div>
                <div className="space-y-2 text-xs">
                  <button
                    onClick={() => handleLaunchExercise()}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-between"
                  >
                    <span><strong>1. Khung Xương:</strong> Vành đai & Cầu</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                  <button
                    onClick={() => handleLaunchExercise()}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-between"
                  >
                    <span><strong>2. Lưới Phố Pháp:</strong> Song song // & Vuông góc ⟂</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                  <button
                    onClick={() => handleLaunchExercise()}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-between"
                  >
                    <span><strong>3. La Bàn Mặt Trời:</strong> Hướng nắng theo giờ</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                  <button
                    onClick={() => handleLaunchExercise()}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-between"
                  >
                    <span><strong>4. Thả Dù Mù:</strong> Dẫn đường né 1 chiều</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                  <button
                    onClick={() => handleLaunchExercise()}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-between"
                  >
                    <span><strong>5. Radar La Bàn 360°:</strong> Góc & Cự ly km</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: COMPREHENSIVE 5-CHAPTER THEORY CORPUS (NO TOKEN LIMIT)
          ========================================================================= */}
      {activeMainTab === 'theory_chapters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chapter Selector Navigation */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Danh Mục 10 Chương Giáo Trình Thực Chiến
            </div>
            {HANOI_THEORY_CHAPTERS.map((chap, idx) => {
              const isSelected = activeChapterIndex === idx;
              return (
                <button
                  key={chap.id}
                  onClick={() => setActiveChapterIndex(idx)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border flex flex-col gap-1.5 ${isSelected
                      ? 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/40 text-amber-950 dark:text-amber-200 shadow-md scale-[1.01]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Chương {chap.chapterNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {chap.readTimeMin} phút
                    </span>
                  </div>
                  <h4 className="font-bold text-sm leading-snug">
                    {chap.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {chap.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Chapter Reader Container */}
          <div className="lg:col-span-8 p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            {(() => {
              const chapter = HANOI_THEORY_CHAPTERS[activeChapterIndex];
              return (
                <article className="space-y-6">
                  {/* Header */}
                  <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {chapter.badge}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                      {chapter.title}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                      {chapter.subtitle}
                    </p>
                  </div>

                  {/* Neural Pill Banner */}
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3">
                    <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                      <strong>Cơ chế thần kinh não bộ:</strong> {chapter.cognitiveMechanism}
                    </div>
                  </div>

                  {/* Key Takeaways Box */}
                  <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 space-y-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Ý Chính Cốt Lõi Cần Nhớ:</span>
                    </h4>
                    <ul className="space-y-1.5">
                      {chapter.keyTakeaways.map((point, pIdx) => (
                        <li key={pIdx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Markdown-rendered Body */}
                  <div className="pt-2 pb-4">
                    <HanoiMarkdownContent content={chapter.contentMarkdown} />
                  </div>

                  {/* Chapter Navigation Footer */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <button
                      disabled={activeChapterIndex === 0}
                      onClick={() => setActiveChapterIndex(prev => Math.max(0, prev - 1))}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                    >
                      ← Chương Trước
                    </button>
                    <span className="text-xs text-slate-500">
                      Chương {activeChapterIndex + 1} / {HANOI_THEORY_CHAPTERS.length}
                    </span>
                    <button
                      disabled={activeChapterIndex === HANOI_THEORY_CHAPTERS.length - 1}
                      onClick={() => setActiveChapterIndex(prev => Math.min(HANOI_THEORY_CHAPTERS.length - 1, prev + 1))}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 font-bold disabled:opacity-40"
                    >
                      Chương Tiếp Theo →
                    </button>
                  </div>
                </article>
              );
            })()}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: KNOWLEDGE QUIZ (KIỂM TRA NHẬN THỨC BẢN ĐỒ)
          ========================================================================= */}
      {activeMainTab === 'quick_quiz' && (
        <div className="max-w-3xl mx-auto p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
          {!quizFinished ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Câu hỏi {quizStep + 1} / {QUIZ_QUESTIONS.length}
                </span>
                <span>Điểm hiện tại: {quizScore}</span>
              </div>

              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${((quizStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                {QUIZ_QUESTIONS[quizStep].question}
              </h3>

              <div className="space-y-3">
                {QUIZ_QUESTIONS[quizStep].options.map((opt, oIdx) => {
                  const isSelected = selectedQuizOption === oIdx;
                  const isCorrect = oIdx === QUIZ_QUESTIONS[quizStep].correctIndex;
                  const showResult = selectedQuizOption !== null;

                  let optClass = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-400';
                  if (showResult) {
                    if (isCorrect) {
                      optClass = 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                    } else if (isSelected) {
                      optClass = 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300 font-bold';
                    } else {
                      optClass = 'opacity-50 border-slate-200 dark:border-slate-800';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={showResult}
                      onClick={() => handleSelectQuizOption(oIdx)}
                      className={`w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-center justify-between gap-3 ${optClass}`}
                    >
                      <span>{opt}</span>
                      {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {selectedQuizOption !== null && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 leading-relaxed animate-fadeIn">
                  <strong>Giải thích sư phạm:</strong> {QUIZ_QUESTIONS[quizStep].explanation}
                </div>
              )}

              {selectedQuizOption !== null && (
                <button
                  onClick={handleNextQuiz}
                  className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <span>{quizStep + 1 === QUIZ_QUESTIONS.length ? 'Hoàn Tất Kiểm Tra' : 'Câu Tiếp Theo'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-6 animate-fadeIn">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border-2 border-amber-400">
                <Trophy className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Hoàn Thành Bài Kiểm Tra Nhận Thức!
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Bạn đã đạt <strong>{quizScore} / {QUIZ_QUESTIONS.length}</strong> điểm. Đã mở khóa chứng chỉ lý thuyết Bản đồ Hà Nội.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <button
                  onClick={() => {
                    setQuizStep(0);
                    setSelectedQuizOption(null);
                    setQuizScore(0);
                    setQuizFinished(false);
                  }}
                  className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm"
                >
                  Làm Lại Quiz
                </button>
                <button
                  onClick={() => handleLaunchExercise()}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Vào Chơi Bài Tập Ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
