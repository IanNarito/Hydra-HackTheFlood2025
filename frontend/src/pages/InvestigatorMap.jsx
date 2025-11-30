import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Filter, Globe, Menu, X, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

const InvestigatorMap = () => {
  const [activeRegion, setActiveRegion] = useState("All regions");

  // Mock Data for the Map
  const projects = [
    { id: 1, name: "Cebu Coastal Road", risk: "Critical", lat: 10.3157, lng: 123.8854, budget: "₱12.5B" },
    { id: 2, name: "Manila Metro Subway", risk: "High", lat: 14.6091, lng: 121.0223, budget: "₱45.2B" },
    { id: 3, name: "Davao River Bridge", risk: "Low", lat: 7.1907, lng: 125.4553, budget: "₱5.1B" },
    { id: 4, name: "Bicol Airport Wall", risk: "Critical", lat: 13.1391, lng: 123.7438, budget: "₱2.3B" },
    { id: 5, name: "Ilocos Solar Farm", risk: "Indeterminate", lat: 18.1960, lng: 120.5927, budget: "₱8.9B" },
  ];

  // Helper to get color based on risk
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Critical': return '#ef4444'; // Red-500
      case 'High': return '#eab308';     // Yellow-500
      case 'Low': return '#10b981';      // Emerald-500
      default: return '#6b7280';         // Gray-500
    }
  };

  return (
    <div className="h-screen bg-[#111111] text-gray-300 font-sans flex flex-col overflow-hidden">
      
      {/* --- Navigation Bar (Shared) --- */}
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
            
            {/* Desktop Nav Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link to="/" className="text-white px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-red-500">Overview</Link>
                <Link to="/map" className="text-gray-400 hover:text-white border-b-2 border-red-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">Investigator map</Link>
                <Link to="/dropbox" className="text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">Dropbox</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Main Layout: Sidebar + Map --- */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR */}
        <div className="w-80 bg-[#161616] border-r border-gray-800 flex flex-col z-20 shadow-2xl overflow-y-auto">
          
          {/* Header */}
          <div className="p-6 pb-2">
            <h1 className="text-2xl font-bold text-white">Investigator Map</h1>
            <p className="text-xs text-gray-500 mt-1">Real-time monitoring of government infrastructure projects</p>
          </div>

          <div className="p-4 space-y-6">
            
            {/* Filters Section */}
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
              <div className="mt-4 text-xs text-gray-400">
                Showing <span className="text-white font-bold">5</span> projects
              </div>
            </div>

            {/* Triage Legend (Reused) */}
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
              <h3 className="text-gray-200 font-semibold mb-3 text-sm">Triage Legend</h3>
              <div className="space-y-3">
                <LegendItem color="bg-red-600" title="Critical" desc="Immediate investigation" />
                <LegendItem color="bg-yellow-600" title="High" desc="Elevated risk detected" />
                <LegendItem color="bg-emerald-600" title="Low" desc="Minimal risk status" />
                <LegendItem color="bg-gray-600" title="Indeterminate" desc="Insufficient data" />
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
              <h3 className="text-gray-200 font-semibold mb-3 text-sm">Map Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 rounded bg-[#222]">
                  <span className="text-gray-400">Total projects</span>
                  <span className="text-white font-bold">8</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#222]">
                  <span className="text-gray-400">Critical Risk</span>
                  <span className="text-red-500 font-bold">5</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#222]">
                  <span className="text-gray-400">High Risk</span>
                  <span className="text-yellow-500 font-bold">1</span>
                </div>
                 <div className="flex justify-between p-2 rounded bg-[#222]">
                  <span className="text-gray-400">Low Risk</span>
                  <span className="text-emerald-500 font-bold">2</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* MAP AREA */}
        <div className="flex-1 bg-[#0d1117] relative z-10">
          <MapContainer 
            center={[12.8797, 121.7740]} // Center of Philippines
            zoom={6} 
            scrollWheelZoom={true} 
            className="h-full w-full outline-none"
            style={{ background: '#0d1117' }}
          >
            {/* Dark Mode Map Tiles - FREE (CartoDB Dark Matter) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
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
              >
                <Popup className="custom-popup">
                  <div className="p-1">
                    <h3 className="font-bold text-gray-800">{project.name}</h3>
                    <p className="text-xs text-gray-600">Budget: {project.budget}</p>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white mt-1 inline-block`}
                          style={{ backgroundColor: getRiskColor(project.risk) }}>
                      {project.risk}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Map Overlay Gradient (Optional aesthetic touch) */}
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#111111] to-transparent pointer-events-none z-[1000]"></div>
        </div>

      </div>
    </div>
  );
};

// Helper for Legend
const LegendItem = ({ color, title, desc }) => (
  <div className="flex items-center gap-3">
    <div className={`w-3 h-3 rounded-sm shrink-0 ${color}`} />
    <div className="leading-tight">
      <div className="text-xs font-bold text-gray-300">{title}</div>
      <div className="text-[10px] text-gray-500">{desc}</div>
    </div>
  </div>
);

export default InvestigatorMap;