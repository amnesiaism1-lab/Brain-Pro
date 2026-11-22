/**
 * DỮ LIỆU BẢN ĐỒ NHẬN THỨC VÀ ĐỊNH VỊ KHÔNG GIAN HÀ NỘI (V3.0 MASTER ATLAS)
 * Hệ sinh thái thực thể lõi, cấu trúc đồng tâm - hướng tâm, mặt đồng hồ 12h,
 * chuỗi cầu thượng lưu -> hạ lưu, 30 đơn vị hành chính, đường sắt đô thị,
 * quy luật mặt trời 21.0285°N và giáo trình tư duy không gian chuyên nghiệp.
 */

export interface IHanoiEntity {
  id: string;
  name: string;
  alias?: string;
  type:
    | 'river'
    | 'lake'
    | 'ring'
    | 'radial'
    | 'bridge'
    | 'landmark'
    | 'french_street'
    | 'junction'
    | 'old_quarter_street'
    | 'metro_line';
  category: 'edge' | 'path' | 'landmark' | 'node' | 'district';
  district: string;
  coords: { lat: number; lng: number };
  description: string;
  cognitiveTip: string;
  bearingDeg?: number;
  isOneWay?: boolean;
  oneWayDirection?: string;
  ringTier?: 1 | 2 | 2.5 | 3 | 3.5 | 4;
  heightTier?: 'skyline' | 'local';
  connectedStreets?: string[];
  historicalEra?: 'ancient' | 'french_colonial' | 'modern';
  practiceModeRecommended?: string;
}

export type RelationType =
  | 'parallel'               // Song song (∥)
  | 'perpendicular'          // Vuông góc (⊥)
  | 'collinear_continuation' // Nối tiếp cùng trục đổi tên (→)
  | 'ordered_along'          // Thứ tự chuỗi dọc trục
  | 'containment'            // Nằm trong/ngoài vành đai
  | 'paired_oneway'          // Cặp đường 1 chiều đối xứng
  | 'crosses_at';            // Giao nhau tại nút

export interface IHanoiRelation {
  id: string;
  type: RelationType;
  entityAId: string;
  entityBId: string;
  description: string;
  explanation: string;
  cognitiveKey: string;
}

// ============================================================================
// 1. KHUNG THỦY VĂN & BIÊN GIỚI TỰ NHIÊN (HYDROLOGY & EDGES)
// ============================================================================
export const HANOI_WATER_EDGES: IHanoiEntity[] = [
  {
    id: 'edge-red-river',
    name: 'Sông Hồng',
    alias: 'Sông Cái / Nhị Hà (Trục xương sống Tây Bắc → Đông Nam)',
    type: 'river',
    category: 'edge',
    district: 'Bắc Từ Liêm - Tây Hồ - Ba Đình - Hoàn Kiếm - Hai Bà Trưng - Hoàng Mai ↔ Đông Anh - Long Biên - Gia Lâm',
    coords: { lat: 21.045, lng: 105.865 },
    bearingDeg: 135,
    description:
      'Trục thủy văn vĩ mô uốn lượn theo hướng Tây Bắc → Đông Nam, chia không gian Hà Nội thành Hữu ngạn (bờ Nam/Tây: 11 quận nội đô) và Tả ngạn (bờ Bắc/Đông: Long Biên, Đông Anh, Gia Lâm).',
    cognitiveTip:
      'Quy tắc vàng: Sông Hồng KHÔNG chảy Bắc - Nam thẳng đứng mà chảy xiên Tây Bắc → Đông Nam. Ở Tây Hồ sông nằm phía Bắc; sang Hoàn Kiếm - Hai Bà Trưng sông bẻ sang phía Đông.',
    practiceModeRecommended: 'gps_loss_recovery'
  },
  {
    id: 'edge-duong-river',
    name: 'Sông Đuống',
    alias: 'Thiên Đức Giang (Phân lưu phía Đông Bắc)',
    type: 'river',
    category: 'edge',
    district: 'Đông Anh - Long Biên - Gia Lâm',
    coords: { lat: 21.072, lng: 105.895 },
    bearingDeg: 100,
    description:
      'Tách ra từ Sông Hồng tại ngã ba Xuân Canh / Dâu (đối diện Phú Thượng - Tứ Liên), chảy sang phía Đông chia cắt Đông Anh với Long Biên và Bắc Gia Lâm với Nam Gia Lâm.',
    cognitiveTip:
      'Muốn đi từ Long Biên sang Đông Anh hoặc Yên Viên (Từ Sơn), bạn phải vượt Sông Đuống qua Cầu Đông Trù hoặc Cầu Đuống.',
    practiceModeRecommended: 'route_planner_ab'
  },
  {
    id: 'edge-to-lich-river',
    name: 'Sông Tô Lịch',
    alias: 'Biên giới tự nhiên uốn cong của Vành đai 2 & Tây Nam',
    type: 'river',
    category: 'edge',
    district: 'Ba Đình - Cầu Giấy - Đống Đa - Thanh Xuân - Hoàng Mai - Thanh Trì',
    coords: { lat: 21.018, lng: 105.808 },
    bearingDeg: 170,
    description:
      'Bắt đầu từ cống Chợ Bưởi (Hoàng Quốc Việt), chảy dọc Đường Láng – Nguyễn Khang qua Ngã Tư Sở, tiếp tục dọc Vũ Tông Phan – Kim Giang xuống Linh Đàm – Thanh Liệt.',
    cognitiveTip:
      'Đoạn Bưởi → Ngã Tư Sở: Bờ Đông sông là Đường Láng (Đống Đa), bờ Tây sông là Nguyễn Khang (Cầu Giấy). Thấy dòng sông bên phải khi đi hướng Nam = đang ở Đường Láng.',
    practiceModeRecommended: 'gps_loss_recovery'
  },
  {
    id: 'edge-nhue-river',
    name: 'Sông Nhuệ',
    alias: 'Biên giới tự nhiên khu Tây - Hà Đông (Vành đai 3.5)',
    type: 'river',
    category: 'edge',
    district: 'Bắc Từ Liêm - Nam Từ Liêm - Hà Đông - Thanh Trì',
    coords: { lat: 20.978, lng: 105.776 },
    bearingDeg: 175,
    description:
      'Chảy từ Liên Mạc qua Cầu Diễn, Tây Mỗ, cắt ngang trung tâm Hà Đông tại Cầu Trắng và Cầu Đen, xuôi về Thanh Oai – Thường Tín.',
    cognitiveTip:
      'Cầu Trắng Hà Đông bắc qua sông Nhuệ chính là ranh giới đổi tên đường: từ Trần Phú (Hà Đông) sang Quang Trung (Hà Đông).',
    practiceModeRecommended: 'corridor_chain'
  },
  {
    id: 'lake-west-lake',
    name: 'Hồ Tây',
    alias: 'Đoài Hồ / Dâm Đàm (~526 ha, chu vi ~18 km)',
    type: 'lake',
    category: 'edge',
    district: 'Tây Hồ',
    coords: { lat: 21.058, lng: 105.823 },
    description:
      'Hồ tự nhiên lớn nhất nội đô Hà Nội (vết tích khúc sông Hồng cổ), nằm ở cực Bắc - Tây Bắc của lõi trung tâm, được bao quanh bởi Lạc Long Quân, Nguyễn Đình Thi – Trích Sài, Thanh Niên, Yên Phụ, Quảng An – Xuân Diệu.',
    cognitiveTip:
      'Mốc định vị vĩ mô hướng 11h – 12h từ Hồ Gươm. Do diện tích khổng lồ, bạn không thể đi xuyên qua mà buộc phải đi vòng bờ Tây (Lạc Long Quân) hoặc bờ Đông (Yên Phụ - Nghi Tàm).',
    practiceModeRecommended: 'gps_loss_recovery'
  },
  {
    id: 'lake-truc-bach',
    name: 'Hồ Trúc Bạch',
    alias: 'Hồ Đông Nam đường Thanh Niên',
    type: 'lake',
    category: 'edge',
    district: 'Ba Đình',
    coords: { lat: 21.047, lng: 105.839 },
    description:
      'Nằm ở góc Đông Nam Hồ Tây, ngăn cách với Hồ Tây bởi con đường Cổ Ngư lịch sử (nay là đường Thanh Niên).',
    cognitiveTip:
      'Đi trên đường Thanh Niên từ Quán Thánh lên Yên Phụ (hướng Đông Bắc): bên tay trái là Hồ Tây mênh mông, bên tay phải là Hồ Trúc Bạch nhỏ hơn.',
    practiceModeRecommended: 'gps_loss_recovery'
  },
  {
    id: 'lake-hoan-kiem',
    name: 'Hồ Hoàn Kiếm',
    alias: 'Hồ Gươm / Bờ Hồ (Tâm gốc Km 0 Quốc Gia)',
    type: 'lake',
    category: 'landmark',
    district: 'Hoàn Kiếm',
    coords: { lat: 21.0285, lng: 105.8542 },
    description:
      'Tâm quy chiếu số 0 của toàn mạng lưới Hà Nội. Được kẹp bởi 3 phố một chiều bao quanh: Đinh Tiên Hoàng (Đông), Hàng Khay (Nam), Lê Thái Tổ (Tây).',
    cognitiveTip:
      'Vòng quanh Bờ Hồ đi NGƯỢC CHIỀU KIM ĐỒNG HỒ trên thực tế (Đinh Tiên Hoàng lên Bắc → Lê Thái Tổ xuống Nam). Phía Bắc hồ là 36 Phố Phường; phía Nam hồ là Lưới Phố Pháp.',
    practiceModeRecommended: 'oneway_turn_trap'
  },
  {
    id: 'lake-thien-quang',
    name: 'Hồ Thiền Quang',
    alias: 'Hồ Halais (Tâm điểm Nguyễn Du - Trần Nhân Tông)',
    type: 'lake',
    category: 'edge',
    district: 'Hai Bà Trưng',
    coords: { lat: 21.0185, lng: 105.8465 },
    description:
      'Hồ chữ nhật duyên dáng bao quanh bởi 4 phố: Nguyễn Du (Bắc), Quang Trung (Tây), Trần Nhân Tông (Nam - đối diện Rạp Xiếc TW & CV Thống Nhất), Trần Bình Trọng (Đông).',
    cognitiveTip:
      'Điểm chuyển tiếp từ khu Phố Pháp Hoàn Kiếm sang Công viên Thống Nhất (Hồ Bảy Mẫu) và Đại Cồ Việt.',
    practiceModeRecommended: 'which_intersection'
  },
  {
    id: 'lake-bay-mau',
    name: 'Hồ Bảy Mẫu',
    alias: 'Hồ Công viên Thống Nhất',
    type: 'lake',
    category: 'edge',
    district: 'Hai Bà Trưng',
    coords: { lat: 21.013, lng: 105.843 },
    description:
      'Nằm trọn trong Công viên Thống Nhất, kẹp giữa Lê Duẩn (Tây), Đại Cồ Việt (Nam), Nguyễn Đình Chiểu (Đông) và Trần Nhân Tông (Bắc).',
    cognitiveTip:
      'Cặp đối xứng qua đường Lê Duẩn & đường sắt Bắc Nam: bên Đông đường tàu là Hồ Bảy Mẫu, bên Tây đường tàu là Hồ Ba Mẫu.',
    practiceModeRecommended: 'superblock_cell'
  },
  {
    id: 'lake-thu-le',
    name: 'Hồ Thủ Lệ',
    alias: 'Hồ Vườn Thú Thủ Lệ / Mốc Voi Phục',
    type: 'lake',
    category: 'edge',
    district: 'Ba Đình',
    coords: { lat: 21.0305, lng: 105.8085 },
    description:
      'Nằm tại góc giao Kim Mã – Cầu Giấy – Đào Tấn – đường Bưởi, sát khách sạn Daewoo và tòa tháp Lotte Center.',
    cognitiveTip:
      'Bản lề cửa ngõ phía Tây: kết thúc địa phận Ba Đình (Kim Mã) để vượt sông Tô Lịch sang quận Cầu Giấy.',
    practiceModeRecommended: 'corridor_chain'
  },
  {
    id: 'lake-giang-vo',
    name: 'Hồ Giảng Võ & Hồ Thành Công',
    alias: 'Cụm hồ điều hòa Ba Đình - Đống Đa',
    type: 'lake',
    category: 'edge',
    district: 'Ba Đình',
    coords: { lat: 21.0265, lng: 105.8215 },
    description:
      'Cặp hồ lớn nằm trong khu tập thể Giảng Võ (Trần Huy Liệu – Ngọc Khánh) và Thành Công (Nguyên Hồng – Huỳnh Thúc Kháng).',
    cognitiveTip:
      'Neo định vị nội khu giữa hai trục song song Nguyễn Chí Thanh và Giảng Võ – Láng Hạ.',
    practiceModeRecommended: 'superblock_cell'
  },
  {
    id: 'lake-linh-dam',
    name: 'Hồ Linh Đàm',
    alias: 'Hồ móng ngựa ôm trọn Bán đảo Linh Đàm',
    type: 'lake',
    category: 'edge',
    district: 'Hoàng Mai',
    coords: { lat: 20.971, lng: 105.828 },
    description:
      'Hồ điều hòa hình móng ngựa rộng ~74 ha bao bọc Khu đô thị Bán đảo Linh Đàm ngay phía Nam đường Vành đai 3 (Nghiêm Xuân Yêm – Hoàng Liệt).',
    cognitiveTip:
      'Vì hồ ôm 3 mặt bán đảo, đường Nguyễn Hữu Thọ là trục xương sống bắt buộc để thoát ra Giải Phóng hoặc Cầu Dậu.',
    practiceModeRecommended: 'superblock_cell'
  }
];

