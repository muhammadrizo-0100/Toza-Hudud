import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { RequestsService } from '../requests/requests.service';
import { DistrictsService } from '../districts/districts.service';
import { MahallasService } from '../mahallas/mahallas.service';
import { multerPhotoOptions } from '../requests/upload.helper';
import { RequestSource } from '../../database/entities/request.entity';

export class PublicRequestDto {
  districtId!: number;
  mahallaId?: number;
  mahallaName?: string;
  citizenPhone!: string;
  citizenFullName?: string;
  wasteType?: string;
  lat?: number;
  lng?: number;
  address?: string;
  description?: string;
}

@Controller('public')
export class PublicApiController {
  constructor(
    private readonly requestsService: RequestsService,
    private readonly districtsService: DistrictsService,
    private readonly mahallasService: MahallasService
  ) {}

  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('locations')
  async getPublicLocations(@Query('districtId') districtId?: string) {
    const districts = await this.districtsService.findAll();
    const parsedDistrictId = districtId ? Number(districtId) : districts[0]?.id;
    const mahallas = parsedDistrictId ? await this.mahallasService.findAll(parsedDistrictId) : [];

    return {
      districts,
      mahallas
    };
  }

  @Post('requests')
  @UseInterceptors(AnyFilesInterceptor(multerPhotoOptions))
  async submitPublicRequest(
    @Body() body: PublicRequestDto,
    @UploadedFiles() files?: Express.Multer.File[]
  ) {
    const file =
      files?.find((f) => f.fieldname === 'photo' || f.fieldname === 'beforePhoto') ||
      files?.[0];

    if (!file) {
      throw new BadRequestException('Chiqindining rasmi yuklanishi shart');
    }

    if (!body.citizenPhone) {
      throw new BadRequestException('Telefon raqamingizni kiritish shart');
    }

    const photoUrl = `/uploads/${file.filename}`;

    const request = await this.requestsService.create({
      districtId: Number(body.districtId),
      mahallaId: body.mahallaId ? Number(body.mahallaId) : null,
      mahallaName: body.mahallaName || null,
      source: RequestSource.WEB_PORTAL,
      citizenPhone: body.citizenPhone.trim(),
      citizenFullName: body.citizenFullName?.trim() || null,
      wasteType: body.wasteType || 'maishiy',
      beforePhotoUrl: photoUrl,
      lat: body.lat ? Number(body.lat) : null,
      lng: body.lng ? Number(body.lng) : null,
      address: body.address || null,
      description: body.description || null
    });

    return {
      success: true,
      requestId: request.id,
      message: 'Murojaatingiz muvaffaqiyatli qabul qilindi'
    };
  }

  @Get('track')
  async trackRequest(
    @Query('phone') phone?: string,
    @Query('id') id?: string
  ) {
    if (!phone && !id) {
      throw new BadRequestException('Murojaat ID yoki telefon raqam kiritilishi kerak');
    }

    if (id) {
      const request = await this.requestsService.findOne(Number(id));
      return {
        id: request.id,
        status: request.status,
        mahallaName: request.mahallaName,
        address: request.address,
        beforePhotoUrl: request.beforePhotoUrl,
        afterPhotoUrl: request.afterPhotoUrl,
        createdAt: request.createdAt,
        completedAt: request.completedAt
      };
    }

    // By phone
    const res = await this.requestsService.findAll({ search: phone, limit: 10 });
    return res.items.map((it) => ({
      id: it.id,
      status: it.status,
      mahallaName: it.mahallaName,
      address: it.address,
      beforePhotoUrl: it.beforePhotoUrl,
      afterPhotoUrl: it.afterPhotoUrl,
      createdAt: it.createdAt,
      completedAt: it.completedAt
    }));
  }
}
