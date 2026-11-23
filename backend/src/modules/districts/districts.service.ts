import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  OnModuleInit
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { DistrictEntity } from '../../database/entities/district.entity';
import { AdminRole } from '../../database/entities/admin.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateDistrictDto, UpdateDistrictDto } from './districts.types';
import { DEFAULT_NAMANGAN_DISTRICTS } from './districts-seed.data';
import { fetchDistrictBoundaryAndCenter } from './districts-boundary.helper';

export * from './districts.types';

@Injectable()
export class DistrictsService implements OnModuleInit {
  private readonly logger = new Logger(DistrictsService.name);

  constructor(
    @InjectRepository(DistrictEntity)
    private readonly districtRepo: Repository<DistrictEntity>
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.districtRepo.count();
    if (count === 0) {
      await this.seedDefaultDistricts();
      this.logger.log('✅ Barcha 14 ta tuman va shahar birlamchi holatda yaratildi');
    }
  }

  async seedDefaultDistricts(): Promise<void> {
    for (const d of DEFAULT_NAMANGAN_DISTRICTS) {
      const existing = await this.districtRepo.findOne({ where: { code: d.code } });
      if (!existing) {
        const item = this.districtRepo.create(d);
        await this.districtRepo.save(item);
      } else if (!existing.polygon || existing.polygon.length === 0) {
        existing.polygon = d.polygon;
        existing.centerLat = d.centerLat;
        existing.centerLng = d.centerLng;
        await this.districtRepo.save(existing);
      }
    }
  }

  async findAll(user?: JwtPayload | null): Promise<DistrictEntity[]> {
    if (user && (user.role === AdminRole.DISPATCHER || user.role === AdminRole.MANAGER) && user.districtId) {
      return this.districtRepo.find({
        where: { id: user.districtId, isActive: true },
        order: { name: 'ASC' }
      });
    }

    return this.districtRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: number): Promise<DistrictEntity> {
    const district = await this.districtRepo.findOne({
      where: { id },
      relations: ['mahallas']
    });

    if (!district) {
      throw new NotFoundException(`Tuman #${id} topilmadi`);
    }

    return district;
  }

  async create(dto: CreateDistrictDto): Promise<DistrictEntity> {
    const trimmedName = String(dto.name || '').trim();
    if (!trimmedName || trimmedName.length < 3) {
      throw new BadRequestException('Tuman nomi kamida 3 ta harfdan iborat bo‘lishi shart');
    }

    if (/(.)\1{3,}/i.test(trimmedName) || /^[^a-zA-Zа-яА-ЯўқғҳЎҚҒҲ]+$/.test(trimmedName)) {
      throw new BadRequestException('Tuman nomi noto‘g‘ri kiritildi. Haqiqiy tuman yoki shahar nomini kiriting.');
    }

    const rawCode = (dto.code ? String(dto.code).trim() : trimmedName)
      .toLowerCase()
      .replace(/tumani|shahri|rayon/gi, '')
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 50) || 'tuman';

    const existing = await this.districtRepo.findOne({
      where: [{ name: ILike(trimmedName) }, { code: rawCode }]
    });

    if (existing && existing.isActive) {
      throw new ConflictException(`"${trimmedName}" nomli yoki "${rawCode}" kodli tuman allaqachon mavjud`);
    }

    let polygon: [number, number][] | null = dto.polygon || null;
    let lat = Number(dto.centerLat) || 0;
    let lng = Number(dto.centerLng) || 0;

    if (!polygon && dto.fetchOsmBoundary !== false) {
      const boundaryRes = await fetchDistrictBoundaryAndCenter(trimmedName);
      lat = boundaryRes.lat;
      lng = boundaryRes.lng;
      polygon = boundaryRes.polygon;
    }

    if (!lat || !lng) {
      lat = 41.0000;
      lng = 71.6000;
    }

    if (existing && !existing.isActive) {
      existing.name = trimmedName;
      existing.code = rawCode;
      existing.centerLat = lat;
      existing.centerLng = lng;
      existing.polygon = polygon;
      existing.isActive = true;
      return this.districtRepo.save(existing);
    }

    const district = this.districtRepo.create({
      name: trimmedName,
      code: rawCode,
      centerLat: lat,
      centerLng: lng,
      polygon,
      isActive: true
    });

    return this.districtRepo.save(district);
  }

  async update(id: number, dto: UpdateDistrictDto): Promise<DistrictEntity> {
    const district = await this.findOne(id);
    Object.assign(district, dto);
    return this.districtRepo.save(district);
  }

  async delete(id: number): Promise<{ success: boolean }> {
    const district = await this.findOne(id);
    district.isActive = false;
    await this.districtRepo.save(district);
    return { success: true };
  }
}
