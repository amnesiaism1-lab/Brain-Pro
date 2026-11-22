export interface IHanoiEntity {
    id: string;
    name: string;
    alias?: string;
    type: 'river' | 'lake' | 'ring' | 'radial' | 'bridge' | 'landmark' | 'french_street' | 'junction' | 'old_quarter_street' | 'metro_line';
    category: 'edge' | 'path' | 'landmark' | 'node' | 'district';
    district: string;
    coords: {
        lat: number;
        lng: number;
    };
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
export type RelationType = 'parallel' | 'perpendicular' | 'collinear_continuation' | 'ordered_along' | 'containment' | 'paired_oneway' | 'crosses_at';
export interface IHanoiRelation {
    id: string;
    type: RelationType;
    entityAId: string;
    entityBId: string;
    description: string;
    explanation: string;
    cognitiveKey: string;
}
export declare const HANOI_WATER_EDGES: IHanoiEntity[];
export declare const HANOI_BRIDGES: IHanoiEntity[];
export declare const HANOI_BRIDGES_NORTH_TO_SOUTH: string[];
export declare const HANOI_RING_ROADS: IHanoiEntity[];
export declare const HANOI_RING_1_SEQUENCE: string[];
export declare const HANOI_RING_2_SEQUENCE: string[];
export declare const HANOI_RING_3_SEQUENCE: string[];
export declare const HANOI_RADIAL_CORRIDORS: Array<{
    id: string;
    name: string;
    clockPosition: string;
    direction: 'South-West' | 'South' | 'West-North' | 'West' | 'West-South-BRT' | 'North-East' | 'North-Airport' | 'East-HaiPhong' | 'North-West-Ring3';
    bearingDeg: number;
    segments: string[];
    description: string;
    cognitiveTip: string;
}>;
export declare const HANOI_FRENCH_GRID_STREETS: IHanoiEntity[];
export declare const HANOI_LANDMARKS: IHanoiEntity[];
export declare const HANOI_JUNCTIONS: IHanoiEntity[];
export declare const ALL_HANOI_ENTITIES: IHanoiEntity[];
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
export declare const HANOI_CLOCK_RADIALS: IHanoiClockSpoke[];
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
export declare const HANOI_RING_DETAILS: IHanoiRingDetail[];
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
export declare const HANOI_BRIDGE_MATRIX: IHanoiBridgeMatrixRow[];
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
export declare const HANOI_ADMIN_CLUSTERS: IHanoiAdminCluster[];
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
export declare const HANOI_TRANSIT_LINES: IHanoiTransitLine[];
export declare function getHanoiSolarAzimuth(hour: number): number;
export declare function getHanoiShadowBearing(hour: number): number;
export declare function bearingToCardinalName(bearing: number): string;
export declare const HANOI_RELATIONS: IHanoiRelation[];
export * from './hanoiCurriculumData';
