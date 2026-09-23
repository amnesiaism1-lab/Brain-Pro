import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { useRelationSession } from '../../hooks/useRelationSession';

interface GreenDotSet {
  linesTop: string[];
  linesBottom: string[];
  question: string;
  options: string[];
  correctIndex: number;
}

const GREEN_DOT_DATASETS: GreenDotSet[] = [
  {
    linesTop: [
      'Bộ não con người sở hữu tính dẻo thần kinh kỳ diệu.',
      'Thị giác ngoại vi có thể thu nhận ánh sáng và mẫu hình từ góc 180 độ.',
      'Kỹ thuật đọc soft-focus giúp hấp thu toàn bộ 3 dòng cùng lúc.'
    ],
    linesBottom: [
      'Khi mắt không di chuyển, tốc độ tiếp nhận thông tin tăng gấp 3 lần.',
      'Tập luyện đều đặn giúp khai mở tiềm năng đọc siêu tốc mỗi ngày.'
    ],
    question: 'Khối văn bản xung quanh chấm xanh đề cập đến góc thu nhận của thị giác ngoại vi là bao nhiêu độ?',
    options: ['A. 90 độ', 'B. 180 độ', 'C. 360 độ', 'D. 45 độ'],
    correctIndex: 1
  },
  {
    linesTop: [
      'Phương pháp Cung điện Trí nhớ ra đời từ thời La Mã cổ đại.',
      'Các điểm neo Loci giúp kết nối dữ liệu trừu tượng vào không gian thân thuộc.',
      'Simonides xứ Ceos là nhà thơ đầu tiên sáng lập phương pháp ghi nhớ này.'
    ],
    linesBottom: [
      'Não bộ lưu giữ ký ức hình ảnh sống động vượt trội so với con số khô khan.',
      'Tưởng tượng càng kỳ lạ và hài hước thì khả năng ghi nhớ càng bền vững.'
    ],
    question: 'Nhà thơ nào được xem là người sáng lập phương pháp Cung điện Trí nhớ trong văn bản?',
    options: ['A. Cicero', 'B. Socrates', 'C. Simonides xứ Ceos', 'D. Aristotle'],
    correctIndex: 2
  },
  {
    linesTop: [
      'Giấc ngủ sóng chậm kích hoạt hệ thống Glymphatic trong não.',
      'Dòng dịch não tủy rửa trôi các protein Beta-Amyloid độc hại tích tụ ban ngày.',
      'Hồi hải mã chuyển giao thông tin ngắn hạn thành ký ức dài hạn vĩnh viễn.'
    ],
    linesBottom: [
      'Ngủ đủ 7 đến 8 tiếng giúp củng cố kiến thức tốt hơn 40%.',
      'Chất lượng giấc ngủ quyết định độ sắc bén của trí tuệu và phản xạ.'
    ],
    question: 'Loại protein độc hại nào được hệ thống Glymphatic rửa trôi trong giấc ngủ?',
    options: ['A. Collagen', 'B. Beta-Amyloid', 'C. Insulin', 'D. Keratin'],
    correctIndex: 1
  },
  {
    linesTop: [
      'Thói quen đọc thầm kìm hãm tốc độ đọc ở mức 150 đến 250 từ mỗi phút.',
      'Võng mạc mắt có thể chụp ảnh cả một cụm từ chỉ trong 15 mili giây.',
      'Bảng Schulte giúp mở rộng tầm quét của các tế bào que ở biên mắt.'
    ],
    linesBottom: [
      'Loại bỏ đọc thầm giúp tiếp nhận ý niệm trực tiếp từ hình ảnh thị giác.',
      'Đọc nhanh không làm giảm sự thấu hiểu nếu bạn làm chủ kỹ thuật chunking.'
    ],
    question: 'Võng mạc mắt có thể chụp ảnh cả cụm từ trong khoảng thời gian bao lâu?',
    options: ['A. 15 mili giây', 'B. 500 mili giây', 'C. 2 giây', 'D. 10 giây'],
    correctIndex: 0
  }
];

