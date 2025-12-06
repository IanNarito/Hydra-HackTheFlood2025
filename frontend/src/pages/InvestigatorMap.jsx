import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { Filter, Globe, Loader, AlertCircle, DollarSign, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
// Ensure this matches your folder casing exactly
import ProjectModal from '../components/Dashboard/ProjectModal'; 
import { fetchProjects, fetchStats, getRiskConfig } from '../services/api.js';

const PHILIPPINE_REGIONS = [
  "All regions", "National Capital Region (NCR)", "Cordillera Administrative Region (CAR)",
  "Ilocos Region (Region I)", "Cagayan Valley (Region II)", "Central Luzon (Region III)",
  "CALABARZON (Region IV-A)", "MIMAROPA (Region IV-B)", "Bicol Region (Region V)",
  "Western Visayas (Region VI)", "Central Visayas (Region VII)", "Eastern Visayas (Region VIII)",
  "Zamboanga Peninsula (Region IX)", "Northern Mindanao (Region X)", "Davao Region (Region XI)",
  "SOCCSKSARGEN (Region XII)", "Caraga (Region XIII)", "Bangsamoro (BARMM)"
];

const REGION_DB_MAPPING = {
  "All regions": "ALL", "National Capital Region (NCR)": "National Capital Region",
  "Cordillera Administrative Region (CAR)": "Cordillera Administrative Region",
  "Ilocos Region (Region I)": "Region I", "Cagayan Valley (Region II)": "Region II",
  "Central Luzon (Region III)": "Region III", "CALABARZON (Region IV-A)": "Region IV-A",
  "MIMAROPA (Region IV-B)": "Region IV-B", "Bicol Region (Region V)": "Region V",
  "Western Visayas (Region VI)": "Region VI", "Central Visayas (Region VII)": "Region VII",
  "Eastern Visayas (Region VIII)": "Region VIII", "Zamboanga Peninsula (Region IX)": "Region IX",
  "Northern Mindanao (Region X)": "Region X", "Davao Region (Region XI)": "Region XI",
  "SOCCSKSARGEN (Region XII)": "Region XII", "Caraga (Region XIII)": "Region XIII",
  "Bangsamoro (BARMM)": "BARMM"
};

const InvestigatorMap = () => {
  const [activeRegion, setActiveRegion] = useState("All regions");
  const [selectedProject, setSelectedProject] = useState(null);
  const [stats, setStats] = useState(null); 
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsData, projectsData] = await Promise.all([
          fetchStats(),
          fetchProjects()
        ]);
        
        setStats(statsData);
        
        const validProjects = projectsData.filter(p => {
          const lat = p.latitude ?? p.lat ?? p.Latitude;
          const lng = p.longitude ?? p.lng ?? p.Longitude;
          return lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
        }).map(p => ({
          ...p,
          lat: parseFloat(p.latitude ?? p.lat ?? p.Latitude),
          lng: parseFloat(p.longitude ?? p.lng ?? p.Longitude)
        }));
        
        setProjects(validProjects);
      } catch (err) {
        console.error("Data load error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredProjects = useMemo(() => {
    if (activeRegion === "All regions") return projects;
    const targetRegion = REGION_DB_MAPPING[activeRegion];
    return projects.filter(p => p.region === targetRegion);
  }, [projects, activeRegion]);

  // --- FIX 1: UPDATED SORTING LOGIC FOR AI TAGS ---
  // The backend sends "AI CRITICAL", so strictly checking === 'CRITICAL' fails.
  // We use .includes() to catch both "CRITICAL" and "AI CRITICAL".
  const mapRenderOrder = useMemo(() => {
    const critical = [], high = [], low = [];
    filteredProjects.forEach(p => {
      const r = (p.risk || '').toUpperCase();
      
      if (r.includes('CRITICAL')) { 
        critical.push(p); // Puts AI Critical on top
      } else if (r.includes('HIGH') || r.includes('SUSPICIOUS')) {
        high.push(p);
      } else {
        low.push(p);
      }
    });
    // Render Low first (bottom), then High, then Critical (top)
    return [...low, ...high, ...critical];
  }, [filteredProjects]);

  // --- FIX 2: HELPER TO USE BACKEND COLORS ---
  // The Python backend sends 'Red', 'Green', 'Yellow'. 
  // We map these to the exact hex codes used in your design.
  const getProjectColor = (project) => {
    // 1. Priority: Use the color the Backend/AI chose
    if (project.color) {
      const c = project.color.toLowerCase();
      if (c === 'red') return '#ef4444';    // Tailwind red-500
      if (c === 'yellow') return '#eab308'; // Tailwind yellow-500
      if (c === 'green') return '#22c55e';  // Tailwind green-500
    }
    // 2. Fallback: Use the frontend utility
    return getRiskConfig(project.risk).color;
  };

  const formatCurrency = (value) => {
    if (!value) return "₱0.00";
    if (value >= 1e9) return `₱${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `₱${(value / 1e6).toFixed(1)}M`;
    return `₱${Number(value).toLocaleString()}`;
  };

  return (
    <div className="h-screen bg-[#111111] text-gray-300 font-sans flex flex-col overflow-hidden">
      
      <nav className="border-b border-gray-800 bg-[#161616] z-50 shrink-0">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-red-900/20 p-2 rounded-lg">
                <span className="text-xl font-bold tracking-widest text-red-500 block leading-none">HYDRA</span>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link to="/Dashboard" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Overview</Link>
                <Link to="/map" className="text-white border-b-2 border-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">Investigator map</Link>
                <Link to="/dropbox" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Dropbox</Link>
                <Link to="/public-reports" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Reports</Link>
                <Link to="/admin" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Admin</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-80 bg-[#161616] border-r border-gray-800 flex flex-col z-20 shadow-2xl">
          <div className="p-6 pb-2 shrink-0">
            <h1 className="text-2xl font-bold text-white">Investigator Map</h1>
            <p className="text-xs text-gray-500 mt-1">Real-time monitoring</p>
          </div>

          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-6">
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <DollarSign size={12} className="text-green-500"/> Total Budget
                    </div>
                    <div className="text-white font-bold text-sm">
                        {stats ? formatCurrency(stats.total_budget) : '...'}
                    </div>
                </div>
                <div className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <AlertTriangle size={12} className="text-red-500"/> Flagged %
                    </div>
                    <div className="text-white font-bold text-sm">
                        {stats ? `${stats.flagged_percentage}%` : '...'}
                    </div>
                </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-4 text-gray-200 font-semibold">
                <Filter size={16} /> Filter by Region
              </div>
              <div className="space-y-1">
                {PHILIPPINE_REGIONS.map((region) => (
                  <button
                    key={region}
                    onClick={() => setActiveRegion(region)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[11px] uppercase font-bold tracking-wide transition-all flex items-center gap-2 ${
                      activeRegion === region 
                        ? 'bg-red-900/20 text-red-400 border border-red-900/50 shadow-[0_0_10px_rgba(220,38,38,0.1)]' 
                        : 'bg-transparent text-gray-500 hover:bg-[#222] hover:text-gray-300 border border-transparent'
                    }`}
                  >
                    <Globe size={12} className={activeRegion === region ? "text-red-500" : "opacity-50"} />
                    {region}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-400 flex justify-between items-center">
                <span>Showing:</span>
                <span className="text-white font-bold bg-gray-800 px-2 py-1 rounded">
                  {filteredProjects.length} Projects
                </span>
              </div>
            </div>
            
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
               <h3 className="text-gray-200 font-semibold mb-3 text-sm">
                 Projects {!loading && filteredProjects.length > 0 && `(${filteredProjects.length})`}
               </h3>
               
               {loading ? (
                 <div className="flex flex-col items-center justify-center py-8 gap-2">
                   <Loader className="animate-spin text-red-500" size={24} />
                   <p className="text-xs text-gray-500">Loading projects...</p>
                 </div>
               ) : error ? (
                 <div className="text-red-400 text-xs p-3 bg-red-900/20 rounded border border-red-900/50">
                   <p className="text-gray-400">{error}</p>
                 </div>
               ) : filteredProjects.length === 0 ? (
                 <div className="text-gray-500 text-xs p-3 bg-gray-900/20 rounded text-center">
                   No projects found for this region.
                 </div>
               ) : (
                 <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                   {filteredProjects.map(p => {
                     // Use the helper to determine sidebar dot color
                     const dotColor = getProjectColor(p);
                     return (
                       <div 
                         key={p.id} 
                         onClick={() => setSelectedProject(p)} 
                         className="flex items-center justify-between p-2 rounded hover:bg-[#222] cursor-pointer text-xs group transition-colors"
                       >
                         <span className="text-gray-400 group-hover:text-white truncate max-w-[150px]">
                           {p.name}
                         </span>
                         <span 
                           className="w-2 h-2 rounded-full flex-shrink-0" 
                           style={{
                               backgroundColor: dotColor,
                               boxShadow: `0 0 5px ${dotColor}`
                           }}
                         ></span>
                       </div>
                     );
                   })}
                 </div>
               )}
            </div>

          </div>
        </div>

        {/* MAP AREA */}
        <div className="flex-1 bg-[#0d1117] relative z-10">
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4">
              <Loader className="animate-spin text-red-500" size={48} />
              <p className="text-gray-400">Loading map data...</p>
            </div>
          ) : error ? (
            <div className="h-full w-full flex items-center justify-center p-8">
              <div className="max-w-md text-center">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={64} />
                <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Retry</button>
              </div>
            </div>
          ) : (
            <MapContainer 
              center={[12.8797, 121.7740]} 
              zoom={6} 
              scrollWheelZoom={true} 
              className="h-full w-full outline-none"
              style={{ background: '#0d1117' }}
            >
              <TileLayer
                attribution='&copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {mapRenderOrder.map((project) => {
                const finalColor = getProjectColor(project); // USE HELPER
                
                if (!project.lat || !project.lng) return null;

                // --- CHECK FOR AI CRITICAL TO MAKE IT BIGGER ---
                const isCritical = (project.risk || '').toUpperCase().includes('CRITICAL');

                return (
                  <CircleMarker 
                    key={project.id}
                    center={[project.lat, project.lng]}
                    pathOptions={{ 
                      color: finalColor, 
                      fillColor: finalColor, 
                      fillOpacity: 0.7,
                      weight: 1
                    }}
                    radius={isCritical ? 8 : 5}
                    eventHandlers={{
                      click: () => setSelectedProject(project),
                    }}
                  />
                );
              })}
            </MapContainer>
          )}
          
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#111111] to-transparent pointer-events-none z-[1000]"></div>
        </div>

        {/* Render Modal */}
        {selectedProject && (
          <ProjectModal 
            project={selectedProject} 
            onClose={() => setSelectedProject(null)} 
          />
        )}

      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444; 
        }
      `}</style>
    </div>
  );
};

export default InvestigatorMap;