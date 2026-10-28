"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultExerciseMode = createDefaultExerciseMode;
const genericDefaultSchema = {
    version: 1,
    fields: []
};
function createDefaultExerciseMode(slug) {
    return {
        id: `${slug}.standard`,
        exerciseSlug: slug,
        labelVi: 'Chế Độ Tùy Chỉnh Tiêu Chuẩn',
        descriptionVi: 'Tùy chỉnh số lượt vòng tập và thời gian giới hạn theo nhu cầu cá nhân',
        status: 'stable',
        schema: genericDefaultSchema
    };
}
//# sourceMappingURL=default.js.map