// ============================================================================
// 2. CHUỖI CẦU SÔNG HỒNG (CHUẨN THỨ TỰ THƯỢNG LƯU → HẠ LƯU / TÂY BẮC → ĐÔNG NAM)
// ============================================================================
export const HANOI_BRIDGES: IHanoiEntity[] = [
  {
    id: 'bridge-thang-long',
    name: 'Cầu Thăng Long',
    alias: 'Cầu Giàn Thép 2 Tầng Vành Đai 3 (1985)',
    type: 'bridge',
    category: 'node',
    district: 'Bắc Từ Liêm (Đông Ngạc) ↔ Đông Anh (Hải Bối)',
    coords: { lat: 21.099, lng: 105.787 },
    bearingDeg: 15,
    ringTier: 3,
    description:
      'Cầu giàn thép 2 tầng quy mô lớn ở thượng lưu nội đô: tầng 2 trên cao dành riêng cho ô tô (nối thẳng cao tốc Vành đai 3 – Phạm Văn Đồng sang Võ Văn Kiệt); tầng 1 bên dưới có đường sắt ở giữa và hai hành lang cánh gà dành cho xe máy.',
    cognitiveTip:
      'Vị trí số 1 thượng lưu nội đô (nằm phía Tây Bắc của Cầu Nhật Tân). Bẫy xe máy: TUYỆT ĐỐI KHÔNG đi lên đường dẫn tầng 2 cao tốc Phạm Văn Đồng; xe máy phải đi đường thấp dưới chân cầu để vào hành lang tầng 1.',
    practiceModeRecommended: 'oneway_turn_trap'
  },
  {
    id: 'bridge-nhat-tan',
    name: 'Cầu Nhật Tân',
    alias: 'Cầu Dây Văng 5 Trụ Tháp Vành Đai 2 (2015)',
    type: 'bridge',
    category: 'node',
    district: 'Tây Hồ (Phú Thượng) ↔ Đông Anh (Vĩnh Ngọc)',
    coords: { lat: 21.092, lng: 105.824 },
    bearingDeg: 25,
    ringTier: 2,
    description:
      'Cầu dây văng liên tục 5 trụ tháp hình thoi tượng trưng cho 5 cửa ô Hà Nội, nằm ngay phía Bắc Hồ Tây, nối đại lộ Võ Chí Công (Vành đai 2) sang đại lộ Võ Nguyên Giáp đi Sân bay Quốc tế Nội Bài.',
    cognitiveTip:
      'Vị trí số 2 (nằm hạ lưu Cầu Thăng Long và thượng lưu Cầu Long Biên). Tuyến ngắn nhất và đẹp nhất từ trung tâm Ba Đình / Tây Hồ / Hoàn Kiếm đi Sân bay Nội Bài (~25–30 phút).',
    practiceModeRecommended: 'route_planner_ab'
  },
  {
    id: 'bridge-long-bien',
    name: 'Cầu Long Biên',
    alias: 'Cầu Thép Lịch Sử Paul Doumer (1902)',
    type: 'bridge',
    category: 'landmark',
    district: 'Hoàn Kiếm (Đồng Xuân / Phúc Tân) ↔ Long Biên (Ngọc Thụy / Bồ Đề)',
    coords: { lat: 21.043, lng: 105.856 },
    bearingDeg: 55,
    historicalEra: 'french_colonial',
    description:
      'Chứng nhân lịch sử hơn 120 năm bắc qua sông Hồng ngay phía Bắc Phố Cổ (gần Chợ Đồng Xuân & Ga Long Biên). Cấm toàn bộ ô tô; chỉ cho tàu hỏa chạy giữa và xe máy, xe đạp, người đi bộ ở hai bên.',
    cognitiveTip:
      'QUY TẮC ĐẶC BIỆT DUY NHẤT TẠI HÀ NỘI: Trên Cầu Long Biên, phương tiện lưu thông theo LỀ BÊN TRÁI (di sản thiết kế đường sắt Pháp), ngược với quy tắc đi bên phải thông thường!',
    practiceModeRecommended: 'oneway_turn_trap'
  },
  {
    id: 'bridge-chuong-duong',
    name: 'Cầu Chương Dương',
    alias: 'Cầu Thép Huyết Mạch Phố Cổ – Long Biên (1985)',
    type: 'bridge',
    category: 'node',
    district: 'Hoàn Kiếm (Trần Nhật Duật / Trần Quang Khải) ↔ Long Biên (Nguyễn Văn Cừ)',
    coords: { lat: 21.038, lng: 105.861 },
    bearingDeg: 60,
    description:
      'Cầu thép lớn đầu tiên do kỹ sư Việt Nam tự thiết kế và thi công, nằm cách cầu Long Biên ~500m về phía hạ lưu, nối thẳng vòng xuyến Trần Nhật Duật – Trần Quang Khải sang trục Nguyễn Văn Cừ.',
    cognitiveTip:
      'Cửa ngõ trực diện nhất từ Hồ Gươm sang trung tâm quận Long Biên. Ô tô đi làn giữa (có phân làn đảo chiều linh hoạt giờ cao điểm), xe máy bắt buộc đi 2 làn cánh gà ngoài cùng.',
    practiceModeRecommended: 'route_planner_ab'
  },
  {
    id: 'bridge-vinh-tuy',
    name: 'Cầu Vĩnh Tuy',
    alias: 'Cầu 8 Làn Xe Vành Đai 2 (GĐ1 2010 · GĐ2 2023)',
    type: 'bridge',
    category: 'node',
    district: 'Hai Bà Trưng (Minh Khai / Nguyễn Khoái) ↔ Long Biên (Đàm Quang Trung / Cổ Linh)',
    coords: { lat: 21.006, lng: 105.882 },
    bearingDeg: 65,
    ringTier: 2,
    description:
      'Tổ hợp 2 cầu song song rộng 8 làn xe hiện đại bậc nhất nội đô, đón trực tiếp dòng xe từ đường Vành đai 2 trên cao (Trường Chinh – Đại La – Minh Khai / Times City) vượt sông thẳng xuống Aeon Mall Long Biên và trục Cổ Linh.',
    cognitiveTip:
      'Từ Đống Đa, Thanh Xuân, Hai Bà Trưng muốn sang Long Biên, Vinhomes Riverside hay Cao tốc Hà Nội – Hải Phòng (5B), đi Vĩnh Tuy luôn nhanh và thoáng hơn Chương Dương.',
    practiceModeRecommended: 'route_planner_ab'
  },
  {
    id: 'bridge-thanh-tri',
    name: 'Cầu Thanh Trì',
    alias: 'Cầu Bê Tông Dự Ứng Lực Vành Đai 3 (2007)',
    type: 'bridge',
    category: 'node',
    district: 'Hoàng Mai (Lĩnh Nam / Pháp Vân) ↔ Gia Lâm (Đông Dư / Cổ Bi)',
    coords: { lat: 20.978, lng: 105.908 },
    bearingDeg: 70,
    ringTier: 3,
    description:
      'Cầu vượt sông ở cực Đông Nam nội đô, khép mạch đường Vành đai 3 trên cao (CT.20) nối nút Pháp Vân qua sông Hồng sang Quốc lộ 5, Cao tốc 5B và Quốc lộ 1A đi Bắc Ninh – Lạng Sơn.',
    cognitiveTip:
      'Cầu số 6 ở hạ lưu nội thành, mật độ xe container rất lớn. Xe máy đi trong làn hỗn hợp có dải phân cách cứng riêng biệt, cần giữ vững tay lái khi gió ngang mặt sông.',
    practiceModeRecommended: 'route_planner_ab'
  }
];

/**
 * Chuỗi ID cầu nội đô chuẩn xác theo chiều dòng chảy Thượng lưu → Hạ lưu (Tây Bắc → Đông Nam)
 */
export const HANOI_BRIDGES_NORTH_TO_SOUTH = [
  'bridge-thang-long',
  'bridge-nhat-tan',
  'bridge-long-bien',
  'bridge-chuong-duong',
  'bridge-vinh-tuy',
  'bridge-thanh-tri'
];

// ============================================================================
// 3. HỆ THỐNG 6 ĐƯỜNG VÀNH ĐAI ĐỒNG TÂM (RING ROADS 1 → 4)
// ============================================================================
export const HANOI_RING_ROADS: IHanoiEntity[] = [
  {
    id: 'ring-1',
    name: 'Vành đai 1',
    alias: 'Vành đai Cửa Ô Lịch Sử (~7.2 km trục Nam - Tây + Tuyến đê Đông - Bắc)',
    type: 'ring',
    category: 'path',
    district: 'Hai Bà Trưng - Đống Đa - Ba Đình - Tây Hồ - Hoàn Kiếm',
    coords: { lat: 21.018, lng: 105.836 },
    ringTier: 1,
    description:
      'Vòng đai trong cùng ôm sát Tứ Quận Lõi: Nguyễn Khoái → Trần Khát Chân → Đại Cồ Việt → (Hầm Kim Liên) → Xã Đàn → Ô Chợ Dừa → Hoàng Cầu → Voi Phục → Bưởi → Lạc Long Quân / Yên Phụ → Trần Nhật Duật → Trần Quang Khải.',
    cognitiveTip:
      'Đi qua 5 cửa ô cổ (Ô Đống Mác, Ô Cầu Dền, Ô Đồng Lầm/Kim Liên, Ô Chợ Dừa, Ô Cầu Giấy/Voi Phục). Trong VĐ1 là phố cổ/phố Pháp mật độ dày; ra ngoài VĐ1 là các khu tập thể và đại lộ mới.',
    practiceModeRecommended: 'corridor_chain'
  },
  {
    id: 'ring-2',
    name: 'Vành đai 2',
    alias: 'Vành đai Khép Kín Nội Đô (~43.6 km toàn vòng qua 2 cầu)',
    type: 'ring',
    category: 'path',
    district: 'Hai Bà Trưng - Đống Đa - Thanh Xuân - Cầu Giấy - Ba Đình - Tây Hồ - Đông Anh - Long Biên',
    coords: { lat: 21.015, lng: 105.815 },
    ringTier: 2,
    description:
      'Tuyến vành đai khép kín hoàn chỉnh qua 2 bờ Sông Hồng: Cầu Vĩnh Tuy → Minh Khai → Đại La → Ngã Tư Vọng → Trường Chinh → Ngã Tư Sở → Đường Láng → Cầu Giấy → Bưởi → Võ Chí Công → Cầu Nhật Tân → Đông Hội → Cầu Chui → Nguyễn Văn Linh → Đàm Quang Trung → Cầu Vĩnh Tuy.',
    cognitiveTip:
      'Đoạn Vĩnh Tuy ↔ Ngã Tư Sở có đường trên cao dành riêng cho ô tô (cấm xe máy 100%). Đoạn Ngã Tư Sở ↔ Bưởi chạy men bờ Đông sông Tô Lịch (Đường Láng).',
    practiceModeRecommended: 'corridor_chain'
  },
  {
    id: 'ring-2-5',
    name: 'Vành đai 2.5',
    alias: 'Tuyến Bổ Trợ Giải Tải Giữa VĐ2 & VĐ3 (~19.4 km)',
    type: 'ring',
    category: 'path',
    district: 'Tây Hồ - Bắc Từ Liêm - Cầu Giấy - Thanh Xuân - Hoàng Mai',
    coords: { lat: 21.002, lng: 105.805 },
    ringTier: 2.5,
    description:
      'Tuyến trung gian chia lửa cho Đường Láng và Khuất Duy Tiến: Phú Thượng (Tây Hồ) → Nguyễn Văn Huyên kéo dài (Ngoại Giao Đoàn) → Nguyễn Phong Sắc → Trần Thái Tông → Trung Kính → Hoàng Đạo Thúy → Ngụy Như Kon Tum → Đầm Hồng → Định Công → Kim Đồng (Hầm Giải Phóng) → Lĩnh Nam.',
    cognitiveTip:
      'Trục xương sống xuyên suốt các khu đô thị mới sầm uất nhất: Ngoại Giao Đoàn – Dịch Vọng – Yên Hòa – Trung Hòa Nhân Chính – Định Công.',
    practiceModeRecommended: 'superblock_cell'
  },
  {
    id: 'ring-3',
    name: 'Vành đai 3',
    alias: 'Cao Tốc Đô Thị Trên Cao CT.20 & Vòng Khép Kín (~65 km)',
    type: 'ring',
    category: 'path',
    district: 'Bắc Từ Liêm - Cầu Giấy - Nam Từ Liêm - Thanh Xuân - Hoàng Mai - Gia Lâm - Long Biên - Đông Anh',
    coords: { lat: 21.008, lng: 105.789 },
    ringTier: 3,
    description:
      'Hành lang huyết mạch phân tách nội thành mở rộng và vùng ven: Cầu Thăng Long → Phạm Văn Đồng → Mai Dịch → Phạm Hùng → Trung Hòa → Khuất Duy Tiến → Thanh Xuân → Nguyễn Xiển → Nghiêm Xuân Yêm → Hoàng Liệt → Pháp Vân → Cầu Thanh Trì → Quốc lộ 1A mới (Phù Đổng – Ninh Hiệp) → Việt Hùng → Bắc Thăng Long.',
    cognitiveTip:
      'Tuyến đường 2 tầng liên tục dài nhất nội đô: Tầng trên cao CT.20 chỉ dành cho ô tô (80 km/h); tầng mặt đất dành cho xe máy & xe buýt, cắt qua 4 đại nút giao Mai Dịch, Trung Hòa, Thanh Xuân, Pháp Vân.',
    practiceModeRecommended: 'oneway_turn_trap'
  },
  {
    id: 'ring-3-5',
    name: 'Vành đai 3.5',
    alias: 'Hành Lang Đô Thị Phía Tây & Nam (~45 km)',
    type: 'ring',
    category: 'path',
    district: 'Bắc Từ Liêm - Đan Phượng - Hoài Đức - Hà Đông - Thanh Trì - Gia Lâm',
    coords: { lat: 20.985, lng: 105.742 },
    ringTier: 3.5,
    description:
      'Liên kết chuỗi đại đô thị mới phía Tây và Nam ngoài VĐ3: Cầu Thượng Cát → Đan Phượng → Hoài Đức (đường Lê Trọng Tấn kéo dài qua Thiên Đường Bảo Sơn / Vinhomes Smart City) → Phúc La – Văn Phú (Hà Đông) → Xa La → Ngọc Hồi → Cầu Ngọc Hồi.',
    cognitiveTip:
      'Trục Lê Trọng Tấn (Hoài Đức – Hà Đông) chính là đoạn Vành đai 3.5 đã hiện hữu rõ nhất, cắt vuông góc Đại lộ Thăng Long, Tố Hữu và Quang Trung (Văn Phú).',
    practiceModeRecommended: 'route_planner_ab'
  },
  {
    id: 'ring-4',
    name: 'Vành đai 4 – Vùng Thủ Đô',
    alias: 'Siêu Vành Đai Liên Vùng Hà Nội – Hưng Yên – Bắc Ninh (~112.8 km)',
    type: 'ring',
    category: 'path',
    district: 'Sóc Sơn - Mê Linh - Đan Phượng - Hoài Đức - Hà Đông - Thanh Oai - Thường Tín (kết nối Hưng Yên, Bắc Ninh)',
    coords: { lat: 20.955, lng: 105.710 },
    ringTier: 4,
    description:
      'Vành đai chiến lược cấp Quốc gia dài ~112.8 km (đoạn qua Hà Nội ~58.2 km), vượt Sông Hồng qua Cầu Hồng Hà (Đan Phượng – Mê Linh) và Cầu Mễ Sở (Thường Tín – Văn Giang), tách toàn bộ luồng xe tải quá cảnh liên tỉnh khỏi nội đô.',
    cognitiveTip:
      'Định hình không gian phát triển Vùng Thủ đô đa cực, kết nối Sân bay Nội Bài (phía Bắc) với chuỗi khu công nghiệp Bắc Ninh – Hưng Yên và cửa ngõ phía Nam.',
    practiceModeRecommended: 'route_planner_ab'
  }
];

export const HANOI_RING_1_SEQUENCE = [
  'Nguyễn Khoái / Trần Khát Chân',
  'Đại Cồ Việt',
  'Hầm Kim Liên',
  'Xã Đàn',
  'Ô Chợ Dừa',
  'Hoàng Cầu',
  'Voi Phục (La Thành)',
  'Bưởi',
  'Yên Phụ / Trần Nhật Duật'
];

export const HANOI_RING_2_SEQUENCE = [
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
  'Cầu Nhật Tân',
  'Nguyễn Văn Linh – Cổ Linh'
];

export const HANOI_RING_3_SEQUENCE = [
  'Cầu Thăng Long',
  'Phạm Văn Đồng',
  'Ngã tư Mai Dịch',
  'Phạm Hùng',
  'Nút Trung Hòa',
  'Khuất Duy Tiến',
  'Nút Thanh Xuân',
  'Nguyễn Xiển',
  'Nghiêm Xuân Yêm',
  'Hoàng Liệt (Pháp Vân)',
  'Cầu Thanh Trì'
];

