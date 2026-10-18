/**
 * MÔ HÌNH ĐỒ THỊ NHẬN THỨC MẠNG ĐƯỜNG HÀ NỘI (HANOI COGNITIVE GRAPH)
 * Phục vụ định vị không gian: "Biết mình ở đâu - Đi được đến bất cứ đâu"
 * Bao phủ: Lõi nội đô, Vành đai 1-2-2.5-3, Cầu sông Hồng, Hà Đông, Long Biên, Nam/Bắc Từ Liêm, Hoàng Mai
 */

export type HanoiNodeType = 
  | 'major_intersection'    // Ngã 4/5/6 lớn
  | 'roundabout'            // Vòng xuyến/bùng binh
  | 'grade_separated'       // Nút giao khác mức (cầu vượt, hầm chui)
  | 'bridge_landing'        // Đầu cầu vượt sông
  | 'city_gate'             // Cửa ô lịch sử (Ô Chợ Dừa, Ô Cầu Giấy, Ô Quan Chưởng...)
  | 'expressway_ramp';      // Lối lên/xuống đường trên cao

export interface IHanoiNode {
  id: string;
  name: string;
  folkName?: string;        // Tên dân gian (Ngã Tư Sở, Ngã Tư Vọng, Ngã 5 Cửa Nam...)
  district: string;
  coords: { lat: number; lng: number };
  nodeType: HanoiNodeType;
  connectedStreets: string[];
  hasOverpass?: boolean;     // Có cầu vượt
  hasUnderpass?: boolean;    // Có hầm chui
  notes?: string;
}

export type StreetClassification = 
  | 'expressway'    // Cao tốc / đường trên cao (Đại lộ Thăng Long, VĐ3 trên cao, VĐ2 trên cao)
  | 'ring_road'     // Trục vành đai (VĐ 1, 2, 2.5, 3)
  | 'radial'        // Trục hướng tâm (Nguyễn Trãi, Giải Phóng, Giảng Võ - Lê Văn Lương, Cầu Giấy...)
  | 'primary'       // Trục chính đô thị (Thái Hà, Chùa Bộc, Hoàng Hoa Thám, Kim Mã...)
  | 'secondary'     // Phố nhánh gom giao thông (Đặng Văn Ngữ, Vũ Trọng Phụng, Nguyễn Khang...)
  | 'bridge';       // Cầu vượt sông lớn

export interface IHanoiSegment {
  id: string;
  streetName: string;
  fromNodeId: string;
  toNodeId: string;
  corridorId?: string;
  district: string;
  lengthMeters: number;
  isOneWayMotorbike: boolean;
  isOneWayCar: boolean;
  carForbiddenRushHour?: boolean;
  classification: StreetClassification;
  speedLimitKmh?: number;
}

export type CorridorOrientation = 'NORTH_SOUTH' | 'EAST_WEST' | 'RADIAL_DIAGONAL' | 'RING_LOOP';

export interface IHanoiCorridor {
  id: string;
  name: string;                      // Ví dụ: "Trục Nguyễn Trãi - Trần Phú - Quang Trung"
  tier: 'ring' | 'radial' | 'arterial' | 'suburban';
  orientation: CorridorOrientation;
  streetSequence: string[];          // Thứ tự tên các đoạn nối tiếp nhau thẳng trục
  keyNodesSequence: string[];        // Chuỗi các nút giao chính lần lượt đi qua
  districts: string[];
  description: string;
  cognitiveRule: string;             // Quy tắc ghi nhớ cốt lõi
  crossStreetsInOrder: Array<{
    nodeName: string;
    intersectingStreets: string[];
  }>;
}

export type RingZone = 
  | 'ring_1_core'          // Vùng lõi (Phố Cổ, Ba Đình, Hoàn Kiếm, trong VĐ1)
  | 'ring_1_to_2'          // Vùng chuyển tiếp VĐ1 - VĐ2 (Đống Đa, Hai Bà Trưng)
  | 'ring_2_to_3'          // Vùng đô thị mở rộng (Cầu Giấy, Thanh Xuân, Tây Hồ)
  | 'outer_ring_3'         // Vùng ngoại VĐ3 (Hà Đông, Nam/Bắc Từ Liêm, Hoàng Mai, Long Biên)
  | 'across_red_river';    // Bờ Bắc/Đông sông Hồng (Long Biên, Gia Lâm)

