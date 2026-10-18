/**
 * MÔ HÌNH ĐỒ THỊ NHẬN THỨC MẠNG ĐƯỜNG HÀ NỘI (HANOI COGNITIVE GRAPH)
 * Phục vụ định vị không gian: "Biết mình ở đâu - Đi được đến bất cứ đâu"
 * Bao phủ: Lõi nội đô, Vành đai 1-2-2.5-3, Cầu sông Hồng, Hà Đông, Long Biên, Nam/Bắc Từ Liêm, Hoàng Mai
 */
export type HanoiNodeType = 'major_intersection' | 'roundabout' | 'grade_separated' | 'bridge_landing' | 'city_gate' | 'expressway_ramp';
export interface IHanoiNode {
    id: string;
    name: string;
    folkName?: string;
    district: string;
    coords: {
        lat: number;
        lng: number;
    };
    nodeType: HanoiNodeType;
    connectedStreets: string[];
    hasOverpass?: boolean;
    hasUnderpass?: boolean;
    notes?: string;
}
export type StreetClassification = 'expressway' | 'ring_road' | 'radial' | 'primary' | 'secondary' | 'bridge';
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
    name: string;
    tier: 'ring' | 'radial' | 'arterial' | 'suburban';
    orientation: CorridorOrientation;
    streetSequence: string[];
    keyNodesSequence: string[];
    districts: string[];
    description: string;
    cognitiveRule: string;
    crossStreetsInOrder: Array<{
        nodeName: string;
        intersectingStreets: string[];
    }>;
}
export type RingZone = 'ring_1_core' | 'ring_1_to_2' | 'ring_2_to_3' | 'outer_ring_3' | 'across_red_river';
export interface IHanoiCell {
    id: string;
    name: string;
    folkNeighborhood: string;
    district: string;
    ringZone: RingZone;
    boundingStreets: string[];
    primaryExits: string[];
    keyLandmarksInside: string[];
    cognitiveStrategy: string;
}
export type DestinationCategory = 'transit_hub' | 'hospital' | 'university' | 'commercial_mall' | 'urban_residential' | 'government_culture';
export interface IHanoiDestination {
    id: string;
    name: string;
    category: DestinationCategory;
    district: string;
    address: string;
    cellId: string;
    accessStreet: string;
    secondaryStreets?: string[];
    gatePosition: string;
    sideOfStreet: 'even_side' | 'odd_side' | 'island' | 'corner';
    motorbikeTip: string;
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
export type PracticalGameMode = 'corridor_chain' | 'cross_street_order' | 'which_intersection' | 'superblock_cell' | 'address_decoder' | 'route_planner_ab' | 'oneway_turn_trap' | 'personal_anchor_drill' | 'gps_loss_recovery';
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
//# sourceMappingURL=hanoi-graph.types.d.ts.map