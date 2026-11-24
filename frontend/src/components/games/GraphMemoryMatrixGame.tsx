import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useExerciseSessionConfig } from '../../hooks/useExerciseSessionConfig';
import { GameResultModal } from './GameResultModal';
import { useWrongAnswerTracker } from '../../hooks/useWrongAnswerTracker';
import {
  IGraphMemoryNode,
  IGraphMemoryEdge,
  IGraphMemoryQuery,
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
  ArrowRight,
  Lightbulb
} from 'lucide-react';

interface GeneratedGraphRound {
  roundNumber: number;
  titleVi: string;
  memorizeDurationSec: number;
  nodes: IGraphMemoryNode[];
  edges: IGraphMemoryEdge[];
  query: IGraphMemoryQuery;
  proofEdgeIds: string[];
  proofNodeIds: string[];
  optionNodeMap: Record<string, string>;
}

const NODE_PALETTES = [
  '#38BDF8',
  '#F59E0B',
  '#10B981',
  '#A855F7',
  '#EC4899',
  '#06B6D4',
  '#FB7185'
];

const LABEL_POOLS: string[][] = [
  ['Alpha', 'Beta', 'Gamma', 'Delta', 'Sigma', 'Omega', 'Zeta'],
  ['Trạm A', 'Trạm B', 'Cổng C', 'Đầu D', 'Lõi E', 'Nút F', 'Điểm G'],
  ['Bắc', 'Đông', 'Nam', 'Tây', 'Trung Tâm', 'Cầu K', 'Vành Đai'],
  ['P', 'Q', 'R', 'S', 'T', 'U', 'V']
];

const SLOTS_4 = [
  { x: 90, y: 75 },
  { x: 430, y: 75 },
  { x: 430, y: 225 },
  { x: 90, y: 225 }
];

const SLOTS_5_BRIDGE = [
  { x: 75, y: 70 },
  { x: 75, y: 225 },
  { x: 265, y: 148 },
  { x: 455, y: 70 },
  { x: 455, y: 225 }
];

const SLOTS_6 = [
  { x: 70, y: 75 },
  { x: 265, y: 55 },
  { x: 460, y: 75 },
  { x: 460, y: 225 },
  { x: 265, y: 245 },
  { x: 70, y: 225 }
];

