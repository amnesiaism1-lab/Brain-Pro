import { Controller, Get, Post, Body } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly dataStore: DataStoreService) {}

  @Get('me')
  getCurrentUser() {
    return {
      success: true,
      data: this.dataStore.getCurrentUser()
    };
  }

  @Post('login')
  login(@Body() body: { email: string }) {
    const user = this.dataStore.getCurrentUser();
    return {
      success: true,
      data: {
        token: 'mock-jwt-token-brainexercises-2026',
        user: {
          ...user,
          email: body.email || user.email
        }
      }
    };
  }

  @Post('register')
  register(@Body() body: { email: string; username: string }) {
    const user = this.dataStore.getCurrentUser();
    return {
      success: true,
      data: {
        token: 'mock-jwt-token-brainexercises-2026',
        user: {
          ...user,
          email: body.email || user.email,
          username: body.username || user.username
        }
      }
    };
  }
}
