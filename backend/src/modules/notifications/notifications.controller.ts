import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: JwtPayload,
    @Query('limit') limit?: string
  ) {
    const parsedLimit = limit ? Math.max(1, Number(limit) || 30) : 30;
    return this.notificationsService.getUserNotifications(user, parsedLimit);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    await this.notificationsService.markAllAsRead(user);
    return { success: true };
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string
  ) {
    const numericId = Number(id);
    if (!numericId || !Number.isFinite(numericId)) {
      return { success: false };
    }
    await this.notificationsService.markAsRead(String(numericId), user);
    return { success: true };
  }

  @Delete('clear')
  async clearNotifications(@CurrentUser() user: JwtPayload) {
    await this.notificationsService.clearUserNotifications(user);
    return { success: true };
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    const numericId = Number(id);
    if (!numericId || !Number.isFinite(numericId)) {
      return { success: false };
    }
    await this.notificationsService.deleteNotification(String(numericId));
    return { success: true };
  }
}
