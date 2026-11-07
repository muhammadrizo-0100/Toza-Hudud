import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Pagination,
  CircularProgress,
  Fab,
  Tooltip,
  LinearProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

import { useGetRequestsQuery, RequestsResponse } from '../../api/requestsApi';
import { useGetDistrictsQuery } from '../../api/districtsApi';
import { useGetMahallasQuery } from '../../api/mahallasApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ManualRequestModal } from '../../components/requests/ManualRequestModal';
import RequestDetailPage from './RequestDetailPage';
import DataTableCard from '../../components/common/DataTableCard';
import FilterBar from '../../components/common/FilterBar';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import AppSelectField from '../../components/common/AppSelectField';
import { AppTable } from '../../components/common/AppTable';
import AppButton from '../../components/common/AppButton';
import { RequestStatus } from '../../types';

function formatDateTime(dateStr: string) {
  if (!dateStr) return { date: '-', time: '' };
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function getWasteTypeBadge(type?: string | null) {
  switch (type) {
    case 'qurilish':
      return { label: 'Qurilish chiqindisi', color: '#B45309', bgcolor: '#FEF3C7', border: '#FDE68A' };
    case 'xazon':
      return { label: 'Xazon va shoxlar', color: '#15803D', bgcolor: '#DCFCE7', border: '#BBF7D0' };
    case 'katta_hajmli':
      return { label: 'Katta hajmli', color: '#6D28D9', bgcolor: '#EDE9FE', border: '#DDD6FE' };
    case 'noqonuniy':
      return { label: 'Noqonuniy tashlandiq', color: '#B91C1C', bgcolor: '#FEE2E2', border: '#FECACA' };
    case 'maishiy':
    default:
      return { label: 'Maishiy chiqindi', color: '#0369A1', bgcolor: '#E0F2FE', border: '#BAE6FD' };
  }
}

export const RequestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRequestId = searchParams.get('requestId');

  const [activeRequestId, setActiveRequestId] = useState<number | null>(() => {
    return urlRequestId ? Number(urlRequestId) : null;
  });

  const { user } = useAppSelector((state) => state.auth);
  const isSuperAdmin = user?.role === 'SuperAdmin';

  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [districtFilter, setDistrictFilter] = useState<number | ''>(() => {
    const d = searchParams.get('districtId');
    return d ? Number(d) : '';
  });
  const [mahallaFilter, setMahallaFilter] = useState<number | ''>('');
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [page, setPage] = useState<number>(1);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // Effective district
  const effectiveDistrictId = !isSuperAdmin && user?.districtId ? user.districtId : districtFilter ? Number(districtFilter) : undefined;

  // Queries
  const { data: districts = [] } = useGetDistrictsQuery();
  const { data: mahallas = [] } = useGetMahallasQuery(effectiveDistrictId ? { districtId: effectiveDistrictId } : undefined);

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
    status: statusFilter !== 'all' ? statusFilter : undefined,
    wasteType: wasteTypeFilter !== 'all' ? wasteTypeFilter : undefined,
    districtId: effectiveDistrictId,
    mahallaId: mahallaFilter ? Number(mahallaFilter) : undefined,
    ...dateFilterParams,
    page,
    limit: 10
  }), [statusFilter, wasteTypeFilter, effectiveDistrictId, mahallaFilter, dateFilterParams, page]);

  const { data: requestsData, isLoading, isFetching, refetch } = useGetRequestsQuery(queryParams);

  // Keep last known good data while fetching new filter results
  const prevRequestsRef = useRef<RequestsResponse | null>(null);
  if (requestsData) {
    prevRequestsRef.current = requestsData;
  }
  const activeRequestsData = requestsData || prevRequestsRef.current;

  useEffect(() => {
    if (urlRequestId) {
      setActiveRequestId(Number(urlRequestId));
    }
  }, [urlRequestId]);

  const handleOpenDetail = useCallback((id: number) => {
    setActiveRequestId(id);
    searchParams.set('requestId', String(id));
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  const handleBackFromDetail = useCallback(() => {
    setActiveRequestId(null);
    searchParams.delete('requestId');
    setSearchParams(searchParams);
    refetch();
  }, [searchParams, setSearchParams, refetch]);

  // If a request is active, render full RequestDetailPage
  if (activeRequestId) {
    return (
      <RequestDetailPage
        requestId={activeRequestId}
        onBack={handleBackFromDetail}
        onUpdated={() => refetch()}
      />
    );
  }

  const requests = activeRequestsData?.items || [];
  const pagination = activeRequestsData?.pagination;
  const totalItems = pagination?.total ?? requests.length;
  const totalPages = pagination?.totalPages ?? 1;
  const limit = pagination?.limit ?? 10;

  const isFieldWorker = user?.role === 'Inspector' || user?.role === 'Driver';
  const pageBreadcrumbLabel = isFieldWorker
    ? 'Mening vazifalarim'
    : user?.role === 'Manager'
      ? 'Tuman murojaatlari'
      : 'Murojaatlar';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, position: 'relative' }}>
      <AppBreadcrumbs items={[{ label: pageBreadcrumbLabel }]} />

      {/* Top Filter Bar (BSK Style) */}
      <FilterBar>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mr: 0.5 }}>
          Filtr:
        </Typography>

        <Box sx={{ width: 150 }}>
          <AppSelectField
            label="Davr"
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value as 'all');
              setPage(1);
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
          <Box sx={{ width: 180 }}>
            <AppSelectField
              label="Tuman"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value ? Number(e.target.value) : '');
                setMahallaFilter('');
                setPage(1);
              }}
              options={[
                { value: '', label: 'Barcha tumanlar' },
                ...districts.map((d) => ({ value: d.id, label: d.name }))
              ]}
            />
          </Box>
        )}

        <Box sx={{ width: 180 }}>
          <AppSelectField
            label="Mahalla"
            value={mahallaFilter}
            searchable
            onChange={(e) => {
              setMahallaFilter(e.target.value ? Number(e.target.value) : '');
              setPage(1);
            }}
            options={[
              { value: '', label: 'Barcha mahallalar' },
              ...mahallas.map((m) => ({ value: m.id, label: m.name }))
            ]}
          />
        </Box>

        <Box sx={{ width: 190 }}>
          <AppSelectField
            label="Chiqindi turi"
            value={wasteTypeFilter}
            onChange={(e) => {
              setWasteTypeFilter(String(e.target.value));
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Barcha yo‘nalishlar' },
              { value: 'maishiy', label: 'Maishiy chiqindilar' },
              { value: 'qurilish', label: 'Qurilish chiqindilari' },
              { value: 'xazon', label: 'Xazon va shoxlar' },
              { value: 'katta_hajmli', label: 'Katta hajmli' },
              { value: 'noqonuniy', label: 'Noqonuniy tashlandiq' }
            ]}
          />
        </Box>

        <Box sx={{ width: 180 }}>
          <AppSelectField
            label="Holat"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as RequestStatus | 'all');
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'Barcha holatlar' },
              { value: 'new', label: 'Yangi' },
              { value: 'in_progress', label: 'Jarayonda' },
              { value: 'submitted', label: 'Tasdiqlashda' },
              { value: 'completed', label: 'Tozalandi' }
            ]}
          />
        </Box>

        <AppButton
          variant="secondary"
          startIcon={<RefreshIcon fontSize="small" />}
          onClick={() => refetch()}
          sx={{ ml: 'auto' }}
        >
          Yangilash
        </AppButton>
      </FilterBar>

      {/* Main Table Card (BSK Style) */}
      <DataTableCard sx={{ position: 'relative' }}>
        {isFetching && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              borderRadius: '14px 14px 0 0',
              zIndex: 5,
              bgcolor: 'transparent',
              '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' }
            }}
          />
        )}
        <Box sx={{ px: 1, pb: 2 }}>
          <Typography variant="h4" fontWeight={800}>
            Murojaatlar ro‘yxati
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Kelgan arizalar, biriktirilgan xodimlar va holatlar bir jadvalda ko‘rsatiladi.
          </Typography>
        </Box>

        {isLoading && !activeRequestsData ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress size={36} />
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body1" fontWeight={600}>
              Tanlangan mezonlar bo‘yicha arizalar topilmadi.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ opacity: isFetching ? 0.75 : 1, transition: 'opacity 0.15s ease' }}>
            <AppTable minWidth={900}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 65 }}>ID</TableCell>
                <TableCell sx={{ minWidth: 150 }}>Fuqaro va Aloqa</TableCell>
                <TableCell sx={{ minWidth: 200 }}>Hudud va Manzil</TableCell>
                <TableCell sx={{ width: 130 }}>Yo‘nalish</TableCell>
                <TableCell sx={{ width: 120 }}>Sana</TableCell>
                <TableCell sx={{ minWidth: 140 }}>Mas‘ul xodim</TableCell>
                <TableCell sx={{ width: 120 }}>Holati</TableCell>
                <TableCell align="right" sx={{ width: 100 }}>Harakat</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req) => {
                const dt = formatDateTime(req.createdAt);
                return (
                  <TableRow key={req.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography fontWeight={700}>#{req.id}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {req.citizenFullName || 'Noma‘lum fuqaro'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {req.citizenPhone || '-'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {req.district?.name ? req.district.name : ''}
                        {req.district?.name && req.mahalla?.name ? ' • ' : ''}
                        {req.mahalla?.name || 'Mahalla ko‘rsatilmagan'}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {req.address || '-'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {(() => {
                        const badge = getWasteTypeBadge(req.wasteType);
                        return (
                          <Typography
                            variant="caption"
                            sx={{
                              px: 1.25,
                              py: 0.5,
                              borderRadius: '8px',
                              bgcolor: badge.bgcolor,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              fontWeight: 700,
                              fontSize: '0.73rem',
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {badge.label}
                          </Typography>
                        );
                      })()}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {dt.date}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dt.time}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {req.assignedWorker?.fullName ? (
                        <Typography variant="body2" fontWeight={600}>
                          {req.assignedWorker.fullName}
                        </Typography>
                      ) : (
                        <Typography
                          variant="caption"
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1.5,
                            bgcolor: '#FEF3C7',
                            color: '#92400E',
                            fontWeight: 600,
                            display: 'inline-block'
                          }}
                        >
                          Biriktirilmagan
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge status={req.status} />
                    </TableCell>

                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <AppButton
                        variant="action"
                        size="small"
                        onClick={() => handleOpenDetail(req.id)}
                      >
                        Ko‘rish
                      </AppButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </AppTable>
        </Box>
        )}

        {/* Pagination Toolbar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 2.5,
            px: 1,
            gap: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            mt: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Jami: <strong>{totalItems}</strong> ta murojaat
            {totalItems > 0 && (
              <> (Ko‘rsatilmoqda: <strong>{(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)}</strong> ta)</>
            )}
          </Typography>

          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => setPage(val)}
            color="primary"
            shape="rounded"
            size="medium"
          />
        </Box>
      </DataTableCard>

      {/* Floating Action Button */}
      <Tooltip title="Yangi murojaat qo‘shish" placement="left">
        <Fab
          color="primary"
          onClick={() => setManualModalOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)',
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Manual Request Modal */}
      <ManualRequestModal
        open={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        onSaved={() => refetch()}
      />
    </Box>
  );
};

export default RequestsPage;
