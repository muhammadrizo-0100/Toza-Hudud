import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Button,
  FormControl,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  IconButton,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AppImageUpload from '../common/AppImageUpload';
import AppSelectField from '../common/AppSelectField';
import AppPhoneField from '../common/AppPhoneField';
import { useGetDistrictsQuery } from '../../api/districtsApi';
import { useGetMahallasQuery } from '../../api/mahallasApi';
import { useSubmitPublicRequestMutation } from '../../api/publicApi';
import { formatUzPhone, cleanUzPhone, validateUzPhone } from '../../utils/phone';
import { useToast } from '../../context/ToastContext';

interface ManualRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ManualRequestModal: React.FC<ManualRequestModalProps> = ({ open, onClose, onSaved }) => {
  const [districtId, setDistrictId] = useState<number | ''>(1);
  const [mahallaId, setMahallaId] = useState<number | ''>('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [wasteType, setWasteType] = useState('maishiy');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { showSuccess, showError } = useToast();

  const { data: districts = [] } = useGetDistrictsQuery();
  const { data: mahallas = [] } = useGetMahallasQuery(districtId ? { districtId: Number(districtId) } : undefined);
  const [submitRequest, { isLoading }] = useSubmitPublicRequestMutation();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Surat yuklash majburiy.');
      showError('Surat yuklash majburiy.');
      return;
    }
    if (!districtId) {
      setErrorMsg('Tuman tanlanishi kerak.');
      showError('Tuman tanlanishi kerak.');
      return;
    }

    const pVal = validateUzPhone(phone);
    if (!pVal.isValid) {
      setErrorMsg(pVal.error || 'Telefon raqam noto‘g‘ri kiritildi');
      showError(pVal.error || 'Telefon raqam noto‘g‘ri kiritildi');
      return;
    }

    setErrorMsg('');
    const formData = new FormData();
    formData.append('beforePhoto', file);
    formData.append('districtId', String(districtId));
    if (mahallaId) formData.append('mahallaId', String(mahallaId));
    formData.append('citizenPhone', cleanUzPhone(phone));
    if (fullName.trim()) formData.append('citizenFullName', fullName.trim());
    formData.append('wasteType', wasteType);
    if (address.trim()) formData.append('address', address.trim());
    if (description.trim()) formData.append('description', description.trim());

    try {
      await submitRequest(formData).unwrap();
      showSuccess('Yangi murojaat muvaffaqiyatli saqlandi!');
      onSaved();
      onClose();
    } catch {
      const msg = 'Murojaatni saqlashda xatolik yuz berdi.';
      setErrorMsg(msg);
      showError(msg);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          Yangi chiqindi murojaati kiritish
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <form onSubmit={handleSave}>
        <DialogContent sx={{ px: 2, py: 1.5 }}>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {errorMsg && (
              <Alert severity="error" sx={{ borderRadius: '10px', fontSize: '0.85rem' }}>
                {errorMsg}
              </Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Tuman
                </Typography>
                <AppSelectField
                  value={districtId}
                  onChange={(e) => {
                    setDistrictId(e.target.value as number);
                    setMahallaId('');
                  }}
                  options={districts.map((d) => ({ value: d.id, label: d.name }))}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Mahalla
                </Typography>
                <AppSelectField
                  value={mahallaId}
                  onChange={(e) => setMahallaId(e.target.value as number)}
                  options={[
                    { value: '', label: 'Tanlanmagan' },
                    ...mahallas.map((m) => ({ value: m.id, label: m.name }))
                  ]}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Fuqaro F.I.Sh
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Masalan: Aliyev Vali"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Telefon raqami
                </Typography>
                <AppPhoneField
                  value={phone}
                  onChange={setPhone}
                  required
                />
              </Box>
            </Stack>

            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Chiqindi turi
              </Typography>
              <AppSelectField
                value={wasteType}
                onChange={(e) => setWasteType(String(e.target.value))}
                options={[
                  { value: 'maishiy', label: 'Maishiy chiqindilar' },
                  { value: 'qurilish', label: 'Qurilish chiqindilari' },
                  { value: 'xazon', label: 'Xazon va daraxt shoxlari' },
                  { value: 'katta_hajmli', label: 'Katta hajmli chiqindilar' },
                  { value: 'noqonuniy', label: 'Noqonuniy tashlandiq joy' }
                ]}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Aniq manzil
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Ko‘cha, uy yoki mo‘ljal"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Izoh / Qo‘shimcha ma’lumot
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="Holat bo‘yicha qo‘shimcha tavsif..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Surat yuklash (Majburiy)
              </Typography>
              <AppImageUpload value={file} onChange={setFile} />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2, pt: 1, pb: 1.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onClose}
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
            type="submit"
            variant="contained"
            disabled={isLoading}
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
            {isLoading ? <CircularProgress size={18} color="inherit" /> : 'Murojaatni saqlash'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
