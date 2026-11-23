import { Repository } from 'typeorm';
import { RequestEntity } from '../../database/entities/request.entity';
import { DistrictEntity } from '../../database/entities/district.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';

export async function fetchDistrictCards(
  districtRepo: Repository<DistrictEntity>,
  requestRepo: Repository<RequestEntity>,
  workerRepo: Repository<WorkerEntity>
) {
  const allDistricts = await districtRepo.find({ where: { isActive: true }, order: { id: 'ASC' } });
  const districtStatsRaw = await requestRepo
    .createQueryBuilder('r')
    .select('r.district_id', 'districtId')
    .addSelect('COUNT(*)', 'total')
    .addSelect("COUNT(CASE WHEN r.status = 'completed' THEN 1 END)", 'completed')
    .addSelect("COUNT(CASE WHEN r.status IN ('new', 'in_progress', 'submitted') THEN 1 END)", 'active')
    .groupBy('r.district_id')
    .getRawMany();

  const districtStatsMap = new Map<number, { total: number; completed: number; active: number }>();
  districtStatsRaw.forEach((row) => {
    districtStatsMap.set(Number(row.districtId), {
      total: Number(row.total || 0),
      completed: Number(row.completed || 0),
      active: Number(row.active || 0)
    });
  });

  const workersCountRaw = await workerRepo
    .createQueryBuilder('w')
    .select('w.district_id', 'districtId')
    .addSelect('COUNT(*)', 'workers')
    .addSelect("COUNT(CASE WHEN w.vehicle_number IS NOT NULL AND w.vehicle_number != '' THEN 1 END)", 'vehicles')
    .groupBy('w.district_id')
    .getRawMany();

  const workerStatsMap = new Map<number, { workers: number; vehicles: number }>();
  workersCountRaw.forEach((row) => {
    workerStatsMap.set(Number(row.districtId), {
      workers: Number(row.workers || 0),
      vehicles: Number(row.vehicles || 0)
    });
  });

  return allDistricts.map((d) => {
    const s = districtStatsMap.get(d.id) || { total: 0, completed: 0, active: 0 };
    const w = workerStatsMap.get(d.id) || { workers: 0, vehicles: 0 };
    return {
      id: d.id,
      name: d.name,
      totalRequests: s.total,
      completedRequests: s.completed,
      activeRequests: s.active,
      completionRate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
      workersCount: w.workers,
      vehiclesCount: w.vehicles
    };
  });
}

export async function fetchTopNeighborhoodsAndWorkers(
  requestRepo: Repository<RequestEntity>,
  workerRepo: Repository<WorkerEntity>,
  districtId?: number
) {
  const topNeighborhoodsRaw = await requestRepo
    .createQueryBuilder('r')
    .leftJoin('r.district', 'd')
    .leftJoin('r.mahalla', 'm')
    .select("COALESCE(r.mahalla_name, m.name, 'Boshqa')", 'name')
    .addSelect('COALESCE(d.name, \'Nomalum\')', 'districtName')
    .addSelect('COUNT(*)', 'total')
    .addSelect("COUNT(CASE WHEN r.status IN ('new', 'in_progress', 'submitted') THEN 1 END)", 'active')
    .addSelect("COUNT(CASE WHEN r.status = 'completed' THEN 1 END)", 'completed')
    .where(districtId ? 'r.district_id = :districtId' : '1=1', { districtId })
    .groupBy("COALESCE(r.mahalla_name, m.name, 'Boshqa')")
    .addGroupBy('d.name')
    .orderBy('total', 'DESC')
    .limit(50)
    .getRawMany();

  const topNeighborhoods = topNeighborhoodsRaw.map((row, idx) => ({
    id: idx + 1,
    name: row.name,
    districtName: row.districtName,
    totalRequests: Number(row.total || 0),
    activeRequests: Number(row.active || 0),
    completedRequests: Number(row.completed || 0)
  }));

  const topWorkersRaw = await workerRepo
    .createQueryBuilder('w')
    .leftJoin('w.district', 'd')
    .leftJoin('w.assignedRequests', 'r')
    .select('w.id', 'id')
    .addSelect('w.full_name', 'name')
    .addSelect('COALESCE(d.name, \'Nomalum\')', 'districtName')
    .addSelect('COALESCE(w.vehicle_number, \'-\')', 'vehiclePlate')
    .addSelect("COUNT(CASE WHEN r.status IN ('new', 'in_progress', 'submitted') THEN 1 END)", 'active')
    .addSelect("COUNT(CASE WHEN r.status = 'completed' THEN 1 END)", 'completed')
    .where(districtId ? 'w.district_id = :districtId' : '1=1', { districtId })
    .groupBy('w.id')
    .addGroupBy('w.full_name')
    .addGroupBy('d.name')
    .addGroupBy('w.vehicle_number')
    .orderBy('completed', 'DESC')
    .limit(5)
    .getRawMany();

  const topWorkers = topWorkersRaw.map((row) => ({
    id: Number(row.id),
    name: row.name,
    districtName: row.districtName,
    vehiclePlate: row.vehiclePlate,
    activeRequests: Number(row.active || 0),
    completedRequests: Number(row.completed || 0)
  }));

  return { topNeighborhoods, topWorkers };
}
