/**
 * Satellite Utility Functions
 * Provides URL generation and coordinate validation for satellite/aerial imagery
 * Uses ESRI World Imagery (free) with Mapbox as optional upgrade
 */

/**
 * Validates if a latitude value is within valid range
 * @param {number} lat - Latitude value
 * @returns {boolean} True if valid latitude (-90 to 90)
 */
export function isValidLatitude(lat) {
  const numLat = parseFloat(lat);
  return !isNaN(numLat) && numLat >= -90 && numLat <= 90;
}

/**
 * Validates if a longitude value is within valid range
 * @param {number} lng - Longitude value
 * @returns {boolean} True if valid longitude (-180 to 180)
 */
export function isValidLongitude(lng) {
  const numLng = parseFloat(lng);
  return !isNaN(numLng) && numLng >= -180 && numLng <= 180;
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
 * Checks if Mapbox token is valid (exists and starts with pk.)
 * @returns {boolean} True if valid public token exists
 */
function hasValidMapboxToken() {
  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  return accessToken && accessToken.startsWith('pk.') && accessToken.length > 50;
}

/**
 * Generates a static map preview URL
 * Uses ESRI World Imagery (free, no token required) as primary
 * Falls back to Mapbox if configured with valid public token
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

  const clampedZoom = Math.max(0, Math.min(18, zoom));
  const clampedWidth = Math.min(width, 1280);
  const clampedHeight = Math.min(height, 1280);
  
  // Try Mapbox if valid token exists
  if (hasValidMapboxToken()) {
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lng},${lat},${clampedZoom}/${clampedWidth}x${clampedHeight}?access_token=${accessToken}`;
  }
  
  // Use free ESRI World Imagery Export API (no token required)
  // This generates a static image from ESRI's satellite imagery
  const bbox = calculateBbox(lat, lng, clampedZoom, clampedWidth, clampedHeight);
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&size=${clampedWidth},${clampedHeight}&imageSR=4326&format=jpg&f=image`;
}

/**
 * Calculate bounding box for ESRI static map
 */
function calculateBbox(lat, lng, zoom, width, height) {
  // Approximate degrees per pixel at given zoom level
  const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
  const degreesPerPixelLng = metersPerPixel / 111320;
  const degreesPerPixelLat = metersPerPixel / 110540;
  
  const halfWidthDeg = (width / 2) * degreesPerPixelLng;
  const halfHeightDeg = (height / 2) * degreesPerPixelLat;
  
  const minLng = lng - halfWidthDeg;
  const minLat = lat - halfHeightDeg;
  const maxLng = lng + halfWidthDeg;
  const maxLat = lat + halfHeightDeg;
  
  return `${minLng},${minLat},${maxLng},${maxLat}`;
}

/**
 * Generates a satellite/aerial tile layer URL template for interactive maps
 * Uses ESRI World Imagery (free) as primary, Mapbox as optional
 * @returns {string} The tile layer URL template
 */
export function generateTileLayerUrl() {
  // Try Mapbox if valid token exists
  if (hasValidMapboxToken()) {
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${accessToken}`;
  }
  
  // Use free ESRI World Imagery tiles (no token required)
  return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
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
