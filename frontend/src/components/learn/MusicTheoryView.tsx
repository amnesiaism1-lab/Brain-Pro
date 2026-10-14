import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { NotesAndPitchModule } from './NotesAndPitchModule';
import { IntervalsModule } from './IntervalsModule';
import { ChordsModule } from './ChordsModule';
import { ScalesModule } from './ScalesModule';
import { RhythmModule } from './RhythmModule';
import { TimbreModule } from './TimbreModule';
import { SpatialAudioModule } from './SpatialAudioModule';
import { PolyphonyModule } from './PolyphonyModule';
import { SoundNetworkModule } from './SoundNetworkModule';
import { MidiStatusIndicator } from '../ui/MidiStatusIndicator';
import {
  THEORY_MODULE_MAP,
  TheoryModuleId
} from './theoryExerciseMap';
import {
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Brain,
  ArrowRight,
  Sparkles,
  Zap,
  Mic,
  Eye,
  Award
} from 'lucide-react';

interface ITheoryTabItem {
  id: TheoryModuleId;
  title: string;
  shortTitle: string;
  icon: string;
  component: React.ComponentType;
}

interface INeuralInsight {
  brainRegion: string;
  neuralMechanism: string;
  rftRule: string;
  farTransferBenefits: string[];
  cognitivePill: string;
}

