/**
 * Approximate Shabbat entry/exit for central Israel, used for stores whose
 * hours are published relative to Shabbat ("closes two hours before Shabbat").
 * Sunset follows the NOAA solar equations; entry is candle lighting (sunset
 * minus 20 minutes) and exit is sunset plus 40 minutes. Accurate to a few
 * minutes anywhere in the country, which is enough for an "open now" badge.
 */
const LAT = 32.08;
const LNG = 34.78;
const SUN_ALTITUDE_DEG = -0.833;

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Sunset as an absolute time, for the calendar day of `day` in the user's timezone. */
export function sunsetOn(day: Date): Date {
  const noonUtc = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), 12);
  const n = Math.round(noonUtc / 86400000 + 2440587.5 - 2451545.0);
  const meanSolarNoon = n - LNG / 360;
  const m = (357.5291 + 0.98560028 * meanSolarNoon) % 360;
  const c = 1.9148 * Math.sin(rad(m)) + 0.02 * Math.sin(rad(2 * m)) + 0.0003 * Math.sin(rad(3 * m));
  const lambda = (m + c + 180 + 102.9372) % 360;
  const transit = 2451545.0 + meanSolarNoon + 0.0053 * Math.sin(rad(m)) - 0.0069 * Math.sin(rad(2 * lambda));
  const sinDecl = Math.sin(rad(lambda)) * Math.sin(rad(23.4397));
  const decl = Math.asin(sinDecl);
  const cosH =
    (Math.sin(rad(SUN_ALTITUDE_DEG)) - Math.sin(rad(LAT)) * sinDecl) / (Math.cos(rad(LAT)) * Math.cos(decl));
  const hourAngle = deg(Math.acos(Math.max(-1, Math.min(1, cosH))));
  const julianSunset = transit + hourAngle / 360;
  return new Date((julianSunset - 2440587.5) * 86400000);
}

function minutesInDay(at: Date, day: Date): number {
  const midnight = new Date(day);
  midnight.setHours(0, 0, 0, 0);
  return Math.round((at.getTime() - midnight.getTime()) / 60000);
}

/**
 * Shabbat entry (on Friday) and exit (on Saturday) for the week of `day`,
 * as minutes since midnight of `day` itself. Use the entry on Fridays and the
 * exit on Saturdays; the other value is still meaningful for holiday eves.
 */
export function shabbatTimes(day: Date): { entry: number; exit: number } {
  const sunset = minutesInDay(sunsetOn(day), day);
  return { entry: sunset - 20, exit: sunset + 40 };
}
