import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { GameResultModal } from './GameResultModal';
import { PredictionGateOverlay } from '../cognition/PredictionGateOverlay';
import {
  IRdeBoardState,
  IRdeEntity,
  IRdeRelation,
  IRdeChallengeLevel,
  RDE_SAMPLE_CHALLENGES,
  applyAction,
  stepSimulationDynamics,
  evaluatePrediction,
  IPredictionEvaluation,
  IRdePredictionAnswer,
  IRelationEvent,
  IRawMetricsJson,
  checkLineIntersection
} from '@brain-exercises/shared';
import { 
  Zap, 
  Brain, 
  Clock, 
  ShieldAlert, 
  Layers, 
  Info,
  Maximize2,
  Sparkles,
  Scissors
} from 'lucide-react';

export const RelationalNetworkGame: React.FC = () => {
  const { 
    getExerciseLevel, 
    setActiveGameSlug, 
    playSound 
  } = useAppStore();

  const currentLevel = getExerciseLevel('relational-network') || 1;
  const challenge: IRdeChallengeLevel = 
    RDE_SAMPLE_CHALLENGES.find(c => c.level === currentLevel) || 
    RDE_SAMPLE_CHALLENGES[0];

  // Game States
  const [boardState, setBoardState] = useState<IRdeBoardState>(() => ({
    entities: JSON.parse(JSON.stringify(challenge.entities)),
    relations: JSON.parse(JSON.stringify(challenge.relations)),
    activeRules: [],
    obstacles: challenge.obstacles || [],
    stepCount: 0
  }));

  const [timeLeft, setTimeLeft] = useState<number>(challenge.timeLimitSec);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Bắt đầu thử thách nhận thức');
  
  // Prediction Phase State
  const [predictionEvaluation, setPredictionEvaluation] = useState<IPredictionEvaluation | null>(null);
  const [showPredictionGate, setShowPredictionGate] = useState<boolean>(!!challenge.predictionPrompt);

  // Telemetry
  const relationEventsRef = useRef<IRelationEvent[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interaction State (Drag connect / Slice cut)
  const dragStartNodeRef = useRef<IRdeEntity | null>(null);
  const dragCurrentPosRef = useRef<{ x: number; y: number } | null>(null);
  const sliceLineRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const sliceCutPointsRef = useRef<Array<{ x: number; y: number; life: number }>>([]);

  // Particles for flow animation along connections
  const particlesRef = useRef<Array<{ relId: string; progress: number; speed: number }>>([]);

  // Reset or initialize level
  const initLevel = useCallback(() => {
    setBoardState({
      entities: JSON.parse(JSON.stringify(challenge.entities)),
      relations: JSON.parse(JSON.stringify(challenge.relations)),
      activeRules: [],
      obstacles: challenge.obstacles || [],
      stepCount: 0
    });
    setTimeLeft(challenge.timeLimitSec);
    setIsGameOver(false);
    setScore(0);
    setPredictionEvaluation(null);
    setShowPredictionGate(!!challenge.predictionPrompt);
    setIsPlaying(!challenge.predictionPrompt);
    relationEventsRef.current = [];
    particlesRef.current = [];
  }, [challenge]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  // Handle Prediction Submission
  const handlePredictionConfirmed = (answer: IRdePredictionAnswer) => {
    if (!challenge.predictionPrompt) return;

    const evaluation = evaluatePrediction(challenge.predictionPrompt, answer);
    setPredictionEvaluation(evaluation);
    setShowPredictionGate(false);
    setIsPlaying(true);

    if (evaluation.isCorrect) {
      playSound('correct');
      setScore(s => s + 50);
      setStatusMessage('Dự đoán chính xác! Bắt đầu kiểm soát hệ thống.');
    } else {
      playSound('wrong');
      setStatusMessage('Dự đoán sai lệch! Hãy quan sát phản ứng thực tế.');
    }

    // Log telemetry for prediction
    relationEventsRef.current.push({
      t: challenge.timeLimitSec - timeLeft,
      exerciseSlug: 'relational-network',
      level: currentLevel,
      trialId: `pred-lvl-${currentLevel}-${Date.now()}`,
      relationId: 'RULE_ACTION',
      relationWeight: 0.8,
      entities: {
        predictionAnswer: answer.selectedOptionId,
        correctAnswer: challenge.predictionPrompt.correctOptionId
      },
      stateBefore: 'PREDICTION_PHASE',
      stateAfter: 'ACTIVE_PLAY',
      responseMs: answer.responseMs,
      correct: evaluation.isCorrect,
      extra: {
        confidence: answer.confidence,
        predictionError: evaluation.predictionError,
        brierScore: evaluation.brierCalibrationScore
      }
    });
  };

  // Timer loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsGameOver(true);
          setIsPlaying(false);
          playSound('wrong');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, playSound]);

  // Physics & Dynamics simulation loop (60 FPS / dt steps)
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const dt = 0.05; // 50ms step
    const interval = setInterval(() => {
      setBoardState(prevState => {
        const nextState = stepSimulationDynamics(prevState, dt);

        // Check victory condition: All adversary nodes conquered
        const remainingEnemies = nextState.entities.filter(e => e.faction === 'ADVERSARY');
        if (remainingEnemies.length === 0) {
          setIsGameOver(true);
          setIsPlaying(false);
          playSound('victory');
          setScore(s => s + 150 + timeLeft * 5);
          setStatusMessage('Hoàn thành! Bạn đã kiểm soát toàn bộ mạng lưới.');
        }

        return nextState;
      });

      // Update flow particles
      particlesRef.current.forEach(p => {
        p.progress += p.speed;
        if (p.progress > 1.0) p.progress = 0;
      });

      // Spawn particles if needed
      if (particlesRef.current.length < boardState.relations.length * 4) {
        boardState.relations.forEach(r => {
          if (Math.random() < 0.2) {
            particlesRef.current.push({
              relId: r.id,
              progress: 0,
              speed: 0.015 * r.properties.flowSpeed
            });
          }
        });
      }

      // Cleanup particles for deleted relations
      particlesRef.current = particlesRef.current.filter(p => 
        boardState.relations.some(r => r.id === p.relId)
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, playSound, boardState.relations, timeLeft]);

  // Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Device Pixel Ratio scaling for crystal sharpness
    const width = 600;
    const height = 450;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Background Cyber Grid
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Obstacle Walls
    boardState.obstacles.forEach(wall => {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    });

    // Draw Relations (Edges)
    boardState.relations.forEach(rel => {
      const source = boardState.entities.find(e => e.id === rel.sourceId);
      const target = boardState.entities.find(e => e.id === rel.targetId);
      if (!source || !target) return;

      const isPlayerRel = source.faction === 'PLAYER';
      ctx.strokeStyle = isPlayerRel ? 'rgba(6, 182, 212, 0.5)' : 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(source.position.x, source.position.y);
      ctx.lineTo(target.position.x, target.position.y);
      ctx.stroke();

      // Draw pulse particles along this relation
      const relParticles = particlesRef.current.filter(p => p.relId === rel.id);
      relParticles.forEach(p => {
        const px = source.position.x + (target.position.x - source.position.x) * p.progress;
        const py = source.position.y + (target.position.y - source.position.y) * p.progress;

        ctx.fillStyle = isPlayerRel ? '#38bdf8' : '#f87171';
        ctx.shadowColor = isPlayerRel ? '#0284c7' : '#dc2626';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    });

    // Draw Temporary Drag Tether
    if (dragStartNodeRef.current && dragCurrentPosRef.current) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(dragStartNodeRef.current.position.x, dragStartNodeRef.current.position.y);
      ctx.lineTo(dragCurrentPosRef.current.x, dragCurrentPosRef.current.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Slicing Laser Blade Line
    if (sliceLineRef.current) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#e11d48';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(sliceLineRef.current.x1, sliceLineRef.current.y1);
      ctx.lineTo(sliceLineRef.current.x2, sliceLineRef.current.y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Nodes (Entities)
    boardState.entities.forEach(entity => {
      const { x, y } = entity.position;
      const radius = entity.type === 'CORE' ? 32 : 24;

      // Color scheme by faction
      let nodeColor = '#3b82f6';
      let glowColor = 'rgba(59, 130, 246, 0.4)';
      if (entity.faction === 'PLAYER') {
        nodeColor = '#06b6d4';
        glowColor = 'rgba(6, 182, 212, 0.45)';
      } else if (entity.faction === 'ADVERSARY') {
        nodeColor = '#ef4444';
        glowColor = 'rgba(239, 68, 68, 0.45)';
      } else {
        nodeColor = '#eab308';
        glowColor = 'rgba(234, 179, 8, 0.35)';
      }

      // Outer glow circle
      ctx.shadowColor = nodeColor;
      ctx.shadowBlur = 14;
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Main Node Body
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = entity.type === 'CORE' ? 4 : 2.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // HP Progress Ring
      const hpPercent = Math.max(0, entity.state.value / entity.state.maxValue);
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(x, y, radius - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpPercent);
      ctx.stroke();

      // Text HP inside node
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(entity.state.value).toString(), x, y);

      // Label under node
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(entity.label, x, y + radius + 14);

      // Role Badge above node
      if (entity.state.role !== 'NORMAL') {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText(`[${entity.state.role}]`, x, y - radius - 6);
      }
    });

  }, [boardState]);

  // Touch / Mouse coordinate helper
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const scaleX = 600 / rect.width;
    const scaleY = 450 / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Find entity at coordinate
  const findEntityAt = (x: number, y: number): IRdeEntity | null => {
    for (const entity of boardState.entities) {
      const radius = entity.type === 'CORE' ? 32 : 24;
      const dx = entity.position.x - x;
      const dy = entity.position.y - y;
      if (dx * dx + dy * dy <= radius * radius) {
        return entity;
      }
    }
    return null;
  };

  // Find relation crossing slice line
  const findRelationCrossing = (x1: number, y1: number, x2: number, y2: number) => {
    for (const rel of boardState.relations) {
      const s = boardState.entities.find(e => e.id === rel.sourceId);
      const t = boardState.entities.find(e => e.id === rel.targetId);
      if (!s || !t) continue;

      if (checkLineIntersection(x1, y1, x2, y2, s.position.x, s.position.y, t.position.x, t.position.y)) {
        // Calculate intersection cut ratio along edge
        const edgeLen = Math.sqrt(Math.pow(t.position.x - s.position.x, 2) + Math.pow(t.position.y - s.position.y, 2));
        const cutDist = Math.sqrt(Math.pow((x1 + x2) / 2 - s.position.x, 2) + Math.pow((y1 + y2) / 2 - s.position.y, 2));
        const cutRatio = Math.max(0.1, Math.min(0.9, cutDist / (edgeLen || 1)));
        return { relation: rel, cutRatio };
      }
    }
    return null;
  };

  // Pointer Down (Start connect or start slice)
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isGameOver) return;
    const coords = getCanvasCoords(e);
    const clickedEntity = findEntityAt(coords.x, coords.y);

    if (clickedEntity && clickedEntity.faction === 'PLAYER') {
      // Start Drag Tether from Player Node
      dragStartNodeRef.current = clickedEntity;
      dragCurrentPosRef.current = coords;
    } else {
      // Start Slicing gesture in empty space
      sliceLineRef.current = { x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y };
    }
  };

  // Pointer Move (Update tether or laser blade)
  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isGameOver) return;
    const coords = getCanvasCoords(e);

    if (dragStartNodeRef.current) {
      dragCurrentPosRef.current = coords;
    } else if (sliceLineRef.current) {
      sliceLineRef.current.x2 = coords.x;
      sliceLineRef.current.y2 = coords.y;
    }
  };

  // Pointer Up (Commit action)
  const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isGameOver) return;
    const coords = getCanvasCoords(e);

    // 1. Commit Connection
    if (dragStartNodeRef.current) {
      const targetEntity = findEntityAt(coords.x, coords.y);
      if (targetEntity && targetEntity.id !== dragStartNodeRef.current.id) {
        const result = applyAction(boardState, {
          actionType: 'CONNECT',
          sourceEntityId: dragStartNodeRef.current.id,
          targetEntityId: targetEntity.id,
          parameters: {}
        });
        setBoardState(result.nextState);
        setStatusMessage(result.effectDescriptionVi);
        playSound('click');
        setScore(s => s + 10);
      }
      dragStartNodeRef.current = null;
      dragCurrentPosRef.current = null;
    }

    // 2. Commit Slice Cut
    if (sliceLineRef.current) {
      const hit = findRelationCrossing(
        sliceLineRef.current.x1, sliceLineRef.current.y1,
        sliceLineRef.current.x2, sliceLineRef.current.y2
      );

      if (hit) {
        const result = applyAction(boardState, {
          actionType: 'CUT',
          relationId: hit.relation.id,
          parameters: { cutRatio: hit.cutRatio }
        });
        setBoardState(result.nextState);
        setStatusMessage(result.effectDescriptionVi);
        playSound('click');
        setScore(s => s + 25);
      }

      sliceLineRef.current = null;
    }
  };

  // Accuracy calculation
  const accuracyRate = Math.min(100, Math.round((score / (challenge.requiredScore || 100)) * 100));

  const rawMetricsJson: IRawMetricsJson = {
    schemaVersion: 'v1',
    relationEvents: relationEventsRef.current
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4">
      {/* Prediction Gate Overlay */}
      {showPredictionGate && challenge.predictionPrompt && (
        <PredictionGateOverlay
          query={challenge.predictionPrompt}
          onPredictionConfirmed={handlePredictionConfirmed}
        />
      )}

      {/* Control Header */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Màn {currentLevel} • {challenge.titleVi}
              </span>
            </div>
            <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {timeLeft}s
              </span>
              <span>•</span>
              <span className="text-cyan-300 font-semibold">Điểm: {score}</span>
            </div>
          </div>
        </div>

        {/* Action Status Ticker */}
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2 text-xs text-slate-200">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      </div>

      {/* Interactive Cyber Canvas */}
      <div className="relative w-full aspect-[4/3] max-w-[600px] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] bg-slate-950 select-none touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="w-full h-full cursor-crosshair block"
        />

        {/* In-game Overlay Helper */}
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex justify-between items-center text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800/80 backdrop-blur-sm">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> Kéo từ nút xanh để tạo liên kết
          </span>
          <span className="flex items-center gap-1">
            <Scissors className="w-3 h-3 text-rose-400" /> Vuốt ngang dây để cắt phẫu thuật
          </span>
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
