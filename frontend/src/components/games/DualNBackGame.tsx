import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { auditoryEngine } from '../../services/auditoryEngine';
import { useRelationSession } from '../../hooks/useRelationSession';
import { calculateGameScore } from '@brain-exercises/shared';
import { Brain, Volume2, Eye, RotateCcw, Play, Pause, Zap, Award, Sparkles, HelpCircle } from 'lucide-react';

const LETTERS_POOL = ['C', 'K', 'L', 'Q', 'R', 'T', 'X', 'B'];

const LETTER_NOTE_MAP: Record<string, string> = {
  'C': 'C4',
  'K': 'D4',
  'L': 'E4',
  'Q': 'F4',
  'R': 'G4',
  'T': 'A4',
  'X': 'B4',
  'B': 'C5'
};

interface StepRecord {
  position: number; // 0 to 8 in 3x3 grid
  letter: string;
}

export const DualNBackGame: React.FC = () => {
  const { currentLevel, getExerciseLevel, setActiveGameSlug, playSound } = useAppStore();
  const { emitTrialEvent, getRawMetricsJson, resetSession } = useRelationSession();

  const effectiveLevel = getExerciseLevel('dual-nback') || currentLevel || 1;
  
  // Calculate N based on level (Level 1: 1-back; Level 2-5: 2-back; Level 6+: 3-back)
  const nBack = effectiveLevel <= 1 ? 1 : effectiveLevel <= 5 ? 2 : effectiveLevel <= 12 ? 3 : 4;
  const totalTrials = 22;
  const trialIntervalMs = effectiveLevel >= 13 ? 2200 : 2600;

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [trialIndex, setTrialIndex] = useState(0);
  const [history, setHistory] = useState<StepRecord[]>([]);
  const [activePosition, setActivePosition] = useState<number | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // User responses for current trial
  const [posPressed, setPosPressed] = useState(false);
  const [audioPressed, setAudioPressed] = useState(false);

  // Scoring telemetry
  const [posHits, setPosHits] = useState(0);
  const [posMisses, setPosMisses] = useState(0);
  const [posFalseAlarms, setPosFalseAlarms] = useState(0);
  const [audioHits, setAudioHits] = useState(0);
  const [audioMisses, setAudioMisses] = useState(0);
  const [audioFalseAlarms, setAudioFalseAlarms] = useState(0);

  const [isFinished, setIsFinished] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trialTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Speak or synthesize letter sound
  const playLetterAudio = useCallback((letter: string) => {
    // Try speech synthesis first for human voice
    let spoken = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(letter);
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
        spoken = true;
      } catch {
        spoken = false;
      }
    }

    // Audio tone fallback/complement
    const note = LETTER_NOTE_MAP[letter] || 'C4';
    auditoryEngine.resumeAudioContext().then(() => {
      auditoryEngine.playNote(note, 0.45, { volume: 0.5, waveform: 'triangle' });
    });
  }, []);

  // Pre-generate full trial sequence with controlled target match frequency (~30% matches)
  const generateSequence = useCallback(() => {
    const seq: StepRecord[] = [];
    for (let i = 0; i < totalTrials; i++) {
      let pos = Math.floor(Math.random() * 9);
      let lettr = LETTERS_POOL[Math.floor(Math.random() * LETTERS_POOL.length)];

      if (i >= nBack) {
        // 30% chance to force position match
        if (Math.random() < 0.3) {
          pos = seq[i - nBack].position;
        }
        // 30% chance to force audio match
        if (Math.random() < 0.3) {
          lettr = seq[i - nBack].letter;
        }
      }

      seq.push({ position: pos, letter: lettr });
    }
    return seq;
  }, [nBack, totalTrials]);

  const [trialSequence, setTrialSequence] = useState<StepRecord[]>(generateSequence);

  // Initialize or reset game
  const startGame = useCallback(() => {
    const seq = generateSequence();
    setTrialSequence(seq);
    setHistory([]);
    setTrialIndex(0);
    setActivePosition(null);
    setActiveLetter(null);
    setPosPressed(false);
    setAudioPressed(false);
    setPosHits(0);
    setPosMisses(0);
    setPosFalseAlarms(0);
    setAudioHits(0);
    setAudioMisses(0);
    setAudioFalseAlarms(0);
    setElapsedSec(0);
    setIsFinished(false);
    setIsPlaying(true);
    resetSession();
    startTimeRef.current = Date.now();
  }, [generateSequence, resetSession]);

  // Handle Position Match button click
  const handlePositionMatch = useCallback(() => {
    if (!isPlaying || isFinished || posPressed) return;
    setPosPressed(true);
    playSound('click');
  }, [isPlaying, isFinished, posPressed, playSound]);

  // Handle Audio Match button click
  const handleAudioMatch = useCallback(() => {
    if (!isPlaying || isFinished || audioPressed) return;
    setAudioPressed(true);
    playSound('click');
  }, [isPlaying, isFinished, audioPressed, playSound]);

  // Keyboard shortcut listener: 'A' or ArrowLeft for Position, 'L' or ArrowRight for Audio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePositionMatch();
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleAudioMatch();
      } else if (e.key === ' ' && !isPlaying && !isFinished) {
        e.preventDefault();
        startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePositionMatch, handleAudioMatch, isPlaying, isFinished, startGame]);

  // Elapsed seconds timer
  useEffect(() => {
    if (!isPlaying || isFinished) return;
    timerRef.current = setInterval(() => {
      setElapsedSec(s => s + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isFinished]);

  // Evaluation at the end of each step
  const evaluateStep = useCallback((stepIdx: number, pPressed: boolean, aPressed: boolean) => {
    if (stepIdx < nBack) return; // Warm-up steps before N can match

    const currentItem = trialSequence[stepIdx];
    const nBackItem = trialSequence[stepIdx - nBack];

    const isPosMatch = currentItem.position === nBackItem.position;
    const isAudioMatch = currentItem.letter === nBackItem.letter;

    // Evaluate Position
    if (isPosMatch) {
      if (pPressed) setPosHits(h => h + 1);
      else setPosMisses(m => m + 1);
    } else {
      if (pPressed) setPosFalseAlarms(f => f + 1);
    }

    // Evaluate Audio
    if (isAudioMatch) {
      if (aPressed) setAudioHits(h => h + 1);
      else setAudioMisses(m => m + 1);
    } else {
      if (aPressed) setAudioFalseAlarms(f => f + 1);
    }

    emitTrialEvent({
      exerciseSlug: 'dual-nback',
      level: effectiveLevel,
      relationId: 'IDENTITY_MATCH',
      relationWeight: 1.0,
      entities: {
        step: stepIdx,
        nBack,
        isPosMatch,
        isAudioMatch,
        posPressed: pPressed,
        audioPressed: aPressed
      },
      stateBefore: `step:${stepIdx}`,
      stateAfter: `step:${stepIdx + 1}`,
      responseMs: trialIntervalMs,
      correct: (isPosMatch === pPressed) && (isAudioMatch === aPressed)
    });
  }, [nBack, trialSequence, effectiveLevel, emitTrialEvent, trialIntervalMs]);

  // Step progression execution loop
  useEffect(() => {
    if (!isPlaying || isFinished) return;

    if (trialIndex >= totalTrials) {
      setIsPlaying(false);
      setIsFinished(true);
      playSound('victory');
      return;
    }

    // Start presentation for current step
    const currentStep = trialSequence[trialIndex];
    setActivePosition(currentStep.position);
    setActiveLetter(currentStep.letter);
    setPosPressed(false);
    setAudioPressed(false);

    playLetterAudio(currentStep.letter);

    // Turn off active visual stimulus after 600ms, keeping rest of window for reflection
    const flashTimeout = setTimeout(() => {
      setActivePosition(null);
    }, 650);

    // Schedule next trial
    trialTimerRef.current = setTimeout(() => {
      evaluateStep(trialIndex, posPressed, audioPressed);
      setHistory(prev => [...prev, currentStep]);
      setTrialIndex(i => i + 1);
    }, trialIntervalMs);

    return () => {
      clearTimeout(flashTimeout);
      if (trialTimerRef.current) clearTimeout(trialTimerRef.current);
    };
  }, [trialIndex, isPlaying, isFinished, trialSequence, totalTrials, trialIntervalMs, playLetterAudio]);

  // Calculate final accuracy rate
  const totalPossibleMatches = Math.max(1, (totalTrials - nBack) * 2);
  const totalHits = posHits + audioHits;
  const totalErrors = posMisses + posFalseAlarms + audioMisses + audioFalseAlarms;
  const accuracyRate = Math.max(0, Math.min(100, Math.round(((totalHits) / Math.max(1, totalHits + totalErrors)) * 100)));
  const calculatedScore = calculateGameScore({
    level: effectiveLevel,
    accuracyRate,
    timeLimitSec: 60,
    timeSpentSec: elapsedSec
  });

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 space-y-5 animate-fade-in pb-28">
      {/* HUD Header */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Dual N-Back</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-extrabold text-xs border border-brand-200 dark:border-brand-700">
                {nBack}-Back
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Chuẩn vàng phát triển Trí Tuệ Linh Hoạt (Fluid Intelligence)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTutorial(true)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all"
            title="Hướng dẫn cách chơi Dual N-Back"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Tiến trình</span>
            <span className="text-lg font-black text-brand-600 dark:text-brand-400">
              {trialIndex} / {totalTrials}
            </span>
          </div>
        </div>
      </div>

      {/* Main 3x3 Dual N-Back Matrix Container */}
      <div className="relative bg-gradient-to-b from-[#F9F6F0] to-[#EFE9DF] dark:from-slate-900 dark:to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-[#D5CBB9] dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-6">
        
        {/* Audio letter stream indicator */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in">
          <Volume2 className={`w-4 h-4 ${activeLetter ? 'text-indigo-500 animate-bounce' : 'text-slate-400'}`} />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Âm thanh chữ cái: 
          </span>
          <span className="text-base font-black font-mono px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            {activeLetter ? activeLetter : '--'}
          </span>
        </div>

        {/* 3x3 Grid Matrix */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 w-64 h-64 sm:w-72 sm:h-72 aspect-square">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => {
            const isActive = activePosition === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl transition-all duration-150 border-2 flex items-center justify-center ${
                  isActive
                    ? 'bg-cyan-500 border-cyan-400 shadow-lg shadow-cyan-500/50 scale-105 ring-4 ring-cyan-400/40 animate-pulse'
                    : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 shadow-sm'
                }`}
              >
                {isActive && (
                  <div className="w-4 h-4 rounded-full bg-white shadow-md animate-ping" />
                )}
              </div>
            );
          })}
        </div>

        {/* Action Match Buttons */}
        <div className="w-full max-w-md grid grid-cols-2 gap-3 pt-2">
          {/* Position Match Button */}
          <button
            onClick={handlePositionMatch}
            disabled={!isPlaying || isFinished}
            className={`h-16 rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center transition-all shadow-md active:scale-95 border-2 ${
              posPressed
                ? 'bg-cyan-600 text-white border-cyan-500 ring-4 ring-cyan-500/30'
                : 'bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-slate-800 dark:text-white border-cyan-500/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-500" />
              <span>Khớp Vị Trí</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 hidden sm:inline-block">A / ←</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Trùng ô {nBack} bước trước
            </span>
          </button>

          {/* Audio Match Button */}
          <button
            onClick={handleAudioMatch}
            disabled={!isPlaying || isFinished}
            className={`h-16 rounded-2xl font-black text-sm sm:text-base flex flex-col items-center justify-center transition-all shadow-md active:scale-95 border-2 ${
              audioPressed
                ? 'bg-indigo-600 text-white border-indigo-500 ring-4 ring-indigo-500/30'
                : 'bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-white border-indigo-500/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-indigo-500" />
              <span>Khớp Âm Thanh</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 hidden sm:inline-block">L / →</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Trùng chữ cái {nBack} bước trước
            </span>
          </button>
        </div>

        {/* Start / Replay Controls */}
        {!isPlaying && !isFinished && (
          <button
            onClick={startGame}
            className="w-full max-w-md py-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all btn-press"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Bắt Đầu Luyện Tập Dual {nBack}-Back (Nhấn Space)</span>
          </button>
        )}
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-[#FDFBF7] dark:bg-slate-900 border border-[#D5CBB9] dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-black text-slate-800 dark:text-white">Quy Luật Dual N-Back</h3>
              </div>
              <button onClick={() => setShowTutorial(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>Dual N-Back</strong> yêu cầu não bộ duy trì đồng thời 2 luồng thông tin song song: <strong>Vị trí ô sáng</strong> và <strong>Âm thanh chữ cái</strong>.
              </p>
              <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800">
                <strong className="text-cyan-700 dark:text-cyan-300 block mb-1">🟦 Khớp Vị Trí (Phím A hoặc ←):</strong>
                Nếu ô sáng hiện tại nằm ở vị trí <strong>y hệt ô sáng {nBack} bước trước đó</strong>, hãy bấm nút Khớp Vị Trí.
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <strong className="text-indigo-700 dark:text-indigo-300 block mb-1">🎵 Khớp Âm Thanh (Phím L hoặc →):</strong>
                Nếu chữ cái âm thanh vừa đọc <strong>y hệt chữ cái {nBack} bước trước đó</strong>, hãy bấm nút Khớp Âm Thanh.
              </div>
            </div>

            <button
              onClick={() => {
                setShowTutorial(false);
                if (!isPlaying && !isFinished) startGame();
              }}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-2xl shadow-md transition-all text-xs"
            >
              Đã Hiểu Quy Luật — Bắt Đầu Ngay
            </button>
          </div>
        </div>
      )}

      {/* Game Result Modal */}
      {isFinished && (
        <GameResultModal
          score={calculatedScore}
          accuracyRate={accuracyRate}
          timeSpentSec={elapsedSec}
          rawMetricsJson={getRawMetricsJson()}
          onRestart={startGame}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
