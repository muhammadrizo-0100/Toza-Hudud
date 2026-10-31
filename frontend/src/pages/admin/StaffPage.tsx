import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  Button,
  InputAdornment,
  Pagination
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SupervisorAccountOutlinedIcon from '@mui/icons-material/SupervisorAccountOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CloseIcon from '@mui/icons-material/Close';

import {
  useGetWorkersQuery,
  useCreateWorkerMutation,
  useDeleteWorkerMutation
} from '../../api/workersApi';
import {
  useGetAdminsQuery,
  useDeleteAdminMutation
} from '../../api/adminsApi';
import { useGetDistrictsQuery } from '../../api/districtsApi';
import { useAppSelector } from '../../store/hooks';
import DataTableCard from '../../components/common/DataTableCard';
import { AppTable } from '../../components/common/AppTable';
import AppButton from '../../components/common/AppButton';
import { AdminFormDialog } from './AdminFormDialog';
import { AdminDeleteDialog } from './AdminDeleteDialog';
import { AdminsStatsCards } from './AdminsStatsCards';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import AppSelectField from '../../components/common/AppSelectField';
import AppPhoneField from '../../components/common/AppPhoneField';
import { AdminUser, AdminRole } from '../../types';
import { formatUzPhone, cleanUzPhone, validateUzPhone } from '../../utils/phone';
import { useToast } from '../../context/ToastContext';

/**
 * Normalizes text for search by lowercasing, replacing curly apostrophes with straight quotes,
 * and collapsing extra spaces.
 */
