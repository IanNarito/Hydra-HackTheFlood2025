import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, DollarSign, Building, AlertTriangle, Satellite, Eye } from 'lucide-react';
import { fetchProjectDetails } from '../services/api';

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectDetails(id).then(data => {
      setProject(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-500">Loading Intelligence...</div>;
  if (!project) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-gray-500">Project data restricted or not found.</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans">
      
      {/* Header / Nav */}
      <div className="border-b border-gray-800 bg-[#111] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/search" className="text-gray-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-white font-mono text-sm tracking-wide">CASE ID: {project.project_id || project.id}</span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-12">
        
        {/* Title Section */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin size={16} /> 
              <span>{project.municipality}, {project.province}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className={`text-2xl font-black ${
              project.risk === 'Critical' ? 'text-red-500' : project.risk === 'High' ? 'text-yellow-500' : 'text-green-500'
            }`}>
              {project.score ? Math.round(project.score) : 0}/100
            </div>
            <span className="text-xs uppercase font-bold text-gray-600 tracking-wider">Suspicion Score</span>
          </div>
        </div>

        {/* Risk Banner */}
        {project.risk === 'Critical' && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 mb-10 flex items-start gap-4 animate-pulse">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <div>
              <h3 className="text-red-400 font-bold uppercase tracking-wide mb-1">Critical Anomaly Detected</h3>
              <p className="text-red-200/80 text-sm leading-relaxed">
                {project.risk_description}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Satellite View */}
            <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden h-80 relative group">
              <img 
                src={project.satellite?.image_url || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1000&auto=format&fit=crop"} 
                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                alt="Satellite View"
              />
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded flex items-center gap-2">
                <Satellite size={12} /> Live Sentinel-2 Feed
              </div>
            </div>

            {/* Key Data Points */}
            <div className="grid grid-cols-2 gap-4">
              <DetailCard icon={<DollarSign/>} label="Contract Cost" value={`₱${Number(project.budget || 0).toLocaleString()}`} />
              <DetailCard icon={<Calendar/>} label="Timeline" value={`${project.start_date || '?'} — ${project.end_date || '?'}`} />
              <DetailCard icon={<Building/>} label="Contractor" value={project.contractor} fullWidth />
            </div>

          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Eye size={18} /> Investigation Status
              </h3>
              <div className="space-y-4">
                <StatusRow label="Data Source" value="DPWH API" />
                <StatusRow label="Last Verified" value="24 Hours Ago" />
                <StatusRow label="Geo-Tagging" value={project.latitude ? "Confirmed" : "Missing"} />
                <div className="pt-4 border-t border-gray-800">
                  <span className="block text-xs text-gray-500 mb-2">INTELLIGENCE FLAGS</span>
                  <div className="flex flex-wrap gap-2">
                    {project.is_flagged ? (
                      <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-900/50">SYSTEM_FLAGGED</span>
                    ) : (
                      <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-900/50">CLEAN_AUDIT</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

const DetailCard = ({ icon, label, value, fullWidth }) => (
  <div className={`bg-[#111] border border-gray-800 p-5 rounded-xl ${fullWidth ? 'col-span-2' : ''}`}>
    <div className="text-gray-500 mb-2 flex items-center gap-2 text-xs uppercase font-bold tracking-wider">
      {icon} {label}
    </div>
    <div className="text-white font-mono text-lg">{value}</div>
  </div>
);

const StatusRow = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="text-white font-medium">{value}</span>
  </div>
);

export default ProjectDetails;