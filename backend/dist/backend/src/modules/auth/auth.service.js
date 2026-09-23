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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const data_store_service_1 = require("../../database/data-store.service");
let AuthService = class AuthService {
    dataStore;
    jwtService;
    googleClientId = process.env.GOOGLE_CLIENT_ID || '28140765256-fv97mp8c2f0u3pd030r5t8hmbathmjtf.apps.googleusercontent.com';
    constructor(dataStore, jwtService) {
        this.dataStore = dataStore;
        this.jwtService = jwtService;
    }
    async verifyGoogleToken(tokenOrCredential, isAccessToken = false) {
        try {
            if (isAccessToken) {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenOrCredential}` }
                });
                if (!res.ok) {
                    throw new common_1.UnauthorizedException('Token truy cập Google không hợp lệ hoặc đã hết hạn.');
                }
                const data = await res.json();
                return {
                    sub: data.sub,
                    email: data.email,
                    email_verified: data.email_verified,
                    name: data.name || data.email?.split('@')[0],
                    picture: data.picture
                };
            }
            else {
                const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenOrCredential)}`);
                if (!res.ok) {
                    throw new common_1.UnauthorizedException('Chứng chỉ Google ID Token không hợp lệ.');
                }
                const data = await res.json();
                if (data.error || data.error_description) {
                    throw new common_1.UnauthorizedException(data.error_description || 'Xác thực Google thất bại.');
                }
                return {
                    sub: data.sub,
                    email: data.email,
                    email_verified: data.email_verified,
                    name: data.name || data.email?.split('@')[0],
                    picture: data.picture,
                    aud: data.aud
                };
            }
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException)
                throw err;
            throw new common_1.UnauthorizedException(`Không thể kết nối đến máy chủ Google: ${err.message}`);
        }
    }
    async loginWithGoogle(dto) {
        const token = dto.credential || dto.accessToken;
        if (!token) {
            throw new common_1.BadRequestException('Vui lòng cung cấp mã chứng thực Google (credential hoặc accessToken).');
        }
        const isAccessToken = !dto.credential && Boolean(dto.accessToken);
        const googleUser = await this.verifyGoogleToken(token, isAccessToken);
        if (!googleUser.email) {
            throw new common_1.BadRequestException('Tài khoản Google không cung cấp địa chỉ email.');
        }
        const dbUser = await this.dataStore.findOrCreateGoogleUser({
            googleId: googleUser.sub,
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: googleUser.picture,
            guestXp: dto.guestTelemetry?.xp || 0,
            guestLevel: dto.guestTelemetry?.level || 1,
            guestStreak: dto.guestTelemetry?.streak || 0
        });
        const jwtPayload = {
            sub: dbUser.id,
            email: dbUser.email,
            username: dbUser.username,
            avatarUrl: dbUser.avatar_url
        };
        const sessionToken = this.jwtService.sign(jwtPayload);
        return {
            token: sessionToken,
            user: {
                id: dbUser.id,
                email: dbUser.email,
                username: dbUser.username,
                avatarUrl: dbUser.avatar_url,
                totalXp: dbUser.total_xp || 0,
                currentLevel: dbUser.current_level || 1,
                currentStreak: dbUser.current_streak || 0,
                bestStreak: dbUser.best_streak || dbUser.current_streak || 0,
                authProvider: 'google',
                createdAt: dbUser.created_at
            },
            message: `Chào mừng ${dbUser.username} quay trở lại Brain Pro!`
        };
    }
    async validateToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            const user = await this.dataStore.getUserById(payload.sub);
            return {
                id: user.id,
                email: user.email,
                username: user.username,
                avatarUrl: user.avatar_url,
                totalXp: user.total_xp || user.totalXp || 0,
                currentLevel: user.current_level || user.currentLevel || 1,
                currentStreak: user.current_streak || user.currentStreak || 0,
                bestStreak: user.best_streak || user.bestStreak || 0,
                authProvider: user.auth_provider || 'google',
                createdAt: user.created_at
            };
        }
        catch {
            throw new common_1.UnauthorizedException('Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
        }
    }
    async syncTelemetry(userId, data) {
        const updated = await this.dataStore.syncUserProfile(userId, data);
        return {
            id: updated.id,
            totalXp: updated.total_xp || 0,
            currentLevel: updated.current_level || 1,
            currentStreak: updated.current_streak || 0,
            bestStreak: updated.best_streak || 0
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [data_store_service_1.DataStoreService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map