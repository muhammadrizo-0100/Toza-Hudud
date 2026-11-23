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
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { District } from '../../../types';
import { useCreateDistrictMutation } from '../../../api/districtsApi';
import { useToast } from '../../../context/ToastContext';
import { useTranslation } from '../../../i18n';
import { translateDistrictName } from '../../../utils/districtNames';
import AppSelectField from '../../../components/common/AppSelectField';
import { NAMANGAN_DISTRICTS } from './districts.constants';

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
  const { t, lang } = useTranslation();
  const [createDistrict, { isLoading: creating }] = useCreateDistrictMutation();
  const [selectedName, setSelectedName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const existingNormalized = useMemo(() => {
    return new Set(
      existingDistricts.map((d) => d.name.toLowerCase().replace(/['‘`]/g, '').trim())
    );
  }, [existingDistricts]);

  const missingDistricts = useMemo(() => {
    return NAMANGAN_DISTRICTS.filter(
      (d) => !existingNormalized.has(d.name.toLowerCase().replace(/['‘`]/g, '').trim())
    );
  }, [existingNormalized]);

  const handleSubmit = async () => {
    const finalName = selectedName.trim();
    if (!finalName) return;

    setErrorMsg(null);
    try {
      const res = await createDistrict({
        name: finalName,
        fetchOsmBoundary: true
      }).unwrap();

      showSuccess(
        lang === 'oz'
          ? `"${translateDistrictName(res.name, 'oz')}" муваффақиятли қўшилди!`
          : `"${res.name}" tumani muvaffaqiyatli qo‘shildi!`
      );
      onCreated(res);
      setSelectedName('');
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        (lang === 'oz' ? 'Туман қўшишда хатолик юз берди.' : 'Tuman qo‘shishda xatolik yuz berdi.');
      setErrorMsg(msg);
      showError(msg);
    }
  };

  const allAdded = missingDistricts.length === 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', p: 1.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1, pb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem', color: '#0F172A' }}>
          {lang === 'oz' ? 'Янги туман қўшиш' : 'Yangi tuman qo‘shish'}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 2, py: 1.5 }}>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ fontSize: '0.82rem', borderRadius: '8px' }}>
              {errorMsg}
            </Alert>
          )}

          {allAdded ? (
            <Alert severity="success" icon={<CheckCircleOutlineIcon fontSize="inherit" />} sx={{ fontSize: '0.85rem', borderRadius: '10px' }}>
              {lang === 'oz'
                ? 'Наманган вилоятининг барча 14 та тумани тизимга тўлиқ киритилган ва фаол.'
                : 'Namangan viloyatining barcha 14 ta tumani tizimga to‘liq kiritilgan va faol.'}
            </Alert>
          ) : (
            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                {lang === 'oz' ? 'Туман номи' : 'Tuman nomi'}
              </Typography>
              <AppSelectField
                value={selectedName}
                onChange={(e) => {
                  setSelectedName(String(e.target.value));
                  setErrorMsg(null);
                }}
                options={missingDistricts.map((d) => ({
                  value: d.name,
                  label: translateDistrictName(d.name, lang)
                }))}
              />
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2, pt: 1, pb: 1.5 }}>
        {allAdded ? (
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{ height: 40, borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            {t('common.close')}
          </Button>
        ) : (
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={!selectedName || creating}
            sx={{
              height: 42,
              borderRadius: '10px',
              bgcolor: 'primary.main',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: 'primary.dark', boxShadow: 'none' }
            }}
          >
            {creating ? <CircularProgress size={20} color="inherit" /> : (lang === 'oz' ? 'Туманни қўшиш' : 'Tumanni qo‘shish')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