const NEURAL_INSIGHTS_MAP: Record<TheoryModuleId, INeuralInsight> = {
  notes: {
    brainRegion: "Vỏ Não Thính Giác Sơ Cấp (A1 / Heschl's Gyrus) & Planum Temporale",
    neuralMechanism: "Lập bản đồ phân giải tần số (Tonotopic Frequency Mapping) và mã hóa chuỗi thời gian nơ-ron (Phase Locking).",
    rftRule: "ORDER_SEQUENCE · Phân định Thứ tự Chuỗi & Cao độ vi sai",
    farTransferBenefits: [
      "Mở rộng dung lượng Trí nhớ làm việc âm học (Phonological Working Memory Span)",
      "Tăng độ nhạy phát hiện ngữ điệu và sắc thái biểu cảm trong giọng nói giao tiếp",
      "Hỗ trợ phân biệt âm vị tinh tế khi học ngoại ngữ mới"
    ],
    cognitivePill: "Working Memory & Pitch Discrimination"
  },
  intervals: {
    brainRegion: "Hồi Thái Dương Trên (Superior Temporal Gyrus - STG) & Hồi Cạnh Đỉnh (Intraparietal Sulcus)",
    neuralMechanism: "Đo lường khoảng cách logarithm giữa 2 tần số và đánh giá tính thuận / nghịch thần kinh (Consonance vs Dissonance).",
    rftRule: "SIMILARITY_DIFF · So sánh khoảng cách vi sai & Quan hệ tỉ lệ",
    farTransferBenefits: [
      "Nâng cao năng lực so sánh vi sai logic và ước lượng khoảng cách không gian trừu tượng",
      "Tăng cường khả năng nhận diện ngữ điệu thăng trầm (Prosody) khi đàm phán",
      "Tạo mỏ neo trí nhớ liên tưởng ngữ nghĩa (Semantic Associative Memory) qua bài hát kinh điển"
    ],
    cognitivePill: "Relational Distance & Emotional Prosody"
  },
  chords: {
    brainRegion: "Vỏ Não Trán Trước Bụng Bên (VLPFC - BA 44/47) & Thùy Đỉnh Dưới",
    neuralMechanism: "Phân tích cấu trúc khuôn hình chồng âm đồng thời (Harmonic Pattern Recognition & Completion).",
    rftRule: "IDENTITY_MATCH · Nhận diện mẫu đồng nhất & Tiến trình giải quyết",
    farTransferBenefits: [
      "Gia tăng năng lực nhận diện quy luật và dự đoán bối cảnh đa biến số",
      "Khả năng đọc hiểu cảm xúc tổng thể (Emotional Holistic Processing) của tình huống",
      "Phát triển tư duy phân tầng cấu trúc (Hierarchical Chunking) trong học tập"
    ],
    cognitivePill: "Pattern Completion & Harmonic Intuition"
  },
  scales: {
    brainRegion: "Mạng Lưới Dự Đoán Cú Pháp Thần Kinh (Anterior STG & Frontal Operculum)",
    neuralMechanism: "Thiết lập mô hình tiên đoán âm giai (Hierarchical Predictive Coding) và kích hoạt sóng âm Mismatch Negativity (MMN) khi có nốt lạ.",
    rftRule: "CONTEXT_MEANING · Ngữ cảnh cú pháp & Ức chế nốt ngoại điệu",
    farTransferBenefits: [
      "Tăng tốc độ phát hiện lỗi logic trong lập trình, văn bản và phân tích dữ liệu",
      "Cải thiện khả năng ức chế phản ứng sai lệch (Cognitive Inhibition Control)",
      "Thích ứng linh hoạt với các hệ thống quy tắc tư duy mới (Cognitive Flexibility)"
    ],
    cognitivePill: "Predictive Syntax & Error Detection"
  },
  rhythm: {
    brainRegion: "Hạch Nền (Basal Ganglia), Tiểu Não (Cerebellum) & Vỏ Não Vận Động Phụ (SMA)",
    neuralMechanism: "Đồng bộ hóa nhịp sinh học thần kinh (Neural Entrainment) và bù trừ sai số thời gian nội tại (Sub-second Timing Precision).",
    rftRule: "TEMPORAL_PREDICT · Dự đoán khoảng thời gian & Điểm nhấn phách",
    farTransferBenefits: [
      "Đồng bộ hóa nhịp quét mắt giật (Saccadic Eye Movement) khi đọc sách tốc độ cao (Speed Reading)",
      "Kiểm soát nhịp độ tư duy, giảm tính bốc đồng và tăng tính kỷ luật hành vi",
      "Tăng cường độ chính xác vận động tinh (Fine Motor Precision) và phản xạ thao tác"
    ],
    cognitivePill: "Saccadic Speed Reading & Temporal Entrainment"
  },
  timbre: {
    brainRegion: "Vỏ Não Thính Giác Thứ Cấp (Belt & Parabelt Areas) & Vùng Xử Lý Âm Phổ",
    neuralMechanism: "Tách lọc cấu trúc phong bì động năng lượng (ADSR Envelope) và nhận dạng dấu vân tay phổ âm hài (Harmonic Centroid).",
    rftRule: "SIMILARITY_DIFF · Phân tích sắc thái & Cấu trúc bội âm",
    farTransferBenefits: [
      "Tăng độ nhạy phát hiện tín hiệu cảnh báo vi mô trong môi trường thực",
      "Nhận biết dấu hiệu tâm lý căng thẳng/mệt mỏi qua vi biến thiên chất giọng",
      "Nâng cao năng lực thẩm mỹ thị giác - thính giác đa giác quan (Cross-modal Sensitivity)"
    ],
    cognitivePill: "Spectral Analysis & Acoustic Fingerprinting"
  },
  spatial: {
    brainRegion: "Trục Củ Não Dưới (Inferior Colliculus), Thùy Đỉnh Sau & Mạng Lưới Không Gian Thị-Thính Giác",
    neuralMechanism: "Tính toán độ lệch thời gian giữa 2 tai (ITD < 0.7ms) và độ lệch cường độ (ILD) để dựng bản đồ lập thể 3D.",
    rftRule: "TARGET_POSITION · Định vị tọa độ mục tiêu trong không gian 3 chiều",
    farTransferBenefits: [
      "Tăng cường khả năng định hướng không gian (Spatial Orientation) và phản xạ khi lái xe",
      "Hỗ trợ tư duy hình học không gian 3D và tưởng tượng vật thể chuyển động",
      "Mở rộng trường chú ý ngoại vi (Peripheral Attention Field) giúp cảnh giác an toàn"
    ],
    cognitivePill: "Spatial Navigation & Microsecond ITD Tuning"
  },
  polyphony: {
    brainRegion: "Mạng Điều Hành Trán-Đỉnh (Dorsolateral PFC & Intraparietal Sulcus)",
    neuralMechanism: "Phân rã quang cảnh thính giác (Auditory Scene Analysis) và lọc nhiễu tập trung có chủ đích (Cocktail Party Selective Filtering).",
    rftRule: "TARGET_DISTRACTOR · Khóa chặt bè mục tiêu & Triệt tiêu nhiễu phân tâm",
    farTransferBenefits: [
      "Duy trì tập trung sâu (Deep Work / Hyper-focus) ngay cả trong không gian văn phòng mở hoặc quán cafe ồn ào",
      "Khả năng phân tách đa luồng thông tin (Executive Cognitive Flexibility) mà không bị quá tải",
      "Gia tăng năng lực lắng nghe thấu cảm đa chiều trong các cuộc họp nhiều người"
    ],
    cognitivePill: "Selective Focus & Cocktail Party Noise Immunity"
  },
  'sound-network': {
    brainRegion: "Mạng Lưới Thần Kinh Tích Hợp Đa Vùng (Frontoparietal & Default Mode Network Integration)",
    neuralMechanism: "Tổng hợp trực giác đa biến (Cross-modal Synesthetic Binding) kết nối tần số, quãng âm, màu sắc và chuyển động hình học.",
    rftRule: "RULE_ACTION · Ma trận luật hòa âm & Đồ thị nơ-ron liên kết",
    farTransferBenefits: [
      "Thúc đẩy tư duy hệ thống trực giác (Systems Thinking & Holistic Problem Solving)",
      "Kích thích năng lực sáng tạo đột phá nhờ liên kết các miền tri thức phi tuyến tính",
      "Nâng tầm nhận thức thính giác lên mức cảm âm tuyệt đối / tương đối chuyên sâu"
    ],
    cognitivePill: "Systems Thinking & Synesthetic Cross-Mapping"
  }
};

