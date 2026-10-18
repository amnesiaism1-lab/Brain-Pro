import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';
import { 
  EXERCISES_METADATA, 
  ALL_HANOI_ENTITIES, 
  HANOI_WATER_EDGES, 
  HANOI_BRIDGES, 
  HANOI_BRIDGES_NORTH_TO_SOUTH,
  HANOI_RING_ROADS, 
  HANOI_RING_1_SEQUENCE,
  HANOI_RING_2_SEQUENCE,
  HANOI_RING_3_SEQUENCE,
  HANOI_RADIAL_CORRIDORS, 
  HANOI_FRENCH_GRID_STREETS, 
  HANOI_LANDMARKS, 
  HANOI_JUNCTIONS,
  HANOI_RELATIONS,
  getHanoiSolarAzimuth,
  getHanoiShadowBearing,
  bearingToCardinalName,
  IHanoiEntity
} from '@brain-exercises/shared';
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
  ShieldAlert, 
  Clock, 
  Flame, 
  HelpCircle,
  Maximize2,
  Layers,
  MapPin,
  Trophy,
  Zap,
  BookOpen
} from 'lucide-react';

export type HanoiGameMode = 
  | 'skeleton'           // Mode 1: Khung xương & Vành đai
  | 'grid_topology'      // Mode 2: Phản xạ quan hệ // & ⟂
  | 'sun_triangulation'  // Mode 3: Định vị điểm neo & Hướng mặt trời
  | 'blind_drop'         // Mode 4: Thả dù mù & Dẫn đường trong đầu
  | 'mental_compass';    // Mode 5: Radar la bàn 360°

interface IGameQuestion {
  id: string;
  mode: HanoiGameMode;
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
    clueA?: string;
    clueB?: string;
    rotationDeg?: number;
  };
  options: Array<{
    id: string;
    label: string;
    subLabel?: string;
    isCorrect: boolean;
    explanation: string;
  }>;
  hint?: string;
}

