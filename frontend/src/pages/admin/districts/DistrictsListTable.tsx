import React from 'react';
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
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DataTableCard from '../../../components/common/DataTableCard';
import { AppTable } from '../../../components/common/AppTable';
import { District } from '../../../types';
import { useTranslation } from '../../../i18n';
import { translateDistrictName } from '../../../utils/districtNames';

interface DistrictsListTableProps {
  districts: District[];
  loading: boolean;
  activeDistrictId?: number | null;
  onSelectDistrict: (id: number) => void;
  onDeleteDistrict: (district: District) => void;
}

export const DistrictsListTable: React.FC<DistrictsListTableProps> = ({
  districts,
  loading,
  activeDistrictId,
  onSelectDistrict,
  onDeleteDistrict
}) => {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();

  return (
    <DataTableCard sx={{ p: 0, borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#F0FDF4', color: 'primary.main', display: 'grid', placeItems: 'center' }}>
            <LocationCityOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.95rem' }}>
            {t('modules.districts.districtsTitle')} ({districts.length})
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
          {t('modules.districts.clickToSelect')}
        </Typography>
      </Box>

      <AppTable minWidth="100%">
        <TableHead>
          <TableRow sx={{ bgcolor: '#F8FAFC' }}>
            <TableCell sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>
              {lang === 'oz' ? 'Туман номи' : 'Tuman nomi'}
            </TableCell>
            <TableCell width={130} align="center" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>
              {lang === 'oz' ? 'Чегара' : 'Chegara'}
            </TableCell>
            <TableCell width={80} align="right" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', py: 1.25 }}>
              {t('common.actions')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={3} align="center" sx={{ py: 4 }}><CircularProgress size={22} color="primary" /></TableCell>
            </TableRow>
          ) : districts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} align="center" sx={{ py: 6, color: '#94A3B8', fontSize: '0.875rem' }}>
                {lang === 'oz' ? 'Туманлар киритилмаган' : 'Tumanlar kiritilmagan'}
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
                  onClick={() => onSelectDistrict(d.id)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'rgba(5, 150, 105, 0.05)' : 'inherit',
                    borderLeft: isSelected ? '3px solid' : '3px solid transparent',
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    '&:hover': { bgcolor: isSelected ? 'rgba(5, 150, 105, 0.08)' : '#F8FAFC' }
                  }}
                >
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 500, color: isSelected ? 'primary.main' : '#1E293B', fontSize: '0.88rem' }}>
                      {translateDistrictName(d.name, lang)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>{lang === 'oz' ? 'Код' : 'Kod'}: {d.code}</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.5 }}>
                    <Chip
                      size="small"
                      label={hasBoundary ? t('modules.districts.hasPolygon') : (lang === 'oz' ? 'Марказ нуқта' : 'Markaz nuqta')}
                      sx={{
                        fontSize: '0.72rem',
                        height: 22,
                        fontWeight: 600,
                        borderRadius: '12px',
                        bgcolor: hasBoundary ? '#ECFDF5' : '#F1F5F9',
                        color: hasBoundary ? '#059669' : '#64748B'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1.5 }}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                      <Tooltip title={lang === 'oz' ? 'Харитада кўриш' : 'Xaritada ko‘rish'}>
                        <IconButton
                          size="small"
                          sx={{ color: '#64748B', '&:hover': { color: 'primary.main', bgcolor: '#F0FDF4' } }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/map?districtId=${d.id}`); }}
                        >
                          <MapOutlinedIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          size="small"
                          sx={{ color: '#64748B', '&:hover': { color: '#DC2626', bgcolor: '#FEF2F2' } }}
                          onClick={(e) => { e.stopPropagation(); onDeleteDistrict(d); }}
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
  );
};
