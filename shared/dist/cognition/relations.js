"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_RELATION_IDS = exports.COGNITIVE_RELATIONS = void 0;
exports.COGNITIVE_RELATIONS = {
    TARGET_POSITION: {
        id: 'TARGET_POSITION',
        nameVi: 'Mục Tiêu → Vị Trí',
        nameEn: 'Target to Position',
        definition: 'Ánh xạ một đối tượng định danh (identity) tới tọa độ không gian chính xác.',
        representativeGames: ['schulte-table', 'spatial-memory', 'find-number'],
        iconName: 'Crosshair',
        descriptionVi: 'Khả năng định vị nhanh vị trí của đối tượng trong không gian thị giác.'
    },
    ORDER_SEQUENCE: {
        id: 'ORDER_SEQUENCE',
        nameVi: 'Thứ Tự → Chuỗi',
        nameEn: 'Order and Sequence',
        definition: 'Nhận diện quan hệ thứ tự tiếp nối (A đứng trước B; next hợp lệ theo quy tắc).',
        representativeGames: ['schulte-table', 'digit-span', 'spatial-memory'],
        iconName: 'ListOrdered',
        descriptionVi: 'Khả năng duy trì và tái hiện trình tự nối tiếp của các mắt xích thông tin.'
    },
    IDENTITY_MATCH: {
        id: 'IDENTITY_MATCH',
        nameVi: 'Đồng Nhất',
        nameEn: 'Identity Match',
        definition: 'Xác định hai tín hiệu kích thích có cùng một identity hay không.',
        representativeGames: ['twin-words', 'card-flip'],
        iconName: 'CheckCheck',
        descriptionVi: 'Khả năng nhận dạng sự trùng khớp tuyệt đối giữa hai thông tin ở tốc độ cao.'
    },
    SIMILARITY_DIFF: {
        id: 'SIMILARITY_DIFF',
        nameVi: 'Giống / Khác',
        nameEn: 'Similarity and Difference',
        definition: 'So sánh các đặc trưng (hình dáng, ký tự, ngữ nghĩa) để tìm điểm khác biệt tinh tế.',
        representativeGames: ['twin-words', 'find-letter', 'anagram'],
        iconName: 'Split',
        descriptionVi: 'Khả năng phân biệt sai lệch hình thái học và đặc trưng chi tiết.'
    },
    TARGET_DISTRACTOR: {
        id: 'TARGET_DISTRACTOR',
        nameVi: 'Tín Hiệu / Nhiễu',
        nameEn: 'Signal vs Distractor',
        definition: 'Tiếp nhận thông tin mục tiêu và ức chế các tác nhân gây xao nhãng xung quanh.',
        representativeGames: ['find-letter', 'find-number', 'text-scanning'],
        iconName: 'Target',
        descriptionVi: 'Khả năng lọc sạch tạp âm thị giác và cô lập đối tượng cần tìm.'
    },
    RULE_ACTION: {
        id: 'RULE_ACTION',
        nameVi: 'Luật → Hành Động',
        nameEn: 'Rule to Action',
        definition: 'Kích thích đầu vào kết hợp quy tắc hiện hành để sinh ra hành vi phản hồi tương ứng.',
        representativeGames: ['even-odd', 'stroop-clash'],
        iconName: 'Workflow',
        descriptionVi: 'Khả năng áp dụng quy tắc điều kiện để thực hiện thao tác quyết định tức thì.'
    },
    INHIBITION: {
        id: 'INHIBITION',
        nameVi: 'Ức Chế Xung Đột',
        nameEn: 'Inhibition Control',
        definition: 'Ức chế phản xạ thói quen tự động khi có quy tắc mới hoặc tín hiệu xung đột.',
        representativeGames: ['stroop-clash', 'even-odd', 'schulte-table'],
        iconName: 'ShieldAlert',
        descriptionVi: 'Năng lực làm chủ và chặn đứng phản ứng tự động không phù hợp.'
    },
    PART_WHOLE: {
        id: 'PART_WHOLE',
        nameVi: 'Bộ Phận → Khối',
        nameEn: 'Part to Whole',
        definition: 'Tái tổ hợp ký tự/âm tiết thành từ, hoặc gom các từ đơn thành cụm ngữ nghĩa lớn.',
        representativeGames: ['anagram', 'word-chunking', 'word-search'],
        iconName: 'Layers',
        descriptionVi: 'Năng lực nhìn thấu cấu trúc tổng thể từ các mảnh ghép phân mảnh.'
    },
    FOCUS_FIELD: {
        id: 'FOCUS_FIELD',
        nameVi: 'Tâm → Ngoại Vi',
        nameEn: 'Fixation to Field',
        definition: 'Giữ cố định điểm nhìn trung tâm trong khi tiếp nhận dữ liệu từ trường nhìn ngoại vi.',
        representativeGames: ['green-dot', 'peripheral-vision', 'schulte-table', 'saccade-tracker'],
        iconName: 'Eye',
        descriptionVi: 'Khả năng mở rộng khẩu độ nhận thức mà không cần đảo mắt liên tục.'
    },
    SPATIAL_TRANSFORM: {
        id: 'SPATIAL_TRANSFORM',
        nameVi: 'Biến Đổi Không Gian',
        nameEn: 'Spatial Transformation',
        definition: 'Mã hóa, xoay lật, hoặc cập nhật vị trí trong không gian hai chiều và ba chiều.',
        representativeGames: ['spatial-memory', 'card-flip', 'schulte-table'],
        iconName: 'Move3d',
        descriptionVi: 'Trí tưởng tượng không gian và khả năng tái lập tọa độ chuyển động.'
    },
    TEMPORAL_PREDICT: {
        id: 'TEMPORAL_PREDICT',
        nameVi: 'Dự Đoán Thời Gian',
        nameEn: 'Temporal Prediction',
        definition: 'Dự đoán và đón đầu tín hiệu tiếp theo theo dòng thời gian liên tục.',
        representativeGames: ['rsvp-speed-reader', 'reading-pacer', 'digit-span'],
        iconName: 'Hourglass',
        descriptionVi: 'Khả năng bắt nhịp và đón nhận luồng thông tin tốc độ cao theo thời gian thực.'
    },
    CONTEXT_MEANING: {
        id: 'CONTEXT_MEANING',
        nameVi: 'Ngữ Cảnh → Nghĩa',
        nameEn: 'Context to Meaning',
        definition: 'Hiểu sâu mối quan hệ nhân quả, cấu trúc văn bản và đồng tham chiếu ý nghĩa.',
        representativeGames: ['reading-assessment', 'word-chunking', 'rsvp-speed-reader'],
        iconName: 'BookOpen',
        descriptionVi: 'Năng lực thấu hiểu thông điệp cốt lõi và kết nối các tầng nghĩa sâu sắc.'
    }
};
exports.ALL_RELATION_IDS = Object.keys(exports.COGNITIVE_RELATIONS);
