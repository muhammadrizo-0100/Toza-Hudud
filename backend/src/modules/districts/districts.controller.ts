import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards
} from '@nestjs/common';
import { DistrictsService, CreateDistrictDto, UpdateDistrictDto } from './districts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { AdminRole } from '../../database/entities/admin.entity';

@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @Get()
  async getDistricts(@CurrentUser() user: JwtPayload | null) {
    return this.districtsService.findAll(user);
  }

  @Get(':id')
  async getDistrict(@Param('id', ParseIntPipe) id: number) {
    return this.districtsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN)
  async createDistrict(@Body() dto: CreateDistrictDto) {
    return this.districtsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN)
  async updateDistrict(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDistrictDto
  ) {
    return this.districtsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN)
  async deleteDistrict(@Param('id', ParseIntPipe) id: number) {
    return this.districtsService.delete(id);
  }
}
