import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import axios from 'axios';
import { DistrictEntity } from '../../database/entities/district.entity';
import { AdminRole } from '../../database/entities/admin.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';

export interface CreateDistrictDto {
  name: string;
  code?: string;
  centerLat?: number;
  centerLng?: number;
  polygon?: [number, number][];
  fetchOsmBoundary?: boolean;
}

export interface UpdateDistrictDto {
  name?: string;
  code?: string;
  centerLat?: number;
  centerLng?: number;
  polygon?: [number, number][];
  isActive?: boolean;
}

const DAVLATOBOD_POLYGON: [number, number][] = [
  [40.966141, 71.566367],
  [40.97196, 71.571334],
  [40.976357, 71.577328],
  [40.98696, 71.537249],
  [40.98877, 71.537421],
  [40.989933, 71.536564],
  [40.990321, 71.538448],
  [40.987347, 71.553863],
  [40.99239, 71.561742],
  [40.997431, 71.565339],
  [41.000404, 71.537935],
  [41.007578, 71.540271],
  [41.009667, 71.530463],
  [41.008361, 71.522155],
  [41.016023, 71.519501],
  [41.020463, 71.522271],
  [41.02499, 71.527001],
  [41.028124, 71.527925],
  [41.028907, 71.523194],
  [41.034478, 71.522848],
  [41.036392, 71.526078],
  [41.037959, 71.521117],
  [41.038568, 71.519963],
  [41.041179, 71.520194],
  [41.044312, 71.516848],
  [41.047967, 71.519732],
  [41.048489, 71.521463],
  [41.04962, 71.526886],
  [41.050664, 71.530925],
  [41.050577, 71.533578],
  [41.047619, 71.535771],
  [41.047967, 71.538309],
  [41.0511, 71.539578],
  [41.053014, 71.539002],
  [41.054493, 71.539232],
  [41.056233, 71.540271],
  [41.056407, 71.542463],
  [41.054493, 71.544425],
  [41.052057, 71.546271],
  [41.051274, 71.548117],
  [41.050926, 71.552271],
  [41.050229, 71.556425],
  [41.046923, 71.556886],
  [41.043964, 71.55804],
  [41.040135, 71.561271],
  [41.033694, 71.563233],
  [41.034826, 71.570848],
  [41.034652, 71.573963],
  [41.041005, 71.57604],
  [41.045356, 71.583425],
  [41.048924, 71.587694],
  [41.054493, 71.58781],
  [41.057538, 71.587117],
  [41.059278, 71.591041],
  [41.055189, 71.598079],
  [41.051709, 71.599233],
  [41.051361, 71.595079],
  [41.043529, 71.595656],
  [41.037176, 71.596348],
  [41.036653, 71.599233],
  [41.037611, 71.603271],
  [41.028994, 71.611002],
  [41.030213, 71.616541],
  [41.029603, 71.620348],
  [41.022988, 71.620348],
  [41.020898, 71.62981],
  [41.02055, 71.639503],
  [41.020289, 71.642156],
  [41.009319, 71.65681],
  [41.003398, 71.660157],
  [41.000002, 71.646195],
  [40.99199, 71.649426],
  [40.989987, 71.639503],
  [40.987983, 71.630618],
  [40.98328, 71.631426],
  [40.97997, 71.621156],
  [40.973436, 71.624387],
  [40.970823, 71.620925],
  [40.967425, 71.620233],
  [40.963417, 71.612271],
  [40.960542, 71.604425],
  [40.958799, 71.594964],
  [40.963417, 71.585964],
  [40.961761, 71.58654],
  [40.966641, 71.578117],
  [40.969342, 71.57131]
];

const YANGI_NAMANGAN_POLYGON: [number, number][] = [
  [41.0150, 71.6350],
  [41.0300, 71.6300],
  [41.0450, 71.6450],
  [41.0550, 71.6650],
  [41.0450, 71.6850],
  [41.0250, 71.6850],
  [41.0150, 71.6600],
  [41.0150, 71.6350]
];

