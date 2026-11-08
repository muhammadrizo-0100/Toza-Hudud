import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardMedia,
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
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
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
  useSubmitPublicRequestMutation,
  useLazyTrackRequestQuery,
  TrackedRequest
} from '../../api/publicApi';
import { StatusBadge } from '../../components/common/StatusBadge';
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
  const [tab, setTab] = useState<'submit' | 'track'>('submit');

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

  const { showSuccess, showError, showWarning } = useToast();

  // Location / GPS states
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const [submittedId, setSubmittedId] = useState<number | null>(null);

  // Track Form States
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedResults, setTrackedResults] = useState<TrackedRequest[]>([]);

  // API hooks
  const { data: locations } = useGetPublicLocationsQuery(districtId ? { districtId: Number(districtId) } : undefined);
  const [submitRequest, { isLoading: isSubmitting }] = useSubmitPublicRequestMutation();
  const [triggerTrack, { isLoading: isTracking, error: trackError }] = useLazyTrackRequestQuery();

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
        if (detected && locations?.districts) {
          const matched = locations.districts.find(
            (d) => d.code.toLowerCase().replace(/[^a-z0-9]/g, '') === detected.replace(/[^a-z0-9]/g, '')
          );
          if (matched) {
            setDistrictId(matched.id);
            setGpsMessage(`Lokatsiya: ${matched.name}`);
            return;
          }
        }
        setGpsMessage(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      (err) => {
        setGpsLoading(false);
        setGpsMessage('GPS aniqlab bo‘lmadi.');
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle Map Picker Confirm
  const handleMapConfirm = (selectedLat: number, selectedLng: number, detectedCode: string | null) => {
    setLat(selectedLat);
    setLng(selectedLng);

    if (detectedCode && locations?.districts) {
      const matched = locations.districts.find(
        (d) => d.code.toLowerCase().replace(/[^a-z0-9]/g, '') === detectedCode.replace(/[^a-z0-9]/g, '')
      );
      if (matched) {
        setDistrictId(matched.id);
        setGpsMessage(`Xarita: ${matched.name}`);
        return;
      }
    }
    setGpsMessage(`Xarita: ${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}`);
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

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackQuery.trim();
    if (!query) return;

    try {
      const isNumericOnly = /^\d+$/.test(query) && query.length < 8;
      const results = await triggerTrack(
        isNumericOnly ? { id: query } : { phone: cleanUzPhone(query) || query }
      ).unwrap();

      const list = Array.isArray(results) ? results : results ? [results] : [];
      setTrackedResults(list);
      if (list.length > 0) {
        showSuccess(`${list.length} ta murojaat topildi!`);
      } else {
        showWarning('Kiritilgan ma’lumot bo‘yicha murojaat topilmadi.');
      }
    } catch (err: any) {
      console.error('Track error:', err);
      setTrackedResults([]);
      showError('Qidiruvda xatolik yuz berdi.');
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
      {/* Top Header Link (Only "Rahbar / Xodim ↗", no navbar clutter) */}
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

          {/* TELEGRAM BOT QUICK LINK BANNER (Preserved inside card) */}
          <Box
            component="a"
            href="https://t.me/toza_hudud_public_bot"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              mt: 3.5,
              p: 2,
              borderRadius: '14px',
              bgcolor: 'rgba(5, 150, 105, 0.05)',
              border: '1.5px solid rgba(5, 150, 105, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(5, 150, 105, 0.1)',
                borderColor: '#059669',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.18)'
              }
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  bgcolor: '#059669',
                  color: '#FFFFFF',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0
                }}
              >
                <TelegramIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.84rem', lineHeight: 1.2 }}>
                  Telegram Bot orqali tezkor yuborish
                </Typography>
                <Typography sx={{ color: '#047857', fontWeight: 600, fontSize: '0.76rem' }}>
                  @toza_hudud_public_bot bilan 1 daqiqada
                </Typography>
              </Box>
            </Stack>
            <OpenInNewOutlinedIcon sx={{ fontSize: 18, color: '#059669', flexShrink: 0 }} />
          </Box>
        </Card>

        {/* RIGHT CARD: Online Application Form (or Track Status) */}
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
          {/* Header Row: Title & Subtitle + View Switcher */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.25 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', lineHeight: 1.2 }}>
                {tab === 'submit' ? 'Murojaat onlayn kiritish' : 'Murojaat holatini tekshirish'}
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.82rem', mt: 0.4, fontWeight: 500 }}>
                {tab === 'submit' ? 'Tartib bo‘yicha ma\'lumotlarni kiriting' : 'ID raqam yoki telefoningizni kiriting'}
              </Typography>
            </Box>

            {/* Minimalist Tab Toggle */}
            <Box sx={{ display: 'flex', bgcolor: '#F1F5F9', p: 0.5, borderRadius: '10px', border: '1px solid #CBD5E1' }}>
              <Button
                size="small"
                onClick={() => setTab('submit')}
                sx={{
                  py: 0.45,
                  px: 1.4,
                  borderRadius: '7px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: tab === 'submit' ? '#059669' : 'transparent',
                  color: tab === 'submit' ? '#FFFFFF' : '#475569',
                  boxShadow: tab === 'submit' ? '0 2px 6px rgba(5, 150, 105, 0.28)' : 'none',
                  '&:hover': { bgcolor: tab === 'submit' ? '#047857' : 'rgba(0,0,0,0.04)' }
                }}
              >
                Kiritish
              </Button>
              <Button
                size="small"
                onClick={() => setTab('track')}
                sx={{
                  py: 0.45,
                  px: 1.4,
                  borderRadius: '7px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: tab === 'track' ? '#059669' : 'transparent',
                  color: tab === 'track' ? '#FFFFFF' : '#475569',
                  boxShadow: tab === 'track' ? '0 2px 6px rgba(5, 150, 105, 0.28)' : 'none',
                  '&:hover': { bgcolor: tab === 'track' ? '#047857' : 'rgba(0,0,0,0.04)' }
                }}
              >
                Holat
              </Button>
            </Box>
          </Box>

          {/* Success Alert */}
          {submittedId && tab === 'submit' && (
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

          {/* TAB 1: SUBMIT FORM (Exact layout & notched floating labels matching sample image) */}
          {tab === 'submit' && (
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

              {/* Row 5: Compact Location/GPS Selector */}
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: '12px',
                  border: '1.5px dashed #CBD5E1',
                  bgcolor: lat && lng ? '#F0FDF4' : '#F8FAFC',
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
                    {lat && lng ? 'Xaritadan qayta tanlash' : 'Xaritadan nuqtani belgilash'}
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

                {lat && lng ? (
                  <Chip
                    size="small"
                    icon={<CheckCircleOutlinedIcon style={{ fontSize: 13 }} />}
                    label={gpsMessage || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
                    color="success"
                    variant="filled"
                    sx={{ fontWeight: 700, fontSize: '0.74rem', height: 26, bgcolor: '#059669' }}
                  />
                ) : (
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.74rem', display: { xs: 'none', sm: 'block' } }}>
                    (Lokatsiya ixtiyoriy)
                  </Typography>
                )}
              </Box>

              {/* Row 6: Rasmlar section (matches sample image) */}
              <Box sx={{ mt: 0.25 }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Rasmlar
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<AddPhotoAlternateOutlinedIcon sx={{ fontSize: 19 }} />}
                    sx={{
                      py: 0.85,
                      px: 2.2,
                      borderRadius: '10px',
                      borderColor: file ? '#059669' : '#D1D5DB',
                      borderWidth: '1.5px',
                      color: file ? '#047857' : '#0F172A',
                      bgcolor: file ? '#F0FDF4' : '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      textTransform: 'none',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      '&:hover': { bgcolor: '#F0FDF4', borderColor: '#059669', borderWidth: '1.5px' }
                    }}
                  >
                    {file ? 'Boshqa rasm tanlash' : 'Rasm yuklash'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handlePhotoSelect}
                    />
                  </Button>

                  {file && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: '#F0FDF4',
                        pl: 1,
                        pr: 0.5,
                        py: 0.45,
                        borderRadius: '8px',
                        border: '1.5px solid #86EFAC'
                      }}
                    >
                      {previewUrl && (
                        <Box
                          component="img"
                          src={previewUrl}
                          alt="preview"
                          sx={{ width: 24, height: 24, borderRadius: 1, objectFit: 'cover' }}
                        />
                      )}
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#065F46', maxWidth: 130, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </Typography>
                      <IconButton size="small" onClick={handleRemovePhoto} sx={{ p: 0.2 }}>
                        <CloseIcon sx={{ fontSize: 14, color: '#065F46' }} />
                      </IconButton>
                    </Box>
                  )}
                </Stack>

                <Typography sx={{ fontSize: '0.73rem', color: '#64748B', fontWeight: 500, mt: 0.75 }}>
                  Ruxsat etilgan formatlar: JPG, JPEG, PNG, WEBP. Maksimum: 2 ta fayl, har biri 5 MB gacha.
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
          )}

          {/* TAB 2: TRACK STATUS */}
          {tab === 'track' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box component="form" onSubmit={handleTrack}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    label="Qidiruv"
                    placeholder="Murojaat ID raqami (masalan: 104) yoki telefon..."
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    sx={spaciousInputSx}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isTracking || !trackQuery.trim()}
                    startIcon={isTracking ? null : <SearchOutlinedIcon />}
                    sx={{
                      px: 2.5,
                      py: 1,
                      borderRadius: '12px',
                      fontWeight: 700,
                      bgcolor: '#059669',
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      minHeight: '48px',
                      '&:hover': { bgcolor: '#047857' }
                    }}
                  >
                    {isTracking ? <CircularProgress size={18} color="inherit" /> : 'Qidirish'}
                  </Button>
                </Stack>
              </Box>

              {trackError && (
                <Alert severity="error" sx={{ py: 0.5, borderRadius: 2 }}>
                  Qidiruvda xatolik yuz berdi.
                </Alert>
              )}

              {trackedResults.length === 0 && !isTracking && trackQuery && (
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                  Hech qanday murojaat topilmadi.
                </Typography>
              )}

              {/* Scrollable list inside the card if multiple results exist */}
              <Box sx={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, pr: 0.5 }}>
                {trackedResults.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      p: 2,
                      borderRadius: '14px',
                      bgcolor: '#F8FAFC',
                      border: '1.5px solid #CBD5E1'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                          Murojaat #{item.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.createdAt).toLocaleString('uz-UZ')}
                        </Typography>
                      </Box>
                      <StatusBadge status={item.status} />
                    </Stack>

                    <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 1, fontWeight: 600 }}>
                      <strong>Manzil:</strong> {[item.mahallaName, item.address].filter(Boolean).join(', ') || '-'}
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 1 }}>
                      <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Dastlabki holat:
                        </Typography>
                        <CardMedia
                          component="img"
                          image={item.beforePhotoUrl}
                          alt="Dastlabki"
                          sx={{ height: 110, borderRadius: 1.5, objectFit: 'cover', border: '1px solid #CBD5E1' }}
                        />
                      </Box>

                      {item.afterPhotoUrl ? (
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="success.main" sx={{ display: 'block', mb: 0.5 }}>
                            Tozalangan natija:
                          </Typography>
                          <CardMedia
                            component="img"
                            image={item.afterPhotoUrl}
                            alt="Tozalangan"
                            sx={{ height: 110, borderRadius: 1.5, objectFit: 'cover', border: '1.5px solid #059669' }}
                          />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            height: 110,
                            borderRadius: 1.5,
                            border: '1.5px dashed #CBD5E1',
                            display: 'grid',
                            placeItems: 'center',
                            p: 1,
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Tozalash ishlari hali yakunlanmagan.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
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