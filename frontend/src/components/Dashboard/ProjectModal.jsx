import React, { useEffect, useState } from 'react';
import { X, Calendar, DollarSign, Clock, AlertTriangle, Map, Eye } from 'lucide-react';

const ProjectModal = ({ project, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Animation trigger on mount
  useEffect(() => {
    setIsVisible(true);
    // Prevent scrolling on body when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to finish
  };

  if (!project) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-300 ${isVisible ? 'bg-black/80 backdrop-blur-sm opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`}>
      
      {/* Modal Card */}
      <div className={`bg-[#111] border border-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 transform ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-start bg-[#161616]">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide uppercase">{project.name}</h2>
            <p className="text-gray-400 text-sm mt-1">{project.contractor}</p>
          </div>
          <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Risk Card */}
          <div className="bg-gradient-to-br from-red-900/20 to-transparent border border-red-900/50 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            <div className="flex-1 relative z-10">
              <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                <AlertTriangle size={16} /> Risk Assessment
              </h3>
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
                {project.riskDescription || "HYDRA detected an extreme discrepancy between reported budget expenditures (95% drawn down) and physical completion (30% physical progress as of last satellite pass). Funds are highly suspect."}
              </p>
            </div>
            
            {/* Score Circle */}
            <div className="shrink-0 relative w-24 h-24 flex items-center justify-center bg-red-900/20 rounded-full border-4 border-red-900/30 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
              <div className="text-center">
                <span className="text-3xl font-black text-red-500 block leading-none">{project.score || 92}</span>
                <span className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Critical</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatBox icon={<DollarSign size={16} />} label="Budget" value={project.budget} />
            <StatBox icon={<Clock size={16} />} label="Status" value={project.status || "Delayed"} isTag />
            <StatBox icon={<Calendar size={16} />} label="Start Date" value={project.startDate || "Jan 15, 2023"} />
            <StatBox icon={<Calendar size={16} />} label="Expected Completion" value={project.endDate || "Jun 30, 2025"} />
          </div>

          {/* Project Preview Image */}
          <div className="relative group rounded-xl overflow-hidden border border-gray-800 h-48 bg-gray-900">
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-xs text-white px-2 py-1 rounded flex items-center gap-2 z-10">
              <Map size={12} /> Project Preview
            </div>
            {/* Placeholder Image using a generic construction URL or logic */}
            <img 
              src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1000&auto=format&fit=crop" 
              alt="Construction Site" 
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-800 bg-[#161616] flex gap-4 shrink-0">
          <button className="flex-1 bg-red-900/80 hover:bg-red-800 text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 border border-red-900 shadow-lg shadow-red-900/20">
            <Eye size={16} /> View Satellite Evidence
          </button>
          <button onClick={handleClose} className="flex-1 bg-transparent hover:bg-gray-800 text-gray-300 py-3 rounded-lg font-bold text-sm transition-all border border-gray-700">
            Back to Map
          </button>
        </div>

        {/* Disclaimer */}
        <div className="px-6 pb-4 bg-[#161616]">
          <p className="text-[10px] text-gray-600 border-t border-gray-800 pt-2 text-center">
            <span className="font-bold text-gray-500">Disclaimer:</span> This risk assessment is based on automated forensic analysis of publicly available government data. All findings are preliminary.
          </p>
        </div>

      </div>
    </div>
  );
};

// Helper Sub-component for Grid Items
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
      <div className="text-white font-mono text-lg font-bold tracking-tight">{value}</div>
    )}
  </div>
);

export default ProjectModal;