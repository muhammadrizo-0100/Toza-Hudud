export type LatLngTuple = [number, number];

export const DAVLATOBOD_CENTER: LatLngTuple = [41.0108, 71.5775];

export const DAVLATOBOD_POLYGON: LatLngTuple[] = [
  [40.966141, 71.566367],
  [40.97196, 71.571334],
  [40.976357, 71.577328],
  [40.98696, 71.537249],
  [40.98877, 71.537421],
  [40.989933, 71.536564],
  [40.990321, 71.538448],
  [40.987347, 71.553863],
  [40.99239, 71.561742],
  [40.997431, 71.565339],
  [41.000404, 71.537935],
  [41.007578, 71.540271],
  [41.009667, 71.530463],
  [41.008361, 71.522155],
  [41.016023, 71.519501],
  [41.020463, 71.522271],
  [41.02499, 71.527001],
  [41.028124, 71.527925],
  [41.028907, 71.523194],
  [41.034478, 71.522848],
  [41.036392, 71.526078],
  [41.037959, 71.521117],
  [41.038568, 71.519963],
  [41.041179, 71.520194],
  [41.044312, 71.516848],
  [41.047967, 71.519732],
  [41.048489, 71.521463],
  [41.04962, 71.526886],
  [41.050664, 71.530925],
  [41.050577, 71.533578],
  [41.047619, 71.535771],
  [41.047967, 71.538309],
  [41.0511, 71.539578],
  [41.053014, 71.539002],
  [41.054493, 71.539232],
  [41.056233, 71.540271],
  [41.056407, 71.542463],
  [41.054493, 71.544425],
  [41.052057, 71.546271],
  [41.051274, 71.548117],
  [41.050926, 71.552271],
  [41.050229, 71.556425],
  [41.046923, 71.556886],
  [41.043964, 71.55804],
  [41.040135, 71.561271],
  [41.033694, 71.563233],
  [41.034826, 71.570848],
  [41.034652, 71.573963],
  [41.041005, 71.57604],
  [41.045356, 71.583425],
  [41.048924, 71.587694],
  [41.054493, 71.58781],
  [41.057538, 71.587117],
  [41.059278, 71.591041],
  [41.055189, 71.598079],
  [41.051709, 71.599233],
  [41.051361, 71.595079],
  [41.043529, 71.595656],
  [41.037176, 71.596348],
  [41.036653, 71.599233],
  [41.037611, 71.603271],
  [41.028994, 71.611002],
  [41.030213, 71.616541],
  [41.029603, 71.620348],
  [41.022988, 71.620348],
  [41.020898, 71.62981],
  [41.02055, 71.639503],
  [41.020289, 71.642156],
  [41.009319, 71.65681],
  [41.003398, 71.660157],
  [41.000002, 71.646195],
  [40.99199, 71.649426],
  [40.989987, 71.639503],
  [40.987983, 71.630618],
  [40.98328, 71.631426],
  [40.97997, 71.621156],
  [40.973436, 71.624387],
  [40.970823, 71.620925],
  [40.967425, 71.620233],
  [40.963417, 71.612271],
  [40.960542, 71.604425],
  [40.958799, 71.594964],
  [40.963417, 71.585964],
  [40.961761, 71.58654],
  [40.966641, 71.578117],
  [40.969342, 71.57131]
];

export const YANGI_NAMANGAN_POLYGON: LatLngTuple[] = [
  [41.0150, 71.6350],
  [41.0300, 71.6300],
  [41.0450, 71.6450],
  [41.0550, 71.6650],
  [41.0450, 71.6850],
  [41.0250, 71.6850],
  [41.0150, 71.6600],
  [41.0150, 71.6350]
];

export const CHUST_POLYGON: LatLngTuple[] = [
  [40.9850, 71.2050],
  [41.0150, 71.2000],
  [41.0350, 71.2250],
  [41.0300, 71.2600],
  [41.0000, 71.2650],
  [40.9850, 71.2350],
  [40.9850, 71.2050]
];

export function normalizePolygon(rawPoly: unknown): LatLngTuple[] | null {
  if (!rawPoly || !Array.isArray(rawPoly) || rawPoly.length < 3) return null;
  const result: LatLngTuple[] = [];
  for (const item of rawPoly) {
    if (Array.isArray(item) && item.length >= 2) {
      const lat = Number(item[0]);
      const lng = Number(item[1]);
      if (!isNaN(lat) && !isNaN(lng)) result.push([lat, lng]);
    } else if (typeof item === 'string') {
      const parts = item.trim().split(/[\s,]+/);
      if (parts.length >= 2) {
        const lat = Number(parts[0]);
        const lng = Number(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) result.push([lat, lng]);
      }
    }
  }
  return result.length >= 3 ? result : null;
}

export function getDistrictPolygon(codeOrId?: string | number | null): LatLngTuple[] {
  const norm = String(codeOrId || '').toLowerCase();
  if (norm === 'yangi_namangan' || norm === '2') {
    return YANGI_NAMANGAN_POLYGON;
  }
  if (norm === 'chust' || norm === '3') {
    return CHUST_POLYGON;
  }
  return DAVLATOBOD_POLYGON;
}

export function isPointInPolygon(point: LatLngTuple, polygon: LatLngTuple[]): boolean {
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function detectDistrictByPoint(point: LatLngTuple): 'davlatobod' | 'yangi_namangan' | 'chust' | null {
  if (isPointInPolygon(point, DAVLATOBOD_POLYGON)) return 'davlatobod';
  if (isPointInPolygon(point, YANGI_NAMANGAN_POLYGON)) return 'yangi_namangan';
  if (isPointInPolygon(point, CHUST_POLYGON)) return 'chust';
  return null;
}

