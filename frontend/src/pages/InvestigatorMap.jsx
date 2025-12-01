import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { Filter, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import ProjectModal from '../components/Dashboard/ProjectModal'; // 1. Import Modal

const InvestigatorMap = () => {
  const [activeRegion, setActiveRegion] = useState("All regions");
  const [selectedProject, setSelectedProject] = useState(null); // 2. State for Modal

  // 3. Enhanced Mock Data (Added Contractor, Dates, Score)
  const projects = [
    { 
      id: 1, 
      name: "Cebu Coastal Road Expansion Phase III", 
      contractor: "MegaBuild Corp.",
      risk: "Critical", 
      score: 92,
      lat: 10.3157, 
      lng: 123.8854, 
      budget: "₱ 5.2 Billion",
      startDate: "Jan 15, 2023",
      endDate: "Jun 30, 2025",
      status: "Delayed",
      riskDescription: "HYDRA detected an extreme discrepancy between reported budget expenditures (95% drawn down) and physical completion (30% physical progress). Funds are highly suspect."
    },
    { 
      id: 2, 
      name: "Manila Metro Subway Station 4", 
      contractor: "Urban Transit Systems",
      risk: "High", 
      score: 78,
      lat: 14.6091, 
      lng: 121.0223, 
      budget: "₱ 45.2 Billion",
      startDate: "Mar 01, 2022",
      endDate: "Dec 15, 2026",
      status: "On Review"
    },
    { 
      id: 3, 
      name: "Davao River Bridge Retrofit", 
      contractor: "Mindanao Steel Works",
      risk: "Low", 
      score: 12,
      lat: 7.1907, 
      lng: 125.4553, 
      budget: "₱ 5.1 Billion",
      startDate: "Feb 10, 2024",
      endDate: "Oct 20, 2025",
      status: "On Track"
    },
    { 
      id: 4, 
      name: "Bicol Airport Perimeter Wall", 
      contractor: "MegaBuild Corp.",
      risk: "Critical", 
      score: 95,
      lat: 13.1391, 
      lng: 123.7438, 
      budget: "₱ 2.3 Billion",
      startDate: "Aug 05, 2021",
      endDate: "Sep 10, 2023",
      status: "Stalled"
    },
    { 
      id: 5, 
      name: "Ilocos Solar Farm Grid", 
      contractor: "Green Energy PH",
      risk: "Indeterminate", 
      score: 0,
      lat: 18.1960, 
      lng: 120.5927, 
      budget: "₱ 8.9 Billion",
      startDate: "Nov 22, 2023",
      endDate: "Unknown",
      status: "Pending Data"
    },
  ];

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Critical': return '#ef4444'; 
      case 'High': return '#eab308';     
      case 'Low': return '#10b981';      
      default: return '#6b7280';         
    }
  };

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
                <Link to="/" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-red-500">Overview</Link>
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
            
            {/* Simple Stats List */}
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
               <h3 className="text-gray-200 font-semibold mb-3 text-sm">Projects</h3>
               <div className="space-y-2">
                 {projects.map(p => (
                   <div key={p.id} onClick={() => setSelectedProject(p)} className="flex items-center justify-between p-2 rounded hover:bg-[#222] cursor-pointer text-xs group">
                     <span className="text-gray-400 group-hover:text-white truncate max-w-[150px]">{p.name}</span>
                     <span className="w-2 h-2 rounded-full" style={{backgroundColor: getRiskColor(p.risk)}}></span>
                   </div>
                 ))}
               </div>
            </div>

          </div>
        </div>

        {/* MAP AREA */}
        <div className="flex-1 bg-[#0d1117] relative z-10">
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

            {projects.map((project) => (
              <CircleMarker 
                key={project.id}
                center={[project.lat, project.lng]}
                pathOptions={{ 
                  color: getRiskColor(project.risk), 
                  fillColor: getRiskColor(project.risk), 
                  fillOpacity: 0.7 
                }}
                radius={8}
                eventHandlers={{
                  click: () => {
                    // 4. Open Modal on Click
                    setSelectedProject(project); 
                  },
                }}
              >
                {/* No Popup needed anymore, the Modal replaces it */}
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* 5. Render Modal Conditionally */}
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