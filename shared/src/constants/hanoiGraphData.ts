import { IHanoiGraphData } from '../types/hanoi-graph.types';

export const HANOI_COGNITIVE_GRAPH: IHanoiGraphData = {
  metadata: {
    version: '2.0.0',
    lastVerified: '2026-10-18',
    license: 'ODbL & Brain Pro Spatial Cognitive Framework',
    totalDistricts: 12,
    districtsCovered: [
      'Hoàn Kiếm', 'Ba Đình', 'Đống Đa', 'Hai Bà Trưng',
      'Cầu Giấy', 'Thanh Xuân', 'Tây Hồ', 'Hoàng Mai',
      'Hà Đông', 'Long Biên', 'Nam Từ Liêm', 'Bắc Từ Liêm'
    ]
  },

  nodes: [
    {
      id: 'node-km0-boho',
      name: 'Km 0 Hồ Hoàn Kiếm',
      folkName: 'Bờ Hồ / Đinh Tiên Hoàng - Hàng Khay',
      district: 'Hoàn Kiếm',
      coords: { lat: 21.0285, lng: 105.8542 },
      nodeType: 'major_intersection',
      connectedStreets: ['Đinh Tiên Hoàng', 'Hàng Khay', 'Lê Thái Tổ', 'Tràng Tiền', 'Hàng Bài']
    },
    {
      id: 'node-nga-5-cua-nam',
      name: 'Ngã 5 Cửa Nam',
      folkName: 'Cửa Nam',
      district: 'Hoàn Kiếm',
      coords: { lat: 21.0289, lng: 105.8427 },
      nodeType: 'major_intersection',
      connectedStreets: ['Cửa Nam', 'Lê Duẩn', 'Tràng Thi', 'Nguyễn Thái Học', 'Đình Ngang', 'Hàng Bông']
    },
    {
      id: 'node-nam-chuong-duong',
      name: 'Bùng binh Nam Cầu Chương Dương',
      folkName: 'Đầu cầu Chương Dương phía Hoàn Kiếm',
      district: 'Hoàn Kiếm',
      coords: { lat: 21.0365, lng: 105.8572 },
      nodeType: 'bridge_landing',
      connectedStreets: ['Trần Nhật Duật', 'Trần Quang Khải', 'Cầu Chương Dương']
    },
    {
      id: 'node-trang-tien-hang-bai',
      name: 'Ngã tư Tràng Tiền - Hàng Bài',
      folkName: 'Tràng Tiền Plaza',
      district: 'Hoàn Kiếm',
      coords: { lat: 21.0256, lng: 105.8538 },
      nodeType: 'major_intersection',
      connectedStreets: ['Tràng Tiền', 'Hàng Bài', 'Hàng Khay', 'Đinh Tiên Hoàng']
    },
    {
      id: 'node-voi-phuc',
      name: 'Nút giao Voi Phục',
      folkName: 'Voi Phục / Daewoo',
      district: 'Ba Đình',
      coords: { lat: 21.0315, lng: 105.8115 },
      nodeType: 'major_intersection',
      connectedStreets: ['Kim Mã', 'Cầu Giấy', 'Đào Tấn', 'La Thành', 'Nguyễn Văn Ngọc']
    },
    {
      id: 'node-lieu-giai-kim-ma',
      name: 'Ngã tư Liễu Giai - Kim Mã',
      folkName: 'Ngã tư Lotte Center / Daewoo',
      district: 'Ba Đình',
      coords: { lat: 21.0322, lng: 105.8138 },
      nodeType: 'major_intersection',
      hasOverpass: true,
      connectedStreets: ['Liễu Giai', 'Kim Mã', 'Nguyễn Chí Thanh']
    },
    {
      id: 'node-lang-bac-hung-vuong',
      name: 'Quảng trường Ba Đình - Hùng Vương',
      folkName: 'Lăng Bác',
      district: 'Ba Đình',
      coords: { lat: 21.0371, lng: 105.8344 },
      nodeType: 'major_intersection',
      connectedStreets: ['Hùng Vương', 'Điện Biên Phủ', 'Độc Lập', 'Chùa Một Cột']
    },
    {
      id: 'node-buoi-hoang-hoa-tham',
      name: 'Nút giao Bưởi - Hoàng Hoa Thám',
      folkName: 'Dốc Bưởi / Nút Vành đai 2',
      district: 'Ba Đình',
      coords: { lat: 21.0483, lng: 105.8062 },
      nodeType: 'grade_separated',
      hasOverpass: true,
      connectedStreets: ['Bưởi', 'Hoàng Hoa Thám', 'Hoàng Quốc Việt', 'Lạc Long Quân', 'Võ Chí Công']
    },
    {
      id: 'node-nga-tu-so',
      name: 'Nút giao Ngã Tư Sở',
      folkName: 'Ngã Tư Sở',
      district: 'Đống Đa',
      coords: { lat: 21.0028, lng: 105.8202 },
      nodeType: 'grade_separated',
      hasOverpass: true,
      connectedStreets: ['Đường Láng', 'Trường Chinh', 'Tây Sơn', 'Nguyễn Trãi']
    },
    {
      id: 'node-o-cho-dua',
      name: 'Ngã 7 Ô Chợ Dừa',
      folkName: 'Ô Chợ Dừa / Nút Vành đai 1',
      district: 'Đống Đa',
      coords: { lat: 21.0195, lng: 105.8282 },
      nodeType: 'major_intersection',
      hasOverpass: true,
      connectedStreets: ['Ô Chợ Dừa', 'Xã Đàn', 'Khâm Thiên', 'Tôn Đức Thắng', 'Nguyễn Lương Bằng', 'Đê La Thành', 'Hoàng Cầu']
    },
    {
      id: 'node-ham-kim-lien',
      name: 'Nút giao Hầm Kim Liên',
      folkName: 'Hầm chui Kim Liên - Đại Cồ Việt',
      district: 'Đống Đa',
      coords: { lat: 21.0118, lng: 105.8415 },
      nodeType: 'grade_separated',
      hasUnderpass: true,
      connectedStreets: ['Xã Đàn', 'Đại Cồ Việt', 'Giải Phóng', 'Lê Duẩn']
    },
    {
      id: 'node-lang-ha-thai-ha',
      name: 'Ngã tư Láng Hạ - Thái Hà',
      folkName: 'Ngã tư Huỳnh Thúc Kháng - Láng Hạ',
      district: 'Đống Đa',
      coords: { lat: 21.0175, lng: 105.8152 },
      nodeType: 'grade_separated',
      hasOverpass: true,
      connectedStreets: ['Láng Hạ', 'Thái Hà', 'Huỳnh Thúc Kháng']
    },
    {
      id: 'node-thai-ha-chua-boc',
      name: 'Ngã tư Thái Hà - Chùa Bộc',
      folkName: 'Ngã tư Thái Hà - Tây Sơn',
      district: 'Đống Đa',
      coords: { lat: 21.0105, lng: 105.8236 },
      nodeType: 'grade_separated',
      hasOverpass: true,
      connectedStreets: ['Thái Hà', 'Chùa Bộc', 'Tây Sơn']
    },
    {
      id: 'node-nga-tu-vong',
      name: 'Nút giao Ngã Tư Vọng',
      folkName: 'Ngã Tư Vọng',
      district: 'Hai Bà Trưng',
      coords: { lat: 20.9995, lng: 105.8412 },
      nodeType: 'grade_separated',
      hasOverpass: true,
      connectedStreets: ['Giải Phóng', 'Trường Chinh', 'Đại La']
    },
    {
      id: 'node-nga-tu-cho-mo',
      name: 'Ngã tư Chợ Mơ',
      folkName: 'Chợ Mơ',
      district: 'Hai Bà Trưng',
      coords: { lat: 20.9982, lng: 105.8525 },
      nodeType: 'major_intersection',
      connectedStreets: ['Bạch Mai', 'Trương Định', 'Minh Khai', 'Đại La']
    },
    {
      id: 'node-pho-hue-dai-co-viet',
      name: 'Ngã tư Phố Huế - Đại Cồ Việt',
      folkName: 'Đầu đường Bạch Mai',
      district: 'Hai Bà Trưng',
      coords: { lat: 21.0112, lng: 105.8508 },
      nodeType: 'major_intersection',
      connectedStreets: ['Phố Huế', 'Bạch Mai', 'Đại Cồ Việt', 'Trần Khát Chân']
    },
    {
      id: 'node-cau-giay-lang',
      name: 'Nút giao Cầu Giấy - Đường Láng',
      folkName: 'Đầu Cầu Giấy / Bờ sông Tô Lịch',
      district: 'Cầu Giấy',
      coords: { lat: 21.0289, lng: 105.8038 },
      nodeType: 'major_intersection',
      connectedStreets: ['Cầu Giấy', 'Đường Láng', 'Nguyễn Khang', 'Bưởi', 'Yên Hòa']
    },
    {
      id: 'node-mai-dich',
      name: 'Nút giao Mai Dịch',
      folkName: 'Cầu vượt Mai Dịch',
      district: 'Cầu Giấy',
      coords: { lat: 21.0375, lng: 105.7785 },
      nodeType: 'grade_separated',
      hasOverpass: true,
      connectedStreets: ['Phạm Hùng', 'Phạm Văn Đồng', 'Xuân Thủy', 'Hồ Tùng Mậu']
    },
    {
      id: 'node-trung-hoa-big-c',
      name: 'Nút giao Trung Hòa',
      folkName: 'Ngã tư Big C Thăng Long / Vành đai 3',
      district: 'Cầu Giấy',
      coords: { lat: 21.0068, lng: 105.7905 },
      nodeType: 'grade_separated',
      hasOverpass: true,
      hasUnderpass: true,
      connectedStreets: ['Trần Duy Hưng', 'Đại Lộ Thăng Long', 'Phạm Hùng', 'Khuất Duy Tiến']
    },
    {
      id: 'node-duy-tan-pham-hung',
      name: 'Ngã tư Duy Tân - Phạm Hùng',
      folkName: 'Cổng Thung lũng Silicon Duy Tân',
      district: 'Cầu Giấy',
      coords: { lat: 21.0285, lng: 105.7832 },
      nodeType: 'major_intersection',
      connectedStreets: ['Phạm Hùng', 'Duy Tân', 'Tôn Thất Thuyết']
    },
    {
      id: 'node-thanh-xuan-vd3',
      name: 'Nút giao Thanh Xuân',
      folkName: 'Ngã tư Khuất Duy Tiến - Nguyễn Trãi',
      district: 'Thanh Xuân',
      coords: { lat: 20.9932, lng: 105.8028 },
      nodeType: 'grade_separated',
      hasOverpass: true,
      hasUnderpass: true,
      connectedStreets: ['Nguyễn Trãi', 'Trần Phú', 'Khuất Duy Tiến', 'Nguyễn Xiển']
    },
    {
      id: 'node-le-van-luong-khuat-duy-tien',
      name: 'Nút giao Lê Văn Lương - Khuất Duy Tiến',
      folkName: 'Hầm chui Lê Văn Lương - Tố Hữu',
      district: 'Thanh Xuân',
      coords: { lat: 21.0012, lng: 105.7958 },
      nodeType: 'grade_separated',
      hasUnderpass: true,
      connectedStreets: ['Lê Văn Lương', 'Tố Hữu', 'Khuất Duy Tiến']
    },
    {
      id: 'node-cau-trang-ha-dong',
      name: 'Cầu Trắng Hà Đông',
      folkName: 'Cầu Trắng / Bưu điện Hà Đông',
      district: 'Hà Đông',
      coords: { lat: 20.9725, lng: 105.7782 },
      nodeType: 'major_intersection',
      connectedStreets: ['Trần Phú', 'Quang Trung', 'Phùng Hưng', 'Tô Hiệu']
    },
    {
      id: 'node-to-huu-van-phuc',
      name: 'Ngã tư Vạn Phúc - Tố Hữu',
      folkName: 'Ngã tư Vạn Phúc / Làng Lụa',
      district: 'Hà Đông',
      coords: { lat: 20.9812, lng: 105.7725 },
      nodeType: 'major_intersection',
      connectedStreets: ['Tố Hữu', 'Vạn Phúc', 'Lê Văn Lương kéo dài']
    },
    {
      id: 'node-nga-3-ba-la',
      name: 'Ngã 3 Ba La',
      folkName: 'Ba La Bông Đỏ',
      district: 'Hà Đông',
      coords: { lat: 20.9525, lng: 105.7592 },
      nodeType: 'major_intersection',
      connectedStreets: ['Quang Trung', 'Quốc lộ 21B', 'Quốc lộ 6']
    },
    {
      id: 'node-van-phu-quang-trung',
      name: 'Nút giao Quang Trung - Văn Phú',
      folkName: 'Ngã ba Ba La - Văn Phú',
      district: 'Hà Đông',
      coords: { lat: 20.9612, lng: 105.7682 },
      nodeType: 'major_intersection',
      connectedStreets: ['Quang Trung', 'Lê Trọng Tấn Hà Đông', 'Phúc La']
    },
    {
      id: 'node-bac-chuong-duong',
      name: 'Bùng binh Bắc Cầu Chương Dương',
      folkName: 'Đầu cầu Chương Dương phía Long Biên',
      district: 'Long Biên',
      coords: { lat: 21.0425, lng: 105.8672 },
      nodeType: 'bridge_landing',
      connectedStreets: ['Nguyễn Văn Cừ', 'Ngọc Thụy', 'Đê Long Biên - Xuân Quan']
    },
    {
      id: 'node-cau-chui-long-bien',
      name: 'Nút giao Cầu Chui Long Biên',
      folkName: 'Cầu Chui',
      district: 'Long Biên',
      coords: { lat: 21.0552, lng: 105.8858 },
      nodeType: 'grade_separated',
      hasOverpass: true,
      connectedStreets: ['Nguyễn Văn Cừ', 'Ngô Gia Tự', 'Nguyễn Văn Linh']
    },
    {
      id: 'node-co-linh-vinh-tuy',
      name: 'Nút giao Cổ Linh - Cầu Vĩnh Tuy',
      folkName: 'Cổng Aeon Mall Long Biên',
      district: 'Long Biên',
      coords: { lat: 21.0268, lng: 105.8972 },
      nodeType: 'grade_separated',
      hasOverpass: true,
      connectedStreets: ['Cổ Linh', 'Đàm Quang Trung', 'Cầu Vĩnh Tuy']
    },
    {
      id: 'node-san-my-dinh',
      name: 'Quảng trường Sân Mỹ Đình',
      folkName: 'Sân vận động Mỹ Đình',
      district: 'Nam Từ Liêm',
      coords: { lat: 21.0205, lng: 105.7638 },
      nodeType: 'roundabout',
      connectedStreets: ['Lê Đức Thọ', 'Lê Quang Đạo', 'Tân Mỹ', 'Đỗ Xuân Hợp']
    },
    {
      id: 'node-me-tri-le-quang-dao',
      name: 'Bùng binh Mễ Trì - Lê Quang Đạo',
      folkName: 'Vòng xuyến The Manor / SVĐ Mỹ Đình',
      district: 'Nam Từ Liêm',
      coords: { lat: 21.0125, lng: 105.7712 },
      nodeType: 'roundabout',
      connectedStreets: ['Mễ Trì', 'Lê Quang Đạo', 'Châu Văn Liêm']
    },
    {
      id: 'node-cau-dien',
      name: 'Nút Cầu Diễn',
      folkName: 'Cầu Diễn',
      district: 'Bắc Từ Liêm',
      coords: { lat: 21.0412, lng: 105.7582 },
      nodeType: 'major_intersection',
      connectedStreets: ['Hồ Tùng Mậu', 'Cầu Diễn', 'Hoàng Công Chất', 'Phúc Diễn']
    },
    {
      id: 'node-nhon-ql32',
      name: 'Ngã tư Nhổn',
      folkName: 'Ngã tư ĐH Công Nghiệp Hà Nội',
      district: 'Bắc Từ Liêm',
      coords: { lat: 21.0562, lng: 105.7358 },
      nodeType: 'major_intersection',
      connectedStreets: ['Cầu Diễn', 'Quốc lộ 32', 'Tây Tựu', 'Xuân Phương']
    },
    {
      id: 'node-phap-van-nuoc-ngam',
      name: 'Nút giao Pháp Vân',
      folkName: 'Cửa ngõ Bến xe Nước Ngầm / Cao tốc Pháp Vân',
      district: 'Hoàng Mai',
      coords: { lat: 20.9652, lng: 105.8458 },
      nodeType: 'grade_separated',
      hasOverpass: true,
      connectedStreets: ['Giải Phóng', 'Ngọc Hồi', 'Vành Đai 3', 'Cao tốc Pháp Vân - Cầu Giẽ']
    },
    {
      id: 'node-cau-dau-linh-dam',
      name: 'Cầu Dậu Linh Đàm',
      folkName: 'Cầu Dậu / Bán đảo Linh Đàm',
      district: 'Hoàng Mai',
      coords: { lat: 20.9745, lng: 105.8236 },
      nodeType: 'major_intersection',
      connectedStreets: ['Nghiêm Xuân Yêm', 'Kim Giang', 'Nguyễn Hữu Thọ']
    },
    {
      id: 'node-duoi-ca-giap-bat',
      name: 'Ngã 3 Đuôi Cá',
      folkName: 'Ngã 3 Đuôi Cá / Bến xe Giáp Bát',
      district: 'Hoàng Mai',
      coords: { lat: 20.9852, lng: 105.8432 },
      nodeType: 'major_intersection',
      connectedStreets: ['Giải Phóng', 'Trương Định', 'Kim Đồng']
    },
    {
      id: 'node-xuan-la-vo-chi-cong',
      name: 'Ngã tư Xuân La - Võ Chí Công',
      folkName: 'Ngã tư Lotte Mall Tây Hồ',
      district: 'Tây Hồ',
      coords: { lat: 21.0625, lng: 105.8082 },
      nodeType: 'major_intersection',
      hasOverpass: true,
      connectedStreets: ['Võ Chí Công', 'Xuân La', 'Lạc Long Quân']
    },
    {
      id: 'node-yen-phu-thanh-nien',
      name: 'Nút giao Yên Phụ - Thanh Niên',
      folkName: 'Đầu đường Thanh Niên / Trấn Quốc',
      district: 'Tây Hồ',
      coords: { lat: 21.0495, lng: 105.8412 },
      nodeType: 'major_intersection',
      connectedStreets: ['Yên Phụ', 'Thanh Niên', 'Nghi Tàm']
    }
  ],

  segments: [],

  corridors: [
    {
      id: 'corridor-tay-nam',
      name: 'Trục Tây Nam: Tây Sơn - Nguyễn Trãi - Trần Phú - Quang Trung',
      tier: 'radial',
      orientation: 'RADIAL_DIAGONAL',
      streetSequence: ['Tây Sơn', 'Nguyễn Trãi', 'Trần Phú (Hà Đông)', 'Quang Trung (Hà Đông)', 'Ba La'],
      keyNodesSequence: [
        'node-o-cho-dua',
        'node-thai-ha-chua-boc',
        'node-nga-tu-so',
        'node-thanh-xuan-vd3',
        'node-cau-trang-ha-dong',
        'node-van-phu-quang-trung',
        'node-nga-3-ba-la'
      ],
      districts: ['Đống Đa', 'Thanh Xuân', 'Hà Đông'],
      description: 'Huyết mạch xương sống nối toàn bộ khu Tây Nam qua 3 quận. Trục chạy song song tuyến đường sắt đô thị Cát Linh - Hà Đông trên cao.',
      cognitiveRule: 'Đi từ Bờ Hồ ra phía Tây Nam: qua Ô Chợ Dừa gặp Tây Sơn -> vượt Ngã Tư Sở đổi tên thành Nguyễn Trãi -> vượt VĐ3 đổi tên thành Trần Phú -> qua Cầu Trắng đổi tên thành Quang Trung ra tới Ba La.',
      crossStreetsInOrder: [
        { nodeName: 'Ô Chợ Dừa', intersectingStreets: ['Xã Đàn', 'Khâm Thiên', 'Tôn Đức Thắng'] },
        { nodeName: 'Thái Hà - Chùa Bộc', intersectingStreets: ['Thái Hà', 'Chùa Bộc'] },
        { nodeName: 'Ngã Tư Sở', intersectingStreets: ['Đường Láng', 'Trường Chinh'] },
        { nodeName: 'Nút Thanh Xuân (VĐ3)', intersectingStreets: ['Khuất Duy Tiến', 'Nguyễn Xiển'] },
        { nodeName: 'Cầu Trắng Hà Đông', intersectingStreets: ['Phùng Hưng', 'Tô Hiệu'] },
        { nodeName: 'Văn Phú', intersectingStreets: ['Lê Trọng Tấn (Hà Đông)'] },
        { nodeName: 'Ngã 3 Ba La', intersectingStreets: ['Quốc lộ 21B', 'Quốc lộ 6'] }
      ]
    },
    {
      id: 'corridor-giang-vo-to-huu',
      name: 'Trục Giảng Võ - Láng Hạ - Lê Văn Lương - Tố Hữu',
      tier: 'radial',
      orientation: 'RADIAL_DIAGONAL',
      streetSequence: ['Giảng Võ', 'Láng Hạ', 'Lê Văn Lương', 'Tố Hữu', 'Yên Nghĩa'],
      keyNodesSequence: [
        'node-lieu-giai-kim-ma',
        'node-lang-ha-thai-ha',
        'node-cau-giay-lang',
        'node-le-van-luong-khuat-duy-tien',
        'node-to-huu-van-phuc'
      ],
      districts: ['Ba Đình', 'Đống Đa', 'Thanh Xuân', 'Nam Từ Liêm', 'Hà Đông'],
      description: 'Trục hướng tâm tài chính, văn phòng song song phía Bắc của trục Nguyễn Trãi. Có tuyến xe buýt nhanh BRT 01 chạy dọc dải phân cách giữa.',
      cognitiveRule: 'Từ Giảng Võ đi thẳng qua cầu vượt La Thành gặp Láng Hạ -> qua cầu Hòa Mục (sông Tô Lịch) đổi tên thành Lê Văn Lương -> qua ngã tư Khuất Duy Tiến (VĐ3) đổi tên thành Tố Hữu chạy thẳng tới Vạn Phúc và Yên Nghĩa.',
      crossStreetsInOrder: [
        { nodeName: 'Giảng Võ - Cát Linh', intersectingStreets: ['Cát Linh', 'Giảng Võ'] },
        { nodeName: 'Ngã tư Láng Hạ - Huỳnh Thúc Kháng / Thái Hà', intersectingStreets: ['Thái Hà', 'Huỳnh Thúc Kháng'] },
        { nodeName: 'Cầu Hòa Mục (Đường Láng)', intersectingStreets: ['Đường Láng'] },
        { nodeName: 'Ngã tư Khuất Duy Tiến (VĐ3)', intersectingStreets: ['Khuất Duy Tiến'] },
        { nodeName: 'Ngã tư Vạn Phúc', intersectingStreets: ['Vạn Phúc'] }
      ]
    },
    {
      id: 'corridor-lieu-giai-tran-duy-hung',
      name: 'Trục Văn Cao - Liễu Giai - Nguyễn Chí Thanh - Trần Duy Hưng',
      tier: 'radial',
      orientation: 'RADIAL_DIAGONAL',
      streetSequence: ['Văn Cao', 'Liễu Giai', 'Nguyễn Chí Thanh', 'Trần Duy Hưng', 'Đại Lộ Thăng Long'],
      keyNodesSequence: [
        'node-buoi-hoang-hoa-tham',
        'node-lieu-giai-kim-ma',
        'node-lang-ha-thai-ha',
        'node-cau-giay-lang',
        'node-trung-hoa-big-c'
      ],
      districts: ['Tây Hồ', 'Ba Đình', 'Đống Đa', 'Cầu Giấy', 'Nam Từ Liêm'],
      description: 'Trục cảnh quan hiện đại bậc nhất nối thẳng từ Hồ Tây tới Trung tâm Hội nghị Quốc gia và Đại Lộ Thăng Long.',
      cognitiveRule: 'Bắt đầu từ sát mép Hồ Tây (Văn Cao) -> Liễu Giai (Lotte Daewoo) -> vượt ngã tư Kim Mã thành Nguyễn Chí Thanh -> vượt cầu vượt Đường Láng thành Trần Duy Hưng -> kết thúc tại Big C đâm thẳng vào Cao tốc Thăng Long.',
      crossStreetsInOrder: [
        { nodeName: 'Hồ Tây - Văn Cao', intersectingStreets: ['Trích Sài', 'Thụy Khuê'] },
        { nodeName: 'Ngã tư Daewoo', intersectingStreets: ['Kim Mã', 'Đội Cấn'] },
        { nodeName: 'Cầu vượt Huỳnh Thúc Kháng', intersectingStreets: ['Huỳnh Thúc Kháng'] },
        { nodeName: 'Cầu vượt Đường Láng', intersectingStreets: ['Đường Láng'] },
        { nodeName: 'Nút giao Trung Hòa (VĐ3)', intersectingStreets: ['Phạm Hùng', 'Khuất Duy Tiến', 'Đại Lộ Thăng Long'] }
      ]
    },
    {
      id: 'corridor-cau-giay-ql32',
      name: 'Trục Kim Mã - Cầu Giấy - Xuân Thủy - Cầu Diễn - Nhổn',
      tier: 'radial',
      orientation: 'EAST_WEST',
      streetSequence: ['Kim Mã', 'Cầu Giấy', 'Xuân Thủy', 'Hồ Tùng Mậu', 'Cầu Diễn', 'Quốc lộ 32'],
      keyNodesSequence: [
        'node-nga-5-cua-nam',
        'node-voi-phuc',
        'node-cau-giay-lang',
        'node-mai-dich',
        'node-cau-dien',
        'node-nhon-ql32'
      ],
      districts: ['Ba Đình', 'Cầu Giấy', 'Nam Từ Liêm', 'Bắc Từ Liêm'],
      description: 'Cửa ngõ Tây Bắc thủ đô nối toàn bộ hệ thống đại học (ĐHQG, Sư Phạm, Thương Mại, Công Nghiệp) và chạy dọc tuyến Metro 3 Nhổn - Ga Hà Nội.',
      cognitiveRule: 'Kim Mã qua ngã tư Voi Phục đổi tên thành Cầu Giấy -> qua ngã ba Trần Thái Tông thành Xuân Thủy -> qua cầu vượt Mai Dịch (VĐ3) đổi tên thành Hồ Tùng Mậu -> qua Cầu Diễn đổi tên thành Cầu Diễn / QL32 tới ngã tư Nhổn.',
      crossStreetsInOrder: [
        { nodeName: 'Voi Phục', intersectingStreets: ['La Thành', 'Đào Tấn'] },
        { nodeName: 'Cầu Giấy', intersectingStreets: ['Đường Láng', 'Nguyễn Khang'] },
        { nodeName: 'Ngã tư Mai Dịch', intersectingStreets: ['Phạm Hùng', 'Phạm Văn Đồng'] },
        { nodeName: 'Cầu Diễn', intersectingStreets: ['Phúc Diễn', 'Hoàng Công Chất'] },
        { nodeName: 'Nhổn', intersectingStreets: ['Tây Tựu', 'Xuân Phương'] }
      ]
    },
    {
      id: 'corridor-giai-phong-nam',
      name: 'Trục Lê Duẩn - Giải Phóng - Ngọc Hồi',
      tier: 'radial',
      orientation: 'NORTH_SOUTH',
      streetSequence: ['Lê Duẩn', 'Giải Phóng', 'Ngọc Hồi'],
      keyNodesSequence: [
        'node-nga-5-cua-nam',
        'node-ham-kim-lien',
        'node-nga-tu-vong',
        'node-duoi-ca-giap-bat',
        'node-phap-van-nuoc-ngam'
      ],
      districts: ['Hoàn Kiếm', 'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Trì'],
      description: 'Trục xương sống hướng Nam chạy song song tuyến đường sắt Bắc Nam, kết nối hai bến xe khổng lồ: Bến xe Giáp Bát và Bến xe Nước Ngầm.',
      cognitiveRule: 'Bắt đầu từ Cửa Nam -> Lê Duẩn chạy qua Ga Hà Nội -> chui qua Hầm Kim Liên đổi thành Giải Phóng -> vượt cầu vượt Ngã Tư Vọng -> qua Bến xe Giáp Bát -> đến Nút Pháp Vân đổi tên thành Ngọc Hồi dẫn ra Quốc lộ 1A.',
      crossStreetsInOrder: [
        { nodeName: 'Cửa Nam', intersectingStreets: ['Tràng Thi', 'Nguyễn Thái Học'] },
        { nodeName: 'Hầm Kim Liên (VĐ1)', intersectingStreets: ['Đại Cồ Việt', 'Xã Đàn'] },
        { nodeName: 'Ngã Tư Vọng (VĐ2)', intersectingStreets: ['Trường Chinh', 'Đại La'] },
        { nodeName: 'Đuôi Cá (Giáp Bát)', intersectingStreets: ['Kim Đồng', 'Trương Định'] },
        { nodeName: 'Pháp Vân (VĐ3)', intersectingStreets: ['Vành Đai 3', 'Cao tốc Pháp Vân'] }
      ]
    },
    {
      id: 'corridor-chuong-duong-long-bien',
      name: 'Trục Vượt Sông Hồng: Trần Nhật Duật - Cầu Chương Dương - Nguyễn Văn Cừ - Ngô Gia Tự',
      tier: 'radial',
      orientation: 'RADIAL_DIAGONAL',
      streetSequence: ['Trần Nhật Duật', 'Cầu Chương Dương', 'Nguyễn Văn Cừ', 'Ngô Gia Tự', 'Cầu Đuống'],
      keyNodesSequence: [
        'node-nam-chuong-duong',
        'node-bac-chuong-duong',
        'node-cau-chui-long-bien'
      ],
      districts: ['Hoàn Kiếm', 'Long Biên', 'Gia Lâm'],
      description: 'Hành lang vượt sông Hồng lịch sử và tấp nập nhất nối thẳng phố cổ Hoàn Kiếm với trung tâm quận Long Biên và ngã ba Cầu Chui.',
      cognitiveRule: 'Từ đê Trần Nhật Duật lên Cầu Chương Dương vượt sông Hồng -> đổ xuống Nguyễn Văn Cừ (Long Biên) chạy thẳng 3km -> gặp nút giao Cầu Chui đâm thẳng thành Ngô Gia Tự đi Cầu Đuống sang Gia Lâm.',
      crossStreetsInOrder: [
        { nodeName: 'Nam Cầu Chương Dương', intersectingStreets: ['Trần Nhật Duật', 'Trần Quang Khải'] },
        { nodeName: 'Bắc Cầu Chương Dương', intersectingStreets: ['Ngọc Thụy', 'Đê Long Biên'] },
        { nodeName: 'Ngã tư Nguyễn Sơn', intersectingStreets: ['Nguyễn Sơn', 'Hoàng Minh Đạo'] },
        { nodeName: 'Nút giao Cầu Chui', intersectingStreets: ['Nguyễn Văn Linh', 'Đường 5 kéo dài'] }
      ]
    },
    {
      id: 'corridor-vanh-dai-3',
      name: 'Trục Vành Đai 3: Phạm Văn Đồng - Phạm Hùng - Khuất Duy Tiến - Nguyễn Xiển - Nghiêm Xuân Yêm',
      tier: 'ring',
      orientation: 'RING_LOOP',
      streetSequence: ['Cầu Thăng Long', 'Phạm Văn Đồng', 'Phạm Hùng', 'Khuất Duy Tiến', 'Nguyễn Xiển', 'Nghiêm Xuân Yêm', 'Hoàng Liệt', 'Cầu Thanh Trì'],
      keyNodesSequence: [
        'node-mai-dich',
        'node-duy-tan-pham-hung',
        'node-trung-hoa-big-c',
        'node-thanh-xuan-vd3',
        'node-cau-dau-linh-dam',
        'node-phap-van-nuoc-ngam'
      ],
      districts: ['Bắc Từ Liêm', 'Cầu Giấy', 'Nam Từ Liêm', 'Thanh Xuân', 'Hoàng Mai'],
      description: 'Vành đai cao tốc huyết mạch nhất của Hà Nội phân định giữa nội thành cũ và các quận đô thị mới phía Tây - Nam.',
      cognitiveRule: 'Cầu Thăng Long -> Phạm Văn Đồng (Bắc Từ Liêm) -> qua cầu Mai Dịch thành Phạm Hùng (Cầu Giấy/Nam Từ Liêm) -> qua ngã tư Big C thành Khuất Duy Tiến (Thanh Xuân) -> qua ngã tư Nguyễn Trãi thành Nguyễn Xiển -> qua ngã tư Kim Giang thành Nghiêm Xuân Yêm (Hoàng Mai) tới Linh Đàm và Pháp Vân.',
      crossStreetsInOrder: [
        { nodeName: 'Cầu vượt Mai Dịch', intersectingStreets: ['Xuân Thủy', 'Hồ Tùng Mậu'] },
        { nodeName: 'Ngã tư Tôn Thất Thuyết', intersectingStreets: ['Tôn Thất Thuyết', 'Duy Tân'] },
        { nodeName: 'Nút Trung Hòa', intersectingStreets: ['Trần Duy Hưng', 'Đại Lộ Thăng Long'] },
        { nodeName: 'Nút Thanh Xuân', intersectingStreets: ['Nguyễn Trãi', 'Trần Phú'] },
        { nodeName: 'Cầu Dậu Linh Đàm', intersectingStreets: ['Kim Giang', 'Nguyễn Hữu Thọ'] },
        { nodeName: 'Nút Pháp Vân', intersectingStreets: ['Giải Phóng', 'Ngọc Hồi'] }
      ]
    },
    {
      id: 'corridor-vanh-dai-2',
      name: 'Trục Vành Đai 2: Võ Chí Công - Bưởi - Láng - Trường Chinh - Đại La - Minh Khai - Cầu Vĩnh Tuy',
      tier: 'ring',
      orientation: 'RING_LOOP',
      streetSequence: ['Võ Chí Công', 'Bưởi', 'Đường Láng', 'Trường Chinh', 'Đại La', 'Minh Khai', 'Cầu Vĩnh Tuy', 'Đàm Quang Trung'],
      keyNodesSequence: [
        'node-xuan-la-vo-chi-cong',
        'node-buoi-hoang-hoa-tham',
        'node-cau-giay-lang',
        'node-nga-tu-so',
        'node-nga-tu-vong',
        'node-nga-tu-cho-mo',
        'node-co-linh-vinh-tuy'
      ],
      districts: ['Tây Hồ', 'Ba Đình', 'Cầu Giấy', 'Đống Đa', 'Thanh Xuân', 'Hai Bà Trưng', 'Long Biên'],
      description: 'Vành đai tròn khép kín bao quanh các quận lõi cổ với đường trên cao hiện đại đoạn từ Cầu Vĩnh Tuy tới Ngã Tư Sở.',
      cognitiveRule: 'Cầu Nhật Tân -> Võ Chí Công -> dốc Bưởi -> Đường Láng chạy ven sông Tô Lịch -> rẽ trái vào Ngã Tư Sở thành Trường Chinh -> qua Ngã Tư Vọng thành Đại La -> qua Chợ Mơ thành Minh Khai -> qua Times City lên Cầu Vĩnh Tuy sang Long Biên.',
      crossStreetsInOrder: [
        { nodeName: 'Dốc Bưởi', intersectingStreets: ['Hoàng Hoa Thám', 'Hoàng Quốc Việt'] },
        { nodeName: 'Nút Cầu Giấy', intersectingStreets: ['Cầu Giấy', 'Kim Mã'] },
        { nodeName: 'Cầu Hòa Mục', intersectingStreets: ['Lê Văn Lương', 'Láng Hạ'] },
        { nodeName: 'Ngã Tư Sở', intersectingStreets: ['Tây Sơn', 'Nguyễn Trãi'] },
        { nodeName: 'Ngã Tư Vọng', intersectingStreets: ['Giải Phóng'] },
        { nodeName: 'Chợ Mơ', intersectingStreets: ['Bạch Mai', 'Trương Định'] }
      ]
    },
    {
      id: 'corridor-vanh-dai-1',
      name: 'Trục Vành Đai 1: Trần Khát Chân - Đại Cồ Việt - Xã Đàn - Ô Chợ Dừa - Hoàng Cầu - Yên Lãng',
      tier: 'ring',
      orientation: 'RING_LOOP',
      streetSequence: ['Trần Khát Chân', 'Đại Cồ Việt', 'Xã Đàn', 'Ô Chợ Dừa', 'Hoàng Cầu', 'Yên Lãng'],
      keyNodesSequence: [
        'node-pho-hue-dai-co-viet',
        'node-ham-kim-lien',
        'node-o-cho-dua',
        'node-lang-ha-thai-ha'
      ],
      districts: ['Hai Bà Trưng', 'Đống Đa'],
      description: 'Vành đai nội đô lõi đầu tiên tiếp giáp ngay ngoài 4 quận trung tâm lịch sử.',
      cognitiveRule: 'Đê Nguyễn Khoái -> Trần Khát Chân -> vượt ngã tư Phố Huế thành Đại Cồ Việt -> chui qua Hầm Kim Liên thành Xã Đàn -> tới ngã 7 Ô Chợ Dừa rẽ Hoàng Cầu đi Yên Lãng đâm thẳng ra Đường Láng.',
      crossStreetsInOrder: [
        { nodeName: 'Ngã tư Phố Huế', intersectingStreets: ['Phố Huế', 'Bạch Mai'] },
        { nodeName: 'Hầm Kim Liên', intersectingStreets: ['Lê Duẩn', 'Giải Phóng'] },
        { nodeName: 'Ô Chợ Dừa', intersectingStreets: ['Tôn Đức Thắng', 'Nguyễn Lương Bằng', 'Khâm Thiên'] },
        { nodeName: 'Hoàng Cầu - Thái Hà', intersectingStreets: ['Thái Hà'] }
      ]
    },
    {
      id: 'corridor-nam-tu-liem-truong-chinh',
      name: 'Trục Đô Thị Mới Mỹ Đình: Lê Đức Thọ - Lê Quang Đạo - Mễ Trì',
      tier: 'arterial',
      orientation: 'NORTH_SOUTH',
      streetSequence: ['Lê Đức Thọ', 'Lê Quang Đạo', 'Mễ Trì', 'Dương Đình Nghệ'],
      keyNodesSequence: [
        'node-san-my-dinh',
        'node-me-tri-le-quang-dao',
        'node-duy-tan-pham-hung'
      ],
      districts: ['Nam Từ Liêm', 'Cầu Giấy'],
      description: 'Trục hành chính thể thao và trung tâm mới phía Tây quanh Khu liên hợp thể thao quốc gia Mỹ Đình.',
      cognitiveRule: 'Từ Hồ Tùng Mậu rẽ vào Lê Đức Thọ chạy qua trước Sân Mỹ Đình -> thẳng vào Lê Quang Đạo -> gặp bùng binh rẽ sang Mễ Trì / The Manor -> chạy ra Dương Đình Nghệ (Cầu Giấy).',
      crossStreetsInOrder: [
        { nodeName: 'Ngã tư Hồ Tùng Mậu', intersectingStreets: ['Hồ Tùng Mậu'] },
        { nodeName: 'Quảng trường Mỹ Đình', intersectingStreets: ['Tân Mỹ', 'Đỗ Xuân Hợp'] },
        { nodeName: 'Vòng xuyến Mễ Trì', intersectingStreets: ['Mễ Trì', 'Châu Văn Liêm'] },
        { nodeName: 'Nút giao Phạm Hùng', intersectingStreets: ['Phạm Hùng'] }
      ]
    }
  ],

  cells: [
    {
      id: 'cell-thanh-cong',
      name: 'Ô Thành Công - Giảng Võ',
      folkNeighborhood: 'Khu tập thể Thành Công, Nam Thành Công, Nguyên Hồng',
      district: 'Ba Đình / Đống Đa',
      ringZone: 'ring_1_to_2',
      boundingStreets: ['Đường Láng', 'Láng Hạ', 'Huỳnh Thúc Kháng', 'Nguyễn Chí Thanh'],
      primaryExits: ['Phố Nguyên Hồng', 'Phố Trúc Khê', 'Phố Vũ Ngọc Phan', 'Đường Thành Công'],
      keyLandmarksInside: ['Hồ Thành Công', 'Chợ Thành Công', 'Đài Truyền hình Hà Nội', 'Trường THPT Phan Huy Chú'],
      cognitiveStrategy: 'Khi ở sâu trong ngõ Thành Công/Nguyên Hồng, chỉ cần tìm đường ra một trong 4 trục bao: đi về phía Tây gặp Đường Láng (sông Tô Lịch), phía Bắc gặp Nguyễn Chí Thanh, phía Nam gặp Láng Hạ, phía Đông gặp Huỳnh Thúc Kháng.'
    },
    {
      id: 'cell-thai-ha-chua-boc',
      name: 'Ô Thái Hà - Trung Liệt - Thái Thịnh',
      folkNeighborhood: 'Khu dân cư Thái Hà, Đặng Tiến Đông, Bệnh viện Châm Cứu TW',
      district: 'Đống Đa',
      ringZone: 'ring_1_to_2',
      boundingStreets: ['Láng Hạ', 'Thái Hà', 'Tây Sơn', 'Đường Láng'],
      primaryExits: ['Phố Thái Thịnh', 'Phố Yên Lãng', 'Phố Đặng Tiến Đông'],
      keyLandmarksInside: ['Bệnh viện Châm cứu TW', 'Hồ Đống Đa (Hoàng Cầu)', 'Bệnh viện Đa khoa Đống Đa'],
      cognitiveStrategy: 'Nếu đang kẹt trong mạng ngõ Thái Thịnh/Yên Lãng: Đi thẳng theo Yên Lãng sẽ cắt ngang ra Đường Láng (phía Tây) hoặc ra Thái Hà/Hoàng Cầu (phía Đông).'
    },
    {
      id: 'cell-trung-hoa-nhan-chinh',
      name: 'Ô Trung Hòa - Nhân Chính',
      folkNeighborhood: 'Khu Đô thị Mới Trung Hòa Nhân Chính, Phố Hoàng Đạo Thúy',
      district: 'Cầu Giấy / Thanh Xuân',
      ringZone: 'ring_2_to_3',
      boundingStreets: ['Trần Duy Hưng', 'Đường Láng', 'Lê Văn Lương', 'Khuất Duy Tiến'],
      primaryExits: ['Hoàng Đạo Thúy', 'Hoàng Minh Giám', 'Nguyễn Thị Thập', 'Nguyễn Thị Định'],
      keyLandmarksInside: ['Trường Chuyên Hà Nội - Amsterdam', 'Công viên Nhân Chính', 'Tòa nhà Charmvit'],
      cognitiveStrategy: 'Ô bàn cờ vuông vắn nhất khu Tây. Hai trục xương cá xuyên tâm là Hoàng Đạo Thúy và Hoàng Minh Giám luôn cắt vuông góc từ Lê Văn Lương sang Trần Duy Hưng.'
    },
    {
      id: 'cell-bach-kinh-xay',
      name: 'Ô Bách - Kinh - Xây (Đại học Bách Khoa)',
      folkNeighborhood: 'Tam giác đại học Bách Khoa, Kinh Tế Quốc Dân, Xây Dựng',
      district: 'Hai Bà Trưng',
      ringZone: 'ring_1_to_2',
      boundingStreets: ['Đại Cồ Việt', 'Giải Phóng', 'Đại La', 'Trần Đại Nghĩa / Bạch Mai'],
      primaryExits: ['Trần Đại Nghĩa', 'Tạ Quang Bửu', 'Lê Thanh Nghị'],
      keyLandmarksInside: ['Khu Ký túc xá Bách Khoa', 'Sân vận động Bách Khoa', 'Bệnh viện Bạch Mai'],
      cognitiveStrategy: 'Trục Trần Đại Nghĩa và Tạ Quang Bửu là xương sống chạy thẳng từ Đại Cồ Việt xuống Đại La.'
    },
    {
      id: 'cell-pho-co-hoan-kiem',
      name: 'Ô 36 Phố Phường Cổ',
      folkNeighborhood: 'Phố Cổ Hà Nội',
      district: 'Hoàn Kiếm',
      ringZone: 'ring_1_core',
      boundingStreets: ['Hàng Đậu', 'Trần Nhật Duật', 'Hàng Gai / Hàng Bông', 'Phùng Hưng'],
      primaryExits: ['Hàng Đào - Đồng Xuân', 'Hàng Mã', 'Hàng Bông', 'Cửa Đông'],
      keyLandmarksInside: ['Chợ Đồng Xuân', 'Ô Quan Chưởng', 'Đền Bạch Mã'],
      cognitiveStrategy: 'Quy luật: các phố "Hàng" chạy dọc theo hướng Bắc - Nam (Hàng Đào, Hàng Ngang, Hàng Đường, Đồng Xuân) dẫn thẳng ra Bờ Hồ; các phố ngang Đông - Tây (Hàng Bạc, Hàng Buồm, Hàng Mã) nối từ đường đê Trần Nhật Duật sang đường tàu Phùng Hưng.'
    },
    {
      id: 'cell-ha-dong-trung-tam',
      name: 'Ô Lõi Trung Tâm Hà Đông',
      folkNeighborhood: 'Khu vực Chợ Hà Đông, Phố Cổ Hà Đông, Làng Lụa Vạn Phúc',
      district: 'Hà Đông',
      ringZone: 'outer_ring_3',
      boundingStreets: ['Trần Phú', 'Quang Trung', 'Tô Hiệu', 'Phùng Hưng', 'Tố Hữu'],
      primaryExits: ['Vạn Phúc', 'Lê Lợi Hà Đông', 'Bà Triệu Hà Đông', 'Cầu Am'],
      keyLandmarksInside: ['Chợ Hà Đông', 'Bệnh viện Đa khoa Hà Đông', 'Sân vận động Hà Đông'],
      cognitiveStrategy: 'Trục Quang Trung - Trần Phú là biên phía Bắc; rẽ vào Tô Hiệu hoặc Phùng Hưng sẽ dẫn sang khu hành chính và Bệnh viện 103.'
    },
    {
      id: 'cell-long-bien-co-linh',
      name: 'Ô Bồ Đề - Ngọc Lâm - Cổ Linh',
      folkNeighborhood: 'Khu vực Bến xe Gia Lâm, Bồ Đề, Aeon Mall Long Biên',
      district: 'Long Biên',
      ringZone: 'across_red_river',
      boundingStreets: ['Nguyễn Văn Cừ', 'Đê Long Biên - Xuân Quan', 'Cổ Linh', 'Nguyễn Sơn'],
      primaryExits: ['Hoàng Như Tiếp', 'Bồ Đề', 'Ngọc Lâm', 'Đàm Quang Trung'],
      keyLandmarksInside: ['Bệnh viện Tâm Anh', 'Sân bay Gia Lâm', 'Cầu Trần Hưng Đạo quy hoạch'],
      cognitiveStrategy: 'Nằm kẹp giữa sông Hồng và trục Nguyễn Văn Cừ. Muốn về lại nội thành: đi về phía Tây Bắc lên Cầu Chương Dương / Cầu Long Biên, đi về phía Nam ra Cổ Linh lên Cầu Vĩnh Tuy.'
    },
    {
      id: 'cell-my-dinh-nam-tu-liem',
      name: 'Ô Đô Thị Mỹ Đình - Mễ Trì',
      folkNeighborhood: 'Khu đô thị Mỹ Đình 1 & 2, Mễ Trì Hạ, Làng Phú Đô',
      district: 'Nam Từ Liêm',
      ringZone: 'outer_ring_3',
      boundingStreets: ['Phạm Hùng', 'Mễ Trì', 'Lê Đức Thọ', 'Hồ Tùng Mậu'],
      primaryExits: ['Nguyễn Hoàng', 'Trần Hữu Dực', 'Đỗ Đức Dục', 'Đình Thôn'],
      keyLandmarksInside: ['Bến xe Mỹ Đình', 'Sân vận động Quốc gia Mỹ Đình', 'Tòa nhà Keangnam 72'],
      cognitiveStrategy: 'Khi ở trong làng Đình Thôn hoặc ngõ Mễ Trì: Hướng Đông luôn là trục Phạm Hùng (tòa tháp Keangnam làm mốc nhận diện cao 72 tầng); hướng Tây là Sân vận động Mỹ Đình.'
    },
    {
      id: 'cell-linh-dam-hoang-mai',
      name: 'Ô Bán Đảo Linh Đàm',
      folkNeighborhood: 'Khu đô thị kiểu mẫu Linh Đàm, Bán đảo hồ Linh Đàm',
      district: 'Hoàng Mai',
      ringZone: 'outer_ring_3',
      boundingStreets: ['Vành Đai 3 (Nghiêm Xuân Yêm)', 'Giải Phóng (Ngọc Hồi)', 'Đường 70 Phan Trọng Tuệ', 'Sông Tô Lịch (Kim Giang)'],
      primaryExits: ['Nguyễn Hữu Thọ', 'Đặng Xuân Bảng', 'Linh Đường'],
      keyLandmarksInside: ['Hồ Linh Đàm', 'Bến xe Nước Ngầm', 'Chùa Tứ Kỳ'],
      cognitiveStrategy: 'Bán đảo được hồ nước bao bọc 3 mặt. Trục Nguyễn Hữu Thọ là con đường độc đạo xuyên tâm chạy từ cầu Dậu (VĐ3) đâm thẳng ra đường Giải Phóng.'
    }
  ],

  destinations: [
    {
      id: 'poi-bx-my-dinh',
      name: 'Bến xe Mỹ Đình',
      category: 'transit_hub',
      district: 'Nam Từ Liêm',
      address: 'Số 20 Phạm Hùng, Mỹ Đình 2',
      cellId: 'cell-my-dinh-nam-tu-liem',
      accessStreet: 'Phạm Hùng',
      secondaryStreets: ['Nguyễn Hoàng', 'Trần Bình'],
      gatePosition: 'Cổng chính hướng mặt ra đường Phạm Hùng (hướng đi Cầu Giấy)',
      sideOfStreet: 'odd_side',
      motorbikeTip: 'Đi xe máy từ phía Cầu Giấy tới thì bến xe nằm ngay bên tay phải. Nếu đi từ Khuất Duy Tiến lên phải quay đầu dưới gầm cầu vượt Mai Dịch.'
    },
    {
      id: 'poi-bx-giap-bat',
      name: 'Bến xe Giáp Bát',
      category: 'transit_hub',
      district: 'Hoàng Mai',
      address: 'Km 6 Đường Giải Phóng, Giáp Bát',
      cellId: 'cell-linh-dam-hoang-mai',
      accessStreet: 'Giải Phóng',
      secondaryStreets: ['Kim Đồng'],
      gatePosition: 'Mặt tiền đường Giải Phóng (chiều hướng tâm về trung tâm)',
      sideOfStreet: 'even_side',
      motorbikeTip: 'Nằm bên phía tay phải khi di chuyển từ Pháp Vân hướng về Ngã Tư Vọng.'
    },
    {
      id: 'poi-bx-nuoc-ngam',
      name: 'Bến xe Nước Ngầm',
      category: 'transit_hub',
      district: 'Hoàng Mai',
      address: 'Số 1 Ngọc Hồi, Hoàng Liệt',
      cellId: 'cell-linh-dam-hoang-mai',
      accessStreet: 'Ngọc Hồi',
      secondaryStreets: ['Vành Đai 3'],
      gatePosition: 'Ngay ngã ba Pháp Vân - Giải Phóng - Vành đai 3',
      sideOfStreet: 'even_side',
      motorbikeTip: 'Đầu mối xe liên tỉnh miền Trung/Nam, nằm sát ngã 3 Pháp Vân.'
    },
    {
      id: 'poi-bx-yen-nghia',
      name: 'Bến xe Yên Nghĩa',
      category: 'transit_hub',
      district: 'Hà Đông',
      address: 'Quốc lộ 6, Phú Lãm, Hà Đông',
      cellId: 'cell-ha-dong-trung-tam',
      accessStreet: 'Quang Trung kéo dài',
      gatePosition: 'Điểm cuối tuyến đường sắt Cát Linh - Hà Đông',
      sideOfStreet: 'odd_side',
      motorbikeTip: 'Cửa ngõ cực Tây Nam, đi thẳng hết đường Quang Trung qua Ba La.'
    },
    {
      id: 'poi-bv-bach-mai',
      name: 'Bệnh viện Bạch Mai',
      category: 'hospital',
      district: 'Hai Bà Trưng',
      address: 'Số 78 Đường Giải Phóng, Phương Mai',
      cellId: 'cell-bach-kinh-xay',
      accessStreet: 'Giải Phóng',
      secondaryStreets: ['Phương Mai'],
      gatePosition: 'Cổng 1 mặt đường Giải Phóng, Cổng sau phố Phương Mai',
      sideOfStreet: 'even_side',
      motorbikeTip: 'Đi xe máy nên vào cổng Phương Mai nếu đường Giải Phóng bị ùn tắc trước cầu vượt Ngã Tư Vọng.'
    },
    {
      id: 'poi-bv-viet-duc',
      name: 'Bệnh viện Hữu nghị Việt Đức',
      category: 'hospital',
      district: 'Hoàn Kiếm',
      address: 'Số 40 Tràng Thi, Hàng Bông',
      cellId: 'cell-pho-co-hoan-kiem',
      accessStreet: 'Tràng Thi',
      secondaryStreets: ['Phủ Doãn', 'Quán Sứ'],
      gatePosition: 'Cổng cấp cứu tại phố Phủ Doãn, cổng chính Tràng Thi',
      sideOfStreet: 'even_side',
      motorbikeTip: 'Phố Phủ Doãn là phố nhỏ 1 chiều với ô tô, xe máy đi lại thuận tiện hơn từ phía Hàng Bông sang.'
    },
    {
      id: 'poi-bv-103',
      name: 'Bệnh viện Quân y 103',
      category: 'hospital',
      district: 'Hà Đông',
      address: 'Số 261 Phùng Hưng, Phúc La, Hà Đông',
      cellId: 'cell-ha-dong-trung-tam',
      accessStreet: 'Phùng Hưng (Hà Đông)',
      gatePosition: 'Mặt đường Phùng Hưng',
      sideOfStreet: 'odd_side',
      motorbikeTip: 'Nằm trên trục Phùng Hưng nối từ Cầu Trắng sang khu đô thị Xa La và viện K Tân Triều.'
    },
    {
      id: 'poi-dh-bach-khoa',
      name: 'Đại học Bách Khoa Hà Nội',
      category: 'university',
      district: 'Hai Bà Trưng',
      address: 'Số 1 Đại Cồ Việt',
      cellId: 'cell-bach-kinh-xay',
      accessStreet: 'Đại Cồ Việt',
      secondaryStreets: ['Trần Đại Nghĩa', 'Tạ Quang Bửu', 'Giải Phóng'],
      gatePosition: 'Cổng Parabol đường Giải Phóng, cổng chính đường Đại Cồ Việt, cổng Trần Đại Nghĩa',
      sideOfStreet: 'even_side',
      motorbikeTip: 'Cổng Trần Đại Nghĩa và Tạ Quang Bửu thông thoáng nhất để gửi xe máy.'
    },
    {
      id: 'poi-dh-quoc-gia',
      name: 'Đại học Quốc gia Hà Nội (Cơ sở Cầu Giấy)',
      category: 'university',
      district: 'Cầu Giấy',
      address: 'Số 144 Xuân Thủy, Dịch Vọng Hậu',
      cellId: 'cell-my-dinh-nam-tu-liem',
      accessStreet: 'Xuân Thủy',
      secondaryStreets: ['Phạm Văn Đồng'],
      gatePosition: 'Cổng chính mặt đường Xuân Thủy (đối diện ĐH Sư Phạm)',
      sideOfStreet: 'even_side',
      motorbikeTip: 'Cách ngã tư Mai Dịch 200m về phía Cầu Giấy, ga Metro số 3 nằm ngay trước cổng trường.'
    },
    {
      id: 'poi-dh-kien-truc',
      name: 'Đại học Kiến Trúc Hà Nội',
      category: 'university',
      district: 'Hà Đông',
      address: 'Km 10 Đường Nguyễn Trãi - Trần Phú, Văn Quán',
      cellId: 'cell-ha-dong-trung-tam',
      accessStreet: 'Trần Phú (Hà Đông)',
      gatePosition: 'Cạnh hồ Văn Quán, mặt tiền đường Trần Phú',
      sideOfStreet: 'even_side',
      motorbikeTip: 'Nằm ngay chân ga Metro Văn Quán trên cao.'
    },
    {
      id: 'poi-aeon-long-bien',
      name: 'Aeon Mall Long Biên',
      category: 'commercial_mall',
      district: 'Long Biên',
      address: 'Số 27 Đường Cổ Linh, Long Biên',
      cellId: 'cell-long-bien-co-linh',
      accessStreet: 'Cổ Linh',
      gatePosition: 'Nút giao chân cầu Vĩnh Tuy bờ Bắc',
      sideOfStreet: 'island',
      motorbikeTip: 'Đi từ nội thành qua Cầu Vĩnh Tuy, rẽ ngay lối nhánh xuống Cổ Linh là vào bãi xe máy miễn phí tầng trệt.'
    },
    {
      id: 'poi-aeon-ha-dong',
      name: 'Aeon Mall Hà Đông',
      category: 'commercial_mall',
      district: 'Hà Đông',
      address: 'Khu đô thị Dương Nội, Hà Đông',
      cellId: 'cell-ha-dong-trung-tam',
      accessStreet: 'Đường Ngô Thì Nhậm kéo dài / Tố Hữu',
      gatePosition: 'Khu đô thị Dương Nội',
      sideOfStreet: 'island',
      motorbikeTip: 'Đi theo trục Tố Hữu qua ngã tư Vạn Phúc rồi rẽ vào trục nhánh KĐT Dương Nội.'
    },
    {
      id: 'poi-royal-city',
      name: 'Vinhomes Royal City',
      category: 'commercial_mall',
      district: 'Thanh Xuân',
      address: 'Số 72A Nguyễn Trãi, Thượng Đình',
      cellId: 'cell-thanh-cong',
      accessStreet: 'Nguyễn Trãi',
      gatePosition: 'Cổng Khải Hoàn Môn mặt đường Nguyễn Trãi',
      sideOfStreet: 'even_side',
      motorbikeTip: 'Cách Ngã Tư Sở 300m về phía Hà Đông. Lối hầm gửi xe máy B2 rất rộng.'
    },
    {
      id: 'poi-lotte-mall-tay-ho',
      name: 'Lotte Mall West Lake Tây Hồ',
      category: 'commercial_mall',
      district: 'Tây Hồ',
      address: 'Số 272 Võ Chí Công, Phú Thượng',
      cellId: 'cell-thanh-cong',
      accessStreet: 'Võ Chí Công',
      secondaryStreets: ['Lạc Long Quân'],
      gatePosition: 'Mặt đường Võ Chí Công (chiều hướng lên cầu Nhật Tân)',
      sideOfStreet: 'even_side',
      motorbikeTip: 'Nằm bên tay phải trục Võ Chí Công khi đi từ Bưởi lên cầu Nhật Tân.'
    }
  ]
};
