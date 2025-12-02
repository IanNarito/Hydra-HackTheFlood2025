import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { Filter, Globe, Loader, AlertCircle, DollarSign, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import ProjectModal from '../components/Dashboard/ProjectModal';

const InvestigatorMap = () => {
  const [activeRegion, setActiveRegion] = useState("All regions");
  const [selectedProject, setSelectedProject] = useState(null);
  const [stats, setStats] = useState(null); 
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://127.0.0.1:5000';

  // DEMO CONTROLS
  // - 'severityFirst': Critical → High → Low
  // - 'alternate': interleave Critical, High, Low
  const ORDERING_STRATEGY = 'severityFirst'; // change to 'alternate' for alternating
  const AUTO_OPEN_FIRST_RISKY = false;        // open first Critical/High project modal on load

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/stats`);
        if (!response.ok) throw new Error('Stats failed');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('❌ Error loading stats:', err);
      }
    };

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/projects`);
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Server Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();

        // Normalize + map expected fields
        const normalized = data
          .map(p => ({
            id: p.id,
            name: p.name || p.project_description,
            contractor: p.contractor,
            risk: (p.max_severity || p.risk || 'LOW').toUpperCase(),      // CRITICAL/HIGH/LOW
            score: typeof p.suspicion_score === 'number'
              ? p.suspicion_score
              : parseFloat(p.suspicion_score ?? '0'),
            color: (p.color_triage || p.color || '').toUpperCase(),       // RED/YELLOW/GREEN
            lat: parseFloat(p.latitude),
            lng: parseFloat(p.longitude),
            budget: p.contract_cost ?? p.budget,
            startDate: p.start_date,
            endDate: p.completion_date || p.end_date,
            status: p.status,
            riskDescription: p.risk_description || 'Flagged by System'
          }))
          // keep only those with coordinates
          .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));

        // Group by severity
        const groups = groupBySeverity(normalized);

        // Choose ordering strategy
        let ordered;
        if (ORDERING_STRATEGY === 'alternate') {
          ordered = interleaveBySeverity(groups);
        } else {
          ordered = sortSeverityFirst(groups);
        }

        setProjects(ordered);

        // Auto-open first risky project (Critical → High) for demo
        if (AUTO_OPEN_FIRST_RISKY) {
          const firstCritical = ordered.find(p => p.risk === 'CRITICAL');
          const firstHigh = ordered.find(p => p.risk === 'HIGH');
          if (firstCritical) setSelectedProject(firstCritical);
          else if (firstHigh) setSelectedProject(firstHigh);
        }

      } catch (err) {
        console.error('❌ Error loading projects:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchProjects();
  }, []);

  // Render colors for markers/list dots
  const getRiskColor = (riskLevel) => {
    const risk = (riskLevel || '').toUpperCase();
    switch (risk) {
      case 'CRITICAL': return '#ef4444'; // Red 80-100
      case 'HIGH':     return '#eab308'; // Yellow 60-79
      case 'MEDIUM':
      case 'LOW':      return '#10b981'; // Green 0-59
      case 'UNKNOWN':
      case 'INDETERMINATE': return '#6b7280'; // Grey
      default:         return '#10b981';
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "₱0.00";
    if (value >= 1e9) return `₱${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `₱${(value / 1e6).toFixed(1)}M`;
    return `₱${Number(value).toLocaleString()}`;
  };

  // Draw low first, then high, then critical so red sits on top
  const mapRenderOrder = useMemo(() => {
    const g = groupBySeverity(projects);
    return [...g.low, ...g.high, ...g.critical];
  }, [projects]);

  return (
    <div className="h-screen bg-[#111111] text-gray-300 font-sans flex flex-col overflow-hidden">
      
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800 bg-[#161616] z-50 shrink-0">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-red-900/20 p-2 rounded-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-500">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold tracking-widest text-red-500 block leading-none">HYDRA</span>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link to="/" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Overview</Link>
                <Link to="/map" className="text-white border-b-2 border-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">Investigator map</Link>
                <Link to="/dropbox" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Dropbox</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR */}
        <div className="w-80 bg-[#161616] border-r border-gray-800 flex flex-col z-20 shadow-2xl overflow-y-auto hidden md:flex">
          <div className="p-6 pb-2">
            <h1 className="text-2xl font-bold text-white">Investigator Map</h1>
            <p className="text-xs text-gray-500 mt-1">Real-time monitoring of government infrastructure projects</p>
          </div>

          <div className="p-4 space-y-6">

            {/* Quick Stats */}
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

            {/* Filters */}
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-4 text-gray-200 font-semibold">
                <Filter size={16} /> Filters
              </div>
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Region</p>
                {["All regions", "Metro Manila (NCR)", "Central Visayas (Region VII)", "Davao Region (Region XI)"].map((region) => (
                  <button
                    key={region}
                    onClick={() => setActiveRegion(region)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                      activeRegion === region 
                        ? 'bg-red-900/20 text-red-400 border border-red-900/50' 
                        : 'bg-[#222] text-gray-400 border border-transparent hover:bg-[#2a2a2a]'
                    }`}
                  >
                    <Globe size={12} />
                    {region}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Projects List (uses ordered projects) */}
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
               <h3 className="text-gray-200 font-semibold mb-3 text-sm">
                 Projects {!loading && projects.length > 0 && `(${projects.length})`}
               </h3>
               
               {loading ? (
                 <div className="flex flex-col items-center justify-center py-8 gap-2">
                   <Loader className="animate-spin text-red-500" size={24} />
                   <p className="text-xs text-gray-500">Loading projects...</p>
                 </div>
               ) : error ? (
                 <div className="text-red-400 text-xs p-3 bg-red-900/20 rounded border border-red-900/50">
                   <div className="flex items-center gap-2 mb-2">
                     <AlertCircle size={16} />
                     <span className="font-semibold">Error loading data</span>
                   </div>
                   <p className="text-gray-400">{error}</p>
                 </div>
               ) : projects.length === 0 ? (
                 <div className="text-gray-500 text-xs p-3 bg-gray-900/20 rounded text-center">
                   No projects with coordinates found.
                 </div>
               ) : (
                 <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                   {projects.map(p => (
                     <div 
                       key={p.id} 
                       onClick={() => setSelectedProject(p)} 
                       className="flex items-center justify-between p-2 rounded hover:bg-[#222] cursor-pointer text-xs group transition-colors"
                     >
                       <span className="text-gray-400 group-hover:text-white truncate max-w-[150px]">
                         {p.name}
                       </span>
                       <span 
                         className="w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_8px]" 
                         style={{
                             backgroundColor: getRiskColor(p.risk),
                             boxShadow: `0 0 5px ${getRiskColor(p.risk)}`
                         }}
                       ></span>
                     </div>
                   ))}
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
                <p className="text-gray-400 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Retry Connection
                </button>
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

              {/* Draw Lows first, then Highs, then Critical so red is on top */}
              {mapRenderOrder.map((project) => {
                const markerColor = getRiskColor(project.risk);
                return (
                  <CircleMarker 
                    key={project.id}
                    center={[project.lat, project.lng]}
                    pathOptions={{ 
                      color: markerColor, 
                      fillColor: markerColor, 
                      fillOpacity: 0.7,
                      weight: 1
                    }}
                    radius={6}
                    eventHandlers={{
                      click: () => setSelectedProject(project),
                    }}
                  />
                );
              })}
            </MapContainer>
          )}
        </div>

        {/* Render Modal */}
        {selectedProject && (
          <ProjectModal 
            project={selectedProject} 
            onClose={() => setSelectedProject(null)} 
          />
        )}

      </div>
    </div>
  );
};

