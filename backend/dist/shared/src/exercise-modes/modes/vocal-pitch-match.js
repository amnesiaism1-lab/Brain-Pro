"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOCAL_PITCH_MATCH_MODES = void 0;
const scales_1 = require("../../music/scales");
const vocalScaleSchema = {
    version: 1,
    fields: [
        {
            kind: 'enum',
            key: 'scaleSelection',
            labelVi: 'Chế độ chọn Âm Giai (Scale)',
            descriptionVi: 'Ngẫu nhiên đổi âm giai mỗi vòng hoặc cố định tập 1 âm giai',
            options: [
                { value: 'random', labelVi: 'Ngẫu nhiên (Đổi Scale mỗi vòng)' },
                { value: 'fixed', labelVi: 'Tự chọn 1 Scale cố định' }
            ],
            default: 'random'
        },
        {
            kind: 'scaleRef',
            key: 'scalePool',
            labelVi: 'Kho Scale ngẫu nhiên',
            descriptionVi: 'Danh sách các âm giai hệ thống sẽ chọn ngẫu nhiên mỗi vòng',
            multi: true,
            default: scales_1.VOCAL_RECOMMENDED_SCALE_IDS
        },
        {
            kind: 'scaleRef',
            key: 'scaleId',
            labelVi: 'Âm giai mục tiêu',
            descriptionVi: 'Chọn âm giai bạn muốn luyện tập',
            multi: false,
            default: 'major'
        },
        {
            kind: 'enum',
            key: 'rootSelection',
            labelVi: 'Chế độ chọn Chủ Âm (Root Tonic)',
            descriptionVi: 'Ngẫu nhiên đổi cao độ gốc hoặc cố định chủ âm',
            options: [
                { value: 'random', labelVi: 'Ngẫu nhiên (Đổi chủ âm vừa tầm giọng)' },
                { value: 'fixed', labelVi: 'Cố định chủ âm' }
            ],
            default: 'random'
        },
        {
            kind: 'noteRef',
            key: 'rootPool',
            labelVi: 'Nhóm chủ âm ngẫu nhiên',
            descriptionVi: 'Các nốt gốc được chọn ngẫu nhiên',
            multi: true,
            default: ['C', 'D', 'E', 'F', 'G', 'A']
        },
        {
            kind: 'noteRef',
            key: 'root',
            labelVi: 'Chủ âm cố định',
            descriptionVi: 'Nốt chủ âm bạn muốn luyện tập',
            multi: false,
            default: 'C'
        },
        {
            kind: 'enum',
            key: 'pattern',
            labelVi: 'Mẫu hình di chuyển (Pattern)',
            descriptionVi: 'Thứ tự chuỗi nốt trong âm giai',
            options: [
                { value: 'ascending', labelVi: 'Đi lên (1 -> 2 -> 3 ... 8)' },
                { value: 'descending', labelVi: 'Đi xuống (8 -> 7 -> 6 ... 1)' },
                { value: 'up-down', labelVi: 'Đi lên rồi đi xuống' },
                { value: 'warmup-5', labelVi: 'Khởi động thanh nhạc 5 âm (1-2-3-4-5-4-3-2-1)' },
                { value: 'thirds', labelVi: 'Bước nhảy quãng 3 (1-3-2-4-3-5...)' },
                { value: 'arpeggio-in-scale', labelVi: 'Hợp âm rải trong scale (1-3-5-8-5-3-1)' },
                { value: 'random-walk', labelVi: 'Dạo bước liền bậc ngẫu nhiên' },
                { value: 'random-degrees', labelVi: 'Bậc ngẫu nhiên trong scale' }
            ],
            default: 'ascending'
        },
        {
            kind: 'number',
            key: 'octaveSpan',
            labelVi: 'Độ rộng quãng tám',
            min: 1,
            max: 2,
            step: 1,
            unit: 'quãng 8',
            default: 1
        },
        {
            kind: 'number',
            key: 'noteCount',
            labelVi: 'Số lượng nốt (chế độ ngẫu nhiên)',
            descriptionVi: 'Chỉ áp dụng cho mẫu di chuyển ngẫu nhiên',
            min: 3,
            max: 12,
            step: 1,
            unit: 'nốt',
            default: 6
        },
        {
            kind: 'enum',
            key: 'promptMode',
            labelVi: 'Phương thức nhắc âm',
            descriptionVi: 'Cách thức hệ thống phát âm thanh hướng dẫn',
            options: [
                { value: 'play-then-sing', labelVi: 'Nghe trọn vẹn chuỗi -> cất giọng hát' },
                { value: 'call-response', labelVi: 'Nghe 1 nốt -> Hát 1 nốt (Từng nốt một)' },
                { value: 'sing-along', labelVi: 'Hát đồng thanh cùng nốt dẫn (Cần tai nghe)' }
            ],
            default: 'play-then-sing'
        },
        {
            kind: 'boolean',
            key: 'establishKey',
            labelVi: 'Định hình giọng trước (Cadence Tonic)',
            descriptionVi: 'Phát hợp âm chủ âm trước khi vào bài để não bộ bắt sóng điệu thức',
            default: true
        },
        {
            kind: 'boolean',
            key: 'tonicDrone',
            labelVi: 'Âm nền chủ âm (Tonic Drone)',
            descriptionVi: 'Giữ âm trầm chủ âm trong lúc hát (nên dùng tai nghe)',
            default: false
        },
        {
            kind: 'enum',
            key: 'labelStyle',
            labelVi: 'Hiển thị tên nốt / bậc',
            options: [
                { value: 'solfege', labelVi: 'Xướng âm (Đô, Rê, Mi...)' },
                { value: 'note', labelVi: 'Tên nốt quốc tế (C, D, E...)' },
                { value: 'degree', labelVi: 'Bậc âm giai (1, 2, 3, 4, 5...)' },
                { value: 'hidden', labelVi: 'Ẩn hoàn toàn (Luyện tai nghe tuyệt đối)' }
            ],
            default: 'solfege'
        },
        {
            kind: 'number',
            key: 'centsTolerance',
            labelVi: 'Ngưỡng sai số (Cents Tolerance)',
            descriptionVi: 'Mức độ lệch cho phép (càng nhỏ càng nghiêm ngặt)',
            min: 8,
            max: 60,
            step: 2,
            unit: 'cents',
            default: 25
        },
        {
            kind: 'number',
            key: 'holdDurationMs',
            labelVi: 'Thời gian giữ nốt ổn định',
            descriptionVi: 'Thời gian ngân nốt chuẩn để được tính điểm',
            min: 500,
            max: 3000,
            step: 100,
            unit: 'ms',
            default: 1400
        }
    ],
    visibleWhen: {
        scalePool: { field: 'scaleSelection', equals: 'random' },
        scaleId: { field: 'scaleSelection', equals: 'fixed' },
        rootPool: { field: 'rootSelection', equals: 'random' },
        root: { field: 'rootSelection', equals: 'fixed' },
        noteCount: { field: 'pattern', in: ['random-walk', 'random-degrees'] }
    }
};
const vocalSingleNoteSchema = {
    version: 1,
    fields: [
        {
            kind: 'number',
            key: 'centsTolerance',
            labelVi: 'Ngưỡng sai số cao độ (Cents)',
            min: 10,
            max: 60,
            step: 2,
            unit: 'cents',
            default: 35
        },
        {
            kind: 'number',
            key: 'holdDurationMs',
            labelVi: 'Thời gian giữ nốt ổn định',
            min: 800,
            max: 3500,
            step: 100,
            unit: 'ms',
            default: 1800
        },
        {
            kind: 'boolean',
            key: 'referenceDrone',
            labelVi: 'Âm nền tham chiếu liên tục',
            default: false
        }
    ]
};
const vocalIntervalSchema = {
    version: 1,
    fields: [
        {
            kind: 'enum',
            key: 'intervalType',
            labelVi: 'Tính chất quãng',
            options: [
                { value: 'consonant', labelVi: 'Quãng thuận (3, 4, 5, 8)' },
                { value: 'dissonant', labelVi: 'Quãng nghịch (2, 7, Tritone)' },
                { value: 'all', labelVi: 'Hỗn hợp tất cả các quãng' }
            ],
            default: 'consonant'
        },
        {
            kind: 'number',
            key: 'centsTolerance',
            labelVi: 'Ngưỡng sai số (Cents)',
            min: 10,
            max: 50,
            step: 2,
            unit: 'cents',
            default: 25
        },
        {
            kind: 'number',
            key: 'holdDurationMs',
            labelVi: 'Thời gian giữ mỗi nốt',
            min: 800,
            max: 3000,
            step: 100,
            unit: 'ms',
            default: 1600
        }
    ]
};
const vocalArpeggioSchema = {
    version: 1,
    fields: [
        {
            kind: 'enum',
            key: 'triad',
            labelVi: 'Loại hợp âm rải',
            options: [
                { value: 'major', labelVi: 'Hợp âm Trưởng (Major Triad 1-3-5)' },
                { value: 'minor', labelVi: 'Hợp âm Thứ (Minor Triad 1-b3-5)' },
                { value: 'diminished', labelVi: 'Hợp âm Giảm (Diminished 1-b3-b5)' },
                { value: 'augmented', labelVi: 'Hợp âm Tăng (Augmented 1-3-#5)' }
            ],
            default: 'major'
        },
        {
            kind: 'number',
            key: 'centsTolerance',
            labelVi: 'Ngưỡng sai số (Cents)',
            min: 10,
            max: 45,
            step: 2,
            unit: 'cents',
            default: 20
        },
        {
            kind: 'number',
            key: 'holdDurationMs',
            labelVi: 'Thời gian giữ mỗi nốt',
            min: 800,
            max: 2500,
            step: 100,
            unit: 'ms',
            default: 1400
        }
    ]
};
exports.VOCAL_PITCH_MATCH_MODES = [
    {
        id: 'vocal.scale',
        exerciseSlug: 'vocal-pitch-match',
        labelVi: 'Xướng Âm Theo Scale (Ngẫu nhiên / Tự chọn)',
        descriptionVi: 'Luyện tai nghe và thanh nhạc theo thang âm: tự chọn hoặc random ngẫu nhiên scale & chủ âm, hỗ trợ đa dạng mẫu luyện thanh.',
        status: 'stable',
        schema: vocalScaleSchema,
        builtInPresets: [
            {
                id: 'scale-random-vocal',
                labelVi: '🎲 Thử Thách Scale Ngẫu Nhiên',
                descriptionVi: 'Mỗi vòng tự động bốc 1 scale trong kho thanh nhạc phổ biến',
                params: {
                    scaleSelection: 'random',
                    rootSelection: 'random',
                    pattern: 'ascending',
                    centsTolerance: 25,
                    holdDurationMs: 1400
                }
            },
            {
                id: 'scale-major-warmup',
                labelVi: '☀️ Khởi Động Trưởng 5 Âm (1-2-3-4-5-4-3-2-1)',
                descriptionVi: 'Mẫu warm-up kinh điển phòng thu',
                params: {
                    scaleSelection: 'fixed',
                    scaleId: 'major',
                    pattern: 'warmup-5',
                    centsTolerance: 30,
                    holdDurationMs: 1200
                }
            },
            {
                id: 'scale-vietnamese-folk',
                labelVi: '🇻🇳 Ngũ Cung Dân Ca Việt Nam',
                descriptionVi: 'Luyện điệu Bắc, điệu Nam và điệu Oán đậm chất quê hương',
                params: {
                    scaleSelection: 'random',
                    scalePool: ['vietnamese-bac', 'vietnamese-nam', 'vietnamese-oan'],
                    rootSelection: 'random',
                    pattern: 'ascending',
                    centsTolerance: 24,
                    holdDurationMs: 1500
                }
            },
            {
                id: 'scale-pentatonic-blues',
                labelVi: '🎸 Ngũ Cung & Blues Solo',
                descriptionVi: 'Luyện các thang âm Ngũ Cung Trưởng, Thứ và Blues gai góc',
                params: {
                    scaleSelection: 'random',
                    scalePool: ['major pentatonic', 'minor pentatonic', 'minor blues', 'major blues'],
                    pattern: 'random-walk',
                    noteCount: 7,
                    centsTolerance: 22,
                    holdDurationMs: 1300
                }
            }
        ]
    },
    {
        id: 'vocal.single-note',
        exerciseSlug: 'vocal-pitch-match',
        labelVi: 'Dò Đơn Nốt Cơ Bản',
        descriptionVi: 'Luyện khớp từng cao độ riêng lẻ với thời gian ngân ổn định',
        status: 'stable',
        schema: vocalSingleNoteSchema
    },
    {
        id: 'vocal.interval',
        exerciseSlug: 'vocal-pitch-match',
        labelVi: 'Bước Nhảy Quãng (Interval Jump)',
        descriptionVi: 'Luyện phản xạ điều tiết thanh quản giữa hai cao độ liên tiếp',
        status: 'stable',
        schema: vocalIntervalSchema
    },
    {
        id: 'vocal.arpeggio',
        exerciseSlug: 'vocal-pitch-match',
        labelVi: 'Hợp Âm Rải (Arpeggio Triad)',
        descriptionVi: 'Luyện xướng âm các bậc hợp âm Trưởng, Thứ, Giảm, Tăng',
        status: 'stable',
        schema: vocalArpeggioSchema
    }
];
//# sourceMappingURL=vocal-pitch-match.js.map