"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RHYTHM_RECALL_MODES = void 0;
const rhythmRecallSchema = {
    version: 1,
    fields: [
        {
            kind: 'number',
            key: 'stepCount',
            labelVi: 'Số bước nhịp (Steps)',
            min: 4,
            max: 16,
            step: 2,
            unit: 'bước',
            default: 6
        },
        {
            kind: 'number',
            key: 'bpm',
            labelVi: 'Tốc độ nhịp (BPM)',
            min: 60,
            max: 160,
            step: 5,
            unit: 'BPM',
            default: 90
        },
        {
            kind: 'number',
            key: 'toleranceMs',
            labelVi: 'Sai số thời gian cho phép',
            min: 80,
            max: 250,
            step: 10,
            unit: 'ms',
            default: 180
        },
        {
            kind: 'boolean',
            key: 'syncopated',
            labelVi: 'Đảo phách (Syncopation)',
            default: false
        },
        {
            kind: 'boolean',
            key: 'showVisualBeat',
            labelVi: 'Hiển thị nhịp nhấp nháy trực quan',
            default: true
        }
    ]
};
exports.RHYTHM_RECALL_MODES = [
    {
        id: 'rhythm.tap-back',
        exerciseSlug: 'rhythm-recall',
        labelVi: 'Gõ Nhịp Phách Tiêu Chuẩn',
        descriptionVi: 'Lắng nghe mẫu hình tiết tấu và gõ lại đúng nhịp phách',
        status: 'stable',
        schema: rhythmRecallSchema,
        builtInPresets: [
            {
                id: 'rhythm-slow-groove',
                labelVi: '🥁 Khởi Động Nhịp 80 BPM',
                params: { stepCount: 4, bpm: 80, toleranceMs: 200, showVisualBeat: true }
            },
            {
                id: 'rhythm-fast-syncopate',
                labelVi: '⚡ Đảo Phách Nhanh 115 BPM',
                params: { stepCount: 8, bpm: 115, toleranceMs: 140, syncopated: true }
            }
        ]
    }
];