export default InvestigatorMap;

/* -----------------------
   Helper Functions
------------------------*/
function groupBySeverity(arr) {
  const out = { critical: [], high: [], low: [] };
  for (const p of arr) {
    const r = (p.risk || '').toUpperCase();
    if (r === 'CRITICAL') out.critical.push(p);
    else if (r === 'HIGH') out.high.push(p);
    else out.low.push(p); // treat MEDIUM/LOW/UNKNOWN as Low bucket for map color
  }
  // Sort each bucket by score desc (so hottest items in each group appear first)
  out.critical.sort((a,b) => (b.score ?? 0) - (a.score ?? 0));
  out.high.sort((a,b) => (b.score ?? 0) - (a.score ?? 0));
  out.low.sort((a,b) => (b.score ?? 0) - (a.score ?? 0));
  return out;
}

function sortSeverityFirst(groups) {
  return [...groups.critical, ...groups.high, ...groups.low];
}

function interleaveBySeverity(groups) {
  const c = groups.critical, h = groups.high, l = groups.low;
  const max = Math.max(c.length, h.length, l.length);
  const out = [];
  for (let i = 0; i < max; i++) {
    if (c[i]) out.push(c[i]);
    if (h[i]) out.push(h[i]);
    if (l[i]) out.push(l[i]);
  }
  return out;
}