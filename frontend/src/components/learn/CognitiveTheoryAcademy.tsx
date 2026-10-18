import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ExerciseSlug } from '@brain-exercises/shared';
import { 
  Zap, 
  Eye, 
  Target, 
  Brain, 
  Activity, 
  Headphones, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Award,
  BookOpen,
  Lightbulb,
  Compass
} from 'lucide-react';

interface ICognitiveAxisTheory {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  brainRegions: string[];
  coreMechanism: string;
  scientificInsight: string;
  techniques: Array<{ name: string; desc: string }>;
  recommendedExercises: Array<{ slug: ExerciseSlug; name: string }>;
}

const COGNITIVE_AXES_THEORY: ICognitiveAxisTheory[] = [
  {
    id: 'speed-reading',
    code: 'SPEED_READING',
    title: '1. Đọc Nhanh & Nhận Diện Ngôn Ngữ Tốc Độ Cao',
    subtitle: 'Khử Đọc Thầm • Điểm Nhận Diện Tối Ưu (ORP) • Nhịp Quét Saccade',
    icon: Zap,
    color: 'from-amber-500 to-orange-500',
    brainRegions: ['Vùng Wernicke & Broca', 'Hồi Góc (Angular Gyrus)', 'Vỏ Não Thị Giác V1/V2'],
    coreMechanism: 'Chuyển đổi từ xử lý ngữ âm trung gian (Phonological Recoding) sang nhận diện hình thái trực giác (Direct Visual Word-Form Recognition).',
    scientificInsight: 'Bộ não con người chỉ có thể phát âm thầm khoảng 200-250 từ/phút. Khi luyện tập RSVP và loại bỏ phản xạ thanh quản vi mô, vỏ não thị giác có thể quét và hiểu trực tiếp các khối từ với tốc độ trên 600-1000 WPM.',
    techniques: [
      {
        name: 'Mỏ neo ORP (Optimal Recognition Point)',
        desc: 'Khoá mắt vào ký tự neo màu đỏ ở vị trí 30-35% chiều dài từ để não bộ tiếp nhận trọn vẹn ngữ nghĩa mà không cần di chuyển con ngươi.'
      },
      {
        name: 'Gộp Cụm (Visual Chunking)',
        desc: 'Mở rộng nhịp dừng mắt để nhận diện 2-3 từ cùng lúc thay vì đọc từng chữ rời rạc, giảm thiểu 50% số lần giật mắt (saccades).'
      },
      {
        name: 'Khử Đọc Thầm (Subvocalization Suppression)',
        desc: 'Ức chế thói quen đọc nhẩm trong đầu bằng phương pháp đếm nhịp hoặc tăng tốc độ hiển thị vượt qua ngưỡng phát âm thanh quản.'
      }
    ],
    recommendedExercises: [
      { slug: 'rsvp-speed-reader', name: 'RSVP Speed Reader' },
      { slug: 'word-chunking', name: 'Gộp Cụm Từ (Chunking)' },
      { slug: 'text-scanning', name: 'Quét Khối Văn Bản' }
    ]
  },
  {
    id: 'peripheral-vision',
    code: 'PERIPHERAL_VISION',
    title: '2. Thị Giác Ngoại Vi & Bao Quát Không Gian',
    subtitle: 'Mở Rộng Góc Nhìn 180° • Tế Bào Thần Kinh Hình Que • Tâm Hội Tụ',
    icon: Eye,
    color: 'from-cyan-500 to-blue-600',
    brainRegions: ['Vỏ Não Đỉnh (Parietal Cortex)', 'Lồi Não Trên (Superior Colliculus)', 'Màng Lưới Ngoại Vi'],
    coreMechanism: 'Kích hoạt mật độ tế bào que (Rod Cells) nhạy cảm với chuyển động và độ tương phản ở vùng rìa võng mạc, giảm thói quen đảo mắt liên tục.',
    scientificInsight: 'Mắt người bình thường có trường nhìn ngoại vi lên đến gần 180 độ, nhưng 95% thời gian chỉ sử dụng vùng hoàng điểm (Fovea 2 độ). Bảng Schulte huấn luyện người học cố định tiêu điểm tại tâm và đọc các số xung quanh hoàn toàn bằng trường nhìn ngoại vi.',
    techniques: [
      {
        name: 'Cố Định Mỏ Neo Trung Tâm',
        desc: 'Giữ ánh nhìn thư giãn vào chấm tâm của lưới Schulte, không liếc mắt theo từng số, mở rộng nhận thức thị giác ra 4 góc.'
      },
      {
        name: 'Chế Độ Cổ Điển Không Làm Mờ',
        desc: 'Rèn luyện khả năng duy trì toàn bộ bức tranh thị giác mà không phụ thuộc vào việc loại trừ các ô đã đổi màu.'
      },
      {
        name: 'Quét Đối Xứng Chữ Thập',
        desc: 'Di chuyển chùm chú ý nội tại (Covert Attention) dọc theo 4 hướng la bàn mà không chuyển động nhãn cầu vật lý.'
      }
    ],
    recommendedExercises: [
      { slug: 'schulte-table', name: 'Bảng Schulte (Schulte Table)' },
      { slug: 'peripheral-vision', name: 'Thị Giác Ngoại Vi' },
      { slug: 'green-dot', name: 'Điểm Xanh Mở Rộng' }
    ]
  },
  {
    id: 'attention',
    code: 'ATTENTION',
    title: '3. Chú Ý Tập Trung & Kiểm Soát Ức Chế',
    subtitle: 'Hiệu Ứng Stroop • Lọc Nhiễu Cocktail • Vỏ Não Đai Trước (ACC)',
    icon: Target,
    color: 'from-emerald-500 to-teal-600',
    brainRegions: ['Vỏ Não Đai Trước (ACC)', 'Vỏ Não Trán Trước Lưng Bên (DLPFC)', 'Hạch Nền (Basal Ganglia)'],
    coreMechanism: 'Ức chế xung động phản xạ tự động (Inhibitory Control) và lọc tín hiệu mục tiêu giữa bối cảnh phân tâm áp đảo.',
    scientificInsight: 'Khi màu sắc hiển thị mâu thuẫn với từ ngữ (như chữ ĐỎ tô màu XANH), não bộ gặp phải xung đột nhận thức Stroop. ACC phải gửi tín hiệu ức chế thói quen đọc từ tự động để kích hoạt mạch phân tích quang phổ màu sắc.',
    techniques: [
      {
        name: 'Khóa Tiêu Điểm Ức Chế',
        desc: 'Tập trung vào đặc tính vật lý (màu sắc/hình dạng) và chủ động bỏ qua đặc tính ngữ nghĩa (chữ viết).'
      },
      {
        name: 'Quy Tắc Đảo Chiều Đột Biến',
        desc: 'Luyện tập chuyển đổi linh hoạt khi hệ thống đổi luật chơi đột ngột, xây dựng tính mềm dẻo nhận thức (Cognitive Flexibility).'
      },
      {
        name: 'Chống Nhấp Bốc Đồng (<150ms)',
        desc: 'Kiểm soát nhịp độ phản ứng để giữ độ chính xác trên 90%, không bấm theo cảm tính thiếu suy xét logic.'
      }
    ],
    recommendedExercises: [
      { slug: 'stroop-clash', name: 'Đại Chiến Stroop' },
      { slug: 'find-letter', name: 'Tìm Chữ Ẩn' },
      { slug: 'rule-mutation-clash', name: 'Đột Biến Quy Tắc' }
    ]
  },
  {
    id: 'memory',
    code: 'MEMORY',
    title: '4. Trí Nhớ Làm Việc & Trí Tuệ Linh Hoạt (Fluid Intelligence)',
    subtitle: 'Dual N-Back • Vòng Âm Học • Bảng Phác Thảo Thị Giác • Mô Hình Baddeley',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    brainRegions: ['Vỏ Não Trán Trước (PFC)', 'Hồi Hải Mã (Hippocampus)', 'Vỏ Não Đỉnh'],
    coreMechanism: 'Duy trì, cập nhật và thao tác đồng thời trên nhiều luồng thông tin ngắn hạn trong khi loại bỏ dấu vết trí nhớ đã cũ.',
    scientificInsight: 'Nghiên cứu của Jaeggi và cộng sự (PNAS) chứng minh rằng Dual N-Back là bài tập khoa học hiếm hoi giúp tăng Fluid Intelligence (Gf) – khả năng tư duy logic và giải quyết vấn đề mới mà không phụ thuộc vào kiến thức tích lũy trước đó.',
    techniques: [
      {
        name: 'Xử Lý Song Song Hai Luồng (Dual Stream)',
        desc: 'Không dịch âm thanh thành hình ảnh hoặc ngược lại; phân chia não bộ để tai nghe âm thanh và mắt nhớ ô vuông độc lập.'
      },
      {
        name: 'Mô Hình Cửa Sổ Trượt (Sliding Window)',
        desc: 'Liên tục đẩy thông tin N bước trước vào bộ đệm và xóa thông tin N+1 bước để tránh quá tải bộ nhớ đệm não bộ.'
      },
      {
        name: 'Chunking Chuỗi Số & Ký Hiệu',
        desc: 'Nhóm các số rời rạc thành từng cụm 3-4 ký tự để vượt qua giới hạn dung lượng trí nhớ làm việc Miller (7±2).'
      }
    ],
    recommendedExercises: [
      { slug: 'dual-nback', name: 'Dual N-Back (Tiêu Chuẩn Vàng)' },
      { slug: 'digit-span', name: 'Chuỗi Số Nhớ Tức Thì' },
      { slug: 'spatial-memory', name: 'Trí Nhớ Không Gian' }
    ]
  },
  {
    id: 'reaction',
    code: 'REACTION',
    title: '5. Phản Xạ Nhận Thức & Ra Quyết Định Logic',
    subtitle: 'Thời Gian Phản Hồi Lựa Chọn (Choice RT) • Logic Parity • Go / No-Go',
    icon: Activity,
    color: 'from-rose-500 to-pink-600',
    brainRegions: ['Vỏ Não Vận Động Phụ (SMA)', 'Đồi Thị (Thalamus)', 'Tiểu Não (Cerebellum)'],
    coreMechanism: 'Rút ngắn thời gian từ tiếp nhận kích thích thị giác/thính giác qua xử lý giải mã quy luật đến phát lệnh vận động cơ học ngón tay.',
    scientificInsight: 'Thời gian phản ứng cơ học đơn thuần là ~180-220ms, nhưng khi phải ra quyết định logic (như xác định Parity Chẵn/Lẻ hoặc Số La Mã), thời gian tăng lên 400-700ms. Rèn luyện giúp tự động hóa quá trình tính nhẩm để đạt phản xạ dưới 300ms.',
    techniques: [
      {
        name: 'Nhẩm Nhanh Quy Tắc Parity',
        desc: 'Ghi nhớ quy luật Chẵn ± Chẵn = Chẵn, Lẻ ± Lẻ = Chẵn, Lẻ × Lẻ = Lẻ để đưa ra đáp án chỉ trong 1 tích tắc.'
      },
      {
        name: 'Phản Xạ Bàn Phím Không Cần Nhìn (Touch Keys)',
        desc: 'Sử dụng phím tắt (A/D, 1/2, Arrow) thay vì rê chuột để tiết kiệm 150-250ms thời gian cơ học thao tác.'
      },
      {
        name: 'Hiệu Chỉnh Tốc Độ - Độ Chính Xác',
        desc: 'Nếu độ chính xác giảm xuống dưới 85%, chủ động hãm tốc độ 50ms để não bộ có thời gian xác minh logic.'
      }
    ],
    recommendedExercises: [
      { slug: 'even-odd', name: 'Chẵn Lẻ Tốc Độ' },
      { slug: 'card-flip', name: 'Lật Thẻ Trí Nhớ' },
      { slug: 'twin-words', name: 'Hai Từ Song Hành' }
    ]
  },
  {
    id: 'auditory',
    code: 'AUDITORY',
    title: '6. Cảm Âm & Nhận Thức Không Gian 3D',
    subtitle: 'Bản Đồ Phân Giải Tần Số (Tonotopic) • Độ Lệch Thời Gian ITD • Âm Hình Lập Thể',
    icon: Headphones,
    color: 'from-violet-500 to-purple-600',
    brainRegions: ['Vỏ Não Thính Giác A1', 'Hồi Heschl', 'Củ Não Dưới (Inferior Colliculus)'],
    coreMechanism: 'Giải mã tần số sóng âm (Pitch Discrimination) và phân tích độ lệch nano/micro giây giữa hai tai (ITD/ILD) để định vị không gian 3 chiều.',
    scientificInsight: 'Tai người có thể phân biệt độ lệch thời gian âm thanh giữa tai trái và tai phải nhỏ tới 10 micro giây (0.00001s). Huấn luyện thính giác không chỉ giúp chơi nhạc mà còn tăng cường sự tập trung đa kênh và chống suy giảm nhận thức tuổi già.',
    techniques: [
      {
        name: 'Mỏ Neo Bài Hát Quen Thuộc',
        desc: 'Dùng bài hát dân ca và quốc ca quen thuộc (Tiến quân ca - 4P, Một con vịt - 5P, Kìa con bướm vàng - 3M) làm mốc định vị quãng âm.'
      },
      {
        name: 'Định Vị 3D Bằng Tai Nghe Stereo',
        desc: 'Sử dụng tai nghe cân bằng trái/phải để não bộ giải mã âm hình lập thể 360 độ quanh đầu.'
      },
      {
        name: 'Cảm Nhận Màu Sắc Hòa Âm',
        desc: 'Phân biệt cảm xúc tự nhiên: Trưởng (tươi sáng, rực rỡ) vs Thứ (lắng đọng, ưu tư) vs Tritone (căng thẳng, ma mị).'
      }
    ],
    recommendedExercises: [
      { slug: 'pitch-recall', name: 'Nhớ Cao Độ Âm Thanh' },
      { slug: 'sound-localization', name: 'Định Vị Âm Thanh 3D' },
      { slug: 'interval-identify', name: 'Nhận Diện Quãng Âm' }
    ]
  },
  {
    id: 'spatial-navigation',
    code: 'SPATIAL_NAVIGATION',
    title: '7. Định Hướng Không Gian & Bản Đồ Nhận Thức (Cognitive Navigation)',
    subtitle: 'Khung Lynch 5 Thành Phần • Hệ Quy Chiếu Kép Allocentric / Egocentric • Tế Bào Lưới (Grid Cells)',
    icon: Compass,
    color: 'from-amber-500 to-orange-600',
    brainRegions: ['Hồi Hải Mã (Hippocampus - Place Cells)', 'Vỏ Não Khứu Trong (Entorhinal Cortex - Grid Cells)', 'Vỏ Não Đỉnh Sau (Posterior Parietal)'],
    coreMechanism: 'Hình thành mạng lưới nơ-ron không gian trừu tượng, chuyển đổi liên tục giữa bản đồ từ trên xuống (Allocentric) và góc nhìn thực tế tay lái (Egocentric) dưới ánh nắng mặt trời.',
    scientificInsight: 'Nghiên cứu về tài xế taxi London của Maguire et al. chứng minh việc ghi nhớ bản đồ nhận thức thành phố phức tạp làm tăng sinh thể tích chất xám hồi hải mã sau, giúp não bộ chống lại sự teo thoái và cải thiện trí nhớ không gian dài hạn.',
    techniques: [
      {
        name: 'Khung Xương Vành Đai & Trục Xuyên Tâm',
        desc: 'Quy nạp đô thị thành hệ mạng nhện đồng tâm (Ring-Radial) để định vị nhanh qua thứ tự giao cắt thay vì nhớ rời rạc.'
      },
      {
        name: 'La Bàn Mặt Trời Theo Giờ (Solar Compass)',
        desc: 'Đọc hướng nắng sớm (Đông) và chiều (Tây) tại vĩ độ 21.03°N để biết ngay hướng di chuyển mà không cần mở điện thoại.'
      },
      {
        name: 'Tam Giác Điểm Neo Chân Trời',
        desc: 'Dùng Keangnam Landmark 72 (phía Tây) và Lotte Center (Ba Đình) làm mốc ngắm chân trời (Skyline Triangulation).'
      }
    ],
    recommendedExercises: [
      { slug: 'hanoi-navigation', name: 'Bản Đồ Nhận Thức Hà Nội' },
      { slug: 'spatial-memory', name: 'Nhớ Khối Không Gian Corsi' },
      { slug: 'sound-localization', name: 'Định Vị Âm Thanh 3D' }
    ]
  }
];

