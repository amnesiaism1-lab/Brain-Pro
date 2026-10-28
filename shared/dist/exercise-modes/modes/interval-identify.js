"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERVAL_IDENTIFY_MODES = void 0;
const intervalIdentifySchema = {
    version: 1,
    fields: [
        {
            kind: 'enum',
            key: 'playbackMode',
            labelVi: 'Phương thức phát quãng',
            options: [
                { value: 'melodic-ascending', labelVi: 'Đi lên (Nốt thấp -> Nốt cao)' },
                { value: 'melodic-descending', labelVi: 'Đi xuống (Nốt cao -> Nốt thấp)' },
                { value: 'melodic-both', labelVi: 'Ngẫu nhiên lên / xuống' },
                { value: 'harmonic', labelVi: 'Hòa âm (2 nốt vang cùng lúc)' },
                { value: 'mixed', labelVi: 'Hỗn hợp giai điệu & hòa âm' }
            ],
            default: 'melodic-ascending'
        },
        {
            kind: 'multiEnum',
            key: 'intervalPool',
            labelVi: 'Kho quãng muốn luyện',
            options: [
                { value: '1P', labelVi: 'Quãng 1 Đúng', group: 'Quãng Đúng' },
                { value: '2m', labelVi: 'Quãng 2 Thứ', group: 'Quãng 2' },
                { value: '2M', labelVi: 'Quãng 2 Trưởng', group: 'Quãng 2' },
                { value: '3m', labelVi: 'Quãng 3 Thứ', group: 'Quãng 3' },
                { value: '3M', labelVi: 'Quãng 3 Trưởng', group: 'Quãng 3' },
                { value: '4P', labelVi: 'Quãng 4 Đúng', group: 'Quãng 4' },
                { value: '4A', labelVi: 'Quãng 4 Tăng (Tritone)', group: 'Tritone' },
                { value: '5P', labelVi: 'Quãng 5 Đúng', group: 'Quãng 5' },
                { value: '6m', labelVi: 'Quãng 6 Thứ', group: 'Quãng 6' },
                { value: '6M', labelVi: 'Quãng 6 Trưởng', group: 'Quãng 6' },
                { value: '7m', labelVi: 'Quãng 7 Thứ', group: 'Quãng 7' },
                { value: '7M', labelVi: 'Quãng 7 Trưởng', group: 'Quãng 7' },
                { value: '8P', labelVi: 'Quãng 8 Đúng', group: 'Bát độ' }
            ],
            minSelected: 2,
            default: ['1P', '3M', '5P', '8P']
        },
        {
            kind: 'number',
            key: 'optionsCount',
            labelVi: 'Số lượng đáp án trắc nghiệm',
            min: 2,
            max: 6,
            step: 1,
            unit: 'lựa chọn',
            default: 4
        }
    ]
};
exports.INTERVAL_IDENTIFY_MODES = [
    {
        id: 'interval.identify',
        exerciseSlug: 'interval-identify',
        labelVi: 'Nhận Diện Quãng Tiêu Chuẩn',
        descriptionVi: 'Phân biệt khoảng cách cao độ giữa hai nốt nhạc nối tiếp hoặc đồng thời',
        status: 'stable',
        schema: intervalIdentifySchema,
        builtInPresets: [
            {
                id: 'interval-basics',
                labelVi: '🌱 Quãng Thuận Cơ Bản (1P, 3M, 5P, 8P)',
                params: { intervalPool: ['1P', '3M', '5P', '8P'], playbackMode: 'melodic-ascending', optionsCount: 4 }
            },
            {
                id: 'interval-major-minor',
                labelVi: '⚖️ Phân Biệt Quãng 3 Trưởng vs Thứ',
                params: { intervalPool: ['3m', '3M'], playbackMode: 'melodic-both', optionsCount: 2 }
            },
            {
                id: 'interval-harmonic-challenge',
                labelVi: '⚡ Thử Thách Hòa Âm 2 Nốt',
                params: { intervalPool: ['3m', '3M', '4P', '5P', '6M', '8P'], playbackMode: 'harmonic', optionsCount: 4 }
            }
        ]
    }
];