const THEORY_TABS: ITheoryTabItem[] = [
  { id: 'notes', title: '1. Nốt Nhạc & Cao Độ', shortTitle: '1. Nốt & Cao Độ', icon: '🎹', component: NotesAndPitchModule },
  { id: 'intervals', title: '2. Quãng Âm (Intervals)', shortTitle: '2. Quãng Âm', icon: '🎼', component: IntervalsModule },
  { id: 'chords', title: '3. Hợp Âm (Chords)', shortTitle: '3. Hợp Âm', icon: '🎶', component: ChordsModule },
  { id: 'scales', title: '4. Âm Giai & Điệu Thức', shortTitle: '4. Âm Giai', icon: '🎵', component: ScalesModule },
  { id: 'rhythm', title: '5. Nhịp Điệu & Phách', shortTitle: '5. Nhịp Điệu', icon: '🥁', component: RhythmModule },
  { id: 'timbre', title: '6. Âm Sắc (Timbre)', shortTitle: '6. Âm Sắc', icon: '🎸', component: TimbreModule },
  { id: 'spatial', title: '7. Âm Thanh 3D Không Gian', shortTitle: '7. 3D Không Gian', icon: '🔊', component: SpatialAudioModule },
  { id: 'polyphony', title: '8. Đa Thanh & Bè Phối', shortTitle: '8. Đa Thanh & Bè', icon: '🪈', component: PolyphonyModule },
  { id: 'sound-network', title: '9. Mạng Lưới Hòa Âm & Cảm Âm Nâng Cao', shortTitle: '9. Mạng Hòa Âm & Cảm Âm', icon: '⚡', component: SoundNetworkModule },
];

