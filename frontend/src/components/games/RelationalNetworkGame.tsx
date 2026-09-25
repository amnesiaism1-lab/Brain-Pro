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
  checkLineIntersection,
  isConnectionBlockedByWall
} from '@brain-exercises/shared';
import { auditoryEngine } from '../../services/auditoryEngine';
import { 
  Zap, 
  Brain, 
  Clock, 
  Sparkles, 
  Scissors, 
  Music,
  BookOpen,
  Target,
  HelpCircle,
  ChevronRight,
  Layers,
  Award,
  RotateCcw,
  Info,
  ShieldCheck,
  Flame,
  Volume2,
  CheckCircle2,
  TrendingUp,
  Lightbulb
} from 'lucide-react';

/**
 * Tính toán điểm giao cắt chính xác giữa 2 đoạn thẳng (x1, y1)-(x2, y2) và (x3, y3)-(x4, y4)
 */
function getIntersectionPoint(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): { x: number; y: number } | null {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 1e-6) return null;
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1)
    };
  }
  return null;
}

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
  const [statusMessage, setStatusMessage] = useState<string>('Sẵn sàng điều khiển mạng lưới nơ-ron');
  const [isSoundNetworkMode, setIsSoundNetworkMode] = useState<boolean>(() => challenge.mode === 'SOUND_NETWORK' || currentLevel >= 8);
  const [activeGuideTab, setActiveGuideTab] = useState<'meaning' | 'controls' | 'sound' | 'levels'>('meaning');
  
  // Prediction Phase State
  const [predictionEvaluation, setPredictionEvaluation] = useState<IPredictionEvaluation | null>(null);
  const [showPredictionGate, setShowPredictionGate] = useState<boolean>(!!challenge.predictionPrompt);

  // Telemetry & References
  const relationEventsRef = useRef<IRelationEvent[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const guideSectionRef = useRef<HTMLDivElement | null>(null);

  // Interaction State (Drag connect / Slice cut)
  const dragStartNodeRef = useRef<IRdeEntity | null>(null);
  const dragCurrentPosRef = useRef<{ x: number; y: number } | null>(null);
  const sliceLineRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

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
    setStatusMessage('Bắt đầu thử thách nhận thức');
    relationEventsRef.current = [];
    particlesRef.current = [];
    dragStartNodeRef.current = null;
    dragCurrentPosRef.current = null;
    sliceLineRef.current = null;
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
      setStatusMessage('Dự đoán chưa chính xác! Hãy quan sát phản ứng thực tế.');
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

  // Coordinate helper
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

  // Find relation crossing slice line with exact intersection point
  const findRelationCrossing = (x1: number, y1: number, x2: number, y2: number) => {
    for (const rel of boardState.relations) {
      const s = boardState.entities.find(e => e.id === rel.sourceId);
      const t = boardState.entities.find(e => e.id === rel.targetId);
      if (!s || !t) continue;

      const pt = getIntersectionPoint(x1, y1, x2, y2, s.position.x, s.position.y, t.position.x, t.position.y);
      if (pt) {
        const edgeLen = Math.sqrt(Math.pow(t.position.x - s.position.x, 2) + Math.pow(t.position.y - s.position.y, 2));
        const cutDist = Math.sqrt(Math.pow(pt.x - s.position.x, 2) + Math.pow(pt.y - s.position.y, 2));
        const cutRatio = Math.max(0.05, Math.min(0.95, cutDist / (edgeLen || 1)));
        return { relation: rel, cutRatio, point: pt, source: s, target: t };
      }
    }
    return null;
  };

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

    // Draw Obstacle Walls (Tường Năng Lượng)
    boardState.obstacles.forEach(wall => {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Obstacle hazard stripes
      const mx = (wall.x1 + wall.x2) / 2;
      const my = (wall.y1 + wall.y2) / 2;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ TƯỜNG CẢN', mx, my - 6);
    });

    // Draw Relations (Edges)
    boardState.relations.forEach(rel => {
      const source = boardState.entities.find(e => e.id === rel.sourceId);
      const target = boardState.entities.find(e => e.id === rel.targetId);
      if (!source || !target) return;

      const isPlayerRel = source.faction === 'PLAYER';
      ctx.strokeStyle = isPlayerRel ? 'rgba(6, 182, 212, 0.6)' : 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(source.position.x, source.position.y);
      ctx.lineTo(target.position.x, target.position.y);
      ctx.stroke();

      // Sound Network Interval Pill on Edge
      if (isSoundNetworkMode && source.soundProps?.pitch && target.soundProps?.pitch) {
        const mx = (source.position.x + target.position.x) / 2;
        const my = (source.position.y + target.position.y) / 2;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(mx - 28, my - 9, 56, 18);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx - 28, my - 9, 56, 18);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${source.soundProps.pitch}↔${target.soundProps.pitch}`, mx, my + 3);
      }

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

    // Draw Temporary Drag Tether & Target Preview
    if (dragStartNodeRef.current && dragCurrentPosRef.current) {
      const sPos = dragStartNodeRef.current.position;
      const cPos = dragCurrentPosRef.current;
      const hoveredEntity = findEntityAt(cPos.x, cPos.y);

      let isBlocked = false;
      if (hoveredEntity && hoveredEntity.id !== dragStartNodeRef.current.id) {
        isBlocked = isConnectionBlockedByWall(dragStartNodeRef.current, hoveredEntity, boardState.obstacles);
      }

      ctx.strokeStyle = isBlocked ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(sPos.x, sPos.y);
      ctx.lineTo(cPos.x, cPos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      if (hoveredEntity && hoveredEntity.id !== dragStartNodeRef.current.id) {
        // Highlight hovered node
        ctx.strokeStyle = isBlocked ? '#ef4444' : '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(hoveredEntity.position.x, hoveredEntity.position.y, (hoveredEntity.type === 'CORE' ? 36 : 28), 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Label above target
        const label = isBlocked 
          ? '⛔ BỊ CHẶN BỞI TƯỜNG ĐỎ' 
          : hoveredEntity.faction === 'ADVERSARY' 
            ? '⚔️ TẤN CÔNG / HÚT NĂNG LƯỢNG' 
            : hoveredEntity.faction === 'NEUTRAL'
              ? '🔄 TIẾP QUẢN TRẠM TRUNG LẬP'
              : '🛡️ HỒI MÁU / CHI VIỆN';

        ctx.font = 'bold 10px Inter, sans-serif';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = isBlocked ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cPos.x - tw / 2 - 6, cPos.y - 30, tw + 12, 20, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isBlocked ? '#fca5a5' : '#7dd3fc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cPos.x, cPos.y - 20);
      }
    }

    // Draw Slicing Laser Blade Line & Real-time Hit Preview
    if (sliceLineRef.current) {
      const { x1, y1, x2, y2 } = sliceLineRef.current;
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#e11d48';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Real-time check if crossing a relation line
      const hit = findRelationCrossing(x1, y1, x2, y2);
      if (hit) {
        const { point, cutRatio } = hit;
        // Draw hit circle
        ctx.fillStyle = cutRatio < 0.35 ? '#10b981' : cutRatio > 0.65 ? '#ef4444' : '#38bdf8';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw hit indicator badge
        const badgeText = cutRatio < 0.35 
          ? `⚡ CẮT GỐC (<35%): HỒI +30% HP NHÀ`
          : cutRatio > 0.65 
            ? `💥 CẮT NGỌN (>65%): SỐC -35% HP ĐỊCH`
            : `✂️ CẮT DÂY AN TOÀN (${Math.round(cutRatio * 100)}%)`;

        ctx.font = 'bold 11px Inter, sans-serif';
        const textWidth = ctx.measureText(badgeText).width;
        const badgeX = Math.max(textWidth / 2 + 10, Math.min(width - textWidth / 2 - 10, point.x));
        const badgeY = Math.max(25, point.y - 20);

        ctx.fillStyle = cutRatio < 0.35 ? 'rgba(6, 78, 59, 0.95)' : cutRatio > 0.65 ? 'rgba(136, 19, 55, 0.95)' : 'rgba(30, 41, 59, 0.95)';
        ctx.strokeStyle = cutRatio < 0.35 ? '#10b981' : cutRatio > 0.65 ? '#f43f5e' : '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(badgeX - textWidth / 2 - 8, badgeY - 11, textWidth + 16, 22, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, badgeX, badgeY);
      }
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
      ctx.lineWidth = entity.type === 'CORE' ? 4.5 : 2.5;
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

      // Role or Sound Pitch Badge above node
      if (entity.soundProps?.pitch) {
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(`🎵 ${entity.soundProps.pitch}`, x, y - radius - 6);
      } else if (entity.type === 'CORE') {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText('👑 [NÚT LÕI]', x, y - radius - 6);
      } else if (entity.state.role !== 'NORMAL') {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.fillText(`[${entity.state.role}]`, x, y - radius - 6);
      }
    });

  }, [boardState, isSoundNetworkMode]);

  // Pointer Down (Start connect or start slice)
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isGameOver) return;
    const coords = getCanvasCoords(e);
    const clickedEntity = findEntityAt(coords.x, coords.y);

    if (clickedEntity) {
      if (clickedEntity.soundProps?.pitch) {
        auditoryEngine.playNote(clickedEntity.soundProps.pitch, 0.35, { volume: 0.35, waveform: 'triangle' });
      }
      if (clickedEntity.faction === 'PLAYER') {
        // Start Drag Tether from Player Node
        dragStartNodeRef.current = clickedEntity;
        dragCurrentPosRef.current = coords;
      }
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
        
        // Synthesize musical interval between the two nodes
        const sFreq = dragStartNodeRef.current.soundProps?.freq || 261.63;
        const tFreq = targetEntity.soundProps?.freq || 392.00;
        auditoryEngine.playRelationalConnection(sFreq, tFreq, 'FLOW_CONNECT');
        
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
        
        // Play laser cut sonic snap proportional to cutRatio
        const s = boardState.entities.find(e => e.id === hit.relation.sourceId);
        const cutBaseFreq = s?.soundProps?.freq || 440;
        auditoryEngine.playRelationalCut(cutBaseFreq, hit.cutRatio);
        
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
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-3 sm:p-4 text-slate-100">
      {/* Prediction Gate Overlay */}
      {showPredictionGate && challenge.predictionPrompt && (
        <PredictionGateOverlay
          query={challenge.predictionPrompt}
          onPredictionConfirmed={handlePredictionConfirmed}
        />
      )}

      {/* Control Header */}
      <div className="w-full bg-slate-900/85 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-3 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Màn {currentLevel} • {challenge.titleVi}
              </span>
            </div>
            <div className="text-slate-400 text-xs mt-1 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-slate-200 bg-slate-800/70 px-2 py-0.5 rounded">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {timeLeft}s
              </span>
              <span className="text-cyan-300 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/40">
                Điểm: {score}
              </span>
              {predictionEvaluation && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${predictionEvaluation.isCorrect ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50' : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'}`}>
                  {predictionEvaluation.isCorrect ? '✓ Dự đoán chuẩn (+50đ)' : '✕ Lệch dự đoán'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sound Network Mode Button */}
          <button
            onClick={() => {
              setIsSoundNetworkMode(!isSoundNetworkMode);
              playSound('click');
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSoundNetworkMode
                ? 'bg-purple-600/25 border-purple-500/60 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="Kích hoạt chế độ Cảm Âm & Hòa Âm (Sound Network Mode)"
          >
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span>Mạng Hòa Âm {isSoundNetworkMode ? 'BẬT' : 'TẮT'}</span>
          </button>

          {/* Quick Restart Button */}
          <button
            onClick={() => {
              initLevel();
              playSound('click');
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-700/60 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Chơi lại màn này"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chơi lại</span>
          </button>

          {/* Scroll to Guide Button */}
          <button
            onClick={() => {
              guideSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hướng Dẫn & Ý Nghĩa</span>
          </button>
        </div>
      </div>

      {/* Level Objective & Hint Banner */}
      <div className="w-full bg-gradient-to-r from-slate-900/90 via-cyan-950/30 to-slate-900/90 border border-cyan-500/30 rounded-2xl p-3.5 sm:p-4 mb-3 shadow-lg flex flex-col gap-1.5">
        <div className="flex items-start gap-2.5">
          <Target className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold text-cyan-300 mr-1.5">🎯 Mục tiêu màn {currentLevel}:</span>
            <span className="text-slate-200 font-medium">
              {challenge.objectiveVi || 'Tiêu diệt hoặc thu phục toàn bộ tiền đồn đối phương trên bàn cờ.'}
            </span>
          </div>
        </div>

        {challenge.hintVi && (
          <div className="flex items-start gap-2.5 pt-1.5 border-t border-slate-800/60 text-xs text-amber-300/90">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-amber-300">💡 Mẹo chiến thuật:</strong> {challenge.hintVi}
            </span>
          </div>
        )}
      </div>

      {/* Interactive Cyber Canvas */}
      <div className="relative w-full aspect-[4/3] max-w-[600px] rounded-2xl overflow-hidden border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.2)] bg-slate-950 select-none touch-none">
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

        {/* Real-time status ticker */}
        <div className="absolute top-3 left-3 right-3 pointer-events-none flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-900/85 px-3 py-1.5 rounded-lg border border-slate-700/80 backdrop-blur-md text-slate-200 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-medium truncate max-w-[340px]">{statusMessage}</span>
          </div>
        </div>

        {/* In-game Overlay Helper */}
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex justify-between items-center text-[11px] text-slate-300 bg-slate-900/85 px-3 py-1.5 rounded-lg border border-slate-800/80 backdrop-blur-md shadow-md">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-cyan-400" /> Kéo từ <strong>Nút Xanh</strong> để nối
          </span>
          <span className="flex items-center gap-1.5">
            <Scissors className="w-3 h-3 text-rose-400" /> Vuốt ngang dây để <strong>Cắt Laser</strong>
          </span>
        </div>
      </div>

      {/* Visual HUD Legend Bar */}
      <div className="w-full max-w-[600px] bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 mt-3 shadow-md flex items-center justify-around flex-wrap gap-2 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
          <span>Quân Ta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />
          <span>Quân Địch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
          <span>Trung Lập</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400 font-bold">👑</span>
          <span>Nút Lõi (Core)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-1 bg-rose-500 rounded shadow-[0_0_6px_#ef4444]" />
          <span>Tường Cản</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-emerald-400 font-bold">⚡ Cắt Gốc:</span>
          <span>Hồi Máu</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-rose-400 font-bold">💥 Cắt Ngọn:</span>
          <span>Gây Sốc</span>
        </div>
      </div>

      {/* Comprehensive Guide & Cognitive Science Breakdown Section */}
      <div 
        ref={guideSectionRef}
        className="w-full bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 sm:p-7 mt-8 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>Cẩm Nang Vận Hành & Ý Nghĩa Khoa Học Nhận Thức</span>
              <span className="text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-normal">
                Relational Dynamics Engine
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Giải mã toàn bộ cơ chế mô phỏng tư duy dự đoán, quy luật cắt xúc tu và đòn bẩy nút lõi
            </p>
          </div>
        </div>

        {/* Guide Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto">
          {[
            { id: 'meaning', label: '🧠 Ý Nghĩa Khoa Học', desc: 'Tại sao cần luyện tập?' },
            { id: 'controls', label: '🕹️ Cẩm Nang Điều Khiển', desc: 'Quy luật Xúc Tu & Cắt' },
            { id: 'sound', label: '🎵 Mạng Hòa Âm Thính Giác', desc: 'Cảm âm & Cộng hưởng' },
            { id: 'levels', label: '🗺️ Chiến Thuật 12 Màn', desc: 'Bí kíp phá đảo' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveGuideTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                activeGuideTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Ý Nghĩa Khoa Học & Giá Trị Nhận Thức */}
        {activeGuideTab === 'meaning' && (
          <div className="space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed animate-in fade-in">
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 sm:p-5">
              <h4 className="text-base font-bold text-cyan-300 mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                1. Tại Sao Chức Năng Này Có Giá Trị Nhận Thức Vượt Trội?
              </h4>
              <p className="text-slate-300 mb-3">
                Trong các ứng dụng luyện não truyền thống (như bấm số nhanh, lật thẻ, nhớ ô màu), não bạn chỉ hoạt động theo cơ chế <strong className="text-cyan-300">Kích thích $\rightarrow$ Phản xạ (Stimulus-Response)</strong>. Chơi nhiều chỉ giúp bạn quen tay (học vẹt / overfitting) mà không giúp não thông minh hơn trong đời thực.
              </p>
              <p className="text-slate-300">
                <strong>Mạng Lưới Quan Hệ Động Học (Relational Dynamics)</strong> mang lại bước nhảy vọt nhận thức: Nó yêu cầu não bộ thực hiện <strong className="text-emerald-300">Mô Phỏng Tư Duy (Mental Simulation)</strong> dựa trên nguyên lý <strong className="text-emerald-300">Predictive Coding (Mã Hóa Dự Đoán)</strong>. Trước khi ra tay, não bạn buộc phải "chạy thử kịch bản" trong đầu: <em>Dòng năng lượng sẽ đổ về đâu? Nút nào là trọng yếu? Nhát cắt ở đâu sẽ tạo ra phản ứng dây chuyền thuận lợi?</em>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-3 font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h5 className="font-bold text-white text-sm mb-1.5">Tư Duy Hệ Thống & Đòn Bẩy (Leverage Points)</h5>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Trong kinh doanh, lập trình hay cuộc sống, người xuất sắc không lao vào xử lý mọi tiểu tiết. Họ tìm ra <strong>Nút Thắt Cổ Chai (Bottleneck)</strong> hoặc <strong>Nút Lõi (Core Node)</strong> để can thiệp tối thiểu mà tạo ra kết quả tối đa. Màn chơi Core Dominance rèn luyện chính xác năng lực này.
                </p>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-3 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h5 className="font-bold text-white text-sm mb-1.5">Đo Lường Sai Số Dự Đoán (Prediction Error)</h5>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Pha dự đoán (Prediction Gate) ghi nhận chính xác sai số giữa trực giác của bạn và quy luật vật lý thực tế của hệ thống. Qua từng màn, sai số dự đoán giảm dần, chứng minh khả năng phán đoán và độ nhạy bén của bạn đã được nâng cấp thực chất.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cẩm Nang Điều Khiển & Cơ Chế Hoạt Động */}
        {activeGuideTab === 'controls' && (
          <div className="space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed animate-in fade-in">
            {/* Control 1: Drag to connect */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 sm:p-5">
              <h4 className="text-base font-bold text-cyan-300 mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Thao Tác 1: Kéo Nối Xúc Tu (Drag to Connect)
              </h4>
              <p className="mb-3">
                <strong>Cách làm:</strong> Nhấn giữ chuột hoặc ngón tay vào <span className="text-cyan-400 font-semibold">Nút Xanh (Quân Ta)</span>, kéo đường đứt đoạn sang một nút khác rồi nhả tay.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-rose-500/30">
                  <span className="font-bold text-rose-400 block mb-1">⚔️ Nối sang Đồn Địch (Đỏ):</span>
                  <span>Tự động kích hoạt đòn hút năng lượng. HP của địch sẽ tụt dần cho tới khi chuyển thành quân ta!</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-amber-500/30">
                  <span className="font-bold text-amber-400 block mb-1">🔄 Nối sang Trung Lập (Vàng):</span>
                  <span>Tiếp quản trạm trung chuyển để mở rộng tầm với hoặc luồn lách qua chướng ngại vật.</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-cyan-500/30">
                  <span className="font-bold text-cyan-400 block mb-1">🛡️ Nối sang Đồng Minh (Xanh):</span>
                  <span>Dồn dòng năng lượng hồi máu và chi viện cho các căn cứ đang cạn kiệt HP.</span>
                </div>
              </div>
            </div>

            {/* Control 2: Surgical Cut */}
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 sm:p-5">
              <h4 className="text-base font-bold text-rose-300 mb-2 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-rose-400" />
                Thao Tác 2: Cắt Laser Phẫu Thuật (Surgical Cut - Tuyệt Kỹ Lật Kèo)
              </h4>
              <p className="mb-3">
                <strong>Cách làm:</strong> Nhấn vào khoảng trống trên bàn cờ và vuốt ngang qua bất kỳ sợi dây liên kết nào. Khi đường laser chạm vào dây, bạn sẽ thấy <strong>nhãn chỉ báo thời gian thực</strong> hiển thị hiệu ứng!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-lg">
                  <span className="font-bold text-emerald-400 block mb-1">⚡ CẮT SÁT GỐC NHÀ (&lt;35%):</span>
                  <p className="text-slate-300">
                    Năng lượng phóng đi bị chặn ở đầu cuống, lập tức dội ngược về củng cố căn cứ nhà, <strong className="text-emerald-300">HỒI PHỤC +30% HP</strong>! Cứu nguy thần kỳ khi sắp thua.
                  </p>
                </div>

                <div className="bg-rose-950/40 border border-rose-500/40 p-3 rounded-lg">
                  <span className="font-bold text-rose-400 block mb-1">💥 CẮT SÁT ĐỒN ĐỊCH (&gt;65%):</span>
                  <p className="text-slate-300">
                    Xung lực nén chặt ở sát cửa ngõ đối phương bị phóng thích tạo thành cú sốc phản vệ, <strong className="text-rose-300">GÂY NỔ -35% HP ĐỊCH</strong>! Hạ gục tiền đồn chỉ trong chớp mắt.
                  </p>
                </div>

                <div className="bg-slate-900/60 border border-slate-700/60 p-3 rounded-lg">
                  <span className="font-bold text-slate-300 block mb-1">✂️ CẮT Ở ĐOẠN GIỮA (35% - 65%):</span>
                  <p className="text-slate-400">
                    Hủy liên kết bình thường mà không gây sốc, giúp giải phóng xúc tu để kết nối với các mục tiêu chiến lược mới.
                  </p>
                </div>
              </div>
            </div>

            {/* Control 3: Core & Walls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                <h5 className="font-bold text-amber-300 text-sm mb-2 flex items-center gap-1.5">
                  <span>👑 Quy Luật Nút Lõi (Core Dominance)</span>
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nút Lõi (CORE) có vòng viền kim loại dày và kích thước lớn hơn. Khi bạn tập trung toàn lực đánh sập Nút Lõi, <strong>toàn bộ các nút con phụ thuộc sẽ tự động đầu hàng đổi phe</strong> về phía bạn ngay lập tức!
                </p>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                <h5 className="font-bold text-rose-300 text-sm mb-2 flex items-center gap-1.5">
                  <span>🧱 Tường Năng Lượng (Obstacle)</span>
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tia xúc tu không thể xuyên qua tường đỏ. Bạn phải bắc cầu qua các Nút Trung Chuyển (Màu Vàng) để lượn vòng qua tường và tiếp cận cứ điểm đối phương.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Mạng Hòa Âm Thính Giác */}
        {activeGuideTab === 'sound' && (
          <div className="space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed animate-in fade-in">
            <div className="bg-slate-800/40 border border-purple-500/30 rounded-xl p-4 sm:p-5">
              <h4 className="text-base font-bold text-purple-300 mb-2 flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                Mạng Hòa Âm Thính Giác (Harmonic Sound Network)
              </h4>
              <p className="mb-3">
                Mỗi nút trên bàn cờ được gắn liền với một cao độ âm thanh chuẩn xác (C4 = 261Hz, E4 = 329Hz, G4 = 392Hz, F#4 = 370Hz...). Khi bấm vào nút hoặc nối dây, hệ thống sẽ tổng hợp âm thanh đa âm sắc thời gian thực.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-3">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-purple-500/40">
                  <span className="font-bold text-purple-300 block mb-1">🎵 Hợp Âm Thuận (Consonance - C-E-G):</span>
                  <span>Tạo ra âm thanh êm dịu, hài hòa, đồng thời gia tăng tốc độ truyền dẫn hạt năng lượng lên gấp đôi!</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-rose-500/40">
                  <span className="font-bold text-rose-300 block mb-1">⚡ Nghịch Âm (Dissonance - Quãng 3 Cung Tritone):</span>
                  <span>Tạo ra xung âm hưởng đối kháng, giúp bạn cảm nhận sự căng thẳng hài âm ngay bằng đôi tai.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Chiến Thuật 12 Màn */}
        {activeGuideTab === 'levels' && (
          <div className="space-y-3 text-slate-300 text-xs sm:text-sm animate-in fade-in">
            <p className="text-slate-400 text-xs mb-3">
              Mỗi cấp độ được thiết kế để huấn luyện một khía cạnh nhận thức độc lập:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { lvl: 1, title: 'Phẫu Thuật Xúc Tu', tip: 'Vuốt cắt sát đồn địch B (>65%) để nổ tung -35% HP đối phương.' },
                { lvl: 2, title: 'Tường Năng Lượng', tip: 'Nối qua Trạm Trung Chuyển A4 để vòng qua tường đỏ tới đồn địch B4.' },
                { lvl: 3, title: 'Đòn Bẩy Nút Lõi', tip: 'Tấn công thẳng NÚT LÕI (C3), 3 vệ tinh con sẽ lập tức tự động đầu hàng.' },
                { lvl: 4, title: 'Dự Đoán Dây Chuyền', tip: 'Nối A vào B, năng lượng nhân đôi sẽ dồn tiếp sang công phá điểm C.' },
                { lvl: 5, title: 'Không Gian Động', tip: 'Canh khe hở của vách chắn di động để phóng xúc tu luồn qua.' },
                { lvl: 6, title: 'Sốc Hồi Máu Toàn Mạng', tip: 'Cắt cực sát gốc nguồn (<35%) để thu hồi năng lượng cứu nguy cho Tâm Hồi Phục.' },
                { lvl: 7, title: 'Song Trùng Nút Lõi', tip: 'Tập trung hỏa lực hạ gục 1 Lõi trước thay vì chia đôi sức mạnh.' },
                { lvl: 8, title: 'Mạng Hòa Âm', tip: 'Nối C4 với E4 và G4 để tạo Hợp Âm Đô Trưởng vang dội triệt tiêu nghịch âm F#4.' },
                { lvl: 9, title: 'Đột Biến Quy Tắc', tip: 'Quy tắc đảo ngược! Cắt sát nguồn gây sát thương, cắt sát đích hồi máu.' },
                { lvl: 10, title: 'Domino Tam Cấp', tip: 'Duy trì liên tục chuỗi Nguồn ⟶ Rơ-le 1 ⟶ Rơ-le 2 ⟶ Pháo Đài Đích.' },
                { lvl: 11, title: 'Mê Cung Xoáy', tip: 'Nối ziczac qua trạm trung chuyển ở giữa để lách qua 2 vách ngăn.' },
                { lvl: 12, title: 'Đại Chiến Toàn Diện', tip: 'Chiếm điểm tựa hòa âm E4 để buff toàn mạng, sau đó đồng hóa Ma Vương C5.' }
              ].map(item => (
                <div 
                  key={item.lvl} 
                  className={`p-3 rounded-xl border text-xs ${
                    item.lvl === currentLevel 
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-white mb-1">
                    <span>Màn {item.lvl}: {item.title}</span>
                    {item.lvl === currentLevel && (
                      <span className="text-[10px] bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                        ĐANG CHƠI
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    💡 {item.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
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
