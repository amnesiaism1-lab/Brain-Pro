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
exports.ReadingAssessmentController = void 0;
const common_1 = require("@nestjs/common");
const data_store_service_1 = require("../../database/data-store.service");
let ReadingAssessmentController = class ReadingAssessmentController {
    dataStore;
    constructor(dataStore) {
        this.dataStore = dataStore;
    }
    getReadingTexts() {
        return {
            success: true,
            data: this.dataStore.getReadingTexts()
        };
    }
    getReadingTextById(id) {
        const text = this.dataStore.getReadingTextById(id);
        if (!text) {
            return {
                success: false,
                message: 'Reading text not found'
            };
        }
        return {
            success: true,
            data: text
        };
    }
    submitAssessment(body) {
        const result = this.dataStore.saveAssessment(body);
        return {
            success: true,
            data: result
        };
    }
};
exports.ReadingAssessmentController = ReadingAssessmentController;
__decorate([
    (0, common_1.Get)('texts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReadingAssessmentController.prototype, "getReadingTexts", null);
__decorate([
    (0, common_1.Get)('texts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReadingAssessmentController.prototype, "getReadingTextById", null);
__decorate([
    (0, common_1.Post)('submit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReadingAssessmentController.prototype, "submitAssessment", null);
exports.ReadingAssessmentController = ReadingAssessmentController = __decorate([
    (0, common_1.Controller)('reading-assessments'),
    __metadata("design:paramtypes", [data_store_service_1.DataStoreService])
], ReadingAssessmentController);
//# sourceMappingURL=reading-assessment.controller.js.map