export const GreenDotGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const currentLevel = getExerciseLevel('green-dot');
  const [datasetIndex, setDatasetIndex] = useState(() => Math.floor(Math.random() * GREEN_DOT_DATASETS.length));
  const startTimeRef = useRef<number>(Date.now());
  const currentDataset = GREEN_DOT_DATASETS[datasetIndex];

  // At high levels (9-12), window is tighter: 12-15s
  const initialTime = currentLevel >= 9 ? 12 : currentLevel >= 5 ? 18 : 25;
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [phase, setPhase] = useState<'focus' | 'test'>('focus');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (phase !== 'focus') return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          playSound('correct');
          setPhase('test');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, playSound]);

  const handleSelectOption = (idx: number) => {
    playSound('click');
    setSelectedAnswer(idx);
    const correct = idx === currentDataset.correctIndex;
    const now = Date.now();
    const respMs = Math.min(30000, Math.max(100, now - startTimeRef.current));

    emitTrialEvent({
      exerciseSlug: 'green-dot',
      level: currentLevel,
      relationId: 'FOCUS_FIELD',
      relationWeight: 1.0,
      entities: {
        question: currentDataset.question,
        chosen: currentDataset.options[idx],
        correctAnswer: currentDataset.options[currentDataset.correctIndex]
      },
      stateBefore: 'phase:focus',
      stateAfter: 'phase:test',
      responseMs: respMs,
      correct
    });

    if (correct) {
      playSound('correct');
    } else {
      playSound('wrong');
    }
    setTimeout(() => {
      setIsFinished(true);
    }, 600);
  };

  const isCorrect = selectedAnswer === currentDataset.correctIndex;
  const score = isCorrect ? 250 * currentLevel : 100;

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 py-4 space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Trạng thái bài tập</span>
          <div className="text-base sm:text-xl font-black text-brand-600 dark:text-brand-400">
            {phase === 'focus' ? 'Tập trung Điểm Xanh' : 'Kiểm tra nhận thức'}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Đếm ngược</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-500">
            {timeLeft}s
          </div>
        </div>
      </div>

      {phase === 'focus' ? (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400 font-medium">
            Giữ nguyên mắt tại <strong>Chấm Xanh Lục</strong> ở tâm. Thả lỏng mắt và nhận diện các dòng chữ xung quanh bằng tầm nhìn ngoại vi.
          </p>

          {/* Text block with central emerald green dot */}
          <div className="relative p-6 sm:p-10 md:p-12 rounded-3xl bg-white dark:bg-slate-800 border-2 border-brand-500/80 shadow-2xl overflow-hidden leading-relaxed sm:leading-loose text-base sm:text-lg md:text-xl font-medium text-slate-700 dark:text-slate-300 select-none text-center">
            {currentDataset.linesTop.map((line, idx) => (
              <p key={`top-${idx}`} className="blur-[0.3px] my-2 sm:my-3">{line}</p>
            ))}
            
            {/* The Central Glowing Green Dot */}
            <div className="my-6 sm:my-8 flex items-center justify-center relative">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/80 animate-ping absolute" />
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500 border-2 sm:border-4 border-white shadow-lg relative z-10" />
            </div>

            {currentDataset.linesBottom.map((line, idx) => (
              <p key={`bot-${idx}`} className="blur-[0.3px] my-2 sm:my-3">{line}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5 bg-white dark:bg-slate-800 p-6 sm:p-8 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl">
          <h3 className="font-black text-lg sm:text-xl md:text-2xl text-slate-800 dark:text-white leading-snug">
            {currentDataset.question}
          </h3>

          <div className="space-y-3">
            {currentDataset.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelectOption(i)}
                className={`w-full p-4 sm:p-5 rounded-2xl text-left text-sm sm:text-base md:text-lg font-bold border transition-all btn-press ${
                  selectedAnswer === i
                    ? i === currentDataset.correctIndex
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg'
                      : 'bg-rose-500 text-white border-rose-500 shadow-lg'
                    : 'bg-slate-50 dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white hover:bg-brand-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={isCorrect ? 100 : 50}
          timeSpentSec={25}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            startTimeRef.current = Date.now();
            setDatasetIndex(prev => (prev + 1) % GREEN_DOT_DATASETS.length);
            setTimeLeft(25);
            setPhase('focus');
            setSelectedAnswer(null);
            setIsFinished(false);
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};