interface CognitiveTheoryAcademyProps {
  onSelectHanoi?: () => void;
}

export const CognitiveTheoryAcademy: React.FC<CognitiveTheoryAcademyProps> = ({ onSelectHanoi }) => {
  const { setSelectedExerciseSlug, setActiveTab } = useAppStore();
  const [selectedAxisId, setSelectedAxisId] = useState<string>('speed-reading');

  const activeAxis = COGNITIVE_AXES_THEORY.find(a => a.id === selectedAxisId) || COGNITIVE_AXES_THEORY[0];
  const Icon = activeAxis.icon;

  const handleStartExercise = (slug: ExerciseSlug) => {
    setSelectedExerciseSlug(slug);
    setActiveTab('exercises');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Academy Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {COGNITIVE_AXES_THEORY.map((axis) => {
          const AxisIcon = axis.icon;
          const isSelected = axis.id === selectedAxisId;
          return (
            <button
              key={axis.id}
              onClick={() => setSelectedAxisId(axis.id)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer btn-press ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                  : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${axis.color} text-white flex items-center justify-center shadow-sm`}>
                <AxisIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-black text-slate-800 dark:text-white line-clamp-1 block">
                  {axis.title.split('. ')[1]?.split(' & ')[0]}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {axis.code}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Axis Deep-Dive Container */}
      <div className="bg-[#FDFBF7] dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#D5CBB9]/60 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${activeAxis.color} text-white flex items-center justify-center shadow-md`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
                {activeAxis.title}
              </h2>
              <p className="text-xs sm:text-sm text-brand-600 dark:text-brand-400 font-bold mt-0.5">
                {activeAxis.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {activeAxis.brainRegions.map((region, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                🧠 {region}
              </span>
            ))}
          </div>
        </div>

        {/* Dedicated Hanoi Map Module Callout */}
        {activeAxis.id === 'spatial-navigation' && onSelectHanoi && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-500 animate-spin-slow shrink-0" />
                <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                  Chuyên Đề Độc Lập: Bản Đồ Nhận Thức Hà Nội (10 Chương Thực Chiến)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Bản đồ vector SVG tương tác đa tầng, 10 chương thực chiến (đọc trục, ô phố, địa chỉ ngõ ngách, lập tuyến phân cấp) và 9 chế độ luyện tập.
              </p>
            </div>
            <button
              onClick={onSelectHanoi}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <span>Mở Chuyên Trang Hà Nội</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Mechanism & Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
              <Brain className="w-4 h-4 text-brand-500" />
              <span>Cơ Chế Thần Kinh Học</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {activeAxis.coreMechanism}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Chứng Cớ Khoa Học Thực Nghiệm</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {activeAxis.scientificInsight}
            </p>
          </div>
        </div>

        {/* Techniques Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Phương Pháp Rèn Luyện Thực Chiến</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeAxis.techniques.map((tech, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-xs font-black text-brand-600 dark:text-brand-400 block">
                  {idx + 1}. {tech.name}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {tech.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Exercises Direct Launch Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-purple-500/10 border border-brand-500/30 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-brand-700 dark:text-brand-300 block">
              Thực Hành Trực Tiếp Trục Này
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Chuyển hóa lý thuyết thành thói quen phản xạ nơ-ron qua các bài tập chuyên biệt
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeAxis.recommendedExercises.map((ex) => (
              <button
                key={ex.slug}
                onClick={() => handleStartExercise(ex.slug)}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all btn-press"
              >
                <span>{ex.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
