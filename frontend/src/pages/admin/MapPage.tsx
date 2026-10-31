import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  Typography,
  Chip,
  Paper,
  Divider,
  Button,
  TextField,
  Popover
} from '@mui/material';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';

import { useGetMapPointsQuery, useGetRequestByIdQuery } from '../../api/requestsApi';
import { useGetDistrictsQuery } from '../../api/districtsApi';
import { WasteMapCanvas, MapStyleType, LayerModeType } from '../../components/map/WasteMapCanvas';
import { RequestDetailDrawer } from '../../components/requests/RequestDetailDrawer';
import DataTableCard from '../../components/common/DataTableCard';
import AppSelectField from '../../components/common/AppSelectField';
import AppButton from '../../components/common/AppButton';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RequestStatus } from '../../types';
import { useAppSelector } from '../../store/hooks';

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SuperAdmin';

  const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>(() => {
    if (user?.role !== 'SuperAdmin' && user?.districtId) {
      return user.districtId;
    }
    return '';
  });
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [mapStyle, setMapStyle] = useState<MapStyleType>('osm');
  const [layerMode, setLayerMode] = useState<LayerModeType>('markers');
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'custom' | 'all'>('24h');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [customPopoverAnchor, setCustomPopoverAnchor] = useState<HTMLElement | null>(null);

  const [inspectId, setInspectId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: districts = [] } = useGetDistrictsQuery();
  const { data: rawPoints = [], refetch } = useGetMapPointsQuery({
    districtId: selectedDistrictId ? Number(selectedDistrictId) : undefined
  });

  const { data: inspectingRequest } = useGetRequestByIdQuery(Number(inspectId), {
    skip: !inspectId
  });

  const filteredPoints = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    return rawPoints.filter((point) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'new') {
          // 'Faol muammo' includes new, in_progress, submitted
          if (point.status === 'completed' || point.status === 'rejected') return false;
        } else if (point.status !== statusFilter) {
          return false;
        }
      }

      // 2. Active (unresolved) problems ALWAYS stay visible on map
      const isActive = point.status !== 'completed' && point.status !== 'rejected';
      if (isActive) {
        return true;
      }

      // 3. Completed problems: Filter by completion date (or createdAt if completedAt not available)
      const completedTime = point.completedAt
        ? new Date(point.completedAt).getTime()
        : new Date(point.createdAt).getTime();

      if (dateRange === '24h') {
        return now - completedTime <= oneDayMs;
      }

      if (dateRange === '7d') {
        return now - completedTime <= sevenDaysMs;
      }

      if (dateRange === '30d') {
        return now - completedTime <= thirtyDaysMs;
      }

      if (dateRange === 'custom') {
        if (!customStartDate && !customEndDate) return true;
        const start = customStartDate ? new Date(customStartDate).setHours(0, 0, 0, 0) : 0;
        const end = customEndDate ? new Date(customEndDate).setHours(23, 59, 59, 999) : Number.MAX_SAFE_INTEGER;
        return completedTime >= start && completedTime <= end;
      }

      // 'all' -> show all completed
      return true;
    });
  }, [rawPoints, statusFilter, dateRange, customStartDate, customEndDate]);

  const legendStats = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const activeCount = rawPoints.filter(
      (p) => p.status === 'new' || p.status === 'in_progress' || p.status === 'submitted'
    ).length;
    const completed24h = rawPoints.filter((p) => {
      if (p.status !== 'completed') return false;
      const t = p.completedAt ? new Date(p.completedAt).getTime() : new Date(p.createdAt).getTime();
      return now - t <= oneDayMs;
    }).length;
    const completedVisible = filteredPoints.filter((p) => p.status === 'completed').length;
    const completedTotal = rawPoints.filter((p) => p.status === 'completed').length;

    return {
      all: filteredPoints.length,
      rawTotal: rawPoints.length,
      active: activeCount,
      completedVisible,
      completedTotal,
      completed24h,
      archivedHidden: Math.max(0, completedTotal - completedVisible)
    };
  }, [rawPoints, filteredPoints]);

  const handleSelectMarker = useCallback((id: number) => {
    setInspectId(id);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <AppBreadcrumbs items={[{ label: 'Chiqindi xaritasi' }]} />

      {/* Top Map Controls Card (BSK Screenshot 4 Style) */}
      <DataTableCard sx={{ p: { xs: 2, md: 2.25 } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
            gap={2}
          >
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Mahallalar va Chiqindi Nuqtalari Xaritasi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Marker ranglari hududdagi tozalik darajasi va chiqindi holatini ifodalaydi.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        {isSuperAdmin && (
          <Box sx={{ width: 170 }}>
            <AppSelectField
              label="Tuman"
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value ? Number(e.target.value) : '')}
              options={[
                { value: '', label: 'Barcha tumanlar' },
                ...districts.map((d) => ({ value: d.id, label: d.name }))
              ]}
            />
          </Box>
        )}

              <Box sx={{ width: 155 }}>
                <AppSelectField
                  label="Xarita uslubi"
                  value={mapStyle}
                  onChange={(e) => setMapStyle(e.target.value as MapStyleType)}
                  options={[
                    { value: 'osm', label: 'Standart (OSM)' },
                    { value: 'light', label: 'Yengil (CARTO)' },
                    { value: 'satellite', label: 'Yo‘ldosh (Sputnik)' }
                  ]}
                />
              </Box>

              <Box sx={{ width: 165 }}>
                <AppSelectField
                  label="Qatlam"
                  value={layerMode}
                  onChange={(e) => setLayerMode(e.target.value as LayerModeType)}
                  options={[
                    { value: 'markers', label: 'Faqat markerlar' },
                    { value: 'heat', label: 'Issiqlik (Heatmap)' },
                    { value: 'both', label: 'Marker + Issiqlik' }
                  ]}
                />
              </Box>

              <AppButton
                variant="secondary"
                startIcon={<RestartAltOutlinedIcon fontSize="small" />}
                onClick={() => {
                  if (isSuperAdmin) setSelectedDistrictId('');
                  setStatusFilter('all');
                  setDateRange('24h');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setTempStartDate('');
                  setTempEndDate('');
                  setMapStyle('osm');
                  setLayerMode('markers');
                  setInspectId(null);
                  setResetTrigger((prev) => prev + 1);
                  refetch();
                }}
              >
                Tiklash
              </AppButton>
            </Stack>
          </Stack>

          <Divider sx={{ borderStyle: 'dashed' }} />

          {/* Legend and Filter Bar */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ md: 'center' }}
            justifyContent="space-between"
            gap={1.5}
            flexWrap="wrap"
          >
            {/* Legend Chips with Colored Dots */}
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Chip
                label={`Jami nuqtalar: ${legendStats.all}`}
                icon={<LayersOutlinedIcon fontSize="small" />}
                variant={statusFilter === 'all' ? 'filled' : 'outlined'}
                onClick={() => setStatusFilter('all')}
                sx={{ fontWeight: 700, borderRadius: 2, cursor: 'pointer' }}
              />

              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                  cursor: 'pointer',
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: statusFilter === 'new' ? 'rgba(220, 38, 38, 0.12)' : 'transparent',
                  border: '1px solid',
                  borderColor: statusFilter === 'new' ? '#DC2626' : 'divider'
                }}
                onClick={() => setStatusFilter(statusFilter === 'new' ? 'all' : 'new')}
              >
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#DC2626' }} />
                <Typography variant="caption" fontWeight={700} color="text.primary">
                  Sariq/Qizil: Faol muammo ({legendStats.active})
                </Typography>
              </Stack>

              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                  cursor: 'pointer',
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: statusFilter === 'completed' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  border: '1px solid',
                  borderColor: statusFilter === 'completed' ? '#10B981' : 'divider'
                }}
                onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
              >
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10B981' }} />
                <Typography variant="caption" fontWeight={700} color="text.primary">
                  Yashil: Tozalangan ({legendStats.completedVisible})
                </Typography>
              </Stack>
            </Stack>

            {/* Date range filter */}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                Davr:
              </Typography>
              <Chip
                size="small"
                label="So‘nggi 24 soat (Operativ)"
                variant={dateRange === '24h' ? 'filled' : 'outlined'}
                color={dateRange === '24h' ? 'primary' : 'default'}
                onClick={() => setDateRange('24h')}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                size="small"
                label="So‘nggi 7 kun"
                variant={dateRange === '7d' ? 'filled' : 'outlined'}
                color={dateRange === '7d' ? 'primary' : 'default'}
                onClick={() => setDateRange('7d')}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                size="small"
                label="So‘nggi 30 kun"
                variant={dateRange === '30d' ? 'filled' : 'outlined'}
                color={dateRange === '30d' ? 'primary' : 'default'}
                onClick={() => setDateRange('30d')}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                size="small"
                icon={<CalendarMonthOutlinedIcon fontSize="small" />}
                label={
                  dateRange === 'custom' && (customStartDate || customEndDate)
                    ? `${customStartDate || '...'} / ${customEndDate || '...'}`
                    : 'Oraliq sana...'
                }
                variant={dateRange === 'custom' ? 'filled' : 'outlined'}
                color={dateRange === 'custom' ? 'primary' : 'default'}
                onClick={(e) => {
                  setTempStartDate(customStartDate);
                  setTempEndDate(customEndDate);
                  setCustomPopoverAnchor(e.currentTarget);
                }}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                size="small"
                label="Barcha vaqt"
                variant={dateRange === 'all' ? 'filled' : 'outlined'}
                color={dateRange === 'all' ? 'primary' : 'default'}
                onClick={() => setDateRange('all')}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Stack>

          {/* Operational Mode & Date Range Helper Banners */}
          {dateRange === '24h' && legendStats.archivedHidden > 0 && (
            <Box
              sx={{
                px: 2,
                py: 1,
                borderRadius: 1.5,
                bgcolor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                ⚡ <b>Operativ rejim faol:</b> Xarita doimo toza va operativ bo‘lishi uchun so‘nggi 24 soat ichida tozalangan nuqtalar ko‘rsatilmoqda. 24 soatdan oshgan <b>{legendStats.archivedHidden} ta</b> tozalangan murojaat xaritada yashirildi (baza va hisobotlarda to‘liq saqlanmoqda).
              </Typography>
              <Button
                size="small"
                variant="text"
                sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', p: 0, minWidth: 'auto', textTransform: 'none' }}
                onClick={() => setDateRange('all')}
              >
                Barcha arxivni ko‘rish →
              </Button>
            </Box>
          )}

          {dateRange === 'custom' && (customStartDate || customEndDate) && (
            <Box
              sx={{
                px: 2,
                py: 1,
                borderRadius: 1.5,
                bgcolor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 600 }}>
                📅 Tanlangan oraliq davr: <b>{customStartDate || 'Boshidan'}</b> dan <b>{customEndDate || 'Hozirgacha'}</b> gacha tozalangan nuqtalar ({legendStats.completedVisible} ta ko‘rinmoqda).
              </Typography>
              <Button
                size="small"
                variant="text"
                sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', p: 0, minWidth: 'auto', textTransform: 'none' }}
                onClick={() => {
                  setDateRange('24h');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
              >
                Operativ (24 soat) rejimga qaytish
              </Button>
            </Box>
          )}

          {dateRange === 'all' && (
            <Box
              sx={{
                px: 2,
                py: 1,
                borderRadius: 1.5,
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                🗂️ <b>To‘liq arxiv rejimi:</b> Tizimdagi barcha tozalangan va faol muammolar to‘liq xaritada ({legendStats.all} ta).
              </Typography>
              <Button
                size="small"
                variant="text"
                sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', p: 0, minWidth: 'auto', textTransform: 'none' }}
                onClick={() => setDateRange('24h')}
              >
                Operativ (24 soat) rejimga qaytish
              </Button>
            </Box>
          )}

          {/* Popover for Custom Date Range Picker */}
          <Popover
            open={Boolean(customPopoverAnchor)}
            anchorEl={customPopoverAnchor}
            onClose={() => setCustomPopoverAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { p: 2.5, width: 320, borderRadius: 2.5, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' } }}
          >
            <Stack spacing={2}>
              <Typography variant="subtitle2" fontWeight={700}>
                Vaqt oralig‘ini belgilash
              </Typography>
              <TextField
                size="small"
                type="date"
                label="Boshlanish sanasi"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                size="small"
                type="date"
                label="Tugash sanasi"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  onClick={() => {
                    setTempStartDate('');
                    setTempEndDate('');
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setDateRange('24h');
                    setCustomPopoverAnchor(null);
                  }}
                >
                  Tozalash
                </Button>
                <AppButton
                  size="small"
                  variant="primary"
                  onClick={() => {
                    setCustomStartDate(tempStartDate);
                    setCustomEndDate(tempEndDate);
                    setDateRange('custom');
                    setCustomPopoverAnchor(null);
                  }}
                >
                  Qo‘llash
                </AppButton>
              </Stack>
            </Stack>
          </Popover>
        </Stack>
      </DataTableCard>

      {/* Main Map Content with Side Detail Card (Screenshot 4 Style) */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: inspectId ? '1fr 340px' : '1fr' },
          minHeight: 520,
          height: { xs: 480, md: 540 }
        }}
      >
        {/* Map Canvas */}
        <Box
          sx={{
            height: '100%',
            borderRadius: 3.5,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 0 2px rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)'
          }}
        >
          <WasteMapCanvas
            points={filteredPoints}
            district={districts.find((d) => d.id === Number(selectedDistrictId)) || null}
            districts={districts}
            selectedId={inspectId}
            mapStyle={mapStyle}
            layerMode={layerMode}
            resetTrigger={resetTrigger}
            onSelectRequest={handleSelectMarker}
            onSelectDistrict={(id) => setSelectedDistrictId(id)}
          />
        </Box>

        {/* Side Floating "Hudud tafsiloti" Panel */}
        {inspectId && inspectingRequest && (
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3.5,
              bgcolor: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              overflowY: 'auto',
              boxShadow: '0 0 2px rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)'
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={800}>
                Hudud tafsiloti
              </Typography>
              <Button
                size="small"
                color="inherit"
                onClick={() => setInspectId(null)}
                sx={{ fontSize: '0.75rem', fontWeight: 700 }}
              >
                Yopish
              </Button>
            </Stack>

            <Divider />

            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PlaceOutlinedIcon fontSize="small" color="primary" />
                <Typography variant="body2" fontWeight={800}>
                  {inspectingRequest.mahalla?.name || 'Mahalla ko‘rsatilmagan'}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {inspectingRequest.address || 'Manzil yozilmagan'}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Murojaat holati:
              </Typography>
              <StatusBadge status={inspectingRequest.status} />
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Tuman:
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {inspectingRequest.district?.name || '-'}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Biriktirilgan xodim:
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {inspectingRequest.assignedWorker?.fullName || 'Biriktirilmagan'}
              </Typography>
            </Stack>

            {/* Before Photo Preview */}
            {inspectingRequest.beforePhotoUrl && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                  Chiqindi fotosurati:
                </Typography>
                <Box
                  component="img"
                  src={inspectingRequest.beforePhotoUrl}
                  alt="Chiqindi surati"
                  sx={{
                    width: '100%',
                    height: 160,
                    objectFit: 'cover',
                    borderRadius: 2.5,
                    border: '1px solid #E2E8F0'
                  }}
                />
              </Box>
            )}

            <AppButton
              variant="primary"
              fullWidth
              startIcon={<VisibilityOutlinedIcon fontSize="small" />}
              onClick={() => navigate(`/admin/requests?requestId=${inspectingRequest.id}`)}
              sx={{ mt: 'auto' }}
            >
              Batafsil ko‘rish
            </AppButton>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default MapPage;
