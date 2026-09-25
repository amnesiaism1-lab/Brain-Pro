import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import {
  IGraphMemoryLevel,
  IGraphMemoryQuery,
  GRAPH_MEMORY_SAMPLE_LEVELS,
  IRelationEvent,
  IRawMetricsJson
} from '@brain-exercises/shared';
import {
  Share2,
  Clock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Brain,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const GraphMemoryMatrixGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const effectiveLevel = getExerciseLevel('graph-memory-matrix') || currentLevel || 1;

  const challenge: IGraphMemoryLevel =
    GRAPH_MEMORY_SAMPLE_LEVELS.find(c => c.level === effectiveLevel) ||
    GRAPH_MEMORY_SAMPLE_LEVELS[0];

  // Game States
  // Phases: 'MEMORIZING' -> 'QUERYING' -> 'FINISHED'
  const [phase, setPhase] = useState<'MEMORIZING' | 'QUERYING' | 'FINISHED'>('MEMORIZING');
  const [memorizeCountdown, setMemorizeCountdown] = useState<number>(challenge.memorizeDurationSec);
  const [currentQueryIndex, setCurrentQueryIndex] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Ghi nhớ toàn bộ mạng lưới liên kết trước khi chúng biến mất!');

  const relationEventsRef = useRef<IRelationEvent[]>([]);
  const queryStartTimeRef = useRef<number>(Date.now());

  const currentQuery: IGraphMemoryQuery = challenge.queries[currentQueryIndex] || challenge.queries[0];

  // Reset or initialize
  const initLevel = useCallback(() => {
    setPhase('MEMORIZING');
    setMemorizeCountdown(challenge.memorizeDurationSec);
    setCurrentQueryIndex(0);
    setSelectedOptionId(null);
    setIsAnswered(false);
    setScore(0);
    setCorrectAnswersCount(0);
    setStatusMessage('Ghi nhớ toàn bộ mạng lưới liên kết trước khi chúng biến mất!');
    relationEventsRef.current = [];
  }, [challenge]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  // Memorization Timer
  useEffect(() => {
    if (phase !== 'MEMORIZING') return;

    const interval = setInterval(() => {
      setMemorizeCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase('QUERYING');
          queryStartTimeRef.current = Date.now();
          playSound('click');
          setStatusMessage('Đường liên kết đã bị ẩn! Hãy trả lời câu hỏi cấu trúc.');
          return 0;
        }
        return Math.round((prev - 0.5) * 10) / 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [phase, playSound]);

  // Handle Option Select
  const handleSelectOption = (optionId: string) => {
    if (isAnswered || phase !== 'QUERYING') return;
    const responseMs = Date.now() - queryStartTimeRef.current;
    const isCorrect = optionId === currentQuery.correctOptionId;

    setSelectedOptionId(optionId);
    setIsAnswered(true);

    if (isCorrect) {
      playSound('correct');
      setScore(s => s + 50);
      setCorrectAnswersCount(c => c + 1);
      setStatusMessage('Chính xác! Mô hình cấu trúc trong trí nhớ của bạn rất sắc bén.');
    } else {
      playSound('wrong');
      setStatusMessage('Chưa đúng! ' + currentQuery.explanationVi);
    }

    relationEventsRef.current.push({
      t: responseMs / 1000,
      exerciseSlug: 'graph-memory-matrix',
      level: effectiveLevel,
      trialId: `graph-${currentQuery.id}-${Date.now()}`,
      relationId: 'ORDER_SEQUENCE',
      relationWeight: 0.9,
      entities: { selected: optionId, correct: currentQuery.correctOptionId },
      stateBefore: 'EDGES_HIDDEN',
      stateAfter: 'ANSWERED',
      responseMs,
      correct: isCorrect
    });
  };

  // Next Query or Finish
  const handleNext = () => {
    if (currentQueryIndex < challenge.queries.length - 1) {
      setCurrentQueryIndex(idx => idx + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
      queryStartTimeRef.current = Date.now();
      setStatusMessage('Tiếp tục trả lời câu hỏi cấu trúc kế tiếp.');
    } else {
      setPhase('FINISHED');
      playSound('victory');
    }
  };

  const rawMetricsJson: IRawMetricsJson = {
    schemaVersion: 'v1',
    relationEvents: relationEventsRef.current
  };

  const accuracyRate = Math.round((correctAnswersCount / (challenge.queries.length || 1)) * 100);

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-3 sm:p-4">
      {/* Control Header */}
      <div className="w-full bg-slate-900/85 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                Màn {effectiveLevel} • {challenge.titleVi}
              </span>
            </div>
            <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {phase === 'MEMORIZING' ? `Ghi nhớ: ${memorizeCountdown}s` : 'Pha Truy Vấn'}
              </span>
              <span>•</span>
              <span className="text-cyan-300 font-semibold">Điểm: {score}</span>
            </div>
          </div>
        </div>

        {/* Phase Indicator Badge */}
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2 text-xs">
          {phase === 'MEMORIZING' ? (
            <span className="flex items-center gap-1.5 text-amber-300 font-bold animate-pulse">
              <Eye className="w-4 h-4" />
              ĐANG HIỂN THỊ MẠNG ({memorizeCountdown}s)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <EyeOff className="w-4 h-4 text-cyan-400" />
              ĐÃ ẨN ĐƯỜNG NỐI (TRUY VẤN TRÍ NHỚ)
            </span>
          )}
        </div>
      </div>

      {/* Main Board Visualizer */}
      <div className="relative w-full aspect-[4/3] max-w-[600px] rounded-2xl overflow-hidden border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-slate-950 p-6 flex flex-col justify-between select-none">
        {/* Graph Canvas Representation */}
        <div className="relative w-full h-[240px]">
          {/* SVG Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {challenge.edges.map(edge => {
              const src = challenge.nodes.find(n => n.id === edge.sourceId);
              const tgt = challenge.nodes.find(n => n.id === edge.targetId);
              if (!src || !tgt) return null;

              const isVisible = phase === 'MEMORIZING';
              return (
                <g key={edge.id} className="transition-opacity duration-700">
                  <line
                    x1={src.position.x + 20}
                    y1={src.position.y + 20}
                    x2={tgt.position.x + 20}
                    y2={tgt.position.y + 20}
                    stroke={isVisible ? '#a855f7' : 'rgba(168, 85, 247, 0.05)'}
                    strokeWidth={isVisible ? 3 : 1}
                    strokeDasharray={isVisible && edge.isDirected ? '6 3' : undefined}
                  />
                  {isVisible && edge.isDirected && (
                    <circle
                      cx={(src.position.x + tgt.position.x) / 2 + 20}
                      cy={(src.position.y + tgt.position.y) / 2 + 20}
                      r={3.5}
                      fill="#e879f9"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Node Entities */}
          {challenge.nodes.map(node => (
            <div
              key={node.id}
              style={{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`
              }}
              className="absolute w-[42px] h-[42px] rounded-full border-2 border-purple-400/80 bg-slate-900 flex items-center justify-center font-bold text-xs text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
            >
              {node.label}
            </div>
          ))}
        </div>

        {/* Query & Interaction Area */}
        {phase === 'QUERYING' && (
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 backdrop-blur-md animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Câu hỏi {currentQueryIndex + 1}/{challenge.queries.length}:</span>
            </div>
            <p className="text-sm font-bold text-slate-100">
              {currentQuery.questionVi}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentQuery.options.map(opt => {
                const isSelected = selectedOptionId === opt.id;
                const isCorrect = opt.id === currentQuery.correctOptionId;

                let btnStyle = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-purple-400/60';
                if (isAnswered) {
                  if (isCorrect) btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                  else if (isSelected) btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                }

                return (
                  <button
                    key={opt.id}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt.labelVi}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Phase Memorizing Instructions */}
        {phase === 'MEMORIZING' && (
          <div className="text-xs text-center text-slate-400 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
            Hãy chú ý các mũi tên liên kết và vị trí nút trước khi đường nối biến mất!
          </div>
        )}
      </div>

      {/* Game Result Modal */}
      {phase === 'FINISHED' && (
        <GameResultModal
          score={score}
          accuracyRate={accuracyRate}
          timeSpentSec={Math.round(challenge.memorizeDurationSec + 10)}
          rawMetricsJson={rawMetricsJson}
          onRestart={initLevel}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