// ============================================================================
// 4. TRỤC HƯỚNG TÂM & NỐI TIẾP ĐỔI TÊN (RADIALS & COLLINEAR SEQUENCES)
// ============================================================================
export const HANOI_RADIAL_CORRIDORS: Array<{
  id: string;
  name: string;
  clockPosition: string;
  direction:
    | 'South-West'
    | 'South'
    | 'West-North'
    | 'West'
    | 'West-South-BRT'
    | 'North-East'
    | 'North-Airport'
    | 'East-HaiPhong'
    | 'North-West-Ring3';
  bearingDeg: number;
  segments: string[];
  description: string;
  cognitiveTip: string;
}> = [
  {
    id: 'corridor-airport-vo-chi-cong',
    name: 'Hướng 12h (Bắc): Bưởi – Võ Chí Công – Cầu Nhật Tân – Võ Nguyên Giáp (Nội Bài)',
    clockPosition: '12h',
    direction: 'North-Airport',
    bearingDeg: 10,
    segments: ['Bưởi', 'Võ Chí Công', 'Cầu Nhật Tân', 'Võ Nguyên Giáp', 'Sân bay Quốc tế Nội Bài'],
    description:
      'Trục đối ngoại 8–10 làn xe hiện đại nhất Thủ đô, kết nối trực tiếp Ba Đình – Tây Hồ qua Cầu Nhật Tân thẳng tới Nhà ga T1/T2 Nội Bài.',
    cognitiveTip:
      'Nhìn đồng hồ hướng 12h từ tâm thành phố: cứ bám Võ Chí Công qua 5 trụ tháp Cầu Nhật Tân là tới thẳng sân bay.'
  },
  {
    id: 'corridor-east-nguyen-van-cu',
    name: 'Hướng 2h (Đông Bắc): Trần Nhật Duật – Cầu Chương Dương – Nguyễn Văn Cừ – Ngô Gia Tự',
    clockPosition: '2h',
    direction: 'North-East',
    bearingDeg: 55,
    segments: [
      'Trần Quang Khải / Trần Nhật Duật',
      'Cầu Chương Dương',
      'Nguyễn Văn Cừ',
      'Nút Cầu Chui',
      'Ngô Gia Tự',
      'Cầu Đuống (QL1A cũ đi Từ Sơn – Bắc Ninh)'
    ],
    description:
      'Trục lịch sử vượt Sông Hồng và Sông Đuống nối Hoàn Kiếm qua trung tâm quận Long Biên sang Gia Lâm – Bắc Ninh.',
    cognitiveTip:
      'Qua cầu Chương Dương là Nguyễn Văn Cừ; đi thẳng qua gầm Cầu Chui (QL5) đổi tên thành Ngô Gia Tự dẫn thẳng tới Cầu Đuống.'
  },
  {
    id: 'corridor-east-vinh-tuy-ql5',
    name: 'Hướng 3h (Đông): Minh Khai – Cầu Vĩnh Tuy – Cổ Linh – Cao tốc Hà Nội – Hải Phòng (5B)',
    clockPosition: '3h',
    direction: 'East-HaiPhong',
    bearingDeg: 90,
    segments: [
      'Đại Cồ Việt / Trần Khát Chân',
      'Minh Khai',
      'Cầu Vĩnh Tuy',
      'Đàm Quang Trung – Cổ Linh',
      'Cao tốc Hà Nội – Hải Phòng (QL5B) / Vinhomes Ocean Park'
    ],
    description:
      'Cửa ngõ hiện đại hướng Đông kết nối Hai Bà Trưng sang Aeon Mall Long Biên, Gia Lâm, Hưng Yên, Hải Phòng, Quảng Ninh.',
    cognitiveTip:
      'Hướng 3h chính Đông vượt Sông Hồng tại Vĩnh Tuy: tâm điểm phát triển các đại đô thị bờ Đông.'
  },
  {
    id: 'corridor-south-giai-phong',
    name: 'Hướng 6h (Chính Nam): Lê Duẩn – Giải Phóng – Ngọc Hồi (QL1A & Cao tốc Pháp Vân)',
    clockPosition: '6h',
    direction: 'South',
    bearingDeg: 180,
    segments: [
      'Ngã 5 Cửa Nam',
      'Lê Duẩn (Ga Hà Nội)',
      'Hầm Kim Liên (VĐ1)',
      'Giải Phóng (Bạch Mai – Ngã Tư Vọng)',
      'Bến xe Giáp Bát',
      'Nút Pháp Vân – Bến xe Nước Ngầm (VĐ3)',
      'Ngọc Hồi (QL1A) / Cao tốc Pháp Vân – Cầu Giẽ'
    ],
    description:
      'Trục xương sống phía Nam chạy kẹp sát đường sắt Bắc Nam, gom toàn bộ bệnh viện tuyến đầu (Bạch Mai), đại học (Bách – Kinh – Xây) và 2 bến xe phía Nam.',
    cognitiveTip:
      'Dấu hiệu nhận diện tuyệt đối: Đường ray tàu hỏa Bắc Nam luôn chạy song song sát cạnh suốt từ Lê Duẩn đến Ngọc Hồi!'
  },
  {
    id: 'corridor-sw-nguyen-trai',
    name: 'Hướng 7h (Tây Nam): Tôn Đức Thắng – Tây Sơn – Nguyễn Trãi – Trần Phú – Quang Trung (QL6)',
    clockPosition: '7h',
    direction: 'South-West',
    bearingDeg: 225,
    segments: [
      'Tôn Đức Thắng',
      'Ô Chợ Dừa (VĐ1)',
      'Nguyễn Lương Bằng – Tây Sơn',
      'Ngã Tư Sở (VĐ2)',
      'Nguyễn Trãi',
      'Nút Thanh Xuân (VĐ3)',
      'Trần Phú (Hà Đông)',
      'Cầu Trắng (Sông Nhuệ)',
      'Quang Trung (Hà Đông) – Ba La (QL6)'
    ],
    description:
      'Trục xuyên tâm đông đúc nhất Thủ đô, nối thẳng Đống Đa – Thanh Xuân – Hà Đông, có tuyến Metro 2A (Cát Linh – Hà Đông) chạy trên cao suốt từ Hoàng Cầu/Thái Hà đến Yên Nghĩa.',
    cognitiveTip:
      'Kỷ lục "1 đường thẳng 6 lần đổi tên": Tôn Đức Thắng → Nguyễn Lương Bằng → Tây Sơn → Nguyễn Trãi → Trần Phú → Quang Trung!'
  },
  {
    id: 'corridor-sw-lang-ha',
    name: 'Hướng 7h30 (Tây Nam 2): Giảng Võ – Láng Hạ – Lê Văn Lương – Tố Hữu (Tuyến BRT 01)',
    clockPosition: '7h30',
    direction: 'West-South-BRT',
    bearingDeg: 232,
    segments: [
      'Giảng Võ',
      'Cầu vượt Láng Hạ – La Thành',
      'Láng Hạ',
      'Cầu Hòa Mục (Đường Láng – VĐ2)',
      'Lê Văn Lương',
      'Hầm chui Khuất Duy Tiến (VĐ3)',
      'Tố Hữu',
      'Vạn Phúc – Dương Nội – Yên Nghĩa'
    ],
    description:
      'Hành lang tài chính – văn phòng – chung cư cao tầng song song phía Tây Bắc trục Nguyễn Trãi, nổi bật với làn ưu tiên buýt nhanh BRT 01.',
    cognitiveTip:
      'Kẹp chính giữa trục Nguyễn Trãi (bên trái khi đi ra ngoài) và trục Trần Duy Hưng (bên phải).'
  },
  {
    id: 'corridor-west-tran-duy-hung',
    name: 'Hướng 8h30 (Tây): Văn Cao – Liễu Giai – Nguyễn Chí Thanh – Trần Duy Hưng – Đại lộ Thăng Long',
    clockPosition: '8h30',
    direction: 'West',
    bearingDeg: 250,
    segments: [
      'Văn Cao (Hồ Tây)',
      'Liễu Giai (Lotte Center)',
      'Cầu vượt Nguyễn Chí Thanh – Kim Mã',
      'Nguyễn Chí Thanh',
      'Cầu vượt Đường Láng (VĐ2)',
      'Trần Duy Hưng',
      'Hầm chui Trung Hòa (VĐ3)',
      'Đại lộ Thăng Long (đi Khu CNC Hòa Lạc)'
    ],
    description:
      'Đại lộ cảnh quan hiện đại nối Hồ Tây xuyên qua Ba Đình – Đống Đa – Cầu Giấy ra thẳng cao tốc Láng – Hòa Lạc (6 làn cao tốc + 2 đường gom).',
    cognitiveTip:
      'Bẫy xe máy cực quan trọng: Khi đi hết hầm Trung Hòa sang Đại lộ Thăng Long, xe máy BẮT BUỘC đi vào làn đường gom bên phải, cấm tuyệt đối vào làn cao tốc giữa!'
  },
  {
    id: 'corridor-west-cau-giay',
    name: 'Hướng 9h30 (Tây – Tây Bắc): Kim Mã – Cầu Giấy – Xuân Thủy – Hồ Tùng Mậu – Cầu Diễn – Nhổn (QL32)',
    clockPosition: '9h30',
    direction: 'West-North',
    bearingDeg: 280,
    segments: [
      'Nguyễn Thái Học / Kim Mã',
      'Nút Voi Phục (Hồ Thủ Lệ)',
      'Cầu Giấy (VĐ2)',
      'Xuân Thủy',
      'Cầu vượt Mai Dịch (VĐ3)',
      'Hồ Tùng Mậu',
      'Cầu Diễn (Sông Nhuệ)',
      'Phố Nhổn – Quốc lộ 32 (đi Đan Phượng – Sơn Tây)'
    ],
    description:
      'Hành lang đại học và công nghệ phía Tây, có đường sắt đô thị trên cao Metro số 3 (Nhổn – Cầu Giấy – Ga Hà Nội) chạy dọc dải phân cách giữa.',
    cognitiveTip:
      'Nắng chiều 16h30–17h30 chiếu thẳng mặt khi đi ra hướng Nhổn. Nhìn thấy trụ ga Metro số 3 là biết chắc đang ở trục Cầu Giấy – Xuân Thủy – Hồ Tùng Mậu – Cầu Diễn.'
  },
  {
    id: 'corridor-nw-pham-van-dong',
    name: 'Hướng 11h (Tây Bắc): Phạm Hùng – Mai Dịch – Phạm Văn Đồng – Cầu Thăng Long – Võ Văn Kiệt',
    clockPosition: '11h',
    direction: 'North-West-Ring3',
    bearingDeg: 345,
    segments: [
      'Phạm Hùng',
      'Cầu vượt Mai Dịch',
      'Phạm Văn Đồng (Công viên Hòa Bình – Ciputra)',
      'Cầu Thăng Long',
      'Võ Văn Kiệt (KCN Bắc Thăng Long – Nội Bài / Mê Linh)'
    ],
    description:
      'Trục hướng Bắc nối Mỹ Đình – Cầu Giấy qua Bắc Từ Liêm vượt Cầu Thăng Long đi KCN Bắc Thăng Long, Mê Linh và Vĩnh Phúc.',
    cognitiveTip:
      'Song song phía Tây với trục Võ Chí Công – Nhật Tân: đi KCN Bắc Thăng Long / Mê Linh chọn Cầu Thăng Long; đi thẳng sảnh sân bay Nội Bài chọn Cầu Nhật Tân.'
  }
];

// ============================================================================
// 5. MẠNG LƯỚI Ô BÀN CỜ PHỐ PHÁP & CẶP MỘT CHIỀU ĐỐI XỨNG (ĐÃ KIỂM CHỨNG THỰC TẾ)
// ============================================================================
export const HANOI_FRENCH_GRID_STREETS: IHanoiEntity[] = [
  // Trục Đông - Tây (Song song ∥)
  {
    id: 'st-trang-thi',
    name: 'Tràng Tiền – Hàng Khay – Tràng Thi',
    alias: 'Trục 1 chiều Đông → Tây sát bờ Nam Hồ Gươm',
    type: 'french_street',
    category: 'path',
    district: 'Hoàn Kiếm',
    coords: { lat: 21.0265, lng: 105.8515 },
    bearingDeg: 275,
    isOneWay: true,
    oneWayDirection: 'Một chiều xuyên suốt từ ĐÔNG sang TÂY (Nhà Hát Lớn → Tràng Tiền → Hàng Khay → Tràng Thi → Ngã 5 Cửa Nam)',
    historicalEra: 'french_colonial',
    description:
      'Chuỗi 3 phố nối tiếp thẳng tắp dọc mép Nam Hồ Gươm, từ Quảng trường Nhà Hát Lớn qua ngã tư Hàng Bài – Bà Triệu tới Bệnh viện Việt Đức và Ngã 5 Cửa Nam.',
    cognitiveTip:
      'Bẫy 1 chiều số 1 Bờ Hồ: Đang ở Cửa Nam KHÔNG THỂ đi thẳng Tràng Thi về Nhà Hát Lớn; phải xuống Hai Bà Trưng, Lý Thường Kiệt hoặc Trần Hưng Đạo!',
    practiceModeRecommended: 'oneway_turn_trap'
  },
  {
    id: 'st-hai-ba-trung',
    name: 'Hai Bà Trưng',
    alias: 'Trục Đông – Tây song song thứ 2 dưới Hồ Gươm',
    type: 'french_street',
    category: 'path',
    district: 'Hoàn Kiếm',
    coords: { lat: 21.025, lng: 105.851 },
    bearingDeg: 95,
    isOneWay: false,
    historicalEra: 'french_colonial',
    description:
      'Tuyến phố 2 chiều sầm uất chạy song song giữa Tràng Thi và Lý Thường Kiệt, nối từ Lê Thánh Tông qua Hàng Bài, Bà Triệu, Quán Sứ (Hỏa Lò, Bệnh viện K) tới Lê Duẩn.',
    cognitiveTip:
      'Đi 2 chiều thuận lợi, đóng vai trò đường đối lưu hoàn hảo để quay từ Cửa Nam / Lê Duẩn sang phía Đông khi Tràng Thi cấm chiều ngược lại.',
    practiceModeRecommended: 'which_intersection'
  },
  {
    id: 'st-ly-thuong-kiet',
    name: 'Lý Thường Kiệt',
    alias: 'Đại lộ Biệt Thự Pháp & Hành Chính (Đông – Tây)',
    type: 'french_street',
    category: 'path',
    district: 'Hoàn Kiếm',
    coords: { lat: 21.0235, lng: 105.851 },
    bearingDeg: 95,
    isOneWay: false,
    historicalEra: 'french_colonial',
    description:
      'Đại lộ 2 chiều rộng thoáng nằm chính giữa Hai Bà Trưng và Trần Hưng Đạo, nối từ Đại học Dược (Lê Thánh Tông) đến mặt tiền bên hông Ga Hà Nội (Lê Duẩn).',
    cognitiveTip:
      'Trục trung tâm cân đối nhất khu Phố Pháp: cắt vuông góc (⊥) lần lượt Phan Chu Trinh, Ngô Quyền, Hàng Bài, Bà Triệu, Quang Trung, Quán Sứ, Phan Bội Châu.',
    practiceModeRecommended: 'which_intersection'
  },
  {
    id: 'st-tran-hung-dao',
    name: 'Trần Hưng Đạo',
    alias: 'Đại lộ Gambetta cũ – Trục xương sống Nam Phố Pháp',
    type: 'french_street',
    category: 'path',
    district: 'Hoàn Kiếm',
    coords: { lat: 21.0218, lng: 105.851 },
    bearingDeg: 95,
    isOneWay: false,
    historicalEra: 'french_colonial',
    description:
      'Đại lộ 2 chiều rộng nhất khu Phố Pháp, nối trực diện cổng chính Ga Hà Nội (Lê Duẩn) qua Cung Văn hóa Hữu nghị Việt Xô tới Bệnh viện TW Quân đội 108 (Đê Trần Khánh Dư).',
    cognitiveTip:
      'Mốc ranh giới đổi tên: Phố Hàng Bài đi từ Bờ Hồ xuống, cắt qua ngã tư Trần Hưng Đạo – Hàm Long sẽ nối tiếp với Phố Huế.',
    practiceModeRecommended: 'corridor_chain'
  },
  {
    id: 'st-nguyen-thai-hoc',
    name: 'Nguyễn Thái Học',
    alias: 'Trục 1 chiều Tây → Đông từ Kim Mã về Cửa Nam',
    type: 'french_street',
    category: 'path',
    district: 'Ba Đình - Đống Đa - Hoàn Kiếm',
    coords: { lat: 21.0295, lng: 105.838 },
    bearingDeg: 105,
    isOneWay: true,
    oneWayDirection: 'Một chiều từ TÂY sang ĐÔNG (từ Kim Mã – Sơn Tây qua Văn Miếu, Bảo tàng Mỹ thuật về Lê Duẩn – Cửa Nam)',
    historicalEra: 'french_colonial',
    description:
      'Trục dẫn lưu một chiều đón toàn bộ phương tiện từ Cầu Giấy – Kim Mã đổ thẳng về trung tâm Cửa Nam – Hoàn Kiếm, chạy sát tường phía Bắc Văn Miếu.',
    cognitiveTip:
      'Muốn đi từ Kim Mã về Hồ Gươm → đi Nguyễn Thái Học → Cửa Nam. Muốn đi ngược từ Cửa Nam về Lăng Bác / Kim Mã → đi Điện Biên Phủ hoặc Trần Phú!',
    practiceModeRecommended: 'oneway_turn_trap'
  },

  // Trục Bắc - Nam (Vuông góc ⊥)
  {
    id: 'st-hang-bai',
    name: 'Hàng Bài',
    alias: 'Trục 1 chiều Nam → Bắc dẫn thẳng vào Đinh Tiên Hoàng (Bờ Hồ)',
    type: 'french_street',
    category: 'path',
    district: 'Hoàn Kiếm',
    coords: { lat: 21.0245, lng: 105.8535 },
    bearingDeg: 5,
    isOneWay: true,
    oneWayDirection: 'Một chiều từ NAM lên BẮC (từ Hàm Long / Trần Hưng Đạo → Hàng Khay / Đinh Tiên Hoàng)',
    historicalEra: 'french_colonial',
    description:
      'Đoạn nối tiếp phía Bắc của Phố Huế dẫn thẳng vào Tràng Tiền Plaza và bờ Đông Hồ Gươm (Đinh Tiên Hoàng).',
    cognitiveTip:
      'Nằm trên cùng 1 đường thẳng hướng Bắc với Phố Huế và Đinh Tiên Hoàng: Đại Cồ Việt → Phố Huế → Hàng Bài → Đinh Tiên Hoàng.',
    practiceModeRecommended: 'oneway_turn_trap'
  },
  {
    id: 'st-pho-hue',
    name: 'Phố Huế',
    alias: 'Trục 1 chiều NAM → BẮC (Đại Cồ Việt lên Hàng Bài – Bờ Hồ)',
    type: 'french_street',
    category: 'path',
    district: 'Hai Bà Trưng - Hoàn Kiếm',
    coords: { lat: 21.0165, lng: 105.8525 },
    bearingDeg: 5,
    isOneWay: true,
    oneWayDirection: 'Một chiều từ NAM lên BẮC (từ ngã tư Đại Cồ Việt – Bạch Mai đi thẳng lên Hàng Bài về Hồ Gươm)',
    historicalEra: 'french_colonial',
    description:
      'Trục thương mại huyết mạch đón luồng xe từ Bạch Mai và Vành đai 1 (Đại Cồ Việt – Trần Khát Chân) tiến thẳng về Hồ Gươm.',
    cognitiveTip:
      'MẸO NHỚ BẤT HỦ TRÁNH NHẦM: Số nhà Phố Huế đánh tăng từ Bắc xuống Nam (số 1 gần Hàng Bài, số 368 ở Đại Cồ Việt), NHƯNG chiều xe chạy lại đi NGƯỢC số nhà: 1 chiều từ NAM lên BẮC (Đại Cồ Việt → Hàng Bài)!',
    practiceModeRecommended: 'oneway_turn_trap'
  },
  {
    id: 'st-ba-trieu',
    name: 'Bà Triệu',
    alias: 'Trục 1 chiều BẮC → NAM (Hồ Gươm xuống Đại Cồ Việt)',
    type: 'french_street',
    category: 'path',
    district: 'Hoàn Kiếm - Hai Bà Trưng',
    coords: { lat: 21.0185, lng: 105.8498 },
    bearingDeg: 185,
    isOneWay: true,
    oneWayDirection: 'Một chiều từ BẮC xuống NAM (từ Hàng Khay / Lê Thái Tổ chạy thẳng xuống Đại Cồ Việt; riêng đoạn cuối Đại Cồ Việt – Lê Đại Hành cạnh Vincom đi 2 chiều)',
    historicalEra: 'french_colonial',
    description:
      'Cặp bài trùng song song cách Phố Huế 1 ô phố về phía Tây, dẫn toàn bộ dòng xe từ bờ Tây Hồ Gươm (Lê Thái Tổ) thoát thẳng xuống Vành đai 1 (Đại Cồ Việt).',
    cognitiveTip:
      'Khẩu quyết 6 chữ vàng: "PHỐ HUẾ LÊN HỒ – BÀ TRIỆU XUỐNG ĐAI" (Phố Huế đi Bắc lên Hồ Gươm; Bà Triệu đi Nam xuống Đại Cồ Việt).',
    practiceModeRecommended: 'oneway_turn_trap'
  },
  {
    id: 'st-quang-trung',
    name: 'Quang Trung (Hoàn Kiếm)',
    alias: 'Trục Bắc – Nam nối Nhà Thờ Lớn / Tràng Thi xuống Hồ Thiền Quang',
    type: 'french_street',
    category: 'path',
    district: 'Hoàn Kiếm - Hai Bà Trưng',
    coords: { lat: 21.022, lng: 105.8478 },
    bearingDeg: 185,
    isOneWay: false,
    historicalEra: 'french_colonial',
    description:
      'Chạy song song phía Tây phố Bà Triệu, nối từ khu vực Nhà Chung / Tràng Thi qua Thư viện Quốc gia xuống thẳng bờ Tây Hồ Thiền Quang.',
    cognitiveTip:
      'Phân biệt 2 đường Quang Trung ở Hà Nội: Quang Trung (Hoàn Kiếm) là phố Pháp ngắn rợp cây sấu cạnh Hồ Thiền Quang; Quang Trung (Hà Đông) là đại lộ Quốc lộ 6 có tàu điện trên cao!',
    practiceModeRecommended: 'which_intersection'
  },
  {
    id: 'st-quan-su',
    name: 'Quán Sứ',
    alias: 'Trục Bắc – Nam qua Chùa Quán Sứ & Bệnh viện K',
    type: 'french_street',
    category: 'path',
    district: 'Hoàn Kiếm',
    coords: { lat: 21.024, lng: 105.845 },
    bearingDeg: 185,
    isOneWay: false,
    historicalEra: 'french_colonial',
    description:
      'Nối từ Hàng Bông / Thợ Nhuộm cắt vuông góc (⊥) Tràng Thi, Hai Bà Trưng, Lý Thường Kiệt, Trần Hưng Đạo xuống Cung Văn hóa Việt Xô.',
    cognitiveTip:
      'Nằm giữa Quang Trung và Lê Duẩn; địa chỉ của Chùa Quán Sứ (trụ sở Giáo hội Phật giáo VN) và Bệnh viện K cơ sở Quán Sứ.',
    practiceModeRecommended: 'address_decoder'
  },
  {
    id: 'st-phan-boi-chau',
    name: 'Phan Bội Châu',
    alias: 'Phố Bắc – Nam sát phía Đông đường Lê Duẩn / Ga Hà Nội',
    type: 'french_street',
    category: 'path',
    district: 'Hoàn Kiếm',
    coords: { lat: 21.0245, lng: 105.8425 },
    bearingDeg: 185,
    isOneWay: true,
    oneWayDirection: 'Một chiều ô tô theo phân đoạn Bắc → Nam (Cửa Nam → Trần Hưng Đạo)',
    historicalEra: 'french_colonial',
    description:
      'Tuyến phố yên tĩnh rợp cây cổ thụ chạy song song ngay phía Đông đường Lê Duẩn, cắt ngang Hai Bà Trưng, Lý Thường Kiệt và kết thúc tại Trần Hưng Đạo.',
    cognitiveTip:
      'Trục đệm song song giúp giảm tải cho ngã tư Cửa Nam – Lê Duẩn trước cửa Ga Hà Nội.',
    practiceModeRecommended: 'which_intersection'
  }
];