const CHUST_POLYGON: [number, number][] = [
  [40.9850, 71.2050],
  [41.0150, 71.2000],
  [41.0350, 71.2250],
  [41.0300, 71.2600],
  [41.0000, 71.2650],
  [40.9850, 71.2350],
  [40.9850, 71.2050]
];

@Injectable()
export class DistrictsService implements OnModuleInit {
  private readonly logger = new Logger(DistrictsService.name);

  constructor(
    @InjectRepository(DistrictEntity)
    private readonly districtRepo: Repository<DistrictEntity>
  ) {}

  async onModuleInit(): Promise<void> {
    // Demo seed disabled for clean testing from 0
  }

  async seedDefaultDistricts(): Promise<void> {
    const defaults = [
      {
        name: 'Davlatobod tumani',
        code: 'davlatobod',
        centerLat: 41.0108,
        centerLng: 71.5775,
        polygon: DAVLATOBOD_POLYGON
      },
      {
        name: 'Yangi Namangan tumani',
        code: 'yangi_namangan',
        centerLat: 41.0250,
        centerLng: 71.6500,
        polygon: YANGI_NAMANGAN_POLYGON
      },
      {
        name: 'Chust tumani',
        code: 'chust',
        centerLat: 41.0089,
        centerLng: 71.2289,
        polygon: CHUST_POLYGON
      }
    ];

    for (const d of defaults) {
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
    if (!trimmedName) {
      throw new BadRequestException('Tuman nomi kiritilishi shart');
    }

    const rawCode = (dto.code ? String(dto.code).trim() : trimmedName)
      .toLowerCase()
      .replace(/tumani|shahri|rayon/gi, '')
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 50) || 'tuman';

    // Duplicate check
    const existing = await this.districtRepo.findOne({
      where: [{ name: ILike(trimmedName) }, { code: rawCode }]
    });

    if (existing && existing.isActive) {
      throw new ConflictException(`"${trimmedName}" nomli yoki "${rawCode}" kodli tuman allaqachon mavjud`);
    }

    let polygon: [number, number][] | null = dto.polygon || null;
    let lat = Number(dto.centerLat) || 41.0000;
    let lng = Number(dto.centerLng) || 71.6000;

    // Fetch official district boundary if requested (default: true) and no manual polygon was provided
    if (!polygon && dto.fetchOsmBoundary !== false) {
      try {
        const query = encodeURIComponent(`${trimmedName} Uzbekistan`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&polygon_geojson=1&limit=1`;
        const res = await axios.get(url, {
          headers: { 'User-Agent': 'TozaHududSanitation/1.0 (contact@tozahudud.uz)' },
          timeout: 4000
        });

        if (res.data && res.data.length > 0) {
          const match = res.data[0];
          lat = Number(match.lat) || lat;
          lng = Number(match.lon) || lng;

          if (match.geojson) {
            if (match.geojson.type === 'Polygon' && Array.isArray(match.geojson.coordinates?.[0])) {
              polygon = (match.geojson.coordinates[0] as [number, number][]).map(([pLng, pLat]) => [pLat, pLng]);
            } else if (match.geojson.type === 'MultiPolygon' && Array.isArray(match.geojson.coordinates?.[0]?.[0])) {
              polygon = (match.geojson.coordinates[0][0] as [number, number][]).map(([pLng, pLat]) => [pLat, pLng]);
            }
          }
        }
      } catch (err) {
        this.logger.warn(`OSM boundary fetch skipped for ${trimmedName}: ${String(err)}`);
      }
    }

    // If still no polygon, create an 8-sided boundary around the center so the district is never boundary-less on the map
    if (!polygon && lat && lng) {
      const r = 0.035;
      const points: [number, number][] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI) / 8;
        points.push([
          Number((lat + r * Math.cos(angle)).toFixed(6)),
          Number((lng + (r * 1.3) * Math.sin(angle)).toFixed(6))
        ]);
      }
      points.push(points[0]);
      polygon = points;
    }

    // If previously deleted (soft-deleted), reactivate and restore it with new coordinates/name
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
