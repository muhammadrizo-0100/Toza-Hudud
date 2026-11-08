import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Chip,
  IconButton
} from '@mui/material';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import TelegramIcon from '@mui/icons-material/Telegram';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

import {
  useGetPublicLocationsQuery,
  useSubmitPublicRequestMutation
} from '../../api/publicApi';
import AppPhoneField from '../../components/common/AppPhoneField';
import { LocationPickerModal } from '../../components/map/LocationPickerModal';
import { detectDistrictByPoint } from '../../constants/boundaries';
import { cleanUzPhone, validateUzPhone } from '../../utils/phone';
import { useToast } from '../../context/ToastContext';

// Spacious, notched-outline input styling matching Davlatobod / SaaS standard with emerald brand accents
const spaciousInputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    bgcolor: '#FFFFFF',
    fontSize: '0.94rem',
    fontWeight: 500,
    color: '#0F172A',
    minHeight: '48px',
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: '#D1D5DB', // Clean, crisp border line
      borderWidth: '1.5px',
      borderRadius: '12px'
    },
    '&:hover fieldset': {
      borderColor: '#9CA3AF',
      borderWidth: '1.5px'
    },
    '&.Mui-focused fieldset': {
      borderColor: '#059669', // Emerald active border
      borderWidth: '2px',
      boxShadow: '0 0 0 3.5px rgba(5, 150, 105, 0.14)'
    }
  },
  '& .MuiInputLabel-root': {
    color: '#64748B',
    fontSize: '0.9rem',
    fontWeight: 500,
    '&.Mui-focused': {
      color: '#059669',
      fontWeight: 700
    }
  },
  '& .MuiInputBase-input': {
    py: '12px',
    px: '15px',
    color: '#0F172A',
    fontSize: '0.94rem',
    fontWeight: 500,
    '&::placeholder': {
      color: '#94A3B8',
      opacity: 1
    }
  },
  '& .MuiSelect-select': {
    py: '12px',
    px: '15px',
    color: '#0F172A',
    fontSize: '0.94rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center'
  },
  '& .MuiSelect-icon': {
    color: '#64748B',
    fontSize: 22,
    right: 12
  }
};

const WASTE_TYPES = [
  { value: 'maishiy', label: 'Maishiy chiqindilar' },
  { value: 'katta_hajmli', label: 'Katta hajmli chiqindilar' },
  { value: 'qurilish', label: 'Qurilish chiqindilari' },
  { value: 'tashlandiq', label: 'Noqonuniy to‘plangan chiqindi' }
];

