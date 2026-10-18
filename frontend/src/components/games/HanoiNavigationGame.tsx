import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';
import { PersonalAnchorsModal } from './PersonalAnchorsModal';
import { 
  EXERCISES_METADATA, 
  HANOI_COGNITIVE_GRAPH,
  PracticalGameMode,
  IHanoiQuestion,
  IPersonalAnchor,
  bearingToCardinalName
} from '@brain-exercises/shared';
import { generatePracticalHanoiQuestion } from '../../services/hanoiQuestionGenerator';
import { 
  Compass, 
  Sun, 
  RotateCw, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Navigation, 
  Clock, 
  Flame, 
  HelpCircle,
  MapPin,
  Trophy,
  BookOpen,
  Route,
  Layers,
  Bike,
  ShieldAlert,
  Home,
  Briefcase
} from 'lucide-react';

export type HanoiCurriculumType = 'practical' | 'classic_lynch';

export type ClassicGameMode = 
  | 'skeleton'           // Mode 1: Khung xương & Vành đai
  | 'grid_topology'      // Mode 2: Phản xạ quan hệ // & ⟂
  | 'sun_triangulation'  // Mode 3: Định vị điểm neo & Hướng mặt trời
  | 'blind_drop'         // Mode 4: Thả dù mù & Dẫn đường trong đầu
  | 'mental_compass';    // Mode 5: Radar la bàn 360°

interface IActiveQuestion {
  id: string;
  category: HanoiCurriculumType;
  modeCode: string;
  title: string;
  prompt: string;
  subPrompt?: string;
  contextInfo?: {
    sunHour?: number;
    sunAzimuth?: number;
    shadowBearing?: number;
    baseStreet?: string;
    targetStreet?: string;
    centerLandmark?: string;
    targetLandmark?: string;
    corridorName?: string;
    intersectionName?: string;
    district?: string;
    vehicleType?: 'motorbike' | 'car';
    knownLandmark?: string;
  };
  options: Array<{
    id: string;
    label: string;
    subLabel?: string;
    isCorrect: boolean;
    explanation: string;
  }>;
  hint?: string;
  cognitiveLesson?: string;
}

