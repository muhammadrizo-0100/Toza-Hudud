import axios from 'axios';
import { BadRequestException, Logger } from '@nestjs/common';

const logger = new Logger('DistrictsBoundaryHelper');

export async function fetchDistrictBoundaryAndCenter(
  trimmedName: string
): Promise<{ lat: number; lng: number; polygon: [number, number][] | null }> {
  let lat = 0;
  let lng = 0;
  let polygon: [number, number][] | null = null;

  try {
    const query = encodeURIComponent(`${trimmedName} Uzbekistan`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&polygon_geojson=1&limit=1`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'TozaHududSanitation/1.0 (contact@tozahudud.uz)' },
      timeout: 4500
    });

    if (res.data && res.data.length > 0) {
      const match = res.data[0];
      lat = Number(match.lat) || lat;
      lng = Number(match.lon) || lng;

      if (match.geojson) {
        if (match.geojson.type === 'Polygon' && Array.isArray(match.geojson.coordinates?.[0])) {
          polygon = (match.geojson.coordinates[0] as [number, number][]).map(([pLng, pLat]) => [pLat, pLng]);
        } else if (match.geojson.type === 'MultiPolygon' && Array.isArray(match.geojson.coordinates?.[0]?.[0])) {
          polygon = (match.geojson.coordinates[0][0] as [number, number][]).map(([pLng, pLat]) => [pLat, pLng]);
        }
      }
    } else {
      throw new BadRequestException(
        `"${trimmedName}" nomli tuman yoki shahar O‘zbekiston xaritasidan topilmadi. Iltimos, nomini to‘g‘ri yozganingizga ishonch hosil qiling (Masalan: Rishton tumani, Qo‘qon shahri).`
      );
    }
  } catch (err: any) {
    if (err instanceof BadRequestException) throw err;
    logger.warn(`OSM boundary fetch skipped for ${trimmedName}: ${String(err)}`);
  }

  if (!lat || !lng) {
    lat = 41.0000;
    lng = 71.6000;
  }

  if (!polygon && lat && lng) {
    const r = 0.035;
    const points: [number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * 2 * Math.PI) / 8;
      points.push([
        Number((lat + r * Math.cos(angle)).toFixed(6)),
        Number((lng + (r * 1.3) * Math.sin(angle)).toFixed(6))
      ]);
    }
    points.push(points[0]);
    polygon = points;
  }

  return { lat, lng, polygon };
}
