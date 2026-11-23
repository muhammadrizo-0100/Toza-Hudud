import { Repository } from 'typeorm';
import { RequestEntity, RequestStatus } from '../../database/entities/request.entity';
import { AdminEntity, AdminRole } from '../../database/entities/admin.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';

export async function computeAccountStats(
  adminRepo: Repository<AdminEntity>,
  workerRepo: Repository<WorkerEntity>,
  requestRepo: Repository<RequestEntity>,
  user: JwtPayload,
  targetAdminId?: number,
  targetDistrictId?: number
) {
  const effectiveAdminId = targetAdminId || (user.id !== 0 ? user.id : undefined);
  let admin = effectiveAdminId
    ? await adminRepo.findOne({
        where: { id: effectiveAdminId },
        relations: ['district']
      })
    : null;

  const districtIdForLookup = targetDistrictId ?? (user.districtId || undefined);
  if (!admin && districtIdForLookup) {
    admin = await adminRepo.findOne({
      where: { districtId: districtIdForLookup, role: AdminRole.MANAGER },
      relations: ['district']
    });
  }

  let worker: WorkerEntity | null = null;
  if (admin?.workerId) {
    worker = await workerRepo.findOne({
      where: { id: admin.workerId },
      relations: ['district']
    });
  }

  const effectiveDistrictId = admin?.districtId || targetDistrictId || user.districtId;

  const qb = requestRepo.createQueryBuilder('r');
  if (admin?.workerId) {
    qb.where('r.assigned_worker_id = :workerId', { workerId: admin.workerId });
  } else if (effectiveDistrictId) {
    qb.where('r.district_id = :districtId', { districtId: effectiveDistrictId });
  }

  const [
    totalTasks,
    completedCount,
    inProgressCount,
    submittedCount,
    rejectedCount
  ] = await Promise.all([
    qb.clone().getCount(),
    qb.clone().andWhere('r.status = :s', { s: RequestStatus.COMPLETED }).getCount(),
    qb.clone().andWhere('r.status = :s', { s: RequestStatus.IN_PROGRESS }).getCount(),
    qb.clone().andWhere('r.status = :s', { s: RequestStatus.SUBMITTED }).getCount(),
    qb.clone().andWhere('r.status = :s', { s: RequestStatus.REJECTED }).getCount()
  ]);

  const wasteBreakdownRaw = await qb
    .clone()
    .select('r.waste_type', 'type')
    .addSelect('COUNT(*)', 'count')
    .groupBy('r.waste_type')
    .getRawMany();

  const wasteBreakdown = wasteBreakdownRaw.map((row) => ({
    type: row.type || 'maishiy',
    count: Number(row.count)
  }));

  const recentTasks = await qb
    .clone()
    .orderBy('r.id', 'DESC')
    .take(5)
    .getMany();

  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return {
    user: {
      id: admin?.id,
      username: admin?.username,
      fullName: admin?.fullName,
      role: admin?.role,
      phone: admin?.phone || worker?.phone,
      district: admin?.district?.name || worker?.district?.name,
      vehicleNumber: worker?.vehicleNumber || null,
      workerRole: worker?.role || null,
      createdAt: admin?.createdAt
    },
    stats: {
      total: totalTasks,
      completed: completedCount,
      inProgress: inProgressCount,
      submitted: submittedCount,
      rejected: rejectedCount,
      completionRate
    },
    wasteBreakdown,
    recentTasks: recentTasks.map((t) => ({
      id: t.id,
      mahallaName: t.mahallaName,
      status: t.status,
      wasteType: t.wasteType,
      createdAt: t.createdAt,
      completedAt: t.completedAt
    }))
  };
}
