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
exports.WrongAnswersController = void 0;
const common_1 = require("@nestjs/common");
const wrong_answers_service_1 = require("./wrong-answers.service");
const auth_service_1 = require("../auth/auth.service");
let WrongAnswersController = class WrongAnswersController {
    wrongAnswersService;
    authService;
    constructor(wrongAnswersService, authService) {
        this.wrongAnswersService = wrongAnswersService;
        this.authService = authService;
    }
    async recordWrongAnswers(body, authHeader) {
        let targetUserId;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const user = await this.authService.validateToken(authHeader.substring(7));
                targetUserId = user?.id;
            }
            catch {
            }
        }
        const answers = Array.isArray(body) ? body : [body];
        const saved = this.wrongAnswersService.recordWrongAnswers(answers, targetUserId);
        return {
            success: true,
            data: saved
        };
    }
    getWrongAnswers(exerciseSlug, severity, reviewStatus, limit, offset) {
        const result = this.wrongAnswersService.getWrongAnswers({
            exerciseSlug,
            severity,
            reviewStatus,
            limit: limit ? parseInt(limit, 10) : 50,
            offset: offset ? parseInt(offset, 10) : 0
        });
        return {
            success: true,
            data: result.items,
            total: result.total
        };
    }
    getConfusionStats(exerciseSlug) {
        const stats = this.wrongAnswersService.getConfusionStats(exerciseSlug);
        return {
            success: true,
            data: stats
        };
    }
    updateReview(id, body) {
        const quality = typeof body.quality === 'number' ? body.quality : 3;
        const updated = this.wrongAnswersService.updateReview(id, quality);
        return {
            success: Boolean(updated),
            data: updated
        };
    }
    clearWrongAnswers(exerciseSlug) {
        const result = this.wrongAnswersService.clearWrongAnswers(exerciseSlug);
        return {
            success: true,
            data: result
        };
    }
};
exports.WrongAnswersController = WrongAnswersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WrongAnswersController.prototype, "recordWrongAnswers", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('exerciseSlug')),
    __param(1, (0, common_1.Query)('severity')),
    __param(2, (0, common_1.Query)('reviewStatus')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], WrongAnswersController.prototype, "getWrongAnswers", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)('exerciseSlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WrongAnswersController.prototype, "getConfusionStats", null);
__decorate([
    (0, common_1.Patch)(':id/review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WrongAnswersController.prototype, "updateReview", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Query)('exerciseSlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WrongAnswersController.prototype, "clearWrongAnswers", null);
exports.WrongAnswersController = WrongAnswersController = __decorate([
    (0, common_1.Controller)('wrong-answers'),
    __metadata("design:paramtypes", [wrong_answers_service_1.WrongAnswersService,
        auth_service_1.AuthService])
], WrongAnswersController);
//# sourceMappingURL=wrong-answers.controller.js.map