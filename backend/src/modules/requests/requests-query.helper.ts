import { Repository } from 'typeorm';
import { RequestEntity, RequestStatus } from '../../database/entities/request.entity';
import { AdminRole } from '../../database/entities/admin.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { RequestFilterParams, PaginatedRequestsResult, MapPointItem } from './requests.types';

export async function findFilteredRequests(
  repo: Repository<RequestEntity>,
  filters: RequestFilterParams,
  user?: JwtPayload | null
): Promise<PaginatedRequestsResult> {
  const qb = repo
    .createQueryBuilder('r')
    .leftJoinAndSelect('r.district', 'd')
    .leftJoinAndSelect('r.mahalla', 'm')
    .leftJoinAndSelect('r.assignedWorker', 'w');

  if (user && (user.role === AdminRole.INSPECTOR || user.role === AdminRole.DRIVER)) {
    if (user.workerId) {
      qb.andWhere('r.assigned_worker_id = :myWorkerId', { myWorkerId: user.workerId });
    } else if (user.districtId) {
      qb.andWhere('r.district_id = :userDistrictId', { userDistrictId: user.districtId });
    }
  } else if (user && (user.role === AdminRole.DISPATCHER || user.role === AdminRole.MANAGER) && user.districtId) {
    qb.andWhere('r.district_id = :userDistrictId', { userDistrictId: user.districtId });
  } else if (filters.districtId) {
    qb.andWhere('r.district_id = :districtId', { districtId: filters.districtId });
  }

  if (filters.workerId) {
    qb.andWhere('r.assigned_worker_id = :workerId', { workerId: filters.workerId });
  }

  if (filters.mahallaId) {
    qb.andWhere('r.mahalla_id = :mahallaId', { mahallaId: filters.mahallaId });
  }

  if (filters.status) {
    qb.andWhere('r.status = :status', { status: filters.status });
  }

  if (filters.wasteType && filters.wasteType !== 'all') {
    qb.andWhere('r.wasteType = :wasteType', { wasteType: filters.wasteType });
  }

  if (filters.startDate) {
    qb.andWhere('r.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
  }

  if (filters.endDate) {
    qb.andWhere('r.createdAt <= :endDate', { endDate: new Date(filters.endDate) });
  }

  if (filters.search) {
    const s = `%${filters.search.toLowerCase()}%`;
    qb.andWhere(
      '(LOWER(r.address) LIKE :s OR LOWER(r.description) LIKE :s OR LOWER(r.mahallaName) LIKE :s OR LOWER(r.citizenFullName) LIKE :s OR r.citizenPhone LIKE :s)',
      { s }
    );
  }

  qb.orderBy('r.createdAt', 'DESC');

  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.min(100, Math.max(1, Number(filters.limit || 15)));
  const offset = (page - 1) * limit;

  const [items, total] = await qb.skip(offset).take(limit).getManyAndCount();
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages
    }
  };
}

export async function findMapPoints(
  repo: Repository<RequestEntity>,
  districtId?: number
): Promise<MapPointItem[]> {
  const qb = repo
    .createQueryBuilder('r')
    .select([
      'r.id',
      'r.lat',
      'r.lng',
      'r.status',
      'r.mahallaName',
      'r.address',
      'r.beforePhotoUrl',
      'r.createdAt',
      'r.completedAt'
    ])
    .where('r.lat IS NOT NULL')
    .andWhere('r.lng IS NOT NULL')
    .andWhere("r.status != 'rejected'");

  if (districtId) {
    qb.andWhere('r.district_id = :districtId', { districtId });
  }

  const rows = await qb.getRawMany();

  return rows.map((r) => ({
    id: Number(r.r_id),
    lat: Number(r.r_lat),
    lng: Number(r.r_lng),
    status: r.r_status as RequestStatus,
    mahallaName: r.r_mahalla_name,
    address: r.r_address,
    beforePhotoUrl: r.r_before_photo_url,
    createdAt: new Date(r.r_created_at),
    completedAt: r.r_completed_at ? new Date(r.r_completed_at) : null
  }));
}
