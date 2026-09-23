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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const data_store_service_1 = require("../../database/data-store.service");
let AuthController = class AuthController {
    authService;
    dataStore;
    constructor(authService, dataStore) {
        this.authService = authService;
        this.dataStore = dataStore;
    }
    async loginWithGoogle(body) {
        const result = await this.authService.loginWithGoogle(body);
        return {
            success: true,
            data: result
        };
    }
    async getCurrentUser(authHeader) {
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const user = await this.authService.validateToken(token);
                return {
                    success: true,
                    data: user
                };
            }
            catch {
            }
        }
        return {
            success: true,
            data: this.dataStore.getCurrentUser()
        };
    }
    async syncTelemetry(authHeader, body) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Yêu cầu đăng nhập để đồng bộ dữ liệu đám mây.');
        }
        const token = authHeader.substring(7);
        const user = await this.authService.validateToken(token);
        const updated = await this.authService.syncTelemetry(user.id, body);
        return {
            success: true,
            data: updated
        };
    }
    login(body) {
        const user = this.dataStore.getCurrentUser();
        return {
            success: true,
            data: {
                token: 'token-brainexercises-' + Date.now(),
                user: {
                    ...user,
                    email: body.email || user.email
                }
            }
        };
    }
    register(body) {
        const user = this.dataStore.getCurrentUser();
        return {
            success: true,
            data: {
                token: 'token-brainexercises-' + Date.now(),
                user: {
                    ...user,
                    email: body.email || user.email,
                    username: body.username || user.username
                }
            }
        };
    }
    logout() {
        return {
            success: true,
            message: 'Đăng xuất thành công.'
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('google'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithGoogle", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "syncTelemetry", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        data_store_service_1.DataStoreService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map