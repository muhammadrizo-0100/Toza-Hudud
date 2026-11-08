import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Chip
} from '@mui/material';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import TelegramIcon from '@mui/icons-material/Telegram';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { useNavigate } from 'react-router-dom';

import {
  useGetPublicLocationsQuery,
  useSubmitPublicRequestMutation,
  useLazyTrackRequestQuery,
  TrackedRequest
} from '../../api/publicApi';
import { StatusBadge } from '../../components/common/StatusBadge';
import AppImageUpload from '../../components/common/AppImageUpload';
import AppSelectField from '../../components/common/AppSelectField';
import AppPhoneField from '../../components/common/AppPhoneField';
import { LocationPickerModal } from '../../components/map/LocationPickerModal';
import { detectDistrictByPoint } from '../../constants/boundaries';
import { formatUzPhone, cleanUzPhone, validateUzPhone } from '../../utils/phone';
import { useToast } from '../../context/ToastContext';

// High-contrast, crisp input styling
const highContrastInputSx = {
  bgcolor: '#FFFFFF',
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    '& fieldset': {
      borderColor: '#94A3B8',
      borderWidth: '1.5px'
    },
    '&:hover fieldset': {
      borderColor: '#475569'
    },
    '&.Mui-focused fieldset': {
      borderColor: '#059669',
      borderWidth: '2px'
    }
  },
  '& .MuiInputBase-input': {
    fontWeight: 600,
    color: '#0F172A',
    fontSize: '0.925rem'
  },
  '& .MuiInputLabel-root': {
    fontWeight: 700,
    color: '#334155'
  }
};

