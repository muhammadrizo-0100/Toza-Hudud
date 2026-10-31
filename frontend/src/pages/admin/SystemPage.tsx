import React, { useState, useMemo, useRef } from 'react';
import {
  Box,
  Stack,
  Typography,
  Paper,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Pagination,
  LinearProgress
} from '@mui/material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useNavigate } from 'react-router-dom';

import { useGetSystemInsightsQuery, SystemInsightsResponse } from '../../api/statsApi';
import { useGetDistrictsQuery } from '../../api/districtsApi';
import FilterBar from '../../components/common/FilterBar';
import AppSelectField from '../../components/common/AppSelectField';
import AppButton from '../../components/common/AppButton';
import DataTableCard from '../../components/common/DataTableCard';
import { AppTable } from '../../components/common/AppTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAppSelector } from '../../store/hooks';
import { useToast } from '../../context/ToastContext';

const DISTRICTS_PER_PAGE = 5;
const NEIGHBORHOODS_PER_PAGE = 5;
const RECENT_PER_PAGE = 5;

export const SystemPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { showSuccess } = useToast();
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isManager = user?.role === 'Manager';

  const [districtFilter, setDistrictFilter] = useState<number | ''>(() => {
    if (user?.role !== 'SuperAdmin' && user?.districtId) {
      return user.districtId;
    }
    return '';
  });
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Pagination states
  const [districtsPage, setDistrictsPage] = useState(1);
  const [neighborhoodsPage, setNeighborhoodsPage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);

  // Compute date filter ISO strings
  const dateFilterParams = useMemo(() => {
    if (dateRange === 'today') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      return { startDate: start };
    }
    if (dateRange === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { startDate: d.toISOString() };
    }
    if (dateRange === 'month') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { startDate: d.toISOString() };
    }
    return {};
  }, [dateRange]);

  const queryParams = useMemo(() => ({
    districtId: districtFilter ? Number(districtFilter) : undefined,
    ...dateFilterParams
  }), [districtFilter, dateFilterParams]);

  const { data: districts = [] } = useGetDistrictsQuery();
  const { data: insights, isLoading, isFetching, refetch } = useGetSystemInsightsQuery(queryParams);

  // Keep last known good data to prevent entire page unmounting/re-drawing on filter change
  const prevInsightsRef = useRef<SystemInsightsResponse | null>(null);
  if (insights) {
    prevInsightsRef.current = insights;
  }
  const activeInsights = insights || prevInsightsRef.current;

  const overview = activeInsights?.overview;
  const districtCards = activeInsights?.districtCards || [];
  const topNeighborhoods = activeInsights?.topNeighborhoods || [];
  const recentRequests = activeInsights?.recentRequests || [];

  // Paginated slices
  const paginatedDistricts = useMemo(() => {
    const start = (districtsPage - 1) * DISTRICTS_PER_PAGE;
    return districtCards.slice(start, start + DISTRICTS_PER_PAGE);
  }, [districtCards, districtsPage]);
  const totalDistrictsPages = Math.ceil(districtCards.length / DISTRICTS_PER_PAGE) || 1;

  const paginatedNeighborhoods = useMemo(() => {
    const start = (neighborhoodsPage - 1) * NEIGHBORHOODS_PER_PAGE;
    return topNeighborhoods.slice(start, start + NEIGHBORHOODS_PER_PAGE);
  }, [topNeighborhoods, neighborhoodsPage]);
  const totalNeighborhoodsPages = Math.ceil(topNeighborhoods.length / NEIGHBORHOODS_PER_PAGE) || 1;

  const paginatedRecentRequests = useMemo(() => {
    const start = (recentPage - 1) * RECENT_PER_PAGE;
    return recentRequests.slice(start, start + RECENT_PER_PAGE);
  }, [recentRequests, recentPage]);
  const totalRecentPages = Math.ceil(recentRequests.length / RECENT_PER_PAGE) || 1;

  // Only show full loader on initial mount if there is no data at all yet
  if (isLoading && !activeInsights) {
    return (
      <Box sx={{ py: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          Ma‘lumotlar yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  if (!overview) {
    return (
      <Box sx={{ py: 16, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary" fontWeight={600}>
          Ma‘lumot topilmadi
        </Typography>
      </Box>
    );
  }

  const pageTitle = isManager
    ? `${user?.district?.name || 'Tuman'} Tozalik Boshqaruvi Markazi`
    : 'Viloyat Boshqaruv Markazi';

  const pageSubtitle = isManager
    ? 'Tumaningizdagi mahalla, xodim va murojaatlar bo‘yicha jamlangan boshqaruv ko‘rinishi'
    : 'Tuman, mahalla, xodim va murojaatlar bo‘yicha jamlangan boshqaruv ko‘rinishi';

  return (
    <Stack spacing={2.5} sx={{ position: 'relative' }}>
      {/* Top subtle indicator during filter fetch - no layout shifts */}
      {isFetching && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: -16,
            left: 0,
            right: 0,
            height: 3,
            borderRadius: 2,
            zIndex: 10,
            bgcolor: 'transparent',
            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' }
          }}
        />
      )}

      {/* 1. Top Filter Bar */}
      <FilterBar>
        <Box sx={{ minWidth: { xs: '100%', md: 360 } }}>
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#0F172A' }}>
            {pageTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.84rem' }}>
            {pageSubtitle}
          </Typography>
        </Box>

        <Box sx={{ width: 170 }}>
          <AppSelectField
            label="Davr"
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value as 'all');
              setDistrictsPage(1);
              setNeighborhoodsPage(1);
              setRecentPage(1);
            }}
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
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value ? Number(e.target.value) : '');
                setDistrictsPage(1);
                setNeighborhoodsPage(1);
                setRecentPage(1);
              }}
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
          onClick={() => {
            refetch();
            showSuccess('Ma’lumotlar yangilandi');
          }}
          sx={{ ml: 'auto' }}
        >
          Yangilash
        </AppButton>
      </FilterBar>

      {/* 2. Dashboard Content Container */}
      <Box sx={{ opacity: isFetching ? 0.8 : 1, transition: 'opacity 0.2s ease', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Primary KPI Executive Cards (Chrono desk style) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 2
          }}
        >
        {/* KPI 1: Jami Murojaatlar */}
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.85rem' }}>
              Jami murojaatlar
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AssignmentOutlinedIcon sx={{ fontSize: 19 }} />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5, fontSize: '1.75rem' }}>
            {overview.totalRequests}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>
            Barcha kelib tushgan murojaatlar
          </Typography>
        </Paper>

        {/* KPI 2: Faol murojaatlar (with sub-chips) */}
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.85rem' }}>
              Faol murojaatlar
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: '#FFFBEB',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PlayCircleOutlineOutlinedIcon sx={{ fontSize: 19 }} />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#D97706', mb: 1, fontSize: '1.75rem' }}>
            {overview.activeRequests}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            <Chip
              size="small"
              label={`Yangi: ${overview.newRequests}`}
              sx={{
                height: 20,
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: '6px',
                bgcolor: '#EFF6FF',
                color: '#1D4ED8'
              }}
            />
            <Chip
              size="small"
              label={`Jarayonda: ${overview.inProgressRequests}`}
              sx={{
                height: 20,
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: '6px',
                bgcolor: '#FFFBEB',
                color: '#B45309'
              }}
            />
            <Chip
              size="small"
              label={`Tasdiqda: ${overview.submittedRequests}`}
              sx={{
                height: 20,
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: '6px',
                bgcolor: '#F5F3FF',
                color: '#6D28D9'
              }}
            />
          </Box>
        </Paper>

        {/* KPI 3: Tozalandi (Bajarildi) */}
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.85rem' }}>
              Muvaffaqiyatli tozalandi
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircleOutlinedIcon sx={{ fontSize: 19 }} />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', mb: 0.5, fontSize: '1.75rem' }}>
            {overview.completedRequests}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>
            Xodimlar tomonidan bajarilgan va tasdiqlangan
          </Typography>
        </Paper>

        {/* KPI 4: Hal etish samaradorligi */}
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748B', fontSize: '0.85rem' }}>
              Yechim darajasi
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: '#EEF2FF',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TrendingUpOutlinedIcon sx={{ fontSize: 19 }} />
            </Box>
          </Box>
          <Box sx={{ mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#4F46E5', fontSize: '1.75rem' }}>
              {overview.completionRate}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={overview.completionRate}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: '#EEF2FF',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#4F46E5',
                borderRadius: 3
              }
            }}
          />
        </Paper>
      </Box>

      {/* 3. Unified Infrastructure & Resources Strip */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.25 },
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '1rem' }}>
            Hududiy resurslar va infratuzilma quvvati
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
            Boshqaruvdagi tumanlar, mahallalar, xodimlar va maxsus texnikalar umumiy soni
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(6, 1fr)'
            },
            gap: 1.5
          }}
        >
          {/* Tumanlar */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: 2.5,
              bgcolor: '#F8FAFC',
              border: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <BusinessOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                Tumanlar
              </Typography>
              <Typography variant="h5" fontWeight={800} color="#0F172A">
                {overview.totalDistricts}
              </Typography>
            </Box>
          </Box>

          {/* Mahallalar */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: 2.5,
              bgcolor: '#F8FAFC',
              border: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <LocationOnOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                Mahallalar
              </Typography>
              <Typography variant="h5" fontWeight={800} color="#0F172A">
                {overview.totalNeighborhoods}
              </Typography>
            </Box>
          </Box>

          {/* Dispetcherlar */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: 2.5,
              bgcolor: '#F8FAFC',
              border: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: '#F5F3FF',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <SupervisorAccountOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                Dispetcherlar
              </Typography>
              <Typography variant="h5" fontWeight={800} color="#0F172A">
                {overview.totalManagers}
              </Typography>
            </Box>
          </Box>

          {/* Ishchi xodimlar */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: 2.5,
              bgcolor: '#F8FAFC',
              border: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <GroupsOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                Xodimlar
              </Typography>
              <Typography variant="h5" fontWeight={800} color="#0F172A">
                {overview.totalWorkers}
              </Typography>
            </Box>
          </Box>

          {/* Maxsus texnikalar */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: 2.5,
              bgcolor: '#F8FAFC',
              border: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: '#FFFBEB',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <LocalShippingOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                Maxsus texnikalar
              </Typography>
              <Typography variant="h5" fontWeight={800} color="#0F172A">
                {overview.totalVehicles}
              </Typography>
            </Box>
          </Box>

          {/* Fuqarolar */}
          <Box
            sx={{
              p: 1.75,
              borderRadius: 2.5,
              bgcolor: '#F8FAFC',
              border: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: '#F0FDFA',
                color: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <PeopleOutlineOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                Fuqarolar
              </Typography>
              <Typography variant="h5" fontWeight={800} color="#0F172A">
                {overview.totalClients}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* 4. Tumanlar faoliyati monitoringi */}
      <DataTableCard>
        <Box sx={{ px: 0.5, pb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>
            Tumanlar faoliyati monitoringi
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
            Hududiy sanitar bo‘limlar, texnika quvvati va tozalash samaradorligi ko‘rsatkichlari.
          </Typography>
        </Box>

        <AppTable minWidth={850}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 60 }}>ID</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Tuman nomi</TableCell>
              <TableCell align="center">Faol arizalar</TableCell>
              <TableCell align="center">Tozalandi</TableCell>
              <TableCell align="center">Jami arizalar</TableCell>
              <TableCell align="center">Biriktirilgan brigadalar</TableCell>
              <TableCell align="center">Maxsus texnikalar</TableCell>
              <TableCell align="center">Yechim darajasi</TableCell>
              <TableCell align="right" sx={{ width: 100 }}>Harakat</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedDistricts.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>#{d.id}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{d.name}</TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    color={d.activeRequests > 0 ? 'warning' : 'default'}
                    label={d.activeRequests}
                    sx={{ fontWeight: 700, minWidth: 36 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography fontWeight={700} color="success.main">
                    {d.completedRequests}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {d.totalRequests}
                </TableCell>
                <TableCell align="center">{d.workersCount} nafar</TableCell>
                <TableCell align="center">{d.vehiclesCount} ta</TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    color={d.completionRate >= 80 ? 'success' : d.completionRate >= 50 ? 'warning' : 'default'}
                    label={`${d.completionRate}%`}
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <AppButton
                    variant="action"
                    size="small"
                    onClick={() => navigate(`/admin/requests?districtId=${d.id}`)}
                  >
                    Arizalar
                  </AppButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AppTable>

        {/* Tumanlar pagination footer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 2,
            px: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            mt: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Jami: <strong>{districtCards.length}</strong> ta tuman
          </Typography>
          <Pagination
            count={totalDistrictsPages}
            page={districtsPage}
            onChange={(_, val) => setDistrictsPage(val)}
            color="primary"
            shape="rounded"
            size="small"
          />
        </Box>
      </DataTableCard>

      {/* 5. Row 5: Top Mahallalar va Operativ arizalar nazorati (Optimized, no horizontal scroll, with pagination) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        {/* Top Mahallalar */}
        <DataTableCard sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ px: 0.5, pb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>
                Eng faol mahallalar
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                Aholi tomonidan eng ko‘p ariza tushayotgan hududlar
              </Typography>
            </Box>

            <AppTable minWidth="100%">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '40%' }}>Mahalla</TableCell>
                  <TableCell sx={{ width: '30%' }}>Tuman</TableCell>
                  <TableCell align="center" sx={{ width: '15%' }}>Faol</TableCell>
                  <TableCell align="center" sx={{ width: '15%' }}>Jami</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedNeighborhoods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Ma‘lumot topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedNeighborhoods.map((m) => (
                    <TableRow key={m.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{m.name}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{m.districtName}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          color={m.activeRequests > 0 ? 'warning' : 'default'}
                          label={m.activeRequests}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        {m.totalRequests}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </AppTable>
          </Box>

          {/* Mahallalar pagination footer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pt: 2,
              px: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
              mt: 2
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Jami: <strong>{topNeighborhoods.length}</strong> ta mahalla
            </Typography>
            <Pagination
              count={totalNeighborhoodsPages}
              page={neighborhoodsPage}
              onChange={(_, val) => setNeighborhoodsPage(val)}
              color="primary"
              shape="rounded"
              size="small"
            />
          </Box>
        </DataTableCard>

        {/* Operativ arizalar nazorati */}
        <DataTableCard sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ px: 0.5, pb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.05rem' }}>
                Operativ arizalar nazorati
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                Tizimga eng oxirgi kelib tushgan arizalar
              </Typography>
            </Box>

            <AppTable minWidth="100%">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '12%' }}>ID</TableCell>
                  <TableCell sx={{ width: '46%' }}>Fuqaro / Mahalla</TableCell>
                  <TableCell sx={{ width: '22%' }}>Holati</TableCell>
                  <TableCell align="right" sx={{ width: '20%' }}>Harakat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRecentRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Arizalar mavjud emas
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecentRequests.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        #{r.id}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                          {r.mahallaName || 'Mahalla ko‘rsatilmagan'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                          {r.citizenFullName || 'Noma‘lum'} • {r.citizenPhone || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <AppButton
                          variant="action"
                          size="small"
                          startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                          onClick={() => navigate(`/admin/requests?requestId=${r.id}`)}
                        >
                          Ko‘rish
                        </AppButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </AppTable>
          </Box>

          {/* Operativ arizalar pagination footer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pt: 2,
              px: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
              mt: 2
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Jami: <strong>{recentRequests.length}</strong> ta operativ ariza
            </Typography>
            <Pagination
              count={totalRecentPages}
              page={recentPage}
              onChange={(_, val) => setRecentPage(val)}
              color="primary"
              shape="rounded"
              size="small"
            />
          </Box>
        </DataTableCard>
      </Box>
      </Box>
    </Stack>
  );
};

export default SystemPage;
