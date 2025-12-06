/**
 * Satellite Utility Functions
 * Provides URL generation and coordinate validation for satellite/aerial imagery
 * Uses Mapbox satellite imagery
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
 * Generates a static map preview URL using Mapbox Static Images API
 * 
 * @param {number} lat - Latitude of the center point
 * @param {number} lng - Longitude of the center point
 * @param {number} [zoom=15] - Zoom level (0-22)
 * @param {number} [width=600] - Image width in pixels
 * @param {number} [height=300] - Image height in pixels
 * @returns {string|null} The generated URL or null if coordinates are invalid
 */
export function generateStaticMapUrl(lat, lng, zoom = 15, width = 600, height = 300) {
  if (!isValidCoordinates(lat, lng)) {
    return null;
  }

  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('Mapbox access token not found');
    return null;
  }

  const clampedZoom = Math.max(0, Math.min(22, zoom));
  const clampedWidth = Math.min(width, 1280);
  const clampedHeight = Math.min(height, 1280);
  
  // Mapbox Static Images API
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},${clampedZoom}/${clampedWidth}x${clampedHeight}?access_token=${accessToken}`;
}

/**
 * Generates a satellite/aerial tile layer URL template for interactive maps
 * Uses Mapbox Satellite imagery
 * @returns {string} The tile layer URL template
 */
export function generateTileLayerUrl() {
  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('Mapbox access token not found');
    return null;
  }
  
  // Mapbox Satellite tiles
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${accessToken}`;
}

/**
 * Alternative tile providers (can be swapped if needed)
 */
export const TILE_PROVIDERS = {
  // Mapbox Satellite (primary)
  mapboxSatellite: (token) => `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${token}`,
  // Mapbox Streets
  mapboxStreets: (token) => `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${token}`,
  // Mapbox Dark
  mapboxDark: (token) => `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${token}`,
};

/**
 * Default satellite configuration values
 */
export const SATELLITE_CONFIG = {
  defaultZoom: 15,
  minZoom: 0,
  maxZoom: 22, // Mapbox supports up to zoom 22
  imageWidth: 600,
  imageHeight: 300,
  maxImageDimension: 1280, // Mapbox Static API max dimension
};