export interface IHanoiCell {
  id: string;
  name: string;                      // Ví dụ: "Ô Láng - Nguyễn Chí Thanh - Láng Hạ - Thái Hà"
  folkNeighborhood: string;          // Ví dụ: "Khu Thành Công / Trung Hòa Nhân Chính / Làng Cổ..."
  district: string;
  ringZone: RingZone;
  boundingStreets: string[];         // 3 đến 5 trục đường bao quanh tạo thành khối ô
  primaryExits: string[];            // Các lối thoát ra trục chính khi đi từ trong ngõ ra
  keyLandmarksInside: string[];      // Các điểm mốc bên trong ô phố
  cognitiveStrategy: string;         // Cách thoát ra khi bị lạc trong ô này
}

export type DestinationCategory = 
  | 'transit_hub'          // Bến xe (Mỹ Đình, Giáp Bát, Gia Lâm, Nước Ngầm, Yên Nghĩa), Ga Hà Nội, Nội Bài
  | 'hospital'             // Bạch Mai, Việt Đức, 108, Nhi TW, Phụ Sản, E, 103 Hà Đông...
  | 'university'           // Bách Khoa, KTQD, ĐHQG, Ngoại thương, Học viện An ninh, Kiến trúc...
  | 'commercial_mall'      // Aeon Mall Long Biên/Hà Đông, Vincom Bà Triệu/Mega Mall, Lotte Mall Tây Hồ/Liễu Giai
  | 'urban_residential'    // Times City, Royal City, Ciputra, Linh Đàm, Vinhomes Smart City, Ocean Park
  | 'government_culture';  // Lăng Bác, Trung tâm Hội nghị QG, Sân Mỹ Đình, Nhà hát Lớn

export interface IHanoiDestination {
  id: string;
  name: string;
  category: DestinationCategory;
  district: string;
  address: string;
  cellId: string;                    // Nằm trong ô phố nào
  accessStreet: string;              // Phố tiếp cận chính
  secondaryStreets?: string[];       // Các phố tiếp cận phụ
  gatePosition: string;              // Vị trí cổng (ví dụ: "Cổng Giải Phóng", "Cổng Phương Mai")
  sideOfStreet: 'even_side' | 'odd_side' | 'island' | 'corner';
  motorbikeTip: string;              // Mẹo tiếp cận cho xe máy (tránh quay đầu xa, ngõ thông)
}

export interface IPersonalAnchor {
  id: string;
  label: 'home' | 'workplace' | 'school' | 'frequent_spot' | 'custom';
  customTitle: string;
  district: string;
  nearestStreet: string;
  nearestIntersection: string;
  nearestCellId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PracticalGameMode = 
  | 'corridor_chain'          // Mode A: Chuỗi trục "Một đường nhiều tên"
  | 'cross_street_order'      // Mode B: Thứ tự giao cắt dọc tuyến
  | 'which_intersection'      // Mode C: Tôi ở ngã tư nào? (Định vị từ 2 tên phố)
  | 'superblock_cell'         // Mode D: Tư duy Ô phố & Lối thoát ra trục
  | 'address_decoder'         // Mode E: Giải mã địa chỉ & Ngõ ngách
  | 'route_planner_ab'        // Mode F: Lập tuyến tối ưu A -> B
  | 'oneway_turn_trap'        // Mode G: Bẫy một chiều & Cấm rẽ xe máy/ô tô
  | 'personal_anchor_drill'   // Mode H: Luyện tuyến xoay quanh Đích của tôi
  | 'gps_loss_recovery';      // Mode I: Mất GPS - Phục hồi vị trí tức thì

export interface IHanoiQuestion {
  id: string;
  mode: PracticalGameMode;
  level: number;
  title: string;
  prompt: string;
  subPrompt?: string;
  contextClues?: {
    district?: string;
    corridorName?: string;
    intersectionName?: string;
    headingDirection?: string;
    vehicleType?: 'motorbike' | 'car';
    addressString?: string;
    origin?: string;
    destination?: string;
    knownLandmark?: string;
    sunAzimuthDesc?: string;
  };
  options: Array<{
    id: string;
    text: string;
    subText?: string;
    isCorrect: boolean;
    explanation: string;
  }>;
  hint?: string;
  cognitiveLesson: string;
}

export interface IHanoiGraphData {
  nodes: IHanoiNode[];
  segments: IHanoiSegment[];
  corridors: IHanoiCorridor[];
  cells: IHanoiCell[];
  destinations: IHanoiDestination[];
  metadata: {
    version: string;
    lastVerified: string;
    license: string;
    totalDistricts: number;
    districtsCovered: string[];
  };
}
