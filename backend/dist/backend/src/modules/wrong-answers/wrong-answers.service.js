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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WrongAnswersService = void 0;
const common_1 = require("@nestjs/common");
const data_store_service_1 = require("../../database/data-store.service");
let WrongAnswersService = class WrongAnswersService {
    dataStore;
    constructor(dataStore) {
        this.dataStore = dataStore;
    }
    recordWrongAnswers(answers, targetUserId) {
        return this.dataStore.saveWrongAnswers(answers, targetUserId);
    }
    getWrongAnswers(params) {
        return this.dataStore.getWrongAnswers(params);
    }
    updateReview(id, quality) {
        return this.dataStore.updateWrongAnswerReview(id, quality);
    }
    getConfusionStats(exerciseSlug) {
        return this.dataStore.getConfusionPairStats(exerciseSlug);
    }
    clearWrongAnswers(exerciseSlug) {
        return this.dataStore.clearWrongAnswers(exerciseSlug);
    }
};
exports.WrongAnswersService = WrongAnswersService;
exports.WrongAnswersService = WrongAnswersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [data_store_service_1.DataStoreService])
], WrongAnswersService);
//# sourceMappingURL=wrong-answers.service.js.map