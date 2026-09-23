export type RelationId = 'TARGET_POSITION' | 'ORDER_SEQUENCE' | 'IDENTITY_MATCH' | 'SIMILARITY_DIFF' | 'TARGET_DISTRACTOR' | 'RULE_ACTION' | 'INHIBITION' | 'PART_WHOLE' | 'FOCUS_FIELD' | 'SPATIAL_TRANSFORM' | 'TEMPORAL_PREDICT' | 'CONTEXT_MEANING';
export interface ICognitiveRelationDef {
    id: RelationId;
    nameVi: string;
    nameEn: string;
    definition: string;
    representativeGames: string[];
    iconName: string;
    descriptionVi: string;
}
export declare const COGNITIVE_RELATIONS: Record<RelationId, ICognitiveRelationDef>;
export declare const ALL_RELATION_IDS: RelationId[];
