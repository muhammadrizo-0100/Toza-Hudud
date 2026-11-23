import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { District } from '../../../types';
import { useCreateMahallaMutation } from '../../../api/mahallasApi';
import { useToast } from '../../../context/ToastContext';
import AppSelectField from '../../../components/common/AppSelectField';

interface MahallaAddDialogProps {
  open: boolean;
  onClose: () => void;
  districts: District[];
  defaultDistrictId?: number | '';
  onCreated: (targetDistrictId: number, mahallaName: string) => void;
}

export const MahallaAddDialog: React.FC<MahallaAddDialogProps> = ({
  open,
  onClose,
  districts,
  defaultDistrictId,
  onCreated
}) => {
  const { showSuccess, showError } = useToast();
  const [createMahalla, { isLoading: creating }] = useCreateMahallaMutation();
  const [targetDistrictId, setTargetDistrictId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTargetDistrictId(defaultDistrictId || districts[0]?.id || '');
      setName('');
      setErrorMsg(null);
    }
  }, [open, defaultDistrictId, districts]);

  const handleSubmit = async () => {
    const chosenDistrictId = Number(targetDistrictId);
    const trimmed = name.trim();
    if (!trimmed || !chosenDistrictId) return;

    setErrorMsg(null);
    try {
      await createMahalla({ districtId: chosenDistrictId, name: trimmed }).unwrap();
      showSuccess(`"${trimmed}" mahallasi muvaffaqiyatli qo‘shildi!`);
      onCreated(chosenDistrictId, trimmed);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        'Mahalla qo‘shishda xatolik yuz berdi.';
      setErrorMsg(msg);
      showError(msg);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1, pb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem', color: '#0F172A' }}>
          Yangi mahalla qo‘shish
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 2, py: 1.5 }}>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {errorMsg && <Alert severity="error" sx={{ fontSize: '0.82rem', borderRadius: '8px' }}>{errorMsg}</Alert>}
          <Box>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Biriktiriladigan tuman
            </Typography>
            <AppSelectField
              value={targetDistrictId}
              onChange={(e) => setTargetDistrictId(Number(e.target.value))}
              options={districts.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Mahalla nomi
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Masalan: Guliston MFY yoki Navbahor MFY"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrorMsg(null); }}
              autoFocus
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2, pt: 1, pb: 1.5 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={!name.trim() || !targetDistrictId || creating}
          sx={{ height: 42, borderRadius: '10px', bgcolor: 'primary.main', fontWeight: 600, textTransform: 'none' }}
        >
          {creating ? <CircularProgress size={20} color="inherit" /> : 'Mahallani saqlash'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
