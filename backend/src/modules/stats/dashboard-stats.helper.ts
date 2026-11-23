import { Repository } from 'typeorm';
import { RequestEntity } from '../../database/entities/request.entity';
import { DistrictEntity } from '../../database/entities/district.entity';
import { AdminRole } from '../../database/entities/admin.entity';
import { JwtPayload } from '../auth/types/jwt-payload.type';

export async function computeDashboardStats(
  requestRepo: Repository<RequestEntity>,
  districtRepo: Repository<DistrictEntity>,
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

  const [countsRaw, avgResRaw] = await Promise.all([
    qb
      .select('COUNT(*)', 'total')
      .addSelect("COUNT(CASE WHEN r.status = 'new' THEN 1 END)", 'new')
      .addSelect("COUNT(CASE WHEN r.status = 'in_progress' THEN 1 END)", 'in_progress')
      .addSelect("COUNT(CASE WHEN r.status = 'submitted' THEN 1 END)", 'submitted')
      .addSelect("COUNT(CASE WHEN r.status = 'completed' THEN 1 END)", 'completed')
      .addSelect("COUNT(CASE WHEN r.status = 'rejected' THEN 1 END)", 'rejected')
      .getRawOne(),
    requestRepo
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

  const daysCount = 7;
  const now = new Date();
  const monthsUz = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
  const dateList: Array<{ date: string; dateLabel: string }> = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dateList.push({ date: `${yyyy}-${mm}-${dd}`, dateLabel: `${d.getDate()} ${monthsUz[d.getMonth()]}` });
  }

  const dailyQb = requestRepo
    .createQueryBuilder('r')
    .select("TO_CHAR(r.created_at, 'YYYY-MM-DD')", 'date')
    .addSelect('COUNT(*)', 'total')
    .addSelect("COUNT(CASE WHEN r.status = 'completed' THEN 1 END)", 'completed')
    .addSelect("COUNT(CASE WHEN r.status IN ('new', 'in_progress', 'submitted') THEN 1 END)", 'active')
    .where(districtId ? 'r.district_id = :districtId' : '1=1', { districtId });

  if (startDate) {
    dailyQb.andWhere('r.created_at >= :startDate', { startDate: new Date(startDate) });
  } else {
    dailyQb.andWhere('r.created_at >= :sinceDate', { sinceDate: new Date(now.getTime() - daysCount * 24 * 60 * 60 * 1000) });
  }
  if (endDate) {
    dailyQb.andWhere('r.created_at <= :endDate', { endDate: new Date(endDate) });
  }

  const dailyRaw = await dailyQb.groupBy("TO_CHAR(r.created_at, 'YYYY-MM-DD')").orderBy('date', 'ASC').getRawMany();
  const rawMap = new Map<string, { total: number; completed: number; active: number }>();
  dailyRaw.forEach((row) => {
    rawMap.set(row.date, { total: Number(row.total || 0), completed: Number(row.completed || 0), active: Number(row.active || 0) });
  });

  const dailyTrend = dateList.map((d) => {
    const found = rawMap.get(d.date);
    return { date: d.date, dateLabel: d.dateLabel, total: found?.total || 0, completed: found?.completed || 0, active: found?.active || 0 };
  });

  const mahallaQb = requestRepo
    .createQueryBuilder('r')
    .leftJoin('r.mahalla', 'm')
    .select("COALESCE(r.mahalla_name, m.name, 'Boshqa')", 'name')
    .addSelect('COUNT(*)', 'value')
    .where(districtId ? 'r.district_id = :districtId' : '1=1', { districtId });

  if (startDate) mahallaQb.andWhere('r.created_at >= :startDate', { startDate: new Date(startDate) });
  if (endDate) mahallaQb.andWhere('r.created_at <= :endDate', { endDate: new Date(endDate) });

  const mahallaRaw = await mahallaQb.groupBy("COALESCE(r.mahalla_name, m.name, 'Boshqa')").orderBy('value', 'DESC').limit(10).getRawMany();
  const mahallaBreakdown = mahallaRaw.map((row) => ({ name: row.name, value: Number(row.value || 0) }));

  const wasteQb = requestRepo
    .createQueryBuilder('r')
    .select("COALESCE(r.waste_type, 'maishiy')", 'wasteType')
    .addSelect('COUNT(*)', 'cnt')
    .where(districtId ? 'r.district_id = :districtId' : '1=1', { districtId });

  if (startDate) wasteQb.andWhere('r.created_at >= :startDate', { startDate: new Date(startDate) });
  if (endDate) wasteQb.andWhere('r.created_at <= :endDate', { endDate: new Date(endDate) });

  const wasteRaw = await wasteQb.groupBy("COALESCE(r.waste_type, 'maishiy')").getRawMany();
  const wasteCounts: Record<string, number> = { maishiy: 0, qurilish: 0, xazon: 0, katta_hajmli: 0, noqonuniy: 0 };
  let totalWasteCounted = 0;

  wasteRaw.forEach((row) => {
    const rawType = (row.wasteType || 'maishiy').toLowerCase().trim();
    const count = Number(row.cnt || 0);
    if (wasteCounts[rawType] !== undefined) wasteCounts[rawType] += count;
    else wasteCounts.maishiy += count;
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
      .map((k) => ({ key: k, name: categoryNames[k] || k, value: wasteCounts[k], percent: Math.round((wasteCounts[k] / totalWasteCounted) * 100) }))
      .sort((a, b) => b.value - a.value);
  }

  let districtBreakdown: Array<{ id: number; name: string; total: number; completed: number; active: number }> = [];
  if (!districtId) {
    const districts = await districtRepo.find({ where: { isActive: true }, order: { id: 'ASC' } });
    const districtStats = await requestRepo
      .createQueryBuilder('r')
      .select('r.district_id', 'districtId')
      .addSelect('COUNT(*)', 'total')
      .addSelect("COUNT(CASE WHEN r.status = 'completed' THEN 1 END)", 'completed')
      .addSelect("COUNT(CASE WHEN r.status IN ('new', 'in_progress', 'submitted') THEN 1 END)", 'active')
      .groupBy('r.district_id')
      .getRawMany();

    const map = new Map<number, { total: number; completed: number; active: number }>();
    districtStats.forEach((st) => {
      map.set(Number(st.districtId), { total: Number(st.total || 0), completed: Number(st.completed || 0), active: Number(st.active || 0) });
    });

    districtBreakdown = districts.map((d) => ({ id: d.id, name: d.name, ...(map.get(d.id) || { total: 0, completed: 0, active: 0 }) }));
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
