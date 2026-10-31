import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestsService, RequestFilterParams } from './requests.service';
import { multerPhotoOptions } from './upload.helper';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { RequestStatus, RequestSource } from '../../database/entities/request.entity';

export class CreateRequestDto {
  districtId!: number;
  mahallaId?: number;
  mahallaName?: string;
  source?: RequestSource;
  citizenPhone?: string;
  citizenTelegramId?: string;
  citizenFullName?: string;
  wasteType?: string;
  lat?: number;
  lng?: number;
  address?: string;
  description?: string;
}

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getRequests(
    @Query('districtId') districtId?: string,
    @Query('mahallaId') mahallaId?: string,
    @Query('status') status?: RequestStatus,
    @Query('wasteType') wasteType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: JwtPayload | null
  ) {
    const filters: RequestFilterParams = {
      districtId: districtId ? Number(districtId) : undefined,
      mahallaId: mahallaId ? Number(mahallaId) : undefined,
      status,
      wasteType: wasteType && wasteType !== 'all' ? wasteType : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 15,
      startDate,
      endDate,
      search
    };

    return this.requestsService.findAll(filters, user);
  }

  @Get('map')
  @UseGuards(JwtAuthGuard)
  async getMapPoints(@Query('districtId') districtId?: string) {
    const parsedId = districtId ? Number(districtId) : undefined;
    return this.requestsService.getMapPoints(parsedId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getRequest(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.findOne(id);
  }

  // FIX: Added JwtAuthGuard — upload endpoint was completely public,
  // allowing anyone to fill disk storage with arbitrary uploads.
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo', multerPhotoOptions))
  async uploadPhoto(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Rasm fayli yuklanmadi');
    }
    return {
      success: true,
      url: `/uploads/${file.filename}`
    };
  }

  // FIX: Added JwtAuthGuard — POST /requests was completely public.
  // Only authenticated staff (web-portal side) should create requests via this endpoint.
  // Public (citizen) submissions go through /api/public/requests.
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('beforePhoto', multerPhotoOptions))
  async createRequest(
    @Body() body: CreateRequestDto,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: Express.Multer.File
  ) {
    let photoUrl = '';
    if (file) {
      photoUrl = `/uploads/${file.filename}`;
    }

    if (!photoUrl) {
      throw new BadRequestException('Murojaat uchun chiqindi surati (beforePhoto) majburiy');
    }

    return this.requestsService.create(
      {
        districtId: Number(body.districtId),
        mahallaId: body.mahallaId ? Number(body.mahallaId) : null,
        mahallaName: body.mahallaName || null,
        source: body.source || RequestSource.WEB_PORTAL,
        citizenPhone: body.citizenPhone || null,
        citizenFullName: body.citizenFullName || null,
        citizenTelegramId: body.citizenTelegramId || null,
        beforePhotoUrl: photoUrl,
        wasteType: body.wasteType || 'maishiy',
        lat: body.lat ? Number(body.lat) : null,
        lng: body.lng ? Number(body.lng) : null,
        address: body.address || null,
        description: body.description || null
      },
      user.id
    );
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async assignWorker(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body('workerId', ParseIntPipe) workerId: number
  ) {
    return this.requestsService.assignWorker(id, workerId, user.id);
  }

  // FIX: Added JwtAuthGuard — PATCH /:id/submit was completely public,
  // allowing anyone to mark a request as submitted.
  @Patch(':id/submit')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('afterPhoto', multerPhotoOptions))
  async submitWork(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body('afterPhotoUrl') afterPhotoUrl?: string,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const url = file ? `/uploads/${file.filename}` : afterPhotoUrl;
    if (!url) {
      throw new BadRequestException('Tozalangan joyning rasmi (afterPhoto) majburiy');
    }
    return this.requestsService.submitWork(id, url, user.id);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async verifyWork(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.requestsService.verifyWork(id, user.id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async rejectWork(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string
  ) {
    return this.requestsService.rejectWork(id, reason, user.id);
  }
}
