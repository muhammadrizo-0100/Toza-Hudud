import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

import { useGetDashboardStatsQuery } from '../../api/statsApi';
import { useGetDistrictsQuery } from '../../api/districtsApi';
import FilterBar from '../../components/common/FilterBar';
import AppSelectField from '../../components/common/AppSelectField';
import AppButton from '../../components/common/AppButton';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { useAppSelector } from '../../store/hooks';
import DataTableCard from '../../components/common/DataTableCard';
import { AppTable } from '../../components/common/AppTable';
import { TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const PIE_COLORS = ['#059669', '#F59E0B', '#0284C7', '#8B5CF6', '#EF4444', '#10B981', '#EC4899'];

const renderInnerPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent
}: any) => {
  const pct = percent !== undefined
    ? (percent > 1 ? Math.round(percent) : Math.round(percent * 100))
    : 0;

  if (pct < 6) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#FFFFFF"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={800}
      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}
    >
      {`${pct}%`}
    </text>
  );
};

export const StatsPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SuperAdmin';

  const [districtId, setDistrictId] = useState<number | ''>(() => {
    if (user?.role !== 'SuperAdmin' && user?.districtId) {
      return user.districtId;
    }
    return '';
  });
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('week');

  const { data: districts = [] } = useGetDistrictsQuery();

  const queryParams = useMemo(() => {
    const params: { districtId?: number; startDate?: string; endDate?: string } = {};
    if (districtId) {
      params.districtId = Number(districtId);
    }
    const now = new Date();
    if (dateRange === 'today') {
      params.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (dateRange === 'week') {
      params.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (dateRange === 'month') {
      params.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    return params;
  }, [districtId, dateRange]);

  const { data: stats, isLoading, refetch } = useGetDashboardStatsQuery(queryParams);

  const categoryPieData = useMemo(() => {
    if (!stats || stats?.overall?.total === 0 || !stats?.categoryList || stats.categoryList.length === 0) {
      return [];
    }
    return stats.categoryList.map((item) => ({
      name: item.name,
      value: item.value,
      percent: item.percent
    }));
  }, [stats]);

  const totalCategorySum = useMemo(() => {
    return categoryPieData.reduce((acc, cur) => acc + cur.value, 0);
  }, [categoryPieData]);

  if (isLoading || !stats) {
    return (
      <Box sx={{ py: 12, textAlign: 'center' }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  const { overall, dailyTrend, mahallaBreakdown, districtBreakdown } = stats;

  const completionRate = overall.total > 0 ? Math.round((overall.completed / overall.total) * 100) : 0;

  const statusBarData = [
    { name: 'Yangi', count: overall.new, fill: '#0284C7' },
    { name: 'Jarayonda', count: overall.inProgress, fill: '#F59E0B' },
    { name: 'Tasdiqda', count: overall.submitted, fill: '#6366F1' },
    { name: 'Tozalandi', count: overall.completed, fill: '#10B981' }
  ];

  return (
    <Stack spacing={2.5}>
      <AppBreadcrumbs items={[{ label: 'Tahlil va statistika' }]} />

      {/* Top FilterBar (BSK Screenshot 5 Style) */}
      <FilterBar>
        <Box sx={{ minWidth: { xs: '100%', md: 360 } }}>
          <Typography variant="h4" fontWeight={800}>
            Tahlil va Statistika
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Murojaatlar oqimi, tozalash samaradorligi va hududlar kesimidagi dinamika.
          </Typography>
        </Box>

        <Box sx={{ width: 170 }}>
          <AppSelectField
            label="Davr"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as 'week')}
            options={[
              { value: 'all', label: 'Barcha vaqt' },
              { value: 'today', label: 'Bugun' },
              { value: 'week', label: 'So‘nggi 7 kun' },
              { value: 'month', label: 'So‘nggi 30 kun' }
            ]}
          />
        </Box>

        {isSuperAdmin && (
          <Box sx={{ width: 200 }}>
            <AppSelectField
              label="Tuman"
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value ? Number(e.target.value) : '')}
              options={[
                { value: '', label: 'Barcha tumanlar' },
                ...districts.map((d) => ({ value: d.id, label: d.name }))
              ]}
            />
          </Box>
        )}

        <AppButton
          variant="secondary"
          startIcon={<RefreshIcon fontSize="small" />}
          onClick={() => refetch()}
          sx={{ ml: 'auto' }}
        >
          Yangilash
        </AppButton>
      </FilterBar>

      {/* KPI Cards Row (BSK Style) */}
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }
        }}
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#FFFFFF' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
              <AssignmentOutlinedIcon fontSize="small" />
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              JAMI MUROJAATLAR
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={800}>
            {overall.total}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#FFFFFF' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <CheckCircleOutlinedIcon fontSize="small" />
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              YAKUNLANGAN (TOZALANDI)
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={800} color="#059669">
            {overall.completed}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#FFFFFF' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
              <PlayCircleOutlineOutlinedIcon fontSize="small" />
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              FAOL (JARAYONDA)
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={800} color="#D97706">
            {overall.active}
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#FFFFFF' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' }}>
              <TrendingUpOutlinedIcon fontSize="small" />
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              YECHIM DARAJASI
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={800} color="#BE185D">
            {completionRate}%
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: '#FFFFFF' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(2, 132, 199, 0.1)', color: '#0284C7' }}>
              <AccessTimeOutlinedIcon fontSize="small" />
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              O‘RTACHA BAJARISH
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={800} color="#0284C7">
            {(overall as any).avgResolutionHours && (overall as any).avgResolutionHours > 0
              ? `${(overall as any).avgResolutionHours} soat`
              : '-'}
          </Typography>
        </Paper>
      </Box>

      {/* 2x2 Charts Grid (BSK Screenshot 5 Style) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        {/* 1. Murojaatlar dinamikasi (Curved LineChart) */}
        <DataTableCard sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
            Murojaatlar dinamikasi
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Sariq: Faol muammolar | Ko‘k: Jami tushgan | Yashil: Yakunlangan tozalash
          </Typography>
          <Box sx={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrend} margin={{ top: 12, right: 15, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    fontSize: '0.85rem'
                  }}
                  formatter={(val: any, name: any) => [`${val} ta`, name]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: '0.82rem' }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="active"
                  name="Faol muammo"
                  stroke="#F59E0B"
                  strokeWidth={2.8}
                  dot={{ r: 3, fill: '#F59E0B', strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Jami tushgan"
                  stroke="#0284C7"
                  strokeWidth={2.8}
                  dot={{ r: 3, fill: '#0284C7', strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Yakunlangan"
                  stroke="#10B981"
                  strokeWidth={2.8}
                  dot={{ r: 3, fill: '#10B981', strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </DataTableCard>

        {/* 2. Holatlar nisbati (BarChart) */}
        <DataTableCard sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
            Holatlar nisbati
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Murojaatlarning ijro bosqichlari bo‘yicha taqsimlanishi
          </Typography>
          <Box sx={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBarData} margin={{ top: 12, right: 15, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #E2E8F0' }}
                  formatter={(val: any, name: any) => [`${val} ta`, name]}
                />
                <Bar dataKey="count" name="Arizalar soni" radius={[6, 6, 0, 0]} barSize={36}>
                  {statusBarData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </DataTableCard>

        {/* 3. Yo‘nalishlar bo‘yicha ulush (Donut / PieChart) */}
        <DataTableCard sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
            Yo‘nalishlar bo‘yicha ulush
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Kategoriyalar nisbati (Jami: {totalCategorySum} ta)
          </Typography>
          {totalCategorySum === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 290, width: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                Hozircha chiqindi toifalari bo‘yicha arizalar mavjud emas
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                height: 290,
                width: '100%',
                gap: 1.5
              }}
            >
              {/* Donut Chart with clean inner percentage & center counter */}
              <Box sx={{ flex: 1, height: '100%', minWidth: 0, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={3}
                      dataKey="value"
                      label={renderInnerPieLabel}
                      labelLine={false}
                    >
                      {categoryPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    {/* Markaziy umumiy hisob ko'rsatkichi */}
                    <text
                      x="50%"
                      y="46%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#0F172A"
                      fontSize={22}
                      fontWeight={800}
                    >
                      {totalCategorySum}
                    </text>
                    <text
                      x="50%"
                      y="58%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#64748B"
                      fontSize={11}
                      fontWeight={700}
                    >
                      Jami arizalar
                    </text>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} ta`, name]}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              {/* Dedicated Legend Column: Hech qanday qisqartirishsiz to'liq nomlar */}
              <Stack spacing={1.25} sx={{ width: { xs: '100%', sm: 240 }, pr: 0.5, flexShrink: 0 }}>
                {categoryPieData.map((item, idx) => {
                  const color = PIE_COLORS[idx % PIE_COLORS.length];
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.75,
                        px: 1.25,
                        borderRadius: 2,
                        bgcolor: '#F8FAFC',
                        border: '1px solid #F1F5F9',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: '#F1F5F9',
                          borderColor: '#E2E8F0'
                        }
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0, mr: 1 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '3px',
                            bgcolor: color,
                            flexShrink: 0
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            color: '#334155',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.name}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#0F172A',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.value} ta ({item.percent}%)
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
        </DataTableCard>

        {/* 4. Tumanlar kesimi bo‘yicha yuklama (Horizontal BarChart) */}
        <DataTableCard sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
            Tumanlar kesimi bo‘yicha yuklama
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Tuman sanitar bo‘limlari o‘rtasidagi yuklama solishtiruvi
          </Typography>
          <Box sx={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={districtBreakdown}
                layout="vertical"
                margin={{ top: 10, right: 20, bottom: 5, left: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#334155' }} width={110} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }} />
                <Legend wrapperStyle={{ paddingTop: 8, fontSize: '0.8rem' }} />
                <Bar dataKey="total" name="Jami arizalar" fill="#0284C7" radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="completed" name="Tozalangan" fill="#10B981" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </DataTableCard>
      </Box>

      {/* Top Mahallalar Jadvali */}
      <DataTableCard>
        <Box sx={{ px: 1, pb: 1.5 }}>
          <Typography variant="h5" fontWeight={800}>
            Eng ko‘p ariza tushgan mahallalar reytingi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sanitar tozalash ehtiyoji yuqori bo‘lgan mahallalar ko‘rsatkichlari
          </Typography>
        </Box>
        <AppTable>
          <TableHead>
            <TableRow>
              <TableCell>O‘rin</TableCell>
              <TableCell>Mahalla nomi</TableCell>
              <TableCell align="center">Murojaatlar soni</TableCell>
              <TableCell align="center">Ulush</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mahallaBreakdown.slice(0, 7).map((m, idx) => {
              const share = overall.total > 0 ? Math.round((m.value / overall.total) * 100) : 0;
              return (
                <TableRow key={idx} hover>
                  <TableCell sx={{ fontWeight: 800 }}>#{idx + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{m.name}</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      color={idx === 0 ? 'error' : idx === 1 ? 'warning' : 'default'}
                      label={m.value}
                      sx={{ fontWeight: 800, minWidth: 36 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      {share}%
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </AppTable>
      </DataTableCard>
    </Stack>
  );
};

export default StatsPage;
