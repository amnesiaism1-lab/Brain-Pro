import React, { useState } from 'react';
import {
  Upload,
  Sparkles,
  ArrowRight,
  Repeat,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { IVocalAnalysisResult, IVocalPhrase } from '../../../services/vocalFileAnalysisService';
import { DifficultyBadge } from '../components/DifficultyBadge';

interface AnalysisTabProps {
  analysisResult: IVocalAnalysisResult | null;
  isAnalyzing: boolean;
  analyzeProgress: number;
  analyzeStatusText: string;
  onFileSelected: (file: File) => void;
  onLoadDemoTrack: (preset: 'scale' | 'ballad' | 'pentatonic') => void;
  onNavigateToSingAlong: () => void;
  onLoopPhrase: (phrase: IVocalPhrase) => void;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  analysisResult,
  isAnalyzing,
  analyzeProgress,
  analyzeStatusText,
  onFileSelected,
  onLoadDemoTrack,
  onNavigateToSingAlong,
  onLoopPhrase,
}) => {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Drag & Drop Upload Card */}
      <div
        className={`relative rounded-3xl border-2 border-dashed p-6 text-center transition-all ${
          isDraggingFile
            ? 'border-sky-400 bg-sky-950/30'
            : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-600'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingFile(false);
          if (e.dataTransfer.files?.[0]) onFileSelected(e.dataTransfer.files[0]);
        }}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Kéo thả file âm thanh Vocal của bạn vào đây
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Hỗ trợ các định dạng: MP3, WAV, M4A, OGG, FLAC (Tối đa 50MB)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
            <label className="cursor-pointer px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition shadow-md">
              <span>Chọn file từ máy tính</span>
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) onFileSelected(e.target.files[0]);
                }}
              />
            </label>

            {/* Demo Tracks Picker */}
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
              <span className="text-[11px] text-slate-400">Hoặc thử ngay bản mẫu:</span>
              <button
                type="button"
                onClick={() => onLoadDemoTrack('scale')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-semibold hover:bg-slate-700 transition"
              >
                Khởi Động Đô Trưởng
              </button>
              <button
                type="button"
                onClick={() => onLoadDemoTrack('ballad')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-semibold hover:bg-slate-700 transition"
              >
                Pop Ballad
              </button>
              <button
                type="button"
                onClick={() => onLoadDemoTrack('pentatonic')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-semibold hover:bg-slate-700 transition"
              >
                Ngũ Cung
              </button>
            </div>
          </div>
        </div>

        {/* Premium Multi-Stage DSP Pipeline Overlay */}
        {isAnalyzing && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
            <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl space-y-6">
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <div className="absolute -inset-1 rounded-2xl bg-sky-400/20 animate-pulse -z-10" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">AI Pitch Coach đang xử lý chuyên sâu</h3>
                <p className="text-xs text-sky-400 font-medium mt-1 animate-pulse">
                  {analyzeStatusText}
                </p>
              </div>

              {/* Glowing Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 rounded-full transition-all duration-300 shadow-md shadow-sky-400/30"
                    style={{ width: `${Math.max(5, analyzeProgress)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>Tiến trình giải mã âm học NewTone</span>
                  <span className="font-bold text-sky-300">{analyzeProgress}%</span>
                </div>
              </div>

              {/* 5-Stage Checklist */}
              <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 text-left space-y-2.5 text-xs font-mono">
                <div className={`flex items-center gap-2 ${analyzeProgress >= 20 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                  <span>{analyzeProgress >= 20 ? '✓' : '○'}</span>
                  <span>Tách kênh vocal trung tâm (Mid-Side Stereo)</span>
                </div>
                <div className={`flex items-center gap-2 ${analyzeProgress >= 30 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                  <span>{analyzeProgress >= 30 ? '✓' : '○'}</span>
                  <span>Lọc 4th-Order Biquad dải tần (95Hz - 880Hz)</span>
                </div>
                <div className={`flex items-center gap-2 ${analyzeProgress >= 75 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                  <span>{analyzeProgress >= 75 ? '✓' : '○'}</span>
                  <span>Quét phổ cao độ MPM độ phân giải cao (Hop 512)</span>
                </div>
                <div className={`flex items-center gap-2 ${analyzeProgress >= 85 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                  <span>{analyzeProgress >= 85 ? '✓' : '○'}</span>
                  <span>Cầu nối phụ âm & Triệt tiêu nhiễu kích âm NewTone</span>
                </div>
                <div className={`flex items-center gap-2 ${analyzeProgress >= 95 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                  <span>{analyzeProgress >= 95 ? '✓' : '○'}</span>
                  <span>Giải mã Viterbi HMM & Phân đoạn Note Blocks</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Analysis Overview Cards */}
      {analysisResult && (
        <>
          {/* Action: Enter Singing Room Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-sky-950/60 via-indigo-950/60 to-emerald-950/60 border border-sky-500/40 shadow-xl">
            <div className="space-y-1">
              <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Phân tích hoàn tất! Đã trích xuất {analysisResult.noteBars.length} nốt NewTone & {analysisResult.phrases.length} câu hát</span>
              </div>
              <p className="text-xs text-slate-300">
                Đường băng cao độ đã căn chỉnh chuẩn 0ms độ trễ. Bấm nút để bắt đầu luyện hát ngay!
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToSingAlong}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs sm:text-sm hover:from-emerald-400 hover:to-teal-300 transition shadow-lg flex items-center gap-2 shrink-0 active:scale-95"
            >
              <span>Vào Phòng Luyện Hát</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Giọng / Âm Giai (Key)
              </span>
              <div className="text-sm sm:text-base font-black text-sky-400 mt-0.5 truncate">
                {analysisResult.estimatedKey.key}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Độ tin cậy: {Math.round(analysisResult.estimatedKey.confidence * 100)}%
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Quãng Bài Hát (Song Range)
              </span>
              <div className="text-sm sm:text-base font-black text-emerald-400 mt-0.5">
                {analysisResult.vocalRange.lowestNote} – {analysisResult.vocalRange.highestNote}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {analysisResult.vocalRange.spanSemitones} bán âm ({analysisResult.vocalRange.recommendedVoiceType})
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Độ Khó Tổng Thể
              </span>
              <div className="mt-1">
                <DifficultyBadge difficulty={analysisResult.vocalMetrics.overallDifficulty} size="md" />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Bước nhảy lớn: {analysisResult.vocalMetrics.maxIntervalSemitones} bán âm
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Số Câu Hát (Phrases)
              </span>
              <div className="text-sm sm:text-base font-black text-indigo-400 mt-0.5">
                {analysisResult.phrases.length} câu
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Thời lượng: {Math.round(analysisResult.durationMs / 1000)}s
              </div>
            </div>
          </div>

          {/* 3. Practice Roadmap */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-950/60 to-slate-950/80 border border-indigo-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Kế Hoạch Luyện Tập Đề Xuất
                </h4>
              </div>
              <button
                type="button"
                onClick={onNavigateToSingAlong}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition shadow-md"
              >
                <span>Vào Phòng Luyện Hát</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4">{analysisResult.practicePlan.summaryVi}</p>

            <div className="space-y-2.5">
              {analysisResult.practicePlan.recommendedSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {step.stepNumber}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{step.title}</div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {step.description}
                      </p>
                      {step.focusNotes && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] text-slate-500">Nốt trọng tâm:</span>
                          {step.focusNotes.map((n) => (
                            <span
                              key={n}
                              className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-sky-300"
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {step.targetPhraseIndex && (
                    <button
                      type="button"
                      onClick={() => {
                        const phrase = analysisResult.phrases.find(
                          (p) => p.phraseIndex === step.targetPhraseIndex
                        );
                        if (phrase) onLoopPhrase(phrase);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[11px] font-bold hover:bg-indigo-500/30 transition shrink-0 flex items-center gap-1"
                    >
                      <Repeat className="w-3 h-3" />
                      <span>Lặp Câu Này</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. Coach Guide */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHelpGuide(!showHelpGuide)}
              className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-slate-300 hover:text-white transition"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>Bí quyết luyện hát đạt điểm cao cùng AI Coach</span>
              </div>
              {showHelpGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHelpGuide && (
              <div className="p-4 pt-0 text-xs text-slate-400 space-y-2 border-t border-slate-800/60">
                <p>
                  • <strong>Khoảng cách Micro:</strong> Đặt micro cách miệng từ 15 – 20cm, tránh thổi hơi trực tiếp vào đầu thu.
                </p>
                <p>
                  • <strong>Tư thế & Lấy hơi:</strong> Đứng hoặc ngồi thẳng lưng, hít sâu bằng cơ hoành để giữ cột hơi ổn định.
                </p>
                <p>
                  • <strong>Đường băng Pitch Runway:</strong> Giữ quỹ đạo hát của bạn đè khớp dải nốt tím chuẩn trên màn hình.
                </p>
                <p>
                  • <strong>Smart Octave-Fold:</strong> Cho phép giọng Nam và Nữ hát cùng nhau không bị trừ điểm vì lệch quãng 8.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
