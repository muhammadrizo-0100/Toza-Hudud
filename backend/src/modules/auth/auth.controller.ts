import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UnauthorizedException
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './types/jwt-payload.type';

export class LoginDto {
  username!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    if (!body?.username || !body?.password) {
      throw new UnauthorizedException('Username va password kiritilishi shart');
    }
    return this.authService.login(body.username, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: JwtPayload) {
    const profile = await this.authService.getProfile(user.id);
    return { user: profile };
  }

  @Post('logout')
  async logout() {
    return { success: true, message: 'Tizimdan muvaffaqiyatli chiqildi' };
  }
}
