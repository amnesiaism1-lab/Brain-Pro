"use strict";
/**
 * DỮ LIỆU BẢN ĐỒ NHẬN THỨC VÀ ĐỊNH VỊ KHÔNG GIAN HÀ NỘI
 * Hệ sinh thái thực thể lõi, quan hệ hình học, quy luật mặt trời và lý thuyết tư duy định hướng
 * Chuẩn hóa theo mô hình 5 thành phần đô thị của Kevin Lynch (The Image of the City)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HANOI_THEORY_CHAPTERS = exports.HANOI_RELATIONS = exports.ALL_HANOI_ENTITIES = exports.HANOI_JUNCTIONS = exports.HANOI_LANDMARKS = exports.HANOI_FRENCH_GRID_STREETS = exports.HANOI_RADIAL_CORRIDORS = exports.HANOI_RING_3_SEQUENCE = exports.HANOI_RING_2_SEQUENCE = exports.HANOI_RING_1_SEQUENCE = exports.HANOI_RING_ROADS = exports.HANOI_BRIDGES_NORTH_TO_SOUTH = exports.HANOI_BRIDGES = exports.HANOI_WATER_EDGES = void 0;
exports.getHanoiSolarAzimuth = getHanoiSolarAzimuth;
exports.getHanoiShadowBearing = getHanoiShadowBearing;
exports.bearingToCardinalName = bearingToCardinalName;
// 1. THỰC THỂ LÕI: SÔNG, HỒ & BIÊN GIỚI TỰ NHIÊN (EDGES & WATER BODIES)
exports.HANOI_WATER_EDGES = [
    {
        id: 'edge-red-river',
        name: 'Sông Hồng',
        alias: 'Sông Cái / Nhị Hà',
        type: 'river',
        category: 'edge',
        district: 'Tây Hồ - Ba Đình - Hoàn Kiếm - Hai Bà Trưng - Long Biên',
        coords: { lat: 21.045, lng: 105.865 },
        bearingDeg: 135, // Hướng dòng chảy Tây Bắc -> Đông Nam
        description: 'Trục ranh giới tự nhiên lớn nhất phân định bờ Nam (nội thành lịch sử) và bờ Bắc/Đông (Long Biên, Gia Lâm, Đông Anh). Chảy từ Tây Bắc xuống Đông Nam.',
        cognitiveTip: 'Sông Hồng là đường biên phía Đông và Đông Bắc của lõi nội thành. Mọi hành trình vượt sông đều buộc phải đi qua 6 cây cầu huyết mạch.'
    },
    {
        id: 'edge-to-lich-river',
        name: 'Sông Tô Lịch',
        alias: 'Trục thoát nước & ranh giới uốn lượn Tây - Nam',
        type: 'river',
        category: 'edge',
        district: 'Cầu Giấy - Đống Đa - Thanh Xuân - Hoàng Mai',
        coords: { lat: 21.018, lng: 105.808 },
        bearingDeg: 170,
        description: 'Chảy từ Bưởi uốn lượn dọc theo Đường Láng, Khương Đình, Kim Giang về phía Nam. Ranh giới tự nhiên giữa Đống Đa và Cầu Giấy/Thanh Xuân.',
        cognitiveTip: 'Khi đi dọc Đường Láng, bạn đang chạy song song với sông Tô Lịch. Phía Tây sông là Cầu Giấy/Thanh Xuân, phía Đông sông là Đống Đa.'
    },
    {
        id: 'lake-west-lake',
        name: 'Hồ Tây',
        alias: 'Đoài Hồ / Kim Ngưu',
        type: 'lake',
        category: 'edge',
        district: 'Tây Hồ',
        coords: { lat: 21.058, lng: 105.823 },
        description: 'Hồ nước ngọt tự nhiên lớn nhất Hà Nội (~500 ha), mốc neo không gian vĩ mô ở góc Tây Bắc của trung tâm.',
        cognitiveTip: 'Mốc định vị khổng lồ phía Bắc - Tây Bắc. Khi gió Bắc tràn về hoặc nhìn mặt hồ mênh mông, bạn đang ở phía Bắc trung tâm.'
    },
    {
        id: 'lake-truc-bach',
        name: 'Hồ Trúc Bạch',
        alias: 'Hồ ngăn cách bởi đường Thanh Niên',
        type: 'lake',
        category: 'edge',
        district: 'Ba Đình',
        coords: { lat: 21.047, lng: 105.839 },
        description: 'Tách ra từ Hồ Tây bởi dải đê Cổ Ngư xưa (nay là đường Thanh Niên lãng mạn).',
        cognitiveTip: 'Đường Thanh Niên chạy kẹp giữa Hồ Tây (bên trái nếu đi hướng Bắc) và Hồ Trúc Bạch (bên phải).'
    },
    {
        id: 'lake-hoan-kiem',
        name: 'Hồ Hoàn Kiếm',
        alias: 'Hồ Gươm / Lục Thủy',
        type: 'lake',
        category: 'landmark',
        district: 'Hoàn Kiếm',
        coords: { lat: 21.0285, lng: 105.8542 },
        description: 'Trái tim biểu tượng của Thủ đô Hà Nội, điểm mốc Km 0 quốc gia. Điểm tiếp giáp giữa Phố Cổ và Phố Pháp.',
        cognitiveTip: 'Điểm neo gốc (Root Anchor). Phía Bắc Hồ Gươm là 36 Phố Phường. Phía Nam và Tây là Khu Phố Pháp ô bàn cờ.'
    },
    {
        id: 'lake-bay-mau',
        name: 'Hồ Bảy Mẫu',
        alias: 'Hồ Công viên Thống Nhất',
        type: 'lake',
        category: 'edge',
        district: 'Hai Bà Trưng',
        coords: { lat: 21.013, lng: 105.843 },
        description: 'Nằm trọn trong lòng Công viên Thống Nhất, giáp đường Lê Duẩn, Đại Cồ Việt và Trần Nhân Tông.',
        cognitiveTip: 'Đối diện với Hồ Ba Mẫu qua trục đường sắt Bắc Nam và đường Lê Duẩn.'
    },
    {
        id: 'lake-thu-le',
        name: 'Hồ Thủ Lệ',
        alias: 'Hồ Công viên Thủ Lệ (Vườn Thú)',
        type: 'lake',
        category: 'edge',
        district: 'Ba Đình',
        coords: { lat: 21.031, lng: 105.810 },
        description: 'Nằm kẹp giữa trục Kim Mã - Cầu Giấy và đường Đào Tấn - Nguyễn Văn Ngọc. Bên cạnh khách sạn Daewoo và Lotte Center.',
        cognitiveTip: 'Điểm chuyển tiếp quan trọng từ quận Ba Đình sang quận Cầu Giấy tại ngã 4 Voi Phục.'
    },
    {
        id: 'lake-giang-vo',
        name: 'Hồ Giảng Võ',
        alias: 'Hồ trung tâm Ba Đình - Đống Đa',
        type: 'lake',
        category: 'edge',
        district: 'Ba Đình',
        coords: { lat: 21.027, lng: 105.822 },
        description: 'Bao quanh bởi phố Trần Huy Liệu, Ngọc Khánh, Giảng Võ. Nằm gần Khách sạn Hà Nội.',
        cognitiveTip: 'Điểm neo giữa hai trục hướng tâm: Trục Giảng Võ - Láng Hạ và trục Kim Mã.'
    },
    {
        id: 'lake-linh-dam',
        name: 'Hồ Linh Đàm',
        alias: 'Bán đảo Linh Đàm cửa ngõ phía Nam',
        type: 'lake',
        category: 'edge',
        district: 'Hoàng Mai',
        coords: { lat: 20.971, lng: 105.828 },
        description: 'Quần thể hồ điều hòa lớn bao bọc bán đảo đô thị Linh Đàm, nằm sát Vành đai 3 phía Nam.',
        cognitiveTip: 'Điểm neo nhận diện cửa ngõ phía Nam của Vành đai 3 (đoạn Nghiêm Xuân Yêm - Hoàng Liệt).'
    }
];
// 2. CHUỖI CẦU SÔNG HỒNG (BẮC XUỐNG NAM)
exports.HANOI_BRIDGES = [
    {
        id: 'bridge-nhat-tan',
        name: 'Cầu Nhật Tân',
        alias: 'Cầu Dây Văng 5 Tháp Biểu Tượng',
        type: 'bridge',
        category: 'node',
        district: 'Tây Hồ - Đông Anh',
        coords: { lat: 21.092, lng: 105.824 },
        bearingDeg: 25,
        description: 'Cầu dây văng 5 nhịp tháp thép tượng trưng cho 5 cửa ô Hà Nội, dài 3.75km, nối trục Võ Chí Công với Võ Nguyên Giáp đi Sân bay Nội Bài.',
        cognitiveTip: 'Cây cầu cực Bắc trong cụm cầu chính, nằm trên trục Vành đai 2 khép kín.'
    },
    {
        id: 'bridge-thang-long',
        name: 'Cầu Thăng Long',
        alias: 'Cầu 2 Tầng Giàn Thép Liên Xô',
        type: 'bridge',
        category: 'node',
        district: 'Bắc Từ Liêm - Đông Anh',
        coords: { lat: 21.099, lng: 105.787 },
        bearingDeg: 350,
        description: 'Cầu giàn thép 2 tầng: tầng dưới đường sắt và xe 2 bánh, tầng trên cao tốc ô tô. Nối Phạm Văn Đồng (Vành đai 3) sang Đông Anh.',
        cognitiveTip: 'Cầu nằm phía Tây Bắc, là đầu mối Vành đai 3 vượt sông Hồng đi Vĩnh Phúc, Nội Bài.'
    },
    {
        id: 'bridge-long-bien',
        name: 'Cầu Long Biên',
        alias: 'Cầu Thép Paul Doumer (1902)',
        type: 'bridge',
        category: 'landmark',
        district: 'Hoàn Kiếm - Long Biên',
        coords: { lat: 21.043, lng: 105.856 },
        bearingDeg: 55,
        description: 'Cây cầu thép đầu tiên bắc qua sông Hồng (1902). Chỉ dành cho tàu hỏa, xe máy và người đi bộ.',
        cognitiveTip: 'Nằm ngay sát phía Bắc cầu Chương Dương. Đầu cầu phía nội đô nối với phố Trần Nhật Duật và chợ Đồng Xuân.'
    },
    {
        id: 'bridge-chuong-duong',
        name: 'Cầu Chương Dương',
        alias: 'Cầu Thép Kỹ Sư Việt Nam (1985)',
        type: 'bridge',
        category: 'node',
        district: 'Hoàn Kiếm - Long Biên',
        coords: { lat: 21.038, lng: 105.861 },
        bearingDeg: 60,
        description: 'Cầu thép huyết mạch kết nối trực tiếp Phố Cổ (Trần Quang Khải / Hàng Tre) với đường Nguyễn Văn Cừ (Long Biên).',
        cognitiveTip: 'Cửa ngõ vào trung tâm Hoàn Kiếm từ phía Đông Bắc. Cầu có làn xe máy hai bên cánh gà ngoài cùng.'
    },
    {
        id: 'bridge-vinh-tuy',
        name: 'Cầu Vĩnh Tuy',
        alias: 'Cầu 8 Làn Xe Vành Đai 2',
        type: 'bridge',
        category: 'node',
        district: 'Hai Bà Trưng - Long Biên',
        coords: { lat: 21.006, lng: 105.882 },
        bearingDeg: 65,
        description: 'Cầu vượt sông 8 làn xe hiện đại nhất nội đô, điểm kết thúc của đường trên cao Vành đai 2 (nối Minh Khai sang Cổ Linh/Aeon Mall Long Biên).',
        cognitiveTip: 'Muốn thoát tắc cầu Chương Dương từ phía Nam trung tâm, luôn ưu tiên đi Vĩnh Tuy.'
    },
    {
        id: 'bridge-thanh-tri',
        name: 'Cầu Thanh Trì',
        alias: 'Cầu Bê Tông Dự Ứng Lực Vành Đai 3',
        type: 'bridge',
        category: 'node',
        district: 'Hoàng Mai - Gia Lâm',
        coords: { lat: 20.978, lng: 105.908 },
        bearingDeg: 70,
        description: 'Cây cầu lớn nhất trên trục Vành đai 3, kết nối trục phía Nam đi Quốc lộ 5 và cao tốc Hà Nội - Hải Phòng.',
        cognitiveTip: 'Cây cầu cực Nam trong hệ thống cầu qua sông Hồng của nội thành Hà Nội.'
    }
];
exports.HANOI_BRIDGES_NORTH_TO_SOUTH = [
    'bridge-nhat-tan',
    'bridge-thang-long',
    'bridge-long-bien',
    'bridge-chuong-duong',
    'bridge-vinh-tuy',
    'bridge-thanh-tri'
];
// 3. HỆ THỐNG VÀNH ĐAI ĐỒNG TÂM (RING ROADS)
exports.HANOI_RING_ROADS = [
    {
        id: 'ring-1',
        name: 'Vành đai 1',
        alias: 'Vành đai Cửa Ô Lịch Sử',
        type: 'ring',
        category: 'path',
        district: 'Hai Bà Trưng - Đống Đa - Ba Đình',
        coords: { lat: 21.018, lng: 105.836 },
        ringTier: 1,
        description: 'Tuyến vành đai ôm sát lõi lịch sử: Trần Khát Chân → Đại Cồ Việt → Xã Đàn → Ô Chợ Dừa → Hoàng Cầu → Yên Lãng → Đê La Thành → Bưởi.',
        cognitiveTip: 'Phân định rõ ranh giới giữa trung tâm cũ và khu vực phát triển mới. Đi qua 3 cửa ô lớn: Ô Cầu Dền, Ô Đồng Lầm (Kim Liên), Ô Chợ Dừa.'
    },
    {
        id: 'ring-2',
        name: 'Vành đai 2',
        alias: 'Vành đai Trên Cao & Khép Kín',
        type: 'ring',
        category: 'path',
        district: 'Hai Bà Trưng - Đống Đa - Cầu Giấy - Tây Hồ - Long Biên',
        coords: { lat: 21.015, lng: 105.815 },
        ringTier: 2,
        description: 'Tuyến khép kín hiện đại: Cầu Vĩnh Tuy → Minh Khai → Đại La → Trường Chinh → Đường Láng → Cầu Giấy → Bưởi → Võ Chí Công → Cầu Nhật Tân.',
        cognitiveTip: 'Đoạn Vĩnh Tuy - Ngã Tư Vọng - Ngã Tư Sở có đường trên cao tốc độ 80km/h giúp đi xuyên Nam sang Tây trong 10 phút.'
    },
    {
        id: 'ring-2-5',
        name: 'Vành đai 2.5',
        alias: 'Vành đai Bổ Trợ Đô Thị',
        type: 'ring',
        category: 'path',
        district: 'Hoàng Mai - Thanh Xuân - Cầu Giấy',
        coords: { lat: 21.002, lng: 105.805 },
        ringTier: 2.5,
        description: 'Nối từ Kim Đồng → Định Công → Đầm Hồng → Hoàng Đạo Thúy → Nguyễn Phong Sắc → Trần Thái Tông.',
        cognitiveTip: 'Chạy song song kẹp giữa Vành đai 2 và Vành đai 3, giải tỏa lưu lượng giao thông cực lớn cho trục Cầu Giấy - Thanh Xuân.'
    },
    {
        id: 'ring-3',
        name: 'Vành đai 3',
        alias: 'Cao Tốc Đô Thị Trên Cao CT.20',
        type: 'ring',
        category: 'path',
        district: 'Bắc Từ Liêm - Nam Từ Liêm - Cầu Giấy - Thanh Xuân - Hoàng Mai',
        coords: { lat: 21.008, lng: 105.789 },
        ringTier: 3,
        description: 'Trục huyết mạch liên tỉnh dài nhất nội thành: Cầu Thăng Long → Phạm Văn Đồng → Phạm Hùng → Khuất Duy Tiến → Nguyễn Xiển → Nghiêm Xuân Yêm → Cầu Thanh Trì.',
        cognitiveTip: 'Cao tốc trên cao chạy liên tục từ Cầu Thăng Long đến Cầu Thanh Trì. Cắt qua 3 nút giao 3-4 tầng phức tạp nhất Thủ đô.'
    }
];
exports.HANOI_RING_1_SEQUENCE = [
    'Trần Khát Chân',
    'Đại Cồ Việt',
    'Hầm Kim Liên',
    'Xã Đàn',
    'Ô Chợ Dừa',
    'Hoàng Cầu',
    'Yên Lãng',
    'Đê La Thành',
    'Bưởi'
];
exports.HANOI_RING_2_SEQUENCE = [
    'Cầu Vĩnh Tuy',
    'Minh Khai',
    'Đại La',
    'Ngã Tư Vọng',
    'Trường Chinh',
    'Ngã Tư Sở',
    'Đường Láng',
    'Cầu Giấy',
    'Bưởi',
    'Võ Chí Công',
    'Cầu Nhật Tân'
];
exports.HANOI_RING_3_SEQUENCE = [
    'Cầu Thăng Long',
    'Phạm Văn Đồng',
    'Ngã tư Mai Dịch',
    'Phạm Hùng',
    'Khuất Duy Tiến',
    'Nguyễn Xiển',
    'Nghiêm Xuân Yêm',
    'Hoàng Liệt',
    'Cầu Thanh Trì'
];
// 4. TRỤC HƯỚNG TÂM & NỐI TIẾP ĐỔI TÊN (RADIALS & COLLINEAR SEQUENCES)
exports.HANOI_RADIAL_CORRIDORS = [
    {
        id: 'corridor-sw-nguyen-trai',
        name: 'Trục Tây Nam: Tôn Đức Thắng - Nguyễn Trãi - Hà Đông',
        direction: 'South-West',
        bearingDeg: 225, // Tây Nam
        segments: [
            'Tôn Đức Thắng',
            'Nguyễn Lương Bằng',
            'Tây Sơn',
            'Ngã Tư Sở',
            'Nguyễn Trãi',
            'Trần Phú (Hà Đông)',
            'Quang Trung (Hà Đông)',
            'Ba La (QL6)'
        ],
        description: 'Trục xuyên tâm có mật độ dân cư và trường đại học lớn nhất Thủ đô, đi kèm tuyến Metro Cát Linh - Hà Đông chạy trên cao.',
        cognitiveTip: 'Một đường thẳng tắp hướng Tây Nam: Đi từ Văn Miếu qua Ngã Tư Sở xuống thẳng Hà Đông mà không cần rẽ tay lái.'
    },
    {
        id: 'corridor-south-giai-phong',
        name: 'Trục Phía Nam: Lê Duẩn - Giải Phóng - Ngọc Hồi',
        direction: 'South',
        bearingDeg: 180, // Chính Nam
        segments: [
            'Lê Duẩn',
            'Hầm Kim Liên / Đại Cồ Việt',
            'Giải Phóng',
            'Ngã Tư Vọng',
            'Bến xe Giáp Bát',
            'Bến xe Nước Ngầm',
            'Ngọc Hồi (QL1A)'
        ],
        description: 'Trục xương sống đi dọc theo tuyến đường sắt Bắc Nam, nối ga Hà Nội ra các tỉnh duyên hải miền Trung và phía Nam.',
        cognitiveTip: 'Chạy chính Nam 180°. Luôn nhìn thấy đường ray tàu hỏa chạy song song bên tay trái (khi đi từ trung tâm ra ngoài).'
    },
    {
        id: 'corridor-west-cau-giay',
        name: 'Trục Tây Bắc: Kim Mã - Cầu Giấy - Xuân Thủy - Hồ Tùng Mậu',
        direction: 'West-North',
        bearingDeg: 290, // Tây Tây Bắc
        segments: [
            'Nguyễn Thái Học',
            'Kim Mã',
            'Cầu Giấy',
            'Xuân Thủy',
            'Ngã tư Mai Dịch',
            'Hồ Tùng Mậu',
            'Cầu Diễn (QL32)'
        ],
        description: 'Trục giáo dục và công nghệ cao, đi kèm tuyến Metro Nhổn - Ga Hà Nội chạy trên cao dọc trục.',
        cognitiveTip: 'Nắng chiều 16h30 chiếu thẳng vào mặt khi đi trên trục Xuân Thủy - Hồ Tùng Mậu.'
    },
    {
        id: 'corridor-west-tran-duy-hung',
        name: 'Trục Tây Ba Đình: Văn Cao - Liễu Giai - Nguyễn Chí Thanh - Trần Duy Hưng',
        direction: 'West',
        bearingDeg: 240, // Tây Nam
        segments: [
            'Văn Cao (Hồ Tây)',
            'Liễu Giai (Lotte Center)',
            'Nguyễn Chí Thanh',
            'Trần Duy Hưng',
            'Nút giao Trung Hòa',
            'Đại lộ Thăng Long (Láng - Hòa Lạc)'
        ],
        description: 'Trục đại lộ biểu tượng nối từ Hồ Tây qua quận Ba Đình sang trung tâm tài chính mới Trung Hòa - Cầu Giấy và Đại lộ Thăng Long.',
        cognitiveTip: 'Một trong những trục collinear đẹp nhất: 4 con đường thẳng tắp nối nhau qua 3 cây cầu vượt thép và hầm chui Trung Hòa.'
    },
    {
        id: 'corridor-sw-lang-ha',
        name: 'Trục Tây Nam 2: Giảng Võ - Láng Hạ - Lê Văn Lương - Tố Hữu',
        direction: 'West-South-BRT',
        bearingDeg: 230,
        segments: [
            'Giảng Võ',
            'Láng Hạ',
            'Cầu vượt Láng',
            'Lê Văn Lương',
            'Hầm chui Khuất Duy Tiến',
            'Tố Hữu (Lê Văn Lương kéo dài)',
            'Yên Nghĩa'
        ],
        description: 'Trục văn phòng tài chính và tuyến xe buýt nhanh BRT 01 chạy trên làn ưu tiên.',
        cognitiveTip: 'Chạy song song hoàn hảo kẹp giữa trục Nguyễn Trãi và trục Trần Duy Hưng.'
    },
    {
        id: 'corridor-east-nguyen-van-cu',
        name: 'Trục Đông Bắc: Tràng Tiền - Cầu Chương Dương - Nguyễn Văn Cừ',
        direction: 'North-East',
        bearingDeg: 60,
        segments: [
            'Tràng Tiền',
            'Trần Quang Khải',
            'Cầu Chương Dương',
            'Nguyễn Văn Cừ',
            'Ngô Gia Tự',
            'Cầu Đuống (QL1A cũ)'
        ],
        description: 'Trục huyết mạch nối lõi Hoàn Kiếm qua sông Hồng sang quận Long Biên, đi Bắc Ninh và Hải Phòng.',
        cognitiveTip: 'Đi từ Nhà Hát Lớn thẳng ra cầu Chương Dương, qua sông là vào ngay đại lộ Nguyễn Văn Cừ.'
    },
    {
        id: 'corridor-airport-vo-chi-cong',
        name: 'Trục Sân Bay Quốc Tế: Bưởi - Võ Chí Công - Cầu Nhật Tân - Võ Nguyên Giáp',
        direction: 'North-Airport',
        bearingDeg: 15,
        segments: [
            'Bưởi',
            'Võ Chí Công',
            'Cầu Nhật Tân',
            'Võ Nguyên Giáp',
            'Sân bay Quốc tế Nội Bài'
        ],
        description: 'Trục đối ngoại hiện đại nhất Thủ đô, rộng 8-10 làn xe, kết nối trung tâm thành phố với Sân bay Nội Bài trong 25 phút.',
        cognitiveTip: 'Chạy hướng Bắc 15°. Cầu Nhật Tân sừng sững với 5 tháp dây văng là mốc định vị không thể nhầm lẫn.'
    }
];
// 5. MẠNG LƯỚI Ô BÀN CỜ PHỐ PHÁP (ORTHOGONAL FRENCH GRID)
exports.HANOI_FRENCH_GRID_STREETS = [
    // Trục Đông - Tây (Song song //)
    {
        id: 'st-tran-hung-dao',
        name: 'Trần Hưng Đạo',
        type: 'french_street',
        category: 'path',
        district: 'Hoàn Kiếm',
        coords: { lat: 21.022, lng: 105.851 },
        bearingDeg: 95, // Đông - Tây
        isOneWay: false,
        description: 'Đại lộ hai chiều rợp bóng cây sấu cổ thụ, nối từ Ga Hà Nội (Lê Duẩn) sang Bệnh viện 108 (Trần Khánh Dư).',
        cognitiveTip: 'Đại lộ trục xương sống phía Nam Phố Pháp. Chạy song song (//) với Lý Thường Kiệt và Hai Bà Trưng.'
    },
    {
        id: 'st-ly-thuong-kiet',
        name: 'Lý Thường Kiệt',
        type: 'french_street',
        category: 'path',
        district: 'Hoàn Kiếm',
        coords: { lat: 21.024, lng: 105.852 },
        bearingDeg: 95,
        isOneWay: true,
        oneWayDirection: 'Đông sang Tây (từ Lê Thánh Tông sang Lê Duẩn)',
        description: 'Trục phố hành chính cổ điển với nhiều tòa biệt thự Pháp, một chiều cho ô tô hướng Đông → Tây.',
        cognitiveTip: 'BẪY 1 CHIỀU: Lý Thường Kiệt đi 1 chiều từ Nhà Hát Lớn sang Ga Hà Nội (ngược với Hai Bà Trưng).'
    },
    {
        id: 'st-hai-ba-trung',
        name: 'Hai Bà Trưng',
        type: 'french_street',
        category: 'path',
        district: 'Hoàn Kiếm',
        coords: { lat: 21.026, lng: 105.853 },
        bearingDeg: 95,
        isOneWay: false, // Một chiều đoạn đầu
        description: 'Chạy song song kẹp giữa Lý Thường Kiệt và Tràng Thi. Đi qua di tích Nhà tù Hỏa Lò và TAND Tối cao.',
        cognitiveTip: 'Đoạn từ Lê Duẩn sang Quán Sứ chỉ chạy 1 chiều Tây → Đông. Sau đó là 2 chiều.'
    },
    {
        id: 'st-trang-thi',
        name: 'Tràng Thi',
        type: 'french_street',
        category: 'path',
        district: 'Hoàn Kiếm',
        coords: { lat: 21.028, lng: 105.849 },
        bearingDeg: 95,
        isOneWay: true,
        oneWayDirection: 'Đông sang Tây (từ Hồ Gươm sang Cửa Nam)',
        description: 'Nối từ bờ Nam Hồ Gươm (Bà Triệu/Hàng Khay) thẳng sang ngã 5 Cửa Nam.',
        cognitiveTip: 'Một chiều xe hướng Đông sang Tây (hướng ra Cửa Nam).'
    },
    // Trục Bắc - Nam (Vuông góc ⟂)
    {
        id: 'st-hang-bai',
        name: 'Hàng Bài',
        type: 'french_street',
        category: 'path',
        district: 'Hoàn Kiếm',
        coords: { lat: 21.025, lng: 105.854 },
        bearingDeg: 185, // Bắc - Nam
        isOneWay: false,
        description: 'Nối từ bờ Nam Hồ Gươm (Tràng Tiền Plaza) xuống ngã tư Trần Hưng Đạo.',
        cognitiveTip: 'Trục nối tiếp thành Phố Huế khi đi qua ngã tư Trần Hưng Đạo.'
    },
    {
        id: 'st-pho-hue',
        name: 'Phố Huế',
        type: 'french_street',
        category: 'path',
        district: 'Hai Bà Trưng',
        coords: { lat: 21.018, lng: 105.853 },
        bearingDeg: 185,
        isOneWay: true,
        oneWayDirection: 'Bắc xuống Nam (chỉ đi 1 chiều từ Hàng Bài xuống Đại Cồ Việt)',
        description: 'Trục phố mua sắm sầm uất, 1 chiều tuyệt đối theo hướng Bắc → Nam.',
        cognitiveTip: 'CẶP 1 CHIỀU ĐỐI XỨNG KINH ĐIỂN: Phố Huế chỉ đi hướng Nam, muốn quay ngược lên phía Bắc phải đi đường Bà Triệu song song bên cạnh!'
    },
    {
        id: 'st-ba-trieu',
        name: 'Bà Triệu',
        type: 'french_street',
        category: 'path',
        district: 'Hoàn Kiếm - Hai Bà Trưng',
        coords: { lat: 21.020, lng: 105.850 },
        bearingDeg: 5, // Nam lên Bắc
        isOneWay: true,
        oneWayDirection: 'Nam lên Bắc (chỉ đi 1 chiều từ Đại Cồ Việt lên Hồ Gươm)',
        description: 'Trục một chiều đối xứng với Phố Huế, đón toàn bộ phương tiện từ Vành đai 1 lên Bờ Hồ.',
        cognitiveTip: 'CẶP 1 CHIỀU ĐỐI XỨNG: Bà Triệu 1 chiều lên Bắc, Phố Huế 1 chiều xuống Nam. Vuông góc với Trần Hưng Đạo, Lý Thường Kiệt.'
    },
    {
        id: 'st-quang-trung',
        name: 'Quang Trung',
        type: 'french_street',
        category: 'path',
        district: 'Hoàn Kiếm',
        coords: { lat: 21.022, lng: 105.848 },
        bearingDeg: 185,
        isOneWay: false,
        description: 'Chạy song song kẹp giữa Bà Triệu và Quán Sứ, nối từ Tràng Thi xuống hồ Thiền Quang.',
        cognitiveTip: 'Chạy thẳng xuống bờ hồ Thiền Quang, song song với Bà Triệu và Quán Sứ.'
    },
    {
        id: 'st-quan-su',
        name: 'Quán Sứ',
        type: 'french_street',
        category: 'path',
        district: 'Hoàn Kiếm',
        coords: { lat: 21.024, lng: 105.845 },
        bearingDeg: 185,
        isOneWay: false,
        description: 'Nối từ Thợ Nhuộm qua Chùa Quán Sứ, cắt ngang Hai Bà Trưng, Lý Thường Kiệt, Trần Hưng Đạo.',
        cognitiveTip: 'Trục Bắc Nam vuông góc (⟂) hoàn hảo với cả 3 đại lộ Đông Tây Phố Pháp.'
    },
    {
        id: 'st-phan-boi-chau',
        name: 'Phan Bội Châu',
        type: 'french_street',
        category: 'path',
        district: 'Hoàn Kiếm',
        coords: { lat: 21.024, lng: 105.842 },
        bearingDeg: 185,
        isOneWay: true,
        oneWayDirection: 'Bắc xuống Nam',
        description: 'Chạy sát ga Hà Nội, cắt ngang Trần Hưng Đạo và Lý Thường Kiệt.',
        cognitiveTip: 'Đi 1 chiều hướng Nam, nằm kẹp giữa Quán Sứ và đường Lê Duẩn.'
    }
];
// 6. ĐIỂM NEO THỊ GIÁC & CHÂN TRỜI (LANDMARKS & SKYLINE)
exports.HANOI_LANDMARKS = [
    // Skyline tầm xa (>3km)
    {
        id: 'lm-keangnam',
        name: 'Keangnam Landmark 72',
        alias: 'Tháp Đôi Keangnam (336m)',
        type: 'landmark',
        category: 'landmark',
        district: 'Nam Từ Liêm',
        coords: { lat: 21.017, lng: 105.784 },
        heightTier: 'skyline',
        description: 'Tòa nhà cao nhất Hà Nội (72 tầng), biểu tượng định hướng cực mạnh ở phía Tây - Tây Nam Thủ đô trên đường Phạm Hùng (Vành đai 3).',
        cognitiveTip: 'Bất cứ khi nào nhìn thấy Keangnam, bạn đang nhìn về hướng TÂY NAM của trung tâm.'
    },
    {
        id: 'lm-lotte-center',
        name: 'Lotte Center Hà Nội',
        alias: 'Tháp Lotte Liễu Giai (267m)',
        type: 'landmark',
        category: 'landmark',
        district: 'Ba Đình',
        coords: { lat: 21.032, lng: 105.812 },
        heightTier: 'skyline',
        description: 'Tòa nhà 65 tầng hình tà áo dài tại ngã tư Đào Tấn - Liễu Giai. Điểm neo chân trời phía Tây Bắc nội đô.',
        cognitiveTip: 'Nếu đứng ở Cầu Giấy nhìn thấy Lotte bên tay trái nghĩa là đang đi về phía Hồ Gươm (hướng Đông).'
    },
    {
        id: 'lm-technopark',
        name: 'TechnoPark Tower Ocean Park',
        alias: 'Tháp Biểu Tượng Phía Đông (186m)',
        type: 'landmark',
        category: 'landmark',
        district: 'Gia Lâm',
        coords: { lat: 20.995, lng: 105.945 },
        heightTier: 'skyline',
        description: 'Tháp thông minh phía bờ Đông sông Hồng, mốc nhận diện cho khu vực Gia Lâm - Long Biên.',
        cognitiveTip: 'Mốc neo thị giác phía ĐÔNG xa.'
    },
    // Điểm neo văn hóa & giao lộ cốt lõi
    {
        id: 'lm-lang-bac',
        name: 'Lăng Chủ Tịch Hồ Chí Minh',
        alias: 'Quảng Trường Ba Đình',
        type: 'landmark',
        category: 'landmark',
        district: 'Ba Đình',
        coords: { lat: 21.037, lng: 105.834 },
        heightTier: 'local',
        description: 'Trái tim chính trị của quốc gia, nằm trên đường Hùng Vương, đối diện Tòa nhà Quốc hội.',
        cognitiveTip: 'Định vị khu trung tâm hành chính Ba Đình, giáp Hoàng Thành Thăng Long và chùa Một Cột.'
    },
    {
        id: 'lm-nha-hat-lon',
        name: 'Nhà Hát Lớn Hà Nội',
        alias: 'Quảng Trường Cách Mạng Tháng Tám',
        type: 'landmark',
        category: 'landmark',
        district: 'Hoàn Kiếm',
        coords: { lat: 21.024, lng: 105.858 },
        heightTier: 'local',
        description: 'Công trình kiến trúc Phục Hưng Pháp tráng lệ (1911), điểm hội tụ của các trục Tràng Tiền, Lý Thường Kiệt, Phan Chu Trinh.',
        cognitiveTip: 'Cửa ngõ Đông Nam của Hồ Gươm, dẫn thẳng ra cầu Chương Dương và cầu Vĩnh Tuy.'
    },
    {
        id: 'lm-van-mieu',
        name: 'Văn Miếu - Quốc Tử Giám',
        alias: 'Trường Đại Học Đầu Tiên',
        type: 'landmark',
        category: 'landmark',
        district: 'Đống Đa',
        coords: { lat: 21.028, lng: 105.836 },
        heightTier: 'local',
        description: 'Nằm kẹp giữa 4 tuyến phố: Quốc Tử Giám, Văn Miếu, Tôn Đức Thắng, Nguyễn Thái Học.',
        cognitiveTip: 'Điểm neo phân định giữa quận Ba Đình, Hoàn Kiếm và quận Đống Đa.'
    },
    {
        id: 'lm-ga-ha-noi',
        name: 'Ga Hà Nội',
        alias: 'Ga Hàng Cỏ',
        type: 'landmark',
        category: 'landmark',
        district: 'Hoàn Kiếm - Đống Đa',
        coords: { lat: 21.025, lng: 105.840 },
        heightTier: 'local',
        description: 'Đầu mối đường sắt quốc gia trên đường Lê Duẩn, đối diện đường Trần Hưng Đạo.',
        cognitiveTip: 'Nằm ở điểm kết thúc phía Tây của đại lộ Trần Hưng Đạo và Lý Thường Kiệt.'
    },
    {
        id: 'lm-cho-dong-xuan',
        name: 'Chợ Đồng Xuân',
        alias: 'Đầu Mối Phố Cổ Hà Nội',
        type: 'landmark',
        category: 'landmark',
        district: 'Hoàn Kiếm',
        coords: { lat: 21.037, lng: 105.850 },
        heightTier: 'local',
        description: 'Chợ đầu mối lớn nhất khu phố cổ, nằm ở điểm kết thúc của trục Hàng Ngang - Hàng Đào - Hàng Đường.',
        cognitiveTip: 'Điểm neo cực Bắc của mạng lưới 36 Phố Phường, gần sát ga xe lửa Long Biên.'
    },
    {
        id: 'lm-svd-my-dinh',
        name: 'Sân Vận Động Quốc Gia Mỹ Đình',
        alias: 'Quần Thể Thể Thao Phía Tây',
        type: 'landmark',
        category: 'landmark',
        district: 'Nam Từ Liêm',
        coords: { lat: 21.020, lng: 105.764 },
        heightTier: 'local',
        description: 'Nằm ở cuối đại lộ Lê Đức Thọ, đối diện quảng trường đua F1 cũ.',
        cognitiveTip: 'Điểm neo cực Tây của khu đô thị mới Mỹ Đình.'
    },
    {
        id: 'lm-ben-xe-my-dinh',
        name: 'Bến xe Mỹ Đình',
        alias: 'Đầu Mối Xe Khách Tây Bắc',
        type: 'landmark',
        category: 'node',
        district: 'Nam Từ Liêm',
        coords: { lat: 21.029, lng: 105.778 },
        heightTier: 'local',
        description: 'Nằm ngay ngã tư Phạm Hùng - Tôn Thất Thuyết trên Vành đai 3.',
        cognitiveTip: 'Điểm neo giao thông quan trọng bậc nhất trên trục Vành đai 3 phía Tây.'
    },
    {
        id: 'lm-ben-xe-giap-bat',
        name: 'Bến xe Giáp Bát',
        alias: 'Đầu Mối Xe Khách Phía Nam',
        type: 'landmark',
        category: 'node',
        district: 'Hoàng Mai',
        coords: { lat: 20.985, lng: 105.841 },
        heightTier: 'local',
        description: 'Nằm trên đường Giải Phóng, cửa ngõ phía Nam Hà Nội.',
        cognitiveTip: 'Nằm kẹp giữa ngã tư Vọng và đường Vành đai 3 trên trục xuyên tâm phía Nam.'
    }
];
// 7. NÚT GIAO ĐA TẦNG PHỨC TẠP (JUNCTIONS & INTERCHANGES)
exports.HANOI_JUNCTIONS = [
    {
        id: 'junc-nga-tu-so',
        name: 'Ngã Tư Sở',
        alias: 'Nút Giao Cửa Ngõ Tây Nam Lịch Sử',
        type: 'junction',
        category: 'node',
        district: 'Đống Đa - Thanh Xuân',
        coords: { lat: 21.002, lng: 105.817 },
        connectedStreets: ['Nguyễn Trãi', 'Tây Sơn', 'Đường Láng', 'Trường Chinh'],
        description: 'Nút giao giữa Vành đai 2 và trục hướng tâm Tây Nam. Có cầu vượt thép Tây Sơn - Nguyễn Trãi và đường trên cao Vành đai 2 đáp xuống.',
        cognitiveTip: 'Điểm nút thần kinh giao thông: Đi thẳng Tây Sơn sang Nguyễn Trãi; rẽ phải sang Đường Láng; rẽ trái sang Trường Chinh.'
    },
    {
        id: 'junc-o-cho-dua',
        name: 'Ngã Sáu Ô Chợ Dừa',
        alias: 'Nút Giao 6 Nhánh Vành Đai 1',
        type: 'junction',
        category: 'node',
        district: 'Đống Đa',
        coords: { lat: 21.018, lng: 105.828 },
        connectedStreets: ['Xã Đàn', 'Khâm Thiên', 'Tôn Đức Thắng', 'Nguyễn Lương Bằng', 'Hoàng Cầu', 'Ô Chợ Dừa mới'],
        description: 'Một trong những nút giao đồng mức phức tạp nhất Việt Nam với 6 ngả đường lớn hội tụ.',
        cognitiveTip: 'Trục Vành đai 1 (Xã Đàn ↔ Hoàng Cầu) cắt chéo trục hướng tâm (Tôn Đức Thắng ↔ Nguyễn Lương Bằng).'
    },
    {
        id: 'junc-nga-tu-vong',
        name: 'Ngã Tư Vọng',
        alias: 'Nút Giao Đa Tầng Nam Trung Tâm',
        type: 'junction',
        category: 'node',
        district: 'Hai Bà Trưng - Đống Đa - Thanh Xuân',
        coords: { lat: 20.998, lng: 105.841 },
        connectedStreets: ['Giải Phóng', 'Trường Chinh', 'Đại La'],
        description: 'Nút giao 4 tầng: hầm đi bộ, mặt đất (Giải Phóng - Đại La), cầu vượt thép Trường Chinh - Đại La và đường trên cao Vành đai 2 bên trên.',
        cognitiveTip: 'Điểm giao giữa Vành đai 2 và trục hướng tâm phía Nam Giải Phóng.'
    },
    {
        id: 'junc-trung-hoa',
        name: 'Nút Giao Trung Hòa',
        alias: 'Nút Giao 4 Tầng Hiện Đại Nhất',
        type: 'junction',
        category: 'node',
        district: 'Cầu Giấy - Thanh Xuân - Nam Từ Liêm',
        coords: { lat: 21.009, lng: 105.792 },
        connectedStreets: ['Trần Duy Hưng', 'Đại lộ Thăng Long', 'Phạm Hùng', 'Khuất Duy Tiến'],
        description: 'Nút giao giữa Vành đai 3 và Đại lộ Thăng Long gồm hầm chui Trần Duy Hưng, mặt đất, cầu vượt nhánh và cao tốc trên cao Vành đai 3.',
        cognitiveTip: 'Điểm bản lề kết nối trung tâm thành phố với chuỗi đô thị phía Tây Hòa Lạc.'
    },
    {
        id: 'junc-thanh-xuan',
        name: 'Nút Giao Thanh Xuân',
        alias: 'Ngã Tư Khuất Duy Tiến - Nguyễn Trãi',
        type: 'junction',
        category: 'node',
        district: 'Thanh Xuân',
        coords: { lat: 20.992, lng: 105.801 },
        connectedStreets: ['Nguyễn Trãi', 'Khuất Duy Tiến', 'Nguyễn Xiển'],
        description: 'Nút giao 4 tầng: Hầm chui Nguyễn Trãi, mặt đất, Metro Cát Linh - Hà Đông trên cao và cao tốc trên cao Vành đai 3 trên đỉnh.',
        cognitiveTip: 'Điểm giao cắt giữa Vành đai 3 và trục xuyên tâm Tây Nam Nguyễn Trãi.'
    },
    {
        id: 'junc-cau-giay',
        name: 'Nút Giao Cầu Giấy - Voi Phục',
        alias: 'Cửa Ngõ Phía Tây Cổ Điển',
        type: 'junction',
        category: 'node',
        district: 'Ba Đình - Cầu Giấy',
        coords: { lat: 21.029, lng: 105.804 },
        connectedStreets: ['Kim Mã', 'Cầu Giấy', 'Đường Láng', 'Bưởi'],
        description: 'Nơi kết thúc của đường Kim Mã và Đường Láng, điểm bắt đầu của đường Cầu Giấy và đường Bưởi.',
        cognitiveTip: 'Điểm giao giữa Vành đai 2 và trục hướng tâm Cầu Giấy - Kim Mã.'
    }
];
// TỔNG HỢP TOÀN BỘ THỰC THỂ
exports.ALL_HANOI_ENTITIES = [
    ...exports.HANOI_WATER_EDGES,
    ...exports.HANOI_BRIDGES,
    ...exports.HANOI_RING_ROADS,
    ...exports.HANOI_FRENCH_GRID_STREETS,
    ...exports.HANOI_LANDMARKS,
    ...exports.HANOI_JUNCTIONS
];
// 8. TÍNH TOÁN QUY LUẬT MẶT TRỜI TẠI HÀ NỘI (VĨ ĐỘ ~21.0285°N)
/**
 * Trả về góc phương vị mặt trời (Azimuth) tại Hà Nội theo giờ trong ngày (0 - 24)
 * 0° = Bắc, 90° = Đông, 180° = Nam, 270° = Tây
 */
