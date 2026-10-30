"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHULTE_TABLE_MODES = void 0;
const schulteStandardSchema = {
    version: 1,
    fields: [
        {
            kind: 'enum',
            key: 'gridSize',
            labelVi: 'Kích thước lưới số',
            descriptionVi: 'Chọn số hàng và cột của bảng Schulte',
            options: [
                { value: '3', labelVi: '3 × 3 (9 số - Khởi động)' },
                { value: '4', labelVi: '4 × 4 (16 số - Nền tảng)' },
                { value: '5', labelVi: '5 × 5 (25 số - Tiêu chuẩn quốc tế)' },
                { value: '6', labelVi: '6 × 6 (36 số - Nâng cao)' },
                { value: '7', labelVi: '7 × 7 (49 số - Chuyên sâu)' },
                { value: '8', labelVi: '8 × 8 (64 số - Đỉnh cao)' },
                { value: '9', labelVi: '9 × 9 (81 số - Bậc thầy)' }
            ],
            default: '5'
        },
        {
            kind: 'enum',
            key: 'order',
            labelVi: 'Quy tắc thứ tự bấm',
            options: [
                { value: 'ascending', labelVi: 'Số tăng dần (1 → N)' },
                { value: 'descending', labelVi: 'Số giảm dần (N → 1)' }
            ],
            default: 'ascending'
        },
        {
            kind: 'boolean',
            key: 'classicMode',
            labelVi: 'Thử thách Cổ Điển (Không làm mờ ô đã bấm)',
            descriptionVi: 'Giữ nguyên mọi con số trên bảng để buộc mắt phải bao quát ngoại vi liên tục',
            default: false
        },
        {
            kind: 'boolean',
            key: 'showCenterGuide',
            labelVi: 'Hiển thị tâm ngắm neo mắt',
            descriptionVi: 'Giúp cố định trục nhìn vào trung tâm bảng',
            default: true
        }
    ]
};
const schulteGorbovSchema = {
    version: 1,
    fields: [
        {
            kind: 'enum',
            key: 'gridSize',
            labelVi: 'Kích thước bảng Gorbov',
            options: [
                { value: '7', labelVi: '7 × 7 (25 Đỏ + 24 Đen - Chuẩn Gorbov)' }
            ],
            default: '7'
        },
        {
            kind: 'boolean',
            key: 'classicMode',
            labelVi: 'Thử thách Cổ Điển (Không làm mờ ô đã bấm)',
            descriptionVi: 'Giữ nguyên các số đỏ và đen trên lưới',
            default: false
        },
        {
            kind: 'boolean',
            key: 'showCenterGuide',
            labelVi: 'Hiển thị tâm ngắm neo mắt',
            default: true
        }
    ]
};
const schulteAlphabetSchema = {
    version: 1,
    fields: [
        {
            kind: 'enum',
            key: 'alphabetType',
            labelVi: 'Bộ ký tự chữ cái',
            options: [
                { value: 'latin', labelVi: 'Ký tự Latin (A → Y, 25 chữ cái chuẩn 5×5)' },
                { value: 'vi', labelVi: 'Bảng chữ cái Tiếng Việt (A → Ă → Â → B...)' }
            ],
            default: 'latin'
        },
        {
            kind: 'enum',
            key: 'gridSize',
            labelVi: 'Kích thước lưới chữ',
            options: [
                { value: '5', labelVi: '5 × 5 (25 chữ cái - Chuẩn Latin A-Y)' },
                { value: '6', labelVi: '6 × 6 (36 ô - Phù hợp tiếng Việt)' }
            ],
            default: '5'
        },
        {
            kind: 'boolean',
            key: 'classicMode',
            labelVi: 'Thử thách Cổ Điển (Không làm mờ ô đã bấm)',
            default: false
        }
    ]
};
const schulteDynamicSchema = {
    version: 1,
    fields: [
        {
            kind: 'enum',
            key: 'dynamicType',
            labelVi: 'Cơ chế động học nhận thức',
            options: [
                { value: 'rotating', labelVi: 'Lưới Tự Xoay Trục (Xoay 90° định kỳ)' },
                { value: 'fading', labelVi: 'Lưới Ẩn Hiện (Số mờ dần kích hoạt trí nhớ vị trí)' }
            ],
            default: 'rotating'
        },
        {
            kind: 'enum',
            key: 'gridSize',
            labelVi: 'Kích thước lưới',
            options: [
                { value: '5', labelVi: '5 × 5 (25 số)' },
                { value: '6', labelVi: '6 × 6 (36 số)' },
                { value: '7', labelVi: '7 × 7 (49 số)' },
                { value: '8', labelVi: '8 × 8 (64 số)' }
            ],
            default: '6'
        },
        {
            kind: 'number',
            key: 'rotateIntervalSec',
            labelVi: 'Chu kỳ tự xoay hoặc chớp ẩn',
            min: 5,
            max: 20,
            step: 1,
            unit: 'giây',
            default: 10
        }
    ]
};
exports.SCHULTE_TABLE_MODES = [
    {
        id: 'schulte.standard',
        exerciseSlug: 'schulte-table',
        labelVi: 'Lưới Số Cơ Bản',
        descriptionVi: 'Tìm số tuần tự từ 1 đến N trong ma trận ngẫu nhiên, mở rộng tối đa thị trường ngoại vi',
        status: 'stable',
        schema: schulteStandardSchema,
        builtInPresets: [
            {
                id: 'speed_5x5',
                labelVi: 'Quét Tốc Độ 5×5 (Dưới 30s)',
                descriptionVi: 'Chuẩn quốc tế đo tốc độ đọc nhanh, rèn luyện trường nhìn trung tâm',
                params: { gridSize: '5', order: 'ascending', classicMode: false, showCenterGuide: true }
            },
            {
                id: 'descending_6x6',
                labelVi: 'Đếm Lùi 6×6 (36 → 1)',
                descriptionVi: 'Đảo ngược chiều tư duy số học, tăng tải làm việc của vỏ não trước trán',
                params: { gridSize: '6', order: 'descending', classicMode: false, showCenterGuide: true }
            },
            {
                id: 'master_8x8',
                labelVi: 'Bậc Thầy Ngoại Vi 8×8',
                descriptionVi: '64 số trải rộng toàn màn hình, yêu cầu cố định tâm ngắm và quét cực xa',
                params: { gridSize: '8', order: 'ascending', classicMode: true, showCenterGuide: true }
            }
        ]
    },
    {
        id: 'schulte.gorbov',
        exerciseSlug: 'schulte-table',
        labelVi: 'Bảng Gorbov Đỏ - Đen',
        descriptionVi: 'Đan xen tìm Đỏ tăng dần (1→25) và Đen giảm dần (24→1), rèn luyện chuyển đổi tác vụ não bộ',
        status: 'stable',
        schema: schulteGorbovSchema,
        builtInPresets: [
            {
                id: 'classic_gorbov',
                labelVi: 'Chuẩn Gorbov Đỏ-Đen 7×7',
                descriptionVi: 'Bài test kinh điển của phi công hàng không vũ trụ',
                params: { gridSize: '7', classicMode: false, showCenterGuide: true }
            }
        ]
    },
    {
        id: 'schulte.alphabet',
        exerciseSlug: 'schulte-table',
        labelVi: 'Bảng Chữ Cái',
        descriptionVi: 'Tìm ký tự chữ cái theo thứ tự bảng chữ cái Latin hoặc Tiếng Việt',
        status: 'stable',
        schema: schulteAlphabetSchema,
        builtInPresets: [
            {
                id: 'latin_5x5',
                labelVi: 'Latin A–Y 5×5 (25 Chữ)',
                descriptionVi: 'Tối ưu cho việc đọc quét lướt và nhận diện ký tự chữ viết',
                params: { alphabetType: 'latin', gridSize: '5', classicMode: false }
            }
        ]
    },
    {
        id: 'schulte.dynamic',
        exerciseSlug: 'schulte-table',
        labelVi: 'Lưới Động Học (Xoay / Ẩn Hiện)',
        descriptionVi: 'Thử thách xoay trục không gian hoặc ẩn mờ số, đòi hỏi trí nhớ làm việc không gian (Spatial Scratchpad)',
        status: 'stable',
        schema: schulteDynamicSchema,
        builtInPresets: [
            {
                id: 'rotating_vortex',
                labelVi: 'Vòng Xoáy Trục 6×6 (10s)',
                descriptionVi: 'Tự xoay 90° sau mỗi 10 giây, rèn phản xạ tái định vị mục tiêu',
                params: { dynamicType: 'rotating', gridSize: '6', rotateIntervalSec: 10 }
            },
            {
                id: 'phantom_fading',
                labelVi: 'Ảo Ảnh Ẩn Hiện 5×5',
                descriptionVi: 'Con số mờ dần sau quan sát, buộc ghi nhớ bản đồ tọa độ trong đầu',
                params: { dynamicType: 'fading', gridSize: '5', rotateIntervalSec: 8 }
            }
        ]
    }
];
//# sourceMappingURL=schulte-table.js.map