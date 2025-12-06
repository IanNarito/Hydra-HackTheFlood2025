import { useState, useEffect } from 'react';
import { Map, AlertCircle, Loader2 } from 'lucide-react';
import { generateStaticMapUrl, isValidCoordinates } from '../../utils/satelliteUtils';

const SatellitePreviewImage = ({
  latitude,
  longitude,
  projectName,
  zoom = 15,
  width = 600,
  height = 300,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  const hasValidCoordinates = isValidCoordinates(latitude, longitude);

  useEffect(() => {
    if (!hasValidCoordinates) {
      setIsLoading(false);
      setHasError(false);
      setImageUrl(null);
      return;
    }

    const url = generateStaticMapUrl(latitude, longitude, zoom, width, height);
    if (!url) {
      console.warn('Failed to generate map URL - check VITE_MAPBOX_ACCESS_TOKEN in .env');
      setIsLoading(false);
      setHasError(true);
      setImageUrl(null);
      return;
    }

    setImageUrl(url);
    setIsLoading(true);
    setHasError(false);
  }, [latitude, longitude, zoom, width, height, hasValidCoordinates]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!hasValidCoordinates) {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-gray-800 h-48 bg-gray-900 flex items-center justify-center">
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-xs text-white px-2 py-1 rounded flex items-center gap-2 z-10">
          <Map size={12} /> Project Preview
        </div>
        <div className="text-center text-gray-500">
          <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Location data unavailable</p>
        </div>
      </div>
    );
  }

  if (hasError && !isLoading) {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-gray-800 h-48 bg-gray-900 flex items-center justify-center">
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-xs text-white px-2 py-1 rounded flex items-center gap-2 z-10">
          <Map size={12} /> Project Preview
        </div>
        <div className="text-center text-gray-500 px-4">
          <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Unable to load satellite imagery</p>
          <p className="text-xs mt-1 opacity-70">Check Mapbox token configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-800 h-48 bg-gray-900">
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-xs text-white px-2 py-1 rounded flex items-center gap-2 z-10">
        <Map size={12} /> Project Preview
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="text-center text-gray-400">
            <Loader2 size={32} className="mx-auto mb-2 animate-spin" />
            <p className="text-sm">Loading satellite imagery...</p>
          </div>
        </div>
      )}
      
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`Satellite view of ${projectName}`}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      
      {!isLoading && !hasError && projectName && (
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur text-xs text-white px-2 py-1 rounded z-10">
          {projectName}
        </div>
      )}
    </div>
  );
};

export default SatellitePreviewImage;