export const PublicPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'submit' | 'track'>('submit');

  // Submit Form States
  const [districtId, setDistrictId] = useState<number | ''>('');
  const [mahallaId, setMahallaId] = useState<number | ''>('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
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
  const [submitRequest, { isLoading: isSubmitting, error: submitError }] = useSubmitPublicRequestMutation();
  const [triggerTrack, { isLoading: isTracking, error: trackError }] = useLazyTrackRequestQuery();

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
            setGpsMessage(`Joriy lokatsiyangiz aniqlandi: ${matched.name}`);
            return;
          }
        }
        setGpsMessage(`Lokatsiyangiz aniqlandi: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      },
      (err) => {
        setGpsLoading(false);
        setGpsMessage('GPS orqali joylashuvni aniqlab bo‘lmadi. Brauzerda ruxsat berilganligini tekshiring.');
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
        setGpsMessage(`Xaritadan belgilandi: ${matched.name}`);
        return;
      }
    }
    setGpsMessage(`Xaritadan belgilandi: ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      showError('Chiqindi holatini tasdiqlovchi fotosuratni yuklang');
      return;
    }
    if (!districtId) {
      showError('Tuman tanlanishi shart');
      return;
    }
    const pVal = validateUzPhone(phone);
    if (!pVal.isValid) {
      showError(pVal.error || 'Telefon raqam noto‘g‘ri kiritildi');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('districtId', String(districtId));
    if (mahallaId) formData.append('mahallaId', String(mahallaId));
    formData.append('citizenPhone', cleanUzPhone(phone));
    if (fullName.trim()) formData.append('citizenFullName', fullName.trim());
    if (address.trim()) formData.append('address', address.trim());
    if (description.trim()) formData.append('description', description.trim());
    if (lat) formData.append('lat', String(lat));
    if (lng) formData.append('lng', String(lng));

    try {
      const res = await submitRequest(formData).unwrap();
      setSubmittedId(res.requestId);
      showSuccess(`Murojaatingiz qabul qilindi! Murojaat №${res.requestId}`);
      setFile(null);
      setPhone('');
      setFullName('');
      setAddress('');
      setDescription('');
      setLat(null);
      setLng(null);
      setGpsMessage(null);
    } catch (err: any) {
      console.error('Submit error:', err);
      showError(err?.data?.message || 'Murojaatni yuborishda xatolik yuz berdi. Iltimos qaytadan urinib ko‘ring.');
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
          'radial-gradient(circle at 15% 15%, rgba(5, 150, 105, 0.08) 0%, transparent 45%), radial-gradient(circle at 85% 85%, rgba(34, 158, 217, 0.08) 0%, transparent 45%), linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        py: { xs: 2, md: 2.5 }
      }}
    >
      <Container maxWidth="lg">
        {/* Top Navbar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                bgcolor: '#059669',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.28)'
              }}
            >
              <DeleteSweepOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0F172A" sx={{ lineHeight: 1.15, fontSize: '1.1rem' }}>
                Toza Hudud
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Sanitar tozalash portali
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              component="a"
              href="https://t.me/toza_hudud_public_bot"
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              startIcon={<TelegramIcon />}
              sx={{
                fontWeight: 700,
                fontSize: '0.85rem',
                borderRadius: 2.5,
                bgcolor: '#229ED9',
                color: '#FFFFFF',
                textTransform: 'none',
                px: 2,
                py: 0.8,
                boxShadow: '0 4px 14px rgba(34, 158, 217, 0.28)',
                '&:hover': { bgcolor: '#1D88BC', boxShadow: '0 6px 18px rgba(34, 158, 217, 0.35)' }
              }}
            >
              Telegram Bot
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              startIcon={<SecurityOutlinedIcon />}
              sx={{
                fontWeight: 700,
                fontSize: '0.85rem',
                borderRadius: 2.5,
                borderColor: '#CBD5E1',
                borderWidth: '1.5px',
                color: '#0F172A',
                bgcolor: '#FFFFFF',
                textTransform: 'none',
                px: 1.75,
                py: 0.8,
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' }
              }}
            >
              Xodimlar Kabineti
            </Button>
          </Stack>
        </Box>

        {/* Compact Header & Tabs Row */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            mb: 2,
            gap: 1.5
          }}
        >
          <Box>
            <Typography
              variant="h5"
              fontWeight={800}
              color="#0F172A"
              sx={{
                fontSize: { xs: '1.35rem', sm: '1.55rem', md: '1.75rem' },
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              Shahrimizni Birgalikda Toza Saqlaymiz!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.88rem' }}>
              Chiqindini rasmga olib yuboring — mas’ul sanitar xodimlar tezkor tozalab beradi.
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, val) => setTab(val)}
            sx={{
              bgcolor: '#F1F5F9',
              p: 0.5,
              borderRadius: 3,
              minHeight: 40,
              '& .MuiTabs-indicator': {
                bgcolor: '#059669',
                height: '100%',
                borderRadius: 2.5,
                zIndex: 0
              },
              '& .MuiTab-root': {
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.86rem',
                color: '#64748B',
                minHeight: 36,
                py: 0.5,
                px: 2,
                borderRadius: 2.5,
                zIndex: 1,
                transition: 'color 0.2s',
                '&.Mui-selected': {
                  color: '#FFFFFF'
                }
              }
            }}
          >
            <Tab
              value="submit"
              icon={<DeleteSweepOutlinedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Chiqindi haqida xabar berish"
            />
            <Tab
              value="track"
              icon={<SearchOutlinedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label="Murojaat holati"
            />
          </Tabs>
        </Box>

        {/* Main Content Card */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            borderColor: '#E2E8F0',
            borderWidth: '1.5px',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 1px rgba(15, 23, 42, 0.1)',
            bgcolor: '#FFFFFF'
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
            {/* Success Alert */}
            {submittedId && tab === 'submit' && (
              <Alert
                severity="success"
                icon={<CheckCircleOutlinedIcon fontSize="inherit" />}
                sx={{ mb: 2.5, borderRadius: 2.5, border: '1px solid #86EFAC' }}
                action={
                  <Button color="inherit" size="small" onClick={() => setSubmittedId(null)} sx={{ fontWeight: 700 }}>
                    Yangi ariza
                  </Button>
                }
              >
                <Typography variant="subtitle2" fontWeight={800}>
                  Murojaatingiz muvaffaqiyatli qabul qilindi! Raqam: #{submittedId}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.25 }}>
                  Mas'ul sanitar xodimlar hududga chiqib tozalash ishlarini bajargach, natijani "Murojaat holatini tekshirish"
                  bo‘limida kuzatishingiz mumkin.
                </Typography>
              </Alert>
            )}

            {/* Error Alert */}
            {submitError && tab === 'submit' && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                Murojaatni yuborishda xatolik yuz berdi. Iltimos qaytadan urinib ko‘ring.
              </Alert>
            )}

            {/* SUBMIT FORM (2-Column Grid: Visual & Location on Left, Form Data on Right) */}
            {tab === 'submit' && (
              <Box component="form" onSubmit={handleSubmit}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
                    gap: { xs: 2.5, md: 3 }
                  }}
                >
                  {/* LEFT COLUMN: Visual Media, Location, and Telegram Bot Banner */}
                  <Stack spacing={2} justifyContent="space-between">
                    {/* Image Upload Box */}
                    <AppImageUpload
                      value={file}
                      onChange={setFile}
                      label="Chiqindi fotosurati *"
                      hint="Kameradan oling yoki fayl tanlang (JPG, PNG, WEBP)"
                      buttonText="Chiqindi suratini yuklang *"
                    />

                    {/* Compact Location Picker */}
                    <Box
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        border: '1.5px solid',
                        borderColor: lat && lng ? '#059669' : '#CBD5E1',
                        bgcolor: lat && lng ? '#F0FDF4' : '#F8FAFC',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <PlaceOutlinedIcon sx={{ color: lat && lng ? '#059669' : '#64748B', fontSize: 20 }} />
                          <Typography variant="subtitle2" fontWeight={700} color="#0F172A" sx={{ fontSize: '0.88rem' }}>
                            Aniq lokatsiya (GPS)
                          </Typography>
                        </Stack>

                        {lat && lng && (
                          <Chip
                            size="small"
                            icon={<CheckCircleOutlinedIcon style={{ fontSize: 13 }} />}
                            label={`${lat.toFixed(4)}, ${lng.toFixed(4)}`}
                            color="success"
                            variant="filled"
                            sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
                          />
                        )}
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <Button
                          type="button"
                          variant="outlined"
                          size="small"
                          fullWidth
                          startIcon={<MapOutlinedIcon sx={{ fontSize: 16 }} />}
                          onClick={() => setMapPickerOpen(true)}
                          sx={{
                            py: 0.75,
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            borderRadius: 2,
                            borderColor: '#94A3B8',
                            color: '#0F172A',
                            bgcolor: '#FFFFFF',
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#F1F5F9', borderColor: '#475569' }
                          }}
                        >
                          {lat && lng ? 'Xaritadan qayta tanlash' : 'Xaritadan belgilash'}
                        </Button>

                        <Button
                          type="button"
                          variant="outlined"
                          size="small"
                          fullWidth
                          startIcon={gpsLoading ? <CircularProgress size={14} /> : <MyLocationOutlinedIcon sx={{ fontSize: 16 }} />}
                          onClick={handleGetGPS}
                          disabled={gpsLoading}
                          sx={{
                            py: 0.75,
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            borderRadius: 2,
                            borderColor: '#94A3B8',
                            color: '#0F172A',
                            bgcolor: '#FFFFFF',
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#F1F5F9', borderColor: '#475569' }
                          }}
                        >
                          {gpsLoading ? 'Aniqlanmoqda...' : 'Joriy GPS'}
                        </Button>
                      </Stack>

                      {gpsMessage && (
                        <Typography variant="caption" color="success.main" fontWeight={600} sx={{ mt: 0.75, display: 'block', fontSize: '0.75rem' }}>
                          {gpsMessage}
                        </Typography>
                      )}
                    </Box>

                    {/* Telegram Bot Quick Banner */}
                    <Box
                      component="a"
                      href="https://t.me/toza_hudud_public_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        bgcolor: 'rgba(34, 158, 217, 0.08)',
                        border: '1px solid rgba(34, 158, 217, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(34, 158, 217, 0.14)',
                          borderColor: '#229ED9',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            bgcolor: '#229ED9',
                            color: '#FFFFFF',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0
                          }}
                        >
                          <TelegramIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F172A', display: 'block', lineHeight: 1.2, fontSize: '0.82rem' }}>
                            Telegram Bot orqali murojaat
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600, fontSize: '0.75rem' }}>
                            @toza_hudud_public_bot bilan 1 daqiqada
                          </Typography>
                        </Box>
                      </Stack>
                      <OpenInNewOutlinedIcon sx={{ fontSize: 18, color: '#229ED9', flexShrink: 0 }} />
                    </Box>
                  </Stack>

                  {/* RIGHT COLUMN: Form Inputs & Submit */}
                  <Stack spacing={1.75}>
                    {/* District & Mahalla Selectors */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                      <AppSelectField
                        label="Tumaningizni tanlang *"
                        value={districtId}
                        onChange={(e) => {
                          setDistrictId(e.target.value as number);
                          setMahallaId('');
                        }}
                        options={[
                          { value: '', label: '-- Tumanni tanlang --' },
                          ...(locations?.districts.map((d) => ({ value: d.id, label: d.name })) || [])
                        ]}
                      />

                      <AppSelectField
                        label="Mahallangizni tanlang"
                        value={mahallaId}
                        onChange={(e) => setMahallaId(e.target.value as number)}
                        disabled={!districtId}
                        options={[
                          { value: '', label: '-- Mahallani tanlang (ixtiyoriy) --' },
                          ...(locations?.mahallas.map((m) => ({ value: m.id, label: m.name })) || [])
                        ]}
                      />
                    </Box>

                    {/* Phone & Full Name */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                      <AppPhoneField
                        required
                        label="Telefon raqamingiz *"
                        value={phone}
                        onChange={setPhone}
                        sx={highContrastInputSx}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        label="Ismingiz (ixtiyoriy)"
                        placeholder="Ismingiz"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        sx={highContrastInputSx}
                      />
                    </Box>

                    {/* Address / Landmark */}
                    <TextField
                      fullWidth
                      size="small"
                      label="Aniq manzil yoki mo‘ljal"
                      placeholder="Masalan: 12-maktab orqasidagi chiqindi maydoni"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      sx={highContrastInputSx}
                    />

                    {/* Description */}
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      label="Qo‘shimcha izoh (ixtiyoriy)"
                      placeholder="Konteyner toshib ketgan, katta hajmda maishiy chiqindi yig‘ilib qolgan..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      sx={highContrastInputSx}
                    />

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={!file || !districtId || !phone.trim() || isSubmitting}
                      startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendOutlinedIcon />}
                      sx={{
                        py: 1.25,
                        fontWeight: 800,
                        fontSize: '0.98rem',
                        borderRadius: 2.5,
                        bgcolor: '#059669',
                        boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: '#047857',
                          boxShadow: '0 6px 18px rgba(5, 150, 105, 0.45)'
                        },
                        '&.Mui-disabled': {
                          bgcolor: '#CBD5E1',
                          color: '#64748B'
                        }
                      }}
                    >
                      {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Murojaatni Yuborish'}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            )}

            {/* TRACK FORM */}
            {tab === 'track' && (
              <Box>
                <Box component="form" onSubmit={handleTrack} sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Yuborgan arizangizning hozirgi holati va tozalash fotohisobotini ko‘rish uchun ID raqam yoki telefoningizni kiriting:
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Murojaat ID raqami (masalan: 104) yoki telefon..."
                      value={trackQuery}
                      onChange={(e) => setTrackQuery(e.target.value)}
                      sx={highContrastInputSx}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isTracking || !trackQuery.trim()}
                      startIcon={isTracking ? null : <SearchOutlinedIcon />}
                      sx={{
                        px: 3.5,
                        py: 1.2,
                        borderRadius: 2.5,
                        fontWeight: 800,
                        bgcolor: '#059669',
                        '&:hover': { bgcolor: '#047857' },
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isTracking ? <CircularProgress size={20} color="inherit" /> : 'Tekshirish'}
                    </Button>
                  </Stack>
                </Box>

                {trackError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    Murojaatni qidirishda xatolik yuz berdi.
                  </Alert>
                )}

                {trackedResults.length === 0 && !isTracking && trackQuery && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                    Hech qanday murojaat topilmadi.
                  </Typography>
                )}

                {/* Tracked Results List */}
                <Stack spacing={2}>
                  {trackedResults.map((item) => (
                    <Card
                      key={item.id}
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: '#F8FAFC',
                        borderColor: '#CBD5E1',
                        borderWidth: '1.5px'
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
                            Murojaat #{item.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Yuborilgan sana: {new Date(item.createdAt).toLocaleString('uz-UZ')}
                          </Typography>
                        </Box>
                        <StatusBadge status={item.status} />
                      </Stack>

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Mahalla:</strong> {item.mahallaName || '-'}
                        </Typography>
                        {item.address && (
                          <Typography variant="body2" sx={{ gridColumn: '1 / -1' }}>
                            <strong>Manzil:</strong> {item.address}
                          </Typography>
                        )}
                      </Box>

                      {/* Before / After Photos */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
                        <Box>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Dastlabki chiqindi holati:
                          </Typography>
                          <CardMedia
                            component="img"
                            image={item.beforePhotoUrl}
                            alt="Dastlabki holat"
                            sx={{ height: 160, borderRadius: 2, objectFit: 'cover', border: '1px solid #CBD5E1' }}
                          />
                        </Box>

                        {item.afterPhotoUrl ? (
                          <Box>
                            <Typography variant="caption" fontWeight={700} color="success.main" sx={{ display: 'block', mb: 0.5 }}>
                              Tozalangan holat (Natija):
                            </Typography>
                            <CardMedia
                              component="img"
                              image={item.afterPhotoUrl}
                              alt="Tozalangan holat"
                              sx={{ height: 160, borderRadius: 2, objectFit: 'cover', border: '1.5px solid #059669' }}
                            />
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              height: 160,
                              borderRadius: 2,
                              border: '1.5px dashed #CBD5E1',
                              display: 'grid',
                              placeItems: 'center',
                              p: 2,
                              textAlign: 'center'
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              Tozalash ishlari hali yakunlanmagan. Tozalangach fotohisobot bu yerda paydo bo‘ladi.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

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
