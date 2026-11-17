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
exports.VocalStudioController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const vocal_studio_service_1 = require("./vocal-studio.service");
let VocalStudioController = class VocalStudioController {
    vocalStudioService;
    constructor(vocalStudioService) {
        this.vocalStudioService = vocalStudioService;
    }
    async alignLyrics(payload, userApiKey) {
        return this.vocalStudioService.alignLyricsWithGemini(payload, userApiKey);
    }
};
exports.VocalStudioController = VocalStudioController;
__decorate([
    (0, common_1.Post)('align-lyrics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Phiên âm và khớp lời từng chữ theo thời gian thực từ đoạn âm thanh vocal bằng Gemini Audio API',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-gemini-api-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VocalStudioController.prototype, "alignLyrics", null);
exports.VocalStudioController = VocalStudioController = __decorate([
    (0, swagger_1.ApiTags)('vocal-studio'),
    (0, common_1.Controller)('api/vocal-studio'),
    __metadata("design:paramtypes", [vocal_studio_service_1.VocalStudioService])
], VocalStudioController);
//# sourceMappingURL=vocal-studio.controller.js.map