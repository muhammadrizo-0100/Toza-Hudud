import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';

import { MapPoint } from '../../api/requestsApi';
import { District } from '../../types';
import {
  DAVLATOBOD_CENTER,
  DAVLATOBOD_POLYGON,
  YANGI_NAMANGAN_POLYGON,
  CHUST_POLYGON,
  getDistrictPolygon,
  normalizePolygon
} from '../../constants/boundaries';

export type MapStyleType = 'osm' | 'light' | 'satellite';
export type LayerModeType = 'markers' | 'heat' | 'both';

interface WasteMapCanvasProps {
  points: MapPoint[];
  district?: District | null;
  districts?: District[];
  selectedId?: number | null;
  mapStyle?: MapStyleType;
  layerMode?: LayerModeType;
  resetTrigger?: number;
  onSelectRequest?: (id: number) => void;
  onSelectDistrict?: (id: number) => void;
}

const DISTRICT_PALETTE = [
  { border: '#059669', fill: '#10B981' }, // Emerald
  { border: '#0284C7', fill: '#38BDF8' }, // Sky
  { border: '#D97706', fill: '#F59E0B' }, // Amber
  { border: '#7C3AED', fill: '#A78BFA' }, // Violet
  { border: '#0D9488', fill: '#2DD4BF' }, // Teal
  { border: '#E11D48', fill: '#FB7185' }, // Rose
  { border: '#EA580C', fill: '#FB923C' }, // Orange
  { border: '#4F46E5', fill: '#818CF8' }  // Indigo
];

function getMarkerColor(status: string): string {
  switch (status) {
    case 'new':
      return '#DC2626'; // Red
    case 'in_progress':
      return '#F59E0B'; // Amber
    case 'submitted':
      return '#0284C7'; // Sky
    case 'completed':
      return '#059669'; // Emerald
    default:
      return '#64748B';
  }
}

