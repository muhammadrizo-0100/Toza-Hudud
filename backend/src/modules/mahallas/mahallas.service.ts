import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { DistrictEntity } from '../../database/entities/district.entity';

export interface CreateMahallaDto {
  districtId: number;
  name: string;
  centerLat?: number;
  centerLng?: number;
}

export interface UpdateMahallaDto {
  name?: string;
  centerLat?: number;
  centerLng?: number;
}

@Injectable()
export class MahallasService implements OnModuleInit {
  private readonly logger = new Logger(MahallasService.name);

  constructor(
    @InjectRepository(MahallaEntity)
    private readonly mahallaRepo: Repository<MahallaEntity>,
    @InjectRepository(DistrictEntity)
    private readonly districtRepo: Repository<DistrictEntity>
  ) {}

  async onModuleInit(): Promise<void> {
    // Demo seed disabled for clean testing from 0
  }

  async seedDefaultMahallas(): Promise<void> {
    const districts = await this.districtRepo.find();
    for (const d of districts) {
      const mahallaCount = await this.mahallaRepo.count({ where: { districtId: d.id } });
      if (mahallaCount === 0) {
        let sampleMahallas: Array<{ name: string; centerLat: number; centerLng: number }> = [];
        if (d.code === 'davlatobod') {
          sampleMahallas = [
            { name: 'Yuksalish MFY', centerLat: 41.0112, centerLng: 71.5721 },
            { name: 'Navbahor MFY', centerLat: 41.0150, centerLng: 71.5800 },
            { name: 'Orzu MFY', centerLat: 41.0080, centerLng: 71.5650 },
            { name: 'Damariq MFY', centerLat: 41.0200, centerLng: 71.5700 },
            { name: 'To‘qimachi MFY', centerLat: 41.0050, centerLng: 71.5850 }
          ];
        } else if (d.code === 'yangi_namangan') {
          sampleMahallas = [
            { name: 'Mustaqillik MFY', centerLat: 41.0250, centerLng: 71.6500 },
            { name: 'Oromgoh MFY', centerLat: 41.0300, centerLng: 71.6550 },
            { name: 'Mingchinor MFY', centerLat: 41.0200, centerLng: 71.6450 }
          ];
        } else if (d.code === 'chust') {
          sampleMahallas = [
            { name: 'Bibiona MFY', centerLat: 41.0089, centerLng: 71.2289 },
            { name: 'Chustiy MFY', centerLat: 41.0120, centerLng: 71.2320 },
            { name: 'Varzik MFY', centerLat: 41.0150, centerLng: 71.2200 }
          ];
        }

        for (const m of sampleMahallas) {
          const entity = this.mahallaRepo.create({
            districtId: d.id,
            name: m.name,
            centerLat: m.centerLat,
            centerLng: m.centerLng
          });
          await this.mahallaRepo.save(entity);
        }
        if (sampleMahallas.length > 0) {
          this.logger.log(`Initial mahallas seeded for ${d.name}`);
        }
      }
    }
  }

  async findAll(districtId?: number): Promise<MahallaEntity[]> {
    if (districtId) {
      return this.mahallaRepo.find({
        where: { districtId },
        order: { name: 'ASC' }
      });
    }

    return this.mahallaRepo.find({
      order: { name: 'ASC' }
    });
  }

  async findOne(id: number): Promise<MahallaEntity> {
    const mahalla = await this.mahallaRepo.findOne({
      where: { id },
      relations: ['district']
    });

    if (!mahalla) {
      throw new NotFoundException(`Mahalla #${id} topilmadi`);
    }

    return mahalla;
  }

  async create(dto: CreateMahallaDto): Promise<MahallaEntity> {
    const entity = this.mahallaRepo.create({
      districtId: dto.districtId,
      name: dto.name.trim(),
      centerLat: dto.centerLat || null,
      centerLng: dto.centerLng || null
    });

    return this.mahallaRepo.save(entity);
  }

  async update(id: number, dto: UpdateMahallaDto): Promise<MahallaEntity> {
    const mahalla = await this.findOne(id);
    Object.assign(mahalla, dto);
    return this.mahallaRepo.save(mahalla);
  }

  async delete(id: number): Promise<{ success: boolean }> {
    const mahalla = await this.findOne(id);
    await this.mahallaRepo.remove(mahalla);
    return { success: true };
  }
}
