const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two coordinates, in kilometres. */
export function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Hebrew-friendly distance label in kilometres, one decimal place. */
export function formatDistance(km: number): string {
  if (km < 100) return `${km.toFixed(1)} ק״מ`;
  return `${Math.round(km)} ק״מ`;
}

/** Relative "time ago" label in Hebrew. Returns null when there is no report. */
export function timeAgo(at: number | null, now: number): string | null {
  if (at === null) return null;
  const diffMin = Math.max(0, Math.round((now - at) / 60000));
  if (diffMin < 1) return "דווח כעת";
  if (diffMin === 1) return "דווח לפני דקה";
  if (diffMin < 60) return `דווח לפני ${diffMin} דקות`;
  const hours = Math.round(diffMin / 60);
  if (hours === 1) return "דווח לפני שעה";
  return `דווח לפני ${hours} שעות`;
}

export const DEFAULT_LOCATION = {
  lat: 32.0853,
  lng: 34.7818,
  label: "תל אביב-יפו (ברירת מחדל)",
};
