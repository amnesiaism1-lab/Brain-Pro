import React, { useState, useRef, useEffect } from 'react';
import { auditoryEngine } from '../../services/auditoryEngine';
import {
  calculateHarmonicConsonance
} from '@brain-exercises/shared';
import {
  INTERVAL_CATALOG,
  generateOvertoneChallenge,
  generateArticulationChallenge,
  generateMelodicContourChallenge,
  generateCadenceChallenge,
  IOvertoneChallenge,
  IArticulationChallenge,
  IMelodicContourChallenge,
  ICadenceChallenge
} from '../../services/musicTheoryService';
import {
  Music,
  Zap,
  Volume2,
  Sparkles,
  Share2,
  Activity,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface INodePoint {
  id: string;
  note: string;
  freq: number;
  label: string;
  role: string;
  x: number;
  y: number;
}

const NETWORK_NODES: INodePoint[] = [
  { id: 'n-c4', note: 'C4', freq: 261.63, label: 'Đô (Tonic)', role: 'Chủ âm', x: 80, y: 150 },
  { id: 'n-e4', note: 'E4', freq: 329.63, label: 'Mi (3M)', role: 'Quãng 3 Trưởng', x: 200, y: 80 },
  { id: 'n-g4', note: 'G4', freq: 392.00, label: 'Sol (5P)', role: 'Quãng 5 Đúng', x: 320, y: 80 },
  { id: 'n-b4', note: 'B4', freq: 493.88, label: 'Si (7M)', role: 'Dẫn âm (Leading)', x: 440, y: 150 },
  { id: 'n-c5', note: 'C5', freq: 523.25, label: 'Đô 5 (8P)', role: 'Bát độ hoàn mỹ', x: 440, y: 270 },
  { id: 'n-f4', note: 'F4', freq: 349.23, label: 'Fa (4P)', role: 'Hạ át (Subdominant)', x: 320, y: 270 },
  { id: 'n-fsharp', note: 'F#4', freq: 369.99, label: 'Fa Thăng (Tritone)', role: 'Nghịch ma mị', x: 200, y: 270 },
  { id: 'n-d4', note: 'D4', freq: 293.66, label: 'Rê (2M)', role: 'Bậc 2 liền bậc', x: 80, y: 270 }
];

export const SoundNetworkModule: React.FC = () => {
  const { setSelectedExerciseSlug, setActiveTab } = useAppStore();

  // Active Tab within this module
  const [activeSubTab, setActiveSubTab] = useState<'network' | 'overtone' | 'articulation' | 'cadence' | 'contour'>('network');

  // Network State
  const [selectedNodeA, setSelectedNodeA] = useState<INodePoint | null>(null);
  const [selectedNodeB, setSelectedNodeB] = useState<INodePoint | null>(null);
  const [lastIntervalDescription, setLastIntervalDescription] = useState<string | null>(null);

  // Overtone Challenge State
  const [overtoneChallenge, setOvertoneChallenge] = useState<IOvertoneChallenge>(() => generateOvertoneChallenge());
  const [overtoneAnswered, setOvertoneAnswered] = useState<boolean>(false);
  const [selectedOvertoneOption, setSelectedOvertoneOption] = useState<string | null>(null);

  // Articulation Challenge State
  const [articulationChallenge, setArticulationChallenge] = useState<IArticulationChallenge>(() => generateArticulationChallenge());
  const [articulationAnswered, setArticulationAnswered] = useState<boolean>(false);
  const [selectedArticulationOption, setSelectedArticulationOption] = useState<string | null>(null);

  // Cadence Challenge State
  const [cadenceChallenge, setCadenceChallenge] = useState<ICadenceChallenge>(() => generateCadenceChallenge());
  const [cadenceAnswered, setCadenceAnswered] = useState<boolean>(false);
  const [selectedCadenceOption, setSelectedCadenceOption] = useState<string | null>(null);

  // Melodic Contour State
  const [contourChallenge, setContourChallenge] = useState<IMelodicContourChallenge>(() => generateMelodicContourChallenge());
  const [contourAnswered, setContourAnswered] = useState<boolean>(false);
  const [selectedContourOption, setSelectedContourOption] = useState<string | null>(null);

  // Connect Two Nodes & Play Interval
  const handleSelectNetworkNode = (node: INodePoint) => {
    auditoryEngine.playNote(node.freq, 0.45, { volume: 0.35, waveform: 'triangle' });

    if (!selectedNodeA || (selectedNodeA && selectedNodeB)) {
      setSelectedNodeA(node);
      setSelectedNodeB(null);
      setLastIntervalDescription(`Đã chọn nốt gốc: ${node.note} (${node.label}). Hãy chọn nốt tiếp theo để tạo liên kết hòa âm.`);
    } else if (selectedNodeA && !selectedNodeB) {
      if (selectedNodeA.id === node.id) return;
      setSelectedNodeB(node);

      // Calculate semitones
      const semitones = Math.round(12 * Math.log2(node.freq / selectedNodeA.freq));
      const consonanceData = calculateHarmonicConsonance(semitones);

      // Play interval synthesis
      auditoryEngine.playRelationalConnection(selectedNodeA.freq, node.freq, 'SOUND_HARMONIZE');

      setLastIntervalDescription(
        `Liên kết: ${selectedNodeA.note} ⟷ ${node.note} (${Math.abs(semitones)} bán âm) • Tính chất: ${consonanceData.descriptionVi}`
      );
    }
  };

  // Play Overtone Challenge Audio
  const handlePlayOvertone = async () => {
    await auditoryEngine.playOvertoneSpotting(
      overtoneChallenge.baseFreq,
      overtoneChallenge.boostedPartial,
      1.4
    );
  };

  // Play Articulation Challenge Audio
  const handlePlayArticulation = async () => {
    await auditoryEngine.playArticulationSequence(
      articulationChallenge.notes,
      articulationChallenge.articulation,
      0.45
    );
  };

  // Play Cadence Challenge Audio
  const handlePlayCadence = async () => {
    await auditoryEngine.playCadenceProgression(
      cadenceChallenge.cadenceType,
      cadenceChallenge.rootNote
    );
  };

  // Play Contour Audio
  const handlePlayContour = async () => {
    await auditoryEngine.playNoteSequence(contourChallenge.notes, 380, 0.35);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Module Header Card */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-purple-500/30 rounded-3xl shadow-xl text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-purple-300 font-extrabold">
              Khái Niệm 9: Mạng Lưới Nhận Thức Động Học & Cảm Âm Chuyên Sâu
            </span>
            <h2 className="text-2xl font-black text-white">
              Phòng Thí Nghiệm Cảm Âm & Mạng Lưới Hòa Âm (Sound Network Lab)
            </h2>
          </div>
        </div>
        <p className="text-sm text-purple-200/80 max-w-3xl leading-relaxed">
          Âm nhạc không chỉ là những nốt đơn lẻ. Đó là một <b>Mạng Lưới Quan Hệ Động Học (Relational Dynamics)</b> bao gồm bồi âm vật lý (Overtones), cách phát âm (Articulation), tiến trình giải tỏa hòa âm (Cadences), và đường nét hình học giai điệu (Contours).
        </p>

        {/* Sub-Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-purple-500/20">
          <button
            onClick={() => setActiveSubTab('network')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'network'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-purple-200 hover:bg-white/20'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Mạng Hòa Âm (Sound Network)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('overtone')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'overtone'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-purple-200 hover:bg-white/20'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Bồi Âm Học (Overtone Spotting)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('articulation')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'articulation'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-purple-200 hover:bg-white/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Kỹ Thuật Phát Âm (Articulation)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cadence')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'cadence'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-purple-200 hover:bg-white/20'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Tiến Trình Kết Câu (Cadence)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('contour')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'contour'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-purple-200 hover:bg-white/20'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hình Thái Giai Điệu (Contour)</span>
          </button>
        </div>
      </div>

      {/* 1. INTERACTIVE SOUND NETWORK PLAYGROUND */}
      {activeSubTab === 'network' && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-500" />
                Mạng Lưới Nơ-ron Hòa Âm (Interactive Synesthetic Graph)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Chọn lần lượt 2 nốt bất kỳ để nghe hợp âm vang lên và phân tích mức độ thuận / nghịch âm học (Consonance vs Dissonance).
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedNodeA(null);
                setSelectedNodeB(null);
                setLastIntervalDescription(null);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa Lựa Chọn</span>
            </button>
          </div>

          {/* Interactive Graph Canvas Area */}
          <div className="relative w-full h-[360px] bg-slate-950 rounded-2xl border border-purple-500/30 overflow-hidden shadow-inner flex flex-col justify-between p-4">
            {/* SVG Connecting Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {selectedNodeA && selectedNodeB && (
                <line
                  x1={selectedNodeA.x + 35}
                  y1={selectedNodeA.y + 20}
                  x2={selectedNodeB.x + 35}
                  y2={selectedNodeB.y + 20}
                  stroke="#c084fc"
                  strokeWidth={3.5}
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              )}
            </svg>

            {/* Nodes Grid */}
            <div className="relative w-full h-full">
              {NETWORK_NODES.map(node => {
                const isSelectedA = selectedNodeA?.id === node.id;
                const isSelectedB = selectedNodeB?.id === node.id;
                const isHighlighted = isSelectedA || isSelectedB;

                return (
                  <button
                    key={node.id}
                    onClick={() => handleSelectNetworkNode(node)}
                    style={{ left: `${node.x}px`, top: `${node.y}px` }}
                    className={`absolute w-[70px] h-[45px] rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-md active:scale-95 ${
                      isHighlighted
                        ? 'bg-purple-600 border-white text-white scale-110 shadow-[0_0_18px_rgba(192,132,252,0.6)] z-10'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-purple-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-extrabold tracking-wide">{node.note}</span>
                    <span className="text-[9px] text-purple-200/80 font-mono truncate max-w-[62px]">
                      {node.role}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Analysis Pill */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 flex items-center justify-between z-20">
              <span className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{lastIntervalDescription || 'Click vào nốt đầu tiên (ví dụ C4) rồi click nốt thứ hai (ví dụ G4).'}</span>
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setSelectedExerciseSlug('relational-network');
                setActiveTab('exercises');
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
            >
              <span>Vào Game: Mạng Lưới Quan Hệ Động Học</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. OVERTONE SPOTTING STUDIO */}
      {activeSubTab === 'overtone' && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Luyện Nghe Bồi Âm (Overtone Spotting)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Một âm thanh tự nhiên không bao giờ là sóng sine đơn thuần. Nó chứa đựng chuỗi hài âm (Harmonic Series) ở tần số gấp 2, 3, 4, 5 lần tần số gốc.
              </p>
            </div>
            <button
              onClick={() => {
                setOvertoneChallenge(generateOvertoneChallenge());
                setOvertoneAnswered(false);
                setSelectedOvertoneOption(null);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Câu Mới</span>
            </button>
          </div>

          {/* Overtone Challenge Box */}
          <div className="p-5 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Thử Thách: Phân Biệt Hài Âm Nhô Cao
              </span>
              <button
                onClick={handlePlayOvertone}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Phát Âm Sắc Có Hài Âm ({overtoneChallenge.baseNote})</span>
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {overtoneChallenge.questionTextVi}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {overtoneChallenge.options.map(opt => {
                const isSelected = selectedOvertoneOption === opt.id;
                const isCorrect = opt.id === overtoneChallenge.correctAnswerId;

                let style = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-purple-400';
                if (overtoneAnswered) {
                  if (isCorrect) style = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200';
                  else if (isSelected) style = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200';
                }

                return (
                  <button
                    key={opt.id}
                    disabled={overtoneAnswered}
                    onClick={() => {
                      setSelectedOvertoneOption(opt.id);
                      setOvertoneAnswered(true);
                      if (isCorrect) auditoryEngine.playFeedback(true);
                      else auditoryEngine.playFeedback(false);
                    }}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${style}`}
                  >
                    <div>
                      <div className="font-bold">{opt.labelVi}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{opt.intervalNameVi}</div>
                    </div>
                    {overtoneAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {overtoneAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {overtoneAnswered && (
              <p className="text-xs text-purple-700 dark:text-purple-300 bg-purple-100/50 dark:bg-purple-950/50 p-3 rounded-xl border border-purple-200 dark:border-purple-800/60 leading-relaxed">
                {overtoneChallenge.explanationVi}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 3. ARTICULATION LAB */}
      {activeSubTab === 'articulation' && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                Phòng Thí Nghiệm Phát Âm (Articulation Lab)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Khám phá sự khác biệt cốt lõi giữa <b>Legato</b> (nối mượt), <b>Staccato</b> (nảy ngắn), <b>Tenuto</b> (ngân đầy đủ) và <b>Accent</b> (nhấn trọng âm).
              </p>
            </div>
            <button
              onClick={() => {
                setArticulationChallenge(generateArticulationChallenge());
                setArticulationAnswered(false);
                setSelectedArticulationOption(null);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Câu Mới</span>
            </button>
          </div>

          {/* Quick Auditory Demonstrations */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { type: 'legato' as const, label: 'Legato (Liền tiếng)', icon: '〰' },
              { type: 'staccato' as const, label: 'Staccato (Nảy tiếng)', icon: '•' },
              { type: 'tenuto' as const, label: 'Tenuto (Ngân đủ)', icon: '—' },
              { type: 'accent' as const, label: 'Accent (Nhấn mạnh)', icon: '>' }
            ].map(item => (
              <button
                key={item.type}
                onClick={() => auditoryEngine.playArticulationSequence(['C4', 'E4', 'G4', 'C5'], item.type, 0.45)}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-purple-400 text-left transition-all group"
              >
                <div className="text-lg font-bold text-purple-500 mb-1 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.label}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                  <Play className="w-3 h-3 fill-current text-purple-400" /> Nghe thử
                </div>
              </button>
            ))}
          </div>

          {/* Articulation Challenge */}
          <div className="p-5 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Thử Thách: Nhận Diện Kỹ Thuật Phát Âm
              </span>
              <button
                onClick={handlePlayArticulation}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Phát Giai Điệu Bí Mật</span>
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {articulationChallenge.questionTextVi}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {articulationChallenge.options.map(opt => {
                const isSelected = selectedArticulationOption === opt.id;
                const isCorrect = opt.id === articulationChallenge.correctAnswerId;

                let style = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-purple-400';
                if (articulationAnswered) {
                  if (isCorrect) style = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200';
                  else if (isSelected) style = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200';
                }

                return (
                  <button
                    key={opt.id}
                    disabled={articulationAnswered}
                    onClick={() => {
                      setSelectedArticulationOption(opt.id);
                      setArticulationAnswered(true);
                      if (isCorrect) auditoryEngine.playFeedback(true);
                      else auditoryEngine.playFeedback(false);
                    }}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${style}`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="text-purple-500">{opt.icon}</span>
                        <span>{opt.labelVi}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{opt.descriptionVi}</div>
                    </div>
                    {articulationAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {articulationAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {articulationAnswered && (
              <p className="text-xs text-purple-700 dark:text-purple-300 bg-purple-100/50 dark:bg-purple-950/50 p-3 rounded-xl border border-purple-200 dark:border-purple-800/60 leading-relaxed">
                {articulationChallenge.explanationVi}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4. CADENCE & HARMONIC RESOLUTION LAB */}
      {activeSubTab === 'cadence' && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-500" />
                Tiến Trình Kết Câu (Cadence Resolution)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tai người luôn kỳ vọng sự giải tỏa căng thẳng hòa âm (Harmonic Expectancy). Các tiến trình kết thúc quyết định cảm giác trọn vẹn, lửng lơ hay hụt hẫng.
              </p>
            </div>
            <button
              onClick={() => {
                setCadenceChallenge(generateCadenceChallenge());
                setCadenceAnswered(false);
                setSelectedCadenceOption(null);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Câu Mới</span>
            </button>
          </div>

          {/* Cadence Challenge Box */}
          <div className="p-5 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Thử Thách: Cảm Nhận Tính Chất Kết Câu
              </span>
              <button
                onClick={handlePlayCadence}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Phát Tiến Trình Hợp Âm</span>
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {cadenceChallenge.questionTextVi}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {cadenceChallenge.options.map(opt => {
                const isSelected = selectedCadenceOption === opt.id;
                const isCorrect = opt.id === cadenceChallenge.correctAnswerId;

                let style = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-purple-400';
                if (cadenceAnswered) {
                  if (isCorrect) style = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200';
                  else if (isSelected) style = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200';
                }

                return (
                  <button
                    key={opt.id}
                    disabled={cadenceAnswered}
                    onClick={() => {
                      setSelectedCadenceOption(opt.id);
                      setCadenceAnswered(true);
                      if (isCorrect) auditoryEngine.playFeedback(true);
                      else auditoryEngine.playFeedback(false);
                    }}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${style}`}
                  >
                    <div>
                      <div className="font-bold">{opt.labelVi}</div>
                      <div className="text-[11px] font-mono text-purple-600 dark:text-purple-300 font-bold">{opt.romanVi}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{opt.feelVi}</div>
                    </div>
                    {cadenceAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {cadenceAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {cadenceAnswered && (
              <p className="text-xs text-purple-700 dark:text-purple-300 bg-purple-100/50 dark:bg-purple-950/50 p-3 rounded-xl border border-purple-200 dark:border-purple-800/60 leading-relaxed">
                {cadenceChallenge.explanationVi}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 5. MELODIC CONTOUR EXPLORER */}
      {activeSubTab === 'contour' && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-500" />
                Đường Nét Giai Điệu (Melodic Contour & Parsons Code)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Bộ não ghi nhớ hình thái chuyển động (Lên, Xuống, Vòm Cầu) trước khi nhớ từng cao độ tuyệt đối.
              </p>
            </div>
            <button
              onClick={() => {
                setContourChallenge(generateMelodicContourChallenge());
                setContourAnswered(false);
                setSelectedContourOption(null);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Câu Mới</span>
            </button>
          </div>

          {/* Contour Challenge Box */}
          <div className="p-5 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Thử Thách: Nhận Diện Hình Thái Đường Đi
              </span>
              <button
                onClick={handlePlayContour}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Phát Chuỗi Giai Điệu 5 Nốt</span>
              </button>
            </div>

            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {contourChallenge.questionTextVi}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {contourChallenge.options.map(opt => {
                const isSelected = selectedContourOption === opt.id;
                const isCorrect = opt.id === contourChallenge.correctAnswerId;

                let style = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-purple-400';
                if (contourAnswered) {
                  if (isCorrect) style = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-200';
                  else if (isSelected) style = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-200';
                }

                return (
                  <button
                    key={opt.id}
                    disabled={contourAnswered}
                    onClick={() => {
                      setSelectedContourOption(opt.id);
                      setContourAnswered(true);
                      if (isCorrect) auditoryEngine.playFeedback(true);
                      else auditoryEngine.playFeedback(false);
                    }}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${style}`}
                  >
                    <div>
                      <div className="font-bold">{opt.labelVi}</div>
                      <div className="text-sm font-mono text-purple-600 dark:text-purple-300 font-bold mt-0.5">{opt.asciiShape}</div>
                    </div>
                    {contourAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {contourAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {contourAnswered && (
              <p className="text-xs text-purple-700 dark:text-purple-300 bg-purple-100/50 dark:bg-purple-950/50 p-3 rounded-xl border border-purple-200 dark:border-purple-800/60 leading-relaxed">
                {contourChallenge.explanationVi}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
