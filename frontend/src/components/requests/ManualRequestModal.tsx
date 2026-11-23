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
import { useTranslation } from '../../i18n';
import { translateDistrictName } from '../../utils/districtNames';

interface ManualRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ManualRequestModal: React.FC<ManualRequestModalProps> = ({ open, onClose, onSaved }) => {
  const { t, lang } = useTranslation();
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
          {lang === 'oz' ? 'Янги чиқинди мурожаати киритиш' : 'Yangi chiqindi murojaati kiritish'}
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
                  {lang === 'oz' ? 'Туман' : 'Tuman'}
                </Typography>
                <AppSelectField
                  value={districtId}
                  onChange={(e) => {
                    setDistrictId(e.target.value as number);
                    setMahallaId('');
                  }}
                  options={districts.map((d) => ({
                    value: d.id,
                    label: translateDistrictName(d.name, lang)
                  }))}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  {lang === 'oz' ? 'Маҳалла' : 'Mahalla'}
                </Typography>
                <AppSelectField
                  value={mahallaId}
                  onChange={(e) => setMahallaId(e.target.value as number)}
                  options={[
                    { value: '', label: lang === 'oz' ? 'Танланмаган' : 'Tanlanmagan' },
                    ...mahallas.map((m) => ({ value: m.id, label: m.name }))
                  ]}
                />
              </Box>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  {lang === 'oz' ? 'Фуқаро Ф.И.Ш' : 'Fuqaro F.I.Sh'}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={lang === 'oz' ? 'Масалан: Алиев Вали' : 'Masalan: Aliyev Vali'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  {lang === 'oz' ? 'Телефон рақами' : 'Telefon raqami'}
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
                {lang === 'oz' ? 'Чиқинди тури' : 'Chiqindi turi'}
              </Typography>
              <AppSelectField
                value={wasteType}
                onChange={(e) => setWasteType(String(e.target.value))}
                options={[
                  { value: 'maishiy', label: t('modules.requests.householdWaste') },
                  { value: 'qurilish', label: t('modules.requests.constructionWaste') },
                  { value: 'xazon', label: t('modules.requests.foliageWaste') },
                  { value: 'katta_hajmli', label: t('modules.requests.bulkyWaste') },
                  { value: 'noqonuniy', label: lang === 'oz' ? 'Ноқонуний ташландиқ жой' : 'Noqonuniy tashlandiq joy' }
                ]}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                {lang === 'oz' ? 'Аниқ манзил' : 'Aniq manzil'}
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder={lang === 'oz' ? 'Кўча, уй ёки мўлжал' : 'Ko‘cha, uy yoki mo‘ljal'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                {lang === 'oz' ? 'Изоҳ / Қўшимча маълумот' : 'Izoh / Qo‘shimcha ma’lumot'}
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder={lang === 'oz' ? 'Ҳолат бўйича қўшимча тавсиф...' : 'Holat bo‘yicha qo‘shimcha tavsif...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.5 }}>
                {lang === 'oz' ? 'Сурат юклаш (Мажбурий)' : 'Surat yuklash (Majburiy)'}
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
            {t('common.cancel')}
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
            {isLoading ? <CircularProgress size={18} color="inherit" /> : (lang === 'oz' ? 'Мурожаатни сақлаш' : 'Murojaatni saqlash')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
