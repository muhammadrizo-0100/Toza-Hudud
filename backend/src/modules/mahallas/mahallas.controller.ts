import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards
} from '@nestjs/common';
import { MahallasService, CreateMahallaDto, UpdateMahallaDto } from './mahallas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../../database/entities/admin.entity';

@Controller('mahallas')
export class MahallasController {
  constructor(private readonly mahallasService: MahallasService) {}

  @Get()
  async getMahallas(@Query('districtId') districtId?: string) {
    const parsedDistrictId = districtId ? Number(districtId) : undefined;
    return this.mahallasService.findAll(parsedDistrictId);
  }

  @Get(':id')
  async getMahalla(@Param('id', ParseIntPipe) id: number) {
    return this.mahallasService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN, AdminRole.DISPATCHER)
  async createMahalla(@Body() dto: CreateMahallaDto) {
    return this.mahallasService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN, AdminRole.DISPATCHER)
  async updateMahalla(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMahallaDto
  ) {
    return this.mahallasService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN)
  async deleteMahalla(@Param('id', ParseIntPipe) id: number) {
    return this.mahallasService.delete(id);
  }
}
