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
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { AdminRole } from '../../database/entities/admin.entity';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  @Roles(AdminRole.SUPERADMIN, AdminRole.MANAGER)
  async getAdmins(
    @CurrentUser() requester: JwtPayload,
    @Query('districtId') districtId?: string
  ) {
    const parsedId = districtId ? Number(districtId) : undefined;
    return this.adminsService.findAll(requester, parsedId);
  }

  @Get(':id')
  @Roles(AdminRole.SUPERADMIN, AdminRole.MANAGER)
  async getAdmin(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() requester: JwtPayload
  ) {
    return this.adminsService.findOne(id, requester);
  }

  @Post()
  @Roles(AdminRole.SUPERADMIN, AdminRole.MANAGER)
  async createAdmin(
    @Body() dto: CreateAdminDto,
    @CurrentUser() requester: JwtPayload
  ) {
    return this.adminsService.create(dto, requester);
  }

  @Put(':id')
  @Roles(AdminRole.SUPERADMIN, AdminRole.MANAGER)
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminDto,
    @CurrentUser() requester: JwtPayload
  ) {
    return this.adminsService.update(id, dto, requester);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPERADMIN, AdminRole.MANAGER)
  async deleteAdmin(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() requester: JwtPayload
  ) {
    return this.adminsService.delete(id, requester);
  }
}