// ============================================================================
// 6. ĐIỂM NEO THỊ GIÁC & CHÂN TRỜI (LANDMARKS & SKYLINE)
// ============================================================================
export const HANOI_LANDMARKS: IHanoiEntity[] = [
  {
    id: 'lm-keangnam',
    name: 'Keangnam Landmark 72',
    alias: 'Ngọn Hải Đăng Khu Tây (336m · 72 tầng)',
    type: 'landmark',
    category: 'landmark',
    district: 'Nam Từ Liêm (Phạm Hùng – Vành đai 3)',
    coords: { lat: 21.017, lng: 105.784 },
    heightTier: 'skyline',
    description:
      'Tòa tháp cao nhất Hà Nội (336m) nằm trên trục Phạm Hùng (Vành đai 3) giao Dương Đình Nghệ – Mễ Trì, nhìn thấy rõ từ bán kính 5–8 km.',
    cognitiveTip:
      'Mốc tam giác đạc (Skyline Triangulation) số 1 khu Tây: Từ Cầu Giấy / Mỹ Đình / Thanh Xuân, cứ hướng về phía đỉnh tháp Keangnam là tìm thấy trục Phạm Hùng (Vành đai 3).',
    practiceModeRecommended: 'gps_loss_recovery'
  },
  {
    id: 'lm-lotte-center',
    name: 'Lotte Center Hà Nội',
    alias: 'Tháp Đôi Áo Dài Ba Đình (267m · 65 tầng)',
    type: 'landmark',
    category: 'landmark',
    district: 'Ba Đình (Ngã tư Liễu Giai – Đào Tấn – Kim Mã)',
    coords: { lat: 21.032, lng: 105.812 },
    heightTier: 'skyline',
    description:
      'Tòa nhà 65 tầng lấy cảm hứng tà áo dài Việt Nam tại nút giao Liễu Giai – Đào Tấn – Kim Mã – Nguyễn Chí Thanh, sát Hồ Thủ Lệ.',
    cognitiveTip:
      'Cặp mốc phân biệt hướng cực chuẩn: Keangnam đỉnh phẳng vuông vức (ở Vành đai 3 – Mỹ Đình); Lotte có khe chữ V trên đỉnh (ở ranh giới Ba Đình – Cầu Giấy gần Vành đai 2).',
    practiceModeRecommended: 'gps_loss_recovery'
  },
  {
    id: 'lm-technopark',
    name: 'TechnoPark Tower & Ocean Park',
    alias: 'Cực Đô Thị Mới Phía Đông Gia Lâm (186m)',
    type: 'landmark',
    category: 'landmark',
    district: 'Gia Lâm (Tả ngạn Đông Nam)',
    coords: { lat: 20.995, lng: 105.945 },
    heightTier: 'skyline',
    description:
      'Tổ hợp tháp văn phòng thông minh nằm sát Cao tốc Hà Nội – Hải Phòng (QL5B), biểu tượng cho cực đô thị mới bên kia Sông Hồng.',
    cognitiveTip:
      'Đánh dấu cửa ngõ phía Đông Nam sau khi vượt Cầu Vĩnh Tuy hoặc Cầu Thanh Trì.',
    practiceModeRecommended: 'route_planner_ab'
  },
  {
    id: 'lm-lang-bac',
    name: 'Lăng Chủ Tịch Hồ Chí Minh & Quảng Trường Ba Đình',
    alias: 'Trái Tim Chính Trị Quốc Gia',
    type: 'landmark',
    category: 'landmark',
    district: 'Ba Đình (Hùng Vương – Độc Lập – Điện Biên Phủ)',
    coords: { lat: 21.037, lng: 105.834 },
    heightTier: 'local',
    description:
      'Trung tâm hành chính – chính trị cấp Quốc gia, bao quanh bởi Tòa nhà Quốc hội, Phủ Chủ tịch, Chùa Một Cột và Hoàng Thành Thăng Long.',
    cognitiveTip:
      'Nằm chính giữa Hồ Tây (phía Bắc) và Ga Hà Nội / Văn Miếu (phía Nam); cách Hồ Gươm ~1.8 km về phía Tây Bắc theo trục Điện Biên Phủ – Hàng Bông.',
    practiceModeRecommended: 'which_intersection'
  },
  {
    id: 'lm-nha-hat-lon',
    name: 'Nhà Hát Lớn Hà Nội',
    alias: 'Quảng Trường Cách Mạng Tháng Tám (Đầu Đông Tràng Tiền)',
    type: 'landmark',
    category: 'landmark',
    district: 'Hoàn Kiếm',
    coords: { lat: 21.024, lng: 105.858 },
    heightTier: 'local',
    historicalEra: 'french_colonial',
    description:
      'Kiệt tác kiến trúc Pháp (1911) đặt tại điểm khởi đầu phía Đông của trục một chiều Tràng Tiền – Hàng Khay – Tràng Thi, sát đê Trần Quang Khải – Trần Khánh Dư.',
    cognitiveTip:
      'Đứng trước mặt tiền Nhà Hát Lớn nhìn thẳng theo phố Tràng Tiền là nhìn chính TÂY về phía Hồ Gươm; sau lưng Nhà Hát Lớn 200m là đê Sông Hồng.',
    practiceModeRecommended: 'oneway_turn_trap'
  },
  {
    id: 'lm-van-mieu',
    name: 'Văn Miếu – Quốc Tử Giám',
    alias: 'Mốc Bản Lề 3 Quận Ba Đình – Đống Đa – Hoàn Kiếm',
    type: 'landmark',
    category: 'landmark',
    district: 'Đống Đa',
    coords: { lat: 21.028, lng: 105.836 },
    heightTier: 'local',
    historicalEra: 'ancient',
    description:
      'Quần thể trường đại học cổ đầu tiên của Việt Nam (1070), được bao bởi 4 phố: Nguyễn Thái Học (Bắc), Văn Miếu (Đông), Quốc Tử Giám (Nam), Tôn Đức Thắng (Tây).',
    cognitiveTip:
      'Điểm khởi phát của trục xuyên tâm Tây Nam (Tôn Đức Thắng → Nguyễn Lương Bằng → Tây Sơn → Nguyễn Trãi).',
    practiceModeRecommended: 'corridor_chain'
  },
  {
    id: 'lm-ga-ha-noi',
    name: 'Ga Hà Nội',
    alias: 'Ga Hàng Cỏ (Đầu Tây Đại Lộ Trần Hưng Đạo)',
    type: 'landmark',
    category: 'landmark',
    district: 'Hoàn Kiếm - Đống Đa (Lê Duẩn)',
    coords: { lat: 21.025, lng: 105.841 },
    heightTier: 'local',
    historicalEra: 'french_colonial',
    description:
      'Đầu mối đường sắt Bắc – Nam nằm trên đường Lê Duẩn, mặt tiền nhìn thẳng dọc đại lộ Trần Hưng Đạo về phía Đông.',
    cognitiveTip:
      'Nút khóa chữ T khổng lồ: Đại lộ Trần Hưng Đạo đâm vuông góc vào chính diện Ga Hà Nội trên đường Lê Duẩn; đồng thời là ga cuối quy hoạch của tuyến Metro số 3.',
    practiceModeRecommended: 'which_intersection'
  },
  {
    id: 'lm-cho-dong-xuan',
    name: 'Chợ Đồng Xuân & Ô Quan Chưởng',
    alias: 'Đỉnh Bắc Trục 36 Phố Phường',
    type: 'landmark',
    category: 'landmark',
    district: 'Hoàn Kiếm',
    coords: { lat: 21.0375, lng: 105.850 },
    heightTier: 'local',
    historicalEra: 'ancient',
    description:
      'Chợ đầu mối lịch sử nằm ở điểm cuối phía Bắc của trục phố cổ Hàng Đào – Hàng Ngang – Hàng Đường – Đồng Xuân, sát đầu cầu Long Biên.',
    cognitiveTip:
      'Từ bờ Bắc Hồ Gươm đi thẳng một mạch hướng Bắc qua Hàng Đào → Hàng Ngang → Hàng Đường sẽ gặp Chợ Đồng Xuân rồi chạm Hàng Đậu (đầu cầu Long Biên).',
    practiceModeRecommended: 'superblock_cell'
  },
  {
    id: 'lm-svd-my-dinh',
    name: 'Sân Vận Động Quốc Gia Mỹ Đình',
    alias: 'Tâm Khu Liên Hợp Thể Thao Phía Tây',
    type: 'landmark',
    category: 'landmark',
    district: 'Nam Từ Liêm (Lê Đức Thọ – Lê Quang Đạo)',
    coords: { lat: 21.0205, lng: 105.764 },
    heightTier: 'local',
    description:
      'Quảng trường rộng mở bậc nhất khu Tây tại điểm chuyển tiếp giữa đường Lê Đức Thọ (phía Bắc) và đại lộ Lê Quang Đạo (phía Nam đi Mễ Trì / Đại lộ Thăng Long).',
    cognitiveTip:
      'Mốc biên phía Tây của Ô Đô thị Mỹ Đình: đứng trước sân nhìn hướng Đông là về Phạm Hùng – Keangnam.',
    practiceModeRecommended: 'superblock_cell'
  }
];

