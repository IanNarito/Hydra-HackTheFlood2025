import React, { useState } from 'react';
import { LayoutDashboard, Map, FolderOpen, AlertCircle, ShieldAlert, Activity, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

// Generate chart data outside component to avoid impure function calls during render
const generateChartData = () => 
  [...Array(12)].map(() => ({
    bar1: Math.random() * 60 + 20,
    bar2: Math.random() * 60 + 20,
    bar3: Math.random() * 60 + 20,
  }));

const chartData = generateChartData();

const Dashboard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#111111] text-gray-300 font-sans selection:bg-red-900 selection:text-white">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800 bg-[#161616] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-red-900/20 p-2 rounded-lg">
                {/* Abstract Hydra Logo Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-500">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-widest text-red-500">HYDRA</span>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link to="/" className="text-white px-3 py-2 rounded-md text-sm font-medium border-b-2 border-red-500">Overview</Link>
                <Link to="/map" className="text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">Investigator map</Link>
                <Link to="/dropbox" className="text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">Dropbox</Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#161616] border-b border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="text-white block px-3 py-2 rounded-md text-base font-medium bg-gray-900">Overview</Link>
              <Link to="/map" className="text-gray-400 block px-3 py-2 rounded-md text-base font-medium hover:text-white hover:bg-gray-800">Investigator map</Link>
              <a href="#" className="text-gray-400 block px-3 py-2 rounded-md text-base font-medium hover:text-white hover:bg-gray-800">Dropbox</a>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Real-time monitoring of government infrastructure projects across the Philippines</p>
        </div>

        {/* Top Grid: Triage + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          
          {/* Triage Legend (Wider on desktop) */}
          <div className="lg:col-span-6 bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50 shadow-lg">
            <h3 className="text-gray-200 font-semibold mb-4 text-sm uppercase tracking-wider">Triage Legend</h3>
            <div className="space-y-4">
              <TriageItem color="bg-red-600" title="Critical" desc="High-risk projects requiring immediate investigation" />
              <TriageItem color="bg-yellow-600" title="High" desc="Elevated risk indicators detected" />
              <TriageItem color="bg-emerald-600" title="Low" desc="Minimal risk, within status" />
              <TriageItem color="bg-gray-600" title="Indeterminate" desc="Insufficient data for assessment" />
            </div>
          </div>

          {/* Stat Cards */}
          <div className="lg:col-span-3 bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50 flex flex-col justify-center shadow-lg">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Actively Monitored Projects</h3>
            <div className="text-4xl font-bold text-white mb-1">1,874</div>
            <div className="text-sm text-gray-500">Projects</div>
          </div>

          <div className="lg:col-span-3 bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50 flex flex-col justify-center shadow-lg">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Budget Under Scrutiny</h3>
            <div className="text-4xl font-bold text-white mb-1">₱ 98.4 B</div>
            <div className="text-sm text-gray-500">Philippine Peso</div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-200 font-semibold">Risk Distribution Over Time</h3>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span>2023</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500"></span>2024</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal-500"></span>2025</div>
            </div>
          </div>
          {/* Mock Chart Component */}
          <div className="h-64 w-full flex items-end justify-between gap-2 px-2">
            {chartData.map((data, i) => (
              <div key={i} className="h-full flex gap-1 items-end flex-1 justify-center group">
                <div className="w-2 md:w-4 bg-indigo-500/80 rounded-t-sm hover:bg-indigo-400 transition-all" style={{ height: `${data.bar1}%` }}></div>
                <div className="w-2 md:w-4 bg-rose-500/80 rounded-t-sm hover:bg-rose-400 transition-all" style={{ height: `${data.bar2}%` }}></div>
                <div className="w-2 md:w-4 bg-teal-500/80 rounded-t-sm hover:bg-teal-400 transition-all" style={{ height: `${data.bar3}%` }}></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-600 px-4">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>
        </div>

        {/* Bottom Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Contractors */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800/50 shadow-lg flex flex-col h-[500px]">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-white font-semibold text-lg">Top contractors</h3>
              <p className="text-sm text-gray-500">Contractors with the most awarded projects</p>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center justify-between bg-[#222] p-4 rounded-lg hover:bg-[#2a2a2a] transition-colors group cursor-pointer border border-transparent hover:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center text-xs font-bold font-mono">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-200">Megabuild Corp.</div>
                      <div className="text-xs text-gray-500">45 projects awarded</div>
                    </div>
                  </div>
                  <div className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded font-mono">
                    45
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Red-Flagged Projects */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800/50 shadow-lg flex flex-col h-[500px]">
             <div className="p-6 border-b border-gray-800">
              <h3 className="text-white font-semibold text-lg">Top Red-Flagged Projects</h3>
              <p className="text-sm text-gray-500">Projects with the highest risk scores</p>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
              {projectsData.map((project, i) => (
                <div key={i} className="bg-[#222] p-4 rounded-lg hover:bg-[#2a2a2a] transition-colors border border-transparent hover:border-red-900/30 group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-semibold text-gray-200 max-w-[70%] leading-tight">{project.name}</h4>
                    <span className="bg-red-900/30 text-red-400 border border-red-900/50 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide">
                      Critical
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-gray-500">
                      <div>{project.contractor}</div>
                      <div className="mt-1">Risk Score: <span className="text-gray-300">{project.score}</span></div>
                    </div>
                    {/* Visual Risk Bar */}
                    <div className="flex gap-1">
                       <div className="w-1 h-3 bg-red-600 rounded-sm"></div>
                       <div className="w-1 h-3 bg-red-600 rounded-sm"></div>
                       <div className="w-1 h-3 bg-red-600 rounded-sm"></div>
                       <div className="w-1 h-3 bg-red-900/40 rounded-sm"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* CSS for custom scrollbar within the component for self-containment */}
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

// Helper Component for Triage Legend Items
const TriageItem = ({ color, title, desc }) => (
  <div className="flex items-start gap-3">
    <div className={`w-4 h-4 rounded-sm mt-1 shrink-0 ${color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
    <div>
      <div className="text-sm font-medium text-gray-200">{title}</div>
      <div className="text-xs text-gray-500">{desc}</div>
    </div>
  </div>
);

// Data for Red-Flagged Projects
const projectsData = [
  { name: "Cebu Coastal Road Expansion Phase III", contractor: "Megabuild Corp.", score: 92 },
  { name: "Manila Water Treatment Plant Upgrades", contractor: "Megabuild Corp.", score: 92 },
  { name: "Region V Public Market Reconstruction Fund", contractor: "Megabuild Corp.", score: 92 },
  { name: "Bicol Airport Perimeter Wall Project", contractor: "Megabuild Corp.", score: 92 },
  { name: "Davao IT Hub Development (Phase I)", contractor: "Megabuild Corp.", score: 90 },
  { name: "North Luzon Expressway Connector B", contractor: "BuildRight Inc.", score: 88 },
  { name: "Zamboanga Port Modernization", contractor: "Megabuild Corp.", score: 87 },
  { name: "Quezon City Flood Control System", contractor: "Urban Planners Co.", score: 85 },
];

export default Dashboard;