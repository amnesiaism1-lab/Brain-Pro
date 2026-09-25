import React, { useState } from 'react';
import { IRdePredictionQuery, IRdePredictionAnswer } from '@brain-exercises/shared';
import { HelpCircle, Brain, Gauge, ArrowRight } from 'lucide-react';

interface PredictionGateOverlayProps {
  query: IRdePredictionQuery;
  onPredictionConfirmed: (answer: IRdePredictionAnswer) => void;
}

export const PredictionGateOverlay: React.FC<PredictionGateOverlayProps> = ({
  query,
  onPredictionConfirmed
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0.8);
  const [startTime] = useState<number>(Date.now());

  const handleConfirm = () => {
    if (!selectedOptionId) return;
    const responseMs = Date.now() - startTime;
    const isCorrect = selectedOptionId === query.correctOptionId;

    onPredictionConfirmed({
      selectedOptionId,
      confidence,
      responseMs,
      isCorrect
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                Pha Mô Phỏng Tâm Trí (Mental Simulation)
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Dự Đoán Chuỗi Động Lực Học</h2>
          </div>
        </div>

        {/* Question */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-medium">
            {query.questionVi}
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Chọn dự đoán của bạn trước khi hành động:
          </label>
          {query.options.map((opt, idx) => {
            const isSelected = selectedOptionId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedOptionId(opt.id)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 font-black'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-sm sm:text-base">{opt.labelVi}</span>
              </button>
            );
          })}
        </div>

        {/* Confidence Selector */}
        <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" />
              Mức độ tự tin vào dự đoán:
            </span>
            <span className="text-cyan-300 font-bold text-sm">
              {Math.round(confidence * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setConfidence(val)}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  confidence === val
                    ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {Math.round(val * 100)}%
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleConfirm}
          disabled={!selectedOptionId}
          className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
            selectedOptionId
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25 cursor-pointer'
              : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
          }`}
        >
          <span>Khóa Dự Đoán & Bắt Đầu Thao Tác</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