function getHanoiSolarAzimuth(hour) {
    if (hour < 5 || hour > 19)
        return 0; // Đêm
    // Bảng xấp xỉ góc phương vị thực tế trung bình tại Hà Nội (vĩ độ 21°N)
    const SOLAR_CURVE = {
        5: 75, // Rạng đông (Đông Đông Bắc)
        6: 85, // Mặt trời mọc (Gần chính Đông)
        7: 95, // Nắng sớm Đông Nam
        8: 108,
        9: 122,
        10: 138,
        11: 158,
        12: 180, // Chính Nam (hầu hết các tháng trong năm tại vĩ độ 21°N trừ chính hạ)
        13: 205,
        14: 225, // Tây Nam
        15: 242,
        16: 258, // Nắng xiên chiều Tây Tây Nam
        17: 272, // Hoàng hôn (Chính Tây)
        18: 285 // Chạng vạng (Tây Tây Bắc)
    };
    const baseHour = Math.floor(hour);
    const frac = hour - baseHour;
    const curr = SOLAR_CURVE[baseHour] ?? 180;
    const next = SOLAR_CURVE[baseHour + 1] ?? curr;
    return Math.round(curr + (next - curr) * frac);
}
/**
 * Trả về hướng bóng đổ của một tòa nhà hoặc người đứng
 * Hướng bóng luôn ngược 180° so với hướng mặt trời
 */