const SLOTS_7 = [
  { x: 265, y: 148 }, // center
  { x: 110, y: 65 },
  { x: 420, y: 65 },
  { x: 480, y: 155 },
  { x: 400, y: 245 },
  { x: 130, y: 245 },
  { x: 55, y: 155 }
];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateGraphMemoryRound(level: number, roundNumber: number): GeneratedGraphRound {
  const effectiveLvl = Math.max(1, level || 1);
  const memorizeDurationSec = effectiveLvl <= 2 ? 5.0 : effectiveLvl <= 6 ? 4.5 : 4.0;
  const labels = shuffleArray(LABEL_POOLS[(roundNumber - 1) % LABEL_POOLS.length]);
  const archetypes: Array<
    'SHORTEST_PATH' | 'BOTTLENECK' | 'REACHABILITY' | 'LOOP_DETECT' | 'NEIGHBOR_COUNT'
  > = ['SHORTEST_PATH', 'BOTTLENECK', 'LOOP_DETECT', 'REACHABILITY', 'NEIGHBOR_COUNT'];
  const archetype = archetypes[(roundNumber - 1 + effectiveLvl) % archetypes.length];

  if (archetype === 'BOTTLENECK') {
    const bridgeSlots = effectiveLvl >= 6 ? SLOTS_6 : SLOTS_5_BRIDGE;
    const nodeCount = bridgeSlots.length;
    const nodes: IGraphMemoryNode[] = bridgeSlots.slice(0, nodeCount).map((pos, idx) => ({
      id: `n-${idx}`,
      label: labels[idx],
      color: idx === 2 ? '#F43F5E' : NODE_PALETTES[idx % NODE_PALETTES.length],
      position: pos
    }));

    const bridgeIdx = effectiveLvl >= 6 ? 1 : 2;
    const leftIdxs = effectiveLvl >= 6 ? [0, 5] : [0, 1];
    const rightIdxs = effectiveLvl >= 6 ? [2, 3, 4] : [3, 4];

    const edges: IGraphMemoryEdge[] = [];
    const proofEdgeIds: string[] = [];
    let eid = 1;

    leftIdxs.forEach(li => {
      const id = `e-${eid++}`;
      edges.push({ id, sourceId: nodes[li].id, targetId: nodes[bridgeIdx].id, isDirected: false });
      proofEdgeIds.push(id);
    });
    rightIdxs.forEach(ri => {
      const id = `e-${eid++}`;
      edges.push({ id, sourceId: nodes[bridgeIdx].id, targetId: nodes[ri].id, isDirected: false });
      proofEdgeIds.push(id);
    });
    // Optional intra-cluster edges so left/right cluster nodes aren't bridges themselves
    if (leftIdxs.length >= 2) {
      edges.push({ id: `e-${eid++}`, sourceId: nodes[leftIdxs[0]].id, targetId: nodes[leftIdxs[1]].id, isDirected: false });
    }
    if (rightIdxs.length >= 2) {
      edges.push({ id: `e-${eid++}`, sourceId: nodes[rightIdxs[0]].id, targetId: nodes[rightIdxs[1]].id, isDirected: false });
    }

    const bridgeNode = nodes[bridgeIdx];
    const distractors = shuffleArray(nodes.filter((_, idx) => idx !== bridgeIdx)).slice(0, 3);
    const optionsRaw = shuffleArray([
      { id: `opt-${bridgeNode.id}`, labelVi: bridgeNode.label, nodeId: bridgeNode.id },
      ...distractors.map(d => ({ id: `opt-${d.id}`, labelVi: d.label, nodeId: d.id }))
    ]);
    const optionNodeMap: Record<string, string> = {};
    optionsRaw.forEach(o => {
      optionNodeMap[o.id] = o.nodeId;
    });

    return {
      roundNumber,
      titleVi: 'Phát hiện Nút Cổ Chai (Bottleneck)',
      memorizeDurationSec,
      nodes,
      edges,
      proofEdgeIds,
      proofNodeIds: [bridgeNode.id],
      optionNodeMap,
      query: {
        id: `q-${roundNumber}`,
        queryType: 'BOTTLENECK',
        questionVi: 'Nếu nút nào bị ngắt kết nối thì mạng lưới sẽ bị chia cắt thành 2 cụm cô lập hoàn toàn?',
        options: optionsRaw.map(({ id, labelVi }) => ({ id, labelVi })),
        correctOptionId: `opt-${bridgeNode.id}`,
        explanationVi: `${bridgeNode.label} là cầu nối duy nhất giữa 2 cụm — mất ${bridgeNode.label}, toàn bộ liên kết giữa 2 phía sẽ đứt gãy.`
      }
    };
  }

  if (archetype === 'LOOP_DETECT') {
    const useFive = effectiveLvl >= 4;
    const rawSlots = useFive ? SLOTS_5_BRIDGE : SLOTS_4;
    const nodes: IGraphMemoryNode[] = rawSlots.map((pos, idx) => ({
      id: `n-${idx}`,
      label: labels[idx],
      color: NODE_PALETTES[idx % NODE_PALETTES.length],
      position: pos
    }));
    const hasCycle = (roundNumber + effectiveLvl) % 2 === 0;
    const cycleIndices = useFive ? [0, 2, 3, 4, 1] : [0, 1, 2, 3];
    const edges: IGraphMemoryEdge[] = [];
    const proofEdgeIds: string[] = [];
    const proofNodeIds: string[] = [];

    for (let i = 0; i < cycleIndices.length - 1; i++) {
      const id = `e-${i + 1}`;
      edges.push({
        id,
        sourceId: nodes[cycleIndices[i]].id,
        targetId: nodes[cycleIndices[i + 1]].id,
        isDirected: true
      });
      proofEdgeIds.push(id);
      proofNodeIds.push(nodes[cycleIndices[i]].id);
    }
    proofNodeIds.push(nodes[cycleIndices[cycleIndices.length - 1]].id);

    const lastIdx = cycleIndices[cycleIndices.length - 1];
    const firstIdx = cycleIndices[0];
    const closingId = `e-close`;
    if (hasCycle) {
      edges.push({
        id: closingId,
        sourceId: nodes[lastIdx].id,
        targetId: nodes[firstIdx].id,
        isDirected: true
      });
      proofEdgeIds.push(closingId);
    } else {
      // Reverse closing edge -> DAG without loop
      edges.push({
        id: closingId,
        sourceId: nodes[firstIdx].id,
        targetId: nodes[lastIdx].id,
        isDirected: true
      });
      proofEdgeIds.push(closingId);
    }

    const cycleNames = cycleIndices.map(i => nodes[i].label).join(' → ') + ` → ${nodes[firstIdx].label}`;

    return {
      roundNumber,
      titleVi: 'Kiểm tra Chu Trình Khép Kín (Loop)',
      memorizeDurationSec,
      nodes,
      edges,
      proofEdgeIds,
      proofNodeIds,
      optionNodeMap: {},
      query: {
        id: `q-${roundNumber}`,
        queryType: 'LOOP_DETECT',
        questionVi: 'Theo chiều các mũi tên vừa quan sát, đồ thị có tạo thành một chu trình khép kín (vòng lặp) hay không?',
        options: [
          {
            id: 'opt-cycle-yes',
            labelVi: hasCycle
              ? `Có, mũi tên khép kín vòng: ${cycleNames}`
              : `Có, tất cả mũi tên nối thành vòng tròn liên hoàn`
          },
          {
            id: 'opt-cycle-no',
            labelVi: `Không, đây là mạng một chiều (cạnh ${nodes[firstIdx].label} → ${nodes[lastIdx].label} chặn vòng lặp)`
          }
        ],
        correctOptionId: hasCycle ? 'opt-cycle-yes' : 'opt-cycle-no',
        explanationVi: hasCycle
          ? `Các mũi tên nối tiếp liên tục quay lại điểm xuất phát (${cycleNames}) tạo thành chu trình khép kín.`
          : `Mũi tên đi từ ${nodes[firstIdx].label} → ${nodes[lastIdx].label} ngược chiều vòng quay nên không thể tạo chu trình khép kín.`
      }
    };
  }

  if (archetype === 'NEIGHBOR_COUNT') {
    const slots = effectiveLvl >= 7 ? SLOTS_7 : SLOTS_6;
    const nodes: IGraphMemoryNode[] = slots.map((pos, idx) => ({
      id: `n-${idx}`,
      label: labels[idx],
      color: NODE_PALETTES[idx % NODE_PALETTES.length],
      position: pos
    }));
    const hubIdx = 0;
    const spokenTargets = shuffleArray(nodes.map((_, i) => i).filter(i => i !== hubIdx)).slice(0, effectiveLvl >= 7 ? 4 : 3);
    const edges: IGraphMemoryEdge[] = [];
    const proofEdgeIds: string[] = [];

    spokenTargets.forEach((tIdx, idx) => {
      const id = `e-hub-${idx}`;
      edges.push({ id, sourceId: nodes[hubIdx].id, targetId: nodes[tIdx].id, isDirected: false });
      proofEdgeIds.push(id);
    });
    // Add 1 minor peripheral edge not touching hub so graph looks rich
    const nonHubA = spokenTargets[0];
    const remaining = nodes.map((_, i) => i).find(i => i !== hubIdx && !spokenTargets.includes(i));
    if (remaining !== undefined) {
      edges.push({ id: 'e-extra', sourceId: nodes[nonHubA].id, targetId: nodes[remaining].id, isDirected: false });
    }

    const hubNode = nodes[hubIdx];
    const distractors = shuffleArray(nodes.filter((_, i) => i !== hubIdx)).slice(0, 3);
    const optionsRaw = shuffleArray([
      { id: `opt-${hubNode.id}`, labelVi: `${hubNode.label}`, nodeId: hubNode.id },
      ...distractors.map(d => ({ id: `opt-${d.id}`, labelVi: d.label, nodeId: d.id }))
    ]);
    const optionNodeMap: Record<string, string> = {};
    optionsRaw.forEach(o => {
      optionNodeMap[o.id] = o.nodeId;
    });

    return {
      roundNumber,
      titleVi: 'Định vị Trạm Trung Tâm (Bậc kết nối)',
      memorizeDurationSec,
      nodes,
      edges,
      proofEdgeIds,
      proofNodeIds: [hubNode.id],
      optionNodeMap,
      query: {
        id: `q-${roundNumber}`,
        queryType: 'NEIGHBOR_COUNT',
        questionVi: 'Nút nào là trạm trung chuyển nắm giữ NHIỀU kết nối trực tiếp nhất?',
        options: optionsRaw.map(({ id, labelVi }) => ({ id, labelVi })),
        correctOptionId: `opt-${hubNode.id}`,
        explanationVi: `${hubNode.label} kết nối trực tiếp với ${spokenTargets.length} nút khác (các nút còn lại tối đa 1–2 cạnh).`
      }
    };
  }

  if (archetype === 'REACHABILITY') {
    const slots = effectiveLvl >= 5 ? SLOTS_6 : SLOTS_5_BRIDGE;
    const nodes: IGraphMemoryNode[] = slots.map((pos, idx) => ({
      id: `n-${idx}`,
      label: labels[idx],
      color: NODE_PALETTES[idx % NODE_PALETTES.length],
      position: pos
    }));
    const shuffledIdxs = shuffleArray(nodes.map((_, i) => i));
    const [srcIdx, directTargetIdx, decoyRevIdx, secondHopIdx, ...restIdxs] = shuffledIdxs;

    const eDirectId = 'e-direct';
    const edges: IGraphMemoryEdge[] = [
      { id: eDirectId, sourceId: nodes[srcIdx].id, targetId: nodes[directTargetIdx].id, isDirected: true },
      // Reverse direction decoy: points TO src, NOT from src
      { id: 'e-rev', sourceId: nodes[decoyRevIdx].id, targetId: nodes[srcIdx].id, isDirected: true },
      // 2-hop decoy: goes from directTarget -> secondHop
      { id: 'e-hop2', sourceId: nodes[directTargetIdx].id, targetId: nodes[secondHopIdx].id, isDirected: true }
    ];
    if (restIdxs.length > 0) {
      edges.push({
        id: 'e-distract',
        sourceId: nodes[decoyRevIdx].id,
        targetId: nodes[restIdxs[0]].id,
        isDirected: true
      });
    }

    const srcNode = nodes[srcIdx];
    const targetNode = nodes[directTargetIdx];
    const revNode = nodes[decoyRevIdx];
    const hopNode = nodes[secondHopIdx];

    const optionsRaw = shuffleArray([
      { id: `opt-${targetNode.id}`, labelVi: `${targetNode.label} (${srcNode.label} → ${targetNode.label})`, nodeId: targetNode.id },
      { id: `opt-${revNode.id}`, labelVi: revNode.label, nodeId: revNode.id },
      { id: `opt-${hopNode.id}`, labelVi: hopNode.label, nodeId: hopNode.id },
      { id: 'opt-none', labelVi: 'Không đi trực tiếp tới nút nào', nodeId: '' }
    ]);
    const optionNodeMap: Record<string, string> = {};
    optionsRaw.forEach(o => {
      if (o.nodeId) optionNodeMap[o.id] = o.nodeId;
    });

    return {
      roundNumber,
      titleVi: 'Kiểm tra Chiều Mũi Tên Trực Tiếp',
      memorizeDurationSec,
      nodes,
      edges,
      proofEdgeIds: [eDirectId],
      proofNodeIds: [srcNode.id, targetNode.id],
      optionNodeMap,
      query: {
        id: `q-${roundNumber}`,
        queryType: 'REACHABILITY',
        questionVi: `Từ "${srcNode.label}" có mũi tên đi TRỰC TIẾP tới nút nào sau đây?`,
        options: optionsRaw.map(({ id, labelVi }) => ({ id, labelVi })),
        correctOptionId: `opt-${targetNode.id}`,
        explanationVi: `Mũi tên xuất phát trực tiếp từ ${srcNode.label} chỉ sang ${targetNode.label}. Lưu ý ${revNode.label} chỉ vào ${srcNode.label} (ngược chiều), còn ${hopNode.label} phải qua trạm trung gian.`
      }
    };
  }

  // Default: 'SHORTEST_PATH'
  const slots = effectiveLvl >= 5 ? SLOTS_6 : SLOTS_5_BRIDGE;
  const nodes: IGraphMemoryNode[] = slots.map((pos, idx) => ({
    id: `n-${idx}`,
    label: labels[idx],
    color: NODE_PALETTES[idx % NODE_PALETTES.length],
    position: pos
  }));
  const perm = shuffleArray(nodes.map((_, i) => i));
  const [startIdx, midIdx, endIdx, dec1Idx, dec2Idx] = perm;

  const edges: IGraphMemoryEdge[] = [
    { id: 'e-path-1', sourceId: nodes[startIdx].id, targetId: nodes[midIdx].id, isDirected: true },
    { id: 'e-path-2', sourceId: nodes[midIdx].id, targetId: nodes[endIdx].id, isDirected: true },
    // Decoy branch that dead-ends at dec2
    { id: 'e-dec-1', sourceId: nodes[startIdx].id, targetId: nodes[dec1Idx].id, isDirected: true },
    { id: 'e-dec-2', sourceId: nodes[dec1Idx].id, targetId: nodes[dec2Idx].id, isDirected: true }
  ];
  if (nodes.length >= 6) {
    const extraIdx = perm[5];
    edges.push({ id: 'e-extra', sourceId: nodes[endIdx].id, targetId: nodes[extraIdx].id, isDirected: true });
  }

  const startNode = nodes[startIdx];
  const midNode = nodes[midIdx];
  const endNode = nodes[endIdx];
  const dec1Node = nodes[dec1Idx];

  const optionsRaw = shuffleArray([
    { id: `opt-${midNode.id}`, labelVi: `Đi qua nút ${midNode.label}`, nodeId: midNode.id },
    { id: `opt-${dec1Node.id}`, labelVi: `Đi qua nút ${dec1Node.label}`, nodeId: dec1Node.id },
    { id: 'opt-direct', labelVi: `Nối thẳng trực tiếp ${startNode.label} → ${endNode.label}`, nodeId: '' },
    { id: 'opt-none', labelVi: 'Không có đường đi xuôi chiều', nodeId: '' }
  ]);
  const optionNodeMap: Record<string, string> = {};
  optionsRaw.forEach(o => {
    if (o.nodeId) optionNodeMap[o.id] = o.nodeId;
  });

  return {
    roundNumber,
    titleVi: 'Truy vết Đường Đi Có Hướng',
    memorizeDurationSec,
    nodes,
    edges,
    proofEdgeIds: ['e-path-1', 'e-path-2'],
    proofNodeIds: [startNode.id, midNode.id, endNode.id],
    optionNodeMap,
    query: {
      id: `q-${roundNumber}`,
      queryType: 'SHORTEST_PATH',
      questionVi: `Để đi từ "${startNode.label}" tới "${endNode.label}" theo đúng chiều mũi tên, ta phải đi qua trạm nào?`,
      options: optionsRaw.map(({ id, labelVi }) => ({ id, labelVi })),
      correctOptionId: `opt-${midNode.id}`,
      explanationVi: `Đường nối có hướng là: ${startNode.label} → ${midNode.label} → ${endNode.label}. Nhánh qua ${dec1Node.label} rẽ sang ${nodes[dec2Idx].label}, không dẫn tới ${endNode.label}.`
    }
  };
}