function createCustomPin(status: string, isSelected: boolean): L.DivIcon {
  const color = getMarkerColor(status);
  const size = isSelected ? 32 : 24;
  const pinSize = isSelected ? 32 : 24;
  const dotSize = isSelected ? 10 : 8;

  return L.divIcon({
    className: 'custom-waste-pin',
    html: `
      <div style="
        background-color: ${color};
        width: ${pinSize}px;
        height: ${pinSize}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: ${isSelected ? '3px solid #FFFFFF' : '2px solid #FFFFFF'};
        box-shadow: ${isSelected ? '0 0 0 3px ' + color + ', 0 6px 16px rgba(0,0,0,0.4)' : '0 4px 10px rgba(0,0,0,0.3)'};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <div style="
          width: ${dotSize}px;
          height: ${dotSize}px;
          background: #FFFFFF;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
}

export const WasteMapCanvas: React.FC<WasteMapCanvasProps> = ({
  points,
  district,
  districts,
  selectedId,
  mapStyle = 'osm',
  layerMode = 'markers',
  resetTrigger = 0,
  onSelectRequest,
  onSelectDistrict
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const heatLayerRef = useRef<any>(null);
  const polygonLayersRef = useRef<L.LayerGroup | null>(null);

  const lastDistrictIdRef = useRef<number | string | null | undefined>(undefined);
  const initialFitDoneRef = useRef(false);
  const allDistrictBoundsRef = useRef<L.LatLngBounds | null>(null);

  const onSelectRequestRef = useRef(onSelectRequest);
  onSelectRequestRef.current = onSelectRequest;

  const onSelectDistrictRef = useRef(onSelectDistrict);
  onSelectDistrictRef.current = onSelectDistrict;

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView(DAVLATOBOD_CENTER, 12);

    polygonLayersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Tile layer (Xarita uslubi: OSM, CARTO Light, Yo'ldosh Sputnik)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let maxZoom = 19;

    if (mapStyle === 'light') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      maxZoom = 20;
    } else if (mapStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      maxZoom = 18;
    }

    const tile = L.tileLayer(tileUrl, { maxZoom });
    tile.addTo(map);
    tileLayerRef.current = tile;
  }, [mapStyle]);

  // 3. Reset Trigger (Tiklash bosilganda xarita kamerasini silliq markazga qaytarish)
  useEffect(() => {
    if (resetTrigger === 0) return;
    const map = mapRef.current;
    if (!map) return;

    if (allDistrictBoundsRef.current && allDistrictBoundsRef.current.isValid()) {
      map.fitBounds(allDistrictBoundsRef.current.pad(0.08), { animate: true, duration: 0.8 });
    } else {
      map.flyTo(DAVLATOBOD_CENTER, 12, { duration: 0.8 });
    }
  }, [resetTrigger]);

  // 4. Update District Boundaries (Faqat tuman o'zgarganda yoki ilk ochilishda fitBounds qiladi, zoomni saqlab qoladi)
  useEffect(() => {
    const map = mapRef.current;
    const polyGroup = polygonLayersRef.current;
    if (!map || !polyGroup) return;

    polyGroup.clearLayers();

    const outsideRing: [number, number][] = [
      [90, -180],
      [90, 180],
      [-90, 180],
      [-90, -180]
    ];

    const currentDistId = district?.id ?? null;
    const districtChanged = currentDistId !== lastDistrictIdRef.current;
    lastDistrictIdRef.current = currentDistId;

    if (district && district.id) {
      // Focus on selected district
      const polygonCoords = normalizePolygon(district.polygon) || getDistrictPolygon(district.code || district.id);

      const poly = L.polygon(polygonCoords, {
        color: '#059669',
        weight: 3,
        fillColor: '#10B981',
        fillOpacity: 0.08
      });
      poly.bindTooltip(`<b>${district.name}</b> chegarasi`, { permanent: false, direction: 'top' });
      polyGroup.addLayer(poly);

      const mask = L.polygon([outsideRing, polygonCoords], {
        color: 'transparent',
        fillColor: '#0F172A',
        fillOpacity: 0.12,
        interactive: false
      });
      polyGroup.addLayer(mask);

      // Only zoom/fitBounds if district was actually changed or initial load!
      if (districtChanged || !initialFitDoneRef.current) {
        initialFitDoneRef.current = true;
        map.fitBounds(poly.getBounds().pad(0.1), { animate: true, duration: 0.8 });
      }
    } else {
      // SuperAdmin: All districts view
      const listToRender = districts && districts.length > 0
        ? districts
        : [
            { id: 1, name: 'Davlatobod tumani', code: 'davlatobod', polygon: DAVLATOBOD_POLYGON },
            { id: 2, name: 'Yangi Namangan tumani', code: 'yangi_namangan', polygon: YANGI_NAMANGAN_POLYGON },
            { id: 3, name: 'Chust tumani', code: 'chust', polygon: CHUST_POLYGON }
          ];

      const bounds = L.latLngBounds([]);

      listToRender.forEach((d, idx) => {
        const polyCoords = normalizePolygon(d.polygon) || getDistrictPolygon(d.code || d.id);
        if (!polyCoords || polyCoords.length < 3) return;

        const palette = DISTRICT_PALETTE[idx % DISTRICT_PALETTE.length];
        const poly = L.polygon(polyCoords, {
          color: palette.border,
          weight: 2.5,
          fillColor: palette.fill,
          fillOpacity: 0.08
        });

        poly.bindTooltip(`<b>${d.name}</b>`, {
          permanent: true,
          direction: 'center',
          className: 'district-map-label'
        });

        poly.on('click', () => {
          onSelectDistrictRef.current?.(d.id);
        });

        polyGroup.addLayer(poly);
        bounds.extend(poly.getBounds());
      });

      if (bounds.isValid()) {
        allDistrictBoundsRef.current = bounds;
      }

      // Only zoom/fitBounds if district changed or initial load!
      if (districtChanged || !initialFitDoneRef.current) {
        initialFitDoneRef.current = true;
        if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.08), { animate: true, duration: 0.8 });
        } else {
          map.flyTo(DAVLATOBOD_CENTER, 12, { duration: 0.8 });
        }
      }
    }
  }, [district, districts]);

  // 5. Update Markers & Clusters & Heatmap (Zoom va markazga aslo ta'sir qilmaydi!)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // A. Markers & Clusters
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    if (layerMode === 'markers' || layerMode === 'both') {
      const cluster = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 36
      });

      points.forEach((p) => {
        if (!p.lat || !p.lng) return;

        const isSelected = selectedId === p.id;
        const marker = L.marker([p.lat, p.lng], {
          icon: createCustomPin(p.status, isSelected),
          zIndexOffset: isSelected ? 1000 : 0
        });

        marker.on('click', () => {
          onSelectRequestRef.current?.(p.id);
        });

        cluster.addLayer(marker);
      });

      clusterGroupRef.current = cluster;
      map.addLayer(cluster);
    }

    // B. Heatmap (Issiqlik qatlami)
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (layerMode === 'heat' || layerMode === 'both') {
      const validPoints = points.filter((p) => p.lat && p.lng);
      if (validPoints.length > 0 && typeof (L as any).heatLayer === 'function') {
        const heatData = validPoints.map((p) => {
          const intensity = p.status === 'completed' ? 0.35 : p.status === 'new' ? 1.0 : 0.7;
          return [p.lat, p.lng, intensity];
        });

        const heat = (L as any).heatLayer(heatData, {
          radius: 28,
          blur: 16,
          maxZoom: 16,
          gradient: {
            0.2: '#10B981',
            0.5: '#38BDF8',
            0.7: '#F59E0B',
            1.0: '#DC2626'
          }
        });

        heatLayerRef.current = heat;
        map.addLayer(heat);
      }
    }
  }, [points, selectedId, layerMode]);

  return <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%', bgcolor: '#E2E8F0' }} />;
};

export default WasteMapCanvas;
