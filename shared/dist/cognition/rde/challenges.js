"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDE_SAMPLE_CHALLENGES = void 0;
exports.RDE_SAMPLE_CHALLENGES = [
    {
        level: 1,
        titleVi: 'Phẫu Thuật Xúc Tu: Khoảng Cách & Hiệu Ứng',
        mode: 'SURGICAL_CUT',
        timeLimitSec: 45,
        requiredScore: 80,
        targetRelations: ['TARGET_POSITION', 'RULE_ACTION', 'SPATIAL_TRANSFORM'],
        entities: [
            {
                id: 'node-alpha',
                type: 'NODE',
                faction: 'PLAYER',
                label: 'Tế bào Mẹ (A)',
                position: { x: 120, y: 220 },
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
                label: 'Tiền Đồn Địch (B)',
                position: { x: 380, y: 220 },
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
                    flowSpeed: 1.5
                }
            }
        ],
        predictionPrompt: {
            questionVi: 'Nếu bạn thực hiện vết cắt sát nút B (ratio > 0.7), điều gì sẽ xảy ra cho hệ thống?',
            options: [
                {
                    id: 'opt-1',
                    labelVi: 'Sốc phản vệ dội về gây sát thương mạnh lên B (-35% HP)'
                },
                {
                    id: 'opt-2',
                    labelVi: 'Toàn bộ năng lượng chảy ngược về hồi phục A'
                },
                {
                    id: 'opt-3',
                    labelVi: 'Nút A và B đều bị phá hủy hoàn toàn'
                }
            ],
            correctOptionId: 'opt-1',
            targetRelations: ['RULE_ACTION', 'TEMPORAL_PREDICT']
        }
    },
    {
        level: 2,
        titleVi: 'Rào Cản Không Gian: Tường Năng Lượng',
        mode: 'SURGICAL_CUT',
        timeLimitSec: 45,
        requiredScore: 85,
        targetRelations: ['SPATIAL_TRANSFORM', 'TARGET_DISTRACTOR', 'RULE_ACTION'],
        obstacles: [
            {
                id: 'wall-1',
                x1: 250,
                y1: 80,
                x2: 250,
                y2: 260
            }
        ],
        entities: [
            {
                id: 'node-p1',
                type: 'NODE',
                faction: 'PLAYER',
                label: 'Gốc (P1)',
                position: { x: 100, y: 150 },
                state: {
                    value: 40,
                    maxValue: 60,
                    status: 'ACTIVE',
                    role: 'NORMAL',
                    capacity: 2,
                    activeConnectionsCount: 0
                }
            },
            {
                id: 'node-relay',
                type: 'NODE',
                faction: 'NEUTRAL',
                label: 'Trạm Tiếp Vận',
                position: { x: 250, y: 340 },
                state: {
                    value: 15,
                    maxValue: 40,
                    status: 'ACTIVE',
                    role: 'AMPLIFIER',
                    capacity: 3,
                    activeConnectionsCount: 0
                }
            },
            {
                id: 'node-target',
                type: 'NODE',
                faction: 'ADVERSARY',
                label: 'Căn Cứ Địch',
                position: { x: 400, y: 150 },
                state: {
                    value: 30,
                    maxValue: 50,
                    status: 'ACTIVE',
                    role: 'DEFENDER',
                    capacity: 2,
                    activeConnectionsCount: 0
                }
            }
        ],
        relations: [],
        predictionPrompt: {
            questionVi: 'Tại sao không thể nối trực tiếp từ Gốc (P1) sang Căn Cứ Địch?',
            options: [
                {
                    id: 'opt-wall',
                    labelVi: 'Bị tường năng lượng chặn ở giữa, buộc phải bắc cầu qua Trạm Tiếp Vận'
                },
                {
                    id: 'opt-cap',
                    labelVi: 'Do Gốc P1 chưa đủ năng lượng kết nối'
                },
                {
                    id: 'opt-dist',
                    labelVi: 'Do khoảng cách vượt quá bán kính xúc tu'
                }
            ],
            correctOptionId: 'opt-wall',
            targetRelations: ['SPATIAL_TRANSFORM', 'RULE_ACTION']
        }
    },
    {
        level: 3,
        titleVi: 'Đòn Bẩy Nút Lõi (Core Dominance)',
        mode: 'CORE_DOMINANCE',
        timeLimitSec: 50,
        requiredScore: 90,
        targetRelations: ['PART_WHOLE', 'RULE_ACTION', 'TEMPORAL_PREDICT'],
        entities: [
            {
                id: 'node-core',
                type: 'CORE',
                faction: 'ADVERSARY',
                label: 'NÚT LÕI (CORE)',
                position: { x: 250, y: 200 },
                state: {
                    value: 20,
                    maxValue: 80,
                    status: 'ACTIVE',
                    role: 'CORE',
                    capacity: 5,
                    activeConnectionsCount: 3
                }
            },
            {
                id: 'sub-node-1',
                type: 'NODE',
                faction: 'ADVERSARY',
                label: 'Vệ Tinh 1',
                position: { x: 180, y: 90 },
                state: {
                    value: 35,
                    maxValue: 40,
                    status: 'ACTIVE',
                    role: 'NORMAL',
                    capacity: 1,
                    activeConnectionsCount: 1
                }
            },
            {
                id: 'sub-node-2',
                type: 'NODE',
                faction: 'ADVERSARY',
                label: 'Vệ Tinh 2',
                position: { x: 320, y: 90 },
                state: {
                    value: 40,
                    maxValue: 40,
                    status: 'ACTIVE',
                    role: 'DEFENDER',
                    capacity: 1,
                    activeConnectionsCount: 1
                }
            },
            {
                id: 'sub-node-3',
                type: 'NODE',
                faction: 'ADVERSARY',
                label: 'Vệ Tinh 3',
                position: { x: 250, y: 320 },
                state: {
                    value: 30,
                    maxValue: 40,
                    status: 'ACTIVE',
                    role: 'ATTACKER',
                    capacity: 1,
                    activeConnectionsCount: 1
                }
            },
            {
                id: 'player-base',
                type: 'NODE',
                faction: 'PLAYER',
                label: 'Bộ Chỉ Huy',
                position: { x: 80, y: 200 },
                state: {
                    value: 50,
                    maxValue: 70,
                    status: 'ACTIVE',
                    role: 'ATTACKER',
                    capacity: 3,
                    activeConnectionsCount: 0
                }
            }
        ],
        relations: [
            {
                id: 'rel-c1',
                sourceId: 'node-core',
                targetId: 'sub-node-1',
                type: 'CONTROL_DEPEND',
                properties: { strength: 2, distance: 120, direction: 'DIRECTED', isActive: true, cuttable: false, cutAffinity: 'BALANCED', flowSpeed: 1 }
            },
            {
                id: 'rel-c2',
                sourceId: 'node-core',
                targetId: 'sub-node-2',
                type: 'CONTROL_DEPEND',
                properties: { strength: 2, distance: 120, direction: 'DIRECTED', isActive: true, cuttable: false, cutAffinity: 'BALANCED', flowSpeed: 1 }
            },
            {
                id: 'rel-c3',
                sourceId: 'node-core',
                targetId: 'sub-node-3',
                type: 'CONTROL_DEPEND',
                properties: { strength: 2, distance: 120, direction: 'DIRECTED', isActive: true, cuttable: false, cutAffinity: 'BALANCED', flowSpeed: 1 }
            }
        ],
        predictionPrompt: {
            questionVi: 'Nếu Bộ Chỉ Huy tập trung toàn lực đánh sập NÚT LÕI (CORE), các Vệ Tinh sẽ ra sao?',
            options: [
                {
                    id: 'opt-core-win',
                    labelVi: 'Toàn bộ 3 Vệ Tinh mất chỉ huy và lập tức bị đồng hóa về phe Player'
                },
                {
                    id: 'opt-core-lose',
                    labelVi: '3 Vệ Tinh sẽ tăng gấp đôi sức mạnh tấn công trả thù'
                },
                {
                    id: 'opt-core-same',
                    labelVi: 'Không ảnh hưởng gì, phải chiếm từng vệ tinh riêng lẻ'
                }
            ],
            correctOptionId: 'opt-core-win',
            targetRelations: ['PART_WHOLE', 'RULE_ACTION']
        }
    }
];
