import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('my-account')
  async getMyAccountStats(@CurrentUser() user: JwtPayload) {
    return this.statsService.getMyAccountStats(user);
  }

  @Get('insights')
  async getInsights(
    @CurrentUser() user: JwtPayload,
    @Query('districtId') districtId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const parsedId = districtId ? Number(districtId) : undefined;
    return this.statsService.getSystemInsights(user, parsedId, startDate, endDate);
  }

  @Get()
  async getStats(
    @CurrentUser() user: JwtPayload,
    @Query('districtId') districtId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const parsedId = districtId ? Number(districtId) : undefined;
    return this.statsService.getDashboardStats(user, parsedId, startDate, endDate);
  }
}


