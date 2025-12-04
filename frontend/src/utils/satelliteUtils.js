/**
 * Satellite Utility Functions
 * Provides URL generation and coordinate validation for Mapbox satellite imagery
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
 * Generates a Mapbox Static API URL for satellite imagery
 * URL Format: https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/{lng},{lat},{zoom},0,0/{width}x{height}?access_token={token}
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

  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.warn('VITE_MAPBOX_ACCESS_TOKEN is not configured');
    return null;
  }

  // Clamp zoom to valid range
  const clampedZoom = Math.max(0, Math.min(22, zoom));
  
  // Clamp dimensions to Mapbox limits (max 1280x1280)
  const clampedWidth = Math.max(1, Math.min(1280, width));
  const clampedHeight = Math.max(1, Math.min(1280, height));

  const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static';
  
  // Mapbox format: longitude,latitude (note the order)
  return `${baseUrl}/${lng},${lat},${clampedZoom},0,0/${clampedWidth}x${clampedHeight}?access_token=${token}`;
}

/**
 * Generates a Mapbox satellite tile layer URL template for interactive maps
 * @returns {string|null} The tile layer URL template or null if token is not configured
 */
export function generateTileLayerUrl() {
  const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.warn('VITE_MAPBOX_ACCESS_TOKEN is not configured');
    return null;
  }

  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${token}`;
}

/**
 * Default satellite configuration values
 */
export const SATELLITE_CONFIG = {
  defaultZoom: 15,
  minZoom: 0,
  maxZoom: 22,
  imageWidth: 600,
  imageHeight: 300,
  maxImageDimension: 1280,
};
