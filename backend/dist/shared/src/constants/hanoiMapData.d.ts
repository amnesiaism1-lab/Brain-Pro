export interface IHanoiEntity {
    id: string;
    name: string;
    alias?: string;
    type: 'river' | 'lake' | 'ring' | 'radial' | 'bridge' | 'landmark' | 'french_street' | 'junction' | 'old_quarter_street';
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
    ringTier?: 1 | 2 | 2.5 | 3;
    heightTier?: 'skyline' | 'local';
    connectedStreets?: string[];
    historicalEra?: 'ancient' | 'french_colonial' | 'modern';
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
    direction: 'South-West' | 'South' | 'West-North' | 'West' | 'West-South-BRT' | 'North-East' | 'North-Airport';
    bearingDeg: number;
    segments: string[];
    description: string;
    cognitiveTip: string;
}>;
export declare const HANOI_FRENCH_GRID_STREETS: IHanoiEntity[];
export declare const HANOI_LANDMARKS: IHanoiEntity[];
export declare const HANOI_JUNCTIONS: IHanoiEntity[];
export declare const ALL_HANOI_ENTITIES: IHanoiEntity[];
export declare function getHanoiSolarAzimuth(hour: number): number;
export declare function getHanoiShadowBearing(hour: number): number;
export declare function bearingToCardinalName(bearing: number): string;
export declare const HANOI_RELATIONS: IHanoiRelation[];
export interface ITheoryChapter {
    id: string;
    chapterNumber: number;
    title: string;
    subtitle: string;
    badge: string;
    iconName: string;
    readTimeMin: number;
    contentMarkdown: string;
    keyTakeaways: string[];
    cognitiveMechanism: string;
}
export declare const HANOI_THEORY_CHAPTERS: ITheoryChapter[];
