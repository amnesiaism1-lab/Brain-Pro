import { Controller, Get, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DataStoreService } from '../../database/data-store.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly dataStore: DataStoreService
  ) {}

  /**
   * Google OAuth Sign-in & Sign-up unified endpoint
   */
  @Post('google')
  async loginWithGoogle(
    @Body() body: {
      credential?: string;
      accessToken?: string;
      guestTelemetry?: {
        xp?: number;
        level?: number;
        streak?: number;
        bestStreak?: number;
      };
    }
  ) {
    const result = await this.authService.loginWithGoogle(body);
    return {
      success: true,
      data: result
    };
  }

  /**
   * Get currently authenticated user profile
   */
  @Get('me')
  async getCurrentUser(@Headers('authorization') authHeader?: string) {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const user = await this.authService.validateToken(token);
        return {
          success: true,
          data: user
        };
      } catch {
        // Fallback to guest user
      }
    }

    return {
      success: true,
      data: this.dataStore.getCurrentUser()
    };
  }

  /**
   * Sync telemetry with Supabase
   */
  @Post('sync')
  async syncTelemetry(
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: { xp: number; level: number; streak: number; bestStreak?: number }
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Yêu cầu đăng nhập để đồng bộ dữ liệu đám mây.');
    }
    const token = authHeader.substring(7);
    const user = await this.authService.validateToken(token);
    const updated = await this.authService.syncTelemetry(user.id, body);
    return {
      success: true,
      data: updated
    };
  }

  /**
   * Fallback email/password login
   */
  @Post('login')
  login(@Body() body: { email: string }) {
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

  /**
   * Fallback register
   */
  @Post('register')
  register(@Body() body: { email: string; username: string }) {
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

  /**
   * Logout
   */
  @Post('logout')
  logout() {
    return {
      success: true,
      message: 'Đăng xuất thành công.'
    };
  }
}
