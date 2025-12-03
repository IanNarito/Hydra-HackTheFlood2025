import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, AlertTriangle, Map, Eye, ExternalLink } from 'lucide-react';

// Custom Peso Icon to ensure it renders without library updates
const PesoIcon = ({ size = 16, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 10h12" />
    <path d="M4 14h9" />
    <path d="M7 21V4a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2H8" />
  </svg>
);

const ProjectModal = ({ project, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!project) return null;

  // --- SYNC LOGIC START ---
  const riskLabel = (project.risk || 'LOW').toUpperCase();
  
  const getRiskLabelColor = (label) => {
    switch (label) {
      case 'CRITICAL': return 'text-red-500';
      case 'HIGH': return 'text-yellow-400';
      case 'MEDIUM':
      case 'LOW': return 'text-green-400';
      default: return 'text-green-400';
    }
  };

  const riskLabelColor = getRiskLabelColor(riskLabel);

  // --- UPDATED SCORE LOGIC ---
  const rawScore = project.score;
  const numScore = parseFloat(rawScore);
  
  // We treat NaN as 0, and we allow 0 to be a valid score to display
  const scoreDisplay = !isNaN(numScore) ? numScore.toFixed(0) : "0";
      
  // Formatters
  const formatCurrency = (value) => {
      if (!value) return "N/A";
      const numVal = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g,"")) : value;
      return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(numVal);
  };
  
  const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      return new Date(dateStr).toLocaleDateString();
  };

  const getRiskDescription = () => {
    if (project.risk_description) return project.risk_description;
    switch (riskLabel) {
      case 'CRITICAL': return "IMMEDIATE INVESTIGATION. Strong, confirmed evidence of fraud.";
      case 'HIGH': return "PRIORITY INVESTIGATION. Serious red flags are present.";
      case 'MEDIUM': return "MODERATE CONCERN. Some data irregularities detected.";
      case 'LOW': return "CONTINUOUS MONITORING. No major anomalies detected.";
      default: return "Risk assessment based on available data.";
    }
  };
  
  // --- IMAGE HANDLING LOGIC ---
  const placeholderImage = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1000&auto=format&fit=crop";
  const hasSatelliteImage = !!project.satellite_image_url;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-300 ${
        isVisible
          ? 'bg-black/80 backdrop-blur-sm opacity-100'
          : 'bg-transparent opacity-0 pointer-events-none'
      }`}
    >
      {/* Modal Window */}
      <div
        className={`bg-[#111] border border-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 transform ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-start bg-[#161616]">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide uppercase">
              {project.name}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{project.contractor || "Unknown Contractor"}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Risk Assessment Box */}
          <div className={`bg-gradient-to-br border rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden ${
             riskLabel === 'CRITICAL' ? 'from-red-900/20 to-transparent border-red-900/50' :
             riskLabel === 'HIGH' ? 'from-yellow-900/20 to-transparent border-yellow-900/50' :
             'from-green-900/20 to-transparent border-green-900/50'
          }`}>
            
            <div className="flex-1 relative z-10">
              <h3 className={`font-bold mb-2 flex items-center gap-2 ${riskLabelColor}`}>
                <AlertTriangle size={16} /> Risk Assessment
              </h3>
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
                {getRiskDescription()}
              </p>
            </div>

            {/* Score Circle - NOW SHOWS EVEN FOR SCORE 0 */}
            <div className={`shrink-0 relative w-24 h-24 flex items-center justify-center rounded-full border-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] ${
                 riskLabel === 'CRITICAL' ? 'bg-red-900/20 border-red-900/30' :
                 riskLabel === 'HIGH' ? 'bg-yellow-900/20 border-yellow-900/30' :
                 'bg-green-900/20 border-green-900/30'
              }`}>
              <div className="text-center">
                <span className={`text-3xl font-black block leading-none ${riskLabelColor}`}>
                  {scoreDisplay}
                </span>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${riskLabelColor}`}>
                  SCORE
                </span>
              </div>
            </div>
          </div>

          {/* Stats Section - Updated Icon to Peso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatBox icon={<PesoIcon size={16} />} label="Budget" value={formatCurrency(project.budget)} />
            <StatBox icon={<Clock size={16} />} label="Status" value={project.status || 'Unknown'} isTag />
            <StatBox icon={<Calendar size={16} />} label="Start Date" value={formatDate(project.start_date || project.startDate)} />
            <StatBox icon={<Calendar size={16} />} label="Expected Completion" value={formatDate(project.end_date || project.endDate)} />
          </div>

          {/* Location Info */}
          {(project.region || project.province || project.municipality) && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2 uppercase font-bold tracking-wider">
                <Map size={16} /> Location
              </div>
              <div className="text-white text-sm">
                {[project.municipality, project.province, project.region].filter(Boolean).join(', ')}
              </div>
            </div>
          )}

          {/* === SATELLITE IMAGE SECTION === */}
          <div className="relative group rounded-xl overflow-hidden border border-gray-800 h-48 bg-gray-900">
            
            {/* Badge */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-xs text-white px-2 py-1 rounded flex items-center gap-2 z-10">
              {hasSatelliteImage ? (
                <>
                  <Eye size={12} className="text-green-400" /> 
                  <span className="text-green-400 font-bold">Sentinel-2 Satellite View</span>
                </>
              ) : (
                <>
                  <Map size={12} /> Project Preview
                </>
              )}
            </div>

            <img
              src={project.satellite_image_url || placeholderImage}
              alt="Project Site"
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = placeholderImage;
              }}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            />
          </div>
        </div>

        {/* === FOOTER BUTTONS === */}
        <div className="p-6 border-t border-gray-800 bg-[#161616] flex gap-4 shrink-0">
          
          {hasSatelliteImage ? (
            <a 
              href={project.satellite_image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-red-900/80 hover:bg-red-800 text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 border border-red-900 shadow-lg shadow-red-900/20 cursor-pointer no-underline"
            >
              <Eye size={16} /> View Full Evidence
            </a>
          ) : (
            <button disabled className="flex-1 bg-gray-800 text-gray-500 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 border border-gray-700 cursor-not-allowed">
              <Eye size={16} /> No Satellite Data
            </button>
          )}

          <button
            onClick={handleClose}
            className="flex-1 bg-transparent hover:bg-gray-800 text-gray-300 py-3 rounded-lg font-bold text-sm transition-all border border-gray-700"
          >
            Back to Map
          </button>
        </div>

        <div className="px-6 pb-4 bg-[#161616]">
          <p className="text-[10px] text-gray-600 border-t border-gray-800 pt-2 text-center">
            <span className="font-bold text-gray-500">Disclaimer:</span> This risk assessment is based on automated forensic analysis of publicly available government data.
          </p>
        </div>
      </div>
    </div>
  );
};

// Reusable stat box
const StatBox = ({ icon, label, value, isTag }) => (
  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 flex flex-col justify-center">
    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1 uppercase font-bold tracking-wider">
      {icon} {label}
    </div>
    {isTag ? (
      <div className="self-start mt-1">
        <span className="bg-yellow-900/30 text-yellow-500 border border-yellow-700/50 px-3 py-1 rounded-md text-sm font-bold">
          {value}
        </span>
      </div>
    ) : (
      <div className="text-white font-mono text-lg font-bold tracking-tight truncate w-full" title={value}>{value}</div>
    )}
  </div>
);

export default ProjectModal;