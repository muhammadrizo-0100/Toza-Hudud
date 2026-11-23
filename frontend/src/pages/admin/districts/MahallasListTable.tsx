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
  TextField,
  CircularProgress,
  Chip,
  Tooltip,
  InputAdornment,
  Pagination
} from '@mui/material';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DataTableCard from '../../../components/common/DataTableCard';
import { AppTable } from '../../../components/common/AppTable';
import AppButton from '../../../components/common/AppButton';
import AppSelectField from '../../../components/common/AppSelectField';
import { District, Mahalla } from '../../../types';
import { useTranslation } from '../../../i18n';

interface MahallasListTableProps {
  districts: District[];
  activeDistrict?: District;
  activeDistrictId?: number | null;
  mahallas: Mahalla[];
  loading: boolean;
  onSelectDistrict: (id: number) => void;
  onOpenAddMahalla: () => void;
  onDeleteMahalla: (mahalla: Mahalla) => void;
}

export const MahallasListTable: React.FC<MahallasListTableProps> = ({
  districts,
  activeDistrict,
  activeDistrictId,
  mahallas,
  loading,
  onSelectDistrict,
  onOpenAddMahalla,
  onDeleteMahalla
}) => {
  const { t, lang } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const filtered = useMemo(() => {
    if (!search.trim()) return mahallas;
    const q = search.toLowerCase();
    return mahallas.filter((m) => m.name.toLowerCase().includes(q));
  }, [mahallas, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  return (
    <DataTableCard sx={{ p: 0, borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#F0FDF4', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
            <HomeWorkOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>
            {activeDistrict?.name || (lang === 'oz' ? 'Туман' : 'Tuman')} {t('modules.districts.neighborhoodsTitle')}
          </Typography>
          <Chip size="small" label={`${mahallas.length} ${lang === 'oz' ? 'та' : 'ta'}`} sx={{ fontWeight: 600, fontSize: '0.72rem', height: 20, bgcolor: '#F1F5F9', color: '#475569', borderRadius: '10px' }} />
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 170 }}>
            <AppSelectField
              label={t('modules.map.selectDistrict')}
              value={activeDistrictId || ''}
              onChange={(e) => { onSelectDistrict(Number(e.target.value)); setPage(1); setSearch(''); }}
              options={districts.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Box>
          <AppButton variant="primary" size="small" startIcon={<AddIcon sx={{ fontSize: 17 }} />} disabled={!activeDistrictId} onClick={onOpenAddMahalla}>
            {t('modules.districts.addNeighborhood')}
          </AppButton>
        </Stack>
      </Box>

      <Box sx={{ p: 1.5, px: 2.5, borderBottom: '1px solid #F1F5F9' }}>
        <TextField
          size="small"
          fullWidth
          placeholder={lang === 'oz' ? `"${activeDistrict?.name || 'Туман'}" маҳаллалари орасидан қидириш...` : `"${activeDistrict?.name || 'Tuman'}" mahallalari orasidan qidirish...`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F8FAFC' } }}
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
            <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>
              {t('modules.districts.neighborhoodName')}
            </TableCell>
            <TableCell width={160} sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>
              {t('modules.districts.belongingDistrict')}
            </TableCell>
            <TableCell width={90} align="center" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>
              {t('common.status')}
            </TableCell>
            <TableCell width={60} align="center" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={22} color="primary" /></TableCell></TableRow>
          ) : paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#94A3B8', fontSize: '0.875rem' }}>
                {search ? `"${search}" bo‘yicha mahalla topilmadi` : `"${activeDistrict?.name || 'Tanlangan tuman'}"ga hali mahallalar kiritilmagan`}
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((m, idx) => (
              <TableRow key={m.id} hover sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                <TableCell sx={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.82rem', py: 1.5 }}>
                  {(page - 1) * PER_PAGE + idx + 1}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.88rem', py: 1.5 }}>{m.name}</TableCell>
                <TableCell sx={{ py: 1.5 }}>
                  <Chip size="small" label={activeDistrict?.name || (lang === 'oz' ? 'Туман' : 'Tuman')} sx={{ fontSize: '0.74rem', height: 22, fontWeight: 500, borderRadius: '8px', bgcolor: '#F1F5F9', color: '#475569' }} />
                </TableCell>
                <TableCell align="center" sx={{ py: 1.5 }}>
                  <Chip size="small" label={t('common.active')} sx={{ fontSize: '0.72rem', height: 22, fontWeight: 600, borderRadius: '12px', bgcolor: '#ECFDF5', color: '#059669' }} />
                </TableCell>
                <TableCell align="center" sx={{ py: 1.5 }}>
                  <Tooltip title={t('common.delete')}>
                    <IconButton size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#DC2626', bgcolor: '#FEF2F2' } }} onClick={() => onDeleteMahalla(m)}>
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AppTable>

      {filtered.length > PER_PAGE && (
        <Box sx={{ p: 1.5, px: 2.5, borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
            Jami {filtered.length} tadan {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, filtered.length)} ko‘rsatilmoqda
          </Typography>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" shape="rounded" variant="outlined" />
        </Box>
      )}
    </DataTableCard>
  );
};