// ============================================================================
// 7. CÁC ĐẠI NÚT GIAO ĐA TẦNG & CỬA Ô (STRATEGIC JUNCTIONS & NODES)
// ============================================================================
export const HANOI_JUNCTIONS: IHanoiEntity[] = [
  {
    id: 'junc-nga-tu-so',
    name: 'Ngã Tư Sở',
    alias: 'Nút Giao Vành Đai 2 × Trục Tây Nam (Cầu Vượt + Đường Trên Cao)',
    type: 'junction',
    category: 'node',
    district: 'Đống Đa - Thanh Xuân',
    coords: { lat: 21.0028, lng: 105.8202 },
    connectedStreets: ['Tây Sơn', 'Nguyễn Trãi', 'Đường Láng', 'Trường Chinh'],
    description:
      'Giao điểm chiến lược giữa Vành đai 2 (Trường Chinh ↔ Đường Láng) và trục hướng tâm Tây Nam (Tây Sơn ↔ Nguyễn Trãi), sát Royal City và sông Tô Lịch.',
    cognitiveTip:
      'Đứng từ Tây Sơn nhìn ra ngoại thành: đi thẳng cầu vượt = Nguyễn Trãi (Hà Đông); rẽ phải dọc sông = Đường Láng (Cầu Giấy); rẽ trái = Trường Chinh (Giải Phóng / Vĩnh Tuy).',
    practiceModeRecommended: 'which_intersection'
  },
  {
    id: 'junc-o-cho-dua',
    name: 'Ngã 6 – Ngã 7 Ô Chợ Dừa',
    alias: 'Nút Giao Cửa Ô Lịch Sử Vành Đai 1 × Trục Tây Nam',
    type: 'junction',
    category: 'node',
    district: 'Đống Đa',
    coords: { lat: 21.0195, lng: 105.8282 },
    connectedStreets: ['Xã Đàn', 'Hoàng Cầu (Ô Chợ Dừa)', 'Tôn Đức Thắng', 'Nguyễn Lương Bằng', 'Khâm Thiên', 'Đê La Thành'],
    description:
      'Đầu mối hội tụ 6–7 nhánh đường lớn với cầu vượt thép nối Hoàng Cầu sang Xã Đàn trên tuyến Vành đai 1.',
    cognitiveTip:
      'Nắm 2 trục chính cắt nhau trước tiên: Vành đai 1 (Xã Đàn ↔ Hoàng Cầu) cắt trục hướng tâm (Tôn Đức Thắng ↔ Nguyễn Lương Bằng); còn Khâm Thiên chĩa về Ga Hà Nội, Đê La Thành chạy trên gò cao.',
    practiceModeRecommended: 'which_intersection'
  },
  {
    id: 'junc-nga-tu-vong',
    name: 'Ngã Tư Vọng',
    alias: 'Nút Giao 4 Tầng Vành Đai 2 × Trục Giải Phóng',
    type: 'junction',
    category: 'node',
    district: 'Hai Bà Trưng - Đống Đa - Thanh Xuân',
    coords: { lat: 20.9995, lng: 105.8412 },
    connectedStreets: ['Giải Phóng', 'Trường Chinh', 'Đại La'],
    description:
      'Tổ hợp giao thông gồm đường sắt Bắc Nam, mặt đất, cầu vượt hướng Giải Phóng và đường Vành đai 2 trên cao (Trường Chinh ↔ Đại La), ngay sát Bệnh viện Bạch Mai và ĐH Kinh tế Quốc dân.',
    cognitiveTip:
      'Khóa tọa độ phía Đông Nam Vành đai 2: từ đây đi Bắc là Bạch Mai / Đại Cồ Việt; đi Nam là Giáp Bát; đi Tây là Ngã Tư Sở; đi Đông là Minh Khai – Vĩnh Tuy.',
    practiceModeRecommended: 'which_intersection'
  },
  {
    id: 'junc-trung-hoa',
    name: 'Nút Giao Trung Hòa (Big C)',
    alias: 'Nút Giao 4 Tầng Vành Đai 3 × Đại Lộ Thăng Long',
    type: 'junction',
    category: 'node',
    district: 'Cầu Giấy - Nam Từ Liêm - Thanh Xuân',
    coords: { lat: 21.0068, lng: 105.7905 },
    connectedStreets: ['Trần Duy Hưng', 'Đại lộ Thăng Long', 'Phạm Hùng', 'Khuất Duy Tiến'],
    description:
      'Nút giao hoàn chỉnh 4 tầng hiện đại bậc nhất Hà Nội: Hầm chui thông suốt Trần Duy Hưng ↔ Đại lộ Thăng Long, đảo xuyến mặt đất, các nhánh rẽ và đường cao tốc trên cao Vành đai 3.',
    cognitiveTip:
      'Xe máy được đi qua hầm Trung Hòa nhưng ngay khi chui lên đầu phía Tây (Đại lộ Thăng Long) phải chuyển ngay sang làn đường gom bên phải!',
    practiceModeRecommended: 'oneway_turn_trap'
  },
  {
    id: 'junc-thanh-xuan',
    name: 'Nút Giao Thanh Xuân',
    alias: 'Nút Giao 4 Tầng Vành Đai 3 × Nguyễn Trãi (Metro 2A)',
    type: 'junction',
    category: 'node',
    district: 'Thanh Xuân',
    coords: { lat: 20.9932, lng: 105.8028 },
    connectedStreets: ['Nguyễn Trãi', 'Trần Phú (Hà Đông)', 'Khuất Duy Tiến', 'Nguyễn Xiển'],
    description:
      'Nút giao 4 tầng độc đáo nhất Thủ đô nơi 4 hệ thống chồng lên nhau: Hầm chui Nguyễn Trãi (tầng âm), vòng xuyến mặt đất, đường trên cao Vành đai 3 (tầng 2) và cầu cạn tàu điện Metro 2A trên đỉnh (tầng 3).',
    cognitiveTip:
      'Ranh giới chính thức đổi tên đường từ Nguyễn Trãi (Thanh Xuân) sang Trần Phú (Hà Đông). Xe máy đi được qua hầm chui Thanh Xuân cả 2 chiều.',
    practiceModeRecommended: 'corridor_chain'
  },
  {
    id: 'junc-mai-dich',
    name: 'Nút Giao Mai Dịch',
    alias: 'Nút Giao Đa Tầng Vành Đai 3 × Trục Xuân Thủy – Hồ Tùng Mậu (Metro 3)',
    type: 'junction',
    category: 'node',
    district: 'Cầu Giấy - Nam Từ Liêm - Bắc Từ Liêm',
    coords: { lat: 21.0375, lng: 105.7785 },
    connectedStreets: ['Xuân Thủy', 'Hồ Tùng Mậu', 'Phạm Hùng', 'Phạm Văn Đồng'],
    description:
      'Tổ hợp cầu cạn Vành đai 3 kèm 2 cầu vượt thép đô thị chạy song song hai bên và tuyến đường sắt trên cao Metro số 3 vượt ngang bên trên.',
    cognitiveTip:
      'Điểm bản lề Tây Bắc: đổi tên Phạm Hùng ↔ Phạm Văn Đồng (trên VĐ3) và đổi tên Xuân Thủy ↔ Hồ Tùng Mậu (trên trục QL32).',
    practiceModeRecommended: 'which_intersection'
  },
  {
    id: 'junc-cau-giay',
    name: 'Nút Giao Cầu Giấy – Đường Láng',
    alias: 'Cửa Ngõ Sông Tô Lịch (Vành Đai 2 × Trục Cầu Giấy)',
    type: 'junction',
    category: 'node',
    district: 'Cầu Giấy - Ba Đình - Đống Đa',
    coords: { lat: 21.0289, lng: 105.8038 },
    connectedStreets: ['Kim Mã', 'Cầu Giấy', 'Đường Láng', 'Bưởi', 'Nguyễn Khang'],
    description:
      'Cửa ngõ phía Tây lịch sử nơi trục Kim Mã – Cầu Giấy vượt sông Tô Lịch, đồng thời là ga cuối trên cao (Ga Cầu Giấy) của giai đoạn 1 tuyến Metro số 3.',
    cognitiveTip:
      'Nơi Đường Láng kết thúc để chuyển tiếp lên đường Bưởi – Võ Chí Công (hướng Bắc đi Nhật Tân).',
    practiceModeRecommended: 'corridor_chain'
  },
  {
    id: 'junc-phap-van',
    name: 'Nút Giao Pháp Vân – Nước Ngầm',
    alias: 'Cửa Ngõ Nam Thủ Đô (Vành Đai 3 × QL1A × Cao Tốc Pháp Vân – Cầu Giẽ)',
    type: 'junction',
    category: 'node',
    district: 'Hoàng Mai - Thanh Trì',
    coords: { lat: 20.9652, lng: 105.8458 },
    connectedStreets: ['Giải Phóng', 'Ngọc Hồi (QL1A)', 'Hoàng Liệt (Vành đai 3)', 'Cao tốc Pháp Vân – Cầu Giẽ'],
    description:
      'Nút giao cửa ngõ phía Nam đón toàn bộ lưu lượng cao tốc Bắc – Nam (CT.01) đổ vào Vành đai 3 (đi Cầu Thanh Trì hoặc Khuất Duy Tiến) và đường Giải Phóng.',
    cognitiveTip:
      'Lưu ý sống còn cho xe máy: CẤM TUYỆT ĐỐI đi vào nhánh Cao tốc Pháp Vân – Cầu Giẽ; xe máy đi các tỉnh phía Nam phải bám thẳng Quốc lộ 1A cũ (đường Ngọc Hồi)!',
    practiceModeRecommended: 'oneway_turn_trap'
  }
];

export const ALL_HANOI_ENTITIES: IHanoiEntity[] = [
  ...HANOI_WATER_EDGES,
  ...HANOI_BRIDGES,
  ...HANOI_RING_ROADS,
  ...HANOI_FRENCH_GRID_STREETS,
  ...HANOI_LANDMARKS,
  ...HANOI_JUNCTIONS
];

// ============================================================================
// 8. CẤU TRÚC MẶT ĐỒNG HỒ 12 GIỜ TÂM HỒ GƯƠM / BA ĐÌNH (CLOCK-FACE MNEMONIC)
// ============================================================================
export interface IHanoiClockSpoke {
  clockLabel: string;
  angleDeg: number;
  compassVi: string;
  title: string;
  streetChain: string[];
  ringIntersections: string[];
  externalGateway: string;
  transitHighlight?: string;
  memoryHook: string;
}

export const HANOI_CLOCK_RADIALS: IHanoiClockSpoke[] = [
  {
    clockLabel: '12h',
    angleDeg: 5,
    compassVi: 'Chính Bắc',
    title: 'Trục Nội Bài – Nhật Tân',
    streetChain: ['Liễu Giai / Bưởi', 'Võ Chí Công', 'Cầu Nhật Tân', 'Võ Nguyên Giáp'],
    ringIntersections: ['Nút Bưởi (VĐ2)', 'Phú Thượng (VĐ2.5)', 'Vĩnh Ngọc (Đông Anh)'],
    externalGateway: 'Sân bay Quốc tế Nội Bài, Thái Nguyên (QL3 mới), Lào Cai (CT.05)',
    memoryHook: '12 giờ đỉnh đầu = Cất cánh bay thẳng lên Nội Bài qua 5 tháp Cầu Nhật Tân.'
  },
  {
    clockLabel: '1h',
    angleDeg: 35,
    compassVi: 'Bắc – Đông Bắc',
    title: 'Trục Đông Trù – Quốc Lộ 3',
    streetChain: ['Yên Phụ / Long Biên', 'Ngọc Thụy – Lý Sơn', 'Cầu Đông Trù (Sông Đuống)', 'Trường Sa – Quốc lộ 3'],
    ringIntersections: ['Đầu cầu Long Biên', 'Cầu Đông Trù (VĐ2 Bắc)'],
    externalGateway: 'Đông Anh (Cổ Loa), Sóc Sơn, Thái Nguyên',
    memoryHook: '1 giờ = Vượt liền 2 sông (Sông Hồng + Sông Đuống qua cầu vòm thép Đông Trù) sang đất Cổ Loa.'
  },
  {
    clockLabel: '2h',
    angleDeg: 60,
    compassVi: 'Đông Bắc',
    title: 'Trục Chương Dương – Quốc Lộ 1A Bắc',
    streetChain: ['Trần Nhật Duật', 'Cầu Chương Dương', 'Nguyễn Văn Cừ', 'Cầu Chui', 'Ngô Gia Tự', 'Cầu Đuống', 'Hà Huy Tập (Yên Viên)'],
    ringIntersections: ['Đê VĐ1', 'Cầu Chui (VĐ2 Nguyễn Văn Linh)', 'Ninh Hiệp (VĐ3 Bắc)'],
    externalGateway: 'Gia Lâm (Yên Viên), Từ Sơn, Bắc Ninh, Bắc Giang, Lạng Sơn',
    memoryHook: '2 giờ = Trục thương mại thiên lý Bắc Ninh – Lạng Sơn qua Chương Dương & Cầu Đuống.'
  },
  {
    clockLabel: '3h',
    angleDeg: 90,
    compassVi: 'Chính Đông',
    title: 'Trục Vĩnh Tuy – Quốc Lộ 5 & Cao Tốc 5B',
    streetChain: ['Trần Khát Chân / Minh Khai', 'Cầu Vĩnh Tuy', 'Đàm Quang Trung – Cổ Linh', 'Cao tốc Hà Nội – Hải Phòng (5B)'],
    ringIntersections: ['Minh Khai – Vĩnh Tuy (VĐ2)', 'Nút Cổ Linh – VĐ3 (Thanh Trì)'],
    externalGateway: 'Ocean Park, Hưng Yên, Hải Dương, Hải Phòng, Hạ Long',
    memoryHook: '3 giờ hướng biển Đông = Ra cảng Hải Phòng & Vịnh Hạ Long qua Cầu Vĩnh Tuy – Cao tốc 5B.'
  },
  {
    clockLabel: '5h',
    angleDeg: 150,
    compassVi: 'Đông Nam',
    title: 'Trục Đê Nguyễn Khoái – Lĩnh Nam – Thanh Trì',
    streetChain: ['Trần Khánh Dư', 'Nguyễn Khoái', 'Lĩnh Nam / Tam Trinh', 'Cầu Thanh Trì'],
    ringIntersections: ['Trần Khát Chân (VĐ1)', 'Vĩnh Tuy (VĐ2)', 'Lĩnh Nam – VĐ3'],
    externalGateway: 'Hoàng Mai ven đê, Bát Tràng, Văn Giang (Ecopark)',
    memoryHook: '5 giờ = Hành lang triền đê hữu ngạn Sông Hồng xuôi về Ecopark.'
  },
  {
    clockLabel: '6h',
    angleDeg: 180,
    compassVi: 'Chính Nam',
    title: 'Trục Đường Sắt Bắc Nam – Giải Phóng',
    streetChain: ['Lê Duẩn (Ga Hà Nội)', 'Hầm Kim Liên', 'Giải Phóng', 'Ngọc Hồi (QL1A) / Pháp Vân – Cầu Giẽ'],
    ringIntersections: ['Hầm Kim Liên (VĐ1)', 'Ngã Tư Vọng (VĐ2)', 'Kim Đồng (VĐ2.5)', 'Pháp Vân (VĐ3)'],
    externalGateway: 'Thường Tín, Phú Xuyên, Hà Nam, Ninh Bình, Thanh Hóa, Nam Bộ',
    transitHighlight: 'Đường sắt Quốc gia Bắc – Nam + Bến xe Giáp Bát & Nước Ngầm',
    memoryHook: '6 giờ đáy la bàn = Nam tiến dọc đường tàu hỏa từ Ga Hà Nội thẳng tới Pháp Vân – Ngọc Hồi.'
  },
  {
    clockLabel: '7h',
    angleDeg: 220,
    compassVi: 'Tây Nam',
    title: 'Trục Hà Đông – Quốc Lộ 6',
    streetChain: ['Tôn Đức Thắng', 'Nguyễn Lương Bằng', 'Tây Sơn', 'Nguyễn Trãi', 'Trần Phú', 'Quang Trung (Hà Đông)', 'Ba La'],
    ringIntersections: ['Ô Chợ Dừa (VĐ1)', 'Ngã Tư Sở (VĐ2)', 'Nút Thanh Xuân (VĐ3)', 'Văn Phú (VĐ3.5)'],
    externalGateway: 'Bến xe Yên Nghĩa, Chương Mỹ, Xuân Mai, Hòa Bình, Sơn La (Tây Bắc)',
    transitHighlight: 'Metro 2A (Cát Linh – Hà Đông) chạy dọc trên cao',
    memoryHook: '7 giờ = Trục "1 đường 6 tên" có tàu điện Cát Linh – Hà Đông chạy trên đầu.'
  },
  {
    clockLabel: '7h30',
    angleDeg: 232,
    compassVi: 'Tây – Tây Nam',
    title: 'Trục Tài Chính BRT Lê Văn Lương – Tố Hữu',
    streetChain: ['Giảng Võ', 'Láng Hạ', 'Lê Văn Lương', 'Tố Hữu'],
    ringIntersections: ['Đê La Thành (VĐ1)', 'Cầu Hòa Mục – Láng (VĐ2)', 'Hoàng Đạo Thúy (VĐ2.5)', 'Hầm Khuất Duy Tiến (VĐ3)', 'Lê Trọng Tấn (VĐ3.5)'],
    externalGateway: 'Làng lụa Vạn Phúc, KĐT Dương Nội, Aeon Mall Hà Đông',
    transitHighlight: 'Tuyến xe buýt nhanh BRT 01 (Kim Mã – Yên Nghĩa)',
    memoryHook: '7h30 = Hành lang cao ốc văn phòng & làn riêng xe buýt nhanh BRT.'
  },
  {
    clockLabel: '8h30',
    angleDeg: 252,
    compassVi: 'Chính Tây (Lệch Nam)',
    title: 'Trục Đại Lộ Thăng Long – Hòa Lạc',
    streetChain: ['Văn Cao – Liễu Giai', 'Nguyễn Chí Thanh', 'Trần Duy Hưng', 'Đại lộ Thăng Long'],
    ringIntersections: ['Kim Mã – Đào Tấn', 'Cầu vượt Láng (VĐ2)', 'Hoàng Minh Giám (VĐ2.5)', 'Hầm Trung Hòa (VĐ3)', 'Nút Lê Trọng Tấn (VĐ3.5)'],
    externalGateway: 'Vinhomes Smart City, Thiên Đường Bảo Sơn, Quốc Oai, Khu Công nghệ cao Hòa Lạc, Ba Vì',
    memoryHook: '8h30 = Đại lộ rộng nhất Việt Nam phóng thẳng về Đô thị Khoa học Hòa Lạc.'
  },
  {
    clockLabel: '9h30',
    angleDeg: 282,
    compassVi: 'Tây – Tây Bắc',
    title: 'Trục Đại Học Cầu Giấy – Quốc Lộ 32',
    streetChain: ['Nguyễn Thái Học / Kim Mã', 'Cầu Giấy', 'Xuân Thủy', 'Hồ Tùng Mậu', 'Cầu Diễn', 'Nhổn (QL32)'],
    ringIntersections: ['Voi Phục (VĐ1)', 'Nút Cầu Giấy (VĐ2)', 'Trần Thái Tông (VĐ2.5)', 'Cầu vượt Mai Dịch (VĐ3)', 'Nhổn (VĐ3.5)'],
    externalGateway: 'Hoài Đức, Đan Phượng, Phúc Thọ, Thị xã Sơn Tây, Phú Thọ',
    transitHighlight: 'Metro số 3 (Nhổn – Cầu Giấy – Ga Hà Nội)',
    memoryHook: '9h30 = Trục Sư Phạm – Quốc Gia – Thương Mại – Công Nghiệp kèm tàu điện Metro số 3.'
  },
  {
    clockLabel: '10h30',
    angleDeg: 312,
    compassVi: 'Tây Bắc',
    title: 'Trục Hoàng Quốc Việt & Bờ Tây Hồ Tây',
    streetChain: ['Đội Cấn / Hoàng Hoa Thám', 'Bưởi', 'Hoàng Quốc Việt (hoặc Lạc Long Quân)'],
    ringIntersections: ['Nút Bưởi (VĐ2)', 'Nguyễn Văn Huyên (VĐ2.5)', 'Phạm Văn Đồng (VĐ3)'],
    externalGateway: 'Học viện Kỹ thuật Quân sự, Ngoại Giao Đoàn, Khu đô thị Tây Hồ Tây (Starlake)',
    memoryHook: '10h30 = Cầu nối ngang sang Phạm Văn Đồng và hành lang Tây Hồ Tây.'
  },
  {
    clockLabel: '11h',
    angleDeg: 340,
    compassVi: 'Bắc – Tây Bắc',
    title: 'Trục Phạm Văn Đồng – Cầu Thăng Long',
    streetChain: ['Phạm Hùng', 'Mai Dịch', 'Phạm Văn Đồng', 'Cầu Thăng Long', 'Võ Văn Kiệt'],
    ringIntersections: ['Mai Dịch (VĐ3)', 'Hoàng Quốc Việt', 'Cầu Thăng Long (VĐ3 vượt sông)'],
    externalGateway: 'Công viên Hòa Bình, KCN Bắc Thăng Long, Mê Linh, Phúc Yên (Vĩnh Phúc)',
    memoryHook: '11 giờ = Cửa ngõ công nghiệp Bắc Thăng Long & Vĩnh Phúc qua cầu giàn thép 2 tầng.'
  }
];

