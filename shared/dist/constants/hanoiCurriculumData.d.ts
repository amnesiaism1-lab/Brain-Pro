/**
 * GIÁO TRÌNH 12 CHƯƠNG CHUYÊN SÂU, NGÂN HÀNG 20 CÂU HỎI CHẨN ĐOÁN
 * VÀ 24 THẺ FLASHCARDS ÔN LUYỆN PHẢN XẠ BẢN ĐỒ HÀ NỘI
 * Thiết kế theo nguyên lý Sư phạm Không gian (Spatial Pedagogy):
 * Chunking (Miller) · Dual-Coding (Paivio) · Progressive Disclosure · Active Recall
 */
export type HanoiLearningStageId = 'stage-1-foundation' | 'stage-2-macro' | 'stage-3-micro' | 'stage-4-mastery';
export interface IHanoiLearningStage {
    id: HanoiLearningStageId;
    stageNumber: number;
    title: string;
    subtitle: string;
    goalVi: string;
    colorAccent: 'cyan' | 'amber' | 'violet' | 'emerald';
    chapterNumbers: number[];
}
export declare const HANOI_LEARNING_STAGES: IHanoiLearningStage[];
export interface ITheoryChapter {
    id: string;
    chapterNumber: number;
    stageId: HanoiLearningStageId;
    difficulty: 'Cơ bản' | 'Trung cấp' | 'Chuyên sâu';
    title: string;
    subtitle: string;
    badge: string;
    iconName: string;
    readTimeMin: number;
    recommendedPracticeMode: string;
    recommendedPracticeLabel: string;
    cognitiveMechanism: string;
    keyTakeaways: string[];
    quickCheck: {
        question: string;
        answer: string;
    };
    contentMarkdown: string;
}
export declare const HANOI_THEORY_CHAPTERS: ITheoryChapter[];
export type HanoiQuizDomain = 'hydrology_bridges' | 'rings_radials' | 'french_grid_oneway' | 'solar_skyline' | 'routing_address';
export interface IHanoiDiagnosticQuestion {
    id: string;
    domain: HanoiQuizDomain;
    domainLabelVi: string;
    difficulty: 'Cơ bản' | 'Trung cấp' | 'Thực chiến';
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    relatedChapterNumber: number;
}
export declare const HANOI_QUIZ_BANK: IHanoiDiagnosticQuestion[];
export interface IHanoiFlashcard {
    id: string;
    category: 'Cầu & Sông' | 'Vành đai & Trục' | 'Phố Pháp & 1 Chiều' | 'Ô Phố & Cổng Phụ';
    frontPrompt: string;
    frontHint: string;
    backAnswer: string;
    backMnemonic: string;
}
export declare const HANOI_FLASHCARDS: IHanoiFlashcard[];
//# sourceMappingURL=hanoiCurriculumData.d.ts.map