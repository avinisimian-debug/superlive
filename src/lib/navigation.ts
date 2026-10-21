import type { Branch } from "./types";

/**
 * Validates that geographic coordinates fall strictly within Israel's boundaries.
 * Israel bounds: lat [29.45, 33.35], lng [34.20, 35.90].
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return lat >= 29.4 && lat <= 33.5 && lng >= 34.1 && lng <= 36.0;
}

/**
 * Waze deep link that drives to the branch itself.
 *
 * Passing both `ll` and `q` makes Waze run a free-text search for `q` and
 * ignore the pin, which can land in another city. So we navigate by the pin
 * alone, unless a human-checked `wazeQuery` exists for this exact venue.
 * Branches whose pin fails the location checks never reach this function:
 * they are held back in branches.ts.
 */
export function getWazeNavigationUrl(branch: Branch): string {
  const override = branch.wazeQuery?.trim();
  if (override) {
    return `https://www.waze.com/ul?q=${encodeURIComponent(override)}&navigate=yes`;
  }

  if (!isValidCoordinates(branch.lat, branch.lng)) {
    // Only user-added branches can get here; search by the full address instead.
    const fallbackQuery = encodeURIComponent(
      [branch.chain, branch.address || branch.name, branch.city].filter(Boolean).join(" "),
    );
    return `https://www.waze.com/ul?q=${fallbackQuery}&navigate=yes`;
  }

  return `https://www.waze.com/ul?ll=${branch.lat}%2C${branch.lng}&navigate=yes`;
}

/**
 * Google Maps destination link as alternative.
 */
export function getGoogleMapsNavigationUrl(branch: Branch): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`;
}
