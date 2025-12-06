import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, AlertCircle, RefreshCw, MapPin, Building2, Calendar, DollarSign, Info } from 'lucide-react';
import SatelliteMapView from '../components/Satellite/SatelliteMapView';
import TimelineControl from '../components/Satellite/TimelineControl';

const API_BASE_URL = 'http://127.0.0.1:5000';

const SatelliteEvidence = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateNotification, setDateNotification] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Project not found');
          }
          throw new Error(`Failed to load project: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Parse coordinates safely
        const lat = data.latitude ? parseFloat(data.latitude) : null;
        const lng = data.longitude ? parseFloat(data.longitude) : null;
        
        // Check if coordinates are valid
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          throw new Error('This project does not have valid location coordinates');
        }
        
        // Normalize project data
        setProject({
          id: data.id,
          name: data.project_description || data.name || `Project ${projectId}`,
          contractor: data.contractor || 'Unknown Contractor',
          latitude: lat,
          longitude: lng,
          budget: data.contract_cost || data.budget,
          startDate: data.start_date,
          endDate: data.completion_date || data.end_date,
          status: data.status,
          risk: data.risk,
          score: data.score,
          riskDescription: data.risk_description,
          region: data.region,
          province: data.province,
          municipality: data.municipality,
        });
      } catch (err) {
        console.error('Error fetching project:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    // Re-trigger fetch by updating a dependency
    window.location.reload();
  };

  // Handle date change from timeline control
  const handleDateChange = useCallback((newDate) => {
    setSelectedDate(newDate);
    setDateNotification(null);
    
    // Simulate checking for available imagery
    // In a real implementation, this would check against actual available dates
    // For now, we'll show a notification for dates more than 2 years ago
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    if (newDate < twoYearsAgo) {
      // Find nearest available date (simulated as 2 years ago)
      const nearestDate = new Date(twoYearsAgo);
      setDateNotification({
        type: 'warning',
        message: `Historical imagery unavailable for ${newDate.toLocaleDateString()}. Showing nearest available: ${nearestDate.toLocaleDateString()}`,
        actualDate: nearestDate,
      });
    }
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback(() => {
    setDateNotification(null);
  }, []);

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    const numVal = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
    if (isNaN(numVal)) return 'N/A';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(numVal);
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    try {
      // Handle MM/DD/YYYY format (e.g., "02/15/2024")
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return new Date(parts[2], parts[0] - 1, parts[1]);
        }
      }
      return new Date(dateStr);
    } catch {
      return new Date();
    }
  };

  const formatDateStr = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = parseDate(dateStr);
      if (!date || isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111111] text-gray-300 font-sans flex flex-col">
        <Header onBack={handleBack} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader className="animate-spin text-red-500" size={48} />
          <p className="text-gray-400">Loading satellite evidence...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#111111] text-gray-300 font-sans flex flex-col">
        <Header onBack={handleBack} />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={64} />
            <h2 className="text-xl font-bold text-white mb-2">Unable to Load Project</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} /> Retry
              </button>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-gray-300 font-sans flex flex-col">
      <Header onBack={handleBack} />
      
      {/* Project Header Section - Single column on mobile (Requirements 5.1) */}
      <div className="bg-[#161616] border-b border-gray-800 px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-wide uppercase mb-2 line-clamp-2">
            {project.name}
          </h1>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-gray-500 shrink-0 sm:w-4 sm:h-4" />
              <span className="truncate">{project.contractor}</span>
            </div>
            {(project.municipality || project.province || project.region) && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-500 shrink-0 sm:w-4 sm:h-4" />
                <span className="truncate">
                  {[project.municipality, project.province, project.region]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
            {project.budget && (
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-gray-500 shrink-0 sm:w-4 sm:h-4" />
                <span>{formatCurrency(project.budget)}</span>
              </div>
            )}
            {project.startDate && (
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-500 shrink-0 sm:w-4 sm:h-4" />
                <span>Started: {formatDateStr(project.startDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Notification Banner */}
      {dateNotification && (
        <div className="bg-yellow-900/30 border-b border-yellow-700/50 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Info size={18} className="text-yellow-500 shrink-0" />
              <p className="text-sm text-yellow-200">{dateNotification.message}</p>
            </div>
            <button
              onClick={dismissNotification}
              className="text-yellow-500 hover:text-yellow-400 text-sm font-medium shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area - Single column layout on mobile (Requirements 5.1) */}
      <div className="flex-1 flex flex-col bg-[#0d1117]">
        {/* Satellite Map View - Responsive height for mobile */}
        <div className="flex-1 min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
          <SatelliteMapView
            latitude={project.latitude}
            longitude={project.longitude}
            date={dateNotification?.actualDate || selectedDate}
          />
        </div>

        {/* Timeline Control - Enhanced padding for touch on mobile (Requirements 5.2) */}
        <div className="p-3 sm:p-4 md:p-6 lg:px-8 bg-[#0d1117] border-t border-gray-800">
          <div className="max-w-7xl mx-auto">
            <TimelineControl
              startDate={project.startDate ? parseDate(project.startDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
              endDate={new Date()}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Header component with back navigation
const Header = ({ onBack }) => (
  <nav className="border-b border-gray-800 bg-[#161616] z-50 shrink-0">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Back Button + Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-800"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className="bg-red-900/20 p-2 rounded-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-500">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-widest text-red-500">HYDRA</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="hidden md:block">
          <span className="text-gray-400 text-sm font-medium">Satellite Evidence</span>
        </div>
      </div>
    </div>
  </nav>
);

export default SatelliteEvidence;
