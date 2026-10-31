import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import AppButton from '../common/AppButton';
import {
  DAVLATOBOD_CENTER,
  DAVLATOBOD_POLYGON,
  YANGI_NAMANGAN_POLYGON,
  CHUST_POLYGON,
  detectDistrictByPoint
} from '../../constants/boundaries';

interface LocationPickerModalProps {
  open: boolean;
  initialLat?: number | null;
  initialLng?: number | null;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, detectedDistrictCode: string | null) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  open,
  initialLat,
  initialLng,
  onClose,
  onConfirm
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [coords, setCoords] = useState<[number, number]>(() => {
    if (initialLat && initialLng) return [initialLat, initialLng];
    return DAVLATOBOD_CENTER;
  });

  const [detectedDistrict, setDetectedDistrict] = useState<string | null>(() => {
    if (initialLat && initialLng) {
      return detectDistrictByPoint([initialLat, initialLng]);
    }
    return 'davlatobod';
  });

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Update marker and map when coords change
  const updatePosition = (lat: number, lng: number, updateMap = false) => {
    setCoords([lat, lng]);
    const detected = detectDistrictByPoint([lat, lng]);
    setDetectedDistrict(detected);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (updateMap && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng]);
    }
  };

  // Init leaflet map on dialog open
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const defaultCenter: [number, number] =
          initialLat && initialLng ? [initialLat, initialLng] : DAVLATOBOD_CENTER;

        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 14,
          zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        // Draw District Boundaries
        L.polygon(DAVLATOBOD_POLYGON, {
          color: '#059669',
          weight: 2,
          fillColor: '#059669',
          fillOpacity: 0.08
        }).addTo(map);

        L.polygon(YANGI_NAMANGAN_POLYGON, {
          color: '#0284C7',
          weight: 2,
          fillColor: '#0284C7',
          fillOpacity: 0.08
        }).addTo(map);

        L.polygon(CHUST_POLYGON, {
          color: '#D97706',
          weight: 2,
          fillColor: '#D97706',
          fillOpacity: 0.08
        }).addTo(map);

        // Custom Pin Icon
        const pinIcon = L.divIcon({
          className: 'picker-pin',
          iconSize: [36, 42],
          iconAnchor: [18, 42],
          html: `
            <div style="
              width: 36px;
              height: 36px;
              background-color: #DC2626;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid #FFFFFF;
              box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: grab;
            ">
              <div style="
                width: 12px;
                height: 12px;
                background-color: #FFFFFF;
                border-radius: 50%;
              "></div>
            </div>
          `
        });

        // Add draggable marker
        const marker = L.marker(defaultCenter, {
          icon: pinIcon,
          draggable: true
        }).addTo(map);

        marker.on('dragend', () => {
          const latlng = marker.getLatLng();
          updatePosition(latlng.lat, latlng.lng);
        });

        // Click on map to place pin
        map.on('click', (e: L.LeafletMouseEvent) => {
          updatePosition(e.latlng.lat, e.latlng.lng);
        });

        markerRef.current = marker;
        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [open, initialLat, initialLng]);

  // GPS Geolocation Handler
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      setGeoError('Qurilmangizda geolokatsiya qo‘llab-quvvatlanmaydi.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const { latitude, longitude } = pos.coords;
        updatePosition(latitude, longitude, true);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
        }
      },
      (err) => {
        setGeoLoading(false);
        setGeoError('GPS orqali joylashuvni aniqlab bo‘lmadi. Brauzerda geolokatsiyaga ruxsat bering.');
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    onConfirm(coords[0], coords[1], detectedDistrict);
    onClose();
  };

  const getDistrictLabel = () => {
    switch (detectedDistrict) {
      case 'davlatobod':
        return 'Davlatobod tumani';
      case 'yangi_namangan':
        return 'Yangi Namangan tumani';
      case 'chust':
        return 'Chust tumani';
      default:
        return 'Noma‘lum hudud (Tuman chegarasidan tashqarida)';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PlaceOutlinedIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Chiqindi Joylashgan Nuqtani Xaritadan Belgilang
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Xaritadagi istalgan joyga bosing yoki qizil markerni kerakli joyga surib olib boring.
        </Typography>

        {geoError && (
          <Alert severity="warning" sx={{ mb: 1.5, py: 0.5, borderRadius: 2 }}>
            {geoError}
          </Alert>
        )}

        {/* GPS Button & Info Bar */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          gap={1.5}
          sx={{ mb: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2.5, border: '1px solid #E2E8F0' }}
        >
          <AppButton
            variant="secondary"
            startIcon={geoLoading ? <CircularProgress size={16} /> : <MyLocationOutlinedIcon fontSize="small" />}
            onClick={handleGetGPS}
            disabled={geoLoading}
            sx={{ fontWeight: 700 }}
          >
            {geoLoading ? 'Aniqlanmoqda...' : 'Joriy lokatsiyamni aniqlash (GPS)'}
          </AppButton>

          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            <Chip
              size="small"
              icon={<CheckCircleOutlinedIcon style={{ fontSize: 14 }} />}
              label={`Koordinatalar: ${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
            {detectedDistrict && (
              <Chip
                size="small"
                label={getDistrictLabel()}
                color={detectedDistrict ? 'success' : 'default'}
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            )}
          </Stack>
        </Stack>

        {/* Map Canvas */}
        <Box
          ref={mapContainerRef}
          sx={{
            width: '100%',
            height: { xs: 340, sm: 420 },
            borderRadius: 2.5,
            overflow: 'hidden',
            border: '2px solid #CBD5E1',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <AppButton variant="secondary" onClick={onClose}>
          Bekor qilish
        </AppButton>
        <AppButton variant="primary" onClick={handleConfirm}>
          Ushbu Lokatsiyani Tanlash
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};
