import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { useRelationSession } from '../../hooks/useRelationSession';
import { BookOpen, Eye, RotateCcw } from 'lucide-react';
import { ReadingTextSourceModal } from '../common/ReadingTextSourceModal';
import { readingContentService } from '../../services/readingContentService';
import { IReadingText, SAMPLE_READING_TEXTS } from '@brain-exercises/shared';

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
      'Chất lượng giấc ngủ quyết định độ sắc bén của trí tuệ và phản xạ.'
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
  },
  {
    linesTop: [
      'Kính viễn vọng không gian James Webb hoạt động tại điểm Lagrange L2.',
      'Tấm gương mạ vàng khổng lồ 6,5 mét thu nhận photon hồng ngoại cổ xưa.',
      'Webb nhìn ngược thời gian về thuở bình minh vũ trụ 13,5 tỷ năm trước.'
    ],
    linesBottom: [
      'Phát hiện dấu vết hơi nước và khí methane trên các ngoại hành tinh xa xôi.',
      'Mở ra hy vọng tìm kiếm sự sống ngoài Trái Đất trong thế kỷ 21.'
    ],
    question: 'Kính thiên văn James Webb thu nhận chủ yếu loại photon ánh sáng nào?',
    options: ['A. Tia X', 'B. Tia gamma', 'C. Hồng ngoại (Infrared)', 'D. Tử ngoại'],
    correctIndex: 2
  },
  {
    linesTop: [
      'Đường ruột chứa hơn 100 triệu tế bào thần kinh như bộ não thứ hai.',
      'Hơn 90% hormone hạnh phúc Serotonin được sản xuất tại đường ruột.',
      'Dây thần kinh phế vị Vagus kết nối trực tiếp hệ tiêu hóa với não bộ.'
    ],
    linesBottom: [
      'Hệ vi sinh vật đường ruột điều hòa cảm xúc, trí nhớ và mức độ lo âu.',
      'Chế độ ăn giàu chất xơ nuôi dưỡng vi khuẩn có lợi bảo vệ tế bào não.'
    ],
    question: 'Khoảng bao nhiêu % lượng Serotonin toàn cơ thể được tổng hợp tại đường ruột?',
    options: ['A. 20%', 'B. 50%', 'C. Hơn 90%', 'D. 100%'],
    correctIndex: 2
  },
  {
    linesTop: [
      'Trạng thái dòng chảy Flow State giải phóng tiềm năng sáng tạo tột đỉnh.',
      'Não bộ kích hoạt hiện tượng giảm hoạt động thùy trán tạm thời.',
      'Năng suất lao động có thể tăng vọt gấp năm lần khi đắm chìm vào công việc.'
    ],
    linesBottom: [
      'Cần loại bỏ xao nhãng và đặt mục tiêu vi mô rõ ràng cho từng phiên làm việc.',
      'Độ khó của thử thách cần cao hơn kỹ năng hiện tại khoảng 4%.'
    ],
    question: 'Hiện tượng não bộ nào diễn ra khi con người bước vào trạng thái Flow?',
    options: ['A. Giảm kích hoạt thùy trán tạm thời', 'B. Tăng huyết áp vỏ não', 'C. Teo hồi hải mã', 'D. Ngừng thở sâu'],
    correctIndex: 0
  }
];

