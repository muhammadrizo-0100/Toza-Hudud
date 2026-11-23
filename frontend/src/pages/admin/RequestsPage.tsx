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
import { useTranslation } from '../../i18n';
import { translateDistrictName, translateMahallaName } from '../../utils/districtNames';

function formatDateTime(dateStr: string, lang: 'uz' | 'oz' = 'uz') {
  if (!dateStr) return { date: '-', time: '' };
  const d = new Date(dateStr);
  const locale = lang === 'oz' ? 'ru-RU' : 'uz-UZ';
  const date = d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function getWasteTypeBadge(type?: string | null, lang: 'uz' | 'oz' = 'uz') {
  switch (type) {
    case 'qurilish':
      return {
        label: lang === 'oz' ? 'Қурилиш чиқиндиси' : 'Qurilish chiqindisi',
        color: '#B45309',
        bgcolor: '#FEF3C7',
        border: '#FDE68A'
      };
    case 'xazon':
      return {
        label: lang === 'oz' ? 'Хазон ва шохлар' : 'Xazon va shoxlar',
        color: '#15803D',
        bgcolor: '#DCFCE7',
        border: '#BBF7D0'
      };
    case 'katta_hajmli':
      return {
        label: lang === 'oz' ? 'Катта ҳажмли' : 'Katta hajmli',
        color: '#6D28D9',
        bgcolor: '#EDE9FE',
        border: '#DDD6FE'
      };
    case 'noqonuniy':
      return {
        label: lang === 'oz' ? 'Ноқонуний ташландиқ' : 'Noqonuniy tashlandiq',
        color: '#B91C1C',
        bgcolor: '#FEE2E2',
        border: '#FECACA'
      };
    case 'maishiy':
    default:
      return {
        label: lang === 'oz' ? 'Маиший чиқинди' : 'Maishiy chiqindi',
        color: '#0369A1',
        bgcolor: '#E0F2FE',
        border: '#BAE6FD'
      };
  }
}

export const RequestsPage: React.FC = () => {
  const { t, lang } = useTranslation();
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

  const { data: requestsData, isLoading, isFetching, refetch } = useGetRequestsQuery(queryParams, {
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

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
    ? t('nav.myTasks')
    : user?.role === 'Manager'
      ? t('nav.districtRequests')
      : t('nav.requests');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, position: 'relative' }}>
      <AppBreadcrumbs items={[{ label: pageBreadcrumbLabel }]} />

      {/* Top Filter Bar (BSK Style) */}
      <FilterBar>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mr: 0.5 }}>
          {lang === 'oz' ? 'Филтр:' : 'Filtr:'}
        </Typography>

        <Box sx={{ width: 150 }}>
          <AppSelectField
            label={lang === 'oz' ? 'Давр' : 'Davr'}
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value as 'all');
              setPage(1);
            }}
            options={[
              { value: 'all', label: t('modules.map.allTime') },
              { value: 'today', label: lang === 'oz' ? 'Бугун' : 'Bugun' },
              { value: 'week', label: t('modules.map.last7Days') },
              { value: 'month', label: t('modules.map.last30Days') }
            ]}
          />
        </Box>

        {isSuperAdmin && (
          <Box sx={{ width: 180 }}>
            <AppSelectField
              label={t('modules.map.selectDistrict')}
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value ? Number(e.target.value) : '');
                setMahallaFilter('');
                setPage(1);
              }}
              options={[
                { value: '', label: t('common.allDistricts') },
                ...districts.map((d) => ({ value: d.id, label: translateDistrictName(d.name, lang) }))
              ]}
            />
          </Box>
        )}

        <Box sx={{ width: 180 }}>
          <AppSelectField
            label={lang === 'oz' ? 'Маҳалла' : 'Mahalla'}
            value={mahallaFilter}
            searchable
            onChange={(e) => {
              setMahallaFilter(e.target.value ? Number(e.target.value) : '');
              setPage(1);
            }}
            options={[
              { value: '', label: lang === 'oz' ? 'Барча маҳаллалар' : 'Barcha mahallalar' },
              ...mahallas.map((m) => ({ value: m.id, label: translateMahallaName(m.name, lang) }))
            ]}
          />
        </Box>

        <Box sx={{ width: 190 }}>
          <AppSelectField
            label={t('modules.requests.category')}
            value={wasteTypeFilter}
            onChange={(e) => {
              setWasteTypeFilter(String(e.target.value));
              setPage(1);
            }}
            options={[
              { value: 'all', label: lang === 'oz' ? 'Барча йўналишлар' : 'Barcha yo‘nalishlar' },
              { value: 'maishiy', label: t('modules.requests.householdWaste') },
              { value: 'qurilish', label: t('modules.requests.constructionWaste') },
              { value: 'xazon', label: t('modules.requests.foliageWaste') },
              { value: 'katta_hajmli', label: t('modules.requests.bulkyWaste') },
              { value: 'noqonuniy', label: lang === 'oz' ? 'Ноқонуний ташландиқ' : 'Noqonuniy tashlandiq' }
            ]}
          />
        </Box>

        <Box sx={{ width: 180 }}>
          <AppSelectField
            label={t('common.status')}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as RequestStatus | 'all');
              setPage(1);
            }}
            options={[
              { value: 'all', label: t('common.allStatuses') },
              { value: 'new', label: t('common.statuses.new') },
              { value: 'in_progress', label: t('common.statuses.in_progress') },
              { value: 'submitted', label: t('common.statuses.submitted') },
              { value: 'completed', label: t('common.statuses.completed') }
            ]}
          />
        </Box>

        <AppButton
          variant="secondary"
          startIcon={<RefreshIcon fontSize="small" />}
          onClick={() => refetch()}
          sx={{ ml: 'auto' }}
        >
          {t('common.refresh')}
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
            {t('nav.requestsList')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lang === 'oz' ? 'Келган аризалар, бириктирилган ходимлар ва ҳолатлар бир жадвалда кўрсатилади.' : 'Kelgan arizalar, biriktirilgan xodimlar va holatlar bir jadvalda ko‘rsatiladi.'}
          </Typography>
        </Box>

        {isLoading && !activeRequestsData ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress size={36} />
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body1" fontWeight={600}>
              {t('common.noData')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ opacity: isFetching ? 0.75 : 1, transition: 'opacity 0.15s ease' }}>
            <AppTable minWidth={900}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 65 }}>ID</TableCell>
                <TableCell sx={{ minWidth: 150 }}>{lang === 'oz' ? 'Фуқаро ва Алоқа' : 'Fuqaro va Aloqa'}</TableCell>
                <TableCell sx={{ minWidth: 200 }}>{lang === 'oz' ? 'Ҳудуд ва Манзил' : 'Hudud va Manzil'}</TableCell>
                <TableCell sx={{ width: 130 }}>{lang === 'oz' ? 'Йўналиш' : 'Yo‘nalish'}</TableCell>
                <TableCell sx={{ width: 120 }}>{t('common.date')}</TableCell>
                <TableCell sx={{ minWidth: 140 }}>{lang === 'oz' ? 'Масъул ходим' : 'Mas‘ul xodim'}</TableCell>
                <TableCell sx={{ width: 120 }}>{t('common.status')}</TableCell>
                <TableCell align="right" sx={{ width: 100 }}>{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req) => {
                const dt = formatDateTime(req.createdAt, lang);
                return (
                  <TableRow key={req.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography fontWeight={700}>#{req.id}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {req.citizenFullName || (lang === 'oz' ? 'Номаълум фуқаро' : 'Noma‘lum fuqaro')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {req.citizenPhone || '-'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {req.district?.name ? translateDistrictName(req.district.name, lang) : ''}
                        {req.district?.name && req.mahalla?.name ? ' • ' : ''}
                        {req.mahalla?.name ? translateMahallaName(req.mahalla.name, lang) : (lang === 'oz' ? 'Маҳалла кўрсатилмаган' : 'Mahalla ko‘rsatilmagan')}
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
                        const badge = getWasteTypeBadge(req.wasteType, lang);
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
                          {lang === 'oz' ? 'Бириктирилмаган' : 'Biriktirilmagan'}
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
                        {t('common.view')}
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
            {lang === 'oz' ? 'Жами:' : 'Jami:'} <strong>{totalItems}</strong> {lang === 'oz' ? 'та мурожаат' : 'ta murojaat'}
            {totalItems > 0 && (
              <> ({lang === 'oz' ? 'Кўрсатилмоқда:' : 'Ko‘rsatilmoqda:'} <strong>{(page - 1) * limit + 1} - {Math.min(page * limit, totalItems)}</strong> {lang === 'oz' ? 'та' : 'ta'})</>
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
      <Tooltip title={lang === 'oz' ? 'Янги мурожаат қўшиш' : 'Yangi murojaat qo‘shish'} placement="left">
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
