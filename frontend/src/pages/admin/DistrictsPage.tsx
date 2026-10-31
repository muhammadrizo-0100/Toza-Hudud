import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Chip,
  Alert,
  Tooltip,
  InputAdornment,
  Pagination,
  Collapse,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';

import {
  useGetDistrictsQuery,
  useCreateDistrictMutation,
  useDeleteDistrictMutation
} from '../../api/districtsApi';
import {
  useGetMahallasQuery,
  useCreateMahallaMutation,
  useDeleteMahallaMutation
} from '../../api/mahallasApi';
import DataTableCard from '../../components/common/DataTableCard';
import { AppTable } from '../../components/common/AppTable';
import AppButton from '../../components/common/AppButton';
import AppSelectField from '../../components/common/AppSelectField';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { useToast } from '../../context/ToastContext';

export const DistrictsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);

  // Success Feedback
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Dialogs
  const [districtDialogOpen, setDistrictDialogOpen] = useState(false);
  const [mahallaDialogOpen, setMahallaDialogOpen] = useState(false);

  // Form states - District
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newDistrictCode, setNewDistrictCode] = useState('');
  const [fetchOsmBoundary, setFetchOsmBoundary] = useState(true);
  const [showAdvancedDistrict, setShowAdvancedDistrict] = useState(false);
  const [customCenterLat, setCustomCenterLat] = useState('');
  const [customCenterLng, setCustomCenterLng] = useState('');
  const [districtError, setDistrictError] = useState<string | null>(null);

  // Form states - Mahalla
  const [targetDistrictId, setTargetDistrictId] = useState<number | ''>('');
  const [newMahallaName, setNewMahallaName] = useState('');
  const [mahallaError, setMahallaError] = useState<string | null>(null);

  // Mahalla Filter & Pagination
  const [mahallaSearch, setMahallaSearch] = useState('');
  const [mahallaPage, setMahallaPage] = useState(1);
  const MAHALLAS_PER_PAGE = 10;

  // Queries & Mutations
  const { data: rawDistricts = [], isLoading: loadingDistricts } = useGetDistrictsQuery();
  const [createDistrict, { isLoading: creatingDistrict }] = useCreateDistrictMutation();
  const [deleteDistrict] = useDeleteDistrictMutation();

  // Sort districts
  const districts = useMemo(() => {
    return [...rawDistricts].sort((a, b) => a.id - b.id);
  }, [rawDistricts]);

  // Active selected district
  const activeDistrictId = selectedDistrictId || districts[0]?.id;
  const activeDistrict = districts.find((d) => d.id === activeDistrictId);

  // Fetch mahallas for active district
  const { data: rawMahallas = [], isLoading: loadingMahallas } = useGetMahallasQuery(
    activeDistrictId ? { districtId: activeDistrictId } : undefined
  );
  const [createMahalla, { isLoading: creatingMahalla }] = useCreateMahallaMutation();
  const [deleteMahalla] = useDeleteMahallaMutation();

  // Filter & paginate mahallas
  const filteredMahallas = useMemo(() => {
    if (!mahallaSearch.trim()) return rawMahallas;
    const q = mahallaSearch.toLowerCase().trim();
    return rawMahallas.filter((m) => m.name.toLowerCase().includes(q));
  }, [rawMahallas, mahallaSearch]);

  const totalMahallaPages = Math.max(1, Math.ceil(filteredMahallas.length / MAHALLAS_PER_PAGE));
  const paginatedMahallas = useMemo(() => {
    const start = (mahallaPage - 1) * MAHALLAS_PER_PAGE;
    return filteredMahallas.slice(start, start + MAHALLAS_PER_PAGE);
  }, [filteredMahallas, mahallaPage]);

  // Handlers - District
  const handleOpenDistrictDialog = () => {
    setNewDistrictName('');
    setNewDistrictCode('');
    setFetchOsmBoundary(true);
    setShowAdvancedDistrict(false);
    setCustomCenterLat('');
    setCustomCenterLng('');
    setDistrictError(null);
    setDistrictDialogOpen(true);
  };

  const handleCreateDistrict = async () => {
    const trimmedName = newDistrictName.trim();
    if (!trimmedName) return;

    setDistrictError(null);
    try {
      const res = await createDistrict({
        name: trimmedName,
        code: newDistrictCode.trim() || undefined,
        fetchOsmBoundary,
        centerLat: customCenterLat ? Number(customCenterLat) : undefined,
        centerLng: customCenterLng ? Number(customCenterLng) : undefined
      }).unwrap();

      setDistrictDialogOpen(false);
      setSelectedDistrictId(res.id);
      showSuccess(`"${res.name}" tumani muvaffaqiyatli saqlandi!`);
      setSuccessNotice(`"${res.name}" muvaffaqiyatli saqlandi`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        'Tuman qo‘shishda xatolik yuz berdi. Bu nom yoki kod allaqachon mavjud bo‘lishi mumkin.';
      setDistrictError(errorMsg);
      showError(errorMsg);
    }
  };

  // Handlers - Mahalla
  const handleOpenMahallaDialog = () => {
    setTargetDistrictId(activeDistrictId || districts[0]?.id || '');
    setNewMahallaName('');
    setMahallaError(null);
    setMahallaDialogOpen(true);
  };

  const handleCreateMahalla = async () => {
    const chosenDistrictId = Number(targetDistrictId);
    const trimmedName = newMahallaName.trim();
    if (!trimmedName || !chosenDistrictId) return;

    setMahallaError(null);
    try {
      await createMahalla({
        districtId: chosenDistrictId,
        name: trimmedName
      }).unwrap();

      if (chosenDistrictId !== activeDistrictId) {
        setSelectedDistrictId(chosenDistrictId);
      }
      setMahallaPage(1);
      setMahallaDialogOpen(false);

      const targetDistrict = districts.find((d) => d.id === chosenDistrictId);
      showSuccess(`"${trimmedName}" mahallasi muvaffaqiyatli qo‘shildi!`);
      setSuccessNotice(
        `"${trimmedName}" mahallasi "${targetDistrict?.name || 'Tuman'}"ga qo‘shildi`
      );
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        'Mahalla qo‘shishda xatolik yuz berdi.';
      setMahallaError(errorMsg);
      showError(errorMsg);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <AppBreadcrumbs items={[{ label: 'Tumanlar va mahallalar' }]} />

      {/* Page Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Tumanlar va Mahallalar
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.25, fontWeight: 500 }}>
            Ma’muriy tumanlar, xarita chegaralari va hududiy mahallalar ro‘yxati
          </Typography>
        </Box>

        <AppButton
          variant="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDistrictDialog}
        >
          Yangi Tuman
        </AppButton>
      </Stack>

      {/* Success Notification */}
      {successNotice && (
        <Alert
          severity="success"
          icon={<CheckCircleOutlineIcon fontSize="small" />}
          onClose={() => setSuccessNotice(null)}
          sx={{
            fontWeight: 600,
            fontSize: '0.875rem',
            borderRadius: '10px',
            bgcolor: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0'
          }}
        >
          {successNotice}
        </Alert>
      )}

      {/* Main 2-Column Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' }, gap: 2.5 }}>
        {/* Left Panel: Districts List */}
        <DataTableCard sx={{ p: 0, borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <Box
            sx={{
              p: 2,
              px: 2.5,
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  bgcolor: '#F0FDF4',
                  color: 'primary.main',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <LocationCityOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>
                Tumanlar ({districts.length})
              </Typography>
            </Stack>

            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
              Tanlash uchun bosing
            </Typography>
          </Box>

          <AppTable minWidth="100%">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Tuman nomi</TableCell>
                <TableCell width={130} align="center" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Chegara</TableCell>
                <TableCell width={80} align="right" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingDistricts ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={22} color="primary" />
                  </TableCell>
                </TableRow>
              ) : districts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 6, color: '#94A3B8', fontSize: '0.875rem' }}>
                    Tumanlar kiritilmagan
                  </TableCell>
                </TableRow>
              ) : (
                districts.map((d) => {
                  const isSelected = d.id === activeDistrictId;
                  const hasBoundary = Boolean(d.polygon && Array.isArray(d.polygon) && d.polygon.length > 2);

                  return (
                    <TableRow
                      key={d.id}
                      hover
                      onClick={() => {
                        setSelectedDistrictId(d.id);
                        setMahallaPage(1);
                        setMahallaSearch('');
                      }}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: isSelected ? 'rgba(5, 150, 105, 0.05)' : 'inherit',
                        borderLeft: isSelected ? '3px solid' : '3px solid transparent',
                        borderColor: isSelected ? 'primary.main' : 'transparent',
                        '&:hover': {
                          bgcolor: isSelected ? 'rgba(5, 150, 105, 0.08)' : '#F8FAFC'
                        }
                      }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? 'primary.main' : '#1E293B',
                            fontSize: '0.88rem'
                          }}
                        >
                          {d.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                          Kod: {d.code}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.5 }}>
                        <Chip
                          size="small"
                          label={hasBoundary ? 'Poligon bor' : 'Markaz nuqta'}
                          sx={{
                            fontSize: '0.72rem',
                            height: 22,
                            fontWeight: 600,
                            borderRadius: '12px',
                            bgcolor: hasBoundary ? '#ECFDF5' : '#F1F5F9',
                            color: hasBoundary ? '#059669' : '#64748B',
                            border: 'none'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.5 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                          <Tooltip title="Xaritada ko‘rish">
                            <IconButton
                              size="small"
                              sx={{ color: '#64748B', '&:hover': { color: 'primary.main', bgcolor: '#F0FDF4' } }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/map?districtId=${d.id}`);
                              }}
                            >
                              <MapOutlinedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="O‘chirish">
                            <IconButton
                              size="small"
                              sx={{ color: '#64748B', '&:hover': { color: '#DC2626', bgcolor: '#FEF2F2' } }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`"${d.name}" tumanini o‘chirishni tasdiqlaysizmi?`)) {
                                  try {
                                    await deleteDistrict(d.id).unwrap();
                                    showSuccess(`"${d.name}" tumani muvaffaqiyatli o‘chirildi`);
                                  } catch (err: any) {
                                    showError(err?.data?.message || 'Tumanni o‘chirishda xatolik yuz berdi');
                                  }
                                }
                              }}
                            >
                              <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </AppTable>
        </DataTableCard>

        {/* Right Panel: Mahallas List */}
        <DataTableCard sx={{ p: 0, borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {/* Header Bar */}
          <Box
            sx={{
              p: 2,
              px: 2.5,
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5
            }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    bgcolor: '#F0FDF4',
                    color: 'primary.main',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <HomeWorkOutlinedIcon sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>
                  {activeDistrict?.name || 'Tuman'} mahallalari
                </Typography>
                <Chip
                  size="small"
                  label={`${rawMahallas.length} ta`}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    height: 20,
                    bgcolor: '#F1F5F9',
                    color: '#475569',
                    borderRadius: '10px'
                  }}
                />
              </Stack>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 170 }}>
                <AppSelectField
                  label="Tuman"
                  value={activeDistrictId || ''}
                  onChange={(e) => {
                    setSelectedDistrictId(Number(e.target.value));
                    setMahallaPage(1);
                    setMahallaSearch('');
                  }}
                  options={districts.map((d) => ({ value: d.id, label: d.name }))}
                />
              </Box>

              <AppButton
                variant="primary"
                size="small"
                startIcon={<AddIcon sx={{ fontSize: 17 }} />}
                disabled={!activeDistrictId}
                onClick={handleOpenMahallaDialog}
              >
                Mahalla qo‘shish
              </AppButton>
            </Stack>
          </Box>

          {/* Search Bar */}
          <Box sx={{ p: 1.5, px: 2.5, borderBottom: '1px solid #F1F5F9' }}>
            <TextField
              size="small"
              fullWidth
              placeholder={`"${activeDistrict?.name || 'Tuman'}" mahallalari orasidan qidirish...`}
              value={mahallaSearch}
              onChange={(e) => {
                setMahallaSearch(e.target.value);
                setMahallaPage(1);
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  bgcolor: '#F8FAFC',
                  '& fieldset': { borderColor: '#E2E8F0' },
                  '&:hover fieldset': { borderColor: '#CBD5E1' },
                  '&.Mui-focused': { bgcolor: '#FFFFFF' }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          <AppTable minWidth="100%">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell width={50} sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>#</TableCell>
                <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Mahalla nomi</TableCell>
                <TableCell width={160} sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Tegishli tuman</TableCell>
                <TableCell width={90} align="center" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>Holati</TableCell>
                <TableCell width={60} align="center" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingMahallas ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={22} color="primary" />
                  </TableCell>
                </TableRow>
              ) : paginatedMahallas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.875rem' }}>
                      {mahallaSearch
                        ? `"${mahallaSearch}" bo‘yicha mahalla topilmadi`
                        : `"${activeDistrict?.name || 'Tanlangan tuman'}"ga hali mahallalar kiritilmagan`}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMahallas.map((m, idx) => (
                  <TableRow key={m.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <TableCell sx={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.82rem', py: 1.5 }}>
                      {(mahallaPage - 1) * MAHALLAS_PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem', py: 1.5 }}>
                      {m.name}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip
                        size="small"
                        label={activeDistrict?.name || 'Tuman'}
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
                        label="Faol"
                        sx={{
                          fontSize: '0.72rem',
                          height: 22,
                          fontWeight: 600,
                          borderRadius: '12px',
                          bgcolor: '#ECFDF5',
                          color: '#059669',
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
                            if (window.confirm(`"${m.name}" mahallasini o‘chirishni tasdiqlaysizmi?`)) {
                              try {
                                await deleteMahalla(m.id).unwrap();
                                showSuccess(`"${m.name}" mahallasi muvaffaqiyatli o‘chirildi`);
                              } catch (err: any) {
                                showError(err?.data?.message || 'Mahallani o‘chirishda xatolik yuz berdi');
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

          {/* Mahalla Pagination Footer - Matching Chrono desk design */}
          {filteredMahallas.length > MAHALLAS_PER_PAGE && (
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
                Jami {filteredMahallas.length} tadan{' '}
                {(mahallaPage - 1) * MAHALLAS_PER_PAGE + 1}-
                {Math.min(mahallaPage * MAHALLAS_PER_PAGE, filteredMahallas.length)} ko‘rsatilmoqda
              </Typography>
              <Pagination
                count={totalMahallaPages}
                page={mahallaPage}
                onChange={(_, page) => setMahallaPage(page)}
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
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }
                  }
                }}
              />
            </Box>
          )}
        </DataTableCard>
      </Box>

      {/* Add District Dialog - Clean & Minimalist (Image 1 Style) */}
      <Dialog
        open={districtDialogOpen}
        onClose={() => setDistrictDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1.5,
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.12)',
            border: '1px solid #E2E8F0'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1, pb: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem', color: '#0F172A' }}>
            Yangi tuman qo‘shish
          </Typography>
          <IconButton
            size="small"
            onClick={() => setDistrictDialogOpen(false)}
            sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 2, py: 1.5 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {districtError && (
              <Alert severity="error" sx={{ fontSize: '0.82rem', borderRadius: '8px' }}>
                {districtError}
              </Alert>
            )}

            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Tuman nomi
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Masalan: Pop tumani yoki Uychi tumani"
                value={newDistrictName}
                onChange={(e) => {
                  setNewDistrictName(e.target.value);
                  setDistrictError(null);
                }}
                autoFocus
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
                Tizim kodi (ixtiyoriy)
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Masalan: pop (bo‘sh qolsa avtomatik shakllanadi)"
                value={newDistrictCode}
                onChange={(e) => setNewDistrictCode(e.target.value)}
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

            {/* Boundary Checkbox */}
            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={fetchOsmBoundary}
                    onChange={(e) => setFetchOsmBoundary(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.85rem' }}>
                    Xaritadan chegarani avtomatik aniqlash
                  </Typography>
                }
              />
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', pl: 3.75, fontSize: '0.75rem' }}>
                Rasmiy ma’muriy poligon avtomatik yuklanadi va tumanlar xaritada bir-biriga kirmaydi.
              </Typography>
            </Box>

            {/* Advanced toggle */}
            <Box>
              <Button
                size="small"
                startIcon={<TuneOutlinedIcon sx={{ fontSize: 16 }} />}
                onClick={() => setShowAdvancedDistrict(!showAdvancedDistrict)}
                sx={{
                  color: '#64748B',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  p: 0,
                  '&:hover': { bgcolor: 'transparent', color: 'primary.main' }
                }}
              >
                {showAdvancedDistrict ? 'Koordinatalarni yashirish' : 'Qo‘lda koordinata kiritish (Ixtiyoriy)'}
              </Button>

              <Collapse in={showAdvancedDistrict}>
                <Box sx={{ mt: 1, p: 1.5, borderRadius: '10px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      label="Kenglik (Lat)"
                      size="small"
                      placeholder="41.0108"
                      value={customCenterLat}
                      onChange={(e) => setCustomCenterLat(e.target.value)}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                    <TextField
                      label="Uzunlik (Lng)"
                      size="small"
                      placeholder="71.5775"
                      value={customCenterLng}
                      onChange={(e) => setCustomCenterLng(e.target.value)}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  </Stack>
                </Box>
              </Collapse>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2, pt: 1, pb: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreateDistrict}
            disabled={!newDistrictName.trim() || creatingDistrict}
            sx={{
              height: 42,
              borderRadius: '10px',
              bgcolor: 'primary.main',
              fontWeight: 600,
              fontSize: '0.9rem',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: 'primary.dark',
                boxShadow: 'none'
              }
            }}
          >
            {creatingDistrict ? <CircularProgress size={20} color="inherit" /> : 'Tumanni saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Mahalla Dialog - Clean & Minimalist (Image 1 Style) */}
      <Dialog
        open={mahallaDialogOpen}
        onClose={() => setMahallaDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1.5,
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.12)',
            border: '1px solid #E2E8F0'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1, pb: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem', color: '#0F172A' }}>
            Yangi mahalla qo‘shish
          </Typography>
          <IconButton
            size="small"
            onClick={() => setMahallaDialogOpen(false)}
            sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 2, py: 1.5 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {mahallaError && (
              <Alert severity="error" sx={{ fontSize: '0.82rem', borderRadius: '8px' }}>
                {mahallaError}
              </Alert>
            )}

            {/* District Chooser */}
            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Biriktiriladigan tuman
              </Typography>
              <AppSelectField
                value={targetDistrictId}
                onChange={(e) => setTargetDistrictId(Number(e.target.value))}
                options={districts.map((d) => ({
                  value: d.id,
                  label: d.name
                }))}
              />
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.74rem', display: 'block', mt: 0.5 }}>
                Yangi mahalla ushbu tuman tarkibiga biriktiriladi
              </Typography>
            </Box>

            {/* Mahalla Name */}
            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Mahalla nomi
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Masalan: Guliston MFY yoki Navbahor MFY"
                value={newMahallaName}
                onChange={(e) => {
                  setNewMahallaName(e.target.value);
                  setMahallaError(null);
                }}
                autoFocus
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
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2, pt: 1, pb: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreateMahalla}
            disabled={!newMahallaName.trim() || !targetDistrictId || creatingMahalla}
            sx={{
              height: 42,
              borderRadius: '10px',
              bgcolor: 'primary.main',
              fontWeight: 600,
              fontSize: '0.9rem',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: 'primary.dark',
                boxShadow: 'none'
              }
            }}
          >
            {creatingMahalla ? <CircularProgress size={20} color="inherit" /> : 'Mahallani saqlash'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DistrictsPage;
