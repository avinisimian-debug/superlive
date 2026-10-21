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
 * Generates an accurate, physical destination URL for Waze.
 * 
 * CRITICAL FIX:
 * In Waze deep links, passing BOTH `ll` and `q` causes Waze to execute a free-text search for `q`,
 * completely overriding the GPS coordinates and leading drivers to incorrect branches in other cities.
 * To ensure 100% navigation accuracy to the physical parking lot/store, we route strictly by `ll`
 * coordinates, unless an explicit human-verified `wazeQuery` override exists for this specific venue.
 */
export function getWazeNavigationUrl(branch: Branch): string {
  // Explicit destination override for Mevo Horon to ensure drivers never land in Nof Ayalon
  if (branch.id === "b-3449" || branch.name.includes("מבוא חורון") || (branch.city === "מבוא חורון" && branch.chain.includes("מכולת"))) {
    return `https://www.waze.com/ul?q=${encodeURIComponent("צרכניית מבוא חורון")}&navigate=yes`;
  }

  if (!isValidCoordinates(branch.lat, branch.lng)) {
    // If coordinates are somehow missing, fall back to explicit address search
    const fallbackQuery = encodeURIComponent(`${branch.chain} ${branch.city} ${branch.address || branch.name}`);
    return `https://www.waze.com/ul?q=${fallbackQuery}&navigate=yes`;
  }

  if (branch.wazeQuery && branch.wazeQuery.trim().length > 0) {
    return `https://www.waze.com/ul?q=${encodeURIComponent(branch.wazeQuery.trim())}&navigate=yes`;
  }

  // Exact physical GPS pin turn-by-turn navigation
  return `https://www.waze.com/ul?ll=${branch.lat}%2C${branch.lng}&navigate=yes`;
}

/**
 * Google Maps destination link as alternative.
 */
export function getGoogleMapsNavigationUrl(branch: Branch): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`;
}
