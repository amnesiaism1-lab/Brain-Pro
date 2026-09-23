import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataStoreService } from '../../database/data-store.service';

export interface GooglePayload {
  sub: string;
  email: string;
  email_verified: string | boolean;
  name: string;
  picture?: string;
  aud?: string;
}

@Injectable()
export class AuthService {
  private readonly googleClientId = process.env.GOOGLE_CLIENT_ID || '28140765256-fv97mp8c2f0u3pd030r5t8hmbathmjtf.apps.googleusercontent.com';

  constructor(
    private readonly dataStore: DataStoreService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Verify Google Credential (ID Token) or Access Token
   */
  async verifyGoogleToken(tokenOrCredential: string, isAccessToken = false): Promise<GooglePayload> {
    try {
      if (isAccessToken) {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenOrCredential}` }
        });
        if (!res.ok) {
          throw new UnauthorizedException('Token truy cập Google không hợp lệ hoặc đã hết hạn.');
        }
        const data = await res.json();
        return {
          sub: data.sub,
          email: data.email,
          email_verified: data.email_verified,
          name: data.name || data.email?.split('@')[0],
          picture: data.picture
        };
      } else {
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenOrCredential)}`);
        if (!res.ok) {
          throw new UnauthorizedException('Chứng chỉ Google ID Token không hợp lệ.');
        }
        const data = await res.json();
        if (data.error || data.error_description) {
          throw new UnauthorizedException(data.error_description || 'Xác thực Google thất bại.');
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
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException(`Không thể kết nối đến máy chủ Google: ${err.message}`);
    }
  }

  /**
   * Authenticate or register with Google and merge guest telemetry
   */
  async loginWithGoogle(dto: {
    credential?: string;
    accessToken?: string;
    guestTelemetry?: {
      xp?: number;
      level?: number;
      streak?: number;
      bestStreak?: number;
    };
  }) {
    const token = dto.credential || dto.accessToken;
    if (!token) {
      throw new BadRequestException('Vui lòng cung cấp mã chứng thực Google (credential hoặc accessToken).');
    }

    const isAccessToken = !dto.credential && Boolean(dto.accessToken);
    const googleUser = await this.verifyGoogleToken(token, isAccessToken);

    if (!googleUser.email) {
      throw new BadRequestException('Tài khoản Google không cung cấp địa chỉ email.');
    }

    // Persist or merge into Supabase
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

  /**
   * Validate session JWT & fetch user
   */
  async validateToken(token: string) {
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
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
    }
  }

  /**
   * Sync telemetry between frontend and Supabase
   */
  async syncTelemetry(userId: string, data: { xp: number; level: number; streak: number; bestStreak?: number }) {
    const updated = await this.dataStore.syncUserProfile(userId, data);
    return {
      id: updated.id,
      totalXp: updated.total_xp || 0,
      currentLevel: updated.current_level || 1,
      currentStreak: updated.current_streak || 0,
      bestStreak: updated.best_streak || 0
    };
  }
}