export const GraphMemoryMatrixGame: React.FC = () => {
  const {
    currentLevel,
    getExerciseLevel,
    setActiveGameSlug,
    playSound,
    isGamePaused,
    ladderSessionRounds
  } = useAppStore();
  const { sessionConfig, isCustom } = useExerciseSessionConfig('graph-memory-matrix');
  const { trackWrongAnswer } = useWrongAnswerTracker('graph-memory-matrix');
  const sessionIdRef = useRef<string>(`session-graph-${Date.now()}`);

  const ladderLevel = getExerciseLevel('graph-memory-matrix') || currentLevel || 1;
  const playedLevelRef = useRef<number>(isCustom ? 0 : ladderLevel);
  const effectiveLevel = isCustom ? (sessionConfig.level || 1) : playedLevelRef.current;

  const totalRounds = useMemo(() => {
    if (sessionConfig.rounds && sessionConfig.rounds > 0) {
      return sessionConfig.rounds;
    }
    return Math.max(1, ladderSessionRounds || 6);
  }, [sessionConfig.rounds, ladderSessionRounds]);

  // Game States: 'MEMORIZING' -> 'QUERYING' -> 'FINISHED'
  const [currentRoundIdx, setCurrentRoundIdx] = useState<number>(0);
  const [roundData, setRoundData] = useState<GeneratedGraphRound>(() =>
    generateGraphMemoryRound(effectiveLevel, 1)
  );
  const [phase, setPhase] = useState<'MEMORIZING' | 'QUERYING' | 'FINISHED'>('MEMORIZING');
  const [memorizeCountdown, setMemorizeCountdown] = useState<number>(roundData.memorizeDurationSec);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Ghi nhớ toàn bộ mạng lưới liên kết trước khi đường nối bị ẩn!'
  );

  const relationEventsRef = useRef<IRelationEvent[]>([]);
  const queryStartTimeRef = useRef<number>(Date.now());

  const startRound = useCallback(
    (roundIndex: number) => {
      const nextRound = generateGraphMemoryRound(effectiveLevel, roundIndex + 1);
      setRoundData(nextRound);
      setCurrentRoundIdx(roundIndex);
      setPhase('MEMORIZING');
      setMemorizeCountdown(nextRound.memorizeDurationSec);
      setSelectedOptionId(null);
      setIsAnswered(false);
      setStatusMessage('Ghi nhớ vị trí các nút và chiều mũi tên trước khi chúng ẩn đi!');
    },
    [effectiveLevel]
  );

  const initSession = useCallback(() => {
    sessionIdRef.current = `session-graph-${Date.now()}`;
    relationEventsRef.current = [];
    setScore(0);
    setCorrectAnswersCount(0);
    setElapsedSec(0);
    startRound(0);
  }, [startRound]);

  // Real Elapsed Timer
  useEffect(() => {
    if (phase === 'FINISHED' || isGamePaused) return;
    const t = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase, isGamePaused]);

  // Memorization Countdown Timer
  useEffect(() => {
    if (phase !== 'MEMORIZING' || isGamePaused) return;

    const interval = setInterval(() => {
      setMemorizeCountdown(prev => {
        if (prev <= 0.5) {
          clearInterval(interval);
          setPhase('QUERYING');
          queryStartTimeRef.current = Date.now();
          playSound('click');
          setStatusMessage('Đường liên kết đã ẩn! Hãy tái hiện cấu trúc mạng trong trí nhớ.');
          return 0;
        }
        return Math.round((prev - 0.5) * 10) / 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [phase, isGamePaused, playSound, currentRoundIdx]);

  // Handle Option Select
  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (isAnswered || phase !== 'QUERYING') return;
      const responseMs = Math.max(200, Date.now() - queryStartTimeRef.current);
      const isCorrect = optionId === roundData.query.correctOptionId;

      setSelectedOptionId(optionId);
      setIsAnswered(true);

      if (isCorrect) {
        playSound('correct');
        setScore(s => s + 100 + (effectiveLevel || 1) * 10);
        setCorrectAnswersCount(c => c + 1);
        setStatusMessage('Chính xác! Đồ thị và đường dẫn chứng đã được bật sáng màu xanh.');
      } else {
        playSound('wrong');
        setStatusMessage(roundData.query.explanationVi);
        const userOpt = roundData.query.options.find(o => o.id === optionId);
        const correctOpt = roundData.query.options.find(
          o => o.id === roundData.query.correctOptionId
        );
        trackWrongAnswer({
          round: currentRoundIdx + 1,
          difficultyLevel: effectiveLevel || 1,
          questionContext: {
            prompt: roundData.query.questionVi,
            challengeType: roundData.query.queryType,
            articleTitle: roundData.titleVi
          },
          correctAnswer: {
            label: correctOpt?.labelVi || roundData.query.correctOptionId,
            code: roundData.query.correctOptionId
          },
          userAnswer: {
            label: userOpt?.labelVi || optionId,
            code: optionId
          },
          responseTimeMs: responseMs,
          sessionId: sessionIdRef.current
        });
      }

      relationEventsRef.current.push({
        t: responseMs / 1000,
        exerciseSlug: 'graph-memory-matrix',
        level: effectiveLevel,
        trialId: `graph-r${currentRoundIdx + 1}-${Date.now()}`,
        relationId: 'ORDER_SEQUENCE',
        relationWeight: 0.9,
        entities: { selected: optionId, correct: roundData.query.correctOptionId },
        stateBefore: 'EDGES_HIDDEN',
        stateAfter: 'ANSWERED',
        responseMs,
        correct: isCorrect
      });
    },
    [
      isAnswered,
      phase,
      roundData,
      playSound,
      effectiveLevel,
      trackWrongAnswer,
      currentRoundIdx
    ]
  );

  // Next Round or Finish
  const handleNext = useCallback(() => {
    if (currentRoundIdx + 1 < totalRounds) {
      startRound(currentRoundIdx + 1);
    } else {
      setPhase('FINISHED');
      playSound('victory');
    }
  }, [currentRoundIdx, totalRounds, startRound, playSound]);

  // Keyboard shortcuts: 1-4 to select answer, Enter/Space to advance
  useEffect(() => {
    if (phase !== 'QUERYING' || isGamePaused) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!isAnswered) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < roundData.query.options.length) {
          e.preventDefault();
          handleSelectOption(roundData.query.options[idx].id);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isGamePaused, isAnswered, roundData, handleSelectOption, handleNext]);

  const rawMetricsJson: IRawMetricsJson = {
    schemaVersion: 'v1',
    relationEvents: relationEventsRef.current
  };

  const accuracyRate = Math.round((correctAnswersCount / Math.max(1, totalRounds)) * 100);
  const selectedOptObj = roundData.query.options.find(o => o.id === selectedOptionId);
  const correctOptObj = roundData.query.options.find(o => o.id === roundData.query.correctOptionId);
  const wasWrong = isAnswered && selectedOptionId !== roundData.query.correctOptionId;
  const wrongChosenNodeId =
    wasWrong && selectedOptionId ? roundData.optionNodeMap[selectedOptionId] : undefined;

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-3 sm:p-4 pb-24">
      {/* Control Header */}
      <div className="w-full bg-white/90 dark:bg-slate-900/85 border border-[#D5CBB9] dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-4 shadow-sm dark:shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/40">
                Lượt {currentRoundIdx + 1}/{totalRounds} • Cấp {effectiveLevel}
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {roundData.titleVi}
              </span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs mt-1 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                {phase === 'MEMORIZING' ? `Ghi nhớ: ${memorizeCountdown}s` : 'Pha Truy Vấn'}
              </span>
              <span>•</span>
              <span className="text-cyan-700 dark:text-cyan-300 font-semibold">Điểm: {score}</span>
              <span>•</span>
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                Đúng: {correctAnswersCount}/{currentRoundIdx + (isAnswered ? 1 : 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Phase Indicator Badge */}
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs border ${
            phase === 'MEMORIZING'
              ? 'bg-amber-50 dark:bg-slate-800/70 border-amber-300 dark:border-slate-700/60'
              : isAnswered
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400/50'
                : 'bg-cyan-50 dark:bg-slate-800/70 border-cyan-300 dark:border-slate-700/60'
          }`}
        >
          {phase === 'MEMORIZING' ? (
            <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold animate-pulse">
              <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ĐANG HIỂN THỊ MẠNG ({memorizeCountdown}s)
            </span>
          ) : isAnswered ? (
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
              <Eye className="w-4 h-4 text-emerald-500" />
              ĐÃ BẬT LẠI MẠNG ĐỐI CHIẾU
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-cyan-800 dark:text-cyan-300 font-bold">
              <EyeOff className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              ĐÃ ẨN ĐƯỜNG NỐI (TRUY VẤN TRÍ NHỚ)
            </span>
          )}
        </div>
      </div>

      {/* Main Board Visualizer */}
      <div className="relative w-full max-w-[660px] rounded-2xl border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-slate-950 p-4 sm:p-6 flex flex-col gap-4 select-none">
        {/* Responsive SVG Graph Canvas */}
        <div className="relative w-full">
          <svg viewBox="0 0 600 320" className="w-full h-auto max-h-[300px]">
            <defs>
              <marker
                id="graph-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#e879f9" />
              </marker>
              <marker
                id="graph-arrow-proof"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
            </defs>

            {/* Edges */}
            {roundData.edges.map(edge => {
              const src = roundData.nodes.find(n => n.id === edge.sourceId);
              const tgt = roundData.nodes.find(n => n.id === edge.targetId);
              if (!src || !tgt) return null;

              const isMemorizing = phase === 'MEMORIZING';
              const isRevealedProof = isAnswered;
              const isProofEdge = isAnswered && roundData.proofEdgeIds.includes(edge.id);

              const cx1 = src.position.x + 28;
              const cy1 = src.position.y + 21;
              const cx2 = tgt.position.x + 28;
              const cy2 = tgt.position.y + 21;
              const dx = cx2 - cx1;
              const dy = cy2 - cy1;
              const dist = Math.hypot(dx, dy) || 1;
              const padEnd = edge.isDirected ? 28 : 22;
              const x1 = cx1 + (dx / dist) * 24;
              const y1 = cy1 + (dy / dist) * 24;
              const x2 = cx2 - (dx / dist) * padEnd;
              const y2 = cy2 - (dy / dist) * padEnd;

              const strokeColor = isProofEdge
                ? '#10b981'
                : isMemorizing
                  ? '#a855f7'
                  : isRevealedProof
                    ? 'rgba(168, 85, 247, 0.45)'
                    : 'rgba(168, 85, 247, 0.06)';
              const strokeW = isProofEdge ? 4 : isMemorizing ? 3 : isRevealedProof ? 2 : 1;
              const marker =
                edge.isDirected && (isMemorizing || isRevealedProof)
                  ? isProofEdge
                    ? 'url(#graph-arrow-proof)'
                    : 'url(#graph-arrow)'
                  : undefined;

              return (
                <g key={edge.id} className="transition-opacity duration-500">
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={strokeColor}
                    strokeWidth={strokeW}
                    strokeDasharray={isMemorizing && edge.isDirected ? '6 3' : undefined}
                    markerEnd={marker}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {roundData.nodes.map(node => {
              const cx = node.position.x + 28;
              const cy = node.position.y + 21;
              const pillW = Math.max(66, node.label.length * 8.5 + 24);
              const pillH = 38;
              const isProofNode = isAnswered && roundData.proofNodeIds.includes(node.id);
              const isWrongNode = isAnswered && wrongChosenNodeId === node.id && !isProofNode;

              const fill = isWrongNode
                ? '#4c0519'
                : isProofNode
                  ? '#064e3b'
                  : '#0f172a';
              const stroke = isWrongNode
                ? '#f43f5e'
                : isProofNode
                  ? '#10b981'
                  : node.color || '#a855f7';

              return (
                <g key={node.id}>
                  <rect
                    x={cx - pillW / 2}
                    y={cy - pillH / 2}
                    width={pillW}
                    height={pillH}
                    rx={pillH / 2}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isProofNode || isWrongNode ? 3.5 : 2.5}
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
                  {isProofNode && (
                    <text
                      x={cx}
                      y={cy - pillH / 2 - 5}
                      textAnchor="middle"
                      fill="#34d399"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      ✓ Đáp án
                    </text>
                  )}
                  {isWrongNode && (
                    <text
                      x={cx}
                      y={cy - pillH / 2 - 5}
                      textAnchor="middle"
                      fill="#fb7185"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      ✕ Bạn chọn
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Query & Interaction Area */}
        {phase === 'QUERYING' && (
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>
                  Lượt {currentRoundIdx + 1}/{totalRounds}:
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                Phím 1-{roundData.query.options.length} để chọn
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-100">
              {roundData.query.questionVi}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roundData.query.options.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id;
                const isCorrect = opt.id === roundData.query.correctOptionId;

                let btnStyle =
                  'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-purple-400/60 cursor-pointer';
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle =
                      'bg-emerald-950/90 border-2 border-emerald-400 text-emerald-100 shadow-md shadow-emerald-500/20';
                  } else if (isSelected) {
                    btnStyle =
                      'bg-rose-950/90 border-2 border-rose-400 text-rose-100 shadow-md shadow-rose-500/20';
                  } else {
                    btnStyle = 'bg-slate-800/35 border-slate-800 text-slate-500';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full min-h-[48px] p-3 rounded-xl border text-xs sm:text-sm font-semibold text-left transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-700/70 text-[10px] font-mono text-slate-300 hidden sm:inline">
                        {idx + 1}
                      </span>
                      <span>{opt.labelVi}</span>
                    </span>
                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="mt-2 pt-3 border-t border-slate-800 space-y-3">
                {wasWrong && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs">
                      <div className="font-bold uppercase tracking-wider text-rose-400 text-[10px]">
                        Lựa chọn của bạn (Sai)
                      </div>
                      <div className="font-bold text-rose-200 mt-0.5">
                        ✕ {selectedOptObj?.labelVi}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs">
                      <div className="font-bold uppercase tracking-wider text-emerald-400 text-[10px]">
                        Đáp án chuẩn (Đường xanh trên sơ đồ)
                      </div>
                      <div className="font-bold text-emerald-200 mt-0.5">
                        ✓ {correctOptObj?.labelVi}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2 text-xs text-slate-200 bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-700">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{statusMessage}</span>
                  </div>
                  <button
                    onClick={handleNext}
                    className="shrink-0 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    <span>
                      {currentRoundIdx + 1 >= totalRounds ? 'Xem kết quả' : `Tiếp tục (${currentRoundIdx + 2}/${totalRounds})`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
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
          playedLevel={effectiveLevel || 1}
          isCustom={isCustom}
          rawMetricsJson={rawMetricsJson}
          onRestart={initSession}
          onClose={() => setActiveGameSlug(null)}
        />
      )}
    </div>
  );
};