export const GreenDotGame: React.FC = () => {
  const { getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();
  const currentLevel = getExerciseLevel('green-dot');

  const allTexts = readingContentService.getAllTexts();
  const [currentArticle, setCurrentArticle] = useState<IReadingText>(() => {
    return allTexts[(currentLevel - 1) % allTexts.length] || SAMPLE_READING_TEXTS[0];
  });
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const [datasetIndex, setDatasetIndex] = useState(() => (currentLevel - 1) % GREEN_DOT_DATASETS.length);
  const [customDataset, setCustomDataset] = useState<GreenDotSet | null>(null);

  const activeDataset: GreenDotSet = useMemo(() => {
    return customDataset || GREEN_DOT_DATASETS[datasetIndex] || GREEN_DOT_DATASETS[0];
  }, [customDataset, datasetIndex]);

  const startTimeRef = useRef<number>(Date.now());

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
    const correct = idx === activeDataset.correctIndex;
    const now = Date.now();
    const respMs = Math.min(30000, Math.max(100, now - startTimeRef.current));

    emitTrialEvent({
      exerciseSlug: 'green-dot',
      level: currentLevel,
      relationId: 'FOCUS_FIELD',
      relationWeight: 1.0,
      entities: {
        question: activeDataset.question,
        chosen: activeDataset.options[idx],
        correctAnswer: activeDataset.options[activeDataset.correctIndex]
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

  const handleSelectNewArticle = (article: IReadingText) => {
    setCurrentArticle(article);
    const generated = readingContentService.generateGreenDotSetFromText(article);
    if (generated) {
      setCustomDataset(generated);
    } else {
      setDatasetIndex(prev => (prev + 1) % GREEN_DOT_DATASETS.length);
      setCustomDataset(null);
    }
    setPhase('focus');
    setTimeLeft(initialTime);
    setSelectedAnswer(null);
    setIsFinished(false);
  };

  const handleRestart = () => {
    playSound('click');
    setDatasetIndex(prev => (prev + 1) % GREEN_DOT_DATASETS.length);
    setCustomDataset(null);
    setPhase('focus');
    setTimeLeft(initialTime);
    setSelectedAnswer(null);
    setIsFinished(false);
  };

  const isCorrect = selectedAnswer === activeDataset.correctIndex;
  const score = isCorrect ? 250 * currentLevel : 100;

  return (
    <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5 sm:space-y-6 animate-fade-in pb-24">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
            <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="text-xs sm:text-sm text-slate-500 font-semibold block">Giai đoạn</span>
            <span className="text-sm sm:text-xl font-black text-slate-800 dark:text-white">
              {phase === 'focus' ? 'Nhìn cố định chấm xanh' : 'Trắc nghiệm ngoại vi'}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            playSound('click');
            setIsSourceModalOpen(true);
          }}
          className="py-2 px-3 sm:px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all btn-press shadow-sm"
        >
          <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Đổi chủ đề / Wikipedia</span>
        </button>

        <div className="text-right">
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Thời gian neo mắt</span>
          <div className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {phase === 'focus' ? `${timeLeft}s` : 'Hết giờ'}
          </div>
        </div>
      </div>

      {phase === 'focus' ? (
        /* Focus Phase: Green dot in middle with top and bottom text lines */
        <div className="p-6 sm:p-10 md:p-14 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-400 shadow-2xl flex flex-col items-center justify-between min-h-[360px] sm:min-h-[440px] space-y-6 text-center select-none relative overflow-hidden">
          {/* Top text block */}
          <div className="space-y-3 max-w-xl text-slate-600 dark:text-slate-300 text-sm sm:text-base md:text-lg font-medium tracking-wide">
            {activeDataset.linesTop.map((line, i) => (
              <p key={i} className="transition-opacity duration-300 opacity-90">{line}</p>
            ))}
          </div>

          {/* Central Green Dot (Point of Fixation) */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/50 flex items-center justify-center animate-pulse" />
            <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-emerald-400/40 animate-ping" />
            <span className="absolute -bottom-6 text-[10px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest whitespace-nowrap">
              Cố định mắt vào đây
            </span>
          </div>

          {/* Bottom text block */}
          <div className="space-y-3 max-w-xl text-slate-600 dark:text-slate-300 text-sm sm:text-base md:text-lg font-medium tracking-wide">
            {activeDataset.linesBottom.map((line, i) => (
              <p key={i} className="transition-opacity duration-300 opacity-90">{line}</p>
            ))}
          </div>
        </div>
      ) : (
        /* Test Phase: Multiple choice question */
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 animate-scale-up">
          <div className="space-y-2 text-center">
            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">
              Kiểm tra khả năng tiếp nhận ngoại vi
            </span>
            <h3 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-snug">
              {activeDataset.question}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {activeDataset.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isRight = idx === activeDataset.correctIndex;
              let btnClass = 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50';

              if (selectedAnswer !== null) {
                if (isRight) btnClass = 'bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-300 shadow-lg';
                else if (isSelected) btnClass = 'bg-rose-500 text-white border-rose-600';
              }

              return (
                <button
                  key={idx}
                  disabled={selectedAnswer !== null}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 sm:p-5 rounded-2xl border text-left font-bold text-sm sm:text-base transition-all btn-press ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Restart / Next Set Button */}
      <div className="flex justify-end">
        <button
          onClick={handleRestart}
          className="py-2.5 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1.5 btn-press"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Bài tập điểm xanh tiếp theo</span>
        </button>
      </div>

      {/* Text Source Selection Modal */}
      <ReadingTextSourceModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        currentText={currentArticle}
        onSelectText={handleSelectNewArticle}
      />

      {isFinished && (
        <GameResultModal
          score={score}
          accuracyRate={isCorrect ? 100 : 0}
          timeSpentSec={initialTime}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={() => {
            resetSession();
            handleRestart();
          }}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
