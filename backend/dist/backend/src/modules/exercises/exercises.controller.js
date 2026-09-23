"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExercisesController = void 0;
const common_1 = require("@nestjs/common");
const data_store_service_1 = require("../../database/data-store.service");
let ExercisesController = class ExercisesController {
    dataStore;
    constructor(dataStore) {
        this.dataStore = dataStore;
    }
    getAllExercises() {
        return {
            success: true,
            data: this.dataStore.getExercises()
        };
    }
    getWordSearchVocabulary() {
        const textWords = this.dataStore.getReadingTexts().flatMap(t => t.content.split(/\s+/));
        const cleanWords = Array.from(new Set(textWords
            .map(w => w.replace(/[^a-zA-ZÀ-ỹ0-9]/g, '').toUpperCase())
            .filter(w => w.length >= 3 && w.length <= 8)));
        return {
            success: true,
            data: cleanWords
        };
    }
    getExerciseBySlug(slug) {
        const exercise = this.dataStore.getExerciseBySlug(slug);
        if (!exercise) {
            return {
                success: false,
                message: `Exercise '${slug}' not found`
            };
        }
        return {
            success: true,
            data: exercise
        };
    }
};
exports.ExercisesController = ExercisesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ExercisesController.prototype, "getAllExercises", null);
__decorate([
    (0, common_1.Get)('word-search/vocabulary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ExercisesController.prototype, "getWordSearchVocabulary", null);
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExercisesController.prototype, "getExerciseBySlug", null);
exports.ExercisesController = ExercisesController = __decorate([
    (0, common_1.Controller)('exercises'),
    __metadata("design:paramtypes", [data_store_service_1.DataStoreService])
], ExercisesController);
//# sourceMappingURL=exercises.controller.js.map