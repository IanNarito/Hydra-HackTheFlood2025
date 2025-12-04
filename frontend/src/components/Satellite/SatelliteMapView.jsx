import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import { Maximize2, Minimize2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { generateTileLayerUrl, isValidCoordinates, SATELLITE_CONFIG } from '../../utils/satelliteUtils';
import 'leaflet/dist/leaflet.css';

/**
 * Component to handle map center updates when coordinates change
 */
const MapCenterUpdater = ({ latitude, longitude }) => {
  const map = useMap();
  
  useEffect(() => {
    if (isValidCoordinates(latitude, longitude)) {
      map.setView([latitude, longitude]);
    }
  }, [latitude, longitude, map]);
  
  return null;
};

/**
 * SatelliteMapView Component
 * Displays an interactive satellite map centered on project coordinates
 * 
 * @param {Object} props
 * @param {number} props.latitude - Latitude of the center point
 * @param {number} props.longitude - Longitude of the center point
 * @param {number} [props.zoom=15] - Initial zoom level
 * @param {Date} [props.date] - Optional date for historical imagery
 * @param {function} [props.onZoomChange] - Callback when zoom level changes
 */
const SatelliteMapView = ({
  latitude,
  longitude,
  zoom = SATELLITE_CONFIG.defaultZoom,
  date,
  onZoomChange,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [tileUrl, setTileUrl] = useState(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  const hasValidCoordinates = isValidCoordinates(latitude, longitude);

  // Generate tile layer URL on mount
  useEffect(() => {
    const url = generateTileLayerUrl();
    if (url) {
      setTileUrl(url);
      setHasError(false);
    } else {
      setHasError(true);
    }
    setIsLoading(false);
  }, []);


  // Handle full-screen toggle
  const toggleFullScreen = () => {
    if (!containerRef.current) return;

    if (!isFullScreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('msfullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('msfullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Handle zoom change callback
  const handleZoomEnd = () => {
    if (onZoomChange && mapRef.current) {
      onZoomChange(mapRef.current.getZoom());
    }
  };

  // Invalidate map size when fullscreen changes
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [isFullScreen]);

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    const url = generateTileLayerUrl();
    if (url) {
      setTileUrl(url);
      setHasError(false);
    } else {
      setHasError(true);
    }
    setIsLoading(false);
  };

  // Invalid coordinates state
  if (!hasValidCoordinates) {
    return (
      <div className="relative w-full h-full min-h-[400px] bg-[#0d1117] flex items-center justify-center rounded-lg border border-gray-800">
        <div className="text-center text-gray-500">
          <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">Location data unavailable</p>
          <p className="text-sm mt-2">Invalid or missing coordinates</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-full min-h-[400px] bg-[#0d1117] flex items-center justify-center rounded-lg border border-gray-800">
        <div className="text-center text-gray-400">
          <Loader2 size={48} className="mx-auto mb-4 animate-spin" />
          <p className="text-lg">Loading satellite map...</p>
        </div>
      </div>
    );
  }


  // Error state
  if (hasError || !tileUrl) {
    return (
      <div className="relative w-full h-full min-h-[400px] bg-[#0d1117] flex items-center justify-center rounded-lg border border-gray-800">
        <div className="text-center text-gray-500">
          <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">Unable to load satellite map</p>
          <p className="text-sm mt-2 mb-4">Please check your Mapbox configuration</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[400px] bg-[#0d1117] rounded-lg border border-gray-800 overflow-hidden ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none border-none min-h-screen' : ''
      }`}
    >
      {/* Full-screen toggle button - Touch-friendly with min 44px target */}
      <button
        onClick={toggleFullScreen}
        className="absolute top-2 sm:top-4 right-2 sm:right-4 z-[1000] p-3 sm:p-2 bg-black/70 hover:bg-black/90 active:bg-black text-white rounded-lg transition-colors backdrop-blur min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
        title={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
      >
        {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>

      {/* Leaflet Map */}
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        minZoom={SATELLITE_CONFIG.minZoom}
        maxZoom={SATELLITE_CONFIG.maxZoom}
        zoomControl={false}
        className="w-full h-full"
        style={{ minHeight: isFullScreen ? '100vh' : '400px', height: '100%' }}
        ref={mapRef}
        whenReady={(mapInstance) => {
          mapRef.current = mapInstance.target;
          mapInstance.target.on('zoomend', handleZoomEnd);
        }}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
          tileSize={512}
          zoomOffset={-1}
        />
        <ZoomControl position="bottomright" />
        <MapCenterUpdater latitude={latitude} longitude={longitude} />
      </MapContainer>

      {/* Coordinates display - Responsive positioning and sizing */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-[1000] bg-black/70 backdrop-blur text-[10px] sm:text-xs text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
        <span className="text-gray-400">Lat:</span> {latitude.toFixed(4)}{' '}
        <span className="text-gray-400 ml-1 sm:ml-2">Lng:</span> {longitude.toFixed(4)}
      </div>

      {/* Date indicator (if historical date is provided) - Responsive positioning */}
      {date && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-[1000] bg-black/70 backdrop-blur text-[10px] sm:text-xs text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
          <span className="text-gray-400">Date:</span> {date.toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default SatelliteMapView;
