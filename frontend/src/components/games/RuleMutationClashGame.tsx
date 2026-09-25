import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import {
  generateRuleMutationTrials,
  IRuleMutationTrial,
  IRelationEvent,
  IRawMetricsJson
} from '@brain-exercises/shared';
import { auditoryEngine } from '../../services/auditoryEngine';
import {
  Shuffle,
  Clock,
  Sparkles,
  Zap,
  Shield,
  Swords,
  AlertTriangle,
  RotateCcw,
  Layers,
  Activity
} from 'lucide-react';

export const RuleMutationClashGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const effectiveLevel = getExerciseLevel('rule-mutation-clash') || currentLevel || 1;

  const totalRounds = 8;
  const [trials, setTrials] = useState<IRuleMutationTrial[]>(() =>
    generateRuleMutationTrials(effectiveLevel, totalRounds)
  );
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [mutationFlash, setMutationFlash] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Theo sát quy tắc hiện tại và phản ứng thật nhanh!');

  const relationEventsRef = useRef<IRelationEvent[]>([]);
  const trialStartTimeRef = useRef<number>(Date.now());
  const preMutationLatenciesRef = useRef<number[]>([]);
  const postMutationLatenciesRef = useRef<number[]>([]);

  const currentTrial = trials[currentRoundIndex] || trials[0];

  // Initialize
  const initGame = useCallback(() => {
    const newTrials = generateRuleMutationTrials(effectiveLevel, totalRounds);
    setTrials(newTrials);
    setCurrentRoundIndex(0);
    setScore(0);
    setCorrectCount(0);
    setIsGameOver(false);
    setMutationFlash(null);
    setStatusMessage('Theo sát quy tắc hiện tại và phản ứng thật nhanh!');
    trialStartTimeRef.current = Date.now();
    preMutationLatenciesRef.current = [];
    postMutationLatenciesRef.current = [];
    relationEventsRef.current = [];
  }, [effectiveLevel]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // When round changes, check for mutation flash and play audio
  useEffect(() => {
    trialStartTimeRef.current = Date.now();
    if (currentTrial.hasMutated && currentTrial.mutationAlertVi) {
      setMutationFlash(currentTrial.mutationAlertVi);
      auditoryEngine.playNote('F#3', 0.2, { volume: 0.4, waveform: 'sawtooth' });
      const timer = setTimeout(() => {
        setMutationFlash(null);
      }, 1600);
      return () => clearTimeout(timer);
    } else if (currentTrial.stimulus.soundPitch) {
      auditoryEngine.playNote(currentTrial.stimulus.soundPitch, 0.25, { volume: 0.3 });
    }
  }, [currentRoundIndex, currentTrial]);

  // Handle Action Button
  const handleAction = (action: string) => {
    if (isGameOver) return;
    const responseMs = Date.now() - trialStartTimeRef.current;
    const isCorrect = action === currentTrial.correctAction;

    if (currentRoundIndex < 3) {
      preMutationLatenciesRef.current.push(responseMs);
    } else {
      postMutationLatenciesRef.current.push(responseMs);
    }

    if (isCorrect) {
      playSound('correct');
      setScore(s => s + 35);
      setCorrectCount(c => c + 1);
      setStatusMessage('Phản xạ chính xác!');
    } else {
      playSound('wrong');
      setStatusMessage(`Sai quy tắc! Mục tiêu yêu cầu: ${currentTrial.correctAction}`);
    }

    relationEventsRef.current.push({
      t: responseMs / 1000,
      exerciseSlug: 'rule-mutation-clash',
      level: effectiveLevel,
      trialId: `mut-${currentRoundIndex}-${Date.now()}`,
      relationId: 'INHIBITION',
      relationWeight: 0.95,
      entities: { chosen: action, correct: currentTrial.correctAction },
      stateBefore: 'RULE_PRESENT',
      stateAfter: 'ACTION_COMMITTED',
      responseMs,
      correct: isCorrect,
      extra: { hasMutated: currentTrial.hasMutated }
    });

    if (currentRoundIndex < trials.length - 1) {
      setCurrentRoundIndex(idx => idx + 1);
    } else {
      setIsGameOver(true);
      playSound('victory');
    }
  };

  const avgPre = preMutationLatenciesRef.current.length > 0
    ? Math.round(preMutationLatenciesRef.current.reduce((a, b) => a + b, 0) / preMutationLatenciesRef.current.length)
    : 0;
  const avgPost = postMutationLatenciesRef.current.length > 0
    ? Math.round(postMutationLatenciesRef.current.reduce((a, b) => a + b, 0) / postMutationLatenciesRef.current.length)
    : 0;
  const interferenceCostMs = Math.max(0, avgPost - avgPre);

  const rawMetricsJson: IRawMetricsJson = {
    schemaVersion: 'v1',
    relationEvents: relationEventsRef.current
  };

  const accuracyRate = Math.round((correctCount / totalRounds) * 100);

  // Helper color map
  const colorBgMap: Record<string, string> = {
    red: 'bg-rose-500 shadow-rose-500/40',
    blue: 'bg-cyan-500 shadow-cyan-500/40',
    green: 'bg-emerald-500 shadow-emerald-500/40',
    amber: 'bg-amber-500 shadow-amber-500/40'
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-3 sm:p-4">
      {/* Mutation Flash Alert */}
      {mutationFlash && (
        <div className="fixed inset-0 z-50 bg-rose-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-2xl p-6 shadow-2xl text-center space-y-3 max-w-sm">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
            <h3 className="text-base font-extrabold text-white uppercase tracking-wider">
              {mutationFlash}
            </h3>
            <p className="text-xs text-rose-300">
              Quy tắc đã bị đảo ngược! Hãy ức chế phản xạ quán tính cũ!
            </p>
          </div>
        </div>
      )}

      {/* Control Header */}
      <div className="w-full bg-slate-900/85 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-400/30 flex items-center justify-center text-rose-400">
            <Shuffle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                Màn {effectiveLevel} • Lượt {currentRoundIndex + 1}/{totalRounds}
              </span>
            </div>
            <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
              <span className="text-cyan-300 font-semibold">Điểm: {score}</span>
              <span>•</span>
              <span className="text-purple-300">Độ trễ can thiệp: +{interferenceCostMs}ms</span>
            </div>
          </div>
        </div>

        {/* Current Active Rule Badge */}
        <div className="flex flex-col items-end text-xs">
          <span className="text-slate-400 font-medium text-[11px] mb-1">Quy tắc hiện hành:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {currentTrial.activeRules.map((r, i) => (
              <span
                key={i}
                className="bg-slate-800/80 border border-slate-700/80 px-2 py-0.5 rounded text-[11px] font-mono text-amber-300"
              >
                {r.attribute} ➔ <b className="text-white">{r.action}</b>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stimulus Showcase Card */}
      <div className="relative w-full aspect-[4/3] max-w-[600px] rounded-2xl overflow-hidden border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.12)] bg-slate-950 p-6 flex flex-col justify-between items-center select-none">
        {/* Status ticker */}
        <div className="text-xs text-slate-300 bg-slate-900/90 border border-slate-800 px-4 py-1.5 rounded-full flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{statusMessage}</span>
        </div>

        {/* Dynamic Stimulus Object */}
        <div className="flex flex-col items-center justify-center my-auto space-y-4">
          <div
            className={`w-28 h-28 flex items-center justify-center shadow-2xl transition-all duration-300 ${
              colorBgMap[currentTrial.stimulus.color] || 'bg-slate-700'
            } ${
              currentTrial.stimulus.shape === 'circle' ? 'rounded-full' :
              currentTrial.stimulus.shape === 'triangle' ? 'rounded-lg rotate-45' : 'rounded-2xl'
            }`}
          >
            <span className="text-2xl font-black text-white drop-shadow">
              {currentTrial.stimulus.soundPitch || '★'}
            </span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Màu: <b className="text-slate-200 capitalize">{currentTrial.stimulus.color}</b> • Hình: <b className="text-slate-200 capitalize">{currentTrial.stimulus.shape}</b>
          </div>
        </div>

        {/* Action Choice Buttons */}
        <div className="w-full grid grid-cols-2 gap-3 max-w-md">
          <button
            onClick={() => handleAction('ATTACK')}
            className="py-3.5 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 active:scale-95 transition-all"
          >
            <Swords className="w-4 h-4" />
            <span>TẤN CÔNG (ATTACK)</span>
          </button>

          <button
            onClick={() => handleAction('DEFEND')}
            className="py-3.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25 active:scale-95 transition-all"
          >
            <Shield className="w-4 h-4" />
            <span>PHÒNG THỦ (DEFEND)</span>
          </button>
        </div>
      </div>

      {/* Game Result Modal */}
      {isGameOver && (
        <GameResultModal
          score={score}
          accuracyRate={accuracyRate}
          timeSpentSec={25}
          rawMetricsJson={rawMetricsJson}
          onRestart={initGame}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