export const PublicPortalPage: React.FC = () => {
  const navigate = useNavigate();

  // Submit Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [wasteType, setWasteType] = useState('maishiy');
  const [districtId, setDistrictId] = useState<number | ''>('');
  const [mahallaId, setMahallaId] = useState<number | ''>('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();

  // Location / GPS states
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const [submittedId, setSubmittedId] = useState<number | null>(null);

  // API hooks
  const { data: locations } = useGetPublicLocationsQuery(districtId ? { districtId: Number(districtId) } : undefined);
  const [submitRequest, { isLoading: isSubmitting }] = useSubmitPublicRequestMutation();

  // Handle Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        showError('Fayl hajmi 5 MB dan oshmasligi kerak');
        return;
      }
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
      showSuccess(`Fotosurat biriktirildi: ${selected.name}`);
    }
  };

  const handleRemovePhoto = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Handle GPS button click
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setGpsMessage('Qurilmangizda geolokatsiya qo‘llab-quvvatlanmaydi.');
      return;
    }

    setGpsLoading(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);

        // Auto-detect district
        const detected = detectDistrictByPoint([latitude, longitude]);
        let dName = '';
        if (detected && locations?.districts) {
          const matched = locations.districts.find(
            (d) => d.code.toLowerCase().replace(/[^a-z0-9]/g, '') === detected.replace(/[^a-z0-9]/g, '')
          );
          if (matched) {
            setDistrictId(matched.id);
            dName = matched.name;
          }
        }

        const msg = dName ? `${dName}` : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setGpsMessage(msg);
        showSuccess(`Joriy GPS lokatsiyangiz aniqlandi: ${msg}`);
      },
      (err) => {
        setGpsLoading(false);
        setGpsMessage('GPS aniqlab bo‘lmadi.');
        showError('GPS lokatsiyani aniqlashda xatolik. Xaritadan belgilang.');
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle Map Picker Confirm (Clear visual UX feedback)
  const handleMapConfirm = (selectedLat: number, selectedLng: number, detectedCode: string | null) => {
    setLat(selectedLat);
    setLng(selectedLng);

    let foundDistrictName = '';
    if (detectedCode && locations?.districts) {
      const matched = locations.districts.find(
        (d) => d.code.toLowerCase().replace(/[^a-z0-9]/g, '') === detectedCode.replace(/[^a-z0-9]/g, '')
      );
      if (matched) {
        setDistrictId(matched.id);
        foundDistrictName = matched.name;
      }
    }

    const label = foundDistrictName || 'Tanlangan hudud';
    setGpsMessage(label);
    showSuccess(`Xaritadan joylashuv belgilandi: ${label} (${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)})`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!districtId) {
      showError('Tumaningizni tanlang');
      return;
    }
    const pVal = validateUzPhone(phone);
    if (!pVal.isValid) {
      showError(pVal.error || 'Telefon raqam noto‘g‘ri kiritildi');
      return;
    }
    if (!file) {
      showError('Chiqindi holatini tasdiqlovchi fotosuratni yuklang');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('districtId', String(districtId));
    if (mahallaId) formData.append('mahallaId', String(mahallaId));
    formData.append('citizenPhone', cleanUzPhone(phone));
    if (fullName.trim()) formData.append('citizenFullName', fullName.trim());
    formData.append('wasteType', wasteType);
    if (address.trim()) formData.append('address', address.trim());
    if (description.trim()) formData.append('description', description.trim());
    if (lat) formData.append('lat', String(lat));
    if (lng) formData.append('lng', String(lng));

    try {
      const res = await submitRequest(formData).unwrap();
      setSubmittedId(res.requestId);
      showSuccess(`Murojaatingiz qabul qilindi! Murojaat №${res.requestId}`);
      handleRemovePhoto();
      setPhone('');
      setFullName('');
      setAddress('');
      setDescription('');
      setLat(null);
      setLng(null);
      setGpsMessage(null);
    } catch (err: any) {
      console.error('Submit error:', err);
      showError(err?.data?.message || 'Murojaatni yuborishda xatolik yuz berdi. Qayta urinib ko‘ring.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 10% 12%, rgba(5, 150, 105, 0.08) 0%, transparent 45%), radial-gradient(circle at 90% 88%, rgba(16, 185, 129, 0.08) 0%, transparent 45%), linear-gradient(135deg, #F0FDF4 0%, #F8FAFC 50%, #ECFDF5 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        py: { xs: 2.5, md: 3 },
        px: { xs: 2, sm: 3 }
      }}
    >
      {/* Top Header Link (Only "Rahbar / Xodim ↗", clean and sleek) */}
      <Box
        sx={{
          width: '100%',
          maxWidth: '1160px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          mb: 1.5
        }}
      >
        <Button
          onClick={() => navigate('/login')}
          startIcon={<SecurityOutlinedIcon sx={{ fontSize: 18, color: '#059669' }} />}
          endIcon={<NorthEastIcon sx={{ fontSize: 14, color: '#059669' }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            color: '#1E293B',
            border: '1.5px solid #CBD5E1',
            bgcolor: '#FFFFFF',
            px: 2,
            py: 0.7,
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: '#F0FDF4',
              borderColor: '#059669',
              color: '#047857'
            }
          }}
        >
          Rahbar / Xodim
        </Button>
      </Box>

      {/* Main 2-Card Layout (Toza Hudud Emerald Theme) */}
      <Box
        sx={{
          width: '100%',
          maxWidth: '1160px',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
          gap: { xs: 2.5, md: 3.5 },
          alignItems: 'stretch'
        }}
      >
        {/* LEFT CARD: Informational Guide & Telegram Bot */}
        <Card
          elevation={0}
          sx={{
            p: { xs: 3, sm: 3.5, md: 4 },
            borderRadius: '20px',
            bgcolor: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.05), 0 2px 6px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Box>
            {/* Circular Emerald Badge */}
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#059669',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 8px 22px rgba(5, 150, 105, 0.35)',
                mb: 2.5
              }}
            >
              <DeleteSweepOutlinedIcon sx={{ fontSize: 26 }} />
            </Box>

            {/* Sub-label tag */}
            <Typography
              sx={{
                fontSize: '0.74rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: '#059669',
                textTransform: 'uppercase',
                mb: 1.5
              }}
            >
              TOZA HUDUD PORTALI
            </Typography>

            {/* Display Hero Title */}
            <Typography
              sx={{
                fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.8rem' },
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1.28,
                letterSpacing: '-0.02em',
                mb: 2
              }}
            >
              Murojaatlarni tez va tartibli tarzda yuboring.
            </Typography>

            {/* Description Paragraph */}
            <Typography
              sx={{
                color: '#475569',
                fontSize: '0.88rem',
                lineHeight: 1.65,
                mb: 3
              }}
            >
              Mahalla, bino va muammo yo‘nalishini tanlab, murojaatingizni tizimga yuboring. Yuborilgan ariza raqami orqali ichki tizimda qayta ishlanadi.
            </Typography>

            {/* Dashed Separator */}
            <Box sx={{ borderTop: '1px dashed #CBD5E1', my: 2.5 }} />

            {/* "Nimalarni tayyorlang" section */}
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '0.9rem',
                color: '#0F172A',
                mb: 1.5
              }}
            >
              Nimalarni tayyorlang
            </Typography>

            <Stack spacing={1.25} sx={{ color: '#334155', fontSize: '0.84rem', lineHeight: 1.55 }}>
              <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>
                To‘liq ism, telefon raqam, manzil va muammo tavsifi kerak bo‘ladi.
              </Typography>
              <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>
                Zarur bo‘lsa 2 tagacha rasm biriktirishingiz mumkin.
              </Typography>
              <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>
                Murojaat yuborilgach tizim sizga raqam beradi.
              </Typography>
            </Stack>
          </Box>

          {/* TELEGRAM BOT QUICK LINK BANNER (Official Telegram Brand Colors) */}
          <Box
            component="a"
            href="https://t.me/toza_hudud_public_bot"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              mt: 3.5,
              p: 2,
              borderRadius: '14px',
              bgcolor: '#F0F9FF',
              border: '1.5px solid #BAE6FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: '#E0F2FE',
                borderColor: '#229ED9',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 18px rgba(34, 158, 217, 0.22)'
              }
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: '#229ED9',
                  color: '#FFFFFF',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 4px 12px rgba(34, 158, 217, 0.35)',
                  flexShrink: 0
                }}
              >
                <TelegramIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.86rem', lineHeight: 1.2 }}>
                  Telegram Bot orqali tezkor yuborish
                </Typography>
                <Typography sx={{ color: '#0284C7', fontWeight: 600, fontSize: '0.76rem', mt: 0.25 }}>
                  @toza_hudud_public_bot bilan 1 daqiqada
                </Typography>
              </Box>
            </Stack>
            <OpenInNewOutlinedIcon sx={{ fontSize: 19, color: '#229ED9', flexShrink: 0 }} />
          </Box>
        </Card>

        {/* RIGHT CARD: Online Application Form (Clean, without tabs or tracking toggle) */}
        <Card
          elevation={0}
          sx={{
            p: { xs: 3, sm: 3.5, md: 4 },
            borderRadius: '20px',
            bgcolor: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.05), 0 2px 6px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Header Row: Title & Subtitle (Clean & Direct) */}
          <Box sx={{ mb: 2.25 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', lineHeight: 1.2 }}>
              Murojaat onlayn kiritish
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '0.82rem', mt: 0.4, fontWeight: 500 }}>
              Tartib bo‘yicha ma'lumotlarni kiriting
            </Typography>
          </Box>

          {/* Success Alert */}
          {submittedId && (
            <Alert
              severity="success"
              icon={<CheckCircleOutlinedIcon fontSize="inherit" />}
              sx={{ mb: 2, py: 0.5, borderRadius: '12px', border: '1.5px solid #86EFAC', bgcolor: '#F0FDF4' }}
              action={
                <Button color="inherit" size="small" onClick={() => setSubmittedId(null)} sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                  Yangi
                </Button>
              }
            >
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', fontSize: '0.84rem', color: '#065F46' }}>
                Murojaatingiz muvaffaqiyatli qabul qilindi! Raqam: #{submittedId}
              </Typography>
            </Alert>
          )}

          {/* SUBMIT FORM (Exact layout & notched floating labels matching sample image) */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            {/* Row 1: F.I.Sh (Full width) */}
            <TextField
              fullWidth
              label="F.I.Sh"
              placeholder="Ism va familiyangiz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              sx={spaciousInputSx}
            />

            {/* Row 2: Telefon & Muammo yo‘nalishi */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <AppPhoneField
                required
                fullWidth
                label="Telefon"
                placeholder="Telefon raqam"
                value={phone}
                onChange={setPhone}
                sx={spaciousInputSx}
              />

              <FormControl fullWidth sx={spaciousInputSx}>
                <InputLabel id="waste-type-label">Muammo yo‘nalishi</InputLabel>
                <Select
                  labelId="waste-type-label"
                  id="waste-type-select"
                  value={wasteType}
                  label="Muammo yo‘nalishi"
                  onChange={(e) => setWasteType(e.target.value)}
                  IconComponent={KeyboardArrowDownIcon}
                >
                  {WASTE_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value} sx={{ fontSize: '0.92rem', fontWeight: 500 }}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Row 3: Tuman & Mahalla */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <FormControl fullWidth sx={spaciousInputSx}>
                <InputLabel id="district-label">Tumaningizni tanlang *</InputLabel>
                <Select
                  labelId="district-label"
                  id="district-select"
                  value={districtId}
                  label="Tumaningizni tanlang *"
                  onChange={(e) => {
                    setDistrictId(e.target.value as number);
                    setMahallaId('');
                  }}
                  IconComponent={KeyboardArrowDownIcon}
                >
                  {locations?.districts.map((d) => (
                    <MenuItem key={d.id} value={d.id} sx={{ fontSize: '0.92rem', fontWeight: 500 }}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={spaciousInputSx} disabled={!districtId}>
                <InputLabel id="mahalla-label">Mahalla (ixtiyoriy)</InputLabel>
                <Select
                  labelId="mahalla-label"
                  id="mahalla-select"
                  value={mahallaId}
                  label="Mahalla (ixtiyoriy)"
                  onChange={(e) => setMahallaId(e.target.value as number)}
                  IconComponent={KeyboardArrowDownIcon}
                >
                  <MenuItem value="">
                    <em>Tanlanmagan</em>
                  </MenuItem>
                  {locations?.mahallas.map((m) => (
                    <MenuItem key={m.id} value={m.id} sx={{ fontSize: '0.92rem', fontWeight: 500 }}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Row 4: Aniq manzil / Xonadon & Qo‘shimcha manzil / izoh */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <TextField
                fullWidth
                label="Xonadon raqami (ixtiyoriy)"
                placeholder="Masalan: 14-uy, 2-xonadon"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                sx={spaciousInputSx}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Qo‘shimcha manzil / izoh"
                placeholder="Mo‘ljal yoki chiqindi haqida ma'lumot"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={spaciousInputSx}
              />
            </Box>

            {/* Row 5: Location Selector / Confirmation Box */}
            {lat && lng ? (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.08)'
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      bgcolor: '#059669',
                      color: '#FFFFFF',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    <PlaceOutlinedIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#065F46' }}>
                        Joylashuv belgilandi: {gpsMessage || 'Xaritada tanlangan joy'}
                      </Typography>
                      <Chip
                        size="small"
                        icon={<CheckCircleOutlinedIcon style={{ fontSize: 13, color: '#fff' }} />}
                        label="Saqlandi"
                        sx={{ bgcolor: '#059669', color: '#FFFFFF', fontWeight: 700, height: 20, fontSize: '0.68rem' }}
                      />
                    </Stack>
                    <Typography sx={{ fontSize: '0.75rem', color: '#047857', fontWeight: 500, mt: 0.2 }}>
                      Koordinatalar: {lat.toFixed(5)}, {lng.toFixed(5)} • Chiqindi yig‘ish guruhiga yo‘naltiriladi
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Button
                    size="small"
                    onClick={() => setMapPickerOpen(true)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      color: '#065F46',
                      bgcolor: '#FFFFFF',
                      border: '1.5px solid #86EFAC',
                      borderRadius: '8px',
                      py: 0.45,
                      px: 1.4,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      '&:hover': { bgcolor: '#DCFCE7', borderColor: '#059669' }
                    }}
                  >
                    O‘zgartirish
                  </Button>
                  <IconButton
                    size="small"
                    title="Lokatsiyani bekor qilish"
                    onClick={() => {
                      setLat(null);
                      setLng(null);
                      setGpsMessage(null);
                    }}
                    sx={{ color: '#065F46', p: 0.5, '&:hover': { bgcolor: '#DCFCE7' } }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </Box>
            ) : (
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: '12px',
                  border: '1.5px dashed #CBD5E1',
                  bgcolor: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    type="button"
                    size="small"
                    startIcon={<MapOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setMapPickerOpen(true)}
                    sx={{
                      py: 0.55,
                      px: 1.5,
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      borderRadius: '8px',
                      color: '#0F172A',
                      bgcolor: '#FFFFFF',
                      textTransform: 'none',
                      border: '1.5px solid #CBD5E1',
                      '&:hover': { bgcolor: '#F0FDF4', borderColor: '#059669', color: '#047857' }
                    }}
                  >
                    Xaritadan nuqtani belgilash
                  </Button>

                  <Button
                    type="button"
                    size="small"
                    startIcon={gpsLoading ? <CircularProgress size={13} color="inherit" /> : <MyLocationOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={handleGetGPS}
                    disabled={gpsLoading}
                    sx={{
                      py: 0.55,
                      px: 1.3,
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      borderRadius: '8px',
                      color: '#0F172A',
                      bgcolor: '#FFFFFF',
                      textTransform: 'none',
                      border: '1.5px solid #CBD5E1',
                      '&:hover': { bgcolor: '#F0FDF4', borderColor: '#059669', color: '#047857' }
                    }}
                  >
                    {gpsLoading ? 'Aniqlanmoqda...' : 'Joriy GPS'}
                  </Button>
                </Stack>

                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.74rem', display: { xs: 'none', sm: 'block' } }}>
                  (Lokatsiya ixtiyoriy)
                </Typography>
              </Box>
            )}

            {/* Row 6: Rasmlar section (Large rectangular 4-burchak preview) */}
            <Box sx={{ mt: 0.25 }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                Chiqindi fotosurati *
              </Typography>

              {file && previewUrl ? (
                /* 4-BURCHAK KATTA RASM PREVIEW KARTASI */
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                    p: 1.75,
                    borderRadius: '14px',
                    border: '1.5px solid #86EFAC',
                    bgcolor: '#F0FDF4',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.08)'
                  }}
                >
                  {/* To‘rtburchak katta rasm */}
                  <Box
                    sx={{
                      position: 'relative',
                      width: { xs: '100%', sm: 170 },
                      height: 115,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1.5px solid #CBD5E1',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                      bgcolor: '#FFFFFF',
                      flexShrink: 0
                    }}
                  >
                    <Box
                      component="img"
                      src={previewUrl}
                      alt="Chiqindi rasmi"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <Chip
                      size="small"
                      label="✓ Yuklandi"
                      sx={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        bgcolor: 'rgba(5, 150, 105, 0.92)',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        height: 20
                      }}
                    />
                  </Box>

                  {/* Fayl tafsilotlari va harakat tugmalari */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color: '#065F46',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {file.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.76rem', color: '#047857', fontWeight: 500, mt: 0.3 }}>
                      Hajmi: {(file.size / (1024 * 1024)).toFixed(2)} MB • Format: {file.type || 'Rasm fayli'}
                    </Typography>

                    <Stack direction="row" spacing={1.25} sx={{ mt: 1.5 }}>
                      <Button
                        component="label"
                        size="small"
                        variant="outlined"
                        startIcon={<AddPhotoAlternateOutlinedIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          color: '#047857',
                          borderColor: '#86EFAC',
                          bgcolor: '#FFFFFF',
                          borderRadius: '8px',
                          py: 0.5,
                          px: 1.5,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          '&:hover': { bgcolor: '#DCFCE7', borderColor: '#059669' }
                        }}
                      >
                        Boshqa rasm tanlash
                        <input type="file" hidden accept="image/*" onChange={handlePhotoSelect} />
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                        onClick={handleRemovePhoto}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          borderRadius: '8px',
                          py: 0.5,
                          px: 1.25,
                          bgcolor: '#FFFFFF',
                          '&:hover': { bgcolor: '#FEE2E2' }
                        }}
                      >
                        O‘chirish
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              ) : (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<AddPhotoAlternateOutlinedIcon sx={{ fontSize: 19 }} />}
                    sx={{
                      py: 0.85,
                      px: 2.2,
                      borderRadius: '10px',
                      borderColor: '#D1D5DB',
                      borderWidth: '1.5px',
                      color: '#0F172A',
                      bgcolor: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      textTransform: 'none',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      '&:hover': { bgcolor: '#F0FDF4', borderColor: '#059669', borderWidth: '1.5px' }
                    }}
                  >
                    Rasm yuklash
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handlePhotoSelect}
                    />
                  </Button>
                </Stack>
              )}

              <Typography sx={{ fontSize: '0.73rem', color: '#64748B', fontWeight: 500, mt: 0.75 }}>
                Ruxsat etilgan formatlar: JPG, JPEG, PNG, WEBP. Maksimum: 5 MB gacha.
              </Typography>
            </Box>

            {/* Row 7: Submit Button */}
            <Button
              type="submit"
              variant="contained"
              disabled={!districtId || !phone.trim() || !file || isSubmitting}
              endIcon={isSubmitting ? null : <SendOutlinedIcon sx={{ fontSize: 17 }} />}
              sx={{
                mt: 0.75,
                py: 1.35,
                borderRadius: '12px',
                bgcolor: '#059669',
                boxShadow: '0 4px 16px rgba(5, 150, 105, 0.35)',
                fontWeight: 800,
                fontSize: '0.95rem',
                textTransform: 'none',
                color: '#FFFFFF',
                minHeight: '48px',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: '#047857',
                  boxShadow: '0 6px 20px rgba(5, 150, 105, 0.45)'
                },
                '&.Mui-disabled': {
                  bgcolor: '#CBD5E1',
                  color: '#64748B'
                }
              }}
            >
              {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Yuborish ➤'}
            </Button>
          </Box>
        </Card>
      </Box>

      {/* Interactive Map Location Picker Dialog */}
      <LocationPickerModal
        open={mapPickerOpen}
        initialLat={lat}
        initialLng={lng}
        onClose={() => setMapPickerOpen(false)}
        onConfirm={handleMapConfirm}
      />
    </Box>
  );
};
export default PublicPortalPage;
