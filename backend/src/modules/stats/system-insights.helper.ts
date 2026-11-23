import { Repository, In } from 'typeorm';
import { RequestEntity } from '../../database/entities/request.entity';
import { DistrictEntity } from '../../database/entities/district.entity';
import { AdminEntity, AdminRole } from '../../database/entities/admin.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { fetchDistrictCards, fetchTopNeighborhoodsAndWorkers } from './system-insights-cards.helper';

export async function computeSystemInsights(
  requestRepo: Repository<RequestEntity>,
  districtRepo: Repository<DistrictEntity>,
  adminRepo: Repository<AdminEntity>,
  mahallaRepo: Repository<MahallaEntity>,
  workerRepo: Repository<WorkerEntity>,
  user?: JwtPayload | null,
  selectedDistrictId?: number,
  startDate?: string,
  endDate?: string
) {
  const districtId =
    user && (user.role === AdminRole.DISPATCHER || user.role === AdminRole.MANAGER) && user.districtId
      ? user.districtId
      : selectedDistrictId;

  const qb = requestRepo.createQueryBuilder('r');
  if (districtId) qb.where('r.district_id = :districtId', { districtId });
  if (startDate) qb.andWhere('r.created_at >= :startDate', { startDate: new Date(startDate) });
  if (endDate) qb.andWhere('r.created_at <= :endDate', { endDate: new Date(endDate) });

  const countsRaw = await qb
    .select('COUNT(*)', 'total')
    .addSelect("COUNT(CASE WHEN r.status = 'new' THEN 1 END)", 'new')
    .addSelect("COUNT(CASE WHEN r.status = 'in_progress' THEN 1 END)", 'in_progress')
    .addSelect("COUNT(CASE WHEN r.status = 'submitted' THEN 1 END)", 'submitted')
    .addSelect("COUNT(CASE WHEN r.status = 'completed' THEN 1 END)", 'completed')
    .addSelect("COUNT(CASE WHEN r.status = 'rejected' THEN 1 END)", 'rejected')
    .getRawOne();

  const totalRequests = Number(countsRaw?.total || 0);
  const newCount = Number(countsRaw?.new || 0);
  const inProgressCount = Number(countsRaw?.in_progress || 0);
  const submittedCount = Number(countsRaw?.submitted || 0);
  const completedCount = Number(countsRaw?.completed || 0);
  const rejectedCount = Number(countsRaw?.rejected || 0);
  const activeRequests = newCount + inProgressCount + submittedCount;
  const completionRate = totalRequests > 0 ? Math.round((completedCount / totalRequests) * 100) : 0;

  const [
    totalDistricts,
    totalManagers,
    totalWorkers,
    totalVehicles,
    totalNeighborhoods,
    uniqueClientsRaw,
    uniquePointsRaw
  ] = await Promise.all([
    districtRepo.count({ where: { isActive: true } }),
    adminRepo.count({
      where: districtId
        ? { role: In([AdminRole.DISPATCHER, AdminRole.MANAGER]), districtId, isActive: true }
        : { role: In([AdminRole.DISPATCHER, AdminRole.MANAGER]), isActive: true }
    }),
    workerRepo.count({
      where: districtId ? { districtId, isActive: true } : { isActive: true }
    }),
    workerRepo
      .createQueryBuilder('w')
      .where(districtId ? 'w.district_id = :districtId' : '1=1', { districtId })
      .andWhere("w.vehicle_number IS NOT NULL AND w.vehicle_number != ''")
      .getCount(),
    mahallaRepo.count({ where: districtId ? { districtId } : undefined }),
    requestRepo
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT(r.citizen_phone))', 'cnt')
      .where(districtId ? 'r.district_id = :districtId' : '1=1', { districtId })
      .getRawOne<{ cnt: string }>(),
    requestRepo
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT(r.address))', 'cnt')
      .where(districtId ? 'r.district_id = :districtId' : '1=1', { districtId })
      .getRawOne<{ cnt: string }>()
  ]);

  const districtCards = await fetchDistrictCards(districtRepo, requestRepo, workerRepo);
  const { topNeighborhoods, topWorkers } = await fetchTopNeighborhoodsAndWorkers(requestRepo, workerRepo, districtId);

  const recentRequestsRaw = await requestRepo.find({
    where: districtId ? { districtId } : undefined,
    relations: ['district', 'mahalla'],
    order: { createdAt: 'DESC' },
    take: 6
  });

  const recentRequests = recentRequestsRaw.map((r) => ({
    id: r.id,
    citizenFullName: r.citizenFullName || 'Noma\'lum',
    citizenPhone: r.citizenPhone || '-',
    districtName: r.district?.name || 'Noma\'lum',
    mahallaName: r.mahallaName || r.mahalla?.name || 'Boshqa',
    address: r.address || '-',
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    beforePhotoUrl: r.beforePhotoUrl
  }));

  return {
    overview: {
      totalDistricts,
      totalManagers,
      totalWorkers,
      totalVehicles,
      totalNeighborhoods,
      totalBuildings: Number(uniquePointsRaw?.cnt || 0),
      totalClients: Number(uniqueClientsRaw?.cnt || 0),
      totalRequests,
      completedRequests: completedCount,
      activeRequests,
      completionRate,
      newRequests: newCount,
      inProgressRequests: inProgressCount,
      submittedRequests: submittedCount,
      reviewRequests: rejectedCount
    },
    districtCards,
    topNeighborhoods,
    topWorkers,
    recentRequests
  };
}