export const MusicTheoryView: React.FC = () => {
  const {
    setActiveTab,
    activeTheoryModuleId,
    setActiveTheoryModuleId,
    setSelectedExerciseSlug,
    getExerciseLevel,
    theoryHighlightEntity,
    setTheoryHighlightEntity,
    masteredTheoryModules
  } = useAppStore();

  const [activeModuleId, setActiveModuleId] = useState<TheoryModuleId>(() => {
    try {
      const saved = localStorage.getItem('be_last_theory_module');
      if (saved && THEORY_TABS.some(t => t.id === saved)) {
        return saved as TheoryModuleId;
      }
    } catch {}
    return 'notes';
  });

  const [showBrainInsights, setShowBrainInsights] = useState(true);

  useEffect(() => {
    if (activeTheoryModuleId && THEORY_TABS.some(t => t.id === activeTheoryModuleId)) {
      setActiveModuleId(activeTheoryModuleId as TheoryModuleId);
      setActiveTheoryModuleId(null);
    }
  }, [activeTheoryModuleId, setActiveTheoryModuleId]);

  const [completedModules, setCompletedModules] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('be_completed_theory_modules');
      return saved ? JSON.parse(saved) : ['notes'];
    } catch {
      return ['notes'];
    }
  });

  const currentIndex = THEORY_TABS.findIndex(t => t.id === activeModuleId);
  const currentTab = THEORY_TABS[currentIndex] || THEORY_TABS[0];
  const ActiveComponent = currentTab.component;
  const currentMeta = THEORY_MODULE_MAP[activeModuleId] || THEORY_MODULE_MAP.notes;
  const currentInsight = NEURAL_INSIGHTS_MAP[activeModuleId] || NEURAL_INSIGHTS_MAP.notes;

  // Determine mastery for a given module: either explicitly marked, or primary exercise level >= 2
  const isModuleMastered = (id: TheoryModuleId): boolean => {
    if (masteredTheoryModules.includes(id)) return true;
    const meta = THEORY_MODULE_MAP[id];
    if (!meta) return false;
    const level = getExerciseLevel(meta.primarySlug);
    return level >= 2;
  };

  const masteredCount = THEORY_TABS.filter(t => isModuleMastered(t.id)).length;
  const progressPercent = Math.round((masteredCount / THEORY_TABS.length) * 100);

  const handleSelectModule = (id: TheoryModuleId) => {
    setActiveModuleId(id);
    try {
      localStorage.setItem('be_last_theory_module', id);
      if (!completedModules.includes(id)) {
        const next = [...completedModules, id];
        setCompletedModules(next);
        localStorage.setItem('be_completed_theory_modules', JSON.stringify(next));
      }
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (currentIndex < THEORY_TABS.length - 1) {
      handleSelectModule(THEORY_TABS[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      handleSelectModule(THEORY_TABS[currentIndex - 1].id);
    }
  };

  const handleStartPrimaryExercise = () => {
    setSelectedExerciseSlug(currentMeta.primarySlug);
    setActiveTab('exercises');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-12">
      {/* Highlight Banner if navigating from a wrong-answer remediation */}
      {theoryHighlightEntity && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs sm:text-sm animate-pulse">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-amber-900 dark:text-amber-200">
              Đang xem cẩm nang ôn tập cho thực thể: <strong>{theoryHighlightEntity}</strong> — Hãy thử tương tác núm vặn bên dưới để nhận biết rõ sự khác biệt!
            </span>
          </div>
          <button
            onClick={() => setTheoryHighlightEntity(null)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold shrink-0 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Lý Thuyết & Khuôn Hình Âm Thanh
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                  Interactive Ear Academy
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Hiểu bản chất sóng âm, vặn thử thuộc tính và rèn luyện năng lực nhận thức thính giác trước khi làm bài
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <MidiStatusIndicator />
            {/* Contextual CTA for active module */}
            <button
              onClick={handleStartPrimaryExercise}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-brand-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Brain className="w-4 h-4" />
              <span>{currentMeta.ctaLabelVi}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cognitive & Mastery Sub-bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Trọng tâm nhận thức:</span>
            <span className="px-2.5 py-0.5 rounded-full font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
              {currentMeta.relationBadgeVi}
            </span>
          </div>

          {/* Academy Mastery Progress */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>Tiến độ làm chủ:</span>
              <strong className="text-slate-900 dark:text-white font-mono">{masteredCount}/9 chương ({progressPercent}%)</strong>
            </div>
            <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* COGNITIVE MECHANISM & FAR-TRANSFER BRAIN BENEFITS PANEL */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/25 p-5 sm:p-6 text-white shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  Cơ Chế Thần Kinh & Lợi Ích Nhận Thức Chuyển Di Xa
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-mono text-indigo-300 font-bold">
                  {currentInsight.cognitivePill}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lợi ích rèn luyện não bộ cho chương: <strong>{currentTab.title}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowBrainInsights(!showBrainInsights)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{showBrainInsights ? 'Thu gọn phân tích' : 'Xem chi tiết lợi ích não bộ'}</span>
          </button>
        </div>

        {showBrainInsights && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1 animate-fadeIn">
            {/* Brain Region Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-indigo-500/20 space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-bold block">
                🧠 Vùng Não Bộ Tham Gia
              </span>
              <p className="text-xs font-semibold text-slate-200 leading-snug">
                {currentInsight.brainRegion}
              </p>
              <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                {currentInsight.neuralMechanism}
              </p>
            </div>

            {/* RFT Cognitive Rule Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/20 space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold block">
                📐 Khung Quan Hệ Nhận Thức (RFT)
              </span>
              <p className="text-xs font-semibold text-purple-200 leading-snug font-mono">
                {currentInsight.rftRule}
              </p>
              <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                Rèn luyện khả năng trừu tượng hóa tín hiệu sóng âm thành cấu trúc quan hệ ngữ nghĩa trong tư duy nhận thức.
              </p>
            </div>

            {/* Far-Transfer Cognitive Benefits Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/20 space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                🚀 Lợi Ích Chuyển Di Ngoài Âm Nhạc
              </span>
              <ul className="space-y-1 text-[11px] text-slate-300 leading-relaxed">
                {currentInsight.farTransferBenefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✦</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Module Navigation Tabs with 3-tier status */}
      <div className="relative">
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="flex gap-2 min-w-max">
            {THEORY_TABS.map((tab) => {
              const isActive = activeModuleId === tab.id;
              const isMastered = isModuleMastered(tab.id);
              const isVisited = completedModules.includes(tab.id);

              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectModule(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 ring-2 ring-brand-400'
                      : isMastered
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/70'
                      : isVisited
                      ? 'bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                      : 'bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.shortTitle}</span>

                  {/* Status Indicator */}
                  {isMastered ? (
                    <CheckCircle className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                  ) : isVisited ? (
                    <Eye className={`w-3 h-3 ${isActive ? 'text-white/70' : 'text-slate-400'}`} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Module Content */}
      <main className="w-full">
        <ActiveComponent />
      </main>

      {/* Bottom Step Navigation Bar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl shadow-sm">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            currentIndex === 0
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95 cursor-pointer'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Bài trước</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500">
            Chương {currentIndex + 1} / {THEORY_TABS.length}
          </span>
          {isModuleMastered(activeModuleId) && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              <CheckCircle className="w-3 h-3" /> Đã làm chủ
            </span>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === THEORY_TABS.length - 1}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            currentIndex === THEORY_TABS.length - 1
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : 'bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 active:scale-95 cursor-pointer'
          }`}
        >
          <span>Bài tiếp theo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

