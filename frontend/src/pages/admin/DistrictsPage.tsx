import React, { useState, useMemo } from 'react';
import { Box, Typography, Stack, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { useGetDistrictsQuery, useDeleteDistrictMutation } from '../../api/districtsApi';
import { useGetMahallasQuery, useDeleteMahallaMutation } from '../../api/mahallasApi';
import AppButton from '../../components/common/AppButton';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { useToast } from '../../context/ToastContext';
import { District, Mahalla } from '../../types';

import { DistrictsListTable } from './districts/DistrictsListTable';
import { MahallasListTable } from './districts/MahallasListTable';
import { DistrictAddDialog } from './districts/DistrictAddDialog';
import { MahallaAddDialog } from './districts/MahallaAddDialog';

export const DistrictsPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const [districtDialogOpen, setDistrictDialogOpen] = useState(false);
  const [mahallaDialogOpen, setMahallaDialogOpen] = useState(false);

  const { data: rawDistricts = [], isLoading: loadingDistricts } = useGetDistrictsQuery();
  const [deleteDistrict] = useDeleteDistrictMutation();

  const districts = useMemo(() => {
    return [...rawDistricts].sort((a, b) => a.id - b.id);
  }, [rawDistricts]);

  const activeDistrictId = selectedDistrictId || districts[0]?.id;
  const activeDistrict = districts.find((d) => d.id === activeDistrictId);

  const { data: rawMahallas = [], isLoading: loadingMahallas } = useGetMahallasQuery(
    activeDistrictId ? { districtId: activeDistrictId } : undefined
  );
  const [deleteMahalla] = useDeleteMahallaMutation();

  const handleDeleteDistrict = async (d: District) => {
    if (window.confirm(`"${d.name}" tumanini o‘chirishni tasdiqlaysizmi?`)) {
      try {
        await deleteDistrict(d.id).unwrap();
        showSuccess(`"${d.name}" tumani muvaffaqiyatli o‘chirildi`);
        if (selectedDistrictId === d.id) setSelectedDistrictId(null);
      } catch (err: unknown) {
        const msg = (err as { data?: { message?: string } })?.data?.message || 'Tumanni o‘chirishda xatolik yuz berdi';
        showError(msg);
      }
    }
  };

  const handleDeleteMahalla = async (m: Mahalla) => {
    if (window.confirm(`"${m.name}" mahallasini o‘chirishni tasdiqlaysizmi?`)) {
      try {
        await deleteMahalla(m.id).unwrap();
        showSuccess(`"${m.name}" mahallasi muvaffaqiyatli o‘chirildi`);
      } catch (err: unknown) {
        const msg = (err as { data?: { message?: string } })?.data?.message || 'Mahallani o‘chirishda xatolik yuz berdi';
        showError(msg);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <AppBreadcrumbs items={[{ label: 'Tumanlar va mahallalar' }]} />

      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Tumanlar va Mahallalar
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.25, fontWeight: 500 }}>
            Ma’muriy tumanlar, xarita chegaralari va hududiy mahallalar ro‘yxati
          </Typography>
        </Box>

        <AppButton variant="primary" startIcon={<AddIcon />} onClick={() => setDistrictDialogOpen(true)}>
          Yangi Tuman
        </AppButton>
      </Stack>

      {successNotice && (
        <Alert
          severity="success"
          icon={<CheckCircleOutlineIcon fontSize="small" />}
          onClose={() => setSuccessNotice(null)}
          sx={{ fontWeight: 600, fontSize: '0.875rem', borderRadius: '10px', bgcolor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}
        >
          {successNotice}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '5fr 7fr' }, gap: 2.5 }}>
        <DistrictsListTable
          districts={districts}
          loading={loadingDistricts}
          activeDistrictId={activeDistrictId}
          onSelectDistrict={(id) => setSelectedDistrictId(id)}
          onDeleteDistrict={handleDeleteDistrict}
        />

        <MahallasListTable
          districts={districts}
          activeDistrict={activeDistrict}
          activeDistrictId={activeDistrictId}
          mahallas={rawMahallas}
          loading={loadingMahallas}
          onSelectDistrict={(id) => setSelectedDistrictId(id)}
          onOpenAddMahalla={() => setMahallaDialogOpen(true)}
          onDeleteMahalla={handleDeleteMahalla}
        />
      </Box>

      <DistrictAddDialog
        open={districtDialogOpen}
        onClose={() => setDistrictDialogOpen(false)}
        existingDistricts={districts}
        onCreated={(res) => {
          setSelectedDistrictId(res.id);
          setSuccessNotice(`"${res.name}" muvaffaqiyatli saqlandi`);
          setTimeout(() => setSuccessNotice(null), 4000);
        }}
      />

      <MahallaAddDialog
        open={mahallaDialogOpen}
        onClose={() => setMahallaDialogOpen(false)}
        districts={districts}
        defaultDistrictId={activeDistrictId}
        onCreated={(targetId, mahallaName) => {
          setSelectedDistrictId(targetId);
          setSuccessNotice(`"${mahallaName}" mahallasi muvaffaqiyatli qo‘shildi`);
          setTimeout(() => setSuccessNotice(null), 4000);
        }}
      />
    </Box>
  );
};

export default DistrictsPage;