function getHanoiShadowBearing(hour) {
    const sunAzimuth = getHanoiSolarAzimuth(hour);
    return (sunAzimuth + 180) % 360;
}
/**
 * Quy đổi góc phương vị (0 - 360) ra tên 8 hướng chính
 */
function bearingToCardinalName(bearing) {
    const normalized = (bearing % 360 + 360) % 360;
    if (normalized >= 337.5 || normalized < 22.5)
        return 'Bắc';
    if (normalized >= 22.5 && normalized < 67.5)
        return 'Đông Bắc';
    if (normalized >= 67.5 && normalized < 112.5)
        return 'Đông';
    if (normalized >= 112.5 && normalized < 157.5)
        return 'Đông Nam';
    if (normalized >= 157.5 && normalized < 202.5)
        return 'Nam';
    if (normalized >= 202.5 && normalized < 247.5)
        return 'Tây Nam';
    if (normalized >= 247.5 && normalized < 292.5)
        return 'Tây';
    return 'Tây Bắc';
}
// 9. QUAN HỆ HÌNH HỌC & ĐỊNH HƯỚNG GIỮA CÁC THỰC THỂ
exports.HANOI_RELATIONS = [
    // Song song (//)
    {
        id: 'rel-par-1',
        type: 'parallel',
        entityAId: 'st-tran-hung-dao',
        entityBId: 'st-ly-thuong-kiet',
        description: 'Trần Hưng Đạo // Lý Thường Kiệt',
        explanation: 'Hai đại lộ thời Pháp chạy song song theo trục Đông - Tây, cách nhau khoảng 250m.',
        cognitiveKey: 'PARALLEL_FRENCH_EAST_WEST'
    },
    {
        id: 'rel-par-2',
        type: 'parallel',
        entityAId: 'st-ly-thuong-kiet',
        entityBId: 'st-hai-ba-trung',
        description: 'Lý Thường Kiệt // Hai Bà Trưng',
        explanation: 'Hai phố chạy song song tuyệt đối theo trục Đông - Tây.',
        cognitiveKey: 'PARALLEL_FRENCH_EAST_WEST'
    },
    {
        id: 'rel-par-3',
        type: 'parallel',
        entityAId: 'st-ba-trieu',
        entityBId: 'st-pho-hue',
        description: 'Bà Triệu // Phố Huế',
        explanation: 'Cặp đường song song Bắc - Nam đối xứng nhau qua ô phố, tạo thành cặp giao thông 1 chiều ngược hướng kinh điển.',
        cognitiveKey: 'PAIRED_ONEWAY_NORTH_SOUTH'
    },
    {
        id: 'rel-par-4',
        type: 'parallel',
        entityAId: 'st-ba-trieu',
        entityBId: 'st-quang-trung',
        description: 'Bà Triệu // Quang Trung',
        explanation: 'Hai trục Bắc - Nam song song kẹp hồ Thiền Quang.',
        cognitiveKey: 'PARALLEL_FRENCH_NORTH_SOUTH'
    },
    {
        id: 'rel-par-5',
        type: 'parallel',
        entityAId: 'corridor-sw-nguyen-trai',
        entityBId: 'corridor-sw-lang-ha',
        description: 'Trục Nguyễn Trãi // Trục Lê Văn Lương',
        explanation: 'Hai đại lộ hướng tâm Tây Nam chạy song song kẹp khu đô thị Trung Hòa - Nhân Chính.',
        cognitiveKey: 'PARALLEL_RADIAL_RADIAL'
    },
    // Vuông góc (⟂)
    {
        id: 'rel-perp-1',
        type: 'perpendicular',
        entityAId: 'st-tran-hung-dao',
        entityBId: 'st-ba-trieu',
        description: 'Trần Hưng Đạo ⟂ Bà Triệu',
        explanation: 'Trần Hưng Đạo chạy Đông - Tây vuông góc chính xác 90° với Bà Triệu chạy Nam - Bắc.',
        cognitiveKey: 'PERP_FRENCH_GRID'
    },
    {
        id: 'rel-perp-2',
        type: 'perpendicular',
        entityAId: 'st-ly-thuong-kiet',
        entityBId: 'st-hang-bai',
        description: 'Lý Thường Kiệt ⟂ Hàng Bài',
        explanation: 'Trục Đông - Tây giao cắt vuông góc với trục Nam - Bắc ngay phía Nam Bờ Hồ.',
        cognitiveKey: 'PERP_FRENCH_GRID'
    },
    {
        id: 'rel-perp-3',
        type: 'perpendicular',
        entityAId: 'st-hai-ba-trung',
        entityBId: 'st-quan-su',
        description: 'Hai Bà Trưng ⟂ Quán Sứ',
        explanation: 'Giao lộ ngã tư vuông vức trước cổng TAND Tối cao và Bệnh viện K.',
        cognitiveKey: 'PERP_FRENCH_GRID'
    },
    {
        id: 'rel-perp-4',
        type: 'perpendicular',
        entityAId: 'ring-1',
        entityBId: 'corridor-south-giai-phong',
        description: 'Vành đai 1 (Đại Cồ Việt - Xã Đàn) ⟂ Trục Giải Phóng - Lê Duẩn',
        explanation: 'Giao cắt vuông góc tại ngã tư Hầm Kim Liên.',
        cognitiveKey: 'PERP_RING_RADIAL'
    },
    {
        id: 'rel-perp-5',
        type: 'perpendicular',
        entityAId: 'ring-3',
        entityBId: 'corridor-sw-nguyen-trai',
        description: 'Vành đai 3 (Khuất Duy Tiến) ⟂ Trục Nguyễn Trãi',
        explanation: 'Giao cắt vuông góc tại nút giao 4 tầng Thanh Xuân.',
        cognitiveKey: 'PERP_RING_RADIAL'
    }
];
exports.HANOI_THEORY_CHAPTERS = [
    {
        id: 'chapter-lynch-framework',
        chapterNumber: 1,
        title: 'Giải Mã Bản Đồ Nhận Thức: Khung 5 Thành Phần Kevin Lynch',
        subtitle: 'Vì sao nhớ tên từng con phố là vô ích, và bộ não cần "bản đồ xương sống" thế nào?',
        badge: 'Cơ Sở Khoa Học Nhận Thức',
        iconName: 'Brain',
        readTimeMin: 6,
        cognitiveMechanism: 'Lập bản đồ nhận thức hồi hải mã (Hippocampal Cognitive Map) & Mã hóa dạng lưới (Grid Cells)',
        keyTakeaways: [
            'Đừng học thuộc lòng danh bạ tên phố rời rạc; hãy neo vào 5 loại thành phần không gian.',
            'Paths (Đường đi), Edges (Ranh giới), Districts (Vùng), Nodes (Nút giao), Landmarks (Điểm neo).',
            'Bộ não người định hướng thông qua quan hệ tương đối giữa các thành phần chứ không phải tọa độ GPS số học.'
        ],
        contentMarkdown: `
### 1. Tại sao hầu hết mọi người đều "Mù đường" ở Hà Nội?

Khi mới đến hoặc thậm chí sống nhiều năm ở Hà Nội, phần lớn mọi người gặp phải hiện tượng **"Nhớ cục bộ" (Local Fragmentation)**: Bạn biết rõ đường từ nhà đến công ty, nhớ một vài quán ăn ở phố cổ, nhưng hễ bị thả vào một ngã ba lạ hoặc gặp một đoạn cấm rẽ giờ cao điểm là lập tức mất phương hướng, phải bật Google Maps.

Nguyên nhân là do bộ não bị bắt ép **học vẹt tên phố** như những chuỗi văn bản rời rạc thay vì xây dựng một **Bản đồ nhận thức không gian (Cognitive Map)** trong hồi hải mã (*Hippocampus*).

### 2. Mô hình 5 Thành Phần Không Gian Đô Thị của Kevin Lynch

Trong tác phẩm kinh điển *The Image of the City* (1960), giáo sư Kevin Lynch (Đại học MIT) đã chứng minh rằng hình ảnh một thành phố trong tâm trí cư dân luôn được xây dựng từ **5 nhóm thực thể cơ bản**:

1. **Paths (Trục chuyển động - Đường dẫn):**
   * Là các kênh chuyển động của người đi đường: Phố, đại lộ, đường vành đai, đường trên cao, cầu, tuyến metro.
   * *Đặc trưng tại Hà Nội:* Các trục vành đai đồng tâm và các trục xuyên tâm nối tiếp đổi tên liên tục qua mỗi ngã tư.
2. **Edges (Ranh giới - Biên phân cách):**
   * Những thực thể tuyến tính chia cắt không gian mà bạn không thể băng qua tùy tiện: Sông Hồng, Sông Tô Lịch, bờ Hồ Tây, dải đê, tuyến đường sắt Bắc Nam.
   * *Ý nghĩa định hướng:* Edges đóng vai trò là **"bức tường quy chiếu"**. Bạn luôn biết mình đang ở bên trong hay bên ngoài bờ sông, phía trước hay phía sau tuyến đường sắt.
3. **Districts (Vùng / Phân khu nhận thức):**
   * Các vùng không gian hai chiều có đặc trưng hình thái hoặc văn hóa đồng nhất: *Khu Phố Cổ* (nhỏ, ziczac, phố Hàng), *Khu Phố Pháp* (ô bàn cờ, vuông vức, rợp bóng sấu), *Khu Đô Thị Mới Cầu Giấy - Mỹ Đình* (đại lộ to, ô nhà cao tầng).
4. **Nodes (Điểm nút - Điểm quyết định hành vi):**
   * Các điểm giao thoa chiến lược nơi người đi đường phải đưa ra quyết định chuyển hướng: Ngã Tư Sở, Ngã Sáu Ô Chợ Dừa, Ngã Tư Vọng, Ngã năm Cửa Nam, vòng xuyến chân cầu.
   * *Đặc trưng:* Nơi tập trung hầm chui, cầu vượt thép đa tầng - nơi người lái xe dễ đi nhầm làn dẫn đến lạc đường nhất.
5. **Landmarks (Điểm neo thị giác / Mốc biểu tượng):**
   * Các vật thể trực quan nổi bật giúp xác định vị trí tức thì: *Keangnam Landmark 72* (mốc phía Tây), *Lotte Center* (mốc Ba Đình), *Lăng Bác*, *Tháp Rùa Hồ Gươm*, *Nhà Hát Lớn*, *Ga Hà Nội*.
   * Điểm neo tầm xa (*Skyline*) nhìn thấy từ cách 5km giúp bạn định vị phương hướng mà không cần la bàn.
`
    },
    {
        id: 'chapter-dual-frames',
        chapterNumber: 2,
        title: 'Hệ Quy Chiếu Kép: Allocentric (Nhìn Từ Trên) vs Egocentric (Nhìn Từ Tay Lái)',
        subtitle: 'Nghệ thuật chuyển đổi mượt mà giữa bản đồ phẳng và góc nhìn thứ nhất dưới mặt đất',
        badge: 'Chiến Lược Não Bộ',
        iconName: 'Compass',
        readTimeMin: 7,
        cognitiveMechanism: 'Phối hợp Vỏ não đỉnh (Parietal Cortex - Góc nhìn cá nhân) & Vỏ não khứu trong (Entorhinal Cortex - Lưới tọa độ)',
        keyTakeaways: [
            'Hệ Allocentric: Bản đồ thế giới từ trên cao (Đông - Tây - Nam - Bắc, Song song, Vuông góc).',
            'Hệ Egocentric: Góc nhìn cá nhân ngoài phố (Trái, Phải, Trước mặt, Hướng bóng nắng, Biển cấm).',
            'Người lái xe siêu đẳng luôn xoay góc nhìn Egocentric để khớp với bức tranh Allocentric trong đầu trong tích tắc.'
        ],
        contentMarkdown: `
### 1. Cuộc xung đột giữa "Xem bản đồ" và "Đứng giữa ngã tư"

Có bao giờ bạn xem bản đồ trên điện thoại thấy rất dễ hiểu, nhưng khi bước ra ngoài đường, đứng giữa một bùng binh đông đúc thì lại không biết phải rẽ vào lối nào? Đó là sự chênh lệch giữa hai hệ quy chiếu nhận thức:

#### A. Hệ quy chiếu Bản đồ (Allocentric Frame - Hướng Ngoại / Tọa Độ Toàn Cục)
* **Góc nhìn:** Nhìn từ trên trời nhìn xuống (Bird's Eye View).
* **Trục tham chiếu:** Cố định vào phương hướng địa lý: **Bắc ở trên, Nam ở dưới, Đông bên phải, Tây bên trái**.
* **Mối quan hệ:** Quan hệ khách quan giữa các đối tượng: *"Đường Trần Hưng Đạo song song với Lý Thường Kiệt"*, *"Hồ Gươm nằm ở phía Đông của Ga Hà Nội"*.

#### B. Hệ quy chiếu Góc nhìn Thứ nhất (Egocentric Frame - Hướng Nội / Tọa Độ Cá Nhân)
* **Góc nhìn:** Nhìn ngang tầm mắt từ ghế lái xe máy hoặc ô tô.
* **Trục tham chiếu:** Lấy chính **cơ thể bạn làm tâm**: *Trước mặt, sau lưng, bên trái, bên phải*.
* **Mối quan hệ:** Quan hệ chủ quan: *"Tòa nhà Lotte đang ở phía trước chếch 30° bên phải tay lái của tôi"*, *"Nắng chiều đang rọi chói mắt từ bên trái"*.

### 2. Thuật toán Mental Rotation (Xoay Bản Đồ Tâm Tưởng)

Khi đi đường trong thực tế, hướng bạn di chuyển hiếm khi trùng với hướng Bắc. Nếu bạn đang chạy xe trên đường **Tôn Đức Thắng hướng về Ngã Tư Sở** (tức đang đi về hướng Tây Nam), thì:
* Hướng **Trước mặt** của bạn là Tây Nam.
* Hướng **Bên tay phải** của bạn là Tây Bắc (khu Giảng Võ, Cát Linh).
* Hướng **Bên tay trái** của bạn là Đông Nam (khu Xã Đàn, Khâm Thiên).

Nếu không có khả năng **Mental Rotation**, bạn sẽ phải dừng xe lại, xoay điện thoại vòng vòng để hiểu bản đồ. Bài tập Hanoi Cognitive Navigation được thiết kế có các cấp độ **Xoay Bản Đồ Ngẫu Nhiên (Rotated Map)** nhằm buộc não bạn ngắt sự phụ thuộc vào hướng Bắc cố định và thành thạo kỹ năng xoay trục tâm tưởng 360°.
`
    },
    {
        id: 'chapter-rings-and-radials',
        chapterNumber: 3,
        title: 'Khung Xương Vành Đai & Trục Xuyên Tâm: Cấu Trúc Mạng Nhện Đồng Tâm',
        subtitle: 'Nắm chắc 3 Vành đai và 8 Trục hướng tâm để không bao giờ bị lạc giữa biển phố',
        badge: 'Xương Sống Không Gian',
        iconName: 'Maximize2',
        readTimeMin: 8,
        cognitiveMechanism: 'Tư duy Chunking phân tầng (Hierarchical Chunking) & Mạng nơ-ron phân nhánh',
        keyTakeaways: [
            'Hà Nội có cấu trúc Mạng Nhện Đồng Tâm (Radial-Ring), không phải ô cờ bàn vuông tuyệt đối.',
            'Vành đai 1 ôm lõi lịch sử; Vành đai 2 khép kín kèm đường trên cao; Vành đai 3 là cao tốc huyết mạch liên tỉnh.',
            'Mọi chuyến đi đều là bài toán: Đi hướng tâm vào trong, đi ly tâm ra ngoài, hay đi vòng trên vành đai để tránh kẹt xe.'
        ],
        contentMarkdown: `
### 1. Cấu trúc Đô thị Mạng Nhện Đồng Tâm (Radial-Ring Network)

Khác với New York hay Barcelona được quy hoạch theo ô bàn cờ vuông vức (*Grid Plan*), Hà Nội phát triển dựa trên **Cấu trúc Mạng nhện đồng tâm (Radial-Ring)**:
* Tâm điểm là khu vực **Hồ Gươm - Ba Đình**.
* Các **Trục Xuyên Tâm (Radials)** như những nan hoa bánh xe tỏa ra 8 hướng đi các tỉnh.
* Các **Đường Vành Đai (Rings)** như những vòng tròn đồng tâm cắt ngang qua toàn bộ các nan hoa.

### 2. Bóc tách 3 Vành Đai Huyết Mạch

#### Vành Đai 1: Tuyến Cửa Ô Lịch Sử
* **Chuỗi phố liên hoàn:** \`Trần Khát Chân\` → \`Đại Cồ Việt\` → *(qua Hầm Kim Liên)* → \`Xã Đàn\` → \`Ô Chợ Dừa\` → \`Hoàng Cầu\` → \`Yên Lãng\` → \`Đường Láng / Bưởi\`.
* **Vai trò:** Vành đai phân định lõi nội thành cũ. Đi qua các cửa ô lịch sử bảo vệ kinh thành Thăng Long xưa.

#### Vành Đai 2: Vành Đai Khép Kín & Cao Tốc Trên Cao
* **Chuỗi phố liên hoàn:** \`Cầu Vĩnh Tuy\` → \`Minh Khai\` → \`Đại La\` → \`Trường Chinh\` → \`Ngã Tư Sở\` → \`Đường Láng\` → \`Cầu Giấy\` → \`Bưởi\` → \`Võ Chí Công\` → \`Cầu Nhật Tân\`.
* **Kỳ tích giao thông:** Tuyến đường trên cao từ Cầu Vĩnh Tuy qua Ngã Tư Vọng đến Ngã Tư Sở cho phép xe hơi chạy 80km/h, vượt qua 3 điểm nghẽn kẹt xe kinh hoàng nhất Hà Nội mà không phải dừng đèn đỏ nào.

#### Vành Đai 3: Trục Cao Tốc Đô Thị CT.20
* **Chuỗi phố liên hoàn:** \`Cầu Thăng Long\` → \`Phạm Văn Đồng\` → \`Phạm Hùng\` → \`Khuất Duy Tiến\` → \`Nguyễn Xiển\` → \`Nghiêm Xuân Yêm\` → \`Cầu Thanh Trì\`.
* **Đặc tính:** Vành đai bao bọc toàn bộ khu đô thị mở rộng phía Tây và Nam, đón toàn bộ xe tải hạng nặng và xe khách liên tỉnh.

### 3. Quy luật Vàng Khi Đi Đường: "Cắt Vành Đai Nào?"

Khi cần di chuyển từ điểm A sang điểm B ở Hà Nội, câu hỏi đầu tiên người có bản đồ nhận thức tự đặt ra trong đầu **không phải là đi phố nào**, mà là:
1. *Điểm A nằm ở vành đai mấy? Điểm B nằm ở vành đai mấy?*
2. *Nếu hai điểm cùng nằm gần một vành đai:* Đi men theo đường vành đai luôn nhanh hơn gấp 3 lần so với đâm xuyên qua ruột thành phố.
3. *Nếu phải đi từ ngoài vào tâm:* Chọn 1 trong 8 trục xuyên tâm thẳng nhất để tiến vào.
`
    },
    {
        id: 'chapter-french-grid-and-oneway',
        chapterNumber: 4,
        title: 'Ô Bàn Cờ Phố Pháp, 36 Phố Phường & Nghệ Thuật Tránh Bẫy Một Chiều',
        subtitle: 'Giải mã ma trận song song // và vuông góc ⟂ cùng các cặp đường đối xứng kinh điển',
        badge: 'Hình Học Không Gian',
        iconName: 'Grid',
        readTimeMin: 8,
        cognitiveMechanism: 'Phân tích quan hệ hình học RFT (Relational Frame Theory: Equivalence & Opposition)',
        keyTakeaways: [
            'Khu Phố Pháp (Hoàn Kiếm) sở hữu lưới ô bàn cờ chuẩn mực: Trục Đông-Tây // và Trục Bắc-Nam ⟂.',
            'Cặp đường một chiều đối xứng: Phố Huế (đi Nam) cặp với Bà Triệu (đi Bắc).',
            'Khi lỡ đi quá ngã tư ở đường 1 chiều, hãy rẽ vào phố vuông góc ⟂ để sang đường song song // lộn ngược lại.'
        ],
        contentMarkdown: `
### 1. Ma trận Hình học Phố Pháp (French Colonial Grid)

Phía Nam Hồ Gươm là khu vực duy nhất của Hà Nội được người Pháp quy hoạch theo lưới hình học ô cờ nghiêm ngặt:

#### Các trục Đông - Tây chạy song song (//) với nhau:
* \`Trần Hưng Đạo // Lý Thường Kiệt // Hai Bà Trưng // Tràng Thi\`
* Độ lệch góc phương vị giữa các đường này chỉ $< 5^\circ$ (chạy lệch nhẹ khoảng $95^\circ$ Đông - Tây).

#### Các trục Bắc - Nam chạy song song (//) và cắt vuông góc ($\perp$) nhóm trên:
* \`Hàng Bài // Bà Triệu // Quang Trung // Quán Sứ // Phan Bội Châu\`
* Góc giao cắt giữa hai nhóm luôn dao động từ $85^\circ$ đến $95^\circ$, tạo nên những ngã tư vuông vức với tầm nhìn thoáng đãng.

### 2. Bẫy Một Chiều Kinh Điển & Cặp Đường Đối Xứng

Hà Nội nổi tiếng với các "ma trận một chiều" khiến người ngoại tỉnh dễ bị phạt hoặc đi lạc hàng kilomet. Hãy ghi nhớ các cặp đối xứng bất biến sau:

#### Cặp đối xứng Phố Huế ↔ Bà Triệu:
* **Phố Huế:** Chỉ cho phép chạy một chiều từ **Bắc xuống Nam** (từ Hàng Bài chạy xuống ngã tư Đại Cồ Việt).
* **Bà Triệu:** Chỉ cho phép chạy một chiều từ **Nam lên Bắc** (từ Đại Cồ Việt chạy thẳng lên bờ Nam Hồ Gươm).
* *Quy tắc tư duy:* Đang ở Bờ Hồ muốn xuống Bạch Mai/Giải Phóng thì đi Phố Huế. Đang ở Bách Khoa/Đại Cồ Việt muốn lên Bờ Hồ thì đi Bà Triệu.

#### Cặp Lý Thường Kiệt ↔ Hai Bà Trưng:
* **Lý Thường Kiệt:** Một chiều cho ô tô hướng **Đông sang Tây** (từ Lê Thánh Tông sang Lê Duẩn).
* **Hai Bà Trưng:** Chiều ngược lại (đoạn đầu 1 chiều hướng Tây sang Đông).

### 3. Chiến Thuật "Thoát Hiểm Hình Học" Khi Gặp Đường Một Chiều
Khi bạn đang đi trên một đường và phát hiện biển cấm đi tiếp hoặc muốn quay ngược lại:
1. **Tuyệt đối không quay đầu đi lùi** (nguy hiểm và vi phạm giao thông).
2. Hãy **rẽ phải hoặc rẽ trái vào ngã tư vuông góc ($\perp$) gần nhất**.
3. Đi hết 1 block phố (~150-200m) đến ngã tư tiếp theo.
4. Rẽ vào con đường **song song (//)** đang có chiều lưu thông ngược lại. Bạn đã hoàn thành một vòng chữ **U** hoàn hảo trong không gian!
`
    },
    {
        id: 'chapter-sun-and-skyline',
        chapterNumber: 5,
        title: 'Định Vị Bằng Mặt Trời & Điểm Neo Chân Trời: Lái Xe Không Cần GPS',
        subtitle: 'Đọc hướng nắng theo giờ tại vĩ độ Hà Nội 21.03°N và ngắm các tòa tháp cao tầng',
        badge: 'Thực Chiến Môi Trường',
        iconName: 'Sun',
        readTimeMin: 9,
        cognitiveMechanism: 'Tích hợp đa giác quan (Cross-modal Visual-Spatial Triangulation) & La bàn mặt trời sinh học',
        keyTakeaways: [
            'Tại Hà Nội (21.03°N): Sáng mặt trời ở hướng Đông/Đông Nam; Chiều mặt trời ở hướng Tây/Tây Nam.',
            'Nếu 16h30 nắng chiếu thẳng mặt, bạn đang đi về hướng Tây (Nguyễn Trãi, Xuân Thủy, Trần Duy Hưng).',
            'Keangnam Landmark 72 sừng sững ở phía Tây Nam; Lotte Center ở phía Tây Bắc Ba Đình.'
        ],
        contentMarkdown: `
### 1. La Bàn Mặt Trời (Solar Compass) Tại Vĩ Độ Hà Nội (~21.0285°N)

Mặt trời là chiếc la bàn miễn phí và chuẩn xác nhất trần đời nếu bạn nắm được góc phương vị (*Azimuth*) theo giờ trong ngày:

| Khung Giờ | Góc Phương Vị (Azimuth) | Hướng Mặt Trời | Hướng Bóng Đổ Ngược Lại | Ứng Dụng Thực Chiến Khi Lái Xe |
| :--- | :--- | :--- | :--- | :--- |
| **06:30 - 08:30 (Sáng)** | $85^\circ - 110^\circ$ | **Đông / Đông Nam** | Đổ dài về phía **Tây / Tây Bắc** | Đi bị nắng chói mắt $\rightarrow$ đang đi về hướng Hồ Gươm, Sông Hồng, Long Biên. |
| **11:30 - 13:00 (Trưa)** | $160^\circ - 190^\circ$ | **Chính Nam** *(hầu hết trong năm)* | Bóng ngắn dưới chân xe | Mặt trời ở trên đỉnh đầu hơi chếch Nam. |
| **15:30 - 17:30 (Chiều)** | $245^\circ - 275^\circ$ | **Tây / Tây Nam** | Đổ dài về phía **Đông / Đông Bắc** | Đi bị nắng chói mắt $\rightarrow$ đang đi về phía Cầu Giấy, Mỹ Đình, Hà Đông. |

#### Bài toán mẫu thực tế:
Bạn tan làm lúc **17h00 chiều**. Bạn dắt xe ra khỏi ngõ và không nhớ mình đang quay mặt đi đâu. Bạn thấy:
1. Ánh hoàng hôn vàng rực đang chiếu thẳng vào **bên vai trái** của bạn.
2. Suy ra: Hướng bên trái là hướng **Tây**.
3. Do đó: Bạn đang nhìn thẳng về hướng **Bắc**! Nếu đi tiếp bạn sẽ tiến về phía Hồ Tây hoặc Sông Hồng.

---

### 2. Điểm Neo Chân Trời (Skyline Landmarks Triangulation)

Khi đi trong nội đô, các tòa nhà chọc trời vượt lên trên mái nhà phố đóng vai trò như những ngọn hải đăng:

#### Keangnam Landmark 72 (336m - Nam Từ Liêm):
* **Vị trí địa lý:** Nằm trên trục Vành đai 3 (đường Phạm Hùng), cửa ngõ Tây Nam.
* **Quy tắc neo:** Nếu bạn nhìn thấy Keangnam ở phía trước mặt, bạn đang nhìn về hướng **Tây Nam**. Nếu Keangnam nằm sau lưng, bạn đang tiến về trung tâm thành phố (hướng Đông Bắc).

#### Lotte Center Hà Nội (267m - Ba Đình):
* **Vị trí địa lý:** Nằm tại ngã tư Đào Tấn - Liễu Giai.
* **Quy tắc neo:** Điểm mốc nhận diện cho khu vực Ba Đình - Cầu Giấy. Thấy tháp Lotte sừng sững bên tay phải khi đang đi trên đường Kim Mã nghĩa là bạn đang chạy theo hướng Đông $\rightarrow$ Tây ra Cầu Giấy.
`
    },
    {
        id: 'chapter-corridors-chains',
        chapterNumber: 6,
        title: 'Tư Duy Đọc Trục: "Một Đường Nhiều Tên" (Corridor Chains)',
        subtitle: 'Bí quyết giảm 80% tải lượng trí nhớ: Nhớ các hành lang xuyên suốt thay vì tên phố rời rạc',
        badge: 'Kỹ Năng Thực Chiến',
        iconName: 'Route',
        readTimeMin: 7,
        cognitiveMechanism: 'Gom cụm nhận thức (Cognitive Chunking) & Mô hình chuỗi tiếp nối Markov',
        keyTakeaways: [
            'Đặc trưng lớn nhất của đường phố Hà Nội: Một đường thẳng tắp đổi tên qua mỗi nút giao lớn.',
            'Thuộc 6 trục chính: Tây Nam, Giảng Võ - Tố Hữu, Liễu Giai - Trần Duy Hưng, Cầu Giấy - QL32, Giải Phóng Nam, Chương Dương Long Biên.',
            'Khi định vị, hãy xác định mình đang ở trên "trục nào", sau đó mới dò đến tên đoạn phố cụ thể.'
        ],
        contentMarkdown: `
### 1. Hiện tượng "Một Đường Nhiều Tên" tại Hà Nội

Một người ngoại tỉnh đi thẳng trên một con đường thẳng tắp nhưng nhìn biển tên đường lại thấy thay đổi liên tục:
* Đoạn 1: \`Tây Sơn\` (Đống Đa)
* Đi qua Ngã Tư Sở ➔ Đoạn 2: \`Nguyễn Trãi\` (Thanh Xuân)
* Đi qua ngã tư Vành đai 3 ➔ Đoạn 3: \`Trần Phú\` (Hà Đông)
* Đi qua Cầu Trắng ➔ Đoạn 4: \`Quang Trung\` (Hà Đông)
* Đi qua ngã 3 Ba La ➔ Đoạn 5: \`Quốc lộ 6\`

Nếu bạn cố gắng nhớ 5 con phố này như 5 thực thể độc lập, bộ não sẽ bị quá tải. Nhưng nếu bạn coi đây là **"Trục Xuyên Tâm Tây Nam"**, não bộ chỉ lưu trữ duy nhất 1 khái niệm hình học với 4 mốc chuyển tiếp!

---

### 2. Bảng 6 Trục Xuyên Tâm Cốt Lõi Phải Thuộc Lòng

| Tên Trục | Chuỗi Phố Nối Tiếp (Từ Tâm Ra Ngoài) | Các Nút Giao Đổi Tên | Quận Đi Qua |
| :--- | :--- | :--- | :--- |
| **Trục Tây Nam** | Tây Sơn ➔ Nguyễn Trãi ➔ Trần Phú ➔ Quang Trung ➔ Ba La | Ngã Tư Sở, Ngã tư VĐ3 Khuất Duy Tiến, Cầu Trắng Hà Đông | Đống Đa, Thanh Xuân, Hà Đông |
| **Trục Giảng Võ - Tố Hữu** | Giảng Võ ➔ Láng Hạ ➔ Lê Văn Lương ➔ Tố Hữu ➔ Yên Nghĩa | Cầu vượt La Thành, Cầu Hòa Mục (Đường Láng), Ngã tư VĐ3, Ngã tư Vạn Phúc | Ba Đình, Đống Đa, Thanh Xuân, Nam Từ Liêm, Hà Đông |
| **Trục Liễu Giai - Thăng Long** | Văn Cao ➔ Liễu Giai ➔ Nguyễn Chí Thanh ➔ Trần Duy Hưng ➔ Đại Lộ Thăng Long | Bờ Hồ Tây, Ngã tư Daewoo Kim Mã, Cầu vượt Đường Láng, Nút giao Big C | Tây Hồ, Ba Đình, Đống Đa, Cầu Giấy, Nam Từ Liêm |
| **Trục Cầu Giấy - QL32** | Kim Mã ➔ Cầu Giấy ➔ Xuân Thủy ➔ Hồ Tùng Mậu ➔ Cầu Diễn ➔ Nhổn | Ngã tư Voi Phục, Cầu Giấy (sông Tô Lịch), Cầu vượt Mai Dịch, Cầu Diễn | Ba Đình, Cầu Giấy, Nam Từ Liêm, Bắc Từ Liêm |
| **Trục Giải Phóng (Nam)** | Lê Duẩn ➔ Giải Phóng ➔ Ngọc Hồi | Cửa Nam, Hầm Kim Liên (VĐ1), Ngã Tư Vọng (VĐ2), Nút Pháp Vân (VĐ3) | Hoàn Kiếm, Đống Đa, Hai Bà Trưng, Hoàng Mai |
| **Trục Vượt Sông Hồng** | Trần Nhật Duật ➔ Cầu Chương Dương ➔ Nguyễn Văn Cừ ➔ Ngô Gia Tự ➔ Cầu Đuống | Đê Hoàn Kiếm, Bùng binh Bắc cầu Chương Dương, Nút Cầu Chui | Hoàn Kiếm, Long Biên, Gia Lâm |

---

### 3. Quy tắc ứng dụng khi lái xe

Khi nghe ai đó nói: *"Nhà mình ở đường Lê Văn Lương"*, bạn lập tức kích hoạt hình ảnh trục:
1. Bạn biết ngay nó nằm kẹp giữa trục Nguyễn Trãi (phía Nam) và trục Trần Duy Hưng (phía Bắc).
2. Bạn biết ngay đi thẳng một mạch về trung tâm là ra Láng Hạ ➔ Giảng Võ.
3. Bạn biết ngay đi thẳng ra ngoại thành là sang Tố Hữu ➔ Hà Đông.
`
    },
    {
        id: 'chapter-superblock-cells',
        chapterNumber: 7,
        title: 'Tư Duy Khối Ô Phố (Superblock Cells) & 4 Lối Thoát Ra Trục',
        subtitle: 'Nguyên lý khối ô đô thị: Biết mình đang ở ô nào là biết ngay 4 lối thoát hiểm',
        badge: 'Định Vị Siêu Cấp',
        iconName: 'Layers',
        readTimeMin: 8,
        cognitiveMechanism: 'Phân vùng không gian dạng đa giác (Voronoi Polygons & Convex Hulls)',
        keyTakeaways: [
            'Mọi ngóc ngách tại Hà Nội đều nằm trọn trong một ô phố bị bao bởi 3 đến 5 trục chính có tên.',
            'Khi bị lạc trong ngõ sâu, không bao giờ đi lùi; chọn 1 hướng đi thẳng để đâm trúng trục bao.',
            'Thuộc các ô phố điển hình: Thành Công, Thái Hà - Thái Thịnh, Trung Hòa - Nhân Chính, Bách - Kinh - Xây, Mỹ Đình, Hà Đông lõi.'
        ],
        contentMarkdown: `
### 1. Bản chất của Ô Phố (Superblock Cell)

Hà Nội có hàng chục nghìn con ngõ ngoằn ngoèo như mê cung. Tuy nhiên, nếu nhìn từ bản đồ vệ tinh:
* Các trục đường chính đóng vai trò như **bộ khung thép bao quanh**.
* Khoảng không gian bên trong (chứa nhà dân, khu tập thể, chợ, hồ nhỏ) chính là một **Khối Ô Phố (Cell)**.

> **Ví dụ điển hình: Ô Thành Công - Giảng Võ**
> Ô này được giới hạn bởi đúng 4 trục đường:
> * Phía Tây: **Đường Láng** (sông Tô Lịch)
> * Phía Bắc: **Nguyễn Chí Thanh**
> * Phía Nam: **Láng Hạ**
> * Phía Đông: **Huỳnh Thúc Kháng**

---

### 2. Thuật toán thoát hiểm khi bị lạc trong ngõ sâu

Nếu bạn đang giao hàng hoặc tìm nhà bạn bè ở sâu trong ngõ Nguyên Hồng hay ngõ Thành Công và không biết mình đang ở đâu:
1. **Bước 1: Nhận diện Ô Phố:** Bạn đang ở ô Thành Công.
2. **Bước 2: Xác định 4 trục bao:** Láng, Nguyễn Chí Thanh, Láng Hạ, Huỳnh Thúc Kháng.
3. **Bước 3: Chọn hướng thoát:**
   * Bạn muốn đi về phía Cầu Giấy ➔ Đi về phía Tây để ra **Đường Láng**.
   * Bạn muốn đi về phía Đống Đa / Ba Đình ➔ Đi về phía Đông để ra **Huỳnh Thúc Kháng**.
   * Bạn muốn đi về phía Thanh Xuân ➔ Đi về phía Nam để ra **Láng Hạ**.
4. **Bước 4: Bám ngõ thông:** Đi theo biển chỉ dẫn *"Lối ra đường..."* trên cột điện hoặc các trục xương cá: phố Trúc Khê, phố Vũ Ngọc Phan, phố Nguyên Hồng.

---

### 3. Danh mục các Ô Phố trọng điểm tại 12 Quận

* **Ô Trung Hòa - Nhân Chính:** Bao bởi Trần Duy Hưng - Đường Láng - Lê Văn Lương - Khuất Duy Tiến.
* **Ô Thái Hà - Thái Thịnh:** Bao bởi Láng Hạ - Thái Hà - Tây Sơn - Đường Láng. Trục thoát ngang là phố Yên Lãng.
* **Ô Bách - Kinh - Xây:** Bao bởi Đại Cồ Việt - Giải Phóng - Đại La - Trần Đại Nghĩa/Bạch Mai. Trục xương cá là Tạ Quang Bửu.
* **Ô Đô thị Mỹ Đình:** Bao bởi Phạm Hùng - Mễ Trì - Lê Đức Thọ - Hồ Tùng Mậu. Trục thoát là Nguyễn Hoàng và Trần Hữu Dực.
* **Ô Bán đảo Linh Đàm:** Bao bởi Vành đai 3 - Giải Phóng - Sông Tô Lịch. Trục độc đạo thoát hiểm là Nguyễn Hữu Thọ.
`
    },
    {
        id: 'chapter-address-and-alleys',
        chapterNumber: 8,
        title: 'Giải Mã Địa Chỉ & Quy Tắc Ngõ Ngách Xe Máy Hà Nội',
        subtitle: 'Đọc vị số nhà chẵn/lẻ, cấu trúc ngõ/ngách/hẻm và nghệ thuật tiếp cận cổng chính xác',
        badge: 'Kỹ Năng Đường Phố',
        iconName: 'Bike',
        readTimeMin: 7,
        cognitiveMechanism: 'Phân tích ngữ pháp địa chỉ phân cấp (Address Grammar Parsing)',
        keyTakeaways: [
            'Địa chỉ Hà Nội: Số nhà X, Ngách Y, Ngõ Z, Phố W. Ngõ mang số Z mở ra tại số nhà Z trên phố.',
            'Quy ước chẵn/lẻ: Bên trái số lẻ, bên phải số chẵn (theo chiều từ đầu phố đến cuối phố).',
            'Đích đến lớn (Bệnh viện, Trường học, Bến xe) luôn có cổng chính và cổng phụ: Chọn cổng phụ xe máy để tránh kẹt xe và quay đầu xa.'
        ],
        contentMarkdown: `
### 1. Cú pháp Ngữ pháp Địa chỉ Hà Nội

Khi bạn nhìn thấy địa chỉ:
\`Số 15, Ngách 42/105, Ngõ 105, Đường Láng Hạ\`

Hãy giải mã ngược từ phải sang trái:
1. **Đường Láng Hạ:** Con đường chính cấp 1.
2. **Ngõ 105:** Con ngõ này đâm thẳng ra mặt đường Láng Hạ, ngay sát vị trí **Số nhà 105**.
3. **Ngách 42/105:** Con ngách rẽ nhánh từ ngõ 105, tại vị trí nhà số 42 trong ngõ.
4. **Số 15:** Căn nhà mục tiêu nằm ở số 15 trong ngách 42.

> **Mẹo định vị cực nhanh:** Khi ai đó hẹn bạn ở *"Ngõ 298 Tây Sơn"*, bạn biết ngay con ngõ này nằm ở đoạn cuối phố Tây Sơn gần Ngã Tư Sở (vì số nhà Tây Sơn tăng dần từ Ô Chợ Dừa ra Ngã Tư Sở).

---

### 2. Quy tắc Đánh số Chẵn / Lẻ và Chiều Tăng Dần

* **Quy ước chuẩn:**
  * Bên **TAY TRÁI:** Đánh số **LẺ** (1, 3, 5, 7...).
  * Bên **TAY PHẢI:** Đánh số **CHẴN** (2, 4, 6, 8...).
* **Hướng tăng dần của số nhà:**
  * Thông thường tăng dần từ **Trung tâm (Bờ Hồ / Sông Hồng) tỏa ra ngoại thành**.
  * Đối với các đường vành đai: Tăng dần theo chiều kim đồng hồ hoặc từ Bắc xuống Nam.

---

### 3. Nghệ thuật tiếp cận cổng đến (Cổng Chính vs Cổng Phụ)

Người đi xe máy chuyên nghiệp không bao giờ lao vào cổng chính đang ùn tắc nếu biết cổng phụ:

* **Bệnh viện Bạch Mai:** Cổng 1 mặt đường Giải Phóng thường kẹt cứng trước ngã tư Vọng. Đi xe máy hãy đi vào **Cổng đường Phương Mai** thông thoáng và có bãi gửi xe máy ngay tại cổng.
* **Bệnh viện Việt Đức:** Cổng chính Tràng Thi là đường 1 chiều ô tô. Cổng cấp cứu và gửi xe thuận tiện nằm trên **phố Phủ Doãn**.
* **Đại học Bách Khoa:** Cổng Parabol Giải Phóng rất đông đúc. Cổng **Trần Đại Nghĩa** và cổng **Tạ Quang Bửu** là lối đi quen thuộc của sinh viên, gửi xe máy cực nhanh.
* **Bến xe Mỹ Đình:** Mặt đường Phạm Hùng xe khách ra vào dày đặc. Xe máy đón trả khách có thể tiếp cận từ **phố Nguyễn Hoàng** hoặc **phố Trần Bình**.
`
    },
    {
        id: 'chapter-hierarchical-routing',
        chapterNumber: 9,
        title: 'Chiến Lược Lập Tuyến Phân Cấp & Thuật Toán Vượt Sông Hồng',
        subtitle: 'Cách bộ não người thạo đường lập đường đi trong 3 giây: Từ ngõ nhỏ ra trục lớn rồi tiếp cận đích',
        badge: 'Tư Duy Lập Tuyến',
        iconName: 'Navigation',
        readTimeMin: 9,
        cognitiveMechanism: 'Thuật toán tìm đường phân cấp A* (Hierarchical Path Planning)',
        keyTakeaways: [
            'Công thức lập tuyến 3 tầng: Đích nhỏ ➔ Trục gom ➔ Đại lộ / Vành đai ➔ Trục gom ➔ Đích đến.',
            'Không bao giờ đi xuyên qua mạng ngõ ngách zig-zag để đi xa; hãy nhảy lên trục chính ngay khi có thể.',
            'Chiến lược vượt sông Hồng: Cầu Chương Dương (Phố Cổ), Cầu Vĩnh Tuy (Hai Bà Trưng/Long Biên), Cầu Nhật Tân (Sân bay Nội Bài).'
        ],
        contentMarkdown: `
### 1. Sai lầm phổ biến khi lập đường đi

Nhiều người nghĩ rằng *"đường thẳng nhất giữa 2 điểm là đường chim bay"*, nên cố gắng luồn lách qua hàng chục con ngõ nhỏ để đi chéo. Kết quả là:
* Gặp ngõ cụt, chợ cóc họp buổi sáng.
* Gặp rào chắn công trình hoặc ngõ không thông.
* Tốc độ trung bình chỉ đạt 10-15 km/h và căng thẳng thần kinh tột độ.

---

### 2. Thuật toán Lập Tuyến Phân Cấp 3 Tầng của Chuyên Gia

Người thạo đường luôn tư duy theo sơ đồ phân cấp:

\`\`\`
[Vị trí hiện tại trong ngõ]
       ↓ (1. Thoát hiểm bằng ngõ thông)
[Phố tiếp cận / Trục gom]
       ↓ (2. Nhảy lên trục chính)
[Trục Xuyên Tâm HOẶC Đường Vành Đai]
       ↓ (3. Chạy tốc độ cao 40-50 km/h)
[Trục tiếp cận đích]
       ↓ (4. Rẽ đúng phía đường)
[Cổng Đích Đến]
\`\`\`

#### Ví dụ thực chiến:
Đi xe máy từ **Ngõ 105 Láng Hạ** đến **Bệnh viện Việt Đức (Tràng Thi)**:
1. *Thoát ngõ:* Ra thẳng mặt đường Láng Hạ.
2. *Lên trục chính:* Đi thẳng Láng Hạ ➔ Giảng Võ ➔ rẽ Cát Linh ➔ Nguyễn Thái Học.
3. *Vào ô trung tâm:* Qua Ngã 5 Cửa Nam ➔ đâm thẳng Tràng Thi ➔ rẽ phải Phủ Doãn vào viện.
Toàn bộ chuyến đi chỉ có 3 lần rẽ quyết định!

---

### 3. Cẩm nang Vượt Sông Hồng: Chọn Cầu Nào?

Khi cần di chuyển giữa 2 bờ Nam (nội thành) và bờ Bắc/Đông (Long Biên, Gia Lâm, Đông Anh):

| Tên Cầu | Nối Từ Quận Nào Sang Quận Nào | Phù Hợp Khi Nào | Lưu Ý Xe Máy |
| :--- | :--- | :--- | :--- |
| **Cầu Nhật Tân** | Tây Hồ (Võ Chí Công) ↔ Đông Anh (Võ Nguyên Giáp) | Đi Sân bay Nội Bài, Bắc Thăng Long | Cầu dây văng gió rất mạnh, xe máy đi đúng làn ngoài cùng |
| **Cầu Thăng Long** | Bắc Từ Liêm (Phạm Văn Đồng) ↔ Đông Anh | Đi KCN Thăng Long, Mê Linh, Vĩnh Phúc | Xe máy đi tầng 1 bên dưới; ô tô đi tầng 2 trên cao |
| **Cầu Long Biên** | Hoàn Kiếm (Trần Nhật Duật) ↔ Long Biên (Ngọc Thụy) | Đi ngắm cảnh, di chuyển giờ cao điểm | Chỉ cho phép xe máy, xe đạp và tàu hỏa; cấm ô tô |
| **Cầu Chương Dương** | Hoàn Kiếm ↔ Long Biên (Nguyễn Văn Cừ) | Đi từ Phố Cổ / Hoàn Kiếm sang trung tâm Long Biên | Xe máy đi 2 làn cánh gà hai bên rìa cầu |
| **Cầu Vĩnh Tuy** | Hai Bà Trưng (Minh Khai) ↔ Long Biên (Cổ Linh) | Đi Aeon Mall Long Biên, KĐT Ocean Park | 8 làn xe hiện đại, kết nối trực tiếp Vành đai 2 trên cao |
| **Cầu Thanh Trì** | Hoàng Mai (Hoàng Liệt) ↔ Gia Lâm (QL5) | Đi Bắc Ninh, Hải Phòng, Hưng Yên | Cầu Vành đai 3, làn xe máy tách biệt có dải phân cách bê tông |
`
    },
    {
        id: 'chapter-gps-recovery',
        chapterNumber: 10,
        title: 'Phục Hồi Vị Trí Khi Mất GPS: "Đọc" Thành Phố Bằng Giác Quan',
        subtitle: 'Nghệ thuật sinh tồn khi điện thoại sập nguồn: Dùng mặt nước, đường ray trên cao và mốc biểu tượng',
        badge: 'Kỹ Năng Sinh Tồn',
        iconName: 'Compass',
        readTimeMin: 8,
        cognitiveMechanism: 'Định vị suy diễn dựa trên manh mối (Dead Reckoning & Sensory Triangulation)',
        keyTakeaways: [
            'Điện thoại hết pin là lúc bản đồ nhận thức phát huy sức mạnh tối thượng.',
            '3 quy tắc phục hồi tức thì: Nhìn mặt nước, Nhìn tuyến đường sắt trên cao, Nhìn bóng nắng mặt trời.',
            'Tập trung tìm lại 1 trong 3 vành đai hoặc 6 trục xuyên tâm để lấy lại toàn bộ bức tranh không gian.'
        ],
        contentMarkdown: `
### 1. Kịch bản tồi tệ: Mất GPS giữa đêm tối hoặc giờ cao điểm

Điện thoại sập nguồn, trời đổ mưa, không thể dừng xe hỏi đường. Người bình thường sẽ hoảng loạn và đi lòng vòng tốn xăng. Người có bản đồ nhận thức sẽ **tìm kiếm 4 nhóm manh mối giác quan**:

---

### 2. Bộ 4 Manh Mối Phục Hồi Vị Trí Tức Thì

#### Manh mối 1: Mặt Nước (Water Clues)
* **Thấy bờ sông Tô Lịch:** Dòng sông nhỏ có lan can xanh và đường bê tông chạy dọc.
  * *Nếu dòng sông ở bên TAY PHẢI khi bạn nhìn về phía Nam:* Bạn đang ở **Đường Láng** (thuộc Đống Đa).
  * *Nếu dòng sông ở bên TAY TRÁI:* Bạn đang ở đường **Nguyễn Khang / Vũ Tông Phan**.
* **Thấy mặt hồ mênh mông gió lộng:** Đó chắc chắn là **Hồ Tây**. Bạn đang ở mạn cực Bắc trung tâm (quận Tây Hồ).
* **Thấy con đê cao có sông lớn cuồn cuộn:** Bạn đang ở triền đê **Sông Hồng** (Trần Nhật Duật, Trần Khánh Dư hoặc Yên Phụ).

#### Manh mối 2: Tuyến Đường Sắt Trên Cao (Metro Clues)
Hà Nội hiện có 2 tuyến metro nổi bật với trụ bê tông khổng lồ:
* **Tuyến Cát Linh - Hà Đông (Metro 2A):** Chạy trên dải phân cách giữa trục: \`Hoàng Cầu ➔ Yên Lãng ➔ Thái Hà ➔ vượt Ngã Tư Sở ➔ Nguyễn Trãi ➔ Trần Phú ➔ Quang Trung\`.
  * *Nhìn thấy dầm cầu này:* Bạn chắc chắn đang ở **Trục Tây Nam** đi về phía Hà Đông!
* **Tuyến Nhổn - Ga Hà Nội (Metro 3):** Chạy dọc trục: \`Xuân Thủy ➔ Cầu Giấy ➔ Kim Mã\`.
  * *Nhìn thấy dầm cầu này:* Bạn chắc chắn đang ở **Trục Tây Bắc** Cầu Giấy - Bắc Từ Liêm!

#### Manh mối 3: Mốc Chân Trời (Skyline Clues)
* **Tòa tháp Keangnam 72 tầng:** Đỉnh tháp kính xanh rực sáng. Đây là ngọn hải đăng của khu vực **Mỹ Đình - Phạm Hùng (Tây Nam)**.
* **Tòa tháp Lotte Center:** Hình dáng hai tòa nhà chụm vào nhau, nằm ở **Liễu Giai - Ba Đình (Tây Bắc)**.

#### Manh mối 4: Biển Tên Ngõ & Số Nhà
Nhìn vào một biển hiệu bất kỳ trên tường ngõ:
* Ví dụ thấy: *"Ngõ 165 Cầu Giấy"* ➔ Bạn biết ngay cách bạn 50m là đại lộ Cầu Giấy.
* Ví dụ thấy: *"Tổ dân phố 12 phường Mộ Lao"* ➔ Bạn biết mình đang ở khu vực Mỗ Lao - Hà Đông cạnh đường Trần Phú.

---

### 3. Chiến lược phục hồi: "Hồi quy về Trục Xương Sống"

Sau khi đã nhận diện được một manh mối:
1. Đừng cố gắng tìm đường tắt.
2. Hãy lái xe thẳng về phía trục chính gần nhất (Vành đai 1, 2, 3 hoặc 6 trục xuyên tâm).
3. Khi bánh xe đã chạm vào mặt đường lớn, bức tranh bản đồ nhận thức trong đầu bạn sẽ tự động **đồng bộ hóa 100%**. Bạn đã hoàn toàn làm chủ không gian Thủ đô!
`
    }
];
