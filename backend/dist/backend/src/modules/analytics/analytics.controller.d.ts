import { DataStoreService } from '../../database/data-store.service';
export declare class AnalyticsController {
    private readonly dataStore;
    constructor(dataStore: DataStoreService);
    getUserStats(): {
        success: boolean;
        data: import("@brain-exercises/shared").IUserStats;
    };
    getCognitiveRadar(): {
        success: boolean;
        data: import("@brain-exercises/shared").ICognitiveRadar;
    };
    getBrainGraph(): {
        success: boolean;
        data: {
            nodes: {
                id: import("@brain-exercises/shared").RelationId;
                nameVi: string;
                nameEn: string;
                iconName: string;
                masteryScore: number;
                tier: 1 | 3 | 2 | 4;
                exposureCount: number;
                stability: number;
                transferScore: number;
                representativeGames: string[];
            }[];
            edges: {
                source: string;
                target: string;
                relation: string;
            }[];
            overallTrainingIndex: number;
        };
    };
    recommendCognitiveChain(): {
        success: boolean;
        data: {
            bottleneckRelation: import("@brain-exercises/shared").RelationId;
            relationDef: import("@brain-exercises/shared").ICognitiveRelationDef;
            recommendedChain: import("@brain-exercises/shared").ICognitiveWorkoutChain;
        };
    };
    postRecommendCognitiveChain(): {
        success: boolean;
        data: {
            bottleneckRelation: import("@brain-exercises/shared").RelationId;
            relationDef: import("@brain-exercises/shared").ICognitiveRelationDef;
            recommendedChain: import("@brain-exercises/shared").ICognitiveWorkoutChain;
        };
    };
}
