"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTENT_POOLS = exports.WEEKLY_CHALLENGES = exports.EXERCISE_SYNERGIES = exports.EXERCISE_VARIANTS = exports.ENGLISH_WORDS_DICTIONARY = exports.VIETNAMESE_WORDS_DICTIONARY = exports.SAMPLE_READING_TEXTS = exports.WORKOUT_ROUTINES = exports.EXERCISES_METADATA = exports.COGNITIVE_CATEGORIES = void 0;
const infinityConfigs_1 = require("./infinityConfigs");
__exportStar(require("./infinityConfigs"), exports);
exports.COGNITIVE_CATEGORIES = [
    {
        id: 'cat-1',
        code: 'SPEED_READING',
        name: 'Đọc Nhanh',
        description: 'Khử đọc thầm, tăng nhịp quét và khả năng nhận diện cụm từ tốc độ cao.',
        iconName: 'Zap',
        sortOrder: 1
    },
    {
        id: 'cat-2',
        code: 'PERIPHERAL_VISION',
        name: 'Thị Giác Ngoại Vi',
        description: 'Mở rộng góc nhìn hai bên mắt mà không cần di chuyển con ngươi.',
        iconName: 'Eye',
        sortOrder: 2
    },
    {
        id: 'cat-3',
        code: 'ATTENTION',
        name: 'Chú Ý Tập Trung',
        description: 'Phân biệt mẫu hình thị giác chọn lọc và ức chế các tác nhân gây xao nhãng.',
        iconName: 'Target',
        sortOrder: 3
    },
    {
        id: 'cat-4',
        code: 'MEMORY',
        name: 'Trí Nhớ Làm Việc',
        description: 'Tăng cường dung lượng lưu trữ chuỗi thông tin ngắn hạn và phục hồi dữ liệu tức thì.',
        iconName: 'Brain',
        sortOrder: 4
    },
    {
        id: 'cat-5',
        code: 'REACTION',
        name: 'Phản Xạ Nhận Thức',
        description: 'Tăng tốc độ ra quyết định và kiểm soát ức chế phản xạ nghịch chiều.',
        iconName: 'Activity',
        sortOrder: 5
    },
    {
        id: 'cat-6',
        code: 'AUDITORY_MEMORY',
        name: 'Trí Nhớ Âm Thanh',
        description: 'Rèn luyện cảm âm, trí nhớ chuỗi thính giác, nhận diện hợp âm và định vị âm thanh 3D.',
        iconName: 'Headphones',
        sortOrder: 6
    }
];
exports.EXERCISES_METADATA = [
    {
        id: 'ex-anagram',
        categoryId: 'cat-4',
        categoryCode: 'MEMORY',
        categoryName: 'Trí Nhớ Làm Việc',
        slug: 'anagram',
        title: 'Đảo ngữ',
        subtitle: 'Sắp xếp lại các ký tự bị xáo trộn thành từ vựng có nghĩa',
        iconName: 'Shuffle',
        scientificBasis: 'Dựa trên mô hình xử lý ngôn ngữ và chính tả nhận thức, rèn luyện tốc độ tái tổ hợp ký tự và độ linh hoạt từ vựng.',
        instructions: 'Các chữ cái của một từ đã bị xáo trộn vị trí. Bạn hãy quan sát thật nhanh và bấm chọn hoặc gõ lại các chữ cái theo đúng thứ tự ban đầu.',
        rulesSummary: 'Gõ hoặc chọn đúng từ trước khi hết giờ. Độ dài từ tăng dần theo cấp độ.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: true,
        levelConfigs: [
            { level: 1, timeLimitSec: 45, targetItemCount: 3, parametersJson: { wordLength: 3, hints: true } },
            { level: 2, timeLimitSec: 45, targetItemCount: 4, parametersJson: { wordLength: 4, hints: true } },
            { level: 3, timeLimitSec: 50, targetItemCount: 4, parametersJson: { wordLength: 5, hints: true } },
            { level: 4, timeLimitSec: 50, targetItemCount: 5, parametersJson: { wordLength: 6, hints: false } },
            { level: 5, timeLimitSec: 55, targetItemCount: 5, parametersJson: { wordLength: 7, hints: false } },
            { level: 6, timeLimitSec: 60, targetItemCount: 6, parametersJson: { wordLength: 8, hints: false } },
            { level: 7, timeLimitSec: 60, targetItemCount: 6, parametersJson: { wordLength: 9, hints: false } },
            { level: 8, timeLimitSec: 60, targetItemCount: 7, parametersJson: { wordLength: 10, hints: false } },
            { level: 9, timeLimitSec: 60, targetItemCount: 7, variantCode: 'PHRASE_ANAGRAM', variantName: 'Đảo Ngữ Cụm Từ', parametersJson: { wordLength: 12, isPhrase: true, hints: false } },
            { level: 10, timeLimitSec: 50, targetItemCount: 8, variantCode: 'TIMED_CASCADE', variantName: 'Thác Thời Gian', parametersJson: { wordLength: 12, cascadeSec: 8, hints: false } },
            { level: 11, timeLimitSec: 45, targetItemCount: 8, variantCode: 'PARTIAL_REVEAL', variantName: 'Nửa Ẩn Nửa Hiện', parametersJson: { wordLength: 13, scrambleRatio: 0.7, hints: false } },
            { level: 12, timeLimitSec: 40, targetItemCount: 9, variantCode: 'CROSS_LANGUAGE', variantName: 'Song Ngữ Giao Thoa', parametersJson: { wordLength: 14, dualLanguage: true, hints: false } }
        ]
    },
    {
        id: 'ex-schulte-table',
        categoryId: 'cat-2',
        categoryCode: 'PERIPHERAL_VISION',
        categoryName: 'Thị Giác Ngoại Vi',
        slug: 'schulte-table',
        title: 'Bảng Schulte',
        subtitle: 'Tìm các số tuần tự từ 1 đến N trong lưới số ngẫu nhiên',
        iconName: 'Grid',
        scientificBasis: 'Dựa trên phương pháp bảng Schulte cổ điển, rèn luyện sự chú ý phân bổ và mở rộng trường nhìn ngoại vi xung quanh điểm cố định.',
        instructions: 'Mắt luôn tập trung vào dấu chấm ở tâm lưới. Không đảo mắt qua lại, sử dụng tầm nhìn ngoại vi để tìm và bấm lần lượt các số từ 1 đến N.',
        rulesSummary: 'Bấm đúng số tăng dần. Bấm sai sẽ bị rung cảnh báo và cộng thêm thời gian phạt.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: true,
        levelConfigs: [
            { level: 1, gridRows: 3, gridCols: 3, targetItemCount: 9, timeLimitSec: 40 },
            { level: 2, gridRows: 4, gridCols: 4, targetItemCount: 16, timeLimitSec: 50 },
            { level: 3, gridRows: 5, gridCols: 5, targetItemCount: 25, timeLimitSec: 60 },
            { level: 4, gridRows: 5, gridCols: 5, targetItemCount: 25, timeLimitSec: 45 },
            { level: 5, gridRows: 6, gridCols: 6, targetItemCount: 36, timeLimitSec: 60 },
            { level: 6, gridRows: 6, gridCols: 6, targetItemCount: 36, timeLimitSec: 50 },
            { level: 7, gridRows: 7, gridCols: 7, targetItemCount: 49, timeLimitSec: 75 },
            { level: 8, gridRows: 7, gridCols: 7, targetItemCount: 49, timeLimitSec: 60, parametersJson: { reverseOrder: true } },
            { level: 9, gridRows: 7, gridCols: 7, targetItemCount: 49, timeLimitSec: 65, variantCode: 'GORBOV_RED_BLACK', variantName: 'Bảng Đỏ-Đen Gorbov', parametersJson: { redBlackMode: true } },
            { level: 10, gridRows: 8, gridCols: 8, targetItemCount: 64, timeLimitSec: 75, variantCode: 'ROTATING_SCHULTE', variantName: 'Bảng Xoay Trục', parametersJson: { rotateIntervalSec: 15 } },
            { level: 11, gridRows: 8, gridCols: 8, targetItemCount: 64, timeLimitSec: 65, variantCode: 'FADING_SCHULTE', variantName: 'Lưới Số Ẩn Hiện', parametersJson: { fadeClicked: false, ghostDistractors: true } },
            { level: 12, gridRows: 9, gridCols: 9, targetItemCount: 81, timeLimitSec: 80, variantCode: 'DUAL_CENTER', variantName: 'Song Tâm Ngắm', parametersJson: { dualGridMini: true } }
        ]
    },
    {
        id: 'ex-find-letter',
        categoryId: 'cat-3',
        categoryCode: 'ATTENTION',
        categoryName: 'Chú Ý Tập Trung',
        slug: 'find-letter',
        title: 'Tìm chữ',
        subtitle: 'Tìm chữ cái mục tiêu trong ma trận các ký tự gây nhiễu',
        iconName: 'Search',
        scientificBasis: 'Rèn luyện khả năng ức chế thông tin không liên quan (Inhibition) và tăng độ phân giải của thị giác quét.',
        instructions: 'Tìm và nhấp vào chữ cái mục tiêu được chỉ định (ví dụ chữ A) giữa các chữ cái có nét tương tự như B, P, R.',
        rulesSummary: 'Tìm đủ số lượng chữ mục tiêu trước khi đồng hồ đếm ngược về 0.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 45,
        isFeatured: true,
        levelConfigs: [
            { level: 1, gridRows: 4, gridCols: 4, targetItemCount: 3, timeLimitSec: 30 },
            { level: 2, gridRows: 5, gridCols: 5, targetItemCount: 4, timeLimitSec: 35 },
            { level: 3, gridRows: 6, gridCols: 6, targetItemCount: 5, timeLimitSec: 40 },
            { level: 4, gridRows: 7, gridCols: 7, targetItemCount: 6, timeLimitSec: 45 },
            { level: 5, gridRows: 8, gridCols: 8, targetItemCount: 7, timeLimitSec: 45 },
            { level: 6, gridRows: 9, gridCols: 9, targetItemCount: 8, timeLimitSec: 45 },
            { level: 7, gridRows: 10, gridCols: 10, targetItemCount: 9, timeLimitSec: 40 },
            { level: 8, gridRows: 12, gridCols: 12, targetItemCount: 10, timeLimitSec: 40 },
            { level: 9, gridRows: 12, gridCols: 12, targetItemCount: 10, timeLimitSec: 35, variantCode: 'CASE_SENSITIVE', variantName: 'Phân Biệt Ký Tự Hoa Thường', parametersJson: { caseSensitive: true } },
            { level: 10, gridRows: 12, gridCols: 14, targetItemCount: 11, timeLimitSec: 35, variantCode: 'MOVING_GRID', variantName: 'Lưới Ký Tự Động', parametersJson: { movingCharacters: true } },
            { level: 11, gridRows: 14, gridCols: 14, targetItemCount: 12, timeLimitSec: 30, variantCode: 'DUAL_TARGET', variantName: 'Mục Tiêu Kép', parametersJson: { dualTarget: true } },
            { level: 12, gridRows: 14, gridCols: 16, targetItemCount: 14, timeLimitSec: 30, variantCode: 'STROOP_LETTER', variantName: 'Nhiễu Màu Sắc Stroop', parametersJson: { stroopColorConflict: true } }
        ]
    },
    {
        id: 'ex-find-number',
        categoryId: 'cat-3',
        categoryCode: 'ATTENTION',
        categoryName: 'Chú Ý Tập Trung',
        slug: 'find-number',
        title: 'Tìm Số',
        subtitle: 'Quét nhanh số mục tiêu xuất hiện ngẫu nhiên trong lưới số',
        iconName: 'Hash',
        scientificBasis: 'Tăng tốc độ trích xuất tín hiệu số học và rèn luyện phản xạ so khớp mẫu thị giác nhanh.',
        instructions: 'Quan sát số mục tiêu trên đỉnh màn hình (ví dụ số 9 hoặc 47), sau đó nhấp vào nó trong bảng số.',
        rulesSummary: 'Nhấp đúng sẽ lập tức xuất hiện số mục tiêu mới. Đạt chuỗi điểm càng cao càng tốt.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 45,
        isFeatured: true,
        levelConfigs: [
            { level: 1, gridRows: 4, gridCols: 4, timeLimitSec: 30, parametersJson: { digitRange: [1, 9] } },
            { level: 2, gridRows: 5, gridCols: 5, timeLimitSec: 35, parametersJson: { digitRange: [1, 20] } },
            { level: 3, gridRows: 6, gridCols: 6, timeLimitSec: 40, parametersJson: { digitRange: [10, 50] } },
            { level: 4, gridRows: 7, gridCols: 7, timeLimitSec: 45, parametersJson: { digitRange: [10, 99] } },
            { level: 5, gridRows: 8, gridCols: 8, timeLimitSec: 45, parametersJson: { digitRange: [10, 99] } },
            { level: 6, gridRows: 9, gridCols: 9, timeLimitSec: 45, parametersJson: { digitRange: [100, 500] } },
            { level: 7, gridRows: 10, gridCols: 10, timeLimitSec: 40, parametersJson: { digitRange: [100, 999] } },
            { level: 8, gridRows: 12, gridCols: 12, timeLimitSec: 40, parametersJson: { digitRange: [100, 999] } },
            { level: 9, gridRows: 12, gridCols: 12, timeLimitSec: 35, variantCode: 'MULTI_DIGIT', variantName: 'Số 3 Chữ Số', parametersJson: { digitRange: [100, 999] } },
            { level: 10, gridRows: 12, gridCols: 14, timeLimitSec: 35, variantCode: 'MATH_TARGET', variantName: 'Quy Tắc Chia Hết', parametersJson: { divisibleBy: 3 } },
            { level: 11, gridRows: 14, gridCols: 14, timeLimitSec: 30, variantCode: 'SEQUENCE_FIND', variantName: 'Tìm Chuỗi 3 Số Kề', parametersJson: { sequenceLength: 3 } },
            { level: 12, gridRows: 14, gridCols: 16, timeLimitSec: 30, variantCode: 'VANISHING_GRID', variantName: 'Lưới Biến Mất', parametersJson: { decayMs: 3000 } }
        ]
    },
    {
        id: 'ex-even-odd',
        categoryId: 'cat-5',
        categoryCode: 'REACTION',
        categoryName: 'Phản Xạ Nhận Thức',
        slug: 'even-odd',
        title: 'Chẵn/Lẻ',
        subtitle: 'Phân loại nhanh số chẵn hoặc số lẻ dưới áp lực tốc độ cao',
        iconName: 'ToggleLeft',
        scientificBasis: 'Dựa trên mô hình kiểm soát quy tắc và chuyển đổi tác vụ (Task Switching), rèn luyện khả năng ức chế phản ứng thói quen.',
        instructions: 'Một con số xuất hiện trên màn hình. Hãy bấm nút CHẴN hoặc LẺ nhanh nhất có thể trước khi thanh thời gian tụt hết.',
        rulesSummary: 'Ở cấp cao, nếu viền số đổi màu đỏ, bạn phải chọn ngược lại!',
        maxDifficultyLevel: 12,
        defaultDurationSec: 45,
        isFeatured: true,
        levelConfigs: [
            { level: 1, timeLimitSec: 30, parametersJson: { reactionWindowMs: 1400, invertedRuleRate: 0 } },
            { level: 2, timeLimitSec: 30, parametersJson: { reactionWindowMs: 1200, invertedRuleRate: 0 } },
            { level: 3, timeLimitSec: 35, parametersJson: { reactionWindowMs: 1000, invertedRuleRate: 0 } },
            { level: 4, timeLimitSec: 35, parametersJson: { reactionWindowMs: 850, invertedRuleRate: 0.1 } },
            { level: 5, timeLimitSec: 40, parametersJson: { reactionWindowMs: 700, invertedRuleRate: 0.2 } },
            { level: 6, timeLimitSec: 40, parametersJson: { reactionWindowMs: 600, invertedRuleRate: 0.3 } },
            { level: 7, timeLimitSec: 45, parametersJson: { reactionWindowMs: 500, invertedRuleRate: 0.35 } },
            { level: 8, timeLimitSec: 45, parametersJson: { reactionWindowMs: 400, invertedRuleRate: 0.4 } },
            { level: 9, timeLimitSec: 45, variantCode: 'TRIPLE_PRIME', variantName: 'Phân Loại Số Nguyên Tố', parametersJson: { reactionWindowMs: 380, primeMode: true } },
            { level: 10, timeLimitSec: 45, variantCode: 'CALCULATION_RULE', variantName: 'Tính Nhẩm Chẵn Lẻ', parametersJson: { reactionWindowMs: 450, mathEquation: true } },
            { level: 11, timeLimitSec: 40, variantCode: 'PATTERN_SWITCH', variantName: 'Đảo Quy Tắc Đột Ngột', parametersJson: { reactionWindowMs: 350, switchInterval: 8 } },
            { level: 12, timeLimitSec: 40, variantCode: 'SPEED_DUEL', variantName: 'Tổng Hai Số Siêu Tốc', parametersJson: { reactionWindowMs: 320, dualSum: true } }
        ]
    },
    {
        id: 'ex-digit-span',
        categoryId: 'cat-4',
        categoryCode: 'MEMORY',
        categoryName: 'Trí Nhớ Làm Việc',
        slug: 'digit-span',
        title: 'Nhớ Số',
        subtitle: 'Ghi nhớ chuỗi số chớp tắt và nhập lại chính xác',
        iconName: 'Binary',
        scientificBasis: 'Đo lường và mở rộng dung lượng của vòng lặp âm vị học (Phonological Loop) và trí nhớ làm việc (Miller 7±2).',
        instructions: 'Một chuỗi số sẽ xuất hiện chớp nhoáng rồi biến mất thành ???. Hãy ghi nhớ và bấm lại chính xác dãy số đó.',
        rulesSummary: 'Độ dài chuỗi số tăng dần theo từng cấp độ (từ 3 số lên đến 10 số).',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: true,
        levelConfigs: [
            { level: 1, targetItemCount: 3, timeLimitSec: 40, parametersJson: { flashDurationMs: 1000 } },
            { level: 2, targetItemCount: 4, timeLimitSec: 40, parametersJson: { flashDurationMs: 900 } },
            { level: 3, targetItemCount: 5, timeLimitSec: 45, parametersJson: { flashDurationMs: 850 } },
            { level: 4, targetItemCount: 6, timeLimitSec: 45, parametersJson: { flashDurationMs: 800 } },
            { level: 5, targetItemCount: 7, timeLimitSec: 50, parametersJson: { flashDurationMs: 750 } },
            { level: 6, targetItemCount: 8, timeLimitSec: 50, parametersJson: { flashDurationMs: 700 } },
            { level: 7, targetItemCount: 9, timeLimitSec: 55, parametersJson: { flashDurationMs: 650 } },
            { level: 8, targetItemCount: 10, timeLimitSec: 60, parametersJson: { flashDurationMs: 600, reverseMode: true } },
            { level: 9, targetItemCount: 12, timeLimitSec: 65, variantCode: 'REVERSE_SPAN', variantName: 'Nhập Ngược Thứ Tự', parametersJson: { flashDurationMs: 550, reverseMode: true } },
            { level: 10, targetItemCount: 13, timeLimitSec: 70, variantCode: 'INTERLEAVED_SPAN', variantName: 'Chuỗi Số Xen Kẽ', parametersJson: { flashDurationMs: 500, interleavedMode: true } },
            { level: 11, targetItemCount: 14, timeLimitSec: 75, variantCode: 'OPERATION_SPAN', variantName: 'Tính Nhẩm Trước Khi Nhớ', parametersJson: { flashDurationMs: 450, mathEquation: true } },
            { level: 12, targetItemCount: 15, timeLimitSec: 80, variantCode: 'DUAL_MODAL_SPAN', variantName: 'Song Thức Số & Chữ', parametersJson: { flashDurationMs: 400, alphanumericMode: true } }
        ]
    },
    {
        id: 'ex-rsvp-speed-reader',
        categoryId: 'cat-1',
        categoryCode: 'SPEED_READING',
        categoryName: 'Đọc Nhanh',
        slug: 'rsvp-speed-reader',
        title: 'Chữ Chạy',
        subtitle: 'Kỹ thuật RSVP chiếu từng từ cố định tại tâm mắt với điểm ORP đỏ',
        iconName: 'FastForward',
        scientificBasis: 'Phương pháp trình chiếu từ nối tiếp tốc độ cao (RSVP), hỗ trợ hạn chế chuyển động mắt không cần thiết và tối ưu hóa nhịp nhận diện từ.',
        instructions: 'Tập trung nhìn vào chữ cái màu đỏ ở giữa. Từ ngữ sẽ lướt qua theo tốc độ WPM bạn chọn. Hãy thả lỏng cơ mặt và tiếp nhận ý nghĩa trực tiếp.',
        rulesSummary: 'Tốc độ WPM tăng dần từ 200 đến 1200 WPM. Có thể tạm dừng hoặc điều chỉnh thanh trượt WPM bất kỳ lúc nào.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: true,
        levelConfigs: [
            { level: 1, speedWpm: 200, timeLimitSec: 60 },
            { level: 2, speedWpm: 300, timeLimitSec: 60 },
            { level: 3, speedWpm: 450, timeLimitSec: 60 },
            { level: 4, speedWpm: 600, timeLimitSec: 60 },
            { level: 5, speedWpm: 750, timeLimitSec: 60 },
            { level: 6, speedWpm: 900, timeLimitSec: 60 },
            { level: 7, speedWpm: 1050, timeLimitSec: 60 },
            { level: 8, speedWpm: 1200, timeLimitSec: 60 },
            { level: 9, speedWpm: 1400, timeLimitSec: 60, variantCode: 'DUAL_WORD_RSVP', variantName: 'RSVP Hai Từ Song Hành', parametersJson: { dualWordMode: true } },
            { level: 10, speedWpm: 1600, timeLimitSec: 60, variantCode: 'MASKED_RSVP', variantName: 'RSVP Che Mờ Đoán Nghĩa', parametersJson: { maskedRatio: 0.3 } },
            { level: 11, speedWpm: 1800, timeLimitSec: 60, variantCode: 'QUIZ_INTERRUPT', variantName: 'RSVP Ngắt Quãng Kiểm Tra', parametersJson: { quizIntervalWords: 40 } },
            { level: 12, speedWpm: 2000, timeLimitSec: 60, variantCode: 'PERIPHERAL_RSVP', variantName: 'RSVP Nhảy Ba Vị Trí', parametersJson: { positions: 3 } }
        ]
    },
    {
        id: 'ex-word-search',
        categoryId: 'cat-1',
        categoryCode: 'SPEED_READING',
        categoryName: 'Đọc Nhanh',
        slug: 'word-search',
        title: 'Tìm Từ',
        subtitle: 'Tìm các từ vựng ẩn giấu trong ma trận ký tự đa hướng',
        iconName: 'Compass',
        scientificBasis: 'Rèn luyện khả năng quét từ vựng theo nhiều phương hướng (ngang, dọc, chéo) và xử lý từ tố nhanh chóng.',
        instructions: 'Nhìn danh sách từ cần tìm bên dưới. Quét trên bảng ký tự (12x20) và nhấp/kéo để khoanh chọn từ mục tiêu.',
        rulesSummary: 'Tìm đủ tất cả các từ trong thời gian quy định. Bật "Gợi ý" để hiển thị chữ cái đầu tiên.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: true,
        levelConfigs: [
            { level: 1, gridRows: 8, gridCols: 10, targetItemCount: 2, timeLimitSec: 60, parametersJson: { directions: ['horizontal'] } },
            { level: 2, gridRows: 10, gridCols: 12, targetItemCount: 3, timeLimitSec: 60, parametersJson: { directions: ['horizontal', 'vertical'] } },
            { level: 3, gridRows: 12, gridCols: 15, targetItemCount: 3, timeLimitSec: 60, parametersJson: { directions: ['horizontal', 'vertical'] } },
            { level: 4, gridRows: 12, gridCols: 20, targetItemCount: 3, timeLimitSec: 60, parametersJson: { directions: ['horizontal', 'vertical', 'diagonal'] } },
            { level: 5, gridRows: 14, gridCols: 20, targetItemCount: 4, timeLimitSec: 60, parametersJson: { directions: ['horizontal', 'vertical', 'diagonal'] } },
            { level: 6, gridRows: 15, gridCols: 22, targetItemCount: 5, timeLimitSec: 60, parametersJson: { directions: ['horizontal', 'vertical', 'diagonal', 'reverse'] } },
            { level: 7, gridRows: 16, gridCols: 24, targetItemCount: 6, timeLimitSec: 60, parametersJson: { directions: ['all'] } },
            { level: 8, gridRows: 18, gridCols: 25, targetItemCount: 8, timeLimitSec: 60, parametersJson: { directions: ['all'] } },
            { level: 9, gridRows: 20, gridCols: 26, targetItemCount: 8, timeLimitSec: 60, variantCode: 'TIMED_DECAY', variantName: 'Ô Ký Tự Mờ Dần', parametersJson: { decayRateSec: 5, directions: ['all'] } },
            { level: 10, gridRows: 22, gridCols: 28, targetItemCount: 9, timeLimitSec: 60, variantCode: 'MOVING_GRID', variantName: 'Ma Trận Dịch Chuyển', parametersJson: { autoDrift: true, directions: ['all'] } },
            { level: 11, gridRows: 22, gridCols: 28, targetItemCount: 10, timeLimitSec: 60, variantCode: 'TRAP_WORDS', variantName: 'Từ Bẫy Gây Rối', parametersJson: { trapWordsCount: 3, directions: ['all'] } },
            { level: 12, gridRows: 24, gridCols: 30, targetItemCount: 12, timeLimitSec: 60, variantCode: 'COMPETITIVE_CLOCK', variantName: 'Đồng Hồ Bù Giờ', parametersJson: { timeBonusPerWordSec: 5, directions: ['all'] } }
        ]
    },
    {
        id: 'ex-twin-words',
        categoryId: 'cat-3',
        categoryCode: 'ATTENTION',
        categoryName: 'Chú Ý Tập Trung',
        slug: 'twin-words',
        title: 'Từ Sinh đôi',
        subtitle: 'So sánh chớp nhoáng hai từ cạnh nhau: Giống nhau hay Khác biệt?',
        iconName: 'Copy',
        scientificBasis: 'Phát hiện sự sai lệch hình thái học (Morphological Verification) với độ chính xác cao ở tốc độ nhanh.',
        instructions: 'Hai từ hiển thị song song (ví dụ MAMA - MAMA hoặc META - BETA). Hãy bấm "GIỐNG NHAU" hoặc "KHÁC NHAU" thật nhanh.',
        rulesSummary: 'Mỗi câu chỉ xuất hiện trong 1-2 giây. Trả lời đúng liên tiếp để nhân hệ số điểm.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 45,
        isFeatured: false,
        levelConfigs: [
            { level: 1, timeLimitSec: 30, parametersJson: { displayTimeMs: 2000, wordLength: 4 } },
            { level: 2, timeLimitSec: 35, parametersJson: { displayTimeMs: 1800, wordLength: 5 } },
            { level: 3, timeLimitSec: 35, parametersJson: { displayTimeMs: 1600, wordLength: 5 } },
            { level: 4, timeLimitSec: 40, parametersJson: { displayTimeMs: 1400, wordLength: 6 } },
            { level: 5, timeLimitSec: 40, parametersJson: { displayTimeMs: 1200, wordLength: 7 } },
            { level: 6, timeLimitSec: 45, parametersJson: { displayTimeMs: 1000, wordLength: 8 } },
            { level: 7, timeLimitSec: 45, parametersJson: { displayTimeMs: 850, wordLength: 9 } },
            { level: 8, timeLimitSec: 45, parametersJson: { displayTimeMs: 700, wordLength: 10 } },
            { level: 9, timeLimitSec: 45, variantCode: 'TRIPLE_WORDS', variantName: 'Phát Hiện Từ Lạc Loài', parametersJson: { displayTimeMs: 600, tripleCompare: true } },
            { level: 10, timeLimitSec: 45, variantCode: 'SENTENCE_TWINS', variantName: 'So Khớp Hai Câu Ngắn', parametersJson: { displayTimeMs: 500, sentenceMode: true } },
            { level: 11, timeLimitSec: 40, variantCode: 'MIRROR_WORDS', variantName: 'Từ Phản Chiếu Gương', parametersJson: { displayTimeMs: 450, mirrorMode: true } },
            { level: 12, timeLimitSec: 40, variantCode: 'CONTEXTUAL_TWINS', variantName: 'Phân Biệt Ngữ Nghĩa Ngữ Cảnh', parametersJson: { displayTimeMs: 350, semanticCheck: true } }
        ]
    },
    {
        id: 'ex-peripheral-vision',
        categoryId: 'cat-2',
        categoryCode: 'PERIPHERAL_VISION',
        categoryName: 'Thị Giác Ngoại Vi',
        slug: 'peripheral-vision',
        title: 'Tầm Nhìn',
        subtitle: 'Mở rộng góc nhìn hai biên trong khi mắt khóa chặt vào tâm ngắm',
        iconName: 'Maximize2',
        scientificBasis: 'Huấn luyện khả năng nhận diện ký hiệu ngoại vi và mở rộng khẩu độ nhận thức mà không chuyển trục mắt.',
        instructions: 'Mắt luôn nhìn vào dấu cộng hoặc tâm ngắm ở giữa. Hai ký tự sẽ chớp sáng ở hai biên. Hãy nhận diện đúng 2 ký tự đó.',
        rulesSummary: 'Khoảng cách giữa hai ký tự sẽ ngày càng dãn rộng ra hai mép màn hình.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: false,
        levelConfigs: [
            { level: 1, timeLimitSec: 45, parametersJson: { spanPx: 120, flashDurationMs: 600 } },
            { level: 2, timeLimitSec: 45, parametersJson: { spanPx: 160, flashDurationMs: 550 } },
            { level: 3, timeLimitSec: 50, parametersJson: { spanPx: 200, flashDurationMs: 500 } },
            { level: 4, timeLimitSec: 50, parametersJson: { spanPx: 260, flashDurationMs: 450 } },
            { level: 5, timeLimitSec: 55, parametersJson: { spanPx: 320, flashDurationMs: 400 } },
            { level: 6, timeLimitSec: 55, parametersJson: { spanPx: 400, flashDurationMs: 350 } },
            { level: 7, timeLimitSec: 60, parametersJson: { spanPx: 480, flashDurationMs: 300 } },
            { level: 8, timeLimitSec: 60, parametersJson: { spanPx: 560, flashDurationMs: 250 } },
            { level: 9, timeLimitSec: 60, variantCode: 'THREE_SYMBOL', variantName: 'Chớp 3 Ký Tự Đồng Thời', parametersJson: { spanPx: 640, flashDurationMs: 220, symbolCount: 3 } },
            { level: 10, timeLimitSec: 60, variantCode: 'VERTICAL_SPAN', variantName: 'Mở Rộng Trục Dọc', parametersJson: { spanPx: 720, flashDurationMs: 200, verticalAxis: true } },
            { level: 11, timeLimitSec: 60, variantCode: 'FOUR_CORNER', variantName: 'Bốn Góc Tứ Phương', parametersJson: { spanPx: 800, flashDurationMs: 180, fourCorners: true } },
            { level: 12, timeLimitSec: 60, variantCode: 'PERIPHERAL_WORD', variantName: 'Từ Vựng Ngoại Vi Toàn Phần', parametersJson: { spanPx: 880, flashDurationMs: 160, fullWordPeripheral: true } }
        ]
    },
    {
        id: 'ex-green-dot',
        categoryId: 'cat-2',
        categoryCode: 'PERIPHERAL_VISION',
        categoryName: 'Thị Giác Ngoại Vi',
        slug: 'green-dot',
        title: 'Điểm xanh',
        subtitle: 'Khóa mắt vào điểm xanh ở giữa và hấp thụ nhiều dòng chữ xung quanh',
        iconName: 'Circle',
        scientificBasis: 'Bài tập cố định điểm nhìn trung tâm (Fixation Training) giúp rèn luyện khả năng duy trì tập trung và nhận thức không gian xung quanh.',
        instructions: 'Giữ nguyên ánh mắt vào chấm tròn màu xanh lục trong 60 giây. Thả lỏng cơ mắt và cảm nhận câu chữ xung quanh hiện lên rõ nét.',
        rulesSummary: 'Sau khi hết giờ, trả lời câu hỏi trắc nghiệm ngắn về nội dung các dòng văn bản xung quanh chấm xanh.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: false,
        levelConfigs: [
            { level: 1, timeLimitSec: 45, parametersJson: { lineCount: 2 } },
            { level: 2, timeLimitSec: 45, parametersJson: { lineCount: 3 } },
            { level: 3, timeLimitSec: 50, parametersJson: { lineCount: 4 } },
            { level: 4, timeLimitSec: 50, parametersJson: { lineCount: 4 } },
            { level: 5, timeLimitSec: 55, parametersJson: { lineCount: 5 } },
            { level: 6, timeLimitSec: 55, parametersJson: { lineCount: 6 } },
            { level: 7, timeLimitSec: 60, parametersJson: { lineCount: 7 } },
            { level: 8, timeLimitSec: 60, parametersJson: { lineCount: 8 } },
            { level: 9, timeLimitSec: 60, variantCode: 'DYNAMIC_TEXT', variantName: 'Văn Bản Biến Đổi', parametersJson: { lineCount: 8, dynamicChangeSec: 10 } },
            { level: 10, timeLimitSec: 60, variantCode: 'MULTI_DOT', variantName: 'Song Điểm Hội Tụ', parametersJson: { lineCount: 8, multiDots: 2 } },
            { level: 11, timeLimitSec: 60, variantCode: 'PERIPHERAL_PARAGRAPH', variantName: 'Khối Văn Bản Ngoại Rìa', parametersJson: { lineCount: 10, deepPeripheralCheck: true } },
            { level: 12, timeLimitSec: 60, variantCode: 'GREEN_DOT_NOISE', variantName: 'Nhiễu Loạn Thị Giác', parametersJson: { lineCount: 10, distractorFlashes: true } }
        ]
    },
    {
        id: 'ex-word-chunking',
        categoryId: 'cat-1',
        categoryCode: 'SPEED_READING',
        categoryName: 'Đọc Nhanh',
        slug: 'word-chunking',
        title: 'Chuỗi từ',
        subtitle: 'Đọc theo cụm từ ngữ nghĩa nhấp nháy tuần tự thay vì từng từ đơn lẻ',
        iconName: 'Layers',
        scientificBasis: 'Rèn luyện kỹ thuật gom cụm từ (Chunking), giúp giảm tần suất dừng mắt trên từng dòng và cải thiện tốc độ nắm bắt thông tin.',
        instructions: 'Các cụm từ 2-4 chữ sẽ lần lượt đóng khung sáng lên theo nhịp điệu. Hãy để mắt di chuyển nhịp nhàng theo từng khối ý nghĩa.',
        rulesSummary: 'Tốc độ nhịp nhảy của cụm từ sẽ tăng dần qua các cấp độ.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: false,
        levelConfigs: [
            { level: 1, speedWpm: 220, parametersJson: { wordsPerChunk: 2 }, timeLimitSec: 60 },
            { level: 2, speedWpm: 320, parametersJson: { wordsPerChunk: 2 }, timeLimitSec: 60 },
            { level: 3, speedWpm: 420, parametersJson: { wordsPerChunk: 3 }, timeLimitSec: 60 },
            { level: 4, speedWpm: 520, parametersJson: { wordsPerChunk: 3 }, timeLimitSec: 60 },
            { level: 5, speedWpm: 620, parametersJson: { wordsPerChunk: 3 }, timeLimitSec: 60 },
            { level: 6, speedWpm: 750, parametersJson: { wordsPerChunk: 4 }, timeLimitSec: 60 },
            { level: 7, speedWpm: 900, parametersJson: { wordsPerChunk: 4 }, timeLimitSec: 60 },
            { level: 8, speedWpm: 1100, parametersJson: { wordsPerChunk: 4 }, timeLimitSec: 60 },
            { level: 9, speedWpm: 1250, parametersJson: { wordsPerChunk: 5 }, timeLimitSec: 60, variantCode: 'SEMANTIC_CHUNK', variantName: 'Cụm Ngữ Pháp Hoàn Chỉnh' },
            { level: 10, speedWpm: 1400, parametersJson: { wordsPerChunk: 5, dualRow: true }, timeLimitSec: 60, variantCode: 'DUAL_ROW_CHUNK', variantName: 'Song Dòng Đồng Thời' },
            { level: 11, speedWpm: 1550, parametersJson: { wordsPerChunk: 6, speedRamp: true }, timeLimitSec: 60, variantCode: 'SPEED_RAMP', variantName: 'Gia Tốc Liên Tục' },
            { level: 12, speedWpm: 1700, parametersJson: { wordsPerChunk: 6, inlineQuiz: true }, timeLimitSec: 60, variantCode: 'COMPREHENSION_CHUNK', variantName: 'Đọc Cụm Kiểm Tra Tức Thì' }
        ]
    },
    {
        id: 'ex-reading-assessment',
        categoryId: 'cat-1',
        categoryCode: 'SPEED_READING',
        categoryName: 'Đọc Nhanh',
        slug: 'reading-assessment',
        title: 'Đánh giá tốc độ đọc',
        subtitle: 'Đo lường chính xác chỉ số WPM và tỷ lệ phần trăm đọc hiểu thực tế',
        iconName: 'Award',
        scientificBasis: 'Công thức chuẩn quốc tế: Tốc độ đọc hiệu dụng Effective WPM = Raw WPM x (Comprehension % / 100).',
        instructions: 'Đọc bài báo một cách tự nhiên. Khi đọc xong, bấm nút "Đã đọc xong" và hoàn thành 4 câu hỏi trắc nghiệm kiểm tra độ hiểu.',
        rulesSummary: 'Hệ thống tự động tính WPM thô, điểm hiểu bài và xếp hạng cấp bậc đọc của bạn.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 180,
        isFeatured: true,
        levelConfigs: [
            { level: 1, timeLimitSec: 180, parametersJson: { textId: 'text-1' } },
            { level: 2, timeLimitSec: 180, parametersJson: { textId: 'text-2' } },
            { level: 3, timeLimitSec: 180, parametersJson: { textId: 'text-3' } },
            { level: 4, timeLimitSec: 240, parametersJson: { textId: 'text-4' } },
            { level: 5, timeLimitSec: 240, parametersJson: { textId: 'text-5' } },
            { level: 6, timeLimitSec: 300, parametersJson: { textId: 'text-6' } },
            { level: 7, timeLimitSec: 300, parametersJson: { textId: 'text-7' } },
            { level: 8, timeLimitSec: 360, parametersJson: { textId: 'text-8' } },
            { level: 9, timeLimitSec: 150, parametersJson: { textId: 'text-1', timedPressure: true }, variantCode: 'TIMED_PRESSURE', variantName: 'Đọc Dưới Áp Lực Đếm Ngược' },
            { level: 10, timeLimitSec: 180, parametersJson: { textId: 'text-2', deepInference: true, questionsCount: 6 }, variantCode: 'DEEP_COMPREHENSION', variantName: 'Đọc Hiểu Tầng Sâu Suy Luận' },
            { level: 11, timeLimitSec: 210, parametersJson: { textId: 'text-3', multiPassage: true }, variantCode: 'MULTI_PASSAGE', variantName: 'So Sánh Đa Văn Bản' },
            { level: 12, timeLimitSec: 240, parametersJson: { textId: 'text-4', academicText: true }, variantCode: 'ACADEMIC_TEXT', variantName: 'Văn Bản Khoa Học Học Thuật' }
        ]
    },
    {
        id: 'ex-reading-pacer',
        categoryId: 'cat-1',
        categoryCode: 'SPEED_READING',
        categoryName: 'Đọc Nhanh',
        slug: 'reading-pacer',
        title: 'Tăng tốc độ đọc',
        subtitle: 'Áp dụng Bionic Reading và thanh nhịp điệu pacer dẫn hướng mắt',
        iconName: 'Gauge',
        scientificBasis: 'Kỹ thuật đánh dấu dẫn hướng nhịp đọc (Visual Pacing) kết hợp nhấn âm tiết đầu, hỗ trợ tăng nhịp quét chữ ổn định.',
        instructions: 'Thanh dẫn hướng màu xanh sẽ lướt theo từng dòng văn bản. Hãy ép mắt bạn di chuyển theo thanh dẫn để phá vỡ giới hạn đọc cũ.',
        rulesSummary: 'Có thể tăng giảm nhịp Pacer từ 250 đến 800 WPM.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 90,
        isFeatured: false,
        levelConfigs: [
            { level: 1, speedWpm: 250, timeLimitSec: 90 },
            { level: 2, speedWpm: 350, timeLimitSec: 90 },
            { level: 3, speedWpm: 450, timeLimitSec: 90 },
            { level: 4, speedWpm: 550, timeLimitSec: 90 },
            { level: 5, speedWpm: 650, timeLimitSec: 90 },
            { level: 6, speedWpm: 750, timeLimitSec: 90 },
            { level: 7, speedWpm: 850, timeLimitSec: 90 },
            { level: 8, speedWpm: 1000, timeLimitSec: 90 },
            { level: 9, speedWpm: 1100, timeLimitSec: 90, variantCode: 'AUTO_ACCELERATE', variantName: 'Pacer Tự Gia Tốc', parametersJson: { autoAccelRate: 0.1 } },
            { level: 10, speedWpm: 1200, timeLimitSec: 90, variantCode: 'VANISHING_PACER', variantName: 'Pacer Ẩn Dần Thử Thách Não', parametersJson: { fadeAfterSec: 45 } },
            { level: 11, speedWpm: 1350, timeLimitSec: 90, variantCode: 'MULTI_LINE_PACER', variantName: 'Pacer Hai Dòng Song Hành', parametersJson: { dualLine: true } },
            { level: 12, speedWpm: 1500, timeLimitSec: 90, variantCode: 'BLIND_PACER', variantName: 'Pacer Tàng Hình Trắc Nghiệm', parametersJson: { invisiblePacer: true, finalQuiz: true } }
        ]
    },
    {
        id: 'ex-text-scanning',
        categoryId: 'cat-3',
        categoryCode: 'ATTENTION',
        categoryName: 'Chú Ý Tập Trung',
        slug: 'text-scanning',
        title: 'Tìm trong văn bản',
        subtitle: 'Kỹ năng Skimming & Scanning trích xuất thông tin mục tiêu trong đoạn văn',
        iconName: 'FileSearch',
        scientificBasis: 'Rèn luyện khả năng lọc thông tin không liên quan khi tra cứu tài liệu, sách báo và hợp đồng thực tế.',
        instructions: 'Đọc câu hỏi mục tiêu (ví dụ: Tìm năm sinh hoặc tên địa danh), quét nhanh qua đoạn văn và bấm chọn từ khóa chính xác.',
        rulesSummary: 'Tìm ra từ khóa càng nhanh thì điểm thưởng thời gian càng cao.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: false,
        levelConfigs: [
            { level: 1, timeLimitSec: 45, parametersJson: { wordCount: 100 } },
            { level: 2, timeLimitSec: 45, parametersJson: { wordCount: 150 } },
            { level: 3, timeLimitSec: 50, parametersJson: { wordCount: 200 } },
            { level: 4, timeLimitSec: 50, parametersJson: { wordCount: 250 } },
            { level: 5, timeLimitSec: 55, parametersJson: { wordCount: 300 } },
            { level: 6, timeLimitSec: 55, parametersJson: { wordCount: 350 } },
            { level: 7, timeLimitSec: 60, parametersJson: { wordCount: 400 } },
            { level: 8, timeLimitSec: 60, parametersJson: { wordCount: 500 } },
            { level: 9, timeLimitSec: 50, parametersJson: { wordCount: 450, multiTarget: 3 }, variantCode: 'MULTI_TARGET_SCAN', variantName: 'Tìm 3 Từ Khóa Đồng Thời' },
            { level: 10, timeLimitSec: 45, parametersJson: { wordCount: 500, synonymMatch: true }, variantCode: 'SYNONYM_SCAN', variantName: 'Tìm Khái Niệm Đồng Nghĩa' },
            { level: 11, timeLimitSec: 40, parametersJson: { wordCount: 550, crossReference: true }, variantCode: 'CROSS_REFERENCE_SCAN', variantName: 'Đối Chiếu Hai Đoạn Văn' },
            { level: 12, timeLimitSec: 35, parametersJson: { wordCount: 600, speedElimination: true }, variantCode: 'SPEED_ELIMINATION', variantName: 'Đua Tốc Độ Triệt Tiêu Từ' }
        ]
    },
    {
        id: 'ex-card-flip',
        categoryId: 'cat-4',
        categoryCode: 'MEMORY',
        categoryName: 'Trí Nhớ Làm Việc',
        slug: 'card-flip',
        title: 'Lật Thẻ Trí Nhớ 3D',
        subtitle: 'Rèn luyện trí nhớ không gian & ghép cặp biểu tượng não bộ 3D',
        iconName: 'Sparkles',
        scientificBasis: 'Dựa trên mô hình bảng phác thảo thị giác-không gian (Visuo-spatial Sketchpad), rèn luyện khả năng ghi nhớ tọa độ và trạng thái thẻ.',
        instructions: 'Lật các thẻ để tìm các cặp biểu tượng giống nhau. Cố gắng ghi nhớ vị trí các thẻ đã lật để hoàn thành với số lượt ít nhất.',
        rulesSummary: 'Lật đúng liên tiếp để kích hoạt Combo điểm thưởng. Ở cấp độ cao, các thẻ sẽ có thêm thẻ bẫy đảo vị trí!',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: true,
        levelConfigs: [
            { level: 1, gridRows: 3, gridCols: 4, targetItemCount: 6, timeLimitSec: 45, parametersJson: { pairCount: 6 } },
            { level: 2, gridRows: 3, gridCols: 4, targetItemCount: 6, timeLimitSec: 40, parametersJson: { pairCount: 6 } },
            { level: 3, gridRows: 4, gridCols: 4, targetItemCount: 8, timeLimitSec: 50, parametersJson: { pairCount: 8 } },
            { level: 4, gridRows: 4, gridCols: 4, targetItemCount: 8, timeLimitSec: 45, parametersJson: { pairCount: 8 } },
            { level: 5, gridRows: 4, gridCols: 5, targetItemCount: 10, timeLimitSec: 55, parametersJson: { pairCount: 10 } },
            { level: 6, gridRows: 4, gridCols: 5, targetItemCount: 10, timeLimitSec: 50, parametersJson: { pairCount: 10 } },
            { level: 7, gridRows: 4, gridCols: 6, targetItemCount: 12, timeLimitSec: 60, parametersJson: { pairCount: 12 } },
            { level: 8, gridRows: 5, gridCols: 6, targetItemCount: 15, timeLimitSec: 75, parametersJson: { pairCount: 15 } },
            { level: 9, gridRows: 5, gridCols: 6, targetItemCount: 16, timeLimitSec: 80, variantCode: 'TRIPLE_MATCH', variantName: 'Ghép Bộ Ba Thẻ', parametersJson: { pairCount: 16, tripleMatch: true } },
            { level: 10, gridRows: 6, gridCols: 6, targetItemCount: 18, timeLimitSec: 85, variantCode: 'SHUFFLE_TRAP', variantName: 'Bẫy Đảo Vị Trí Thẻ', parametersJson: { pairCount: 18, shuffleIntervalSec: 10 } },
            { level: 11, gridRows: 6, gridCols: 6, targetItemCount: 18, timeLimitSec: 80, variantCode: 'SEQUENCE_MATCH', variantName: 'Ghép Theo Trật Tự Chuỗi', parametersJson: { pairCount: 18, sequenceOrder: true } },
            { level: 12, gridRows: 6, gridCols: 7, targetItemCount: 20, timeLimitSec: 90, variantCode: 'AUDIO_VISUAL', variantName: 'Giao Thoa Âm Thanh & Hình Ảnh', parametersJson: { pairCount: 20, audioVisualMode: true } }
        ]
    },
    {
        id: 'ex-stroop-clash',
        categoryId: 'cat-5',
        categoryCode: 'REACTION',
        categoryName: 'Phản Xạ Nhận Thức',
        slug: 'stroop-clash',
        title: 'Đấu Màu Nhận Thức',
        subtitle: 'Hiệu ứng Stroop ức chế phản xạ đọc chữ và nhận dạng màu mực',
        iconName: 'Palette',
        scientificBasis: 'Dựa trên hiệu ứng Stroop kinh điển, rèn luyện khả năng ức chế can thiệp thông tin xung đột giữa màu sắc và ngữ nghĩa.',
        instructions: 'Một chữ cái xuất hiện mang nghĩa của một màu sắc nhưng được tô mực bằng màu khác. Hãy bấm nút đúng với MÀU MỰC thực tế.',
        rulesSummary: 'Không được đọc theo nghĩa của từ! Phải chọn đúng màu mực hiển thị nhanh nhất có thể.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 45,
        isFeatured: true,
        levelConfigs: [
            { level: 1, timeLimitSec: 30, parametersJson: { reactionWindowMs: 3500 } },
            { level: 2, timeLimitSec: 30, parametersJson: { reactionWindowMs: 3000 } },
            { level: 3, timeLimitSec: 35, parametersJson: { reactionWindowMs: 2600 } },
            { level: 4, timeLimitSec: 35, parametersJson: { reactionWindowMs: 2300 } },
            { level: 5, timeLimitSec: 40, parametersJson: { reactionWindowMs: 2000 } },
            { level: 6, timeLimitSec: 40, parametersJson: { reactionWindowMs: 1800 } },
            { level: 7, timeLimitSec: 45, parametersJson: { reactionWindowMs: 1600 } },
            { level: 8, timeLimitSec: 45, parametersJson: { reactionWindowMs: 1450 } },
            { level: 9, timeLimitSec: 45, variantCode: 'REVERSE_STROOP', variantName: 'Đảo Ngược: Chọn Nghĩa Chữ', parametersJson: { reactionWindowMs: 1500, reverseStroop: true } },
            { level: 10, timeLimitSec: 45, variantCode: 'TRIPLE_STROOP', variantName: 'Tam Trùng Xung Đột (Chữ-Màu-Viền)', parametersJson: { reactionWindowMs: 1400, borderClash: true } },
            { level: 11, timeLimitSec: 40, variantCode: 'ALTERNATING_RULE', variantName: 'Luân Phiên Chữ & Màu', parametersJson: { reactionWindowMs: 1300, alternatingMode: true } },
            { level: 12, timeLimitSec: 40, variantCode: 'STROOP_N_BACK', variantName: 'Stroop N-Back Nhớ Lùi', parametersJson: { reactionWindowMs: 1200, nBack: 1 } }
        ]
    },
    {
        id: 'ex-spatial-memory',
        categoryId: 'cat-4',
        categoryCode: 'MEMORY',
        categoryName: 'Trí Nhớ Làm Việc',
        slug: 'spatial-memory',
        title: 'Nhớ Khối Không Gian',
        subtitle: 'Thử nghiệm tâm lý thần kinh Corsi Block Tapping ghi nhớ chuỗi ô sáng',
        iconName: 'LayoutGrid',
        scientificBasis: 'Dựa trên bài thử khối Corsi (Corsi Block-Tapping Task), rèn luyện khả năng mã hóa và tái hiện chuỗi vị trí trong không gian.',
        instructions: 'Quan sát các ô trong lưới phát sáng lần lượt theo một thứ tự. Sau đó bấm lại các ô theo đúng thứ tự đó.',
        rulesSummary: 'Độ dài chuỗi ô sáng tăng dần từ 3 ô đến 9 ô theo từng cấp độ.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: false,
        levelConfigs: [
            { level: 1, gridRows: 3, gridCols: 3, targetItemCount: 3, timeLimitSec: 40 },
            { level: 2, gridRows: 3, gridCols: 3, targetItemCount: 4, timeLimitSec: 40 },
            { level: 3, gridRows: 4, gridCols: 4, targetItemCount: 4, timeLimitSec: 45 },
            { level: 4, gridRows: 4, gridCols: 4, targetItemCount: 5, timeLimitSec: 45 },
            { level: 5, gridRows: 4, gridCols: 4, targetItemCount: 6, timeLimitSec: 50 },
            { level: 6, gridRows: 5, gridCols: 5, targetItemCount: 7, timeLimitSec: 55 },
            { level: 7, gridRows: 5, gridCols: 5, targetItemCount: 8, timeLimitSec: 60 },
            { level: 8, gridRows: 5, gridCols: 5, targetItemCount: 9, timeLimitSec: 65, parametersJson: { reverseOrder: true } },
            { level: 9, gridRows: 5, gridCols: 5, targetItemCount: 10, timeLimitSec: 65, variantCode: 'REVERSE_CORSI', variantName: 'Corsi Chạm Ngược Chiều', parametersJson: { reverseOrder: true } },
            { level: 10, gridRows: 6, gridCols: 6, targetItemCount: 11, timeLimitSec: 70, variantCode: 'SPATIAL_DEPTH', variantName: 'Không Gian Đa Tầng 3D', parametersJson: { depthLayer: true } },
            { level: 11, gridRows: 6, gridCols: 6, targetItemCount: 12, timeLimitSec: 75, variantCode: 'DUAL_SEQUENCE', variantName: 'Song Chuỗi Hai Sắc Tộc', parametersJson: { dualColorSequence: true } },
            { level: 12, gridRows: 6, gridCols: 6, targetItemCount: 13, timeLimitSec: 80, variantCode: 'DYNAMIC_GRID', variantName: 'Lưới Không Gian Xoay Trục', parametersJson: { rotateAfterFlash: true } }
        ]
    },
    {
        id: 'ex-saccade-tracker',
        categoryId: 'cat-2',
        categoryCode: 'PERIPHERAL_VISION',
        categoryName: 'Thị Giác Ngoại Vi',
        slug: 'saccade-tracker',
        title: 'Theo Dõi Mắt Nhanh',
        subtitle: 'Rèn luyện cơ vận nhãn bám theo mục tiêu nhảy cóc tốc độ cao',
        iconName: 'Eye',
        scientificBasis: 'Bài tập chuyển động giật mắt có chủ đích (Voluntary Saccades), giúp rèn luyện phản xạ di chuyển điểm nhìn nhanh và chính xác giữa các mục tiêu.',
        instructions: 'Mục tiêu sẽ nảy và nhảy cóc liên tục trên màn hình. Hãy dùng mắt bám sát mục tiêu và nhấp vào nút phản xạ mỗi khi ký tự chuyển thành chữ "X".',
        rulesSummary: 'Không cử động đầu, chỉ di chuyển con ngươi theo mục tiêu. Tốc độ nhảy tăng dần theo cấp độ.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 45,
        isFeatured: false,
        levelConfigs: [
            { level: 1, speedWpm: 150, timeLimitSec: 30 },
            { level: 2, speedWpm: 200, timeLimitSec: 30 },
            { level: 3, speedWpm: 250, timeLimitSec: 35 },
            { level: 4, speedWpm: 300, timeLimitSec: 35 },
            { level: 5, speedWpm: 380, timeLimitSec: 40 },
            { level: 6, speedWpm: 460, timeLimitSec: 40 },
            { level: 7, speedWpm: 550, timeLimitSec: 45 },
            { level: 8, speedWpm: 650, timeLimitSec: 45 },
            { level: 9, speedWpm: 750, timeLimitSec: 45, variantCode: 'MULTI_TARGET_SACCADE', variantName: 'Song Mục Tiêu Nhảy Nhót', parametersJson: { multiTargetCount: 2 } },
            { level: 10, speedWpm: 850, timeLimitSec: 45, variantCode: 'PREDICTIVE_SACCADE', variantName: 'Quỹ Đạo Dự Đoán Trắc Lượng', parametersJson: { trajectoryPrediction: true } },
            { level: 11, speedWpm: 950, timeLimitSec: 45, variantCode: 'COLOR_SWITCH_SACCADE', variantName: 'Chuyển Đổi Sắc Thái Kích Hoạt', parametersJson: { colorFilter: 'red' } },
            { level: 12, speedWpm: 1100, timeLimitSec: 45, variantCode: 'ARENA_3D_SACCADE', variantName: 'Đấu Trường Vận Nhãn 3D', parametersJson: { arena3D: true } }
        ]
    },
    {
        id: 'ex-pitch-recall',
        categoryId: 'cat-6',
        categoryCode: 'AUDITORY_MEMORY',
        categoryName: 'Trí Nhớ Âm Thanh',
        slug: 'pitch-recall',
        title: 'Nhớ Cao Độ',
        subtitle: 'Ghi nhớ và bấm lại chính xác chuỗi nốt nhạc trên phím đàn',
        iconName: 'Music',
        scientificBasis: 'Kích hoạt thùy thái dương và thùy đỉnh trong việc mã hóa cao độ thính giác và duy trì chuỗi âm thanh trong vòng lặp âm vị học (Phonological Loop).',
        instructions: 'Lắng nghe chuỗi nốt nhạc phát ra. Sau đó bấm lại các phím đàn theo đúng trình tự nốt bạn vừa nghe.',
        rulesSummary: 'Bấm đúng thứ tự các nốt nhạc trước khi hết giờ. Độ dài chuỗi nốt và số lượng phím đàn tăng dần.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: true,
        levelConfigs: [
            { level: 1, timeLimitSec: 45, targetItemCount: 3, parametersJson: { sequenceLength: 3, octaveRange: [4, 4], keyCount: 5, visualKeyHint: true, noteSpeedMs: 650 } },
            { level: 2, timeLimitSec: 45, targetItemCount: 4, parametersJson: { sequenceLength: 4, octaveRange: [4, 4], keyCount: 7, visualKeyHint: true, noteSpeedMs: 600 } },
            { level: 3, timeLimitSec: 50, targetItemCount: 4, parametersJson: { sequenceLength: 4, octaveRange: [4, 4], keyCount: 8, visualKeyHint: false, noteSpeedMs: 550 } },
            { level: 4, timeLimitSec: 50, targetItemCount: 5, parametersJson: { sequenceLength: 5, octaveRange: [4, 4], keyCount: 10, accidentals: true, noteSpeedMs: 500 } },
            { level: 5, timeLimitSec: 55, targetItemCount: 5, parametersJson: { sequenceLength: 5, octaveRange: [4, 5], keyCount: 12, accidentals: true, noteSpeedMs: 480 } },
            { level: 6, timeLimitSec: 55, targetItemCount: 6, parametersJson: { sequenceLength: 6, octaveRange: [4, 5], keyCount: 14, accidentals: true, noteSpeedMs: 450 } },
            { level: 7, timeLimitSec: 60, targetItemCount: 6, parametersJson: { sequenceLength: 6, octaveRange: [3, 5], keyCount: 17, accidentals: true, noteSpeedMs: 420 } },
            { level: 8, timeLimitSec: 60, targetItemCount: 7, parametersJson: { sequenceLength: 7, octaveRange: [3, 5], keyCount: 21, accidentals: true, noteSpeedMs: 400 } },
            { level: 9, timeLimitSec: 60, targetItemCount: 7, variantCode: 'REVERSE_PITCH', variantName: 'Đảo Ngược Chuỗi Âm', parametersJson: { sequenceLength: 6, reverseRecall: true, noteSpeedMs: 400 } },
            { level: 10, timeLimitSec: 55, targetItemCount: 4, variantCode: 'MELODIC_CONTOUR', variantName: 'Đường Nét Giai Điệu', parametersJson: { contourMode: true, parsonsCode: true, noteSpeedMs: 360 } },
            { level: 11, timeLimitSec: 50, targetItemCount: 6, variantCode: 'OCTAVE_LEAP', variantName: 'Bước Nhảy Bát Độ', parametersJson: { sequenceLength: 6, octaveRange: [3, 5], octaveJumps: true, noteSpeedMs: 360 } },
            { level: 12, timeLimitSec: 45, targetItemCount: 6, variantCode: 'CHROMATIC_ODDBALL', variantName: 'Nốt Ngoại Điệu', parametersJson: { sequenceLength: 6, oddballDetection: true, noteSpeedMs: 360 } }
        ]
    },
    {
        id: 'ex-interval-identify',
        categoryId: 'cat-6',
        categoryCode: 'AUDITORY_MEMORY',
        categoryName: 'Trí Nhớ Âm Thanh',
        slug: 'interval-identify',
        title: 'Nhận Diện Quãng',
        subtitle: 'Phân biệt khoảng cách cao độ giữa các nốt nhạc (Relative Pitch)',
        iconName: 'Sliders',
        scientificBasis: 'Phát triển năng lực cảm âm tương đối (Relative Pitch), rèn luyện vỏ não thính giác sơ cấp (A1) nhận diện bước nhảy tần số Hertz giữa hai cao độ.',
        instructions: 'Lắng nghe 2 nốt nhạc phát ra (nối tiếp hoặc đồng thời). Chọn chính xác tên quãng nhạc tương ứng.',
        rulesSummary: 'Xác định đúng quãng trước khi hết giờ. Cấp độ cao sẽ mở rộng quãng nghịch, quãng tăng/giảm và hợp âm 2 nốt cùng lúc.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: false,
        levelConfigs: [
            { level: 1, timeLimitSec: 45, targetItemCount: 5, parametersJson: { intervalPool: ['1P', '5P', '8P'], playbackMode: 'melodic-ascending', optionsCount: 3 } },
            { level: 2, timeLimitSec: 45, targetItemCount: 6, parametersJson: { intervalPool: ['1P', '3M', '5P', '8P'], playbackMode: 'melodic-ascending', optionsCount: 4 } },
            { level: 3, timeLimitSec: 50, targetItemCount: 6, parametersJson: { intervalPool: ['1P', '3m', '3M', '4P', '5P', '8P'], playbackMode: 'melodic-ascending', optionsCount: 4 } },
            { level: 4, timeLimitSec: 50, targetItemCount: 7, parametersJson: { intervalPool: ['2M', '3m', '3M', '4P', '5P', '6M', '8P'], playbackMode: 'melodic-both', optionsCount: 4 } },
            { level: 5, timeLimitSec: 55, targetItemCount: 7, parametersJson: { intervalPool: ['2m', '2M', '3m', '3M', '4P', '5P', '6m', '6M', '7m', '7M', '8P'], playbackMode: 'melodic-both', optionsCount: 4 } },
            { level: 6, timeLimitSec: 55, targetItemCount: 8, parametersJson: { intervalPool: ['2m', '2M', '3m', '3M', '4P', '4A', '5P', '6m', '6M', '7m', '7M', '8P'], playbackMode: 'melodic-descending', optionsCount: 4 } },
            { level: 7, timeLimitSec: 55, targetItemCount: 8, parametersJson: { intervalPool: ['all-diatonic'], playbackMode: 'harmonic', optionsCount: 4 } },
            { level: 8, timeLimitSec: 60, targetItemCount: 9, parametersJson: { intervalPool: ['all-diatonic', '4A'], playbackMode: 'mixed', optionsCount: 5 } },
            { level: 9, timeLimitSec: 55, targetItemCount: 9, variantCode: 'COMPOUND_INTERVAL', variantName: 'Quãng Kép Mở Rộng', parametersJson: { compound: true, playbackMode: 'mixed', optionsCount: 5 } },
            { level: 10, timeLimitSec: 50, targetItemCount: 10, variantCode: 'RAPID_HARMONIC', variantName: 'Hòa Âm Chớp Nháy', parametersJson: { noteDurationMs: 250, playbackMode: 'harmonic', optionsCount: 5 } },
            { level: 11, timeLimitSec: 45, targetItemCount: 10, variantCode: 'INVERTED_INTERVAL', variantName: 'Quãng Đảo Bát Độ', parametersJson: { requireInversion: true, playbackMode: 'mixed', optionsCount: 5 } },
            { level: 12, timeLimitSec: 40, targetItemCount: 11, variantCode: 'MICRO_INTERVAL_PRO', variantName: 'Đấu Trường Cảm Quãng Cấp Cao', parametersJson: { compound: true, playbackMode: 'harmonic', optionsCount: 6 } }
        ]
    },
    {
        id: 'ex-rhythm-recall',
        categoryId: 'cat-6',
        categoryCode: 'AUDITORY_MEMORY',
        categoryName: 'Trí Nhớ Âm Thanh',
        slug: 'rhythm-recall',
        title: 'Nhớ Nhịp Điệu',
        subtitle: 'Lắng nghe mẫu hình tiết tấu và gõ lại đúng nhịp phách',
        iconName: 'Activity',
        scientificBasis: 'Rèn luyện sự phối hợp giữa vỏ não thính giác và hệ thống tiểu não - hạch nền trong việc tính toán nhịp thời gian mili-giây (Temporal Processing).',
        instructions: 'Lắng nghe chuỗi nhịp điệu phát ra. Sau đó chạm nút hoặc phím Space để gõ lại đúng tiết tấu và cường độ phách.',
        rulesSummary: 'Gõ nhịp đúng thời điểm với sai số nhỏ nhất. Cấp độ cao tăng tốc độ BPM, xuất hiện đảo phách (syncopation) và đa nhịp.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: false,
        levelConfigs: [
            { level: 1, timeLimitSec: 45, targetItemCount: 3, parametersJson: { stepCount: 4, bpm: 85, toleranceMs: 220, showVisualBeat: true } },
            { level: 2, timeLimitSec: 45, targetItemCount: 4, parametersJson: { stepCount: 6, bpm: 90, toleranceMs: 200, showVisualBeat: true } },
            { level: 3, timeLimitSec: 50, targetItemCount: 4, parametersJson: { stepCount: 6, bpm: 95, toleranceMs: 190, showVisualBeat: false } },
            { level: 4, timeLimitSec: 50, targetItemCount: 5, parametersJson: { stepCount: 8, bpm: 100, toleranceMs: 175, syncopated: false } },
            { level: 5, timeLimitSec: 55, targetItemCount: 5, parametersJson: { stepCount: 8, bpm: 105, toleranceMs: 160, syncopated: true } },
            { level: 6, timeLimitSec: 55, targetItemCount: 6, parametersJson: { stepCount: 10, bpm: 110, toleranceMs: 150, syncopated: true } },
            { level: 7, timeLimitSec: 60, targetItemCount: 6, parametersJson: { stepCount: 12, bpm: 115, toleranceMs: 140, accents: true } },
            { level: 8, timeLimitSec: 60, targetItemCount: 7, parametersJson: { stepCount: 12, bpm: 120, toleranceMs: 130, accents: true } },
            { level: 9, timeLimitSec: 55, targetItemCount: 7, variantCode: 'SWING_GROOVE', variantName: 'Tiết Tấu Nhịp Swing', parametersJson: { stepCount: 12, bpm: 125, groove: 'swing', toleranceMs: 120 } },
            { level: 10, timeLimitSec: 50, targetItemCount: 8, variantCode: 'POLYRHYTHM_PULSE', variantName: 'Đa Tiết Tấu Lồng Ghép', parametersJson: { stepCount: 12, bpm: 130, polyrhythm: '3:2', toleranceMs: 115 } },
            { level: 11, timeLimitSec: 45, targetItemCount: 8, variantCode: 'TEMPO_WARP', variantName: 'Biến Đổi Gia Tốc BPM', parametersJson: { stepCount: 14, tempoAccelerando: true, toleranceMs: 110 } },
            { level: 12, timeLimitSec: 40, targetItemCount: 9, variantCode: 'CHRONO_MAESTRO', variantName: 'Bậc Thầy Tiết Tấu Không Gian', parametersJson: { stepCount: 16, bpm: 140, accents: true, toleranceMs: 95 } }
        ]
    },
    {
        id: 'ex-chord-identify',
        categoryId: 'cat-6',
        categoryCode: 'AUDITORY_MEMORY',
        categoryName: 'Trí Nhớ Âm Thanh',
        slug: 'chord-identify',
        title: 'Nhận Diện Hợp Âm',
        subtitle: 'Phân biệt màu sắc hòa âm: Trưởng, Thứ, 7th, Giảm, Tăng',
        iconName: 'Layers',
        scientificBasis: 'Kích hoạt khả năng phân rã và tổng hợp sóng âm phức (Polyphonic Auditory Scene Analysis) tại vùng hồi Heschl.',
        instructions: 'Lắng nghe hợp âm vang lên (hòa âm hoặc rải arpeggio). Chọn đúng tính chất của hợp âm đó.',
        rulesSummary: 'Xác định nhanh loại hợp âm. Cấp độ cao bổ sung hợp âm 7th, 9th, thế đảo (inversions) và hợp âm jazz.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: false,
        levelConfigs: [
            { level: 1, timeLimitSec: 45, targetItemCount: 5, parametersJson: { chordTypes: ['Major', 'Minor'], playback: 'block', optionsCount: 2 } },
            { level: 2, timeLimitSec: 45, targetItemCount: 6, parametersJson: { chordTypes: ['Major', 'Minor'], playback: 'arpeggio', optionsCount: 2 } },
            { level: 3, timeLimitSec: 50, targetItemCount: 6, parametersJson: { chordTypes: ['Major', 'Minor', 'Diminished'], playback: 'block', optionsCount: 3 } },
            { level: 4, timeLimitSec: 50, targetItemCount: 7, parametersJson: { chordTypes: ['Major', 'Minor', 'Diminished', 'Augmented'], playback: 'block', optionsCount: 4 } },
            { level: 5, timeLimitSec: 55, targetItemCount: 7, parametersJson: { chordTypes: ['Major', 'Minor', 'Diminished', 'Augmented'], playback: 'mixed', optionsCount: 4 } },
            { level: 6, timeLimitSec: 55, targetItemCount: 8, parametersJson: { chordTypes: ['Maj7', 'm7', 'dom7'], playback: 'block', optionsCount: 3 } },
            { level: 7, timeLimitSec: 55, targetItemCount: 8, parametersJson: { chordTypes: ['Major', 'Minor', 'Maj7', 'm7', 'dom7', 'm7b5'], playback: 'block', optionsCount: 4 } },
            { level: 8, timeLimitSec: 60, targetItemCount: 9, parametersJson: { chordTypes: ['Major', 'Minor', 'Maj7', 'm7', 'dom7', 'dim7', 'sus4'], playback: 'mixed', optionsCount: 4 } },
            { level: 9, timeLimitSec: 55, targetItemCount: 9, variantCode: 'INVERSION_DETECTION', variantName: 'Nhận Diện Thế Đảo', parametersJson: { inversions: true, chordTypes: ['Major', 'Minor', 'dom7'], optionsCount: 4 } },
            { level: 10, timeLimitSec: 50, targetItemCount: 10, variantCode: 'EXTENDED_JAZZ', variantName: 'Hòa Âm Jazz Mở Rộng 9th/11th', parametersJson: { extendedChords: true, optionsCount: 4 } },
            { level: 11, timeLimitSec: 45, targetItemCount: 10, variantCode: 'PROGRESSION_CADENCE', variantName: 'Vòng Hợp Âm Kết Đoạn', parametersJson: { cadenceRecognition: true, optionsCount: 4 } },
            { level: 12, timeLimitSec: 40, targetItemCount: 11, variantCode: 'SPECTRAL_POLYPHONY', variantName: 'Phổ Hòa Âm Tuyệt Đối', parametersJson: { inversions: true, extendedChords: true, optionsCount: 5 } }
        ]
    },
    {
        id: 'ex-timbre-match',
        categoryId: 'cat-6',
        categoryCode: 'AUDITORY_MEMORY',
        categoryName: 'Trí Nhớ Âm Thanh',
        slug: 'timbre-match',
        title: 'Phân Biệt Âm Sắc',
        subtitle: 'Nhận diện dạng sóng dao động, cấu trúc phổ âm và bộ lọc tần số',
        iconName: 'Radio',
        scientificBasis: 'Rèn luyện màng nhĩ và vỏ não phân tích các thành phần bồi âm (harmonics/overtones) và đặc tuyến biên độ ADSR.',
        instructions: 'Lắng nghe âm sắc và chọn đúng dạng sóng (Sine, Triangle, Square, Sawtooth) hoặc bộ lọc tần số tương ứng.',
        rulesSummary: 'Chọn đúng đặc trưng âm sắc trước khi hết giờ. Cấp độ cao có bộ lọc biến đổi tần số cắt và âm thanh đa dao động.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: false,
        levelConfigs: [
            { level: 1, timeLimitSec: 45, targetItemCount: 5, parametersJson: { waveforms: ['sine', 'square'], optionsCount: 2 } },
            { level: 2, timeLimitSec: 45, targetItemCount: 6, parametersJson: { waveforms: ['sine', 'triangle', 'square'], optionsCount: 3 } },
            { level: 3, timeLimitSec: 50, targetItemCount: 6, parametersJson: { waveforms: ['sine', 'triangle', 'sawtooth', 'square'], optionsCount: 4 } },
            { level: 4, timeLimitSec: 50, targetItemCount: 7, parametersJson: { waveforms: ['sine', 'triangle', 'sawtooth', 'square'], pitchVariation: true, optionsCount: 4 } },
            { level: 5, timeLimitSec: 55, targetItemCount: 7, parametersJson: { filterType: 'lowpass', filterCutoffs: [500, 1500, 4000], optionsCount: 3 } },
            { level: 6, timeLimitSec: 55, targetItemCount: 8, parametersJson: { filterTypes: ['lowpass', 'highpass', 'bandpass'], optionsCount: 3 } },
            { level: 7, timeLimitSec: 55, targetItemCount: 8, parametersJson: { adsrProfiles: ['percussive', 'pad', 'pluck', 'organ'], optionsCount: 4 } },
            { level: 8, timeLimitSec: 60, targetItemCount: 9, parametersJson: { detuneAmountCents: [0, 15, 35, 60], optionsCount: 4 } },
            { level: 9, timeLimitSec: 55, targetItemCount: 9, variantCode: 'HARMONIC_ABSENCE', variantName: 'Bồi Âm Bị Khuyết', parametersJson: { missingHarmonic: true, optionsCount: 4 } },
            { level: 10, timeLimitSec: 50, targetItemCount: 10, variantCode: 'FILTER_SWEEP_RESONANCE', variantName: 'Cộng Hưởng Quét Lọc', parametersJson: { filterSweep: true, optionsCount: 4 } },
            { level: 11, timeLimitSec: 45, targetItemCount: 10, variantCode: 'DUAL_OSC_MORPH', variantName: 'Hòa Trộn Song Dao Động', parametersJson: { dualOscillator: true, optionsCount: 4 } },
            { level: 12, timeLimitSec: 40, targetItemCount: 11, variantCode: 'ACOUSTIC_CHAMELEON', variantName: 'Tắc Kè Hoa Âm Sắc', parametersJson: { dualOscillator: true, detune: true, filterCutoffs: true, optionsCount: 4 } }
        ]
    },
    {
        id: 'ex-sound-localization',
        categoryId: 'cat-6',
        categoryCode: 'AUDITORY_MEMORY',
        categoryName: 'Trí Nhớ Âm Thanh',
        slug: 'sound-localization',
        title: 'Định Vị Âm Thanh 3D',
        subtitle: 'Xác định hướng và cự ly nguồn phát âm thanh stereo / binaural',
        iconName: 'Navigation',
        scientificBasis: 'Dựa trên phản xạ tính toán chênh lệch thời gian giữa hai tai (ITD) và chênh lệch âm lượng (ILD) tại nhân trám trên (Superior Olivary Complex).',
        instructions: 'Đeo tai nghe để có trải nghiệm tốt nhất. Lắng nghe và nhấp chọn vị trí âm thanh phát ra trên radar 3D.',
        rulesSummary: 'Chọn đúng góc phương vị (Azimuth) và khoảng cách. Cấp độ cao nguồn âm sẽ di chuyển liên tục hoặc xuất hiện đa nguồn.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: false,
        levelConfigs: [
            { level: 1, timeLimitSec: 45, targetItemCount: 5, parametersJson: { directions: ['left', 'right'], mode: 'pan', optionsCount: 2 } },
            { level: 2, timeLimitSec: 45, targetItemCount: 6, parametersJson: { directions: ['left', 'center', 'right'], mode: 'pan', optionsCount: 3 } },
            { level: 3, timeLimitSec: 50, targetItemCount: 6, parametersJson: { directions: ['far-left', 'mid-left', 'mid-right', 'far-right'], mode: 'pan', optionsCount: 4 } },
            { level: 4, timeLimitSec: 50, targetItemCount: 7, parametersJson: { angles: [0, 90, 180, 270], mode: '3d-azimuth', optionsCount: 4 } },
            { level: 5, timeLimitSec: 55, targetItemCount: 7, parametersJson: { angles: [0, 45, 90, 135, 180, 225, 270, 315], mode: '3d-azimuth', optionsCount: 8 } },
            { level: 6, timeLimitSec: 55, targetItemCount: 8, parametersJson: { angles: [0, 45, 90, 135, 180, 225, 270, 315], distances: ['near', 'far'], optionsCount: 8 } },
            { level: 7, timeLimitSec: 55, targetItemCount: 8, parametersJson: { elevationEnabled: true, angles: 8, optionsCount: 8 } },
            { level: 8, timeLimitSec: 60, targetItemCount: 9, parametersJson: { movingSource: true, trajectory: 'left-to-right', optionsCount: 4 } },
            { level: 9, timeLimitSec: 55, targetItemCount: 9, variantCode: 'MOVING_TRAJECTORY', variantName: 'Quỹ Đạo Bay 3D', parametersJson: { movingSource: true, trajectories: ['circle', 'cross', 'spiral'], optionsCount: 4 } },
            { level: 10, timeLimitSec: 50, targetItemCount: 10, variantCode: 'DOPPLER_SURGE', variantName: 'Hiệu Ứng Doppler Cận Âm', parametersJson: { dopplerEffect: true, optionsCount: 4 } },
            { level: 11, timeLimitSec: 45, targetItemCount: 10, variantCode: 'DUAL_SOURCE_SEPARATION', variantName: 'Phân Tách Song Nguồn', parametersJson: { dualSource: true, optionsCount: 6 } },
            { level: 12, timeLimitSec: 40, targetItemCount: 11, variantCode: 'SPATIAL_ACOUSTIC_RADAR', variantName: 'Radar Thính Giác Toàn Cảnh', parametersJson: { elevationEnabled: true, continuousAngles: true, optionsCount: 8 } }
        ]
    },
    {
        id: 'ex-voice-track',
        categoryId: 'cat-6',
        categoryCode: 'AUDITORY_MEMORY',
        categoryName: 'Trí Nhớ Âm Thanh',
        slug: 'voice-track',
        title: 'Theo Dõi Bè Đa Thanh',
        subtitle: 'Phân tách dòng thính giác (Bregman Auditory Streaming), theo dõi bè đích giữa nhiều bè đối âm',
        iconName: 'GitFork',
        scientificBasis: 'Kích hoạt vùng vỏ não thính giác thùy thái dương và thùy đỉnh trong việc phân rã quang cảnh âm thanh (Auditory Scene Analysis) và duy trì sự chú ý chọn lọc (Selective Attention).',
        instructions: 'Lắng nghe các bè âm thanh vang lên cùng lúc. Tập trung chú ý vào bè mục tiêu (Bè Cao, Bè Trầm hoặc Bè Giữa) theo gợi ý và xác định hướng di chuyển hoặc điểm đột biến của bè đích.',
        rulesSummary: 'Theo dõi chính xác bè đích mà không bị các bè đệm làm xao nhãng. Cấp độ cao tăng số lượng bè lên 3-4 bè, khoảng cách cao độ thu hẹp và xuất hiện chuyển đổi mục tiêu đột ngột.',
        maxDifficultyLevel: 12,
        defaultDurationSec: 60,
        isFeatured: true,
        levelConfigs: [
            { level: 1, timeLimitSec: 45, targetItemCount: 4, parametersJson: { voicesCount: 2, targetVoice: 'soprano', registerSplit: 'wide', optionsCount: 3 } },
            { level: 2, timeLimitSec: 45, targetItemCount: 4, parametersJson: { voicesCount: 2, targetVoice: 'bass', registerSplit: 'wide', optionsCount: 3 } },
            { level: 3, timeLimitSec: 50, targetItemCount: 5, parametersJson: { voicesCount: 2, targetVoice: 'random', registerSplit: 'medium', optionsCount: 3 } },
            { level: 4, timeLimitSec: 50, targetItemCount: 5, parametersJson: { voicesCount: 2, targetVoice: 'random', taskType: 'oddball', registerSplit: 'medium', optionsCount: 4 } },
            { level: 5, timeLimitSec: 55, targetItemCount: 6, parametersJson: { voicesCount: 2, targetVoice: 'random', registerSplit: 'close', sameTimbre: true, optionsCount: 4 } },
            { level: 6, timeLimitSec: 55, targetItemCount: 6, variantCode: 'VOICE_ATTENTION_SWITCH', variantName: 'Chuyển Đổi Trọng Tâm Bè', parametersJson: { voicesCount: 2, attentionSwitch: true, optionsCount: 4 } },
            { level: 7, timeLimitSec: 55, targetItemCount: 6, parametersJson: { voicesCount: 3, targetVoice: 'soprano', optionsCount: 4 } },
            { level: 8, timeLimitSec: 60, targetItemCount: 7, parametersJson: { voicesCount: 3, targetVoice: 'alto', optionsCount: 4 } },
            { level: 9, timeLimitSec: 55, targetItemCount: 7, variantCode: 'CONTRAPUNTAL_CROSSING', variantName: 'Giao Thoa Bè Đối Âm', parametersJson: { voicesCount: 3, voiceCrossing: true, optionsCount: 4 } },
            { level: 10, timeLimitSec: 50, targetItemCount: 8, variantCode: 'RAPID_STREAM_ISOLATION', variantName: 'Tách Dòng Siêu Tốc', parametersJson: { voicesCount: 3, tempoBpm: 130, optionsCount: 4 } },
            { level: 11, timeLimitSec: 45, targetItemCount: 8, variantCode: 'DYNAMIC_MASKING', variantName: 'Mặt Nạ Nhiễu Âm Động', parametersJson: { voicesCount: 3, dynamicMasking: true, optionsCount: 5 } },
            { level: 12, timeLimitSec: 40, targetItemCount: 9, variantCode: 'POLYPHONIC_MAESTRO', variantName: 'Bậc Thầy Đa Thanh Trọn Vẹn', parametersJson: { voicesCount: 4, fullPolyphony: true, optionsCount: 5 } }
        ]
    }
];
exports.EXERCISES_METADATA.forEach(ex => {
    const infConfigs = infinityConfigs_1.INFINITY_LEVEL_CONFIGS[ex.slug];
    if (infConfigs && infConfigs.length > 0) {
        ex.maxDifficultyLevel = 22;
        const existingLevels = new Set(ex.levelConfigs.map(c => c.level));
        infConfigs.forEach(cfg => {
            if (!existingLevels.has(cfg.level)) {
                ex.levelConfigs.push(cfg);
            }
        });
    }
});
exports.WORKOUT_ROUTINES = [
    {
        id: 'routine-quick',
        code: 'QUICK_5M',
        title: 'Nhanh',
        durationMinutes: 5,
        starRating: 1,
        description: 'Khởi động não bộ buổi sáng với 3 bài tập cơ bản: Bảng Schulte, Nhớ Số và Chẵn/Lẻ.',
        isDefault: true,
        items: [
            { exerciseId: 'ex-schulte-table', exerciseSlug: 'schulte-table', exerciseTitle: 'Bảng Schulte', orderIndex: 1, recommendedDurationSec: 60 },
            { exerciseId: 'ex-digit-span', exerciseSlug: 'digit-span', exerciseTitle: 'Nhớ Số', orderIndex: 2, recommendedDurationSec: 60 },
            { exerciseId: 'ex-even-odd', exerciseSlug: 'even-odd', exerciseTitle: 'Chẵn/Lẻ', orderIndex: 3, recommendedDurationSec: 60 }
        ]
    },
    {
        id: 'routine-regular',
        code: 'REGULAR_10M',
        title: 'Theo dõi / Định kỳ',
        durationMinutes: 10,
        starRating: 2,
        description: 'Chương trình rèn luyện cân bằng giữa mở rộng thị giác ngoại biên và phản xạ ngôn ngữ.',
        isDefault: false,
        items: [
            { exerciseId: 'ex-schulte-table', exerciseSlug: 'schulte-table', exerciseTitle: 'Bảng Schulte', orderIndex: 1, recommendedDurationSec: 60 },
            { exerciseId: 'ex-find-letter', exerciseSlug: 'find-letter', exerciseTitle: 'Tìm chữ', orderIndex: 2, recommendedDurationSec: 60 },
            { exerciseId: 'ex-anagram', exerciseSlug: 'anagram', exerciseTitle: 'Đảo ngữ', orderIndex: 3, recommendedDurationSec: 60 },
            { exerciseId: 'ex-peripheral-vision', exerciseSlug: 'peripheral-vision', exerciseTitle: 'Tầm Nhìn', orderIndex: 4, recommendedDurationSec: 60 },
            { exerciseId: 'ex-rsvp-speed-reader', exerciseSlug: 'rsvp-speed-reader', exerciseTitle: 'Chữ Chạy', orderIndex: 5, recommendedDurationSec: 90 }
        ]
    },
    {
        id: 'routine-optimal',
        code: 'OPTIMAL_30M',
        title: 'Tối ưu',
        durationMinutes: 30,
        starRating: 3,
        description: 'Giáo trình toàn diện 30 phút phát triển đồng thời cả 5 kỹ năng nhận thức và tốc độ đọc.',
        isDefault: false,
        items: [
            { exerciseId: 'ex-schulte-table', exerciseSlug: 'schulte-table', exerciseTitle: 'Bảng Schulte', orderIndex: 1, recommendedDurationSec: 60 },
            { exerciseId: 'ex-find-number', exerciseSlug: 'find-number', exerciseTitle: 'Tìm Số', orderIndex: 2, recommendedDurationSec: 60 },
            { exerciseId: 'ex-digit-span', exerciseSlug: 'digit-span', exerciseTitle: 'Nhớ Số', orderIndex: 3, recommendedDurationSec: 60 },
            { exerciseId: 'ex-word-search', exerciseSlug: 'word-search', exerciseTitle: 'Tìm Từ', orderIndex: 4, recommendedDurationSec: 90 },
            { exerciseId: 'ex-green-dot', exerciseSlug: 'green-dot', exerciseTitle: 'Điểm xanh', orderIndex: 5, recommendedDurationSec: 60 },
            { exerciseId: 'ex-word-chunking', exerciseSlug: 'word-chunking', exerciseTitle: 'Chuỗi từ', orderIndex: 6, recommendedDurationSec: 90 },
            { exerciseId: 'ex-reading-assessment', exerciseSlug: 'reading-assessment', exerciseTitle: 'Đánh giá tốc độ đọc', orderIndex: 7, recommendedDurationSec: 180 }
        ]
    },
    {
        id: 'routine-intensive',
        code: 'INTENSIVE_60M',
        title: 'Cường độ',
        durationMinutes: 60,
        starRating: 4,
        description: 'Chế độ luyện tập nâng cao dành cho những ai muốn bứt phá giới hạn đọc sách và đạt trên 1000 WPM.',
        isDefault: false,
        items: [
            { exerciseId: 'ex-schulte-table', exerciseSlug: 'schulte-table', exerciseTitle: 'Bảng Schulte', orderIndex: 1, recommendedDurationSec: 90 },
            { exerciseId: 'ex-peripheral-vision', exerciseSlug: 'peripheral-vision', exerciseTitle: 'Tầm Nhìn', orderIndex: 2, recommendedDurationSec: 90 },
            { exerciseId: 'ex-twin-words', exerciseSlug: 'twin-words', exerciseTitle: 'Từ Sinh đôi', orderIndex: 3, recommendedDurationSec: 60 },
            { exerciseId: 'ex-anagram', exerciseSlug: 'anagram', exerciseTitle: 'Đảo ngữ', orderIndex: 4, recommendedDurationSec: 60 },
            { exerciseId: 'ex-word-search', exerciseSlug: 'word-search', exerciseTitle: 'Tìm Từ', orderIndex: 5, recommendedDurationSec: 90 },
            { exerciseId: 'ex-even-odd', exerciseSlug: 'even-odd', exerciseTitle: 'Chẵn/Lẻ', orderIndex: 6, recommendedDurationSec: 60 },
            { exerciseId: 'ex-digit-span', exerciseSlug: 'digit-span', exerciseTitle: 'Nhớ Số', orderIndex: 7, recommendedDurationSec: 60 },
            { exerciseId: 'ex-reading-pacer', exerciseSlug: 'reading-pacer', exerciseTitle: 'Tăng tốc độ đọc', orderIndex: 8, recommendedDurationSec: 120 },
            { exerciseId: 'ex-text-scanning', exerciseSlug: 'text-scanning', exerciseTitle: 'Tìm trong văn bản', orderIndex: 9, recommendedDurationSec: 90 },
            { exerciseId: 'ex-reading-assessment', exerciseSlug: 'reading-assessment', exerciseTitle: 'Đánh giá tốc độ đọc', orderIndex: 10, recommendedDurationSec: 240 }
        ]
    }
];
exports.SAMPLE_READING_TEXTS = [
    {
        id: 'text-1',
        title: 'Cơ Chế Thần Kinh Của Việc Đọc Nhanh (Neuroplasticity in Speed Reading)',
        category: 'Khoa Học Não Bộ',
        wordCount: 320,
        difficultyLevel: 1,
        previewExcerpt: 'Bộ não con người sở hữu khả năng thích ứng dẻo dai tuyệt vời gọi là Neuroplasticity...',
        author: 'TS. Nguyễn Hoàng Anh',
        content: `Bộ não con người sở hữu khả năng thích ứng dẻo dai tuyệt vời gọi là Neuroplasticity (tính dẻo thần kinh). Khi đọc thông thường, hầu hết mọi người đọc với tốc độ khoảng 150 đến 250 từ mỗi phút (WPM), xấp xỉ với tốc độ nói chuyện hàng ngày. Hiện tượng này xảy ra do thói quen "đọc thầm" (Subvocalization) — nghĩa là trong tâm trí chúng ta phát âm thầm từng âm thanh của từng chữ cái trước khi tiếp nhận ý nghĩa.

Tuy nhiên, mắt người và võng mạc có thể chụp lại hình ảnh của cả một cụm từ chỉ trong khoảng 10 đến 20 mili giây. Khi loại bỏ được việc phát âm thầm, não bộ có khả năng chuyển thẳng từ tín hiệu thị giác sang nhận thức ý niệm (Direct Concept Acquisition). Quá trình này giúp tăng tốc độ đọc lên từ 500 đến 1000 WPM mà không hề suy giảm mức độ thấu hiểu nội dung.

Để đạt được trạng thái này, chúng ta cần rèn luyện hai kỹ năng nền tảng: thứ nhất là mở rộng thị giác ngoại vi bằng Bảng Schulte để mắt bao quát được nhiều từ trong một lần dừng mắt (Fixation); thứ hai là giảm số lần nhảy mắt giật lùi (Regression) bằng các phương pháp định nhịp như RSVP hoặc que chỉ dẫn. Việc rèn luyện đều đặn 15 phút mỗi ngày sẽ tái cấu trúc các liên kết synap thần kinh ở vỏ não thị giác, biến kỹ năng đọc nhanh thành phản xạ tự nhiên suốt đời.`,
        questions: [
            {
                id: 'q1-1',
                questionOrder: 1,
                questionText: 'Tốc độ đọc trung bình của hầu hết mọi người khi chưa rèn luyện là bao nhiêu?',
                optionA: '50 - 100 WPM',
                optionB: '150 - 250 WPM',
                optionC: '500 - 800 WPM',
                optionD: '1000+ WPM',
                correctOption: 'B',
                explanation: 'Bài viết chỉ ra: "hầu hết mọi người đọc với tốc độ khoảng 150 đến 250 từ mỗi phút (WPM)".'
            },
            {
                id: 'q1-2',
                questionOrder: 2,
                questionText: 'Thuật ngữ nào mô tả thói quen phát âm thầm từng chữ trong đầu khi đọc?',
                optionA: 'Neuroplasticity',
                optionB: 'Saccadic movement',
                optionC: 'Subvocalization',
                optionD: 'Fixation chunking',
                correctOption: 'C',
                explanation: 'Bài viết nêu rõ: thói quen "đọc thầm" (Subvocalization).'
            },
            {
                id: 'q1-3',
                questionOrder: 3,
                questionText: 'Công cụ nào được nêu trong bài để mở rộng thị giác ngoại vi?',
                optionA: 'Bảng Schulte',
                optionB: 'Kính thực tế ảo',
                optionC: 'Máy đo thính lực',
                optionD: 'Đồng hồ quả lắc',
                correctOption: 'A',
                explanation: 'Bài viết đề cập: "mở rộng thị giác ngoại vi bằng Bảng Schulte".'
            },
            {
                id: 'q1-4',
                questionOrder: 4,
                questionText: 'Mỗi ngày nên rèn luyện bao nhiêu phút để tái cấu trúc liên kết thần kinh?',
                optionA: '5 phút',
                optionB: '15 phút',
                optionC: '60 phút',
                optionD: '120 phút',
                correctOption: 'B',
                explanation: 'Bài viết kết luận: "Việc rèn luyện đều đặn 15 phút mỗi ngày sẽ tái cấu trúc các liên kết synap thần kinh".'
            }
        ]
    },
    {
        id: 'text-2',
        title: 'Trí Tuệ Nhân Tạo & Bước Nhảy Vọt Của Tư Duy Con Người',
        category: 'Công Nghệ Tương Lai',
        wordCount: 345,
        difficultyLevel: 2,
        previewExcerpt: 'Sự trỗi dậy của các mô hình ngôn ngữ lớn đang định hình lại phương thức tiếp nhận tri thức...',
        author: 'TS. Lê Quang Minh',
        content: `Sự bùng nổ của trí tuệ nhân tạo (AI) và các mạng nơ-ron học sâu (Deep Learning) trong thế kỷ 21 đang đặt ra câu hỏi lớn về vai trò của tư duy con người. Trong khi máy tính có thể tổng hợp hàng triệu trang tài liệu chỉ trong vài giây, giá trị độc bản của trí não con người lại nằm ở khả năng tư duy phản biện, liên tưởng sáng tạo đa chiều và trực giác cảm xúc.

Để cộng tác hiệu quả với AI, con người cần nâng cấp "băng thông tiếp nhận thông tin" (Cognitive Bandwidth). Nếu một cá nhân chỉ đọc được 200 từ mỗi phút, họ sẽ nhanh chóng bị quá tải trước biển dữ liệu khổng lồ. Ngược lại, một người làm chủ kỹ năng đọc lướt định hướng (Scanning) và đọc sâu chớp nhoáng (Syntopical Reading) có thể lọc ra các mẫu hình ý tưởng then chốt để đặt câu hỏi gợi mở cho các hệ thống AI.

Các nhà khoa học nhận thức tại Đại học Stanford chỉ ra rằng, não bộ hoạt động như một cỗ máy dự đoán xác suất (Predictive Processing Engine). Khi chúng ta đọc nhanh một văn bản chuyên môn, não không cần phân tích từng âm vị mà liên tục dự báo các từ tiếp theo dựa trên lược đồ ngữ cảnh có sẵn. Rèn luyện tốc độ đọc và khả năng chú ý chọn lọc chính là phương pháp tối ưu hóa bộ xử lý sinh học kỳ diệu bên trong mỗi chúng ta.`,
        questions: [
            {
                id: 'q2-1',
                questionOrder: 1,
                questionText: 'Theo tác giả, giá trị độc bản cốt lõi của não bộ con người so với AI là gì?',
                optionA: 'Khả năng tính toán số học nhanh hơn máy tính',
                optionB: 'Tư duy phản biện, liên tưởng sáng tạo đa chiều và trực giác',
                optionC: 'Dung lượng lưu trữ dữ liệu vĩnh cửu không lỗi',
                optionD: 'Tốc độ sao chép văn bản tự động hàng loạt',
                correctOption: 'B',
                explanation: 'Bài viết khẳng định giá trị con người nằm ở "tư duy phản biện, liên tưởng sáng tạo đa chiều và trực giác cảm xúc".'
            },
            {
                id: 'q2-2',
                questionOrder: 2,
                questionText: 'Tại sao con người cần nâng cao "băng thông tiếp nhận thông tin"?',
                optionA: 'Để tránh bị quá tải trước biển dữ liệu và cộng tác hiệu quả với AI',
                optionB: 'Để thay thế hoàn toàn máy tính trong tương lai',
                optionC: 'Để không cần phải đi học trường lớp nữa',
                optionD: 'Để tăng dung lượng bộ nhớ RAM máy tính',
                correctOption: 'A',
                explanation: 'Tác giả chỉ ra: nếu đọc chậm sẽ bị quá tải trước dữ liệu, nâng băng thông giúp lọc mẫu hình ý tưởng hiệu quả.'
            },
            {
                id: 'q2-3',
                questionOrder: 3,
                questionText: 'Mô hình hoạt động của não bộ được các nhà khoa học Stanford mô tả như thế nào?',
                optionA: 'Cỗ máy ghi âm thụ động từng từ',
                optionB: 'Cỗ máy dự đoán xác suất (Predictive Processing Engine)',
                optionC: 'Mạng lưới dây đồng truyền tải điện thế cố định',
                optionD: 'Chiếc máy ảnh cơ học truyền thống',
                correctOption: 'B',
                explanation: 'Văn bản nêu: "não bộ hoạt động như một cỗ máy dự đoán xác suất (Predictive Processing Engine)".'
            },
            {
                id: 'q2-4',
                questionOrder: 4,
                questionText: 'Kỹ năng nào giúp con người lọc các ý tưởng then chốt trong văn bản?',
                optionA: 'Đọc to từng chữ một theo thứ tự',
                optionB: 'Quét định hướng (Scanning) và đọc sâu chớp nhoáng',
                optionC: 'Dừng mắt thật lâu tại từng dấu câu',
                optionD: 'Chép phạt nhiều lần bằng tay',
                correctOption: 'B',
                explanation: 'Bài viết nêu rõ: "kỹ năng đọc lướt định hướng (Scanning) và đọc sâu chớp nhoáng (Syntopical Reading)".'
            }
        ]
    },
    {
        id: 'text-3',
        title: 'Bí Ẩn Của Giấc Ngủ Sâu & Quá Trình Củng Cố Ký Ức Não Bộ',
        category: 'Y Học Thần Kinh',
        wordCount: 350,
        difficultyLevel: 3,
        previewExcerpt: 'Trong khi cơ thể nghỉ ngơi, hệ thống Glymphatic trong não bộ kích hoạt chế độ tự làm sạch...',
        author: 'BS. Trần Bảo Ngọc',
        content: `Nhiều người lầm tưởng rằng giấc ngủ là trạng thái thụ động và lãng phí thời gian. Trên thực tế, giấc ngủ sâu (Slow-Wave Sleep) và giai đoạn chuyển động mắt nhanh (REM) là khoảng thời gian bận rộn nhất của các trung tâm tái thiết thần kinh.

Trong giấc ngủ sóng chậm, hệ thống Glymphatic mở rộng gấp đôi kích thước để bơm dòng dịch não tủy rửa trôi các chất cặn bã chuyển hóa độc hại tích tụ suốt cả ngày, đặc biệt là protein Beta-Amyloid — tác nhân chính gây ra hội chứng suy giảm trí nhớ Alzheimer. Thiếu ngủ kéo dài làm tắc nghẽn quá trình thanh lọc này, dẫn đến suy giảm khả năng tập trung và tốc độ xử lý thị giác.

Quan trọng hơn, đây là lúc hồi hải mã (Hippocampus) chuyển giao các thông tin ngắn hạn vừa học trong ngày sang vùng vỏ não mới (Neocortex) để lưu trữ vĩnh viễn dưới dạng ký ức dài hạn. Quá trình này được gọi là củng cố trí nhớ (Memory Consolidation). Những người tập luyện đọc nhanh hoặc học ngoại ngữ nếu ngủ đủ từ 7 đến 8 tiếng mỗi đêm sẽ ghi nhớ lượng kiến thức cao hơn 40% so với người thức khuya nhồi nhét. Giấc ngủ chất lượng chính là chìa khóa vàng cho bộ não sắc bén.`,
        questions: [
            {
                id: 'q3-1',
                questionOrder: 1,
                questionText: 'Hệ thống nào trong não chịu trách nhiệm thanh lọc độc chất trong giấc ngủ sâu?',
                optionA: 'Hệ thống Glymphatic',
                optionB: 'Hệ thống Limbic',
                optionC: 'Tuyến giáp',
                optionD: 'Tủy sống',
                correctOption: 'A',
                explanation: 'Bài viết chỉ rõ: "hệ thống Glymphatic mở rộng gấp đôi kích thước để bơm dòng dịch não tủy rửa trôi các chất cặn bã".'
            },
            {
                id: 'q3-2',
                questionOrder: 2,
                questionText: 'Loại protein độc hại nào tích tụ khi thiếu ngủ có liên quan đến bệnh Alzheimer?',
                optionA: 'Collagen',
                optionB: 'Beta-Amyloid',
                optionC: 'Insulin',
                optionD: 'Hemoglobin',
                correctOption: 'B',
                explanation: 'Văn bản đề cập: "chất cặn bã chuyển hóa độc hại... đặc biệt là protein Beta-Amyloid".'
            },
            {
                id: 'q3-3',
                questionOrder: 3,
                questionText: 'Vùng não nào thực hiện chuyển giao thông tin ngắn hạn sang ký ức dài hạn?',
                optionA: 'Tiểu não',
                optionB: 'Hồi hải mã (Hippocampus)',
                optionC: 'Cầu não',
                optionD: 'Thùy chẩm',
                correctOption: 'B',
                explanation: 'Đoạn văn nêu: "hồi hải mã (Hippocampus) chuyển giao các thông tin ngắn hạn vừa học sang vỏ não mới".'
            },
            {
                id: 'q3-4',
                questionOrder: 4,
                questionText: 'Ngủ đủ 7-8 tiếng giúp tăng khả năng ghi nhớ lượng kiến thức lên bao nhiêu %?',
                optionA: '10%',
                optionB: '25%',
                optionC: '40%',
                optionD: '80%',
                correctOption: 'C',
                explanation: 'Bài viết nêu: "ngủ đủ từ 7 đến 8 tiếng mỗi đêm sẽ ghi nhớ lượng kiến thức cao hơn 40% so với người thức khuya".'
            }
        ]
    },
    {
        id: 'text-4',
        title: 'Nghệ Thuật Xây Dựng Cung Điện Tâm Trí (Method of Loci)',
        category: 'Kỹ Năng Trí Não',
        wordCount: 360,
        difficultyLevel: 4,
        previewExcerpt: 'Phương pháp Cung điện Trí nhớ của các nhà hùng biện La Mã cổ đại vẫn là đỉnh cao...',
        author: 'Chuyên gia Trí nhớ Vũ Đăng Khoa',
        content: `Từ thời Hy Lạp và La Mã cổ đại, khi giấy viết còn là một món hàng xa xỉ và máy ghi âm chưa xuất hiện, các nhà hùng biện nổi tiếng như Cicero hay Simonides xứ Ceos đã có thể ghi nhớ hàng giờ bài diễn thuyết mà không cần nhìn tài liệu. Bí quyết của họ chính là "Phương pháp Loci" (Method of Loci), ngày nay được biết đến với tên gọi Cung điện Tâm trí (Mind Palace).

Nguyên lý cốt lõi của Cung điện Tâm trí dựa trên hai năng lực tiến hóa mạnh mẽ nhất của loài người: Trí nhớ không gian (Spatial Memory) và Trí tưởng tượng hình ảnh sống động (Visual Association). Não người vốn khó nhớ các con số trừu tượng hoặc từ ngữ khô khan, nhưng lại ghi nhớ cực kỳ chuẩn xác cấu trúc của ngôi nhà, con đường quen thuộc hoặc các hình ảnh kỳ quặc, hài hước và giàu màu sắc.

Để xây dựng một Cung điện Tâm trí, bạn chọn một không gian thực tế quen thuộc như căn phòng ngủ, ngôi nhà thời thơ ấu hoặc trường học. Tiếp theo, mã hóa từng mục kiến thức cần nhớ thành một bức tranh thị giác kỳ lạ và đặt chúng tại các "điểm neo" cố định (Loci) như cửa ra vào, bàn học, góc gương hay tủ sách. Khi muốn gợi lại thông tin, bạn chỉ cần thực hiện một chuyến bách bộ trong tâm tưởng qua các điểm neo đó.`,
        questions: [
            {
                id: 'q4-1',
                questionOrder: 1,
                questionText: 'Phương pháp Cung điện Tâm trí (Method of Loci) có nguồn gốc từ nền văn minh nào?',
                optionA: 'Ai Cập và Lưỡng Hà cổ đại',
                optionB: 'Hy Lạp và La Mã cổ đại',
                optionC: 'Văn minh Maya cổ xưa',
                optionD: 'Thời kỳ Phục Hưng ở Anh',
                correctOption: 'B',
                explanation: 'Bài viết ghi nhận: "Từ thời Hy Lạp và La Mã cổ đại... các nhà hùng biện nổi tiếng như Cicero".'
            },
            {
                id: 'q4-2',
                questionOrder: 2,
                questionText: 'Cung điện Tâm trí tận dụng hai năng lực tiến hóa mạnh nhất nào của não người?',
                optionA: 'Thính giác và vị giác',
                optionB: 'Trí nhớ không gian và Trí tưởng tượng hình ảnh sống động',
                optionC: 'Khả năng tính nhẩm ma trận và ghi nhớ chuỗi bit',
                optionD: 'Phản xạ né tránh cơ bắp',
                correctOption: 'B',
                explanation: 'Nguyên lý dựa trên: "Trí nhớ không gian (Spatial Memory) và Trí tưởng tượng hình ảnh sống động (Visual Association)".'
            },
            {
                id: 'q4-3',
                questionOrder: 3,
                questionText: 'Trong kỹ thuật này, các vật thể trong nhà như bàn học, tủ gương được gọi là gì?',
                optionA: 'Mã số bí mật',
                optionB: 'Điểm neo (Loci)',
                optionC: 'Bộ cảm biến thần kinh',
                optionD: 'Vách ngăn tâm trí',
                correctOption: 'B',
                explanation: 'Bài viết mô tả: đặt chúng tại các "điểm neo" cố định (Loci) như cửa ra vào, bàn học...'
            },
            {
                id: 'q4-4',
                questionOrder: 4,
                questionText: 'Cách tốt nhất để hồi tưởng lại thông tin đã lưu trong cung điện là gì?',
                optionA: 'Bách bộ trong tâm tưởng qua lần lượt từng điểm neo',
                optionB: 'Nghe lại đoạn ghi âm lời thoại',
                optionC: 'Viết đi viết lại 100 lần từ khóa',
                optionD: 'Uống nhiều nước tăng lực',
                correctOption: 'A',
                explanation: 'Kết bài chỉ rõ: "bạn chỉ cần thực hiện một chuyến bách bộ trong tâm tưởng qua các điểm neo đó".'
            }
        ]
    },
    {
        id: 'text-5',
        title: 'Tiến Hóa Thị Giác & Sức Mạnh Của Tầm Nhìn Toàn Cảnh',
        category: 'Sinh Học Tiến Hóa',
        wordCount: 335,
        difficultyLevel: 5,
        previewExcerpt: 'Tổ tiên loài người sống sót trong hoang dã nhờ khả năng phát hiện chuyển động ngoại vi...',
        author: 'TS. Phạm Thanh Sơn',
        content: `Hàng triệu năm tiến hóa trên các thảo nguyên savan châu Phi đã định hình hệ thống thị giác của tổ tiên loài người. Để tồn tại giữa thú săn mồi và kẻ thù, mắt người phát triển cơ chế hai tầng: vùng thị giác trung tâm (Foveal Vision) sắc nét dùng để quan sát chi tiết công cụ, và vùng thị giác ngoại vi (Peripheral Vision) cực nhạy với ánh sáng và chuyển động dùng để cảnh giới môi trường bao quanh.

Trong xã hội hiện đại, thói quen nhìn chằm chằm vào màn hình điện thoại khổ nhỏ đang làm suy giảm chức năng của vùng ngoại vi, biến góc nhìn của con người thành "tầm nhìn đường hầm" (Tunnel Vision). Điều này không chỉ gây mỏi cơ mắt mạn tính mà còn khiến tốc độ đọc sách bị kìm hãm nghiêm trọng, do người đọc chỉ thu nhận được từng từ đơn độc ở tâm mắt.

Khi bạn luyện tập mở rộng tầm nhìn ngoại biên thông qua các bài tập như Bảng Schulte hoặc bài tập Điểm Xanh, các tế bào que ở biên võng mạc được kích hoạt trở lại. Lúc này, mắt bạn không cần di chuyển qua lại liên tục mà có thể thu trọn cả một dòng hoặc thậm chí một khối văn bản chỉ trong một cái liếc nhìn (Single Fixation). Đó chính là chìa khóa khai phá tốc độ đọc thần tốc của các bậc thầy thế giới.`,
        questions: [
            {
                id: 'q5-1',
                questionOrder: 1,
                questionText: 'Hệ thống thị giác hai tầng của mắt người gồm những vùng nào?',
                optionA: 'Thị giác ban ngày và thị giác hồng ngoại',
                optionB: 'Thị giác trung tâm (Foveal) và thị giác ngoại vi (Peripheral)',
                optionC: 'Thị giác góc trên và thị giác góc dưới',
                optionD: 'Thị giác đơn sắc và thị giác đa chiều',
                correctOption: 'B',
                explanation: 'Bài viết nêu: "vùng thị giác trung tâm (Foveal Vision)... và vùng thị giác ngoại vi (Peripheral Vision)".'
            },
            {
                id: 'q5-2',
                questionOrder: 2,
                questionText: 'Thói quen nhìn màn hình nhỏ kéo dài dẫn đến hiện tượng gì?',
                optionA: 'Tầm nhìn đường hầm (Tunnel Vision)',
                optionB: 'Mắt lồi vĩnh viễn',
                optionC: 'Tăng góc nhìn ngoại vi lên 180 độ',
                optionD: 'Mắt nhìn xuyên vật thể',
                correctOption: 'A',
                explanation: 'Tác giả chỉ ra hệ quả là biến góc nhìn của con người thành "tầm nhìn đường hầm" (Tunnel Vision).'
            },
            {
                id: 'q5-3',
                questionOrder: 3,
                questionText: 'Loại tế bào nào ở rìa võng mạc chịu trách nhiệm thu nhận tín hiệu vùng ngoại biên?',
                optionA: 'Tế bào nón (Cones)',
                optionB: 'Tế bào que (Rods)',
                optionC: 'Tế bào biểu mô',
                optionD: 'Tế bào sợi thần kinh thính giác',
                correctOption: 'B',
                explanation: 'Văn bản viết: "các tế bào que ở biên võng mạc được kích hoạt trở lại".'
            },
            {
                id: 'q5-4',
                questionOrder: 4,
                questionText: 'Lợi ích lớn nhất của việc kích hoạt tầm nhìn ngoại vi đối với việc đọc là gì?',
                optionA: 'Thu trọn cả một dòng hoặc khối văn bản chỉ trong một lần dừng mắt (Fixation)',
                optionB: 'Có thể đọc sách trong bóng tối tuyệt đối không cần đèn',
                optionC: 'Không bao giờ cần chớp mắt nữa',
                optionD: 'Nhìn thấy các bước sóng tử ngoại',
                correctOption: 'A',
                explanation: 'Bài viết kết luận: "có thể thu trọn cả một dòng hoặc thậm chí một khối văn bản chỉ trong một cái liếc nhìn (Single Fixation)".'
            }
        ]
    },
    {
        id: 'text-6',
        title: 'Kính Viễn Vọng Không Gian James Webb & Bình Minh Vũ Trụ',
        category: 'Thiên Văn & Vũ Trụ',
        wordCount: 310,
        difficultyLevel: 3,
        previewExcerpt: 'Được phóng vào không gian cuối năm 2021, kính James Webb mở ra cánh cửa nhìn về quá khứ...',
        author: 'TS. Vũ Trọng Khôi',
        content: `Được phóng vào không gian vào cuối năm 2021, kính viễn vọng không gian James Webb (JWST) là công trình khoa học kỳ vĩ nhất của nhân loại trong lĩnh vực thiên văn học hiện đại. Hoạt động tại điểm Lagrange L2 cách Trái Đất 1,5 triệu kilomet, tấm gương mạ vàng khổng lồ đường kính 6,5 mét của Webb có khả năng thu nhận những hạt photon hồng ngoại yếu ớt nhất phát ra từ thuở bình minh của vũ trụ.

Vì ánh sáng di chuyển với vận tốc hữu hạn, khi nhìn càng xa vào không gian, chúng ta thực chất đang nhìn ngược về quá khứ hàng tỷ năm trước. Kính James Webb đã chụp được những thiên hà cổ xưa hình thành chỉ 300 triệu năm sau vụ nổ Big Bang, thách thức các mô hình vũ trụ học truyền thống về tốc độ tiến hóa của các vì sao đầu tiên.

Ngoài việc khám phá nguồn gốc vũ trụ, James Webb còn phân tích thành phần khí quyển của các ngoại hành tinh quay quanh các ngôi sao xa xôi. Bằng phương pháp quang phổ truyền qua, các nhà khoa học đã tìm thấy dấu vết của hơi nước, carbon dioxide và methane, mở ra hy vọng tìm kiếm các dấu hiệu sinh học ngoài Trái Đất trong thế kỷ này.`,
        questions: [
            {
                id: 'q6-1',
                questionOrder: 1,
                questionText: 'Kính viễn vọng James Webb hoạt động tại vị trí nào trong không gian?',
                optionA: 'Quỹ đạo thấp quanh Trái Đất',
                optionB: 'Bề mặt Mặt Trăng',
                optionC: 'Điểm Lagrange L2 cách Trái Đất 1,5 triệu km',
                optionD: 'Quỹ đạo quanh Sao Hỏa',
                correctOption: 'C',
                explanation: 'Bài viết chỉ rõ: "Hoạt động tại điểm Lagrange L2 cách Trái Đất 1,5 triệu kilomet".'
            },
            {
                id: 'q6-2',
                questionOrder: 2,
                questionText: 'Loại ánh sáng chủ yếu mà kính James Webb thu nhận là gì?',
                optionA: 'Tia X',
                optionB: 'Hồng ngoại (Infrared)',
                optionC: 'Tử ngoại (UV)',
                optionD: 'Sóng vô tuyến',
                correctOption: 'B',
                explanation: 'Văn bản nêu: "khả năng thu nhận những hạt photon hồng ngoại yếu ớt nhất".'
            }
        ]
    },
    {
        id: 'text-7',
        title: 'Tư Duy Nhanh & Chậm: Hai Hệ Thống Phán Đoán Của Não Bộ',
        category: 'Tâm Lý Học Nhận Thức',
        wordCount: 325,
        difficultyLevel: 4,
        previewExcerpt: 'Nhà tâm lý học đoạt giải Nobel Daniel Kahneman đã chứng minh não người vận hành qua hai hệ thống...',
        author: 'Daniel Kahneman & PGS. Lê Thảo Trang',
        content: `Trong công trình nghiên cứu kinh điển về kinh tế học hành vi và tâm lý học nhận thức, nhà khoa học đoạt giải Nobel Daniel Kahneman đã chứng minh rằng tâm trí con người được vận hành bởi hai phương thức tư duy riêng biệt: Hệ thống 1 (Nhanh) và Hệ thống 2 (Chậm).

Hệ thống 1 hoạt động hoàn toàn tự động, tức thì, tốn rất ít năng lượng và không cần sự nỗ lực chú ý có ý thức. Đây là hệ thống giúp bạn nhận ra biểu cảm tức giận trên khuôn mặt một người, né tránh một chướng ngại vật bất ngờ khi lái xe, hoặc đọc các biển hiệu quen thuộc trên đường. Tuy nhiên, Hệ thống 1 thường xuyên mắc phải các định kiến nhận thức và suy nghiệm trực giác sai lệch.

Ngược lại, Hệ thống 2 đòi hỏi sự tập trung cao độ, phân tích logic có chủ đích và tiêu tốn nhiều năng lượng trao đổi chất của não. Hệ thống này được kích hoạt khi bạn giải một bài toán phức tạp, đỗ xe vào không gian hẹp, hoặc đọc sâu một văn bản triết học trừu tượng. Làm chủ sự phối hợp giữa hai hệ thống là bí quyết cốt lõi để nâng cao năng lực ra quyết định chính xác.`,
        questions: [
            {
                id: 'q7-1',
                questionOrder: 1,
                questionText: 'Đặc điểm chính của Hệ thống 1 (Tư duy nhanh) là gì?',
                optionA: 'Tự động, tức thì, tốn rất ít năng lượng',
                optionB: 'Luôn luôn chính xác 100% không bao giờ sai',
                optionC: 'Đòi hỏi sự tập trung và tính toán toán học cao độ',
                optionD: 'Chỉ hoạt động khi con người đang ngủ',
                correctOption: 'A',
                explanation: 'Văn bản nêu: "Hệ thống 1 hoạt động hoàn toàn tự động, tức thì, tốn rất ít năng lượng".'
            },
            {
                id: 'q7-2',
                questionOrder: 2,
                questionText: 'Hệ thống 2 được kích hoạt trong trường hợp nào sau đây?',
                optionA: 'Nhận diện nụ cười của bạn bè',
                optionB: 'Giải một bài toán logic phức tạp',
                optionC: 'Quay đầu khi nghe thấy tiếng động lớn',
                optionD: 'Đọc một từ đơn giản quen thuộc',
                correctOption: 'B',
                explanation: 'Hệ thống 2 kích hoạt khi "giải một bài toán phức tạp, phân tích logic có chủ đích".'
            }
        ]
    },
    {
        id: 'text-8',
        title: 'Trục Não - Ruột (Gut-Brain Axis): Bộ Não Thứ Hai Của Cơ Thể',
        category: 'Y Sinh Học Hiện Đại',
        wordCount: 315,
        difficultyLevel: 3,
        previewExcerpt: 'Hàng ngàn tỷ vi sinh vật sống trong đường ruột liên tục giao tiếp với hệ thần kinh trung ương...',
        author: 'BS. CKII Đặng Minh Tuấn',
        content: `Những năm gần đây, giới y học chấn động trước những phát hiện về "Trục Não - Ruột" (Gut-Brain Axis) — mạng lưới truyền tin hai chiều phức tạp giữa hệ thần kinh trung ương và hệ thần kinh ruột. Đường ruột con người chứa hơn 100 triệu tế bào thần kinh, nhiều hơn cả tủy sống, khiến nó được mệnh danh là "Bộ não thứ hai" của cơ thể.

Đáng kinh ngạc hơn, hơn 90% lượng hormone hạnh phúc Serotonin và khoảng 50% Dopamine của toàn bộ cơ thể lại được tổng hợp ngay tại đường ruột bởi hệ vi sinh vật (Microbiome). Thông qua dây thần kinh phế vị (Vagus Nerve) và các phân tử tín hiệu miễn dịch, trạng thái của hệ tiêu hóa tác động trực tiếp đến tâm trạng, khả năng tập trung, mức độ lo âu và độ nhạy bén của tư duy.

Một chế độ ăn uống giàu chất xơ, thực phẩm lên men tự nhiên và polyphenol thực vật không chỉ bảo vệ sức khỏe thể chất mà còn nuôi dưỡng các chủng vi khuẩn sản sinh axit béo chuỗi ngắn. Những hợp chất này vượt qua hàng rào máu não để bảo vệ các tế bào thần kinh khỏi phản ứng viêm, giúp duy trì trí nhớ sắc bén và tinh thần minh mẫn suốt đời.`,
        questions: [
            {
                id: 'q8-1',
                questionOrder: 1,
                questionText: 'Bao nhiêu phần trăm Serotonin trong cơ thể được tổng hợp tại đường ruột?',
                optionA: 'Khoảng 10%',
                optionB: 'Khoảng 50%',
                optionC: 'Hơn 90%',
                optionD: '100%',
                correctOption: 'C',
                explanation: 'Bài viết khẳng định: "hơn 90% lượng hormone hạnh phúc Serotonin... được tổng hợp ngay tại đường ruột".'
            }
        ]
    },
    {
        id: 'text-9',
        title: 'Trạng Thái Dòng Chảy (Flow State) & Đỉnh Cao Năng Suất Trí Tuệ',
        category: 'Tâm Lý Học Năng Suất',
        wordCount: 330,
        difficultyLevel: 4,
        previewExcerpt: 'Khi độ khó của thử thách cân bằng hoàn hảo với kỹ năng cá nhân, tâm trí đạt trạng thái xuất thần...',
        author: 'Mihaly Csikszentmihalyi & Ban Biên Tập',
        content: `Trạng thái dòng chảy (Flow State) là thuật ngữ tâm lý học do giáo sư Mihaly Csikszentmihalyi đặt ra để mô tả trạng thái tinh thần tối thượng khi một người hoàn toàn đắm chìm vào công việc họ đang làm. Trong trạng thái này, cảm giác về thời gian dường như biến mất, tiếng ồn xung quanh tan biến và năng suất lao động có thể tăng vọt lên gấp năm lần.

Về mặt sinh học thần kinh, khi bước vào dòng chảy, não bộ kích hoạt hiện tượng "giảm kích hoạt thùy trán tạm thời" (Transient Hypofrontality). Vùng vỏ não trước trán — nơi chịu trách nhiệm tự phê phán, nghi ngờ bản thân và lo âu — tạm thời lắng dịu. Đồng thời, một thác lũ các chất dẫn truyền thần kinh tạo cảm xúc thăng hoa như Dopamine, Serotonin, Endorphin và Norepinephrine được giải phóng, tạo nên sự sắc bén phi thường trong tư duy.

Để chủ động kích hoạt trạng thái dòng chảy khi học tập hoặc làm việc, bạn cần ba điều kiện tiên quyết: loại bỏ hoàn toàn các yếu tố gây xao nhãng như thông báo điện thoại, thiết lập mục tiêu vi mô rõ ràng cho từng phiên làm việc, và quan trọng nhất là chọn nhiệm vụ có độ khó cao hơn kỹ năng hiện tại khoảng 4% — đủ thách thức để cuốn hút nhưng không quá khó đến mức gây nản lòng.`,
        questions: [
            {
                id: 'q9-1',
                questionOrder: 1,
                questionText: 'Hiện tượng não bộ nào diễn ra khi con người bước vào trạng thái dòng chảy?',
                optionA: 'Tăng áp lực nội sọ đột ngột',
                optionB: 'Giảm kích hoạt thùy trán tạm thời (Transient Hypofrontality)',
                optionC: 'Ngừng hoạt động hoàn toàn của thùy chẩm',
                optionD: 'Tê liệt thần kinh vận động',
                correctOption: 'B',
                explanation: 'Văn bản nêu rõ: "não bộ kích hoạt hiện tượng giảm kích hoạt thùy trán tạm thời (Transient Hypofrontality)".'
            }
        ]
    },
    {
        id: 'text-10',
        title: 'Mật Mã Lượng Tử & Tương Lai Bảo Vệ Tri Thức Nhân Loại',
        category: 'Công Nghệ & Vật Lý',
        wordCount: 320,
        difficultyLevel: 5,
        previewExcerpt: 'Sự phát triển của máy tính lượng tử đe dọa các thuật toán mã hóa hiện nay, mở đường cho phân phối khóa lượng tử...',
        author: 'TS. Hoàng Quốc Dũng',
        content: `Hầu hết các hệ thống an ninh mạng toàn cầu hiện nay — từ giao dịch ngân hàng, thông tin quân sự đến dữ liệu cá nhân — đều dựa trên các thuật toán mã hóa khóa công khai như RSA. Độ an toàn của RSA bắt nguồn từ việc các máy tính cổ điển phải mất hàng ngàn năm mới có thể phân tích một số nguyên khổng lồ thành tích của hai số nguyên tố.

Tuy nhiên, sự xuất hiện của máy tính lượng tử với thuật toán Shor có thể bẻ gãy hệ thống mã hóa này chỉ trong vài phút. Để đối phó với hiểm họa này, các nhà vật lý đã phát triển công nghệ "Phân phối khóa lượng tử" (Quantum Key Distribution - QKD), ứng dụng các nguyên lý cơ bản của cơ học lượng tử như tính bất định của Heisenberg và hiện tượng rối lượng tử.

Điểm kỳ diệu của QKD nằm ở chỗ: bất kỳ nỗ lực nghe lén hay đo lường thông tin nào trên đường truyền photon đều tất yếu làm sụp đổ hàm sóng lượng tử và làm biến dạng trạng thái của hạt. Do đó, cả bên gửi và bên nhận sẽ phát hiện ra sự can thiệp ngay lập tức. Đây là bức tường lửa bảo mật tuyệt đối về mặt vật lý, đảm bảo an toàn cho dữ liệu nhân loại trong kỷ nguyên số hóa tương lai.`,
        questions: [
            {
                id: 'q10-1',
                questionOrder: 1,
                questionText: 'Tại sao việc nghe lén trong phân phối khóa lượng tử (QKD) là không thể che giấu?',
                optionA: 'Vì máy tính lượng tử phát chuông báo động',
                optionB: 'Vì hành động đo lường làm sụp đổ hàm sóng lượng tử và biến dạng photon',
                optionC: 'Vì dây cáp quang sẽ tự đứt',
                optionD: 'Vì luật pháp quốc tế cấm nghe lén',
                correctOption: 'B',
                explanation: 'Bài viết giải thích: "bất kỳ nỗ lực nghe lén hay đo lường... đều tất yếu làm sụp đổ hàm sóng lượng tử và biến dạng trạng thái của hạt".'
            }
        ]
    }
];
exports.VIETNAMESE_WORDS_DICTIONARY = [
    'NÃO', 'BẠN', 'HỌC', 'SÁCH', 'MẮT', 'NHỚ', 'TẬP', 'ĐỌC', 'TÂM', 'TRÍ',
    'TRÍ TUỆ', 'TƯ DUY', 'TẬP TRUNG', 'THÔNG MINH', 'NHANH NHẠY', 'PHẢN XẠ', 'THỊ GIÁC', 'NGOẠI VI',
    'KHOA HỌC', 'TRI THỨC', 'PHÁT TRIỂN', 'TIẾN BỘ', 'KIÊN TRÌ', 'THÀNH CÔNG', 'SÁNG TẠO', 'TẬP LUYỆN',
    'NƠ-RON', 'KHÔNG GIAN', 'KÝ ỨC', 'ĐỘNG LỰC', 'Ý CHÍ', 'HIỆU QUẢ', 'TỐI ƯU', 'ĐỈNH CAO',
    'PHÂN TÍCH', 'SUY LUẬN', 'LOGIC', 'CHIẾN LƯỢC', 'CẢM HỨNG', 'BỨT PHÁ', 'VƯỢT TRỘI', 'ĐỘT PHÁ',
    'TỰ TIN', 'SỰ THẬT', 'CHÂN LÝ', 'KHÁT VỌNG', 'HOÀI BÃO', 'TẬP TỤC', 'THÓI QUEN', 'KỶ LUẬT',
    'KHÁM PHÁ', 'VŨ TRỤ', 'THIÊN NHIÊN', 'CUỘC SỐNG', 'TƯƠNG LAI', 'HIỆN TẠI', 'KHOẢNH KHẮC', 'HY VỌNG',
    'ĐAM MÊ', 'SỨC KHỎE', 'BỀN BỈ', 'DẺO DAI', 'VỮNG VÀNG', 'TĨNH LẶNG', 'TRẦM TƯ', 'TỈNH THỨC',
    'AN LẠC', 'HÒA BÌNH', 'HẠNH PHÚC', 'BIẾT ƠN', 'CHO ĐI', 'CHÂN THÀNH', 'YÊU THƯƠNG', 'GẮN KẾT',
    'HỢP TÁC', 'ĐỒNG ĐỘI', 'KẾT NỐI', 'LAN TỎA', 'GIÁ TRỊ', 'CỐNG HIẾN', 'THÀNH TỰU', 'VINH QUANG'
];
exports.ENGLISH_WORDS_DICTIONARY = [
    'BRAIN', 'MIND', 'FOCUS', 'SPEED', 'READ', 'LEARN', 'MEMORY', 'FLASH',
    'SCHULTE', 'ANAGRAM', 'VISION', 'RETINA', 'COGNITIVE', 'THINKING', 'NEURON', 'SYNAPSE',
    'INSIGHT', 'GENIUS', 'LOGIC', 'INTELLECT', 'CLARITY', 'HABIT', 'ENERGY', 'EXPAND',
    'CHUNKING', 'PERCEPTION', 'ATTENTION', 'REACTION', 'AGILITY', 'FLOW', 'MASTERY', 'WISDOM',
    'DISCOVERY', 'GROWTH', 'HORIZON', 'IMPACT', 'PURPOSE', 'RESILIENCE', 'STRENGTH', 'TRIUMPH'
];
exports.EXERCISE_VARIANTS = [
    {
        id: 'var-rsvp-dual',
        exerciseSlug: 'rsvp-speed-reader',
        minLevel: 9,
        maxLevel: 9,
        variantCode: 'DUAL_WORD_RSVP',
        variantName: 'RSVP Hai Từ Song Hành',
        variantDescription: 'Hiển thị 2 từ xếp chồng trên/dưới đồng thời, kích hoạt xử lý ngôn ngữ song song của não bộ.',
        variantConfig: { dualWordMode: true, lineSpacingPx: 32 }
    },
    {
        id: 'var-rsvp-masked',
        exerciseSlug: 'rsvp-speed-reader',
        minLevel: 10,
        maxLevel: 10,
        variantCode: 'MASKED_RSVP',
        variantName: 'RSVP Che Mờ Đoán Nghĩa',
        variantDescription: 'Che mờ 30% ký tự giữa từ, buộc não bộ phán đoán nhanh qua ngữ cảnh văn bản.',
        variantConfig: { maskedRatio: 0.3 }
    },
    {
        id: 'var-rsvp-quiz',
        exerciseSlug: 'rsvp-speed-reader',
        minLevel: 11,
        maxLevel: 11,
        variantCode: 'QUIZ_INTERRUPT',
        variantName: 'RSVP Ngắt Quãng Kiểm Tra',
        variantDescription: 'Cứ mỗi 40 từ dừng ngẫu nhiên hỏi nhanh 1 câu về nội dung vừa lướt qua.',
        variantConfig: { quizIntervalWords: 40 }
    },
    {
        id: 'var-rsvp-peripheral',
        exerciseSlug: 'rsvp-speed-reader',
        minLevel: 12,
        maxLevel: 12,
        variantCode: 'PERIPHERAL_RSVP',
        variantName: 'RSVP Nhảy Ba Vị Trí',
        variantDescription: 'Từ ngữ luân phiên nhảy ở 3 vị trí (Trái - Giữa - Phải), rèn luyện saccade tốc độ cực hạn.',
        variantConfig: { positions: 3 }
    },
    {
        id: 'var-schulte-gorbov',
        exerciseSlug: 'schulte-table',
        minLevel: 9,
        maxLevel: 9,
        variantCode: 'GORBOV_RED_BLACK',
        variantName: 'Bảng Đỏ-Đen Gorbov',
        variantDescription: 'Bấm luân phiên Đỏ tăng dần (1 đến 25) và Đen giảm dần (24 về 1). Thử nghiệm kinh điển của viện hàng không vũ trụ Nga.',
        variantConfig: { redBlackMode: true, maxRed: 25, maxBlack: 24 }
    },
    {
        id: 'var-schulte-rot',
        exerciseSlug: 'schulte-table',
        minLevel: 10,
        maxLevel: 10,
        variantCode: 'ROTATING_SCHULTE',
        variantName: 'Bảng Xoay Trục',
        variantDescription: 'Toàn bộ lưới số tự động xoay 90 độ mỗi 15 giây, buộc não liên tục tái định vị bản đồ không gian.',
        variantConfig: { rotateIntervalSec: 15 }
    },
    {
        id: 'var-schulte-fading',
        exerciseSlug: 'schulte-table',
        minLevel: 11,
        maxLevel: 11,
        variantCode: 'FADING_SCHULTE',
        variantName: 'Lưới Số Ẩn Hiện',
        variantDescription: 'Các ô số đã bấm chuyển thành màu mờ gây nhiễu, tăng tối đa gánh nặng lọc thị giác.',
        variantConfig: { fadeClicked: false, ghostDistractors: true }
    },
    {
        id: 'var-schulte-dual',
        exerciseSlug: 'schulte-table',
        minLevel: 12,
        maxLevel: 12,
        variantCode: 'DUAL_CENTER',
        variantName: 'Song Tâm Ngắm',
        variantDescription: 'Hai bảng Schulte mini song song, mắt phải duy trì trường nhìn ngoại vi bao quát cả hai màn hình.',
        variantConfig: { dualGridMini: true }
    },
    {
        id: 'var-findletter-case',
        exerciseSlug: 'find-letter',
        minLevel: 9,
        maxLevel: 9,
        variantCode: 'CASE_SENSITIVE',
        variantName: 'Phân Biệt Ký Tự Hoa Thường',
        variantDescription: 'Phân biệt chính xác giữa chữ hoa, chữ thường và ký tự có dấu thanh tiếng Việt.',
        variantConfig: { caseSensitive: true }
    },
    {
        id: 'var-findletter-moving',
        exerciseSlug: 'find-letter',
        minLevel: 10,
        maxLevel: 10,
        variantCode: 'MOVING_GRID',
        variantName: 'Lưới Ký Tự Động',
        variantDescription: 'Các ký tự trôi dạt nhẹ nhàng theo các hướng, tăng độ khó phân tích mẫu hình chuyển động.',
        variantConfig: { movingCharacters: true }
    },
    {
        id: 'var-cardflip-triple',
        exerciseSlug: 'card-flip',
        minLevel: 9,
        maxLevel: 9,
        variantCode: 'TRIPLE_MATCH',
        variantName: 'Ghép Bộ Ba Thẻ',
        variantDescription: 'Lật và ghép đồng thời bộ ba 3 thẻ giống nhau thay vì từng cặp đôi.',
        variantConfig: { tripleMatch: true, pairCount: 16 }
    },
    {
        id: 'var-cardflip-shuffle',
        exerciseSlug: 'card-flip',
        minLevel: 10,
        maxLevel: 10,
        variantCode: 'SHUFFLE_TRAP',
        variantName: 'Bẫy Đảo Vị Trí Thẻ',
        variantDescription: 'Mỗi 10 giây một trận lốc xoáy tráo đổi ngẫu nhiên các thẻ chưa mở!',
        variantConfig: { shuffleIntervalSec: 10, pairCount: 18 }
    },
    {
        id: 'var-stroop-reverse',
        exerciseSlug: 'stroop-clash',
        minLevel: 9,
        maxLevel: 9,
        variantCode: 'REVERSE_STROOP',
        variantName: 'Đảo Ngược: Chọn Nghĩa Chữ',
        variantDescription: 'Đảo ngược hoàn toàn quy tắc Stroop: chọn theo NGHĨA CỦA CHỮ thay vì màu mực.',
        variantConfig: { reverseStroop: true, reactionWindowMs: 1500 }
    },
    {
        id: 'var-stroop-triple',
        exerciseSlug: 'stroop-clash',
        minLevel: 10,
        maxLevel: 10,
        variantCode: 'TRIPLE_STROOP',
        variantName: 'Tam Trùng Xung Đột (Chữ-Màu-Viền)',
        variantDescription: 'Chữ viết, Màu mực và Màu viền ngoài là 3 màu khác nhau. Bấm chọn màu của VIỀN NGOÀI.',
        variantConfig: { borderClash: true, reactionWindowMs: 1400 }
    },
    {
        id: 'var-spatial-reverse',
        exerciseSlug: 'spatial-memory',
        minLevel: 9,
        maxLevel: 9,
        variantCode: 'REVERSE_CORSI',
        variantName: 'Corsi Chạm Ngược Chiều',
        variantDescription: 'Chạm lại chuỗi ô sáng theo đúng thứ tự ĐẢO NGƯỢC từ cuối lên đầu.',
        variantConfig: { reverseOrder: true }
    },
    {
        id: 'var-saccade-multi',
        exerciseSlug: 'saccade-tracker',
        minLevel: 9,
        maxLevel: 9,
        variantCode: 'MULTI_TARGET_SACCADE',
        variantName: 'Song Mục Tiêu Nhảy Nhót',
        variantDescription: 'Hai mục tiêu nhảy cóc cùng lúc, chỉ phản xạ khi CẢ HAI mục tiêu đều hiện chữ X.',
        variantConfig: { multiTargetCount: 2 }
    }
];
exports.EXERCISE_SYNERGIES = [
    {
        id: 'syn-eye-expansion',
        exerciseASlug: 'schulte-table',
        exerciseBSlug: 'peripheral-vision',
        synergyType: 'COMPLEMENTARY',
        title: 'Mở Rộng Thị Giác Toàn Cảnh',
        description: 'Kết hợp Schulte mở rộng góc nhìn và bài tập Tầm Nhìn khóa tâm ngắm giúp củng cố khả năng tiếp nhận thông tin ngoài điểm nhìn trung tâm.',
        bonusXpPercent: 25
    },
    {
        id: 'syn-speed-read-flow',
        exerciseASlug: 'rsvp-speed-reader',
        exerciseBSlug: 'reading-assessment',
        synergyType: 'PROGRESSIVE',
        title: 'Gia Tốc & Thấu Triệt',
        description: 'Khởi động mắt bằng bài Chữ Chạy rồi kiểm tra với Đánh Giá Tốc Độ Đọc để rèn luyện thói quen tiếp nhận từ trực quan không cần đọc thầm.',
        bonusXpPercent: 20
    },
    {
        id: 'syn-reaction-inhibitory',
        exerciseASlug: 'stroop-clash',
        exerciseBSlug: 'even-odd',
        synergyType: 'COMPLEMENTARY',
        title: 'Ức Chế Phản Xạ Đỉnh Cao',
        description: 'Kết hợp kiểm soát xung đột màu-chữ và phân loại số theo quy tắc, tăng tốc độ xử lý và ức chế phản ứng thói quen.',
        bonusXpPercent: 25
    },
    {
        id: 'syn-spatial-sequence',
        exerciseASlug: 'digit-span',
        exerciseBSlug: 'spatial-memory',
        synergyType: 'COMPLEMENTARY',
        title: 'Giao Thoa Không Gian & Ký Ức',
        description: 'Rèn luyện cả âm vị học số học (Digit Span) và định vị không gian thị giác (Corsi Block) mở rộng dung lượng bộ nhớ làm việc.',
        bonusXpPercent: 25
    },
    {
        id: 'syn-lexical-scanning',
        exerciseASlug: 'word-search',
        exerciseBSlug: 'text-scanning',
        synergyType: 'PROGRESSIVE',
        title: 'Truy Vết Từ Tố Chuyên Sâu',
        description: 'Luyện tìm từ ẩn trong ma trận rồi ứng dụng ngay vào kỹ năng Skimming/Scanning văn bản tài liệu thực chiến.',
        bonusXpPercent: 20
    },
    {
        id: 'syn-saccade-pacer',
        exerciseASlug: 'saccade-tracker',
        exerciseBSlug: 'reading-pacer',
        synergyType: 'COMPLEMENTARY',
        title: 'Đồng Bộ Nhịp Cơ Vận Nhãn',
        description: 'Kết hợp rèn luyện nhịp giật mắt chính xác và máy đếm nhịp dẫn hướng, giúp mắt duy trì nhịp lướt chữ ổn định.',
        bonusXpPercent: 25
    },
    {
        id: 'syn-anagram-cardflip',
        exerciseASlug: 'anagram',
        exerciseBSlug: 'card-flip',
        synergyType: 'CONTRAST',
        title: 'Liên Kết Ngôn Ngữ & Không Gian',
        description: 'Kết hợp rèn luyện tái tổ hợp từ vựng và ghi nhớ cấu trúc vị trí thẻ bài trong bộ nhớ làm việc.',
        bonusXpPercent: 30
    },
    {
        id: 'syn-chunking-greendot',
        exerciseASlug: 'green-dot',
        exerciseBSlug: 'word-chunking',
        synergyType: 'COMPLEMENTARY',
        title: 'Hấp Thụ Khối Ý Nghĩa',
        description: 'Điểm cố định kích hoạt trạng thái tập trung mềm (Soft Focus), Chuỗi từ rèn luyện gom cụm nhảy nhãn cầu theo từng khối ngữ pháp.',
        bonusXpPercent: 20
    }
];
exports.WEEKLY_CHALLENGES = [
    {
        id: 'wc-1',
        title: 'Thần Tốc Schulte Đỏ-Đen',
        description: 'Hoàn thành Bảng Schulte Cấp 9 (Gorbov Đỏ-Đen) đạt tỷ lệ chính xác trên 90% dưới 50 giây.',
        exerciseSlug: 'schulte-table',
        targetScore: 400,
        targetLevel: 9,
        xpReward: 350,
        expiresAt: '2026-09-30T23:59:59Z',
        isCompleted: false
    },
    {
        id: 'wc-2',
        title: 'Bậc Thầy Đấu Màu Stroop',
        description: 'Vượt qua Cấp 10 (Tam Trùng Xung Đột Chữ-Màu-Viền) với chuỗi phản xạ đúng liên tiếp từ 15 câu.',
        exerciseSlug: 'stroop-clash',
        targetScore: 500,
        targetLevel: 10,
        xpReward: 400,
        expiresAt: '2026-09-30T23:59:59Z',
        isCompleted: false
    },
    {
        id: 'wc-3',
        title: 'Khai Phá Siêu Âm RSVP 1400 WPM',
        description: 'Đọc đoạn văn RSVP ở Cấp 9 (Hai Từ Song Hành) với tốc độ 1400 WPM trọn vẹn 60 giây.',
        exerciseSlug: 'rsvp-speed-reader',
        targetScore: 600,
        targetLevel: 9,
        xpReward: 500,
        expiresAt: '2026-09-30T23:59:59Z',
        isCompleted: false
    }
];
exports.CONTENT_POOLS = [
    {
        id: 'pool-1',
        exerciseSlug: 'anagram',
        contentType: 'phrase_list',
        contentData: {
            phrases: [
                'TRÍ TUỆ NHÂN TẠO',
                'KHOA HỌC THẦN KINH',
                'TẬP TRUNG CAO ĐỘ',
                'TƯ DUY ĐỘT PHÁ',
                'TỐC ĐỘ XỬ LÝ',
                'BẢN ĐỒ TƯ DUY',
                'TIẾN HÓA NÃO BỘ'
            ]
        },
        difficultyTier: 4,
        timesUsed: 0
    },
    {
        id: 'pool-2',
        exerciseSlug: 'word-search',
        contentType: 'matrix_theme',
        contentData: {
            theme: 'Khoa Học Nhận Thức',
            words: ['SYNAPSE', 'NEURON', 'CORTEX', 'MEMORY', 'RETINA', 'AXON', 'MYELIN']
        },
        difficultyTier: 3,
        timesUsed: 0
    },
    {
        id: 'pool-3',
        exerciseSlug: 'text-scanning',
        contentType: 'scanning_pack',
        contentData: {
            title: 'Kính Thiên Văn James Webb',
            targetQuestions: [
                { question: 'Kính thiên văn James Webb được phóng vào năm nào?', answer: '2021' },
                { question: 'Điểm cân bằng trọng trường nơi kính hoạt động có tên là gì?', answer: 'L2' },
                { question: 'Vật liệu phủ trên bề mặt các gương lục giác là kim loại gì?', answer: 'Vàng' }
            ]
        },
        difficultyTier: 4,
        timesUsed: 0
    }
];
//# sourceMappingURL=index.js.map