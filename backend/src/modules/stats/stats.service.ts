import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RequestEntity, RequestStatus } from '../../database/entities/request.entity';
import { DistrictEntity } from '../../database/entities/district.entity';
import { AdminEntity, AdminRole } from '../../database/entities/admin.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { WorkerEntity } from '../../database/entities/worker.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepo: Repository<RequestEntity>,
    @InjectRepository(DistrictEntity)
    private readonly districtRepo: Repository<DistrictEntity>,
    @InjectRepository(AdminEntity)
    private readonly adminRepo: Repository<AdminEntity>,
    @InjectRepository(MahallaEntity)
    private readonly mahallaRepo: Repository<MahallaEntity>,
    @InjectRepository(WorkerEntity)
    private readonly workerRepo: Repository<WorkerEntity>
  ) {}

  async getSystemInsights(
    user?: JwtPayload | null,
    selectedDistrictId?: number,
    startDate?: string,
    endDate?: string
  ) {
    const districtId =
      user && (user.role === AdminRole.DISPATCHER || user.role === AdminRole.MANAGER) && user.districtId
        ? user.districtId
        : selectedDistrictId;

    const qb = this.requestRepo.createQueryBuilder('r');
    if (districtId) {
      qb.where('r.district_id = :districtId', { districtId });
    }
    if (startDate) {
      qb.andWhere('r.created_at >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('r.created_at <= :endDate', { endDate: new Date(endDate) });
    }

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
    const completionRate =
      totalRequests > 0 ? Math.round((completedCount / totalRequests) * 100) : 0;

    // Counts across system
    const [
      totalDistricts,
      totalManagers,
      totalWorkers,
      totalVehicles,
      totalNeighborhoods,
      uniqueClientsRaw,
      uniquePointsRaw
    ] = await Promise.all([
      this.districtRepo.count({ where: { isActive: true } }),
      this.adminRepo.count({
        where: districtId
          ? { role: In([AdminRole.DISPATCHER, AdminRole.MANAGER]), districtId, isActive: true }
          : { role: In([AdminRole.DISPATCHER, AdminRole.MANAGER]), isActive: true }
      }),
      this.workerRepo.count({
        where: districtId ? { districtId, isActive: true } : { isActive: true }
      }),
      this.workerRepo
        .createQueryBuilder('w')
        .where(districtId ? 'w.district_id = :districtId' : '1=1', { districtId })
        .andWhere("w.vehicle_number IS NOT NULL AND w.vehicle_number != ''")
        .getCount(),
      this.mahallaRepo.count({
        where: districtId ? { districtId } : undefined
      }),
      this.requestRepo
        .createQueryBuilder('r')
        .select('COUNT(DISTINCT(r.citizen_phone))', 'cnt')
        .where(districtId ? 'r.district_id = :districtId' : '1=1', { districtId })
        .getRawOne<{ cnt: string }>(),
      this.requestRepo
        .createQueryBuilder('r')
        .select('COUNT(DISTINCT(r.address))', 'cnt')
        .where(districtId ? 'r.district_id = :districtId' : '1=1', { districtId })
        .getRawOne<{ cnt: string }>()
    ]);

    const totalClients = Number(uniqueClientsRaw?.cnt || 0);
    const totalBuildings = Number(uniquePointsRaw?.cnt || 0);

    // District cards
    const allDistricts = await this.districtRepo.find({
      where: { isActive: true },
      order: { id: 'ASC' }
    });

    const districtStatsRaw = await this.requestRepo
      .createQueryBuilder('r')
      .select('r.district_id', 'districtId')
      .addSelect('COUNT(*)', 'total')
      .addSelect("COUNT(CASE WHEN r.status = 'completed' THEN 1 END)", 'completed')
      .addSelect(
        "COUNT(CASE WHEN r.status IN ('new', 'in_progress', 'submitted') THEN 1 END)",
        'active'
      )
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

    // Workers per district
    const workersCountRaw = await this.workerRepo
      .createQueryBuilder('w')
      .select('w.district_id', 'districtId')
      .addSelect('COUNT(*)', 'workers')
      .addSelect(
        "COUNT(CASE WHEN w.vehicle_number IS NOT NULL AND w.vehicle_number != '' THEN 1 END)",
        'vehicles'
      )
      .groupBy('w.district_id')
      .getRawMany();

    const workerStatsMap = new Map<number, { workers: number; vehicles: number }>();
    workersCountRaw.forEach((row) => {
      workerStatsMap.set(Number(row.districtId), {
        workers: Number(row.workers || 0),
        vehicles: Number(row.vehicles || 0)
      });
    });

    const districtCards = allDistricts.map((d) => {
      const s = districtStatsMap.get(d.id) || { total: 0, completed: 0, active: 0 };
      const w = workerStatsMap.get(d.id) || { workers: 0, vehicles: 0 };
      const rate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      return {
        id: d.id,
        name: d.name,
        totalRequests: s.total,
        completedRequests: s.completed,
        activeRequests: s.active,
        completionRate: rate,
        workersCount: w.workers,
        vehiclesCount: w.vehicles
      };
    });

    // Top Neighborhoods
    const topNeighborhoodsRaw = await this.requestRepo
      .createQueryBuilder('r')
      .leftJoin('r.district', 'd')
      .leftJoin('r.mahalla', 'm')
      .select("COALESCE(r.mahalla_name, m.name, 'Boshqa')", 'name')
      .addSelect('COALESCE(d.name, \'Nomalum\')', 'districtName')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        "COUNT(CASE WHEN r.status IN ('new', 'in_progress', 'submitted') THEN 1 END)",
        'active'
      )
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

    // Top Workers
    const topWorkersRaw = await this.workerRepo
      .createQueryBuilder('w')
      .leftJoin('w.district', 'd')
      .leftJoin('w.assignedRequests', 'r')
      .select('w.id', 'id')
      .addSelect('w.full_name', 'name')
      .addSelect('COALESCE(d.name, \'Nomalum\')', 'districtName')
      .addSelect('COALESCE(w.vehicle_number, \'-\')', 'vehiclePlate')
      .addSelect(
        "COUNT(CASE WHEN r.status IN ('new', 'in_progress', 'submitted') THEN 1 END)",
        'active'
      )
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

    // Recent requests
    const recentRequestsRaw = await this.requestRepo.find({
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
        totalBuildings,
        totalClients,
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

  async getDashboardStats(
    user?: JwtPayload | null,
    selectedDistrictId?: number,
    startDate?: string,
    endDate?: string
  ) {
    const districtId =
      user && (user.role === AdminRole.DISPATCHER || user.role === AdminRole.MANAGER) && user.districtId
        ? user.districtId
        : selectedDistrictId;

    const qb = this.requestRepo.createQueryBuilder('r');
    if (districtId) {
      qb.where('r.district_id = :districtId', { districtId });
    }
    if (startDate) {
      qb.andWhere('r.created_at >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      qb.andWhere('r.created_at <= :endDate', { endDate: new Date(endDate) });
    }

    const [countsRaw, avgResRaw] = await Promise.all([
      qb
        .select('COUNT(*)', 'total')
        .addSelect("COUNT(CASE WHEN r.status = 'new' THEN 1 END)", 'new')
        .addSelect("COUNT(CASE WHEN r.status = 'in_progress' THEN 1 END)", 'in_progress')
        .addSelect("COUNT(CASE WHEN r.status = 'submitted' THEN 1 END)", 'submitted')
        .addSelect("COUNT(CASE WHEN r.status = 'completed' THEN 1 END)", 'completed')
        .addSelect("COUNT(CASE WHEN r.status = 'rejected' THEN 1 END)", 'rejected')
        .getRawOne(),
      this.requestRepo
        .createQueryBuilder('r')
        .select("AVG(EXTRACT(EPOCH FROM (COALESCE(r.completed_at, r.updated_at) - r.created_at)) / 3600)", 'avgHours')
        .where("r.status = 'completed'")
        .andWhere(districtId ? 'r.district_id = :districtId' : '1=1', { districtId })
        .getRawOne()
    ]);

    const total = Number(countsRaw?.total || 0);
    const newCount = Number(countsRaw?.new || 0);
    const inProgressCount = Number(countsRaw?.in_progress || 0);
    const submittedCount = Number(countsRaw?.submitted || 0);
    const completedCount = Number(countsRaw?.completed || 0);
    const rejectedCount = Number(countsRaw?.rejected || 0);

    const avgResolutionHours = avgResRaw?.avgHours ? Number(Number(avgResRaw.avgHours).toFixed(1)) : 0;

    // Daily flow (multi-day timeline)
    const daysCount = 7;
    const now = new Date();
    const monthsUz = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
    const dateList: Array<{ date: string; dateLabel: string }> = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dateList.push({
        date: `${yyyy}-${mm}-${dd}`,
        dateLabel: `${d.getDate()} ${monthsUz[d.getMonth()]}`
      });
    }

    const dailyQb = this.requestRepo
      .createQueryBuilder('r')
      .select("TO_CHAR(r.created_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        "COUNT(CASE WHEN r.status = 'completed' THEN 1 END)",
        'completed'
      )
      .addSelect(
        "COUNT(CASE WHEN r.status IN ('new', 'in_progress', 'submitted') THEN 1 END)",
        'active'
      )
      .where(districtId ? 'r.district_id = :districtId' : '1=1', { districtId });

    if (startDate) {
      dailyQb.andWhere('r.created_at >= :startDate', { startDate: new Date(startDate) });
    } else {
      dailyQb.andWhere("r.created_at >= :sinceDate", {
        sinceDate: new Date(now.getTime() - daysCount * 24 * 60 * 60 * 1000)
      });
    }

    if (endDate) {
      dailyQb.andWhere('r.created_at <= :endDate', { endDate: new Date(endDate) });
    }

    const dailyRaw = await dailyQb
      .groupBy("TO_CHAR(r.created_at, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    const rawMap = new Map<string, { total: number; completed: number; active: number }>();
    let distinctDays = 0;
    dailyRaw.forEach((row) => {
      const cnt = Number(row.total || 0);
      if (cnt > 0) distinctDays++;
      rawMap.set(row.date, {
        total: cnt,
        completed: Number(row.completed || 0),
        active: Number(row.active || 0)
      });
    });

    const activeCount = newCount + inProgressCount + submittedCount;

    // 100% Real Daily Trend from database
    const dailyTrend = dateList.map((d) => {
      const found = rawMap.get(d.date);
      return {
        date: d.date,
        dateLabel: d.dateLabel,
        total: found?.total || 0,
        completed: found?.completed || 0,
        active: found?.active || 0
      };
    });

    // Mahalla breakdown (Top 10)
    const mahallaQb = this.requestRepo
      .createQueryBuilder('r')
      .leftJoin('r.mahalla', 'm')
      .select("COALESCE(r.mahalla_name, m.name, 'Boshqa')", 'name')
      .addSelect('COUNT(*)', 'value')
      .where(districtId ? 'r.district_id = :districtId' : '1=1', { districtId });

    if (startDate) {
      mahallaQb.andWhere('r.created_at >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      mahallaQb.andWhere('r.created_at <= :endDate', { endDate: new Date(endDate) });
    }

    const mahallaRaw = await mahallaQb
      .groupBy("COALESCE(r.mahalla_name, m.name, 'Boshqa')")
      .orderBy('value', 'DESC')
      .limit(10)
      .getRawMany();

    const mahallaBreakdown = mahallaRaw.map((row) => ({
      name: row.name,
      value: Number(row.value || 0)
    }));

    // Category breakdown with real database types & calculated percentages
    const wasteQb = this.requestRepo
      .createQueryBuilder('r')
      .select("COALESCE(r.waste_type, 'maishiy')", 'wasteType')
      .addSelect('COUNT(*)', 'cnt')
      .where(districtId ? 'r.district_id = :districtId' : '1=1', { districtId });

    if (startDate) {
      wasteQb.andWhere('r.created_at >= :startDate', { startDate: new Date(startDate) });
    }
    if (endDate) {
      wasteQb.andWhere('r.created_at <= :endDate', { endDate: new Date(endDate) });
    }

    const wasteRaw = await wasteQb
      .groupBy("COALESCE(r.waste_type, 'maishiy')")
      .getRawMany();

    const wasteCounts: Record<string, number> = {
      maishiy: 0,
      qurilish: 0,
      xazon: 0,
      katta_hajmli: 0,
      noqonuniy: 0
    };

    let totalWasteCounted = 0;
    wasteRaw.forEach((row) => {
      const rawType = (row.wasteType || 'maishiy').toLowerCase().trim();
      const count = Number(row.cnt || 0);
      if (wasteCounts[rawType] !== undefined) {
        wasteCounts[rawType] += count;
      } else {
        wasteCounts.maishiy += count;
      }
      totalWasteCounted += count;
    });

    const categoryNames: Record<string, string> = {
      maishiy: 'Maishiy chiqindilar',
      qurilish: 'Qurilish chiqindilari',
      xazon: 'Xazon va shoxlar',
      katta_hajmli: 'Katta hajmli chiqindilar',
      noqonuniy: 'Noqonuniy tashlandiq'
    };

    let categoryList: Array<{ name: string; key: string; value: number; percent: number }> = [];

    if (totalWasteCounted > 0) {
      categoryList = Object.keys(wasteCounts)
        .filter((k) => wasteCounts[k] > 0)
        .map((k) => {
          const val = wasteCounts[k];
          const pct = Math.round((val / totalWasteCounted) * 100);
          return {
            key: k,
            name: categoryNames[k] || k,
            value: val,
            percent: pct
          };
        })
        .sort((a, b) => b.value - a.value);
    }

    // District comparison (for SuperAdmin)
    let districtBreakdown: Array<{
      id: number;
      name: string;
      total: number;
      completed: number;
      active: number;
    }> = [];

    if (!districtId) {
      const districts = await this.districtRepo.find({
        where: { isActive: true },
        order: { id: 'ASC' }
      });
      const districtStats = await this.requestRepo
        .createQueryBuilder('r')
        .select('r.district_id', 'districtId')
        .addSelect('COUNT(*)', 'total')
        .addSelect("COUNT(CASE WHEN r.status = 'completed' THEN 1 END)", 'completed')
        .addSelect(
          "COUNT(CASE WHEN r.status IN ('new', 'in_progress', 'submitted') THEN 1 END)",
          'active'
        )
        .groupBy('r.district_id')
        .getRawMany();

      const map = new Map<number, { total: number; completed: number; active: number }>();
      districtStats.forEach((st) => {
        map.set(Number(st.districtId), {
          total: Number(st.total || 0),
          completed: Number(st.completed || 0),
          active: Number(st.active || 0)
        });
      });

      districtBreakdown = districts.map((d) => {
        const stats = map.get(d.id) || { total: 0, completed: 0, active: 0 };
        return {
          id: d.id,
          name: d.name,
          ...stats
        };
      });
    }

    return {
      overall: {
        total,
        new: newCount,
        inProgress: inProgressCount,
        submitted: submittedCount,
        completed: completedCount,
        rejected: rejectedCount,
        active: newCount + inProgressCount + submittedCount,
        avgResolutionHours
      },
      dailyTrend,
      mahallaBreakdown,
      districtBreakdown,
      categoryBreakdown: wasteCounts,
      categoryList
    };
  }

  async getMyAccountStats(user: JwtPayload, targetAdminId?: number, targetDistrictId?: number) {
    const effectiveAdminId = targetAdminId || (user.id !== 0 ? user.id : undefined);
    let admin = effectiveAdminId
      ? await this.adminRepo.findOne({
          where: { id: effectiveAdminId },
          relations: ['district']
        })
      : null;

    const districtIdForLookup = targetDistrictId ?? (user.districtId || undefined);
    if (!admin && districtIdForLookup) {
      admin = await this.adminRepo.findOne({
        where: { districtId: districtIdForLookup, role: AdminRole.MANAGER },
        relations: ['district']
      });
    }

    let worker: WorkerEntity | null = null;
    if (admin?.workerId) {
      worker = await this.workerRepo.findOne({
        where: { id: admin.workerId },
        relations: ['district']
      });
    }

    const effectiveDistrictId = admin?.districtId || targetDistrictId || user.districtId;

    const qb = this.requestRepo.createQueryBuilder('r');
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

    // Waste type breakdown
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

    // Recent 5 tasks
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
}

