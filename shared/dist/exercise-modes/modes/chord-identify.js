"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHORD_IDENTIFY_MODES = void 0;
const chordIdentifySchema = {
    version: 1,
    fields: [
        {
            kind: 'enum',
            key: 'playback',
            labelVi: 'Cách thức phát hợp âm',
            options: [
                { value: 'block', labelVi: 'Hòa âm cùng lúc (Block chord)' },
                { value: 'arpeggio', labelVi: 'Hợp âm rải (Arpeggio)' },
                { value: 'mixed', labelVi: 'Hỗn hợp Block & Arpeggio' }
            ],
            default: 'block'
        },
        {
            kind: 'multiEnum',
            key: 'chordTypes',
            labelVi: 'Các loại hợp âm muốn luyện',
            options: [
                { value: 'Major', labelVi: 'Hợp âm Trưởng (Major)' },
                { value: 'Minor', labelVi: 'Hợp âm Thứ (Minor)' },
                { value: 'Diminished', labelVi: 'Hợp âm Giảm (Diminished)' },
                { value: 'Augmented', labelVi: 'Hợp âm Tăng (Augmented)' },
                { value: 'Maj7', labelVi: 'Trưởng 7 (Maj7)' },
                { value: 'm7', labelVi: 'Thứ 7 (m7)' },
                { value: 'dom7', labelVi: 'Át 7 (Dominant 7th)' },
                { value: 'm7b5', labelVi: 'Thứ 7 giáng 5 (Half-Diminished)' }
            ],
            minSelected: 2,
            default: ['Major', 'Minor']
        },
        {
            kind: 'boolean',
            key: 'inversions',
            labelVi: 'Bao gồm các thế đảo (Inversions)',
            default: false
        },
        {
            kind: 'number',
            key: 'optionsCount',
            labelVi: 'Số lượng đáp án trắc nghiệm',
            min: 2,
            max: 6,
            step: 1,
            unit: 'lựa chọn',
            default: 3
        }
    ]
};
exports.CHORD_IDENTIFY_MODES = [
    {
        id: 'chord.quality',
        exerciseSlug: 'chord-identify',
        labelVi: 'Nhận Diện Tính Chất Hợp Âm',
        descriptionVi: 'Lắng nghe màu sắc hòa âm và phân biệt Trưởng, Thứ, 7th, Giảm, Tăng',
        status: 'stable',
        schema: chordIdentifySchema,
        builtInPresets: [
            {
                id: 'chord-maj-min',
                labelVi: '☯️ Trưởng vs Thứ Cơ Bản',
                params: { chordTypes: ['Major', 'Minor'], playback: 'block', optionsCount: 2 }
            },
            {
                id: 'chord-triads-4',
                labelVi: '🎼 4 Hợp Âm Ba (Trưởng, Thứ, Giảm, Tăng)',
                params: { chordTypes: ['Major', 'Minor', 'Diminished', 'Augmented'], playback: 'block', optionsCount: 4 }
            },
            {
                id: 'chord-seventh-jazz',
                labelVi: '🎷 Hợp Âm 7th Jazz (Maj7, m7, dom7)',
                params: { chordTypes: ['Maj7', 'm7', 'dom7'], playback: 'mixed', optionsCount: 3 }
            }
        ]
    }
];