export const HanoiNavigationGame: React.FC = () => {
  const { 
    getExerciseLevel, 
    setExerciseLevel, 
    playSound, 
    autoDifficulty,
    enableHints,
    setActiveGameSlug,
    navigateToTheory,
    personalAnchors,
    isPersonalAnchorsOpen,
    setIsPersonalAnchorsOpen
  } = useAppStore();

  const currentLevel = getExerciseLevel('hanoi-navigation') || 1;
  const { trackWrongAnswer } = useWrongAnswerTracker('hanoi-navigation');

  const exerciseMeta = useMemo(() => 
    EXERCISES_METADATA.find(e => e.slug === 'hanoi-navigation'),
  []);

  const levelConfig = useMemo(() => {
    return exerciseMeta?.levelConfigs.find(c => c.level === currentLevel) || exerciseMeta?.levelConfigs[0];
  }, [exerciseMeta, currentLevel]);

  // Curriculum switch: Practical vs Classic Lynch
  const [curriculum, setCurriculum] = useState<HanoiCurriculumType>('practical');
  const [activePracticalMode, setActivePracticalMode] = useState<PracticalGameMode>('corridor_chain');
  const [activeClassicMode, setActiveClassicMode] = useState<ClassicGameMode>('skeleton');
  const [selectedAnchorForDrill, setSelectedAnchorForDrill] = useState<IPersonalAnchor | null>(null);

  // Automatically adapt practical mode from difficulty level if user hasn't overridden
  useEffect(() => {
    if (selectedAnchorForDrill) {
      setActivePracticalMode('personal_anchor_drill');
      return;
    }
    if (currentLevel <= 2) setActivePracticalMode('corridor_chain');
    else if (currentLevel <= 4) setActivePracticalMode('cross_street_order');
    else if (currentLevel <= 6) setActivePracticalMode('which_intersection');
    else if (currentLevel <= 7) setActivePracticalMode('superblock_cell');
    else if (currentLevel <= 8) setActivePracticalMode('address_decoder');
    else if (currentLevel <= 10) setActivePracticalMode('route_planner_ab');
    else if (currentLevel <= 11) setActivePracticalMode('oneway_turn_trap');
    else if (currentLevel <= 12) setActivePracticalMode('gps_loss_recovery');
    else {
      // Infinity tiers cycle through all practical modes
      const modes: PracticalGameMode[] = [
        'corridor_chain', 'cross_street_order', 'which_intersection',
        'superblock_cell', 'address_decoder', 'route_planner_ab',
        'oneway_turn_trap', 'personal_anchor_drill', 'gps_loss_recovery'
      ];
      setActivePracticalMode(modes[(currentLevel - 13) % modes.length]);
    }
  }, [currentLevel, selectedAnchorForDrill]);

  // Map angle
  const baseMapRotation = useMemo(() => {
    if (currentLevel >= 15) return 135;
    if (currentLevel >= 8) return 180;
    if (currentLevel >= 6) return 90;
    return 0;
  }, [currentLevel]);

  // Game session states
  const [totalQuestions] = useState(6);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [silentMap, setSilentMap] = useState(false);
  const [mapRotation, setMapRotation] = useState<number>(baseMapRotation);
  const [showHint, setShowHint] = useState(false);

  // Timer states
  const initialTimeLimit = levelConfig?.timeLimitSec || 60;
  const [timeLeft, setTimeLeft] = useState<number>(initialTimeLimit);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Generate Questions dynamically based on Curriculum & Mode
  const [questions, setQuestions] = useState<IActiveQuestion[]>([]);

  const regenerateQuestions = useCallback(() => {
    const list: IActiveQuestion[] = [];

    for (let i = 0; i < 6; i++) {
      if (curriculum === 'practical') {
        const pQ = generatePracticalHanoiQuestion(activePracticalMode, currentLevel, personalAnchors);
        list.push({
          id: `${pQ.id}-${i}`,
          category: 'practical',
          modeCode: pQ.mode,
          title: pQ.title,
          prompt: pQ.prompt,
          subPrompt: pQ.subPrompt,
          contextInfo: {
            corridorName: pQ.contextClues?.corridorName,
            intersectionName: pQ.contextClues?.intersectionName,
            district: pQ.contextClues?.district,
            vehicleType: pQ.contextClues?.vehicleType,
            knownLandmark: pQ.contextClues?.knownLandmark
          },
          options: pQ.options.map(opt => ({
            id: opt.id,
            label: opt.text,
            subLabel: opt.subText,
            isCorrect: opt.isCorrect,
            explanation: opt.explanation
          })),
          hint: pQ.hint,
          cognitiveLesson: pQ.cognitiveLesson
        });
      } else {
        // Classic Kevin Lynch Questions
        if (i % 2 === 0) {
          list.push({
            id: `classic-bridge-${i}`,
            category: 'classic_lynch',
            modeCode: 'skeleton',
            title: 'Khung Xương: Chuỗi Cầu Sông Hồng',
            prompt: 'Chuỗi Cầu Sông Hồng: Cây cầu nào nằm ngay phía BẮC của Cầu Long Biên?',
            subPrompt: 'Theo thứ tự dòng chảy từ Tây Bắc xuống Đông Nam',
            options: [
              {
                id: 'opt-tl',
                label: 'Cầu Thăng Long',
                subLabel: 'Cầu 2 tầng giàn thép (1985)',
                isCorrect: true,
                explanation: 'Đúng! Thứ tự từ Bắc xuống Nam: Nhật Tân → Thăng Long → Long Biên → Chương Dương → Vĩnh Tuy → Thanh Trì.'
              },
              {
                id: 'opt-cd',
                label: 'Cầu Chương Dương',
                subLabel: 'Cầu thép huyết mạch nối Hoàn Kiếm',
                isCorrect: false,
                explanation: 'Sai! Cầu Chương Dương nằm ở phía NAM của cầu Long Biên.'
              },
              {
                id: 'opt-vt',
                label: 'Cầu Vĩnh Tuy',
                subLabel: 'Cầu 8 làn xe Vành đai 2',
                isCorrect: false,
                explanation: 'Sai! Cầu Vĩnh Tuy nằm xa hơn về phía Đông Nam.'
              },
              {
                id: 'opt-tt',
                label: 'Cầu Thanh Trì',
                subLabel: 'Cầu bê tông Vành đai 3',
                isCorrect: false,
                explanation: 'Sai! Cầu Thanh Trì là cầu cực Nam trong hệ thống cầu chính.'
              }
            ],
            hint: 'Chuỗi cầu: Nhật Tân → Thăng Long → Long Biên → Chương Dương...',
            cognitiveLesson: '6 cây cầu sông Hồng là các cửa khẩu bắt buộc để kết nối hai bờ Tây - Đông của Thủ đô.'
          });
        } else {
          list.push({
            id: `classic-ring-${i}`,
            category: 'classic_lynch',
            modeCode: 'skeleton',
            title: 'Khung Xương: Vành Đai Đô Thị',
            prompt: 'Đoạn đường nào sau đây thuộc tuyến VÀNH ĐAI 1 của Hà Nội?',
            subPrompt: 'Tuyến vành đai ôm sát lõi lịch sử và các cửa ô',
            options: [
              {
                id: 'opt-tc',
                label: 'Đại Cồ Việt - Xã Đàn',
                subLabel: 'Đi qua Hầm Kim Liên và Ô Chợ Dừa',
                isCorrect: true,
                explanation: 'Chính xác! Vành đai 1 gồm: Trần Khát Chân → Đại Cồ Việt → Xã Đàn → Ô Chợ Dừa → Hoàng Cầu → Yên Lãng.'
              },
              {
                id: 'opt-trc',
                label: 'Trường Chinh - Minh Khai',
                subLabel: 'Tuyến có đường trên cao 80km/h',
                isCorrect: false,
                explanation: 'Sai! Trường Chinh và Minh Khai thuộc VÀNH ĐAI 2.'
              },
              {
                id: 'opt-ph',
                label: 'Phạm Hùng - Khuất Duy Tiến',
                subLabel: 'Cao tốc đô thị CT.20',
                isCorrect: false,
                explanation: 'Sai! Phạm Hùng và Khuất Duy Tiến thuộc VÀNH ĐAI 3.'
              },
              {
                id: 'opt-nt',
                label: 'Nguyễn Trãi - Tây Sơn',
                subLabel: 'Trục hướng tâm Tây Nam',
                isCorrect: false,
                explanation: 'Sai! Đây là trục xuyên tâm hướng tâm, không phải đường vành đai.'
              }
            ],
            hint: 'Vành đai 1 đi qua Ô Chợ Dừa và Hầm Kim Liên.',
            cognitiveLesson: 'Vành đai 1 là ranh giới bao quanh lõi 4 quận nội thành cũ.'
          });
        }
      }
    }

    setQuestions(list);
    setCurrentQuestionIndex(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
  }, [curriculum, activePracticalMode, currentLevel, personalAnchors]);

  // Initial generation and whenever mode changes
  useEffect(() => {
    regenerateQuestions();
  }, [regenerateQuestions]);

  const currentQuestion = questions[currentQuestionIndex] || questions[0];

  // Game timer countdown
  useEffect(() => {
    if (isGameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameOver]);

  // Answer handler
  const handleSelectOption = (option: IActiveQuestion['options'][0]) => {
    if (isAnswerSubmitted || !currentQuestion) return;

    setSelectedOptionId(option.id);
    setIsAnswerSubmitted(true);

    const isCorrect = option.isCorrect;
    const responseTimeMs = Date.now() - questionStartTimeRef.current;

    if (isCorrect) {
      playSound('correct');
      const pointEarned = Math.round(100 + streak * 20 + Math.max(0, timeLeft * 2));
      setScore(prev => prev + pointEarned);
      setStreak(prev => {
        const next = prev + 1;
        if (next > bestStreak) setBestStreak(next);
        return next;
      });
      setCorrectAnswersCount(prev => prev + 1);
    } else {
      playSound('wrong');
      setStreak(0);

      // Track wrong answer into SRS system
      const correctOpt = currentQuestion.options.find(o => o.isCorrect);
      if (correctOpt) {
        trackWrongAnswer({
          difficultyLevel: currentLevel,
          round: currentQuestionIndex + 1,
          questionContext: {
            hanoiMode: currentQuestion.modeCode,
            district: currentQuestion.contextInfo?.district,
            corridorName: currentQuestion.contextInfo?.corridorName,
            intersectionName: currentQuestion.contextInfo?.intersectionName,
            vehicleType: currentQuestion.contextInfo?.vehicleType
          },
          correctAnswer: {
            code: correctOpt.id,
            label: correctOpt.label,
            explanationVi: correctOpt.explanation
          },
          userAnswer: {
            code: option.id,
            label: option.label,
            explanationVi: option.explanation
          },
          responseTimeMs,
          sessionId: `hanoi-${startTimeRef.current}`
        });
      }
    }
  };

  // Move to next question or finish game
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
      questionStartTimeRef.current = Date.now();
    } else {
      setIsGameOver(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setCorrectAnswersCount(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setIsGameOver(false);
    setTimeLeft(initialTimeLimit);
    setShowHint(false);
    startTimeRef.current = Date.now();
    questionStartTimeRef.current = Date.now();
    regenerateQuestions();
  };

  const accuracyRate = totalQuestions > 0 
    ? Math.round((correctAnswersCount / totalQuestions) * 100) 
    : 0;

  if (!currentQuestion) return null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-4 animate-fadeIn">
      
      {/* Curriculum Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurriculum('practical');
              setSelectedAnchorForDrill(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              curriculum === 'practical'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Route className="w-4 h-4" />
            <span>Thực Chiến Định Vị & Lập Tuyến (Khuyên dùng)</span>
          </button>

          <button
            onClick={() => setCurriculum('classic_lynch')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              curriculum === 'classic_lynch'
                ? 'bg-cyan-500 text-slate-950 shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Khung Kevin Lynch (5 Khối)</span>
          </button>
        </div>

        {/* Personal Anchors Quick Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPersonalAnchorsOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Home className="w-3.5 h-3.5 text-amber-400" />
            <span>Đích Cá Nhân</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 text-[10px]">
              {personalAnchors.length}
            </span>
          </button>

          {/* Theory button */}
          <button
            onClick={() => {
              setActiveGameSlug(null);
              navigateToTheory('hanoi-map');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Mở giáo trình lý thuyết Bản đồ Hà Nội"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Lý Thuyết</span>
          </button>
        </div>
      </div>

      {/* Practical Mode Sub-tabs (Modes A to I) */}
      {curriculum === 'practical' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          {[
            { id: 'corridor_chain', name: 'A. Chuỗi Trục' },
            { id: 'cross_street_order', name: 'B. Thứ Tự Cắt' },
            { id: 'which_intersection', name: 'C. Ở Ngã Tư Nào' },
            { id: 'superblock_cell', name: 'D. Ô Phố & Thoát' },
            { id: 'address_decoder', name: 'E. Đọc Địa Chỉ' },
            { id: 'route_planner_ab', name: 'F. Lập Tuyến A➔B' },
            { id: 'oneway_turn_trap', name: 'G. Bẫy 1 Chiều' },
            { id: 'personal_anchor_drill', name: 'H. Đích Của Tôi' },
            { id: 'gps_loss_recovery', name: 'I. Mất GPS' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => {
                setActivePracticalMode(m.id as PracticalGameMode);
                setSelectedAnchorForDrill(null);
              }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-all cursor-pointer ${
                activePracticalMode === m.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {/* Top Status Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Left: Mode Badge & Level */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
            {currentLevel}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {currentQuestion.title}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold">
                Cấp {currentLevel}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Câu {currentQuestionIndex + 1} / {questions.length}</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-500 flex items-center gap-1">
                <Bike className="w-3.5 h-3.5" />
                Ưu tiên xe máy & ngõ thông
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span>{streak} streak</span>
          </div>
          <div className="text-sm font-black text-slate-800 dark:text-slate-100">
            {score} XP
          </div>
        </div>

        {/* Right: Map Controls & Timer */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSilentMap(prev => !prev)}
            className={`p-2 rounded-xl text-xs font-semibold transition-all ${
              silentMap ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
            title="Bật/Tắt nhãn bản đồ câm"
          >
            {silentMap ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMapRotation(prev => (prev + 90) % 360)}
            className="p-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1"
            title="Xoay bản đồ"
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-[10px] font-mono">{mapRotation}°</span>
          </button>

          {/* Timer Display */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-black border ${
            timeLeft <= 10 
              ? 'bg-rose-500/15 text-rose-600 border-rose-500/30 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Play Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Interactive Vector Map & Context Display */}
        <div className="lg:col-span-5 bg-slate-950 rounded-3xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[380px]">
          
          {/* Context Badge on top of map */}
          <div className="flex items-center justify-between text-xs bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 mb-2 z-10">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Compass className="w-4 h-4" />
              <span>Bản Đồ 12 Quận Hà Nội</span>
            </div>
            <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {currentQuestion.contextInfo?.district || 'Hà Nội'}
            </div>
          </div>

          {/* SVG Vector Map Rendering */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <svg
              viewBox="0 0 500 450"
              className="w-full h-full max-h-[330px] transition-transform duration-500"
              style={{ transform: `rotate(${mapRotation}deg)` }}
            >
              {/* Sông Hồng */}
              <path
                d="M 50,0 C 130,70 240,110 320,180 C 390,240 450,330 500,450 L 500,430 C 440,310 380,220 310,160 C 230,90 120,50 60,0 Z"
                fill="#ef4444"
                opacity="0.75"
              />
              {!silentMap && (
                <text x="350" y="240" fill="#fecaca" fontSize="9" fontWeight="bold">
                  Sông Hồng
                </text>
              )}

              {/* Sông Tô Lịch */}
              <path
                d="M 210,140 C 215,190 230,240 220,300 C 210,360 250,420 280,450"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                opacity="0.8"
              />
              {!silentMap && (
                <text x="180" y="320" fill="#67e8f9" fontSize="8" fontWeight="bold">
                  Sông Tô Lịch
                </text>
              )}

              {/* Hồ Tây */}
              <ellipse cx="230" cy="110" rx="45" ry="35" fill="#0284c7" opacity="0.8" />
              {!silentMap && (
                <text x="230" y="114" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Hồ Tây
                </text>
              )}

              {/* Hồ Gươm (Km0) */}
              <ellipse cx="320" cy="210" rx="12" ry="18" fill="#10b981" stroke="#34d399" strokeWidth="2" />
              {!silentMap && (
                <text x="320" y="214" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                  Hồ Gươm
                </text>
              )}

              {/* Vành đai 1 */}
              <ellipse cx="290" cy="230" rx="75" ry="65" fill="none" stroke="#eab308" strokeWidth="2.5" strokeDasharray="4 2" />

              {/* Vành đai 2 */}
              <ellipse cx="270" cy="220" rx="120" ry="110" fill="none" stroke="#06b6d4" strokeWidth="2.5" />

              {/* Vành đai 3 */}
              <ellipse cx="240" cy="230" rx="180" ry="165" fill="none" stroke="#a855f7" strokeWidth="3" />

              {/* Trục Tây Nam (Hà Đông) */}
              <line x1="290" y1="230" x2="100" y2="400" stroke="#f97316" strokeWidth="3.5" />
              {!silentMap && (
                <text x="110" y="380" fill="#fdba74" fontSize="8" fontWeight="bold">
                  Trục Quang Trung - Nguyễn Trãi
                </text>
              )}

              {/* Trục Cầu Giấy - QL32 */}
              <line x1="270" y1="180" x2="40" y2="180" stroke="#10b981" strokeWidth="3.5" />
              {!silentMap && (
                <text x="50" y="170" fill="#6ee7b7" fontSize="8" fontWeight="bold">
                  Trục Cầu Giấy - QL32 (Bắc Từ Liêm)
                </text>
              )}

              {/* Trục Giảng Võ - Tố Hữu */}
              <line x1="280" y1="210" x2="80" y2="350" stroke="#3b82f6" strokeWidth="3" />

              {/* Trục Long Biên vượt cầu Chương Dương */}
              <line x1="330" y1="200" x2="460" y2="120" stroke="#ec4899" strokeWidth="3.5" />
              {!silentMap && (
                <text x="400" y="130" fill="#f472b6" fontSize="8" fontWeight="bold">
                  Long Biên (Nguyễn Văn Cừ)
                </text>
              )}

              {/* Nút giao trọng điểm (Nodes) */}
              <circle cx="210" cy="270" r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" /> {/* Ngã Tư Sở */}
              <circle cx="150" cy="330" r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" /> {/* Thanh Xuân VĐ3 */}
              <circle cx="100" cy="390" r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" /> {/* Cầu Trắng Hà Đông */}
              <circle cx="150" cy="180" r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" /> {/* Mai Dịch */}
              <circle cx="260" cy="275" r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" /> {/* Ngã Tư Vọng */}
              <circle cx="270" cy="400" r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" /> {/* Pháp Vân Nước Ngầm */}
            </svg>
          </div>

          {/* Compass & Rotation Info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Góc xoay: <strong>{mapRotation}°</strong></span>
            </span>
            <span className="text-slate-500">
              {mapRotation === 0 ? 'Bắc ở TRÊN' : `Bắc lệch ${mapRotation}°`}
            </span>
          </div>
        </div>

        {/* Right Column: Question Content & Options */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Header info & Hint */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {currentQuestion.title}
                </span>
                {enableHints && currentQuestion.hint && (
                  <button
                    onClick={() => setShowHint(prev => !prev)}
                    className="text-xs text-slate-400 hover:text-amber-500 flex items-center gap-1 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showHint ? 'Ẩn gợi ý' : 'Gợi ý'}</span>
                  </button>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                {currentQuestion.prompt}
              </h2>

              {currentQuestion.subPrompt && (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  {currentQuestion.subPrompt}
                </p>
              )}

              {showHint && currentQuestion.hint && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
                  💡 <strong>Gợi ý:</strong> {currentQuestion.hint}
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                const isCorrect = option.isCorrect;

                let btnStyle = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-amber-400 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200';

                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300 font-bold shadow-sm';
                  } else {
                    btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
                  }
                }

                return (
                  <button
                    key={option.id}
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer btn-press ${btnStyle}`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold leading-snug">
                        {option.label}
                      </div>
                      {option.subLabel && (
                        <div className="text-xs opacity-75">
                          {option.subLabel}
                        </div>
                      )}
                    </div>

                    {isAnswerSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation box on submit with cognitiveLesson */}
            {isAnswerSubmitted && (
              <div className="space-y-2 animate-fadeIn">
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-amber-500">Giải thích:</strong>{' '}
                  {currentQuestion.options.find(o => o.id === selectedOptionId)?.explanation || 
                   currentQuestion.options.find(o => o.isCorrect)?.explanation}
                </div>

                {currentQuestion.cognitiveLesson && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Tư duy đi đường thực tế:</strong> {currentQuestion.cognitiveLesson}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button: Next Question */}
          {isAnswerSubmitted && (
            <button
              onClick={handleNextQuestion}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>{currentQuestionIndex + 1 === questions.length ? 'Xem Kết Quả Lượt Chơi' : 'Câu Tiếp Theo'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Game Result Modal */}
      {isGameOver && (
        <GameResultModal
          score={score}
          accuracyRate={accuracyRate}
          timeSpentSec={initialTimeLimit - timeLeft}
          onRestart={handleRestart}
          onClose={() => setActiveGameSlug(null)}
        />
      )}

      {/* Personal Anchors Management Modal */}
      <PersonalAnchorsModal
        isOpen={isPersonalAnchorsOpen}
        onClose={() => setIsPersonalAnchorsOpen(false)}
        onSelectAnchorForDrill={(anchor) => {
          setSelectedAnchorForDrill(anchor);
          setCurriculum('practical');
          setActivePracticalMode('personal_anchor_drill');
          handleRestart();
        }}
      />
    </div>
  );
};
