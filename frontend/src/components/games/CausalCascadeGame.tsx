import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import {
  ICausalChallenge,
  ICausalNode,
  ICausalConnection,
  CAUSAL_CASCADE_SAMPLE_CHALLENGES,
  evaluateCausalCascadeCircuit,
  IRelationEvent,
  IRawMetricsJson
} from '@brain-exercises/shared';
import { auditoryEngine } from '../../services/auditoryEngine';
import {
  GitMerge,
  Power,
  RotateCcw,
  Sparkles,
  Clock,
  Zap,
  HelpCircle,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export const CausalCascadeGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const effectiveLevel = getExerciseLevel('causal-cascade') || currentLevel || 1;

  const challenge: ICausalChallenge =
    CAUSAL_CASCADE_SAMPLE_CHALLENGES.find(c => c.level === effectiveLevel) ||
    CAUSAL_CASCADE_SAMPLE_CHALLENGES[0];

  // Game States
  const [nodes, setNodes] = useState<ICausalNode[]>(() => JSON.parse(JSON.stringify(challenge.nodes)));
  const [connections, setConnections] = useState<ICausalConnection[]>(() => JSON.parse(JSON.stringify(challenge.connections)));
  const [interventionsLeft, setInterventionsLeft] = useState<number>(challenge.allowedInterventions);
  const [timeLeft, setTimeLeft] = useState<number>(challenge.timeLimitSec);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Khảo sát mạch nhân quả và thực hiện can thiệp tối thiểu.');

  // Prediction Gate State
  const [showPrediction, setShowPrediction] = useState<boolean>(!!challenge.predictionQuestion);
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null);
  const [predictionCorrect, setPredictionCorrect] = useState<boolean | null>(null);

  const relationEventsRef = useRef<IRelationEvent[]>([]);
  const cascadeStepRef = useRef<number>(0);

  // Initialize level
  const initLevel = useCallback(() => {
    setNodes(JSON.parse(JSON.stringify(challenge.nodes)));
    setConnections(JSON.parse(JSON.stringify(challenge.connections)));
    setInterventionsLeft(challenge.allowedInterventions);
    setTimeLeft(challenge.timeLimitSec);
    setIsSimulating(false);
    setIsGameOver(false);
    setIsSuccess(false);
    setScore(0);
    setStatusMessage('Khảo sát mạch nhân quả và thực hiện can thiệp tối thiểu.');
    setShowPrediction(!!challenge.predictionQuestion);
    setSelectedPredictionId(null);
    setPredictionCorrect(null);
    cascadeStepRef.current = 0;
    relationEventsRef.current = [];
  }, [challenge]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  // Global Timer
  useEffect(() => {
    if (isGameOver || showPrediction) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsGameOver(true);
          playSound('wrong');
          setStatusMessage('Hết thời gian quy định!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, showPrediction, playSound]);

  // Handle Prediction Submit
  const handleConfirmPrediction = (optionId: string, isCorrect: boolean) => {
    setSelectedPredictionId(optionId);
    setPredictionCorrect(isCorrect);
    setShowPrediction(false);

    if (isCorrect) {
      playSound('correct');
      setScore(s => s + 40);
      setStatusMessage('Dự đoán chính xác! Bắt đầu can thiệp điểm nút.');
    } else {
      playSound('wrong');
      setStatusMessage('Dự đoán sai lệch! Hãy chú ý logic cổng và độ trễ.');
    }

    relationEventsRef.current.push({
      t: challenge.timeLimitSec - timeLeft,
      exerciseSlug: 'causal-cascade',
      level: effectiveLevel,
      trialId: `pred-causal-${Date.now()}`,
      relationId: 'TEMPORAL_PREDICT',
      relationWeight: 0.9,
      entities: { selectedPredictionId: optionId },
      stateBefore: 'PREDICTION_PHASE',
      stateAfter: 'ACTIVE_CIRCUIT',
      responseMs: 1200,
      correct: isCorrect
    });
  };

  // Toggle Lever or Intervene on Node
  const handleToggleNode = (node: ICausalNode) => {
    if (isSimulating || isGameOver || showPrediction) return;
    if (node.type !== 'LEVER' && node.type !== 'INVERTER') return;
    if (interventionsLeft <= 0 && node.state === 'OFF') {
      playSound('wrong');
      setStatusMessage('Đã hết số lần can thiệp cho phép!');
      return;
    }

    playSound('click');
    const newState = node.state === 'ON' ? 'OFF' : 'ON';
    setNodes(prev => prev.map(n => n.id === node.id ? { ...n, state: newState } : n));
    setInterventionsLeft(c => (newState === 'ON' ? c - 1 : c + 1));
    setStatusMessage(`Đã chuyển đổi trạng thái ${node.label} thành ${newState}.`);

    relationEventsRef.current.push({
      t: challenge.timeLimitSec - timeLeft,
      exerciseSlug: 'causal-cascade',
      level: effectiveLevel,
      trialId: `act-${node.id}-${Date.now()}`,
      relationId: 'RULE_ACTION',
      relationWeight: 0.85,
      entities: { nodeId: node.id, newState },
      stateBefore: node.state,
      stateAfter: newState,
      responseMs: 800,
      correct: true
    });
  };

  // Execute Causal Cascade Simulation
  const handleTriggerSimulation = () => {
    if (isSimulating || isGameOver || showPrediction) return;
    setIsSimulating(true);
    cascadeStepRef.current = 0;
    setStatusMessage('Đang kích hoạt chuỗi phản ứng dây chuyền...');

    let currentStep = 0;
    const simInterval = setInterval(() => {
      currentStep++;
      cascadeStepRef.current = currentStep;

      setNodes(prevNodes => {
        const { nextNodes, targetAchieved } = evaluateCausalCascadeCircuit(prevNodes, connections);
        auditoryEngine.playCausalDominoStep(currentStep, targetAchieved);

        if (targetAchieved) {
          clearInterval(simInterval);
          setIsSimulating(false);
          setIsGameOver(true);
          setIsSuccess(true);
          playSound('victory');
          setScore(s => s + 120 + timeLeft * 4);
          setStatusMessage('Tuyệt vời! Dòng năng lượng đã kích hoạt mục tiêu hoàn toàn!');
        }

        return nextNodes;
      });

      if (currentStep >= 8) {
        clearInterval(simInterval);
        setIsSimulating(false);
        setNodes(prevNodes => {
          const reached = prevNodes.some(n => n.type === 'TARGET' && n.state === 'ON');
          if (!reached) {
            setIsGameOver(true);
            setIsSuccess(false);
            playSound('wrong');
            setStatusMessage('Mạch bị gián đoạn hoặc không đủ năng lượng kích hoạt mục tiêu!');
          }
          return prevNodes;
        });
      }
    }, 450);
  };

  const rawMetricsJson: IRawMetricsJson = {
    schemaVersion: 'v1',
    relationEvents: relationEventsRef.current
  };

  const accuracyRate = isSuccess ? 100 : Math.max(20, Math.round((score / 150) * 100));

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-3 sm:p-4">
      {/* Prediction Gate Modal */}
      {showPrediction && challenge.predictionQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-cyan-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
              <h3 className="text-base font-bold uppercase tracking-wider">
                Pha 1: Dự Đoán Nhân Quả
              </h3>
            </div>
            <p className="text-sm font-medium text-slate-200">
              {challenge.predictionQuestion}
            </p>
            <div className="space-y-2.5">
              {challenge.predictionOptions?.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleConfirmPrediction(opt.id, opt.isCorrect)}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-cyan-950/40 hover:border-cyan-500/50 text-xs sm:text-sm text-slate-200 transition-all flex items-center justify-between"
                >
                  <span>{opt.labelVi}</span>
                  <span className="text-cyan-400 font-bold ml-2">➔</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Control Header */}
      <div className="w-full bg-slate-900/85 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Màn {effectiveLevel} • {challenge.titleVi}
              </span>
            </div>
            <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {timeLeft}s
              </span>
              <span>•</span>
              <span className="text-cyan-300 font-semibold">Điểm: {score}</span>
              <span>•</span>
              <span className="text-purple-300">Can thiệp còn: {interventionsLeft}</span>
            </div>
          </div>
        </div>

        {/* Action Button & Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerSimulation}
            disabled={isSimulating || isGameOver}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Kích Hoạt Chuỗi (Trigger)</span>
          </button>
        </div>
      </div>

      {/* Circuit Board Container */}
      <div className="relative w-full aspect-[4/3] max-w-[600px] rounded-2xl overflow-hidden border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.12)] bg-slate-950 p-6 flex flex-col justify-between select-none">
        {/* Status banner */}
        <div className="text-xs text-slate-300 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {statusMessage}
          </span>
          {isSimulating && (
            <span className="text-[11px] font-bold text-cyan-400 animate-pulse">
              Đang lan truyền xung...
            </span>
          )}
        </div>

        {/* Interactive Circuit Nodes */}
        <div className="relative w-full h-[320px]">
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map(c => {
              const src = nodes.find(n => n.id === c.fromNodeId);
              const tgt = nodes.find(n => n.id === c.toNodeId);
              if (!src || !tgt) return null;

              const isFlowing = src.state === 'ON';
              return (
                <g key={c.id}>
                  <line
                    x1={src.position.x + 35}
                    y1={src.position.y + 25}
                    x2={tgt.position.x + 35}
                    y2={tgt.position.y + 25}
                    stroke={isFlowing ? '#38bdf8' : '#334155'}
                    strokeWidth={isFlowing ? 3 : 2}
                    strokeDasharray={isFlowing ? '6 4' : undefined}
                    className={isFlowing ? 'animate-pulse' : undefined}
                  />
                </g>
              );
            })}
          </svg>

          {/* Node Elements */}
          {nodes.map(node => {
            const isOn = node.state === 'ON';
            const isClickable = node.type === 'LEVER' || node.type === 'INVERTER';

            let bgColor = 'bg-slate-900 border-slate-700 text-slate-400';
            if (node.type === 'SOURCE') bgColor = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
            else if (node.type === 'TARGET') {
              bgColor = isOn
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/90 border-slate-700 text-slate-300';
            } else if (isOn) {
              bgColor = 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
            }

            return (
              <div
                key={node.id}
                onClick={() => handleToggleNode(node)}
                style={{
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`
                }}
                className={`absolute w-[120px] rounded-xl border p-2.5 flex flex-col items-center justify-center transition-all ${bgColor} ${
                  isClickable ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
                  {node.type === 'LEVER' && <Power className="w-3.5 h-3.5" />}
                  {node.type === 'GATE_AND' && <span className="text-[10px] bg-slate-800 px-1 rounded">&</span>}
                  {node.type === 'INVERTER' && <span className="text-[10px] bg-slate-800 px-1 rounded">NOT</span>}
                  <span className="truncate">{node.label}</span>
                </div>
                <div className="text-[10px] font-semibold flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isOn ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                  <span>{isOn ? 'KÍCH HOẠT (ON)' : 'NGẮT (OFF)'}</span>
                </div>
                {node.ruleVi && (
                  <span className="text-[9px] text-slate-400 mt-1 text-center line-clamp-1">
                    {node.ruleVi}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer instruction helper */}
        <div className="text-[11px] text-slate-400 bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-800 flex justify-between items-center">
          <span>Click vào Cần Gạt (Lever) để đổi trạng thái ON/OFF</span>
          <span>Bấm Trigger để bắt đầu phản ứng</span>
        </div>
      </div>

      {/* Game Result Modal */}
      {isGameOver && (
        <GameResultModal
          score={score}
          accuracyRate={accuracyRate}
          timeSpentSec={challenge.timeLimitSec - timeLeft}
          rawMetricsJson={rawMetricsJson}
          onRestart={initLevel}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