// ============================================================================
// 9. GIẢI PHẪU CHI TIẾT 6 TUYẾN VÀNH ĐAI (UNROLLED RIBBON DATA)
// ============================================================================
export interface IHanoiRingDetail {
  id: string;
  tierLabel: string;
  name: string;
  totalLengthKm: string;
  loopStatus: 'closed' | 'completing' | 'under_construction';
  loopStatusVi: string;
  elevatedSectionVi: string;
  motorbikeRuleVi: string;
  riverBridges: string[];
  colorHex: string;
  nodesChain: Array<{
    segmentName: string;
    district: string;
    junctionAfter?: string;
    infraBadge?: 'overpass' | 'underpass' | 'elevated' | 'bridge';
  }>;
}

export const HANOI_RING_DETAILS: IHanoiRingDetail[] = [
  {
    id: 'ring-detail-1',
    tierLabel: 'VĐ 1',
    name: 'Vành Đai 1 – Vòng Cửa Ô Lõi Lịch Sử',
    totalLengthKm: '~18 km (cả tuyến đê Đông Bắc)',
    loopStatus: 'completing',
    loopStatusVi: 'Đang hoàn thiện đoạn cuối Hoàng Cầu – Voi Phục',
    elevatedSectionVi: 'Cầu vượt Ô Chợ Dừa – Hoàng Cầu & Hầm chui Kim Liên',
    motorbikeRuleVi: 'Xe máy đi bình thường toàn tuyến (kể cả qua Hầm chui Kim Liên và cầu vượt Ô Chợ Dừa).',
    riverBridges: ['Chạy dọc đê hữu ngạn (Yên Phụ – Trần Nhật Duật – Nguyễn Khoái), không vượt sông'],
    colorHex: '#d97706',
    nodesChain: [
      { segmentName: 'Trần Khát Chân', district: 'Hai Bà Trưng', junctionAfter: 'Ngã tư Phố Huế – Bạch Mai (Ô Cầu Dền)', infraBadge: 'overpass' },
      { segmentName: 'Đại Cồ Việt', district: 'Hai Bà Trưng', junctionAfter: 'Hầm Kim Liên (cắt Giải Phóng – Lê Duẩn)', infraBadge: 'underpass' },
      { segmentName: 'Xã Đàn', district: 'Đống Đa', junctionAfter: 'Ngã 7 Ô Chợ Dừa (cắt Tôn Đức Thắng – Nguyễn Lương Bằng)', infraBadge: 'overpass' },
      { segmentName: 'Hoàng Cầu', district: 'Đống Đa', junctionAfter: 'Hồ Hoàng Cầu – Thái Hà / Yên Lãng' },
      { segmentName: 'Đoạn Hoàng Cầu – Voi Phục (La Thành)', district: 'Đống Đa / Ba Đình', junctionAfter: 'Nút Voi Phục (Kim Mã – Cầu Giấy)' },
      { segmentName: 'Đường Bưởi – Lạc Long Quân / Thụy Khuê', district: 'Ba Đình / Tây Hồ', junctionAfter: 'Yên Phụ – Nghi Tàm' },
      { segmentName: 'Trần Nhật Duật – Trần Quang Khải – Trần Khánh Dư – Nguyễn Khoái', district: 'Hoàn Kiếm / HBT', junctionAfter: 'Khép vòng về Ô Đống Mác – Trần Khát Chân' }
    ]
  },
  {
    id: 'ring-detail-2',
    tierLabel: 'VĐ 2',
    name: 'Vành Đai 2 – Vành Đai Đô Thị Khép Kín & Đường Trên Cao',
    totalLengthKm: '43.6 km (khép kín hoàn toàn)',
    loopStatus: 'closed',
    loopStatusVi: 'Đã khép kín 100% qua 2 bờ Sông Hồng & Sông Đuống',
    elevatedSectionVi: 'Đường trên cao Vĩnh Tuy – Minh Khai – Đại La – Trường Chinh – Ngã Tư Sở (~5.1 km) & Cầu cạn Bưởi – Võ Chí Công',
    motorbikeRuleVi: 'CẤM XE MÁY 100% trên đường trên cao Vĩnh Tuy ↔ Ngã Tư Sở (xe máy đi đường mặt đất mở rộng bên dưới).',
    riverBridges: ['Cầu Vĩnh Tuy (Nam)', 'Cầu Nhật Tân (Bắc)', 'Cầu Đông Trù (vượt Sông Đuống)'],
    colorHex: '#0d9488',
    nodesChain: [
      { segmentName: 'Cầu Vĩnh Tuy', district: 'HBT ↔ Long Biên', junctionAfter: 'Dốc Minh Khai – Times City', infraBadge: 'bridge' },
      { segmentName: 'Minh Khai', district: 'Hai Bà Trưng', junctionAfter: 'Ngã tư Chợ Mơ (Bạch Mai – Trương Định)', infraBadge: 'elevated' },
      { segmentName: 'Đại La', district: 'Hai Bà Trưng', junctionAfter: 'Ngã Tư Vọng (cắt Giải Phóng)', infraBadge: 'elevated' },
      { segmentName: 'Trường Chinh', district: 'Đống Đa / Thanh Xuân', junctionAfter: 'Ngã Tư Sở (cắt Tây Sơn – Nguyễn Trãi)', infraBadge: 'elevated' },
      { segmentName: 'Đường Láng (dọc sông Tô Lịch)', district: 'Đống Đa', junctionAfter: 'Nút Cầu Giấy (cắt Kim Mã – Cầu Giấy)', infraBadge: 'overpass' },
      { segmentName: 'Đường Bưởi', district: 'Ba Đình', junctionAfter: 'Nút Bưởi – Hoàng Quốc Việt', infraBadge: 'overpass' },
      { segmentName: 'Võ Chí Công', district: 'Tây Hồ', junctionAfter: 'Phú Thượng – Nam Nhật Tân' },
      { segmentName: 'Cầu Nhật Tân', district: 'Tây Hồ ↔ Đông Anh', junctionAfter: 'Vĩnh Ngọc – Đông Hội', infraBadge: 'bridge' },
      { segmentName: 'Trường Sa – Cầu Đông Trù – Lý Sơn', district: 'Đông Anh ↔ Long Biên', junctionAfter: 'Nút Cầu Chui (QL5)', infraBadge: 'bridge' },
      { segmentName: 'Nguyễn Văn Linh – Đàm Quang Trung', district: 'Long Biên', junctionAfter: 'Nút Cổ Linh – Aeon Mall → Khép vòng Cầu Vĩnh Tuy', infraBadge: 'overpass' }
    ]
  },
  {
    id: 'ring-detail-2-5',
    tierLabel: 'VĐ 2.5',
    name: 'Vành Đai 2.5 – Trục Trung Gian Giải Tỏa Nội Đô Tây – Nam',
    totalLengthKm: '~19.4 km (từ Tây Hồ xuống Lĩnh Nam)',
    loopStatus: 'completing',
    loopStatusVi: 'Đã thông phần lớn đoạn Bắc – Tây; đang khớp nối Đầm Hồng – Giải Phóng',
    elevatedSectionVi: 'Hầm chui Giải Phóng – Kim Đồng & Cầu vượt Nguyễn Văn Huyên – Hoàng Quốc Việt',
    motorbikeRuleVi: 'Đường đô thị hỗn hợp 2 chiều: xe máy và ô tô lưu thông bình thường toàn tuyến.',
    riverBridges: ['Không vượt Sông Hồng (nằm hoàn toàn ở hữu ngạn giữa VĐ2 và VĐ3)'],
    colorHex: '#0284c7',
    nodesChain: [
      { segmentName: 'Nguyễn Văn Huyên kéo dài (Tây Hồ Tây – Ngoại Giao Đoàn)', district: 'Tây Hồ / Bắc Từ Liêm', junctionAfter: 'Cầu vượt Hoàng Quốc Việt', infraBadge: 'overpass' },
      { segmentName: 'Nguyễn Phong Sắc – Trần Thái Tông', district: 'Cầu Giấy', junctionAfter: 'Ngã tư Xuân Thủy – Cầu Giấy' },
      { segmentName: 'Trung Kính – Dương Đình Nghệ', district: 'Cầu Giấy', junctionAfter: 'Ngã tư Trần Duy Hưng – Hoàng Minh Giám' },
      { segmentName: 'Hoàng Đạo Thúy', district: 'Cầu Giấy / Thanh Xuân', junctionAfter: 'Ngã tư Lê Văn Lương (BRT)' },
      { segmentName: 'Ngụy Như Kon Tum / Vũ Trọng Phụng – Khương Trung – Đầm Hồng', district: 'Thanh Xuân', junctionAfter: 'Định Công (vượt sông Tô Lịch)' },
      { segmentName: 'Định Công – Kim Đồng', district: 'Hoàng Mai', junctionAfter: 'Hầm chui Giải Phóng → Tân Mai – Lĩnh Nam', infraBadge: 'underpass' }
    ]
  },
  {
    id: 'ring-detail-3',
    tierLabel: 'VĐ 3',
    name: 'Vành Đai 3 – Cao Tốc Đô Thị CT.20 & Vòng Khép Kín Liên Tỉnh',
    totalLengthKm: '~65 km (cầu cạn trên cao dài ~29 km)',
    loopStatus: 'closed',
    loopStatusVi: 'Đã khép kín toàn tuyến qua Cầu Thăng Long & Cầu Thanh Trì',
    elevatedSectionVi: 'Đường cao tốc trên cao liên tục từ Cầu Thăng Long (Mai Dịch – Phạm Hùng – Khuất Duy Tiến – Nguyễn Xiển – Pháp Vân) tới Cầu Thanh Trì',
    motorbikeRuleVi: 'CẤM XE MÁY TUYỆT ĐỐI trên toàn tuyến VĐ3 trên cao & tầng 2 Cầu Thăng Long! Xe máy đi đường dưới thấp (Phạm Văn Đồng – Phạm Hùng – Khuất Duy Tiến – Nguyễn Xiển) và qua được các hầm Trung Hòa, Thanh Xuân, Lê Văn Lương.',
    riverBridges: ['Cầu Thăng Long (Tây Bắc)', 'Cầu Thanh Trì (Đông Nam)', 'Cầu Phù Đổng (vượt Sông Đuống)'],
    colorHex: '#7c3aed',
    nodesChain: [
      { segmentName: 'Cầu Thăng Long', district: 'Bắc Từ Liêm ↔ Đông Anh', junctionAfter: 'Tân Xuân – Ciputra', infraBadge: 'bridge' },
      { segmentName: 'Phạm Văn Đồng', district: 'Bắc Từ Liêm / Cầu Giấy', junctionAfter: 'Nút giao Mai Dịch (cắt Xuân Thủy – Hồ Tùng Mậu)', infraBadge: 'elevated' },
      { segmentName: 'Phạm Hùng (BX Mỹ Đình – Keangnam)', district: 'Cầu Giấy / Nam Từ Liêm', junctionAfter: 'Nút Trung Hòa (cắt Trần Duy Hưng – ĐL Thăng Long)', infraBadge: 'underpass' },
      { segmentName: 'Khuất Duy Tiến', district: 'Thanh Xuân', junctionAfter: 'Nút Thanh Xuân (cắt Nguyễn Trãi – Trần Phú)', infraBadge: 'underpass' },
      { segmentName: 'Nguyễn Xiển', district: 'Thanh Xuân / Hoàng Mai', junctionAfter: 'Cầu Dậu – Kim Giang (sông Tô Lịch)', infraBadge: 'elevated' },
      { segmentName: 'Nghiêm Xuân Yêm – Hoàng Liệt (Linh Đàm)', district: 'Hoàng Mai', junctionAfter: 'Nút Pháp Vân (cắt Giải Phóng – CT.01)', infraBadge: 'overpass' },
      { segmentName: 'Cầu Thanh Trì', district: 'Hoàng Mai ↔ Gia Lâm', junctionAfter: 'Nút Cổ Linh (CT.04 Hải Phòng) & QL5', infraBadge: 'bridge' },
      { segmentName: 'QL1A mới (Cầu Phù Đổng – Ninh Hiệp) – Việt Hùng – Bắc Thăng Long', district: 'Gia Lâm / Đông Anh', junctionAfter: 'Khép vòng về Bắc Cầu Thăng Long' }
    ]
  },
  {
    id: 'ring-detail-3-5',
    tierLabel: 'VĐ 3.5',
    name: 'Vành Đai 3.5 – Trục Liên Kết Các Đô Thị Mới Phía Tây & Nam',
    totalLengthKm: '~45 km',
    loopStatus: 'under_construction',
    loopStatusVi: 'Đã thông suốt trục Lê Trọng Tấn – Phúc La (Hoài Đức – Hà Đông); đang xây nút giao ĐL Thăng Long & chuẩn bị Cầu Thượng Cát / Ngọc Hồi',
    elevatedSectionVi: 'Nút giao khác mức Lê Trọng Tấn × Đại lộ Thăng Long',
    motorbikeRuleVi: 'Đường đôi đô thị rộng 6–8 làn xe mặt đất, xe máy và ô tô lưu thông thông thoáng.',
    riverBridges: ['Cầu Thượng Cát (Bắc Từ Liêm ↔ Đông Anh)', 'Cầu Ngọc Hồi (Thanh Trì ↔ Văn Giang)'],
    colorHex: '#e11d48',
    nodesChain: [
      { segmentName: 'Cầu Thượng Cát – Đường 3.5 Bắc Từ Liêm / Đan Phượng', district: 'Bắc Từ Liêm / Đan Phượng', junctionAfter: 'Cắt Quốc lộ 32 (Hoài Đức)', infraBadge: 'bridge' },
      { segmentName: 'Lê Trọng Tấn (Hoài Đức – Vân Canh – An Khánh)', district: 'Hoài Đức', junctionAfter: 'Cắt Đại lộ Thăng Long (cạnh Thiên Đường Bảo Sơn)', infraBadge: 'overpass' },
      { segmentName: 'Lê Trọng Tấn (Hà Đông – Dương Nội – La Khê)', district: 'Hà Đông', junctionAfter: 'Cắt Tố Hữu (ParkCity) & cắt Quang Trung tại Văn Phú' },
      { segmentName: 'Phúc La – Văn Phú – Xa La', district: 'Hà Đông / Thanh Trì', junctionAfter: 'Cắt đường 70 & Quốc lộ 1A (Ngọc Hồi)' },
      { segmentName: 'Cầu Ngọc Hồi', district: 'Thanh Trì ↔ Văn Giang', junctionAfter: 'Kết nối Cao tốc Hà Nội – Hải Phòng', infraBadge: 'bridge' }
    ]
  },
  {
    id: 'ring-detail-4',
    tierLabel: 'VĐ 4',
    name: 'Vành Đai 4 – Vùng Thủ Đô (Hà Nội – Hưng Yên – Bắc Ninh)',
    totalLengthKm: '112.8 km (58.2 km qua 7 quận/huyện Hà Nội)',
    loopStatus: 'under_construction',
    loopStatusVi: 'Đại dự án trọng điểm Quốc gia: Đường song hành mặt đất + Cao tốc 6 làn trên cao',
    elevatedSectionVi: 'Cao tốc Vành đai 4 thiết kế 80–100 km/h tách biệt hoàn toàn với đường song hành đô thị 2 bên',
    motorbikeRuleVi: 'Xe máy đi trên hệ thống đường song hành hai bên; cấm vào phần đường cao tốc chính giữa.',
    riverBridges: ['Cầu Hồng Hà (Đan Phượng ↔ Mê Linh)', 'Cầu Mễ Sở (Thường Tín ↔ Văn Giang)', 'Cầu Hoài Thượng (vượt Sông Đuống tại Bắc Ninh)'],
    colorHex: '#4f46e5',
    nodesChain: [
      { segmentName: 'Điểm đầu nối Cao tốc Nội Bài – Lào Cai (Sóc Sơn) – Mê Linh', district: 'Sóc Sơn / Mê Linh', junctionAfter: 'Bắc Sông Hồng' },
      { segmentName: 'Cầu Hồng Hà', district: 'Mê Linh ↔ Đan Phượng', junctionAfter: 'Cắt QL32 (Đan Phượng – Hoài Đức)', infraBadge: 'bridge' },
      { segmentName: 'Đoạn Hoài Đức – Hà Đông (Yên Nghĩa)', district: 'Hoài Đức / Hà Đông', junctionAfter: 'Cắt Đại lộ Thăng Long & Quốc lộ 6 (sau BX Yên Nghĩa)' },
      { segmentName: 'Đoạn Thanh Oai – Thường Tín', district: 'Thanh Oai / Thường Tín', junctionAfter: 'Cắt Quốc lộ 1A & Cao tốc Pháp Vân – Cầu Giẽ' },
      { segmentName: 'Cầu Mễ Sở → Hưng Yên → Bắc Ninh → Nội Bài – Hạ Long', district: 'Thường Tín ↔ Hưng Yên – Bắc Ninh', junctionAfter: 'Khép kín siêu vòng liên vùng', infraBadge: 'bridge' }
    ]
  }
];

