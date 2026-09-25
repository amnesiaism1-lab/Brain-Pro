import {
  IRdeChallengeLevel,
  ICausalChallenge,
  IGraphMemoryLevel,
  IRuleMutationTrial
} from './types';

export const RDE_SAMPLE_CHALLENGES: IRdeChallengeLevel[] = [
  {
    level: 1,
    titleVi: 'Cấp 1: Phẫu Thuật Xúc Tu - Khoảng Cách & Hiệu Ứng',
    mode: 'SURGICAL_CUT',
    timeLimitSec: 45,
    requiredScore: 80,
    targetRelations: ['TARGET_POSITION', 'RULE_ACTION', 'SPATIAL_TRANSFORM'],
    entities: [
      {
        id: 'node-alpha',
        type: 'NODE',
        faction: 'PLAYER',
        label: 'Tế bào Mẹ (C4)',
        position: { x: 130, y: 220 },
        soundProps: { pitch: 'C4', freq: 261.63, harmonyRole: 'TONIC' },
        state: {
          value: 35,
          maxValue: 60,
          status: 'ACTIVE',
          role: 'NORMAL',
          capacity: 3,
          activeConnectionsCount: 1
        }
      },
      {
        id: 'node-beta',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Tiền Đồn Địch (G4)',
        position: { x: 390, y: 220 },
        soundProps: { pitch: 'G4', freq: 392.00, harmonyRole: 'DOMINANT' },
        state: {
          value: 28,
          maxValue: 50,
          status: 'ACTIVE',
          role: 'ATTACKER',
          capacity: 2,
          activeConnectionsCount: 1
        }
      }
    ],
    relations: [
      {
        id: 'rel-init-1',
        sourceId: 'node-alpha',
        targetId: 'node-beta',
        type: 'FLOW_CONNECT',
        properties: {
          strength: 3.0,
          distance: 260,
          direction: 'DIRECTED',
          isActive: true,
          cuttable: true,
          cutAffinity: 'TARGET_BIASED',
          flowSpeed: 1.5,
          harmonicConsonance: 'PERFECT_CONSONANCE',
          intervalSemitones: 7
        }
      }
    ],
    predictionPrompt: {
      questionVi: 'Nếu bạn thực hiện vết cắt sát nút B (ratio > 0.7), điều gì sẽ xảy ra cho hệ thống?',
      options: [
        { id: 'opt-1', labelVi: 'Sốc phản vệ dội về gây sát thương mạnh lên B (-35% HP)' },
        { id: 'opt-2', labelVi: 'Toàn bộ năng lượng chảy ngược về hồi phục A' },
        { id: 'opt-3', labelVi: 'Nút A và B đều bị phá hủy hoàn toàn' }
      ],
      correctOptionId: 'opt-1',
      targetRelations: ['RULE_ACTION', 'TEMPORAL_PREDICT']
    }
  },
  {
    level: 2,
    titleVi: 'Cấp 2: Rào Cản Không Gian - Tường Năng Lượng',
    mode: 'SURGICAL_CUT',
    timeLimitSec: 45,
    requiredScore: 85,
    targetRelations: ['SPATIAL_TRANSFORM', 'TARGET_DISTRACTOR', 'RULE_ACTION'],
    obstacles: [
      { id: 'wall-1', x1: 260, y1: 80, x2: 260, y2: 260 }
    ],
    entities: [
      {
        id: 'node-p1',
        type: 'NODE',
        faction: 'PLAYER',
        label: 'Cứ điểm Gốc (E4)',
        position: { x: 120, y: 150 },
        soundProps: { pitch: 'E4', freq: 329.63, harmonyRole: 'MEDIANT' },
        state: { value: 40, maxValue: 70, status: 'ACTIVE', role: 'NORMAL', capacity: 3, activeConnectionsCount: 0 }
      },
      {
        id: 'node-mid',
        type: 'NODE',
        faction: 'NEUTRAL',
        label: 'Nút Trung Chuyển (A4)',
        position: { x: 260, y: 330 },
        soundProps: { pitch: 'A4', freq: 440.00, harmonyRole: 'SUBDOMINANT' },
        state: { value: 20, maxValue: 40, status: 'ACTIVE', role: 'HEALER', capacity: 3, activeConnectionsCount: 0 }
      },
      {
        id: 'node-enemy',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Pháo Đài Địch (B4)',
        position: { x: 400, y: 150 },
        soundProps: { pitch: 'B4', freq: 493.88, harmonyRole: 'DOMINANT' },
        state: { value: 35, maxValue: 60, status: 'ACTIVE', role: 'ATTACKER', capacity: 2, activeConnectionsCount: 0 }
      }
    ],
    relations: [],
    predictionPrompt: {
      questionVi: 'Tường năng lượng nằm giữa P1 và Địch. Làm sao để tấn công Pháo Đài Địch?',
      options: [
        { id: 'opt-w1', labelVi: 'Nối qua Nút Trung Chuyển ở phía dưới tường' },
        { id: 'opt-w2', labelVi: 'Cắt trực tiếp bức tường bằng cử chỉ vuốt ngang' },
        { id: 'opt-w3', labelVi: 'Đứng yên chờ bức tường tự phân rã' }
      ],
      correctOptionId: 'opt-w1',
      targetRelations: ['SPATIAL_TRANSFORM', 'RULE_ACTION']
    }
  },
  {
    level: 3,
    titleVi: 'Cấp 3: Đòn Bẩy Nút Lõi - Centrality Dominance',
    mode: 'CORE_DOMINANCE',
    timeLimitSec: 50,
    requiredScore: 90,
    targetRelations: ['PART_WHOLE', 'RULE_ACTION', 'CONTEXT_MEANING'],
    entities: [
      {
        id: 'node-core',
        type: 'CORE',
        faction: 'ADVERSARY',
        label: 'NÚT LÕI (C3)',
        position: { x: 300, y: 220 },
        soundProps: { pitch: 'C3', freq: 130.81, harmonyRole: 'TONIC' },
        state: { value: 45, maxValue: 80, status: 'ACTIVE', role: 'CORE', capacity: 5, activeConnectionsCount: 3 }
      },
      {
        id: 'sub-node-1',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Vệ Tinh 1 (E3)',
        position: { x: 200, y: 110 },
        soundProps: { pitch: 'E3', freq: 164.81, harmonyRole: 'MEDIANT' },
        state: { value: 15, maxValue: 30, status: 'ACTIVE', role: 'NORMAL', capacity: 1, activeConnectionsCount: 1 }
      },
      {
        id: 'sub-node-2',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Vệ Tinh 2 (G3)',
        position: { x: 400, y: 110 },
        soundProps: { pitch: 'G3', freq: 196.00, harmonyRole: 'DOMINANT' },
        state: { value: 15, maxValue: 30, status: 'ACTIVE', role: 'NORMAL', capacity: 1, activeConnectionsCount: 1 }
      },
      {
        id: 'sub-node-3',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Vệ Tinh 3 (Bb3)',
        position: { x: 300, y: 340 },
        soundProps: { pitch: 'Bb3', freq: 233.08, harmonyRole: 'PASSING' },
        state: { value: 18, maxValue: 30, status: 'ACTIVE', role: 'NORMAL', capacity: 1, activeConnectionsCount: 1 }
      },
      {
        id: 'player-base',
        type: 'NODE',
        faction: 'PLAYER',
        label: 'Bộ Chỉ Huy (C4)',
        position: { x: 90, y: 320 },
        soundProps: { pitch: 'C4', freq: 261.63, harmonyRole: 'TONIC' },
        state: { value: 50, maxValue: 70, status: 'ACTIVE', role: 'ATTACKER', capacity: 3, activeConnectionsCount: 0 }
      }
    ],
    relations: [
      {
        id: 'rel-c1',
        sourceId: 'node-core',
        targetId: 'sub-node-1',
        type: 'CONTROL_DEPEND',
        properties: { strength: 2, distance: 120, direction: 'DIRECTED', isActive: true, cuttable: false, cutAffinity: 'BALANCED', flowSpeed: 1, harmonicConsonance: 'IMPERFECT_CONSONANCE', intervalSemitones: 4 }
      },
      {
        id: 'rel-c2',
        sourceId: 'node-core',
        targetId: 'sub-node-2',
        type: 'CONTROL_DEPEND',
        properties: { strength: 2, distance: 120, direction: 'DIRECTED', isActive: true, cuttable: false, cutAffinity: 'BALANCED', flowSpeed: 1, harmonicConsonance: 'PERFECT_CONSONANCE', intervalSemitones: 7 }
      },
      {
        id: 'rel-c3',
        sourceId: 'node-core',
        targetId: 'sub-node-3',
        type: 'CONTROL_DEPEND',
        properties: { strength: 2, distance: 120, direction: 'DIRECTED', isActive: true, cuttable: false, cutAffinity: 'BALANCED', flowSpeed: 1, harmonicConsonance: 'DISSONANCE', intervalSemitones: 10 }
      }
    ],
    predictionPrompt: {
      questionVi: 'Nếu Bộ Chỉ Huy tập trung toàn lực đánh sập NÚT LÕI (CORE), các Vệ Tinh sẽ ra sao?',
      options: [
        { id: 'opt-core-win', labelVi: 'Toàn bộ 3 Vệ Tinh mất chỉ huy và lập tức bị đồng hóa về phe Player' },
        { id: 'opt-core-lose', labelVi: '3 Vệ Tinh sẽ tăng gấp đôi sức mạnh tấn công trả thù' },
        { id: 'opt-core-same', labelVi: 'Không ảnh hưởng gì, phải chiếm từng vệ tinh riêng lẻ' }
      ],
      correctOptionId: 'opt-core-win',
      targetRelations: ['PART_WHOLE', 'RULE_ACTION']
    }
  },
  {
    level: 4,
    titleVi: 'Cấp 4: Dự Đoán Dây Chuyền - Cascade Prediction',
    mode: 'CASCADE_PREDICT',
    timeLimitSec: 50,
    requiredScore: 90,
    targetRelations: ['TEMPORAL_PREDICT', 'RULE_ACTION', 'ORDER_SEQUENCE'],
    entities: [
      {
        id: 'node-cas-a',
        type: 'NODE',
        faction: 'PLAYER',
        label: 'Ngòi Nổ A (D4)',
        position: { x: 100, y: 220 },
        soundProps: { pitch: 'D4', freq: 293.66, harmonyRole: 'SUBDOMINANT' },
        state: { value: 60, maxValue: 80, status: 'ACTIVE', role: 'NORMAL', capacity: 2, activeConnectionsCount: 1 }
      },
      {
        id: 'node-cas-b',
        type: 'NODE',
        faction: 'NEUTRAL',
        label: 'Truyền Dẫn B (F#4)',
        position: { x: 260, y: 220 },
        soundProps: { pitch: 'F#4', freq: 369.99, harmonyRole: 'MEDIANT' },
        state: { value: 15, maxValue: 30, status: 'ACTIVE', role: 'AMPLIFIER', capacity: 2, activeConnectionsCount: 2 }
      },
      {
        id: 'node-cas-c',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Cứ Điểm C (A4)',
        position: { x: 420, y: 220 },
        soundProps: { pitch: 'A4', freq: 440.00, harmonyRole: 'DOMINANT' },
        state: { value: 30, maxValue: 50, status: 'ACTIVE', role: 'ATTACKER', capacity: 2, activeConnectionsCount: 1 }
      }
    ],
    relations: [
      {
        id: 'rel-cas-1',
        sourceId: 'node-cas-a',
        targetId: 'node-cas-b',
        type: 'FLOW_CONNECT',
        properties: { strength: 4, distance: 160, direction: 'DIRECTED', isActive: true, cuttable: true, cutAffinity: 'BALANCED', flowSpeed: 2, harmonicConsonance: 'IMPERFECT_CONSONANCE', intervalSemitones: 4 }
      },
      {
        id: 'rel-cas-2',
        sourceId: 'node-cas-b',
        targetId: 'node-cas-c',
        type: 'ATTACK_DRAIN',
        properties: { strength: 4, distance: 160, direction: 'DIRECTED', isActive: true, cuttable: true, cutAffinity: 'TARGET_BIASED', flowSpeed: 2, harmonicConsonance: 'IMPERFECT_CONSONANCE', intervalSemitones: 3 }
      }
    ],
    predictionPrompt: {
      questionVi: 'Nếu ngòi nổ A kích hoạt dòng xung lực, chuỗi phản ứng sẽ kết thúc ở trạng thái nào?',
      options: [
        { id: 'opt-cas-1', labelVi: 'B được nạp đầy và tự động phóng xung hạ gục điểm C' },
        { id: 'opt-cas-2', labelVi: 'C dội ngược năng lượng tiêu diệt B' },
        { id: 'opt-cas-3', labelVi: 'Xung lực bị phân tán và dừng lại ở B' }
      ],
      correctOptionId: 'opt-cas-1',
      targetRelations: ['TEMPORAL_PREDICT', 'RULE_ACTION']
    }
  },
  {
    level: 5,
    titleVi: 'Cấp 5: Không Gian Động - Dynamic World Shift',
    mode: 'DYNAMIC_WORLD',
    timeLimitSec: 55,
    requiredScore: 90,
    targetRelations: ['SPATIAL_TRANSFORM', 'TEMPORAL_PREDICT', 'TARGET_POSITION'],
    obstacles: [
      { id: 'dyn-wall-1', x1: 260, y1: 100, x2: 260, y2: 300 }
    ],
    entities: [
      {
        id: 'dyn-p',
        type: 'NODE',
        faction: 'PLAYER',
        label: 'Trạm Xung (F4)',
        position: { x: 110, y: 200 },
        soundProps: { pitch: 'F4', freq: 349.23, harmonyRole: 'TONIC' },
        state: { value: 50, maxValue: 70, status: 'ACTIVE', role: 'ATTACKER', capacity: 3, activeConnectionsCount: 0 }
      },
      {
        id: 'dyn-e1',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Cứ Điểm Bắc (A4)',
        position: { x: 400, y: 120 },
        soundProps: { pitch: 'A4', freq: 440.00, harmonyRole: 'MEDIANT' },
        state: { value: 30, maxValue: 50, status: 'ACTIVE', role: 'NORMAL', capacity: 2, activeConnectionsCount: 0 }
      },
      {
        id: 'dyn-e2',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Cứ Điểm Nam (C5)',
        position: { x: 400, y: 280 },
        soundProps: { pitch: 'C5', freq: 523.25, harmonyRole: 'DOMINANT' },
        state: { value: 30, maxValue: 50, status: 'ACTIVE', role: 'DEFENDER', capacity: 2, activeConnectionsCount: 0 }
      }
    ],
    relations: [],
    predictionPrompt: {
      questionVi: 'Vách chắn năng lượng liên tục dịch chuyển. Thời điểm vàng để phóng xúc tu là khi nào?',
      options: [
        { id: 'opt-dyn-1', labelVi: 'Khi khe hở không gian mở ra ở góc trên hoặc dưới' },
        { id: 'opt-dyn-2', labelVi: 'Đâm xuyên thẳng qua tâm bức tường' },
        { id: 'opt-dyn-3', labelVi: 'Chờ hết giờ để hệ thống tự phá hủy' }
      ],
      correctOptionId: 'opt-dyn-1',
      targetRelations: ['SPATIAL_TRANSFORM', 'TEMPORAL_PREDICT']
    }
  },
  {
    level: 6,
    titleVi: 'Cấp 6: Siêu Phẩm - Sốc Hồi Máu Toàn Mạng (Surgical Heal Burst)',
    mode: 'SURGICAL_CUT',
    timeLimitSec: 55,
    requiredScore: 95,
    targetRelations: ['RULE_ACTION', 'SPATIAL_TRANSFORM', 'PART_WHOLE'],
    entities: [
      {
        id: 'sup-p1',
        type: 'NODE',
        faction: 'PLAYER',
        label: 'Tâm Hồi Phục (G3)',
        position: { x: 120, y: 220 },
        soundProps: { pitch: 'G3', freq: 196.00, harmonyRole: 'TONIC' },
        state: { value: 20, maxValue: 80, status: 'ACTIVE', role: 'HEALER', capacity: 4, activeConnectionsCount: 1 }
      },
      {
        id: 'sup-e1',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Quái Thú Hút Năng Lượng (D4)',
        position: { x: 380, y: 220 },
        soundProps: { pitch: 'D4', freq: 293.66, harmonyRole: 'DOMINANT' },
        state: { value: 70, maxValue: 100, status: 'ACTIVE', role: 'ATTACKER', capacity: 3, activeConnectionsCount: 1 }
      }
    ],
    relations: [
      {
        id: 'rel-sup-1',
        sourceId: 'sup-p1',
        targetId: 'sup-e1',
        type: 'ATTACK_DRAIN',
        properties: { strength: 5, distance: 260, direction: 'DIRECTED', isActive: true, cuttable: true, cutAffinity: 'SOURCE_BIASED', flowSpeed: 2.5, harmonicConsonance: 'PERFECT_CONSONANCE', intervalSemitones: 7 }
      }
    ],
    predictionPrompt: {
      questionVi: 'Tâm Hồi Phục đang nguy kịch (HP 20/80). Làm thế nào để kích hoạt sốc hồi máu tối đa?',
      options: [
        { id: 'opt-sup-1', labelVi: 'Cắt cực sát gốc nguồn (ratio < 0.25) để giải phóng sóng năng lượng hồi phục' },
        { id: 'opt-sup-2', labelVi: 'Cắt sát quái thú để gây thêm sát thương' },
        { id: 'opt-sup-3', labelVi: 'Không cắt, duy trì dòng năng lượng' }
      ],
      correctOptionId: 'opt-sup-1',
      targetRelations: ['RULE_ACTION', 'SPATIAL_TRANSFORM']
    }
  },
  {
    level: 7,
    titleVi: 'Cấp 7: Đột Phá Lõi Kép - Song Trùng Core Dominance',
    mode: 'CORE_DOMINANCE',
    timeLimitSec: 55,
    requiredScore: 95,
    targetRelations: ['PART_WHOLE', 'RULE_ACTION', 'TARGET_DISTRACTOR'],
    entities: [
      {
        id: 'core-adv-1',
        type: 'CORE',
        faction: 'ADVERSARY',
        label: 'Lõi Alpha (A3)',
        position: { x: 350, y: 140 },
        soundProps: { pitch: 'A3', freq: 220.00, harmonyRole: 'TONIC' },
        state: { value: 50, maxValue: 80, status: 'ACTIVE', role: 'CORE', capacity: 3, activeConnectionsCount: 2 }
      },
      {
        id: 'core-adv-2',
        type: 'CORE',
        faction: 'ADVERSARY',
        label: 'Lõi Beta (C#4)',
        position: { x: 350, y: 300 },
        soundProps: { pitch: 'C#4', freq: 277.18, harmonyRole: 'MEDIANT' },
        state: { value: 50, maxValue: 80, status: 'ACTIVE', role: 'CORE', capacity: 3, activeConnectionsCount: 2 }
      },
      {
        id: 'p-command',
        type: 'NODE',
        faction: 'PLAYER',
        label: 'Trung Tâm Chỉ Huy (E4)',
        position: { x: 100, y: 220 },
        soundProps: { pitch: 'E4', freq: 329.63, harmonyRole: 'DOMINANT' },
        state: { value: 65, maxValue: 90, status: 'ACTIVE', role: 'ATTACKER', capacity: 4, activeConnectionsCount: 0 }
      }
    ],
    relations: [],
    predictionPrompt: {
      questionVi: 'Hệ thống có 2 Lõi song song. Can thiệp nào phá vỡ thế gọng kìm nhanh nhất?',
      options: [
        { id: 'opt-c7-1', labelVi: 'Đánh sập 1 Lõi trước để giảm một nửa hỏa lực đối phương' },
        { id: 'opt-c7-2', labelVi: 'Chia đôi tài nguyên đánh cả 2 Lõi cùng lúc' },
        { id: 'opt-c7-3', labelVi: 'Rút lui về phòng thủ thụ động' }
      ],
      correctOptionId: 'opt-c7-1',
      targetRelations: ['PART_WHOLE', 'RULE_ACTION']
    }
  },
  {
    level: 8,
    titleVi: 'Cấp 8: Mạng Hòa Âm Thính Giác - Sound Network Harmonic Resonance',
    mode: 'SOUND_NETWORK',
    timeLimitSec: 60,
    requiredScore: 100,
    targetRelations: ['IDENTITY_MATCH', 'SIMILARITY_DIFF', 'CONTEXT_MEANING'],
    entities: [
      {
        id: 'snd-c',
        type: 'NODE',
        faction: 'PLAYER',
        label: 'Âm Chủ Tonic (C4)',
        position: { x: 120, y: 220 },
        soundProps: { pitch: 'C4', freq: 261.63, harmonyRole: 'TONIC' },
        state: { value: 50, maxValue: 70, status: 'ACTIVE', role: 'NORMAL', capacity: 3, activeConnectionsCount: 0 }
      },
      {
        id: 'snd-e',
        type: 'NODE',
        faction: 'NEUTRAL',
        label: 'Quãng 3 Trưởng (E4)',
        position: { x: 260, y: 130 },
        soundProps: { pitch: 'E4', freq: 329.63, harmonyRole: 'MEDIANT' },
        state: { value: 30, maxValue: 50, status: 'ACTIVE', role: 'HEALER', capacity: 2, activeConnectionsCount: 0 }
      },
      {
        id: 'snd-g',
        type: 'NODE',
        faction: 'NEUTRAL',
        label: 'Quãng 5 Đúng (G4)',
        position: { x: 260, y: 310 },
        soundProps: { pitch: 'G4', freq: 392.00, harmonyRole: 'DOMINANT' },
        state: { value: 30, maxValue: 50, status: 'ACTIVE', role: 'AMPLIFIER', capacity: 2, activeConnectionsCount: 0 }
      },
      {
        id: 'snd-fsharp',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Nghịch Âm Tritone (F#4)',
        position: { x: 420, y: 220 },
        soundProps: { pitch: 'F#4', freq: 369.99, harmonyRole: 'PASSING' },
        state: { value: 45, maxValue: 60, status: 'ACTIVE', role: 'ATTACKER', capacity: 2, activeConnectionsCount: 0 }
      }
    ],
    relations: [],
    predictionPrompt: {
      questionVi: 'Để tạo hợp âm Đô Trưởng (C Major Triad) vang dội thuận tai và tăng sức mạnh, bạn cần nối C4 với những nốt nào?',
      options: [
        { id: 'opt-snd-1', labelVi: 'Nối C4 với E4 (Quãng 3 Trưởng) và G4 (Quãng 5 Đúng)' },
        { id: 'opt-snd-2', labelVi: 'Nối C4 với F#4 (Tritone ma quái)' },
        { id: 'opt-snd-3', labelVi: 'Nối F#4 với E4' }
      ],
      correctOptionId: 'opt-snd-1',
      targetRelations: ['IDENTITY_MATCH', 'CONTEXT_MEANING']
    }
  },
  {
    level: 9,
    titleVi: 'Cấp 9: Đột Biến Quy Tắc Xúc Tu - Rule Mutation Shock',
    mode: 'SURGICAL_CUT',
    timeLimitSec: 55,
    requiredScore: 100,
    targetRelations: ['INHIBITION', 'RULE_ACTION', 'SIMILARITY_DIFF'],
    entities: [
      {
        id: 'mut-1',
        type: 'NODE',
        faction: 'PLAYER',
        label: 'Căn Cứ Đột Biến (B3)',
        position: { x: 130, y: 220 },
        soundProps: { pitch: 'B3', freq: 246.94, harmonyRole: 'TONIC' },
        state: { value: 45, maxValue: 75, status: 'ACTIVE', role: 'ATTACKER', capacity: 3, activeConnectionsCount: 1 }
      },
      {
        id: 'mut-2',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Tiền Tiêu Biến Dị (F#4)',
        position: { x: 390, y: 220 },
        soundProps: { pitch: 'F#4', freq: 369.99, harmonyRole: 'DOMINANT' },
        state: { value: 50, maxValue: 80, status: 'ACTIVE', role: 'DEFENDER', capacity: 2, activeConnectionsCount: 1 }
      }
    ],
    relations: [
      {
        id: 'rel-mut-1',
        sourceId: 'mut-1',
        targetId: 'mut-2',
        type: 'FLOW_CONNECT',
        properties: { strength: 4, distance: 260, direction: 'DIRECTED', isActive: true, cuttable: true, cutAffinity: 'SOURCE_BIASED', flowSpeed: 2, harmonicConsonance: 'PERFECT_CONSONANCE', intervalSemitones: 7 }
      }
    ],
    predictionPrompt: {
      questionVi: 'Quy tắc vừa đột biến: Cắt gần nguồn bây giờ gây sát thương, cắt gần đích hồi phục. Bạn nên cắt ở đâu để triệt hạ mục tiêu?',
      options: [
        { id: 'opt-m9-1', labelVi: 'Cắt sát nguồn (ratio < 0.35) theo quy tắc mới đảo ngược' },
        { id: 'opt-m9-2', labelVi: 'Cắt sát đích (ratio > 0.65) theo thói quen cũ' },
        { id: 'opt-m9-3', labelVi: 'Cắt chính giữa cân bằng' }
      ],
      correctOptionId: 'opt-m9-1',
      targetRelations: ['INHIBITION', 'RULE_ACTION']
    }
  },
  {
    level: 10,
    titleVi: 'Cấp 10: Phản Ứng Dây Chuyền Tam Cấp - Multi-Stage Domino',
    mode: 'CASCADE_PREDICT',
    timeLimitSec: 50,
    requiredScore: 100,
    targetRelations: ['TEMPORAL_PREDICT', 'ORDER_SEQUENCE', 'PART_WHOLE'],
    entities: [
      {
        id: 'tri-1',
        type: 'NODE',
        faction: 'PLAYER',
        label: 'Nguồn Năng Lượng (C4)',
        position: { x: 90, y: 220 },
        soundProps: { pitch: 'C4', freq: 261.63, harmonyRole: 'TONIC' },
        state: { value: 70, maxValue: 80, status: 'ACTIVE', role: 'NORMAL', capacity: 2, activeConnectionsCount: 1 }
      },
      {
        id: 'tri-2',
        type: 'NODE',
        faction: 'NEUTRAL',
        label: 'Rơ-le Nhịp 1 (E4)',
        position: { x: 210, y: 220 },
        soundProps: { pitch: 'E4', freq: 329.63, harmonyRole: 'MEDIANT' },
        state: { value: 20, maxValue: 30, status: 'ACTIVE', role: 'AMPLIFIER', capacity: 2, activeConnectionsCount: 2 }
      },
      {
        id: 'tri-3',
        type: 'NODE',
        faction: 'NEUTRAL',
        label: 'Rơ-le Nhịp 2 (G4)',
        position: { x: 330, y: 220 },
        soundProps: { pitch: 'G4', freq: 392.00, harmonyRole: 'DOMINANT' },
        state: { value: 20, maxValue: 30, status: 'ACTIVE', role: 'AMPLIFIER', capacity: 2, activeConnectionsCount: 2 }
      },
      {
        id: 'tri-4',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Pháo Đài Đích (C5)',
        position: { x: 450, y: 220 },
        soundProps: { pitch: 'C5', freq: 523.25, harmonyRole: 'TONIC' },
        state: { value: 50, maxValue: 60, status: 'ACTIVE', role: 'CORE', capacity: 1, activeConnectionsCount: 1 }
      }
    ],
    relations: [
      {
        id: 'r-tri-1',
        sourceId: 'tri-1',
        targetId: 'tri-2',
        type: 'FLOW_CONNECT',
        properties: { strength: 4, distance: 120, direction: 'DIRECTED', isActive: true, cuttable: true, cutAffinity: 'BALANCED', flowSpeed: 2 }
      },
      {
        id: 'r-tri-2',
        sourceId: 'tri-2',
        targetId: 'tri-3',
        type: 'FLOW_CONNECT',
        properties: { strength: 4, distance: 120, direction: 'DIRECTED', isActive: true, cuttable: true, cutAffinity: 'BALANCED', flowSpeed: 2 }
      },
      {
        id: 'r-tri-3',
        sourceId: 'tri-3',
        targetId: 'tri-4',
        type: 'ATTACK_DRAIN',
        properties: { strength: 4, distance: 120, direction: 'DIRECTED', isActive: true, cuttable: true, cutAffinity: 'TARGET_BIASED', flowSpeed: 2 }
      }
    ],
    predictionPrompt: {
      questionVi: 'Nếu cắt đứt liên kết giữa Rơ-le 1 và 2 trước khi xung truyền qua, điều gì xảy ra?',
      options: [
        { id: 'opt-t10-1', labelVi: 'Chuỗi phản ứng bị chặn đứng, Pháo Đài Đích an toàn' },
        { id: 'opt-t10-2', labelVi: 'Năng lượng tự nhảy cóc qua khe hở tới Pháo Đài' },
        { id: 'opt-t10-3', labelVi: 'Rơ-le 1 sẽ phát nổ phá hủy nguồn của bạn' }
      ],
      correctOptionId: 'opt-t10-1',
      targetRelations: ['TEMPORAL_PREDICT', 'ORDER_SEQUENCE']
    }
  },
  {
    level: 11,
    titleVi: 'Cấp 11: Mê Cung Xoáy Không Gian - Dynamic Vortex Maze',
    mode: 'DYNAMIC_WORLD',
    timeLimitSec: 45,
    requiredScore: 105,
    targetRelations: ['SPATIAL_TRANSFORM', 'TEMPORAL_PREDICT', 'FOCUS_FIELD'],
    obstacles: [
      { id: 'vort-1', x1: 200, y1: 50, x2: 200, y2: 220 },
      { id: 'vort-2', x1: 340, y1: 180, x2: 340, y2: 350 }
    ],
    entities: [
      {
        id: 'vort-p',
        type: 'NODE',
        faction: 'PLAYER',
        label: 'Căn Cứ Tàu Ngầm (D3)',
        position: { x: 100, y: 120 },
        soundProps: { pitch: 'D3', freq: 146.83, harmonyRole: 'TONIC' },
        state: { value: 60, maxValue: 80, status: 'ACTIVE', role: 'ATTACKER', capacity: 3, activeConnectionsCount: 0 }
      },
      {
        id: 'vort-relay',
        type: 'NODE',
        faction: 'NEUTRAL',
        label: 'Trạm Tiếp Vận (A3)',
        position: { x: 270, y: 200 },
        soundProps: { pitch: 'A3', freq: 220.00, harmonyRole: 'DOMINANT' },
        state: { value: 25, maxValue: 40, status: 'ACTIVE', role: 'HEALER', capacity: 3, activeConnectionsCount: 0 }
      },
      {
        id: 'vort-enemy',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Trụ Sở Đầu Não (D4)',
        position: { x: 430, y: 280 },
        soundProps: { pitch: 'D4', freq: 293.66, harmonyRole: 'TONIC' },
        state: { value: 60, maxValue: 80, status: 'ACTIVE', role: 'CORE', capacity: 2, activeConnectionsCount: 0 }
      }
    ],
    relations: [],
    predictionPrompt: {
      questionVi: 'Hai vách chắn ziczac chặn đường thẳng. Lộ trình tối ưu dẫn xung lực là gì?',
      options: [
        { id: 'opt-v11-1', labelVi: 'Từ P luồn qua Trạm Tiếp Vận ở giữa rồi tới Trụ Sở' },
        { id: 'opt-v11-2', labelVi: 'Cố đâm trực diện qua cả 2 vách chắn' },
        { id: 'opt-v11-3', labelVi: 'Chỉ nối vòng tròn quanh P' }
      ],
      correctOptionId: 'opt-v11-1',
      targetRelations: ['SPATIAL_TRANSFORM', 'FOCUS_FIELD']
    }
  },
  {
    level: 12,
    titleVi: 'Cấp 12: Đỉnh Cao - Đại Chiến Synapse Toàn Diện (Grand Synapse War)',
    mode: 'SOUND_NETWORK',
    timeLimitSec: 40,
    requiredScore: 110,
    targetRelations: ['RULE_ACTION', 'PART_WHOLE', 'TEMPORAL_PREDICT', 'INHIBITION'],
    obstacles: [
      { id: 'master-wall', x1: 270, y1: 140, x2: 270, y2: 280 }
    ],
    entities: [
      {
        id: 'master-p-core',
        type: 'CORE',
        faction: 'PLAYER',
        label: 'TỔNG TƯ LỆNH (C3)',
        position: { x: 100, y: 200 },
        soundProps: { pitch: 'C3', freq: 130.81, harmonyRole: 'TONIC' },
        state: { value: 70, maxValue: 100, status: 'ACTIVE', role: 'CORE', capacity: 5, activeConnectionsCount: 0 }
      },
      {
        id: 'master-p-flank',
        type: 'NODE',
        faction: 'PLAYER',
        label: 'Cánh Trái (G3)',
        position: { x: 160, y: 90 },
        soundProps: { pitch: 'G3', freq: 196.00, harmonyRole: 'DOMINANT' },
        state: { value: 35, maxValue: 50, status: 'ACTIVE', role: 'ATTACKER', capacity: 2, activeConnectionsCount: 0 }
      },
      {
        id: 'master-neut-1',
        type: 'NODE',
        faction: 'NEUTRAL',
        label: 'Điểm Tựa Hòa Âm (E4)',
        position: { x: 270, y: 70 },
        soundProps: { pitch: 'E4', freq: 329.63, harmonyRole: 'MEDIANT' },
        state: { value: 25, maxValue: 40, status: 'ACTIVE', role: 'HEALER', capacity: 3, activeConnectionsCount: 0 }
      },
      {
        id: 'master-neut-2',
        type: 'NODE',
        faction: 'NEUTRAL',
        label: 'Bộ Khuếch Đại (Bb4)',
        position: { x: 270, y: 340 },
        soundProps: { pitch: 'Bb4', freq: 466.16, harmonyRole: 'PASSING' },
        state: { value: 25, maxValue: 40, status: 'ACTIVE', role: 'AMPLIFIER', capacity: 3, activeConnectionsCount: 0 }
      },
      {
        id: 'master-e-core',
        type: 'CORE',
        faction: 'ADVERSARY',
        label: 'MA VƯƠNG SYNAPSE (C5)',
        position: { x: 440, y: 210 },
        soundProps: { pitch: 'C5', freq: 523.25, harmonyRole: 'TONIC' },
        state: { value: 85, maxValue: 110, status: 'ACTIVE', role: 'CORE', capacity: 5, activeConnectionsCount: 0 }
      },
      {
        id: 'master-e-guard',
        type: 'NODE',
        faction: 'ADVERSARY',
        label: 'Hộ Vệ Địch (G4)',
        position: { x: 380, y: 320 },
        soundProps: { pitch: 'G4', freq: 392.00, harmonyRole: 'DOMINANT' },
        state: { value: 40, maxValue: 60, status: 'ACTIVE', role: 'DEFENDER', capacity: 2, activeConnectionsCount: 0 }
      }
    ],
    relations: [],
    predictionPrompt: {
      questionVi: 'Trong đại chiến toàn diện, chiến thuật tối thượng kết hợp tư duy hệ thống và hòa âm là gì?',
      options: [
        { id: 'opt-m12-1', labelVi: 'Chiếm Điểm Tựa Hòa Âm để tạo chuỗi C-E-G buff toàn mạng, sau đó đồng hóa Ma Vương' },
        { id: 'opt-m12-2', labelVi: 'Đâm thẳng không che chắn vào Ma Vương' },
        { id: 'opt-m12-3', labelVi: 'Chỉ phòng thủ và không mở rộng xúc tu' }
      ],
      correctOptionId: 'opt-m12-1',
      targetRelations: ['RULE_ACTION', 'PART_WHOLE', 'TEMPORAL_PREDICT']
    }
  }
];

// ======================================================================
// CAUSAL CASCADE CHALLENGES (Hiệu Ứng Domino Nhân Quả)
// ======================================================================
export const CAUSAL_CASCADE_SAMPLE_CHALLENGES: ICausalChallenge[] = [
  {
    id: 'causal-lvl-1',
    level: 1,
    titleVi: 'Cấp 1: Mạch Đơn - Kích Hoạt Nguồn & Van Mở',
    goalDescriptionVi: 'Dẫn dòng năng lượng từ Nguồn tới Bể Tiếp Nhận an toàn với 1 can thiệp duy nhất.',
    allowedInterventions: 1,
    timeLimitSec: 45,
    predictionQuestion: 'Nếu gạt cần Valve-1 sang ON, năng lượng sẽ đến đích sau bao lâu?',
    predictionOptions: [
      { id: 'opt-1-1', labelVi: 'Dòng chảy kích hoạt ngay lập tức (~400ms)', isCorrect: true },
      { id: 'opt-1-2', labelVi: 'Hệ thống bị quá tải nổ tung', isCorrect: false },
      { id: 'opt-1-3', labelVi: 'Không có hiện tượng gì', isCorrect: false }
    ],
    nodes: [
      { id: 'node-src', label: 'Nguồn Năng Lượng', type: 'SOURCE', position: { x: 80, y: 180 }, state: 'ON', value: 100 },
      { id: 'node-lever', label: 'Cần Gạt Van 1', type: 'LEVER', position: { x: 260, y: 180 }, state: 'OFF', value: 0, ruleVi: 'Bật để thông mạch' },
      { id: 'node-target', label: 'Bể Tiếp Nhận', type: 'TARGET', position: { x: 440, y: 180 }, state: 'OFF', value: 0, threshold: 80 }
    ],
    connections: [
      { id: 'c1', fromNodeId: 'node-src', toNodeId: 'node-lever', delayMs: 250, isFlowing: true },
      { id: 'c2', fromNodeId: 'node-lever', toNodeId: 'node-target', delayMs: 250, isFlowing: false }
    ]
  },
  {
    id: 'causal-lvl-2',
    level: 2,
    titleVi: 'Cấp 2: Cổng Đảo Ngược - Causal Inverter',
    goalDescriptionVi: 'Cổng Inverter đảo ngược tín hiệu. Can thiệp đúng điểm để không ngắt mạch tới Đích.',
    allowedInterventions: 1,
    timeLimitSec: 45,
    predictionQuestion: 'Tín hiệu đi qua Cổng Đảo (Inverter) sẽ có trạng thái gì?',
    predictionOptions: [
      { id: 'opt-2-1', labelVi: 'Tín hiệu ON chuyển thành OFF (và ngược lại)', isCorrect: true },
      { id: 'opt-2-2', labelVi: 'Tín hiệu tăng gấp đôi công suất', isCorrect: false },
      { id: 'opt-2-3', labelVi: 'Tín hiệu bị triệt tiêu hoàn toàn', isCorrect: false }
    ],
    nodes: [
      { id: 'node-src-2', label: 'Nguồn Xung', type: 'SOURCE', position: { x: 70, y: 180 }, state: 'ON', value: 100 },
      { id: 'node-inv', label: 'Cổng Đảo (NOT)', type: 'INVERTER', position: { x: 240, y: 180 }, state: 'ON', value: 0, ruleVi: 'Đảo ngược trạng thái' },
      { id: 'node-lever-bypass', label: 'Đòn Bẩy Cứu Nguy', type: 'LEVER', position: { x: 240, y: 280 }, state: 'OFF', value: 0, ruleVi: 'Đường dẫn phụ' },
      { id: 'node-tgt-2', label: 'Động Cơ Đích', type: 'TARGET', position: { x: 430, y: 180 }, state: 'OFF', value: 0, threshold: 70 }
    ],
    connections: [
      { id: 'c2-1', fromNodeId: 'node-src-2', toNodeId: 'node-inv', delayMs: 200, isFlowing: true },
      { id: 'c2-2', fromNodeId: 'node-inv', toNodeId: 'node-tgt-2', delayMs: 200, isFlowing: false },
      { id: 'c2-3', fromNodeId: 'node-src-2', toNodeId: 'node-lever-bypass', delayMs: 250, isFlowing: true },
      { id: 'c2-4', fromNodeId: 'node-lever-bypass', toNodeId: 'node-tgt-2', delayMs: 250, isFlowing: false }
    ]
  },
  {
    id: 'causal-lvl-3',
    level: 3,
    titleVi: 'Cấp 3: Cổng Hội Tụ Logic AND - Đồng Quy Nhất Quán',
    goalDescriptionVi: 'Cổng AND chỉ mở khi CẢ 2 đầu vào đều kích hoạt. Hãy điều chỉnh để thông mạch.',
    allowedInterventions: 1,
    timeLimitSec: 50,
    predictionQuestion: 'Điều kiện nào để Cổng AND truyền năng lượng về Đích?',
    predictionOptions: [
      { id: 'opt-3-1', labelVi: 'Cả Nhánh Trên và Nhánh Dưới đều phải ở trạng thái ON', isCorrect: true },
      { id: 'opt-3-2', labelVi: 'Chỉ cần 1 trong 2 nhánh bật là đủ', isCorrect: false },
      { id: 'opt-3-3', labelVi: 'Cả 2 nhánh đều phải OFF', isCorrect: false }
    ],
    nodes: [
      { id: 'and-s1', label: 'Nguồn A', type: 'SOURCE', position: { x: 70, y: 110 }, state: 'ON', value: 100 },
      { id: 'and-s2', label: 'Nguồn B', type: 'SOURCE', position: { x: 70, y: 260 }, state: 'ON', value: 100 },
      { id: 'and-lev', label: 'Van Ngắt Nhánh B', type: 'LEVER', position: { x: 210, y: 260 }, state: 'OFF', value: 0, ruleVi: 'Đang khóa, cần mở' },
      { id: 'and-gate', label: 'Cổng Logic AND', type: 'GATE_AND', position: { x: 330, y: 180 }, state: 'OFF', value: 0, ruleVi: 'Đòi hỏi A và B cùng ON' },
      { id: 'and-tgt', label: 'Nhà Máy Hạt Nhân', type: 'TARGET', position: { x: 470, y: 180 }, state: 'OFF', value: 0, threshold: 90 }
    ],
    connections: [
      { id: 'and-c1', fromNodeId: 'and-s1', toNodeId: 'and-gate', delayMs: 300, isFlowing: true },
      { id: 'and-c2', fromNodeId: 'and-s2', toNodeId: 'and-lev', delayMs: 200, isFlowing: true },
      { id: 'and-c3', fromNodeId: 'and-lev', toNodeId: 'and-gate', delayMs: 250, isFlowing: false },
      { id: 'and-c4', fromNodeId: 'and-gate', toNodeId: 'and-tgt', delayMs: 250, isFlowing: false }
    ]
  }
];

// ======================================================================
// GRAPH MEMORY MATRIX LEVELS (Trí Nhớ Làm Việc Mạng Đồ Thị)
// ======================================================================
export const GRAPH_MEMORY_SAMPLE_LEVELS: IGraphMemoryLevel[] = [
  {
    level: 1,
    titleVi: 'Cấp 1: Cấu Trúc Tam Giác Liên Thông',
    memorizeDurationSec: 5.0,
    nodes: [
      { id: 'gn-a', label: 'Alpha', color: '#38BDF8', position: { x: 120, y: 180 } },
      { id: 'gn-b', label: 'Beta', color: '#F59E0B', position: { x: 260, y: 90 } },
      { id: 'gn-c', label: 'Gamma', color: '#10B981', position: { x: 400, y: 180 } }
    ],
    edges: [
      { id: 'ge-1', sourceId: 'gn-a', targetId: 'gn-b', isDirected: true },
      { id: 'ge-2', sourceId: 'gn-b', targetId: 'gn-c', isDirected: true }
    ],
    queries: [
      {
        id: 'q1-1',
        questionVi: 'Để đi từ Alpha tới Gamma, ta phải đi qua nút nào?',
        queryType: 'SHORTEST_PATH',
        options: [
          { id: 'opt-b', labelVi: 'Nút Beta' },
          { id: 'opt-direct', labelVi: 'Đi trực tiếp, không qua nút nào' },
          { id: 'opt-none', labelVi: 'Không có đường đi' }
        ],
        correctOptionId: 'opt-b',
        explanationVi: 'Đường liên kết có hướng: Alpha -> Beta -> Gamma, do đó bắt buộc đi qua Beta.'
      }
    ]
  },
  {
    level: 2,
    titleVi: 'Cấp 2: Nút Cổ Chai (Bottleneck Detection)',
    memorizeDurationSec: 4.5,
    nodes: [
      { id: 'gn-1', label: 'Node 1', color: '#38BDF8', position: { x: 100, y: 120 } },
      { id: 'gn-2', label: 'Node 2', color: '#38BDF8', position: { x: 100, y: 240 } },
      { id: 'gn-bridge', label: 'Cầu Nối K', color: '#F43F5E', position: { x: 260, y: 180 } },
      { id: 'gn-3', label: 'Node 3', color: '#10B981', position: { x: 420, y: 120 } },
      { id: 'gn-4', label: 'Node 4', color: '#10B981', position: { x: 420, y: 240 } }
    ],
    edges: [
      { id: 'ge-2-1', sourceId: 'gn-1', targetId: 'gn-bridge', isDirected: false },
      { id: 'ge-2-2', sourceId: 'gn-2', targetId: 'gn-bridge', isDirected: false },
      { id: 'ge-2-3', sourceId: 'gn-bridge', targetId: 'gn-3', isDirected: false },
      { id: 'ge-2-4', sourceId: 'gn-bridge', targetId: 'gn-4', isDirected: false }
    ],
    queries: [
      {
        id: 'q2-1',
        questionVi: 'Nếu nút nào bị ngắt thì mạng lưới sẽ bị chia cắt làm 2 cụm cô lập hoàn toàn?',
        queryType: 'BOTTLENECK',
        options: [
          { id: 'opt-k', labelVi: 'Cầu Nối K' },
          { id: 'opt-1', labelVi: 'Node 1' },
          { id: 'opt-3', labelVi: 'Node 3' }
        ],
        correctOptionId: 'opt-k',
        explanationVi: 'Cầu Nối K là điểm nút thắt cổ chai (Cut Vertex/Bridge). Mất K khiến 2 nhóm không còn liên lạc.'
      }
    ]
  },
  {
    level: 3,
    titleVi: 'Cấp 3: Phát Hiện Chu Trình Khép Kín (Cycle / Loop Detection)',
    memorizeDurationSec: 4.5,
    nodes: [
      { id: 'gn-p', label: 'P', color: '#A855F7', position: { x: 150, y: 120 } },
      { id: 'gn-q', label: 'Q', color: '#A855F7', position: { x: 350, y: 120 } },
      { id: 'gn-r', label: 'R', color: '#A855F7', position: { x: 350, y: 260 } },
      { id: 'gn-s', label: 'S', color: '#A855F7', position: { x: 150, y: 260 } }
    ],
    edges: [
      { id: 'ge-3-1', sourceId: 'gn-p', targetId: 'gn-q', isDirected: true },
      { id: 'ge-3-2', sourceId: 'gn-q', targetId: 'gn-r', isDirected: true },
      { id: 'ge-3-3', sourceId: 'gn-r', targetId: 'gn-s', isDirected: true },
      { id: 'ge-3-4', sourceId: 'gn-s', targetId: 'gn-p', isDirected: true }
    ],
    queries: [
      {
        id: 'q3-1',
        questionVi: 'Đồ thị 4 nút vừa xem có tạo thành một chu trình khép kín (Loop) hay không?',
        queryType: 'LOOP_DETECT',
        options: [
          { id: 'opt-yes', labelVi: 'Có, tạo thành một vòng khép kín P -> Q -> R -> S -> P' },
          { id: 'opt-no', labelVi: 'Không, là đồ thị dạng cây một chiều' }
        ],
        correctOptionId: 'opt-yes',
        explanationVi: 'Các mũi tên nối liên tục theo vòng tròn tạo thành chu trình có hướng 4 nút.'
      }
    ]
  }
];

// ======================================================================
// RULE MUTATION CLASH GENERATOR
// ======================================================================
export function generateRuleMutationTrials(level: number, roundCount = 6): IRuleMutationTrial[] {
  const colors = ['red', 'blue', 'green', 'amber'];
  const shapes = ['circle', 'square', 'triangle', 'diamond'];
  const pitches = ['C4', 'E4', 'G4', 'B4'];

  const trials: IRuleMutationTrial[] = [];

  // Base rule
  let isMutated = false;
  for (let r = 1; r <= roundCount; r++) {
    // Mutation triggers midway at round 3 or 4
    if (r === 3 && level >= 2) {
      isMutated = true;
    }

    const c = colors[Math.floor(Math.random() * colors.length)];
    const s = shapes[Math.floor(Math.random() * shapes.length)];
    const p = pitches[Math.floor(Math.random() * pitches.length)];

    let correctAction = 'DEFEND';
    if (!isMutated) {
      // Normal rule: Red or Square = ATTACK, others = DEFEND
      correctAction = (c === 'red' || s === 'square') ? 'ATTACK' : 'DEFEND';
    } else {
      // Mutated rule: Red = DEFEND, Green or Triangle = ATTACK
      correctAction = (c === 'green' || s === 'triangle') ? 'ATTACK' : 'DEFEND';
    }

    trials.push({
      id: `mut-trial-${level}-${r}-${Date.now()}`,
      round: r,
      stimulus: { color: c, shape: s, soundPitch: p },
      activeRules: isMutated
        ? [
            { attribute: 'color:green | shape:triangle', action: 'ATTACK' },
            { attribute: 'color:red', action: 'DEFEND' }
          ]
        : [
            { attribute: 'color:red | shape:square', action: 'ATTACK' },
            { attribute: 'others', action: 'DEFEND' }
          ],
      hasMutated: isMutated && r === 3,
      mutationAlertVi: (isMutated && r === 3) ? 'QUY TẮC ĐỘT BIẾN! Màu Xanh/Tam Giác thành Tấn Công!' : undefined,
      correctAction,
      options: [
        { id: 'opt-att', labelVi: 'TẤN CÔNG (ATTACK)', action: 'ATTACK' },
        { id: 'opt-def', labelVi: 'PHÒNG THỦ (DEFEND)', action: 'DEFEND' }
      ]
    });
  }

  return trials;
}
