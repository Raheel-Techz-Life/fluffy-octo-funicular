import { GeoPoint } from '../types/job';
import { WorkerProfile } from '../types/worker';

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in metres (haversine). */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Point moved east/north by the given metres. Accurate enough at site scale (a few km). */
export function offsetPoint(p: GeoPoint, eastMeters: number, northMeters: number): GeoPoint {
  return {
    lat: p.lat + northMeters / 110_540,
    lng: p.lng + eastMeters / (111_320 * Math.cos(toRad(p.lat))),
  };
}

/** Local flat projection around an origin: metres east (x) and north (y). */
export function toLocalMeters(origin: GeoPoint, p: GeoPoint): { x: number; y: number } {
  return {
    x: (p.lng - origin.lng) * 111_320 * Math.cos(toRad(origin.lat)),
    y: (p.lat - origin.lat) * 110_540,
  };
}

export function fromLocalMeters(origin: GeoPoint, x: number, y: number): GeoPoint {
  return offsetPoint(origin, x, y);
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}

/**
 * Approximate centre points of the localities in the demo data.
 * Good enough for commute estimates; replace with geocoded addresses in production.
 */
export const AREA_COORDS: Record<string, GeoPoint> = {
  'vidyanagar': { lat: 15.3687, lng: 75.1215 },
  'gokul road industrial area': { lat: 15.3591, lng: 75.0941 },
  'gokul road': { lat: 15.3591, lng: 75.0941 },
  'keshwapur': { lat: 15.3478, lng: 75.1381 },
  'navanagar': { lat: 15.3957, lng: 75.0839 },
  'old hubballi': { lat: 15.3612, lng: 75.1462 },
  'shirur park': { lat: 15.3705, lng: 75.1102 },
  'unkal': { lat: 15.3855, lng: 75.1102 },
  'bhairidevarakoppa': { lat: 15.3812, lng: 75.0993 },
  'line bazaar': { lat: 15.4583, lng: 75.0072 },
  'saptapur': { lat: 15.4720, lng: 75.0165 },
  'kelageri': { lat: 15.4615, lng: 74.9781 },
};

export const CITY_COORDS: Record<string, GeoPoint> = {
  hubballi: { lat: 15.3647, lng: 75.1240 },
  dharwad: { lat: 15.4589, lng: 75.0078 },
};

/** Best-known home location of a worker: their area, else their city centre. */
export function workerHomePoint(worker: WorkerProfile): GeoPoint | null {
  return (
    AREA_COORDS[worker.area.trim().toLowerCase()] ??
    CITY_COORDS[worker.location.trim().toLowerCase()] ??
    null
  );
}
