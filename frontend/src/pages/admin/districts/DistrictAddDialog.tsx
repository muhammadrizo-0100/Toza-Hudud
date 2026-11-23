import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  Alert,
  CircularProgress,
  Autocomplete,
  TextField,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { District } from '../../../types';
import { useCreateDistrictMutation } from '../../../api/districtsApi';
import { useToast } from '../../../context/ToastContext';
import {
  ALL_OFFICIAL_DISTRICTS,
  NAMANGAN_OFFICIAL_DISTRICTS,
  OfficialDistrictItem
} from './districts.constants';

interface DistrictAddDialogProps {
  open: boolean;
  onClose: () => void;
  existingDistricts: District[];
  onCreated: (created: District) => void;
}

export const DistrictAddDialog: React.FC<DistrictAddDialogProps> = ({
  open,
  onClose,
  existingDistricts,
  onCreated
}) => {
  const { showSuccess, showError } = useToast();
  const [createDistrict, { isLoading: creating }] = useCreateDistrictMutation();
  const [selectedItem, setSelectedItem] = useState<OfficialDistrictItem | null>(null);
  const [customName, setCustomName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const existingNormalized = useMemo(() => {
    return new Set(
      existingDistricts.map((d) => d.name.toLowerCase().replace(/['‘`]/g, '').trim())
    );
  }, [existingDistricts]);

  const missingNamangan = useMemo(() => {
    return NAMANGAN_OFFICIAL_DISTRICTS.filter(
      (d) => !existingNormalized.has(d.name.toLowerCase().replace(/['‘`]/g, '').trim())
    );
  }, [existingNormalized]);

  const availableCatalog = useMemo(() => {
    return ALL_OFFICIAL_DISTRICTS.filter(
      (d) => !existingNormalized.has(d.name.toLowerCase().replace(/['‘`]/g, '').trim())
    );
  }, [existingNormalized]);

  const handleSelectMissing = (item: OfficialDistrictItem) => {
    setSelectedItem(item);
    setCustomName(item.name);
    setErrorMsg(null);
  };

  const handleSubmit = async () => {
    const finalName = (selectedItem?.name || customName).trim();
    if (!finalName) return;

    if (finalName.length < 4 || !/^[A-Za-zА-Яа-яO‘o‘G‘g‘ShshChch\s\-'‘`]+$/i.test(finalName)) {
      setErrorMsg('Iltimos, haqiqiy tuman yoki shahar nomini to‘g‘ri kiriting.');
      return;
    }

    setErrorMsg(null);
    try {
      const res = await createDistrict({
        name: finalName,
        fetchOsmBoundary: true
      }).unwrap();

      showSuccess(`"${res.name}" tumani xaritaga muvaffaqiyatli biriktirildi!`);
      onCreated(res);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        'Tuman qo‘shishda xatolik yuz berdi. Bu hudud allaqachon mavjud bo‘lishi mumkin.';
      setErrorMsg(msg);
      showError(msg);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.5, pb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'grid', placeItems: 'center' }}>
            <LocationCityOutlinedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
              Tuman qo‘shish / ulash
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              Rasmiy tuman va uning 100% aniq xarita chegarasini biriktirish
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 2, py: 1.5 }}>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {errorMsg && <Alert severity="error" sx={{ fontSize: '0.82rem', borderRadius: '8px' }}>{errorMsg}</Alert>}
          {missingNamangan.length === 0 ? (
            <Alert severity="success" icon={<CheckCircleOutlineIcon fontSize="inherit" />} sx={{ fontSize: '0.82rem', borderRadius: '10px' }}>
              Namangan viloyatining barcha 14 ta ma’muriy tumani tizimga to‘liq kiritilgan va faol.
            </Alert>
          ) : (
            <Box>
              <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, display: 'block', mb: 0.75 }}>
                Namangan viloyatidan kiritilmagan tumanlar:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {missingNamangan.map((m) => (
                  <Chip key={m.code} label={m.name} clickable color={selectedItem?.code === m.code ? 'primary' : 'default'} onClick={() => handleSelectMissing(m)} sx={{ fontWeight: 500, fontSize: '0.78rem' }} />
                ))}
              </Stack>
            </Box>
          )}

          <Box>
            <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, display: 'block', mb: 0.75 }}>
              Rasmiy tuman yoki shaharni tanlang
            </Typography>
            <Autocomplete
              options={availableCatalog}
              getOptionLabel={(opt) => (typeof opt === 'string' ? opt : `${opt.name} (${opt.region} viloyati)`)}
              value={selectedItem}
              onChange={(_, val) => {
                if (typeof val === 'string') {
                  setSelectedItem(null);
                  setCustomName(val);
                } else {
                  setSelectedItem(val);
                  setCustomName(val ? val.name : '');
                }
                setErrorMsg(null);
              }}
              freeSolo
              onInputChange={(_, val) => { setCustomName(val); setErrorMsg(null); }}
              renderInput={(params) => <TextField {...params} size="small" placeholder="Masalan: Chust tumani, Qo‘qon shahri..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />}
            />
          </Box>

          <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', gap: 1.25 }}>
            <AutoAwesomeOutlinedIcon sx={{ fontSize: 20, color: '#059669', mt: 0.2, flexShrink: 0 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#166534', fontSize: '0.82rem' }}>100% Haqiqiy ma’muriy chegara (OSM)</Typography>
              <Typography variant="caption" sx={{ color: '#15803D', display: 'block', mt: 0.25, fontSize: '0.76rem' }}>
                Tuman tanlanganda sun’iy 8 burchakli poligonlar yaratilmaydi. Rasmiy chegaralar biriktiriladi.
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 1.5, pt: 1, gap: 1 }}>
        <Button onClick={onClose} disabled={creating} sx={{ borderRadius: '10px', textTransform: 'none', color: '#64748B' }}>Bekor qilish</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!(selectedItem?.name || customName.trim()) || creating} sx={{ flex: 1, height: 40, borderRadius: '10px', bgcolor: 'primary.main', textTransform: 'none', fontWeight: 600 }}>
          {creating ? <CircularProgress size={18} color="inherit" /> : 'Tumanni xaritaga biriktirish'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