// ============================================================================
// 10. MA TRẬN ĐẦY ĐỦ CHUỖI CẦU QUA SÔNG HỒNG (THƯỢNG LƯU → HẠ LƯU)
// ============================================================================
export interface IHanoiBridgeMatrixRow {
  order: number;
  id: string;
  name: string;
  status: 'operational' | 'implementing';
  statusVi: string;
  ringOrAxis: string;
  rightBankWestSouth: string;
  leftBankNorthEast: string;
  vehicleRule: string;
}

export const HANOI_BRIDGE_MATRIX: IHanoiBridgeMatrixRow[] = [
  {
    order: 1,
    id: 'br-van-lang',
    name: 'Cầu Văn Lang',
    status: 'operational',
    statusVi: 'Đang khai thác (2018)',
    ringOrAxis: 'Trục Ba Vì – Phú Thọ',
    rightBankWestSouth: 'Ba Vì (Phú Sơn / Quốc lộ 32)',
    leftBankNorthEast: 'TP. Việt Trì (Phú Thọ)',
    vehicleRule: 'Ô tô & xe máy 2 chiều (cửa ngõ cực Tây Bắc Hà Nội).'
  },
  {
    order: 2,
    id: 'br-hong-ha',
    name: 'Cầu Hồng Hà',
    status: 'implementing',
    statusVi: 'Dự án Vành đai 4',
    ringOrAxis: 'Vành đai 4',
    rightBankWestSouth: 'Đan Phượng (Hồng Hà)',
    leftBankNorthEast: 'Mê Linh (Văn Khê)',
    vehicleRule: 'Cao tốc VĐ4 + đường song hành hỗn hợp.'
  },
  {
    order: 3,
    id: 'br-thuong-cat',
    name: 'Cầu Thượng Cát',
    status: 'implementing',
    statusVi: 'Dự án Vành đai 3.5',
    ringOrAxis: 'Vành đai 3.5',
    rightBankWestSouth: 'Bắc Từ Liêm (Thượng Cát)',
    leftBankNorthEast: 'Đông Anh (Đại Mạch)',
    vehicleRule: '8 làn xe (6 cơ giới + 2 hỗn hợp).'
  },
  {
    order: 4,
    id: 'bridge-thang-long',
    name: 'Cầu Thăng Long',
    status: 'operational',
    statusVi: 'Huyết mạch (1985)',
    ringOrAxis: 'Vành đai 3 (Phạm Văn Đồng – Võ Văn Kiệt)',
    rightBankWestSouth: 'Bắc Từ Liêm (Đông Ngạc)',
    leftBankNorthEast: 'Đông Anh (Hải Bối – KCN Bắc Thăng Long)',
    vehicleRule: '2 tầng: Tầng 2 CHỈ Ô TÔ (80 km/h); Tầng 1 dưới thấp cho XE MÁY & tàu hỏa.'
  },
  {
    order: 5,
    id: 'bridge-nhat-tan',
    name: 'Cầu Nhật Tân',
    status: 'operational',
    statusVi: 'Huyết mạch (2015)',
    ringOrAxis: 'Vành đai 2 / Trục 12h Nội Bài',
    rightBankWestSouth: 'Tây Hồ (Phú Thượng – Võ Chí Công)',
    leftBankNorthEast: 'Đông Anh (Vĩnh Ngọc – Võ Nguyên Giáp)',
    vehicleRule: '8 làn xe; xe máy đi làn ngoài cùng mỗi bên (chú ý gió tạt ngang).'
  },
  {
    order: 6,
    id: 'br-tu-lien',
    name: 'Cầu Tứ Liên',
    status: 'implementing',
    statusVi: 'Đang triển khai',
    ringOrAxis: 'Trục Tây Hồ – Cổ Loa (Đông Anh)',
    rightBankWestSouth: 'Tây Hồ (Nghi Tàm – Quảng An)',
    leftBankNorthEast: 'Đông Anh (Đông Hội – Trung tâm Triển lãm QG)',
    vehicleRule: 'Cầu dây văng biểu tượng mới nối thẳng Tây Hồ sang Đông Anh.'
  },
  {
    order: 7,
    id: 'bridge-long-bien',
    name: 'Cầu Long Biên',
    status: 'operational',
    statusVi: 'Di sản sống (1902)',
    ringOrAxis: 'Phố Cổ – Ngọc Thụy / Gia Lâm',
    rightBankWestSouth: 'Hoàn Kiếm (Trần Nhật Duật / Phùng Hưng)',
    leftBankNorthEast: 'Long Biên (Ngọc Thụy – Long Biên 1)',
    vehicleRule: 'CẤM Ô TÔ. Tàu hỏa chạy giữa; xe máy & xe đạp ĐI BÊN LỀ TRÁI!'
  },
  {
    order: 8,
    id: 'bridge-chuong-duong',
    name: 'Cầu Chương Dương',
    status: 'operational',
    statusVi: 'Huyết mạch (1985)',
    ringOrAxis: 'Trục 2h Hoàn Kiếm – Nguyễn Văn Cừ',
    rightBankWestSouth: 'Hoàn Kiếm (Vòng xuyến Trần Quang Khải)',
    leftBankNorthEast: 'Long Biên (Nguyễn Văn Cừ – Bồ Đề)',
    vehicleRule: 'Ô tô đi làn giữa; xe máy bắt buộc đi 2 làn cánh gà ngoài cùng (cấm xe tải/khách lớn).'
  },
  {
    order: 9,
    id: 'br-tran-hung-dao',
    name: 'Cầu Trần Hưng Đạo',
    status: 'implementing',
    statusVi: 'Đang triển khai',
    ringOrAxis: 'Trục Trần Hưng Đạo – Cổ Linh',
    rightBankWestSouth: 'Hoàn Kiếm / Hai Bà Trưng (cuối Trần Hưng Đạo)',
    leftBankNorthEast: 'Long Biên (Vũ Đức Thận – Cổ Linh)',
    vehicleRule: 'Giảm tải trực tiếp cho Cầu Chương Dương và Cầu Vĩnh Tuy.'
  },
  {
    order: 10,
    id: 'bridge-vinh-tuy',
    name: 'Cầu Vĩnh Tuy (GĐ1 & GĐ2)',
    status: 'operational',
    statusVi: 'Huyết mạch 8 làn (2010/2023)',
    ringOrAxis: 'Vành đai 2 (Minh Khai – Cổ Linh)',
    rightBankWestSouth: 'Hai Bà Trưng (Minh Khai / Nguyễn Khoái)',
    leftBankNorthEast: 'Long Biên (Đàm Quang Trung – Aeon Mall)',
    vehicleRule: '2 cầu song song (mỗi chiều 4 làn phân tách làn ô tô và làn hỗn hợp xe máy rất thoáng).'
  },
  {
    order: 11,
    id: 'bridge-thanh-tri',
    name: 'Cầu Thanh Trì',
    status: 'operational',
    statusVi: 'Huyết mạch (2007)',
    ringOrAxis: 'Vành đai 3 (CT.20)',
    rightBankWestSouth: 'Hoàng Mai (Lĩnh Nam / Pháp Vân)',
    leftBankNorthEast: 'Gia Lâm (Đông Dư – nối QL5 & Cao tốc 5B)',
    vehicleRule: 'Ô tô chạy làn cao tốc giữa; xe máy đi làn riêng biệt có dải phân cách cứng.'
  },
  {
    order: 12,
    id: 'br-ngoc-hoi',
    name: 'Cầu Ngọc Hồi',
    status: 'implementing',
    statusVi: 'Dự án Vành đai 3.5',
    ringOrAxis: 'Vành đai 3.5',
    rightBankWestSouth: 'Thanh Trì (Ngọc Hồi – Liên Ninh)',
    leftBankNorthEast: 'Gia Lâm / Văn Giang (Hưng Yên)',
    vehicleRule: 'Kết nối Nam Hà Nội sang Ecopark & Cao tốc 5B không cần vòng lên Thanh Trì.'
  },
  {
    order: 13,
    id: 'br-me-so',
    name: 'Cầu Mễ Sở',
    status: 'implementing',
    statusVi: 'Dự án Vành đai 4',
    ringOrAxis: 'Vành đai 4',
    rightBankWestSouth: 'Thường Tín (Hồng Vân)',
    leftBankNorthEast: 'Văn Giang (Hưng Yên)',
    vehicleRule: 'Khép mạch phía Nam của Siêu Vành đai 4 Vùng Thủ đô.'
  }
];

// ============================================================================
// 11. PHÂN CỤM KHÔNG GIAN 30 ĐƠN VỊ HÀNH CHÍNH HÀ NỘI (SPATIAL CHUNKING)
// ============================================================================
export interface IHanoiAdminCluster {
  id: string;
  tierBadge: string;
  title: string;
  ringPosition: string;
  summary: string;
  units: Array<{
    name: string;
    unitType: 'Quận' | 'Thị xã' | 'Huyện';
    compassDir: string;
    identityTag: string;
    keyAnchors: string[];
  }>;
}

export const HANOI_ADMIN_CLUSTERS: IHanoiAdminCluster[] = [
  {
    id: 'cluster-core-4',
    tierBadge: 'LỚP 1 · TỨ QUẬN LÕI LỊCH SỬ',
    title: '4 Quận Nội Đô Lịch Sử (Trong Vành Đai 1 – Vành Đai 2)',
    ringPosition: 'Tâm 0 km → Vành đai 2',
    summary:
      'Trái tim văn hóa, chính trị, thương mại nghìn năm của Thăng Long – Hà Nội. Mật độ phố dày, nhiều đường một chiều và di tích quốc gia.',
    units: [
      {
        name: 'Hoàn Kiếm',
        unitType: 'Quận',
        compassDir: 'Tâm Đông (sát Sông Hồng)',
        identityTag: 'Thương mại – Du lịch – Phố Cổ & Phố Pháp',
        keyAnchors: ['Hồ Gươm (Km0)', '36 Phố Phường', 'Nhà Hát Lớn', 'Ga Hà Nội', 'Cầu Chương Dương']
      },
      {
        name: 'Ba Đình',
        unitType: 'Quận',
        compassDir: 'Tâm Tây Bắc',
        identityTag: 'Trung tâm Chính trị – Ngoại giao Quốc gia',
        keyAnchors: ['Lăng Bác & Quảng trường Ba Đình', 'Hoàng Thành', 'Lotte Liễu Giai', 'Kim Mã – Giảng Võ']
      },
      {
        name: 'Đống Đa',
        unitType: 'Quận',
        compassDir: 'Tâm Tây Nam',
        identityTag: 'Dân cư mật độ cao – Gò Đống Đa – Y tế & Đại học',
        keyAnchors: ['Văn Miếu', 'Ô Chợ Dừa', 'Ngã Tư Sở', 'Chùa Bộc – Thái Hà – Láng Hạ']
      },
      {
        name: 'Hai Bà Trưng',
        unitType: 'Quận',
        compassDir: 'Tâm Đông Nam',
        identityTag: 'Tam giác Đại học Bách–Kinh–Xây & Y tế tuyến cuối',
        keyAnchors: ['CV Thống Nhất', 'ĐH Bách Khoa – KTQD – Xây Dựng', 'BV Bạch Mai / 108', 'Times City – Vĩnh Tuy']
      }
    ]
  },
  {
    id: 'cluster-inner-ring-4',
    tierBadge: 'LỚP 2 · 4 QUẬN MỞ RỘNG NỘI ĐÔ',
    title: '4 Quận Chuyển Tiếp (Kẹp Giữa Vành Đai 2 & Vành Đai 3)',
    ringPosition: 'Vành đai 2 ↔ Vành đai 3',
    summary:
      'Vành đai phát triển năng động từ thập niên 1990–2000: không gian mặt nước Tây Hồ, thung lũng công nghệ Cầu Giấy, hành lang Thanh Xuân và cửa ngõ phía Nam Hoàng Mai.',
    units: [
      {
        name: 'Tây Hồ',
        unitType: 'Quận',
        compassDir: 'Phía Bắc (12h)',
        identityTag: 'Cảnh quan Hồ Tây – Biệt thự Quốc tế – Trục Nhật Tân',
        keyAnchors: ['Hồ Tây', 'Võ Chí Công', 'Lotte Mall West Lake', 'Phủ Tây Hồ – Quảng An']
      },
      {
        name: 'Cầu Giấy',
        unitType: 'Quận',
        compassDir: 'Phía Tây (9h)',
        identityTag: 'Công nghệ thông tin (Duy Tân) – Đại học – Đô thị mới',
        keyAnchors: ['Xuân Thủy (ĐHQG – Sư Phạm)', 'Duy Tân', 'Trần Duy Hưng', 'CV Cầu Giấy']
      },
      {
        name: 'Thanh Xuân',
        unitType: 'Quận',
        compassDir: 'Tây Nam (7h–8h)',
        identityTag: 'Giao điểm VĐ3 × Nguyễn Trãi – Đô thị cao tầng',
        keyAnchors: ['Royal City', 'Nút Thanh Xuân 4 tầng', 'Lê Văn Lương – Hoàng Đạo Thúy', 'ĐH Khoa học Tự nhiên/XHNV']
      },
      {
        name: 'Hoàng Mai',
        unitType: 'Quận',
        compassDir: 'Phía Nam (5h–6h)',
        identityTag: 'Cửa ngõ giao thông phía Nam & Bán đảo hồ điều hòa',
        keyAnchors: ['BX Giáp Bát & Nước Ngầm', 'Bán đảo Linh Đàm', 'Nút Pháp Vân', 'Cầu Thanh Trì']
      }
    ]
  },
  {
    id: 'cluster-outer-urban-4',
    tierBadge: 'LỚP 3 · 4 QUẬN CỰC ĐÔ THỊ MỚI',
    title: '4 Quận Mở Rộng Phía Tây, Tây Nam & Tả Ngạn Đông',
    ringPosition: 'Ngoài Vành đai 3 & Bờ Bắc Sông Hồng',
    summary:
      'Quỹ đất rộng với hạ tầng đại lộ quy hoạch lớn: trung tâm hội nghị – thể thao quốc gia phía Tây, quận trung tâm Hà Tây cũ (Hà Đông) và quận đầu tiên bên kia Sông Hồng (Long Biên).',
    units: [
      {
        name: 'Nam Từ Liêm',
        unitType: 'Quận',
        compassDir: 'Phía Tây (8h–9h)',
        identityTag: 'Trung tâm Hội nghị – Thể thao Quốc gia & CBD mới',
        keyAnchors: ['Keangnam 72', 'SVĐ Mỹ Đình', 'TT Hội nghị Quốc gia', 'BX Mỹ Đình', 'Smart City Tây Mỗ']
      },
      {
        name: 'Bắc Từ Liêm',
        unitType: 'Quận',
        compassDir: 'Tây Bắc (10h–11h)',
        identityTag: 'Hành lang Phạm Văn Đồng – Nhổn – Tây Hồ Tây',
        keyAnchors: ['CV Hòa Bình', 'Cầu Thăng Long', 'Ngã tư Nhổn (ĐH Công Nghiệp)', 'Ngoại Giao Đoàn']
      },
      {
        name: 'Hà Đông',
        unitType: 'Quận',
        compassDir: 'Tây Nam (7h)',
        identityTag: 'Cực đô thị lớn Tây Nam – Làng lụa Vạn Phúc – Đầu cuối Metro 2A',
        keyAnchors: ['Cầu Trắng', 'Quang Trung – Trần Phú', 'Làng lụa Vạn Phúc', 'Aeon Mall Hà Đông', 'BX Yên Nghĩa']
      },
      {
        name: 'Long Biên',
        unitType: 'Quận',
        compassDir: 'Phía Đông (1h–3h, Tả ngạn)',
        identityTag: 'Đô thị sinh thái bên kia Sông Hồng – Hạ tầng đồng bộ bậc nhất',
        keyAnchors: ['Nguyễn Văn Cừ', 'Aeon Mall Long Biên', 'Cổ Linh', 'Vinhomes Riverside', 'Cầu Chui']
      }
    ]
  },
  {
    id: 'cluster-periurban-5',
    tierBadge: 'LỚP 4 · 5 HUYỆN CẬN ĐÔ (TRỤC LÊN QUẬN)',
    title: '5 Huyện Vành Đai Cận Đô Thị (Vành Đai 3.5 – Vành Đai 4)',
    ringPosition: 'Bao sát 12 quận nội thành',
    summary:
      '5 huyện hội tụ các đại dự án cầu vượt sông, đường Vành đai 3.5 – Vành đai 4 và các đại đô thị quy mô hàng trăm hecta.',
    units: [
      {
        name: 'Đông Anh',
        unitType: 'Huyện',
        compassDir: 'Chính Bắc (bờ Bắc Sông Hồng)',
        identityTag: 'Thành phố thông minh Bắc Sông Hồng – Thành Cổ Loa',
        keyAnchors: ['Chân Cầu Nhật Tân & Thăng Long', 'Võ Nguyên Giáp', 'Thành Cổ Loa', 'KCN Bắc Thăng Long']
      },
      {
        name: 'Gia Lâm',
        unitType: 'Huyện',
        compassDir: 'Phía Đông',
        identityTag: 'Cửa ngõ công nghiệp – thương mại Đông Hà Nội',
        keyAnchors: ['Học viện Nông nghiệp', 'Vinhomes Ocean Park', 'Làng gốm Bát Tràng', 'Ninh Hiệp – Yên Viên']
      },
      {
        name: 'Thanh Trì',
        unitType: 'Huyện',
        compassDir: 'Chính Nam',
        identityTag: 'Bản lề Nam nối Hoàng Mai – Hà Đông – Sông Hồng',
        keyAnchors: ['Ngọc Hồi (QL1A)', 'Viện K Tân Triều', 'Thanh Liệt', 'Đầu cầu Ngọc Hồi VĐ3.5']
      },
      {
        name: 'Hoài Đức',
        unitType: 'Huyện',
        compassDir: 'Phía Tây (giữa QL32 & ĐL Thăng Long)',
        identityTag: 'Trục Vành đai 3.5 Lê Trọng Tấn – Cửa ngõ Tây',
        keyAnchors: ['An Khánh (Thiên Đường Bảo Sơn)', 'Trôi – Nhổn (QL32)', 'Vân Canh']
      },
      {
        name: 'Đan Phượng',
        unitType: 'Huyện',
        compassDir: 'Tây Bắc (dọc QL32 & Sông Hồng)',
        identityTag: 'Đầu mối Cầu Hồng Hà (VĐ4) & Tây Thăng Long',
        keyAnchors: ['Thị trấn Phùng (QL32)', 'Tân Hội – Liên Hà', 'Trục Tây Thăng Long']
      }
    ]
  },
  {
    id: 'cluster-suburban-13',
    tierBadge: 'LỚP 5 · 1 THỊ XÃ, 12 HUYỆN NGOẠI THÀNH & 5 ĐÔ THỊ VỆ TINH',
    title: 'Vành Đai Sinh Thái, Công Nghệ Cao & Cửa Ngõ Liên Tỉnh',
    ringPosition: 'Ngoài Vành đai 4 → Ranh giới các tỉnh lân cận',
    summary:
      'Gồm 1 Thị xã (Sơn Tây) và 12 huyện ngoại thành, tổ chức xoay quanh 5 Đô thị vệ tinh chiến lược: Hòa Lạc (Khoa học – Công nghệ), Sơn Tây (Văn hóa – Di sản), Sóc Sơn (Cảng hàng không), Xuân Mai (Giáo dục – Sinh thái), Phú Xuyên (Công nghiệp – Logistics Nam).',
    units: [
      {
        name: 'Sơn Tây',
        unitType: 'Thị xã',
        compassDir: 'Tây Bắc (QL32 / QL21A)',
        identityTag: 'Đô thị vệ tinh Văn hóa – Lịch sử Xứ Đoài',
        keyAnchors: ['Thành cổ Sơn Tây', 'Làng cổ Đường Lâm', 'Hồ Đồng Mô']
      },
      {
        name: 'Sóc Sơn & Mê Linh',
        unitType: 'Huyện',
        compassDir: 'Cực Bắc (11h–1h)',
        identityTag: 'Cảng Hàng không Quốc tế Nội Bài & Vùng hoa Mê Linh',
        keyAnchors: ['Sân bay Nội Bài', 'Đền Gióng Sóc Sơn', 'QL2 – Võ Văn Kiệt']
      },
      {
        name: 'Thạch Thất, Quốc Oai & Ba Vì',
        unitType: 'Huyện',
        compassDir: 'Cực Tây (8h30–10h)',
        identityTag: 'Siêu đô thị Khoa học – ĐHQG Hòa Lạc & Vườn Quốc gia Ba Vì',
        keyAnchors: ['Khu CNC Hòa Lạc & ĐHQG cơ sở mới', 'Chùa Thầy (Quốc Oai)', 'Chùa Tây Phương', 'Núi Ba Vì']
      },
      {
        name: 'Phúc Thọ & Chương Mỹ',
        unitType: 'Huyện',
        compassDir: 'Tây Bắc & Tây Nam (QL32 & QL6)',
        identityTag: 'Hành lang sinh thái nông nghiệp & Đô thị vệ tinh Xuân Mai',
        keyAnchors: ['Thị trấn Xuân Mai (giao QL6 × QL21A)', 'Chùa Trầm']
      },
      {
        name: 'Thanh Oai, Thường Tín, Phú Xuyên, Ứng Hòa & Mỹ Đức',
        unitType: 'Huyện',
        compassDir: 'Nam & Tây Nam (QL1A, QL21B)',
        identityTag: 'Làng nghề truyền thống phía Nam & Quần thể Chùa Hương',
        keyAnchors: ['Chùa Hương (Mỹ Đức)', 'QL21B (Thanh Oai – Ứng Hòa)', 'Ga Thường Tín & Phú Xuyên (QL1A)']
      }
    ]
  }
];

