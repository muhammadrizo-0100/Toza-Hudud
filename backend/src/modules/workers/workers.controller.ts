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
import { WorkersService, CreateWorkerDto, UpdateWorkerDto } from './workers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../../database/entities/admin.entity';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getWorkers(@Query('districtId') districtId?: string) {
    const parsedId = districtId ? Number(districtId) : undefined;
    return this.workersService.findAll(parsedId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getWorker(@Param('id', ParseIntPipe) id: number) {
    return this.workersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN, AdminRole.DISPATCHER)
  async createWorker(@Body() dto: CreateWorkerDto) {
    return this.workersService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN, AdminRole.DISPATCHER)
  async updateWorker(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkerDto
  ) {
    return this.workersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPERADMIN, AdminRole.DISPATCHER)
  async deleteWorker(@Param('id', ParseIntPipe) id: number) {
    return this.workersService.delete(id);
  }
}
