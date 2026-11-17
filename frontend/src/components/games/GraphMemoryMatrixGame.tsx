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
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound, isGamePaused } = useAppStore();
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
  const [elapsedSec, setElapsedSec] = useState<number>(0);
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
    setElapsedSec(0);
    setStatusMessage('Ghi nhớ toàn bộ mạng lưới liên kết trước khi chúng biến mất!');
    relationEventsRef.current = [];
  }, [challenge]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  // Real Elapsed Timer
  useEffect(() => {
    if (phase === 'FINISHED' || isGamePaused) return;
    const t = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase, isGamePaused]);

  // Memorization Timer
  useEffect(() => {
    if (phase !== 'MEMORIZING' || isGamePaused) return;

    const interval = setInterval(() => {
      setMemorizeCountdown(prev => {
        if (prev <= 0.5) {
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
  }, [phase, isGamePaused, playSound]);

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

  // Keyboard shortcuts: 1-4 to select answer, Enter/Space to advance
  useEffect(() => {
    if (phase !== 'QUERYING' || isGamePaused) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!isAnswered) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < currentQuery.options.length) {
          e.preventDefault();
          handleSelectOption(currentQuery.options[idx].id);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isGamePaused, isAnswered, currentQuery]);

  const rawMetricsJson: IRawMetricsJson = {
    schemaVersion: 'v1',
    relationEvents: relationEventsRef.current
  };

  const accuracyRate = Math.round((correctAnswersCount / (challenge.queries.length || 1)) * 100);

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-3 sm:p-4">
      {/* Control Header */}
      <div className="w-full bg-white/90 dark:bg-slate-900/85 border border-[#D5CBB9] dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-4 shadow-sm dark:shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/40">
                Màn {effectiveLevel} • {challenge.titleVi}
              </span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                {phase === 'MEMORIZING' ? `Ghi nhớ: ${memorizeCountdown}s` : 'Pha Truy Vấn'}
              </span>
              <span>•</span>
              <span className="text-cyan-700 dark:text-cyan-300 font-semibold">Điểm: {score}</span>
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
      <div className="relative w-full max-w-[600px] rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-slate-950 p-4 sm:p-6 flex flex-col gap-4 select-none">
        {/* Responsive SVG Graph Canvas */}
        <div className="relative w-full">
          <svg viewBox="0 0 600 260" className="w-full h-auto max-h-[260px]">
            <defs>
              <marker id="graph-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#e879f9" />
              </marker>
            </defs>

            {/* Edges */}
            {challenge.edges.map(edge => {
              const src = challenge.nodes.find(n => n.id === edge.sourceId);
              const tgt = challenge.nodes.find(n => n.id === edge.targetId);
              if (!src || !tgt) return null;

              const isVisible = phase === 'MEMORIZING';
              const x1 = src.position.x + 21;
              const y1 = src.position.y + 21;
              const x2 = tgt.position.x + 21;
              const y2 = tgt.position.y + 21;

              return (
                <g key={edge.id} className="transition-opacity duration-700">
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isVisible ? '#a855f7' : 'rgba(168, 85, 247, 0.06)'}
                    strokeWidth={isVisible ? 3 : 1}
                    strokeDasharray={isVisible && edge.isDirected ? '6 3' : undefined}
                  />
                  {isVisible && edge.isDirected && (
                    <circle
                      cx={(x1 + x2) / 2}
                      cy={(y1 + y2) / 2}
                      r={4}
                      fill="#e879f9"
                    />
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {challenge.nodes.map(node => {
              const cx = node.position.x + 21;
              const cy = node.position.y + 21;
              return (
                <g key={node.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={22}
                    fill="#0f172a"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                  />
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Query & Interaction Area */}
        {phase === 'QUERYING' && (
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 backdrop-blur-md animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>Câu hỏi {currentQueryIndex + 1}/{challenge.queries.length}:</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">Phím 1-{currentQuery.options.length} để chọn</span>
            </div>
            <p className="text-sm font-bold text-slate-100">
              {currentQuery.questionVi}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQuery.options.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id;
                const isCorrect = opt.id === currentQuery.correctOptionId;

                let btnStyle = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-purple-400/60 cursor-pointer';
                if (isAnswered) {
                  if (isCorrect) btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                  else if (isSelected) btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                  else btnStyle = 'bg-slate-800/40 border-slate-800 text-slate-400';
                }

                return (
                  <button
                    key={opt.id}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full min-h-[44px] p-3 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-700/70 text-[10px] font-mono text-slate-300 hidden sm:inline">
                        {idx + 1}
                      </span>
                      <span>{opt.labelVi}</span>
                    </span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="flex items-center justify-between pt-2 gap-3 border-t border-slate-800/80">
                <span className="text-xs text-slate-300">{statusMessage}</span>
                <button
                  onClick={handleNext}
                  className="shrink-0 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
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
          <div className="text-xs text-center text-slate-300 bg-slate-900/80 px-3 py-2.5 rounded-xl border border-slate-800">
            Hãy chú ý các mũi tên liên kết và vị trí nút trước khi đường nối biến mất!
          </div>
        )}
      </div>

      {/* Game Result Modal */}
      {phase === 'FINISHED' && (
        <GameResultModal
          score={score}
          accuracyRate={accuracyRate}
          timeSpentSec={elapsedSec}
          playedLevel={effectiveLevel}
          rawMetricsJson={rawMetricsJson}
          onRestart={initLevel}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
