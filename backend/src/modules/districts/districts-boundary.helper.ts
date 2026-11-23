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
          polygon = (match.geojson.coordinates[0] as [number, number][]).map(([pLng, pLat]) => [
            Number(pLat.toFixed(6)),
            Number(pLng.toFixed(6))
          ]);
        } else if (match.geojson.type === 'MultiPolygon' && Array.isArray(match.geojson.coordinates?.[0]?.[0])) {
          polygon = (match.geojson.coordinates[0][0] as [number, number][]).map(([pLng, pLat]) => [
            Number(pLat.toFixed(6)),
            Number(pLng.toFixed(6))
          ]);
        }
      }
    }

    if (!polygon || polygon.length < 4) {
      throw new BadRequestException(
        `"${trimmedName}" nomli tuman yoki shahar bo‘yicha rasmiy ma’muriy chegara topilmadi. Iltimos, O‘zbekistondagi rasmiy tuman yoki shahar nomini kiriting.`
      );
    }
  } catch (err: unknown) {
    if (err instanceof BadRequestException) throw err;
    logger.warn(`OSM boundary fetch error for ${trimmedName}: ${String(err)}`);
    throw new BadRequestException(
      `"${trimmedName}" ma’muriy chegaralarini xaritadan yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.`
    );
  }

  return { lat, lng, polygon };
}
