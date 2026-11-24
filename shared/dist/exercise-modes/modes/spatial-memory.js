"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPATIAL_MEMORY_MODES = void 0;
const spatialMemorySchema = {
    version: 1,
    fields: [
        {
            kind: 'enum',
            key: 'gridSize',
            labelVi: 'Kích thước lưới Corsi',
            options: [
                { value: '3', labelVi: '3 × 3 (9 ô - Cơ bản)' },
                { value: '4', labelVi: '4 × 4 (16 ô - Tiêu chuẩn)' },
                { value: '5', labelVi: '5 × 5 (25 ô - Nâng cao)' },
                { value: '6', labelVi: '6 × 6 (36 ô - Chuyên sâu)' }
            ],
            default: '4'
        },
        {
            kind: 'number',
            key: 'sequenceLength',
            labelVi: 'Độ dài chuỗi ô sáng',
            min: 3,
            max: 12,
            step: 1,
            unit: 'ô',
            default: 5
        },
        {
            kind: 'enum',
            key: 'recallOrder',
            labelVi: 'Quy tắc thứ tự chạm lại',
            options: [
                { value: 'forward', labelVi: 'Xuôi chiều (Từ ô đầu đến ô cuối)' },
                { value: 'reverse', labelVi: 'Ngược chiều (Từ ô cuối về ô đầu)' }
            ],
            default: 'forward'
        },
        {
            kind: 'number',
            key: 'flashSpeedMs',
            labelVi: 'Nhịp chớp mỗi ô',
            min: 300,
            max: 1000,
            step: 50,
            unit: 'ms',
            default: 650
        },
        {
            kind: 'boolean',
            key: 'rotateBoard',
            labelVi: 'Xoay bảng 90° trước khi nhập lại',
            descriptionVi: 'Tăng cường xoay không gian tinh thần (Mental Rotation)',
            default: false
        }
    ]
};
exports.SPATIAL_MEMORY_MODES = [
    {
        id: 'spatial-memory.standard',
        exerciseSlug: 'spatial-memory',
        labelVi: 'Phác Thảo Không Gian Corsi Tùy Biến',
        descriptionVi: 'Tùy chỉnh kích thước lưới (3×3 đến 6×6), độ dài chuỗi, chạm ngược và xoay bảng 90°',
        status: 'stable',
        schema: spatialMemorySchema,
        builtInPresets: [
            {
                id: 'corsi_4x4_std',
                labelVi: 'Corsi 4×4 Tiêu Chuẩn (5 Ô)',
                descriptionVi: 'Chuỗi 5 điểm chuẩn xác rèn phác thảo thị giác-không gian',
                params: { gridSize: '4', sequenceLength: 5, recallOrder: 'forward', flashSpeedMs: 700, rotateBoard: false }
            },
            {
                id: 'corsi_reverse_5x5',
                labelVi: 'Corsi Ngược 5×5 (5 Ô)',
                descriptionVi: 'Đảo ngược bản đồ tọa độ không gian trong trí nhớ',
                params: { gridSize: '5', sequenceLength: 5, recallOrder: 'reverse', flashSpeedMs: 650, rotateBoard: false }
            }
        ]
    }
];
