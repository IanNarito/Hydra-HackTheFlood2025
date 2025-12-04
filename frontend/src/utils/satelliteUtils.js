/**
 * Satellite Utility Functions
 * Provides URL generation and coordinate validation for satellite/aerial imagery
 * Uses free OpenStreetMap-based providers (no API key required)
 */

/**
 * Validates if a latitude value is within valid range
 * @param {number} lat - Latitude value
 * @returns {boolean} True if valid latitude (-90 to 90)
 */
export function isValidLatitude(lat) {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validates if a longitude value is within valid range
 * @param {number} lng - Longitude value
 * @returns {boolean} True if valid longitude (-180 to 180)
 */
export function isValidLongitude(lng) {
  return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
}

/**
 * Validates if coordinates are valid
 * @param {number} lat - Latitude value
 * @param {number} lng - Longitude value
 * @returns {boolean} True if both coordinates are valid
 */
export function isValidCoordinates(lat, lng) {
  return isValidLatitude(lat) && isValidLongitude(lng);
}

/**
 * Generates a static map preview URL using geoapify (free tier, no key needed for low usage)
 * Falls back to a tile-based approach
 * 
 * @param {number} lat - Latitude of the center point
 * @param {number} lng - Longitude of the center point
 * @param {number} [zoom=15] - Zoom level (0-18)
 * @param {number} [width=600] - Image width in pixels
 * @param {number} [height=300] - Image height in pixels
 * @returns {string|null} The generated URL or null if coordinates are invalid
 */
export function generateStaticMapUrl(lat, lng, zoom = 15, width = 600, height = 300) {
  if (!isValidCoordinates(lat, lng)) {
    return null;
  }

  // Use ESRI World Imagery tile directly for the preview
  // Calculate tile coordinates from lat/lng/zoom
  const clampedZoom = Math.max(0, Math.min(18, zoom));
  
  // Convert lat/lng to tile coordinates
  const n = Math.pow(2, clampedZoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  
  // Return ESRI satellite tile URL
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${clampedZoom}/${y}/${x}`;
}

/**
 * Generates a satellite/aerial tile layer URL template for interactive maps
 * Uses ESRI World Imagery (free for non-commercial use)
 * @returns {string} The tile layer URL template
 */
export function generateTileLayerUrl() {
  // ESRI World Imagery - free satellite tiles
  return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
}

/**
 * Alternative tile providers (can be swapped if needed)
 */
export const TILE_PROVIDERS = {
  // ESRI Satellite (best quality, free)
  esriSatellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  // OpenStreetMap standard
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  // CartoDB Dark (for contrast)
  cartoDark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

/**
 * Default satellite configuration values
 */
export const SATELLITE_CONFIG = {
  defaultZoom: 15,
  minZoom: 0,
  maxZoom: 18,
  imageWidth: 600,
  imageHeight: 300,
  maxImageDimension: 1024,
};
