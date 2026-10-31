import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  IconButton,
  TextField,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const LocationPickerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const initialLat = parseFloat(searchParams.get('lat') || '41.0108');
  const initialLng = parseFloat(searchParams.get('lng') || '71.5775');
  const locationName = searchParams.get('name') || 'Belgilangan hudud';

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng
  });
  const [landmark, setLandmark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Initialize Telegram WebApp
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      try {
        tg.enableClosingConfirmation?.();
      } catch {
        // ignore
      }
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    // O‘zbekiston chegarasi (chegaradan chiqib ketishni qat'iy cheklash)
    const UZBEKISTAN_BOUNDS: L.LatLngBoundsExpression = [
      [37.15, 55.90], // Janubiy-G'arbiy burchak (Termiz / Qoraqalpog'iston)
      [45.65, 73.20]  // Shimoliy-Sharqiy burchak (Farg'ona / Orol)
    ];

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      minZoom: 6,
      maxZoom: 19,
      maxBounds: UZBEKISTAN_BOUNDS,
      maxBoundsViscosity: 1.0, // Xaritani O'zbekiston hududidan tashqariga surishni taqiqlaydi
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    map.on('move', () => {
      const c = map.getCenter();
      setCoords({ lat: c.lat, lng: c.lng });
    });

    // Xaritadagi istalgan nuqtani bosganda markaz o‘sha yerga siljiydi
    map.on('click', (e: L.LeafletMouseEvent) => {
      map.panTo(e.latlng, { animate: true, duration: 0.4 });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialLat, initialLng]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setNoticeMessage('Kompyuteringizda GPS datchigi mavjud emas. Xaritani surib yoki bosib tanlang.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        mapRef.current?.flyTo([lat, lng], 17, { duration: 1.2 });
      },
      () => {
        setNoticeMessage('Kompyuterlarda GPS datchigi bo‘lmaydi. Xaritani sichqoncha bilan suring yoki bosing.');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleConfirmLocation = () => {
    setIsSubmitting(true);
    const tg = (window as any).Telegram?.WebApp;

    const payload = {
      lat: Number(coords.lat.toFixed(6)),
      lng: Number(coords.lng.toFixed(6)),
      address: landmark.trim() || undefined
    };

    if (tg && typeof tg.sendData === 'function') {
      tg.sendData(JSON.stringify(payload));
    } else {
      alert(
        `Lokatsiya belgilandi:\n• Lat: ${payload.lat}\n• Lng: ${payload.lng}\n• Mo‘ljal: ${payload.address || 'Kiritilmagan'}`
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', bgcolor: '#F8FAFC' }}>
      {/* 1. Fullscreen Map Container */}
      <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* 2. Fixed Center Pin with Ripple Animation */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -100%)',
          zIndex: 10,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Modern Map Pin Icon */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            bgcolor: '#EF4444',
            boxShadow: '0 8px 20px rgba(239, 68, 68, 0.45)',
            border: '2px solid #FFFFFF'
          }}
        >
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: '#FFFFFF'
            }}
          />
        </Box>
        {/* Pin ground shadow */}
        <Box
          sx={{
            width: 12,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'rgba(0, 0, 0, 0.25)',
            mt: -0.5
          }}
        />
      </Box>

      {/* 3. Floating Top Bar */}
      <Paper
        elevation={0}
        sx={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          zIndex: 20,
          p: 1.5,
          borderRadius: 3,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)'
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: 2,
                bgcolor: 'rgba(5, 150, 105, 0.1)',
                color: '#059669',
                display: 'flex'
              }}
            >
              <LocationOnIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {locationName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                Xaritani suring yoki kerakli joyni bosing
              </Typography>
            </Box>
          </Stack>
          <Chip
            size="small"
            label={`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              bgcolor: '#F1F5F9',
              color: '#334155'
            }}
          />
        </Stack>
      </Paper>

      {/* 4. Map Control Buttons (Right Side) */}
      <Stack
        spacing={1}
        sx={{
          position: 'absolute',
          right: 14,
          top: '40%',
          transform: 'translateY(-50%)',
          zIndex: 20
        }}
      >
        <IconButton
          onClick={handleLocateMe}
          sx={{
            bgcolor: '#FFFFFF',
            color: '#0284C7',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            border: '1px solid #E2E8F0',
            '&:hover': { bgcolor: '#F8FAFC' }
          }}
        >
          <MyLocationIcon fontSize="small" />
        </IconButton>
        <IconButton
          onClick={handleZoomIn}
          sx={{
            bgcolor: '#FFFFFF',
            color: '#334155',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            border: '1px solid #E2E8F0',
            '&:hover': { bgcolor: '#F8FAFC' }
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
        <IconButton
          onClick={handleZoomOut}
          sx={{
            bgcolor: '#FFFFFF',
            color: '#334155',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            border: '1px solid #E2E8F0',
            '&:hover': { bgcolor: '#F8FAFC' }
          }}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* 5. Bottom Confirmation Card */}
      <Paper
        elevation={0}
        sx={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          right: 14,
          zIndex: 20,
          p: 2,
          borderRadius: 3.5,
          bgcolor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.16)'
        }}
      >
        <Stack spacing={1.5}>
          <TextField
            size="small"
            fullWidth
            placeholder="Aniq mo‘ljal (masalan: 12-maktab orqasi, 4-dom burchagi)"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                bgcolor: '#F8FAFC',
                fontSize: '0.88rem'
              }
            }}
          />

          <Button
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            onClick={handleConfirmLocation}
            startIcon={<CheckCircleIcon />}
            sx={{
              py: 1.3,
              borderRadius: 2.5,
              fontWeight: 800,
              fontSize: '0.95rem',
              textTransform: 'none',
              bgcolor: '#059669',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.3)',
              '&:hover': { bgcolor: '#047857' }
            }}
          >
            Shu manzilni tasdiqlash
          </Button>
        </Stack>
      </Paper>

      {/* 6. Non-blocking Notice Snackbar */}
      <Snackbar
        open={Boolean(noticeMessage)}
        autoHideDuration={4000}
        onClose={() => setNoticeMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: 80 }}
      >
        <Alert
          severity="info"
          onClose={() => setNoticeMessage(null)}
          sx={{
            borderRadius: 3,
            bgcolor: '#0F172A',
            color: '#FFFFFF',
            fontWeight: 600,
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            '& .MuiAlert-icon': { color: '#38BDF8' }
          }}
        >
          {noticeMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LocationPickerPage;