// ============================================================================
// 12. ĐƯỜNG SẮT ĐÔ THỊ (METRO) & BRT (MỐC ĐỊNH VỊ TRÊN CAO KHÔNG THỂ LẠC)
// ============================================================================
export interface IHanoiTransitLine {
  id: string;
  code: string;
  name: string;
  colorHex: string;
  statusVi: string;
  lengthKm: string;
  corridorFollowed: string;
  stations: string[];
  wayfindingRule: string;
}

export const HANOI_TRANSIT_LINES: IHanoiTransitLine[] = [
  {
    id: 'metro-2a',
    code: 'Metro 2A',
    name: 'Tuyến Cát Linh – Hà Đông',
    colorHex: '#16a34a',
    statusVi: 'Đang vận hành thương mại toàn tuyến (12 ga trên cao)',
    lengthKm: '13.1 km',
    corridorFollowed: 'Hào Nam → Hoàng Cầu → Yên Lãng → Thái Hà → Đường Láng → Nguyễn Trãi → Trần Phú → Quang Trung (Hà Đông)',
    stations: [
      'Cát Linh',
      'La Thành',
      'Thái Hà',
      'Láng',
      'Thượng Đình',
      'Vành Đai 3',
      'Phùng Khoang',
      'Văn Quán',
      'Hà Đông',
      'La Khê',
      'Văn Khê',
      'Yên Nghĩa'
    ],
    wayfindingRule:
      'Thấy dầm cầu tàu điện màu xám trắng kèm nhà ga mái vòm xanh lá cây → bạn đang ở trên hành lang Đống Đa – Thanh Xuân – Hà Đông (hướng 7h).'
  },
  {
    id: 'metro-3',
    code: 'Metro 3',
    name: 'Tuyến Nhổn – Cầu Giấy – Ga Hà Nội',
    colorHex: '#dc2626',
    statusVi: 'Đang vận hành 8 ga trên cao (Nhổn ↔ Cầu Giấy); đang thi công 4 ga ngầm tới Ga Hà Nội',
    lengthKm: '12.5 km (8.5 km trên cao + 4.0 km ngầm)',
    corridorFollowed: 'Nhổn (QL32) → Cầu Diễn → Hồ Tùng Mậu → Xuân Thủy → Cầu Giấy → (ngầm: Kim Mã → Cát Linh → Văn Miếu → Ga Hà Nội)',
    stations: [
      'Nhổn',
      'Minh Khai (Bắc Từ Liêm)',
      'Phú Diễn',
      'Cầu Diễn',
      'Lê Đức Thọ',
      'Đại học Quốc gia',
      'Chùa Hà',
      'Cầu Giấy',
      'Kim Mã (ngầm)',
      'Cát Linh (ngầm - giao Metro 2A)',
      'Văn Miếu (ngầm)',
      'Ga Hà Nội (ngầm)'
    ],
    wayfindingRule:
      'Thấy nhà ga trên cao dọc trục Xuân Thủy – Hồ Tùng Mậu – Cầu Diễn → bạn đang ở hành lang phía Tây hướng 9h30 đi Nhổn / Sơn Tây.'
  },
  {
    id: 'brt-01',
    code: 'BRT 01',
    name: 'Tuyến Buýt Nhanh Kim Mã – Yên Nghĩa',
    colorHex: '#0284c7',
    statusVi: 'Đang vận hành làn riêng sát dải phân cách giữa',
    lengthKm: '14.7 km',
    corridorFollowed: 'Bến xe Kim Mã → Giảng Võ → Láng Hạ → Lê Văn Lương → Tố Hữu → Quang Trung → Bến xe Yên Nghĩa',
    stations: [
      'Kim Mã',
      'Núi Trúc',
      'Giảng Võ',
      'Thành Công',
      'Vũ Ngọc Phan',
      'Hoàng Đạo Thúy',
      'Khuất Duy Tiến',
      'Trung Văn',
      'Mỗ Lao',
      'Vạn Phúc',
      'La Khê',
      'Yên Nghĩa'
    ],
    wayfindingRule:
      'Thấy nhà chờ buýt nằm ở chính giữa tim đường với vạch kẻ làn ưu tiên → bạn đang ở trục Giảng Võ – Láng Hạ – Lê Văn Lương – Tố Hữu. Cấm xe máy/ô tô thường lấn vào làn BRT!'
  }
];

// ============================================================================
// 13. TÍNH TOÁN QUY LUẬT MẶT TRỜI TẠI HÀ NỘI (VĨ ĐỘ ~21.0285°N)
// ============================================================================
export function getHanoiSolarAzimuth(hour: number): number {
  if (hour < 5 || hour > 19) return 0;
  const SOLAR_CURVE: Record<number, number> = {
    5: 75,
    6: 85,
    7: 95,
    8: 108,
    9: 122,
    10: 138,
    11: 158,
    12: 180,
    13: 205,
    14: 225,
    15: 242,
    16: 258,
    17: 272,
    18: 285
  };

  const baseHour = Math.floor(hour);
  const frac = hour - baseHour;
  const curr = SOLAR_CURVE[baseHour] ?? 180;
  const next = SOLAR_CURVE[baseHour + 1] ?? curr;
  return Math.round(curr + (next - curr) * frac);
}

export function getHanoiShadowBearing(hour: number): number {
  const sunAzimuth = getHanoiSolarAzimuth(hour);
  return (sunAzimuth + 180) % 360;
}

export function bearingToCardinalName(bearing: number): string {
  const normalized = ((bearing % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'Bắc';
  if (normalized >= 22.5 && normalized < 67.5) return 'Đông Bắc';
  if (normalized >= 67.5 && normalized < 112.5) return 'Đông';
  if (normalized >= 112.5 && normalized < 157.5) return 'Đông Nam';
  if (normalized >= 157.5 && normalized < 202.5) return 'Nam';
  if (normalized >= 202.5 && normalized < 247.5) return 'Tây Nam';
  if (normalized >= 247.5 && normalized < 292.5) return 'Tây';
  return 'Tây Bắc';
}

// ============================================================================
// 14. QUAN HỆ HÌNH HỌC & TOPO (RELATIONAL TOPOLOGY)
// ============================================================================
export const HANOI_RELATIONS: IHanoiRelation[] = [
  {
    id: 'rel-par-1',
    type: 'parallel',
    entityAId: 'st-tran-hung-dao',
    entityBId: 'st-ly-thuong-kiet',
    description: 'Trần Hưng Đạo ∥ Lý Thường Kiệt',
    explanation: 'Hai đại lộ 2 chiều thời Pháp chạy song song theo trục Đông – Tây, cách nhau ~220m.',
    cognitiveKey: 'PARALLEL_FRENCH_EAST_WEST'
  },
  {
    id: 'rel-par-2',
    type: 'parallel',
    entityAId: 'st-ly-thuong-kiet',
    entityBId: 'st-hai-ba-trung',
    description: 'Lý Thường Kiệt ∥ Hai Bà Trưng',
    explanation: 'Hai phố chạy song song tuyệt đối theo trục Đông – Tây phía Nam Hồ Gươm.',
    cognitiveKey: 'PARALLEL_FRENCH_EAST_WEST'
  },
  {
    id: 'rel-par-3',
    type: 'paired_oneway',
    entityAId: 'st-pho-hue',
    entityBId: 'st-ba-trieu',
    description: 'Phố Huế (1 chiều Bắc ↑) ∥ Bà Triệu (1 chiều Nam ↓)',
    explanation:
      'Cặp một chiều ngược hướng kinh điển nhất Hà Nội: Phố Huế đi từ Đại Cồ Việt lên Hàng Bài – Bờ Hồ; Bà Triệu đi từ Hàng Khay xuống Đại Cồ Việt.',
    cognitiveKey: 'PAIRED_ONEWAY_NORTH_SOUTH'
  },
  {
    id: 'rel-par-4',
    type: 'parallel',
    entityAId: 'st-ba-trieu',
    entityBId: 'st-quang-trung',
    description: 'Bà Triệu ∥ Quang Trung (Hoàn Kiếm)',
    explanation: 'Hai trục Bắc – Nam chạy song song phía Đông và phía Tây khu vực Hồ Thiền Quang.',
    cognitiveKey: 'PARALLEL_FRENCH_NORTH_SOUTH'
  },
  {
    id: 'rel-par-5',
    type: 'parallel',
    entityAId: 'corridor-sw-nguyen-trai',
    entityBId: 'corridor-sw-lang-ha',
    description: 'Trục Nguyễn Trãi ∥ Trục Lê Văn Lương – Tố Hữu',
    explanation: 'Hai đại lộ hướng tâm Tây Nam chạy song song kẹp khu đô thị Trung Hòa – Nhân Chính.',
    cognitiveKey: 'PARALLEL_RADIAL_RADIAL'
  },
  {
    id: 'rel-perp-1',
    type: 'perpendicular',
    entityAId: 'st-tran-hung-dao',
    entityBId: 'st-ba-trieu',
    description: 'Trần Hưng Đạo ⊥ Bà Triệu',
    explanation: 'Trần Hưng Đạo chạy Đông – Tây vuông góc 90° với Bà Triệu chạy Bắc – Nam.',
    cognitiveKey: 'PERP_FRENCH_GRID'
  },
  {
    id: 'rel-perp-2',
    type: 'perpendicular',
    entityAId: 'st-ly-thuong-kiet',
    entityBId: 'st-hang-bai',
    description: 'Lý Thường Kiệt ⊥ Hàng Bài',
    explanation: 'Trục Đông – Tây giao cắt vuông góc với trục Nam – Bắc ngay phía Nam Bờ Hồ.',
    cognitiveKey: 'PERP_FRENCH_GRID'
  },
  {
    id: 'rel-perp-3',
    type: 'perpendicular',
    entityAId: 'st-hai-ba-trung',
    entityBId: 'st-quan-su',
    description: 'Hai Bà Trưng ⊥ Quán Sứ',
    explanation: 'Giao lộ ngã tư vuông vức trước cổng TAND Tối cao và Bệnh viện K Quán Sứ.',
    cognitiveKey: 'PERP_FRENCH_GRID'
  },
  {
    id: 'rel-perp-4',
    type: 'perpendicular',
    entityAId: 'ring-1',
    entityBId: 'corridor-south-giai-phong',
    description: 'Vành đai 1 (Đại Cồ Việt – Xã Đàn) ⊥ Trục Lê Duẩn – Giải Phóng',
    explanation: 'Giao cắt vuông góc tại nút giao Hầm chui Kim Liên.',
    cognitiveKey: 'PERP_RING_RADIAL'
  },
  {
    id: 'rel-perp-5',
    type: 'perpendicular',
    entityAId: 'ring-3',
    entityBId: 'corridor-sw-nguyen-trai',
    description: 'Vành đai 3 (Khuất Duy Tiến – Nguyễn Xiển) ⊥ Trục Nguyễn Trãi – Trần Phú',
    explanation: 'Giao cắt vuông góc tại nút giao 4 tầng Thanh Xuân.',
    cognitiveKey: 'PERP_RING_RADIAL'
  }
];

export * from './hanoiCurriculumData';