function normalizeSearchText(text?: string | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[‘’ʻ`´'"]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts only digits for clean phone or numeric matching
 */
function extractDigits(text?: string | null): string {
  if (!text) return '';
  return text.replace(/\D/g, '');
}

/**
 * Advanced employee matcher:
 * - Supports partial & formatted phone search (e.g. "90 123", "901234567", "(90) 123-45", "1234567", "4444")
 * - Supports multi-word name/surname in ANY order (e.g. "Jasur Karimov" matches "Karimov Jasur Bahodirovich")
 * - Supports username matching (e.g. "tohir", "@admin")
 * - Supports vehicle number matching (with or without spaces, e.g. "50a777aa" matches "50 A 777 AA")
 * - Supports district name matching
 */
function matchEmployee(
  query: string,
  item: {
    fullName?: string | null;
    phone?: string | null;
    username?: string | null;
    jobTitle?: string | null;
    districtName?: string | null;
    role?: string | null;
    vehicleNumber?: string | null;
  }
): boolean {
  if (!query || !query.trim()) return true;

  const rawQuery = query.trim();
  const normalizedQuery = normalizeSearchText(rawQuery);
  const queryDigits = extractDigits(rawQuery);

  // 1. Phone number match (if query contains at least 2 digits)
  if (queryDigits.length >= 2) {
    const rawPhoneDigits = extractDigits(item.phone);
    if (rawPhoneDigits) {
      if (rawPhoneDigits.includes(queryDigits)) {
        return true;
      }
      const localPhone = rawPhoneDigits.startsWith('998') ? rawPhoneDigits.slice(3) : rawPhoneDigits;
      if (localPhone.includes(queryDigits)) {
        return true;
      }
    }
  }

  // 2. Vehicle number match (for drivers, e.g. "50a777aa", "777", "a123aa")
  if (item.vehicleNumber) {
    const cleanVehicle = item.vehicleNumber.toLowerCase().replace(/[\s-]/g, '');
    const cleanQ = normalizedQuery.replace(/[\s-]/g, '');
    if (cleanVehicle && cleanVehicle.includes(cleanQ)) {
      return true;
    }
  }

  // 3. Multi-token text matching across Name, Surname, Username, Job Title, District, Role
  // Query words can be in ANY order (e.g. "Tohir Eshmatov" or "Eshmatov Tohir")
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return true;

  const combinedSearchTarget = [
    normalizeSearchText(item.fullName),
    normalizeSearchText(item.username),
    normalizeSearchText(item.jobTitle),
    normalizeSearchText(item.districtName),
    normalizeSearchText(item.role)
  ].join(' ');

  return queryTokens.every((token) => combinedSearchTarget.includes(token));
}

export const StaffPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const isManager = user?.role === 'Manager';
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isDispatcher = user?.role === 'Dispatcher';

  const [activeTab, setActiveTab] = useState(0);

  // Filters
  const [adminSearch, setAdminSearch] = useState('');
  const [adminDistrictFilter, setAdminDistrictFilter] = useState<number | ''>('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [adminPage, setAdminPage] = useState(1);
  const ADMINS_PER_PAGE = 10;

  const [workerSearch, setWorkerSearch] = useState('');
  const [workerDistrictFilter, setWorkerDistrictFilter] = useState<number | ''>('');
  const [workerPage, setWorkerPage] = useState(1);
  const WORKERS_PER_PAGE = 10;

  // Effective district filtering
  const effectiveAdminDistrictId = isManager && user.districtId ? user.districtId : adminDistrictFilter ? Number(adminDistrictFilter) : undefined;
  const effectiveWorkerDistrictId = (isManager || isDispatcher) && user?.districtId ? user.districtId : workerDistrictFilter ? Number(workerDistrictFilter) : undefined;

  // Admin form state
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [selectedAdminForEdit, setSelectedAdminForEdit] = useState<AdminUser | null>(null);

  // Admin delete state
  const [deleteAdminOpen, setDeleteAdminOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);

  // Worker form state
  const [workerDialogOpen, setWorkerDialogOpen] = useState(false);
  const [workerRole, setWorkerRole] = useState<'Driver' | 'Inspector'>('Driver');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [workerDistrictId, setWorkerDistrictId] = useState<number | ''>(isManager && user?.districtId ? user.districtId : '');
  const { showSuccess, showError } = useToast();

  // Queries
  const { data: districts = [] } = useGetDistrictsQuery();
  const {
    data: admins = [],
    isLoading: adminsLoading,
    refetch: refetchAdmins
  } = useGetAdminsQuery(effectiveAdminDistrictId ? { districtId: effectiveAdminDistrictId } : undefined);

  const {
    data: workers = [],
    isLoading: workersLoading,
    refetch: refetchWorkers
  } = useGetWorkersQuery(effectiveWorkerDistrictId ? { districtId: effectiveWorkerDistrictId } : undefined);

  // Mutations
  const [deleteAdmin, { isLoading: isDeletingAdmin }] = useDeleteAdminMutation();
  const [createWorker, { isLoading: creatingWorker }] = useCreateWorkerMutation();
  const [deleteWorker] = useDeleteWorkerMutation();

  // Filtered & Paginated Admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      if (adminStatusFilter === 'active' && a.isActive === false) return false;
      if (adminStatusFilter === 'inactive' && a.isActive !== false) return false;
      if (adminDistrictFilter && a.districtId !== Number(adminDistrictFilter)) return false;

      const districtName = a.district?.name || districts.find((d) => d.id === a.districtId)?.name || '';

      return matchEmployee(adminSearch, {
        fullName: a.fullName,
        phone: a.phone,
        username: a.username,
        jobTitle: a.jobTitle,
        districtName,
        role: a.role
      });
    });
  }, [admins, adminStatusFilter, adminDistrictFilter, adminSearch, districts]);

  const totalAdminPages = Math.max(1, Math.ceil(filteredAdmins.length / ADMINS_PER_PAGE));
  const paginatedAdmins = useMemo(() => {
    const start = (adminPage - 1) * ADMINS_PER_PAGE;
    return filteredAdmins.slice(start, start + ADMINS_PER_PAGE);
  }, [filteredAdmins, adminPage]);

  // Filtered & Paginated Workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (workerDistrictFilter && w.districtId !== Number(workerDistrictFilter)) return false;

      const districtName = districts.find((d) => d.id === w.districtId)?.name || '';

      return matchEmployee(workerSearch, {
        fullName: w.fullName,
        phone: w.phone,
        vehicleNumber: w.vehicleNumber,
        districtName,
        role: w.role
      });
    });
  }, [workers, workerDistrictFilter, workerSearch, districts]);

  const totalWorkerPages = Math.max(1, Math.ceil(filteredWorkers.length / WORKERS_PER_PAGE));
  const paginatedWorkers = useMemo(() => {
    const start = (workerPage - 1) * WORKERS_PER_PAGE;
    return filteredWorkers.slice(start, start + WORKERS_PER_PAGE);
  }, [filteredWorkers, workerPage]);

  const handleOpenAddAdmin = () => {
    setSelectedAdminForEdit(null);
    setAdminDialogOpen(true);
  };

  const handleOpenEditAdmin = (admin: AdminUser) => {
    setSelectedAdminForEdit(admin);
    setAdminDialogOpen(true);
  };

  const handleOpenDeleteAdmin = (admin: AdminUser) => {
    setAdminToDelete(admin);
    setDeleteAdminOpen(true);
  };

  const handleConfirmDeleteAdmin = async () => {
    if (!adminToDelete) return;
    try {
      await deleteAdmin(adminToDelete.id).unwrap();
      showSuccess(`Xodim (${adminToDelete.fullName || adminToDelete.username}) muvaffaqiyatli o‘chirildi`);
      setDeleteAdminOpen(false);
      setAdminToDelete(null);
      refetchAdmins();
    } catch (err: any) {
      console.error(err);
      showError(err?.data?.message || 'Xodimni o‘chirishda xatolik yuz berdi');
    }
  };

  const handleCreateWorker = async () => {
    const targetDistrict = isManager && user?.districtId ? user.districtId : Number(workerDistrictId);
    if (!fullName.trim() || !phone.trim() || !targetDistrict) {
      showError('Barcha majburiy maydonlarni to‘ldiring');
      return;
    }

    const pVal = validateUzPhone(phone);
    if (!pVal.isValid) {
      showError(pVal.error || 'Telefon raqam formati noto‘g‘ri');
      return;
    }

    try {
      await createWorker({
        districtId: targetDistrict,
        fullName: fullName.trim(),
        phone: cleanUzPhone(phone),
        role: workerRole,
        vehicleNumber: workerRole === 'Driver' ? vehicleNumber?.trim().toUpperCase() || undefined : undefined
      }).unwrap();
      showSuccess(`Yangi xodim (${fullName.trim()}) muvaffaqiyatli qo‘shildi!`);
      setWorkerDialogOpen(false);
      setFullName('');
      setPhone('');
      setVehicleNumber('');
      setWorkerRole('Driver');
      refetchWorkers();
    } catch (err: any) {
      console.error(err);
      showError(err?.data?.message || 'Xodimni qo‘shishda xatolik yuz berdi');
    }
  };

  const getRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'SuperAdmin':
        return (
          <Chip
            size="small"
            label="Viloyat Bosh Administratori"
            sx={{
              bgcolor: '#EEF2FF',
              color: '#4F46E5',
              fontWeight: 600,
              fontSize: '0.72rem',
              borderRadius: '8px'
            }}
          />
        );
      case 'Manager':
        return (
          <Chip
            size="small"
            label="Tuman Tozalik Boshlig‘i"
            sx={{
              bgcolor: '#ECFDF5',
              color: '#059669',
              fontWeight: 600,
              fontSize: '0.72rem',
              borderRadius: '8px'
            }}
          />
        );
      case 'Dispatcher':
        return (
          <Chip
            size="small"
            label="Tuman Dispetcheri"
            sx={{
              bgcolor: '#EFF6FF',
              color: '#0284C7',
              fontWeight: 600,
              fontSize: '0.72rem',
              borderRadius: '8px'
            }}
          />
        );
      case 'Inspector':
        return (
          <Chip
            size="small"
            label="Hudud nazoratchisi / Usta"
            sx={{
              bgcolor: '#FEF3C7',
              color: '#92400E',
              fontWeight: 600,
              fontSize: '0.72rem',
              borderRadius: '8px'
            }}
          />
        );
      case 'Driver':
        return (
          <Chip
            size="small"
            label="Maxsus texnika haydovchisi"
            sx={{
              bgcolor: '#F0FDF4',
              color: '#15803D',
              fontWeight: 600,
              fontSize: '0.72rem',
              borderRadius: '8px'
            }}
          />
        );
      default:
        return <Chip size="small" label={role} sx={{ fontSize: '0.72rem', borderRadius: '8px' }} />;
    }
  };

  const pageTitle = isManager
    ? `${user?.district?.name || 'Tuman'} Tozalik Xodimlari va Brigadalari`
    : isDispatcher
    ? `${user?.district?.name || 'Tuman'} Tozalash Brigadalari`
    : 'Viloyat Miqyosidagi Kadrlar va Mas‘ullar';

  const pageSubtitle = isManager
    ? 'Faqat o‘z tumaningizdagi dispetcherlar hamda tozalash mashinalari haydovchilari boshqaruvi'
    : isDispatcher
    ? 'Chiqindi tashuvchi maxsus texnikalar va haydovchilar ro‘yxati'
    : 'Barcha tuman tozalik boshliqlari, dispetcherlar hamda tozalash brigadalari';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <AppBreadcrumbs items={[{ label: 'Xodimlar va brigadalar' }]} />

      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {pageTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mt: 0.25 }}>
            {pageSubtitle}
          </Typography>
        </Box>

        {activeTab === 0 && !isDispatcher ? (
          <AppButton
            variant="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddAdmin}
          >
            {isSuperAdmin ? 'Yangi Rahbar / Dispetcher Qo‘shish' : 'Yangi Dispetcher Qo‘shish'}
          </AppButton>
        ) : (
          <AppButton
            variant="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              if (isManager && user?.districtId) {
                setWorkerDistrictId(user.districtId);
              }
              setWorkerDialogOpen(true);
            }}
          >
            Yangi Nazoratchi / Haydovchi Qo‘shish
          </AppButton>
        )}
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: '1px solid #E2E8F0' }}>
        <Tabs
          value={activeTab}
          onChange={(_e, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTabs-indicator': {
              bgcolor: 'primary.main',
              height: 2.5
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              minHeight: 44,
              color: '#64748B',
              '&.Mui-selected': {
                color: 'primary.main'
              }
            }
          }}
        >
          {!isDispatcher && (
            <Tab
              icon={<SupervisorAccountOutlinedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={isManager ? `Tuman Dispetcherlari (${admins.length})` : `Tuman Boshliqlari va Dispetcherlar (${admins.length})`}
            />
          )}
          <Tab
            icon={<LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Hudud Nazoratchilari va Haydovchilar (${workers.length})`}
          />
        </Tabs>
      </Box>

      {/* Tab 0: Admins & Dispatchers */}
      {activeTab === 0 && !isDispatcher && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Stats Summary Cards */}
          <AdminsStatsCards admins={admins} currentUserRole={user?.role} />

          {/* Table Card */}
          <DataTableCard sx={{ p: 0 }}>
            {/* Filter Bar */}
            <Box
              sx={{
                p: 2,
                px: 2.5,
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>
                {isManager ? 'Tuman Dispetcherlari' : 'Tizim Mas‘ullari va Dispetcherlar'} ({filteredAdmins.length})
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                {/* Search */}
                <TextField
                  size="small"
                  placeholder="F.I.Sh yoki telefon raqam..."
                  value={adminSearch}
                  onChange={(e) => {
                    setAdminSearch(e.target.value);
                    setAdminPage(1);
                  }}
                  sx={{
                    width: { xs: '100%', sm: 260 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      bgcolor: '#F8FAFC',
                      height: 38,
                      fontSize: '0.82rem'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlinedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                      </InputAdornment>
                    ),
                    endAdornment: adminSearch ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setAdminSearch('');
                            setAdminPage(1);
                          }}
                          sx={{ p: 0.5, color: '#94A3B8', '&:hover': { color: '#0F172A' } }}
                        >
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                />

                {/* Status Filter */}
                <Box sx={{ width: 145 }}>
                  <AppSelectField
                    value={adminStatusFilter}
                    onChange={(e) => {
                      setAdminStatusFilter(e.target.value as 'all');
                      setAdminPage(1);
                    }}
                    options={[
                      { value: 'all', label: 'Barcha holatlar' },
                      { value: 'active', label: 'Faqat faollar' },
                      { value: 'inactive', label: 'Faqat nofaollar' }
                    ]}
                  />
                </Box>

                {/* District Filter ONLY for SuperAdmin */}
                {isSuperAdmin && (
                  <Box sx={{ width: 175 }}>
                    <AppSelectField
                      value={adminDistrictFilter}
                      onChange={(e) => {
                        setAdminDistrictFilter(e.target.value as number);
                        setAdminPage(1);
                      }}
                      options={[
                        { value: '', label: 'Barcha tumanlar' },
                        ...districts.map((d) => ({ value: d.id, label: d.name }))
                      ]}
                    />
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Streamlined Table (Fits 100%, No Horizontal Scroll) */}
            <AppTable minWidth="100%">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell width={45} sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>#</TableCell>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Xodim (F.I.Sh / Login / Aloqa)</TableCell>
                  <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Lavozimi va Roli</TableCell>
                  <TableCell width={160} sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Biriktirilgan tuman</TableCell>
                  <TableCell width={90} align="center" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Holati</TableCell>
                  <TableCell width={80} align="center" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Amallar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {adminsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={24} color="primary" />
                    </TableCell>
                  </TableRow>
                ) : paginatedAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                        {adminSearch.trim()
                          ? `"${adminSearch}" bo‘yicha xodim topilmadi`
                          : 'Xodimlar yoki dispetcherlar topilmadi'}
                      </Typography>
                      {adminSearch.trim() && (
                        <Button
                          size="small"
                          onClick={() => {
                            setAdminSearch('');
                            setAdminPage(1);
                          }}
                          sx={{ mt: 1, textTransform: 'none', fontSize: '0.8rem', color: 'primary.main', fontWeight: 600 }}
                        >
                          Qidiruvni tozalash
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAdmins.map((admin, idx) => {
                    const initials = (admin.fullName || admin.username)
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0].toUpperCase())
                      .join('');

                    const isSelf = user?.id === admin.id;

                    return (
                      <TableRow key={admin.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <TableCell sx={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.82rem', py: 1.5 }}>
                          {(adminPage - 1) * ADMINS_PER_PAGE + idx + 1}
                        </TableCell>

                        {/* Combined Identity Cell: Avatar + F.I.Sh + Login + Phone */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                bgcolor: admin.role === 'SuperAdmin' ? '#4F46E5' : admin.role === 'Manager' ? '#059669' : '#0284C7',
                                fontSize: '0.78rem',
                                fontWeight: 700
                              }}
                            >
                              {initials}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: '#0F172A',
                                  fontSize: '0.88rem',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {admin.fullName || admin.username}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: '#64748B', fontSize: '0.74rem', display: 'block', mt: 0.25 }}
                              >
                                @{admin.username} {admin.phone ? `• ${admin.phone}` : ''}
                              </Typography>
                              {isSelf && (
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.72rem' }}>
                                  (Sizning hisobingiz)
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Combined Role & Job Title Cell */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Box>
                            {getRoleBadge(admin.role)}
                            {admin.jobTitle && (
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5, fontSize: '0.74rem' }}>
                                {admin.jobTitle}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        {/* District */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Chip
                            size="small"
                            label={admin.district?.name || (admin.role === 'SuperAdmin' ? 'Barcha tumanlar' : 'Biriktirilmagan')}
                            sx={{
                              fontSize: '0.74rem',
                              height: 22,
                              fontWeight: 500,
                              borderRadius: '8px',
                              bgcolor: '#F1F5F9',
                              color: '#475569'
                            }}
                          />
                        </TableCell>

                        {/* Status */}
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Chip
                            size="small"
                            label={admin.isActive ? 'Faol' : 'Nofaol'}
                            sx={{
                              fontSize: '0.72rem',
                              height: 22,
                              fontWeight: 600,
                              borderRadius: '12px',
                              bgcolor: admin.isActive ? '#ECFDF5' : '#F1F5F9',
                              color: admin.isActive ? '#059669' : '#64748B',
                              border: 'none'
                            }}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Tahrirlash">
                              <IconButton
                                size="small"
                                sx={{ color: '#64748B', '&:hover': { color: 'primary.main', bgcolor: '#F0FDF4' } }}
                                onClick={() => handleOpenEditAdmin(admin)}
                              >
                                <EditOutlinedIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                            {!isSelf && (
                              <Tooltip title="Ro‘yxatdan o‘chirish">
                                <IconButton
                                  size="small"
                                  sx={{ color: '#64748B', '&:hover': { color: '#DC2626', bgcolor: '#FEF2F2' } }}
                                  onClick={() => handleOpenDeleteAdmin(admin)}
                                >
                                  <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </AppTable>

            {/* Pagination Footer (Chrono desk style) */}
            {filteredAdmins.length > ADMINS_PER_PAGE && (
              <Box
                sx={{
                  p: 1.5,
                  px: 2.5,
                  borderTop: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                  Jami {filteredAdmins.length} tadan{' '}
                  {(adminPage - 1) * ADMINS_PER_PAGE + 1}-
                  {Math.min(adminPage * ADMINS_PER_PAGE, filteredAdmins.length)} ko‘rsatilmoqda
                </Typography>
                <Pagination
                  count={totalAdminPages}
                  page={adminPage}
                  onChange={(_, page) => setAdminPage(page)}
                  size="small"
                  shape="rounded"
                  variant="outlined"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: '8px',
                      borderColor: '#E2E8F0',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      color: '#475569',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: '#FFFFFF',
                        borderColor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }
                    }
                  }}
                />
              </Box>
            )}
          </DataTableCard>
        </Box>
      )}

      {/* Tab 1: Workers / Drivers */}
      {activeTab === (isDispatcher ? 0 : 1) && (
        <DataTableCard sx={{ p: 0 }}>
          <Box
            sx={{
              p: 2,
              px: 2.5,
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>
              Haydovchilar va Chiqindi Texnikalari ({filteredWorkers.length})
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField
                size="small"
                placeholder="F.I.Sh, telefon yoki avtoraqam..."
                value={workerSearch}
                onChange={(e) => {
                  setWorkerSearch(e.target.value);
                  setWorkerPage(1);
                }}
                sx={{
                  width: { xs: '100%', sm: 260 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    bgcolor: '#F8FAFC',
                    height: 38,
                    fontSize: '0.82rem'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: workerSearch ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setWorkerSearch('');
                          setWorkerPage(1);
                        }}
                        sx={{ p: 0.5, color: '#94A3B8', '&:hover': { color: '#0F172A' } }}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              />

              {isSuperAdmin && (
                <Box sx={{ width: 175 }}>
                  <AppSelectField
                    value={workerDistrictFilter}
                    onChange={(e) => {
                      setWorkerDistrictFilter(e.target.value as number);
                      setWorkerPage(1);
                    }}
                    options={[
                      { value: '', label: 'Barcha tumanlar' },
                      ...districts.map((d) => ({ value: d.id, label: d.name }))
                    ]}
                  />
                </Box>
              )}
            </Stack>
          </Box>

          <AppTable minWidth="100%">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell width={45} sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>#</TableCell>
                <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Xodim (F.I.Sh / Telefon)</TableCell>
                <TableCell width={160} sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Lavozimi</TableCell>
                <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Avtotransport / Texnika</TableCell>
                <TableCell width={160} sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Tuman</TableCell>
                <TableCell width={120} align="center" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Telegram bot</TableCell>
                <TableCell width={60} align="center" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workersLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={24} color="primary" />
                  </TableCell>
                </TableRow>
              ) : paginatedWorkers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                      {workerSearch.trim()
                        ? `"${workerSearch}" bo‘yicha xodim topilmadi`
                        : 'Xodimlar topilmadi'}
                    </Typography>
                    {workerSearch.trim() && (
                      <Button
                        size="small"
                        onClick={() => {
                          setWorkerSearch('');
                          setWorkerPage(1);
                        }}
                        sx={{ mt: 1, textTransform: 'none', fontSize: '0.8rem', color: 'primary.main', fontWeight: 600 }}
                      >
                        Qidiruvni tozalash
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedWorkers.map((w, idx) => (
                  <TableRow key={w.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <TableCell sx={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.82rem', py: 1.5 }}>
                      {(workerPage - 1) * WORKERS_PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                        {w.fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.74rem' }}>
                        {w.phone}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        size="small"
                        icon={w.role === 'Inspector' ? <SearchOutlinedIcon sx={{ fontSize: '14px !important' }} /> : <LocalShippingOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                        label={w.role === 'Inspector' ? 'Hudud nazoratchisi' : 'Haydovchi'}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.74rem',
                          borderRadius: '8px',
                          bgcolor: w.role === 'Inspector' ? '#FEF3C7' : '#EFF6FF',
                          color: w.role === 'Inspector' ? '#92400E' : '#1D4ED8',
                          border: w.role === 'Inspector' ? '1px solid #FDE68A' : '1px solid #BFDBFE'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        size="small"
                        label={w.vehicleNumber || (w.role === 'Inspector' ? 'Hududiy nazorat' : 'Biriktirilmagan')}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          borderRadius: '8px',
                          bgcolor: w.vehicleNumber ? '#F1F5F9' : 'transparent',
                          color: w.vehicleNumber ? '#0F172A' : '#94A3B8'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        size="small"
                        label={districts.find((d) => d.id === w.districtId)?.name || 'Tuman'}
                        sx={{
                          fontSize: '0.74rem',
                          height: 22,
                          fontWeight: 500,
                          borderRadius: '8px',
                          bgcolor: '#F1F5F9',
                          color: '#475569'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <Chip
                        size="small"
                        label={w.telegramId ? 'Ulangan' : 'Kutilmoqda'}
                        sx={{
                          fontSize: '0.72rem',
                          height: 22,
                          fontWeight: 600,
                          borderRadius: '12px',
                          bgcolor: w.telegramId ? '#ECFDF5' : '#F1F5F9',
                          color: w.telegramId ? '#059669' : '#64748B',
                          border: 'none'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <Tooltip title="O‘chirish">
                        <IconButton
                          size="small"
                          sx={{ color: '#94A3B8', '&:hover': { color: '#DC2626', bgcolor: '#FEF2F2' } }}
                          onClick={async () => {
                            if (window.confirm(`${w.fullName} xodimini o‘chirishni tasdiqlaysizmi?`)) {
                              try {
                                await deleteWorker(w.id).unwrap();
                                showSuccess(`Xodim (${w.fullName}) muvaffaqiyatli o‘chirildi`);
                                refetchWorkers();
                              } catch (err: any) {
                                showError(err?.data?.message || 'O‘chirishda xatolik yuz berdi');
                              }
                            }
                          }}
                        >
                          <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </AppTable>

          {/* Worker Pagination Footer */}
          {filteredWorkers.length > WORKERS_PER_PAGE && (
            <Box
              sx={{
                p: 1.5,
                px: 2.5,
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                Jami {filteredWorkers.length} tadan{' '}
                {(workerPage - 1) * WORKERS_PER_PAGE + 1}-
                {Math.min(workerPage * WORKERS_PER_PAGE, filteredWorkers.length)} ko‘rsatilmoqda
              </Typography>
              <Pagination
                count={totalWorkerPages}
                page={workerPage}
                onChange={(_, page) => setWorkerPage(page)}
                size="small"
                shape="rounded"
                variant="outlined"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: '8px',
                    borderColor: '#E2E8F0',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    color: '#475569',
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: '#FFFFFF',
                      borderColor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }
                  }
                }}
              />
            </Box>
          )}
        </DataTableCard>
      )}

      {/* Admin Create / Edit Dialog - Image 1 Style */}
      <AdminFormDialog
        open={adminDialogOpen}
        editAdmin={selectedAdminForEdit}
        districts={districts}
        currentUser={user}
        onClose={() => setAdminDialogOpen(false)}
        onSuccess={() => refetchAdmins()}
      />

      {/* Admin Delete Confirmation Dialog - Image 1 Style */}
      <AdminDeleteDialog
        open={deleteAdminOpen}
        admin={adminToDelete}
        loading={isDeletingAdmin}
        onClose={() => setDeleteAdminOpen(false)}
        onConfirm={handleConfirmDeleteAdmin}
      />

      {/* Worker Create Dialog - Image 1 Style */}
      <Dialog
        open={workerDialogOpen}
        onClose={() => setWorkerDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1,
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.14)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1, pb: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem', color: '#0F172A' }}>
            Yangi xodim qo‘shish
          </Typography>
          <IconButton
            size="small"
            onClick={() => setWorkerDialogOpen(false)}
            sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 2, py: 1.5 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Lavozimi / Vazifasi
              </Typography>
              <AppSelectField
                value={workerRole}
                onChange={(e) => setWorkerRole(e.target.value as 'Driver' | 'Inspector')}
                options={[
                  {
                    value: 'Driver',
                    label: 'Maxsus texnika haydovchisi',
                    icon: <LocalShippingOutlinedIcon sx={{ fontSize: 18, color: '#059669' }} />
                  },
                  {
                    value: 'Inspector',
                    label: 'Hudud nazoratchisi / Uchastka ustasi',
                    icon: <SearchOutlinedIcon sx={{ fontSize: 18, color: '#059669' }} />
                  }
                ]}
              />
            </Box>

            {isManager ? (
              <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                  Biriktirilgan tuman:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', mt: 0.25 }}>
                  {user?.district?.name || 'Sizning tumaningiz'}
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Tuman
                </Typography>
                <AppSelectField
                  value={workerDistrictId}
                  onChange={(e) => setWorkerDistrictId(Number(e.target.value))}
                  options={districts.map((d) => ({ value: d.id, label: d.name }))}
                />
              </Box>
            )}

            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Xodim F.I.Sh
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder={workerRole === 'Inspector' ? 'Masalan: Eshmatov Tohir' : 'Masalan: Botir Temirov'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    bgcolor: '#FFFFFF',
                    '& fieldset': { borderColor: '#E2E8F0' },
                    '&:hover fieldset': { borderColor: '#CBD5E1' }
                  }
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Telefon raqami (Telegram botga kirish uchun) *
              </Typography>
              <AppPhoneField
                value={phone}
                onChange={setPhone}
                required
              />
            </Box>

            {workerRole === 'Driver' && (
              <Box>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Maxsus avtomobil raqami
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Masalan: 50 123 AAA"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      bgcolor: '#FFFFFF',
                      '& fieldset': { borderColor: '#E2E8F0' },
                      '&:hover fieldset': { borderColor: '#CBD5E1' }
                    }
                  }}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2, pt: 1, pb: 1.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setWorkerDialogOpen(false)}
            sx={{
              height: 42,
              borderRadius: '10px',
              color: '#64748B',
              borderColor: '#E2E8F0',
              fontWeight: 600,
              fontSize: '0.88rem',
              textTransform: 'none',
              px: 2.5,
              '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
            }}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateWorker}
            disabled={!fullName || !phone || (!isManager && !workerDistrictId) || creatingWorker}
            sx={{
              flex: 1,
              height: 42,
              borderRadius: '10px',
              bgcolor: 'primary.main',
              fontWeight: 600,
              fontSize: '0.88rem',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' }
            }}
          >
            {creatingWorker ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffPage;
