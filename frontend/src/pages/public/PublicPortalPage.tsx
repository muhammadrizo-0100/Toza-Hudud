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
          'linear-gradient(180deg, rgba(5,150,105,0.06) 0%, rgba(5,150,105,0) 35%), linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
        pb: 6
      }}
    >
      <Container maxWidth="md" sx={{ py: { xs: 2.5, md: 3.5 } }}>
        {/* Top Navbar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 3, md: 4 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                bgcolor: '#059669',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.28)'
              }}
            >
              <DeleteSweepOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0F172A" sx={{ lineHeight: 1.2 }}>
                Toza Hudud
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Sanitar tozalash portali
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            onClick={() => navigate('/login')}
            startIcon={<SecurityOutlinedIcon />}
            sx={{
              fontWeight: 700,
              borderRadius: 2.5,
              borderColor: '#CBD5E1',
              borderWidth: '1.5px',
              color: '#0F172A',
              bgcolor: '#FFFFFF',
              px: 2,
              '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' }
            }}
          >
            Xodimlar Kabineti
          </Button>
        </Box>

        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
          <Typography
            variant="h3"
            fontWeight={800}
            color="#0F172A"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
              letterSpacing: '-0.02em',
              mb: 1
            }}
          >
            Shahrimizni Birgalikda Toza Saqlaymiz!
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 620,
              mx: 'auto',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              lineHeight: 1.6
            }}
          >
            Konteynerlar toshib ketganmi yoki noqonuniy chiqindi bormi? Rasmga olib yuboring, tezkor tozalab beramiz.
          </Typography>
        </Box>

        {/* Main Content Card */}
        <Card
          variant="outlined"
          sx={{
            maxWidth: 740,
            mx: 'auto',
            borderRadius: 4,
            borderColor: '#CBD5E1',
            borderWidth: '1.5px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.04)',
            bgcolor: '#FFFFFF'
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5, md: 4 } }}>
            {/* Tab Selector */}
            <Tabs
              value={tab}
              onChange={(_, val) => setTab(val)}
              centered
              sx={{
                mb: 3,
                borderBottom: '1px solid #E2E8F0',
                '& .MuiTabs-indicator': {
                  bgcolor: '#059669',
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                },
                '& .MuiTab-root': {
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  color: '#64748B',
                  minHeight: 48,
                  '&.Mui-selected': {
                    color: '#059669'
                  }
                }
              }}
            >
              <Tab
                value="submit"
                icon={<DeleteSweepOutlinedIcon fontSize="small" />}
                iconPosition="start"
                label="Chiqindi haqida xabar berish"
              />
              <Tab
                value="track"
                icon={<SearchOutlinedIcon fontSize="small" />}
                iconPosition="start"
                label="Murojaat holatini tekshirish"
              />
            </Tabs>

            {/* Success Alert */}
            {submittedId && tab === 'submit' && (
              <Alert
                severity="success"
                icon={<CheckCircleOutlinedIcon fontSize="inherit" />}
                sx={{ mb: 3, borderRadius: 2.5, border: '1px solid #86EFAC' }}
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

            {/* SUBMIT FORM */}
            {tab === 'submit' && (
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  {/* Image Upload Box */}
                  <AppImageUpload
                    value={file}
                    onChange={setFile}
                    label="Chiqindi fotosurati *"
                    hint="Kameradan suratga oling yoki fayl tanlang (JPG, PNG, WEBP)"
                    buttonText="Chiqindi suratini yuklang *"
                  />

                  {/* Location Picker Section (Telegram-like logic) */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1.5px solid',
                      borderColor: lat && lng ? '#059669' : '#CBD5E1',
                      bgcolor: lat && lng ? '#F0FDF4' : '#F8FAFC',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 1.25 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PlaceOutlinedIcon sx={{ color: lat && lng ? '#059669' : '#64748B' }} fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={700} color="#0F172A">
                          Chiqindi joylashgan aniq nuqta (Lokatsiya)
                        </Typography>
                      </Stack>

                      {lat && lng && (
                        <Chip
                          size="small"
                          icon={<CheckCircleOutlinedIcon style={{ fontSize: 14 }} />}
                          label={`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`}
                          color="success"
                          variant="filled"
                          sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                        />
                      )}
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                      Telegramdagi kabi joriy GPS joylashuvingizni yuboring yoki xarita ustiga bosib belgilang.
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button
                        type="button"
                        variant="outlined"
                        fullWidth
                        startIcon={<MapOutlinedIcon fontSize="small" />}
                        onClick={() => setMapPickerOpen(true)}
                        sx={{
                          py: 1,
                          fontWeight: 700,
                          borderRadius: 2,
                          borderColor: '#94A3B8',
                          color: '#0F172A',
                          bgcolor: '#FFFFFF',
                          '&:hover': { bgcolor: '#F1F5F9', borderColor: '#475569' }
                        }}
                      >
                        {lat && lng ? 'Xaritadan qayta tanlash' : 'Xaritadan nuqtani belgilash'}
                      </Button>

                      <Button
                        type="button"
                        variant="outlined"
                        fullWidth
                        startIcon={gpsLoading ? <CircularProgress size={16} /> : <MyLocationOutlinedIcon fontSize="small" />}
                        onClick={handleGetGPS}
                        disabled={gpsLoading}
                        sx={{
                          py: 1,
                          fontWeight: 700,
                          borderRadius: 2,
                          borderColor: '#94A3B8',
                          color: '#0F172A',
                          bgcolor: '#FFFFFF',
                          '&:hover': { bgcolor: '#F1F5F9', borderColor: '#475569' }
                        }}
                      >
                        {gpsLoading ? 'Aniqlanmoqda...' : 'Joriy lokatsiyam (GPS)'}
                      </Button>
                    </Stack>

                    {gpsMessage && (
                      <Typography variant="caption" color="success.main" fontWeight={600} sx={{ mt: 1, display: 'block' }}>
                        {gpsMessage}
                      </Typography>
                    )}
                  </Box>

                  {/* District & Mahalla Selectors */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
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
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
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
                      py: 1.5,
                      fontWeight: 800,
                      fontSize: '1rem',
                      borderRadius: 2.5,
                      bgcolor: '#059669',
                      boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                      '&:hover': {
                        bgcolor: '#047857'
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