export const HanoiNavigationGame: React.FC = () => {
  const { 
    getExerciseLevel, 
    setExerciseLevel, 
    playSound, 
    autoDifficulty,
    enableHints,
    setActiveGameSlug,
    navigateToTheory
  } = useAppStore();

  const currentLevel = getExerciseLevel('hanoi-navigation') || 1;
  const { trackWrongAnswer } = useWrongAnswerTracker('hanoi-navigation');

  const exerciseMeta = useMemo(() => 
    EXERCISES_METADATA.find(e => e.slug === 'hanoi-navigation'),
  []);

  const levelConfig = useMemo(() => {
    return exerciseMeta?.levelConfigs.find(c => c.level === currentLevel) || exerciseMeta?.levelConfigs[0];
  }, [exerciseMeta, currentLevel]);

  // Determine game mode from level parameters or cycle
  const activeMode: HanoiGameMode = useMemo(() => {
    const params = levelConfig?.parametersJson as Record<string, any> | undefined;
    if (params?.mode) return params.mode as HanoiGameMode;
    if (currentLevel <= 4) return 'skeleton';
    if (currentLevel <= 8) return 'grid_topology';
    if (currentLevel <= 10) return 'sun_triangulation';
    if (currentLevel <= 12) return 'blind_drop';
    // Infinity levels cycle through modes
    const modes: HanoiGameMode[] = ['skeleton', 'grid_topology', 'sun_triangulation', 'blind_drop', 'mental_compass'];
    return modes[(currentLevel - 13) % modes.length];
  }, [levelConfig, currentLevel]);

  // Rotated map angle based on difficulty
  const baseMapRotation = useMemo(() => {
    const params = levelConfig?.parametersJson as Record<string, any> | undefined;
    if (params?.rotateAngle !== undefined) return params.rotateAngle;
    if (params?.rotateDeg !== undefined) return params.rotateDeg;
    if (currentLevel >= 15) return 135;
    if (currentLevel >= 8) return 180;
    if (currentLevel >= 6) return 90;
    return 0; // North-up for beginners
  }, [levelConfig, currentLevel]);

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
  const initialTimeLimit = levelConfig?.timeLimitSec || 50;
  const [timeLeft, setTimeLeft] = useState<number>(initialTimeLimit);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Procedural Questions Generator
  const questions: IGameQuestion[] = useMemo(() => {
    const list: IGameQuestion[] = [];

    // Helper to shuffle
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    for (let i = 0; i < 6; i++) {
      if (activeMode === 'skeleton') {
        if (i % 2 === 0) {
          // Question about Bridge Sequence
          const bridgeNames = ['Nhật Tân', 'Thăng Long', 'Long Biên', 'Chương Dương', 'Vĩnh Tuy', 'Thanh Trì'];
          list.push({
            id: `q-bridge-${i}`,
            mode: 'skeleton',
            prompt: 'Chuỗi Cầu Sông Hồng: Cây cầu nào nằm ngay phía BẮC của Cầu Long Biên?',
            subPrompt: 'Theo thứ tự dòng chảy sông Hồng từ Tây Bắc xuống Đông Nam',
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
            hint: 'Chuỗi cầu: Nhật Tân → Thăng Long → Long Biên → Chương Dương...'
          });
        } else {
          // Question about Ring Roads
          list.push({
            id: `q-ring-${i}`,
            mode: 'skeleton',
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
            hint: 'Vành đai 1 đi qua Ô Chợ Dừa và Hầm Kim Liên.'
          });
        }
      } else if (activeMode === 'grid_topology') {
        if (i % 2 === 0) {
          // Parallel vs Perpendicular French Grid
          list.push({
            id: `q-grid-perp-${i}`,
            mode: 'grid_topology',
            prompt: 'Đại lộ TRẦN HƯNG ĐẠO có quan hệ hình học nào với đường BÀ TRIỆU?',
            subPrompt: 'Xét trong mạng lưới ô bàn cờ chuẩn mực quận Hoàn Kiếm',
            contextInfo: { baseStreet: 'Trần Hưng Đạo', targetStreet: 'Bà Triệu' },
            options: [
              {
                id: 'opt-perp',
                label: 'Vuông góc (⟂)',
                subLabel: 'Trục Đông-Tây cắt trục Bắc-Nam',
                isCorrect: true,
                explanation: 'Chính xác! Trần Hưng Đạo chạy hướng Đông-Tây, còn Bà Triệu chạy hướng Bắc-Nam nên cắt vuông góc 90°.'
              },
              {
                id: 'opt-par',
                label: 'Song song (//)',
                subLabel: 'Cùng phương vị',
                isCorrect: false,
                explanation: 'Sai! Trần Hưng Đạo song song với Lý Thường Kiệt và Hai Bà Trưng, không song song với Bà Triệu.'
              },
              {
                id: 'opt-collinear',
                label: 'Nối tiếp đổi tên (→)',
                subLabel: 'Cùng một trục thẳng',
                isCorrect: false,
                explanation: 'Sai! Hai đường này cắt nhau tại ngã tư vuông vức.'
              },
              {
                id: 'opt-none',
                label: 'Không cắt nhau',
                subLabel: 'Nằm ở hai khu vực khác nhau',
                isCorrect: false,
                explanation: 'Sai! Hai đường giao nhau tại ngã tư Trần Hưng Đạo - Bà Triệu.'
              }
            ],
            hint: 'Trần Hưng Đạo chạy ngang (Đông-Tây), Bà Triệu chạy dọc (Nam-Bắc).'
          });
        } else {
          // One-way pair question
          list.push({
            id: `q-grid-oneway-${i}`,
            mode: 'grid_topology',
            prompt: 'Bạn đang ở bờ Nam Hồ Gươm và muốn đi xe máy xuống ngã tư ĐẠI CỒ VIỆT. Đường nào sau đây ĐÚNG CHIỀU lưu thông?',
            subPrompt: 'Cặp đường một chiều đối xứng kinh điển tại Hà Nội',
            options: [
              {
                id: 'opt-phoe-hue',
                label: 'Đi PHỐ HUẾ',
                subLabel: '1 chiều hướng Bắc xuống Nam',
                isCorrect: true,
                explanation: 'Chính xác! Phố Huế chỉ cho phép chạy một chiều từ Bắc xuống Nam (từ Hàng Bài xuống Đại Cồ Việt).'
              },
              {
                id: 'opt-ba-trieu',
                label: 'Đi BÀ TRIỆU',
                subLabel: '1 chiều hướng Nam lên Bắc',
                isCorrect: false,
                explanation: 'BẪY NGƯỢC CHIỀU! Bà Triệu chỉ cho phép chạy một chiều từ Nam lên Bắc (từ Đại Cồ Việt lên Hồ Gươm).'
              },
              {
                id: 'opt-quang-trung',
                label: 'Đi QUANG TRUNG (ngược chiều)',
                subLabel: 'Đường cụt ở hồ Thiền Quang',
                isCorrect: false,
                explanation: 'Sai! Quang Trung đâm thẳng xuống hồ Thiền Quang chứ không dẫn ra Đại Cồ Việt.'
              },
              {
                id: 'opt-phan-boi-chau',
                label: 'Đi PHAN BỘI CHÂU',
                subLabel: 'Đường cụt ga xe lửa',
                isCorrect: false,
                explanation: 'Sai! Phan Bội Châu nằm phía ga Hà Nội, không thông ra Đại Cồ Việt.'
              }
            ],
            hint: 'Phố Huế đi XUỐNG Nam, Bà Triệu đi LÊN Bắc.'
          });
        }
      } else if (activeMode === 'sun_triangulation') {
        // Sun triangulation questions
        const isAfternoon = i % 2 === 0;
        const hour = isAfternoon ? 16.5 : 7.5;
        const az = getHanoiSolarAzimuth(hour);
        const cardName = bearingToCardinalName(az);

        if (isAfternoon) {
          list.push({
            id: `q-sun-pm-${i}`,
            mode: 'sun_triangulation',
            prompt: 'Hiện tại là 16h30 CHIỀU tại Hà Nội. Bạn đang lái xe mà NẮNG CHIẾU CHÓI THẲNG MẶT. Bạn đang đi theo hướng nào?',
            subPrompt: `Góc phương vị mặt trời lúc này ≈ ${az}° (${cardName})`,
            contextInfo: { sunHour: 16.5, sunAzimuth: az, shadowBearing: (az + 180) % 360 },
            options: [
              {
                id: 'opt-west',
                label: 'Hướng TÂY (West)',
                subLabel: 'Về phía Cầu Giấy, Mỹ Đình, Hà Đông',
                isCorrect: true,
                explanation: 'Chính xác! Mặt trời chiều lặn ở hướng Tây / Tây Nam. Nắng chiếu thẳng mặt chứng tỏ xe đang chạy thẳng về hướng Tây.'
              },
              {
                id: 'opt-east',
                label: 'Hướng ĐÔNG (East)',
                subLabel: 'Về phía Sông Hồng và Long Biên',
                isCorrect: false,
                explanation: 'Sai! Nếu đi hướng Đông thì mặt trời chiều sẽ ở sau gáy bạn, không thể chói mắt.'
              },
              {
                id: 'opt-north',
                label: 'Hướng BẮC (North)',
                subLabel: 'Về phía Hồ Tây và Cầu Nhật Tân',
                isCorrect: false,
                explanation: 'Sai! Đi hướng Bắc thì mặt trời chiều sẽ nằm ở bên tay trái bạn.'
              },
              {
                id: 'opt-south',
                label: 'Hướng NAM (South)',
                subLabel: 'Về phía Giáp Bát và Nước Ngầm',
                isCorrect: false,
                explanation: 'Sai! Đi hướng Nam thì mặt trời chiều sẽ nằm ở bên tay phải bạn.'
              }
            ],
            hint: 'Chiều mặt trời lặn ở hướng TÂY.'
          });
        } else {
          list.push({
            id: `q-sun-am-${i}`,
            mode: 'sun_triangulation',
            prompt: 'Lúc 07h30 SÁNG, bạn đang đứng trước cổng Công viên Thủ Lệ. Bên tay TRÁI bạn là tòa tháp LOTTE CENTER. Bạn đang nhìn về hướng nào?',
            subPrompt: 'Mặt trời sáng ở hướng Đông (azimuth ~95°), Lotte nằm ở ngã tư Liễu Giai - Đào Tấn',
            contextInfo: { sunHour: 7.5, sunAzimuth: az },
            options: [
              {
                id: 'opt-am-west',
                label: 'Hướng TÂY (hướng ra đường Cầu Giấy)',
                subLabel: 'Lotte ở phía Bắc bên tay phải',
                isCorrect: false,
                explanation: 'Sai! Nếu nhìn hướng Tây từ Thủ Lệ, Lotte Center sẽ ở bên tay PHẢI của bạn.'
              },
              {
                id: 'opt-am-east',
                label: 'Hướng ĐÔNG (hướng về phía Kim Mã / Hồ Gươm)',
                subLabel: 'Lotte ở phía Bắc bên tay TRÁI',
                isCorrect: true,
                explanation: 'Chính xác! Lotte Center nằm ở phía Bắc của công viên Thủ Lệ. Khi Lotte ở bên tay trái, bạn đang nhìn thẳng về hướng ĐÔNG.'
              },
              {
                id: 'opt-am-north',
                label: 'Hướng BẮC (hướng thẳng vào tòa tháp Lotte)',
                subLabel: 'Lotte ở trước mặt',
                isCorrect: false,
                explanation: 'Sai! Đề bài nói Lotte ở bên tay trái, không phải trước mặt.'
              },
              {
                id: 'opt-am-south',
                label: 'Hướng NAM (hướng về phía Giảng Võ)',
                subLabel: 'Lotte ở sau lưng',
                isCorrect: false,
                explanation: 'Sai! Nếu nhìn hướng Nam thì Lotte ở sau lưng bạn.'
              }
            ],
            hint: 'Lotte nằm ở phía Bắc công viên Thủ Lệ. Nếu nó ở bên tay trái thì trước mặt là hướng nào?'
          });
        }
      } else if (activeMode === 'blind_drop') {
        // Blind Drop & Mental Routing
        list.push({
          id: `q-blind-${i}`,
          mode: 'blind_drop',
          prompt: 'THỬ THÁCH THẢ DÙ MÙ: Bạn đang đứng tại một ngã tư ẩn tên. Manh mối: "Cách Hồ Gươm 300m về phía Nam, kẹp giữa một đường 1 chiều đi lên Bắc và một đại lộ 2 chiều rợp bóng sấu lớn". Bạn đang ở đâu?',
          subPrompt: 'Nhận diện tọa độ từ cấu trúc thực thể xung quanh',
          options: [
            {
              id: 'opt-bt-thd',
              label: 'Ngã tư BÀ TRIỆU - TRẦN HƯNG ĐẠO',
              subLabel: 'Bà Triệu (1 chiều Bắc) ⟂ Trần Hưng Đạo (2 chiều sấu)',
              isCorrect: true,
              explanation: 'Xuất sắc! Bà Triệu là đường 1 chiều hướng Nam lên Bắc, Trần Hưng Đạo là đại lộ 2 chiều rợp bóng sấu cổ thụ thời Pháp.'
            },
            {
              id: 'opt-ph-thd',
              label: 'Ngã tư PHỐ HUẾ - TRẦN HƯNG ĐẠO',
              subLabel: 'Phố Huế đi chiều Nam',
              isCorrect: false,
              explanation: 'Sai! Phố Huế là đường 1 chiều đi XUỐNG NAM, trong khi manh mối nói đường 1 chiều đi LÊN BẮC.'
            },
            {
              id: 'opt-qs-ltk',
              label: 'Ngã tư QUÁN SỨ - LÝ THƯỜNG KIỆT',
              subLabel: 'Khu vực gần Chùa Quán Sứ',
              isCorrect: false,
              explanation: 'Sai! Quán Sứ là đường 2 chiều, không phải đường 1 chiều đi lên Bắc.'
            },
            {
              id: 'opt-hb-hbt',
              label: 'Ngã tư HÀNG BÀI - HAI BÀ TRƯNG',
              subLabel: 'Cạnh Tràng Tiền Plaza',
              isCorrect: false,
              explanation: 'Sai! Hàng Bài là đường 2 chiều, Hai Bà Trưng đoạn này là 2 chiều.'
            }
          ],
          hint: 'Đường nào 1 chiều chạy thẳng lên Bờ Hồ? Đó là Bà Triệu!'
        });
      } else {
        // Mental Compass 360°
        list.push({
          id: `q-compass-${i}`,
          mode: 'mental_compass',
          prompt: 'RADAR LA BÀN TÂM TƯỞNG: Đứng tại NGÃ TƯ SỞ nhìn về hướng Bắc, tòa tháp KEANGNAM LANDMARK 72 nằm ở phương vị nào?',
          subPrompt: 'Ước lượng góc phương vị tương đối và cự ly',
          options: [
            {
              id: 'opt-c-nw',
              label: 'Phương vị TÂY BẮC (khoảng 310° - 325°), cách ~4.2 km',
              subLabel: 'Qua trục Vũ Trọng Phụng / Lê Văn Lương sang Phạm Hùng',
              isCorrect: true,
              explanation: 'Chính xác! Từ Ngã Tư Sở nhìn sang Keangnam (đường Phạm Hùng) chếch về phía Tây Bắc khoảng 315°, cự ly chim bay ~4.2km.'
            },
            {
              id: 'opt-c-ne',
              label: 'Phương vị ĐÔNG BẮC (khoảng 45°), cách ~3.0 km',
              subLabel: 'Về phía Hồ Gươm',
              isCorrect: false,
              explanation: 'Sai! Hướng Đông Bắc từ Ngã Tư Sở là dẫn về Bờ Hồ và ga Hà Nội.'
            },
            {
              id: 'opt-c-sw',
              label: 'Phương vị TÂY NAM (khoảng 225°), cách ~6.0 km',
              subLabel: 'Dọc theo trục Nguyễn Trãi',
              isCorrect: false,
              explanation: 'Sai! Hướng Tây Nam từ Ngã Tư Sở là đường Nguyễn Trãi đi xuống quận Hà Đông.'
            },
            {
              id: 'opt-c-se',
              label: 'Phương vị ĐÔNG NAM (khoảng 135°), cách ~5.0 km',
              subLabel: 'Dọc theo đường Trường Chinh',
              isCorrect: false,
              explanation: 'Sai! Hướng Đông Nam từ Ngã Tư Sở là đường Trường Chinh đi sang Ngã Tư Vọng.'
            }
          ],
          hint: 'Keangnam nằm ở phía Tây Tây Bắc so với Ngã Tư Sở.'
        });
      }
    }

    return list;
  }, [activeMode]);

  const currentQuestion = questions[currentQuestionIndex] || questions[0];

  // Global Timer effect
  useEffect(() => {
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
  }, []);

  // Answer handler
  const handleSelectOption = (option: IGameQuestion['options'][0]) => {
    if (isAnswerSubmitted) return;

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
      const correctOpt = currentQuestion.options.find(o => o.isCorrect)!;
      trackWrongAnswer({
        difficultyLevel: currentLevel,
        round: currentQuestionIndex + 1,
        questionContext: {
          hanoiMode: currentQuestion.mode,
          sunHour: currentQuestion.contextInfo?.sunHour,
          bearingDeg: currentQuestion.contextInfo?.sunAzimuth,
          streetA: currentQuestion.contextInfo?.baseStreet,
          streetB: currentQuestion.contextInfo?.targetStreet,
          landmarkNeo: currentQuestion.contextInfo?.centerLandmark
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
  };

  const accuracyRate = totalQuestions > 0 
    ? Math.round((correctAnswersCount / totalQuestions) * 100) 
    : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-4 animate-fadeIn">
      {/* Top Header & Status Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Left: Mode Badge & Level */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
            {currentLevel}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {activeMode === 'skeleton' && '1. Khung Xương Đô Thị'}
                {activeMode === 'grid_topology' && '2. Lưới Phố Pháp // & ⟂'}
                {activeMode === 'sun_triangulation' && '3. Định Vị Mặt Trời'}
                {activeMode === 'blind_drop' && '4. Thả Dù Mù & Dẫn Đường'}
                {activeMode === 'mental_compass' && '5. Radar La Bàn 360°'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold">
                Cấp {currentLevel}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Câu {currentQuestionIndex + 1} / {questions.length}
            </div>
          </div>
        </div>

        {/* Center: Live Stats (Streak & Score) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span>{streak} streak</span>
          </div>
          <div className="text-sm font-black text-slate-800 dark:text-slate-100">
            {score} XP
          </div>
        </div>

        {/* Right: Map Controls (Rotate & Silent) & Timer */}
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

          {/* Theory button */}
          <button
            onClick={() => {
              setActiveGameSlug(null);
              navigateToTheory('hanoi-map');
            }}
            className="p-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Mở giáo trình lý thuyết Bản đồ Hà Nội"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lý Thuyết</span>
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
        {/* Left Column: Interactive Vector Mini-Map / Context Widget */}
        <div className="lg:col-span-5 bg-slate-950 rounded-3xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-[360px]">
          {/* Solar Widget Indicator on top of mini-map */}
          {currentQuestion.contextInfo?.sunHour !== undefined && (
            <div className="flex items-center justify-between text-xs bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 mb-2 z-10">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Sun className="w-4 h-4 animate-spin-slow" />
                <span>{currentQuestion.contextInfo.sunHour}h00</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Góc nắng: {currentQuestion.contextInfo.sunAzimuth}° ({bearingToCardinalName(currentQuestion.contextInfo.sunAzimuth || 0)})
              </div>
            </div>
          )}

          {/* SVG Mini Vector Map */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <svg
              viewBox="0 0 500 450"
              className="w-full h-full max-h-[320px] transition-transform duration-500"
              style={{ transform: `rotate(${mapRotation}deg)` }}
            >
              {/* Sông Hồng */}
              <path
                d="M 50,0 C 130,70 240,110 320,180 C 390,240 450,330 500,450 L 500,430 C 440,310 380,220 310,160 C 230,90 120,50 60,0 Z"
                fill="#ef4444"
                opacity="0.8"
              />
              {!silentMap && (
                <text x="350" y="240" fill="#fecaca" fontSize="9" fontWeight="bold">
                  Sông Hồng
                </text>
              )}

              {/* Hồ Tây */}
              <ellipse cx="230" cy="110" rx="45" ry="35" fill="#0284c7" opacity="0.8" />
              {!silentMap && (
                <text x="230" y="114" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Hồ Tây
                </text>
              )}

              {/* Hồ Gươm (Tâm) */}
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

              {/* Cầu Sông Hồng dots */}
              <circle cx="235" cy="25" r="5" fill="#10b981" />
              <circle cx="170" cy="50" r="5" fill="#10b981" />
              <circle cx="345" cy="180" r="5" fill="#10b981" />
              <circle cx="360" cy="200" r="5" fill="#10b981" />
              <circle cx="420" cy="280" r="5" fill="#10b981" />
              <circle cx="480" cy="380" r="5" fill="#10b981" />

              {/* Sun Light Angle vector if applicable */}
              {currentQuestion.contextInfo?.sunAzimuth !== undefined && (
                <line
                  x1={250 + 200 * Math.cos(((currentQuestion.contextInfo.sunAzimuth - 90) * Math.PI) / 180)}
                  y1={225 + 200 * Math.sin(((currentQuestion.contextInfo.sunAzimuth - 90) * Math.PI) / 180)}
                  x2="250"
                  y2="225"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                />
              )}
            </svg>
          </div>

          {/* Compass Rose orientation indicator */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Góc xoay bản đồ: <strong>{mapRotation}°</strong></span>
            </span>
            <span className="text-slate-500">
              {mapRotation === 0 ? 'Bắc ở TRÊN' : `Bắc lệch ${mapRotation}°`}
            </span>
          </div>
        </div>

        {/* Right Column: Question Content & Options */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Question Title & Subprompt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Câu hỏi nhận thức không gian
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

            {/* Answer Options Grid */}
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

            {/* Explanation box on submit */}
            {isAnswerSubmitted && (
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed animate-fadeIn">
                <strong>Giải thích sư phạm:</strong>{' '}
                {currentQuestion.options.find(o => o.id === selectedOptionId)?.explanation || 
                 currentQuestion.options.find(o => o.isCorrect)?.explanation}
              </div>
            )}
          </div>

          {/* Action Button: Next Question */}
          {isAnswerSubmitted && (
            <button
              onClick={handleNextQuestion}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
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
    </div>
  );
};
