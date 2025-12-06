import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Map, FolderOpen, AlertCircle, ShieldAlert, Activity, Menu, X, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
// Ensure these imports match your actual file structure
import { fetchStats, fetchProjects, getRiskConfig } from '../services/api.js';
// 1. IMPORT THE CHATBOT
import ChatBot from "../components/ChatBot";

const Dashboard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Real Data State
  const [stats, setStats] = useState({
    total_projects: 0,
    total_budget: 0,
    flagged_projects: 0,
    flagged_percentage: 0
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data on Load
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, projectsData] = await Promise.all([
          fetchStats(),
          fetchProjects()
        ]);
        
        if (statsData) setStats(statsData);
        if (projectsData) setProjects(projectsData);
        
      } catch (error) {
        console.error("Dashboard data load failed:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // --- ANALYTICS LOGIC ---

  // 2. Calculate Top Contractors (Client-side Aggregation)
  const topContractors = useMemo(() => {
    if (!projects.length) return [];
    
    const contractorCounts = {};
    
    projects.forEach(p => {
      const name = p.contractor || "Unknown Contractor";
      // Cleanup name (remove extra spaces)
      const cleanName = name.replace(/_/, ' ').trim();
      contractorCounts[cleanName] = (contractorCounts[cleanName] || 0) + 1;
    });

    // Convert to array and sort by count descending
    return Object.entries(contractorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Take Top 8
  }, [projects]);

  // 3. Filter Top Red-Flagged Projects
  const topRedFlags = useMemo(() => {
    if (!projects.length) return [];
    
    return projects
      // Filter for High or Critical risk
      .filter(p => p.score >= 60 || p.risk === 'Critical' || p.risk === 'High') 
      // Sort Highest score first
      .sort((a, b) => (b.score || 0) - (a.score || 0)) 
      // Take Top 8
      .slice(0, 8); 
  }, [projects]);

  // 4. Process Chart Data
  const chartData = useMemo(() => {
    if (projects.length === 0) return [];

    const yearMap = {};

    projects.forEach(p => {
      // Robust Year Extraction
      let year = 'Unknown';
      if (p.year) year = p.year;
      else if (p.start_date) {
        // Handle "2023-01-01" or "01/01/2023"
        const parts = p.start_date.split(/[-/]/);
        const y = parts.find(part => part.length === 4);
        if (y) year = y;
      }
      
      if (year === 'Unknown' || parseInt(year) < 2000) return;

      if (!yearMap[year]) {
        yearMap[year] = { year, critical: 0, high: 0, low: 0, total: 0 };
      }

      const risk = (p.risk || '').toUpperCase();
      if (risk === 'CRITICAL') yearMap[year].critical++;
      else if (risk === 'HIGH') yearMap[year].high++;
      else yearMap[year].low++;
      
      yearMap[year].total++;
    });

    const data = Object.values(yearMap).sort((a, b) => a.year - b.year);

    // Logarithmic scaling to make small bars visible
    const maxVal = Math.max(...data.map(d => Math.max(d.critical, d.high, d.low)), 1);
    const maxLog = Math.log(maxVal + 1);

    return data.map(d => ({
      ...d,
      h_crit: (Math.log(d.critical + 1) / maxLog) * 100,
      h_high: (Math.log(d.high + 1) / maxLog) * 100,
      h_low: (Math.log(d.low + 1) / maxLog) * 100,
      raw_crit: d.critical,
      raw_high: d.high,
      raw_low: d.low
    })).slice(-12);
  }, [projects]);

  // Helper for Money
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP',
      notation: "compact", 
      maximumFractionDigits: 1
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-gray-300 font-sans selection:bg-red-900 selection:text-white relative">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800 bg-[#161616] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-red-900/20 p-2 rounded-lg">
                <span className="text-xl font-bold tracking-widest text-red-500">HYDRA</span>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link to="/" className="text-white px-3 py-2 rounded-md text-sm font-medium border-b-2 border-red-500">Overview</Link>
                <Link to="/map" className="text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">Investigator map</Link>
                <Link to="/dropbox" className="text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">Dropbox</Link>
                <Link to="/public-reports" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Reports</Link>
                <Link to="/admin" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Admin</Link>
                <Link to="/search" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Search</Link>
              </div>
            </div>

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

        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#161616] border-b border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="text-white block px-3 py-2 rounded-md text-base font-medium bg-gray-900">Overview</Link>
              <Link to="/map" className="text-gray-400 block px-3 py-2 rounded-md text-base font-medium hover:text-white hover:bg-gray-800">Investigator map</Link>
              <Link to="/dropbox" className="text-gray-400 block px-3 py-2 rounded-md text-base font-medium hover:text-white hover:bg-gray-800">Dropbox</Link>
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
          
          {/* Triage Legend */}
          <div className="lg:col-span-6 bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50 shadow-lg">
            <h3 className="text-gray-200 font-semibold mb-4 text-sm uppercase tracking-wider">Triage Legend</h3>
            <div className="space-y-4">
              <TriageItem color="bg-red-600" title="Critical" desc="Score 80-100: Immediate investigation required" />
              <TriageItem color="bg-yellow-600" title="High" desc="Score 60-79: Elevated risk indicators detected" />
              <TriageItem color="bg-emerald-600" title="Low" desc="Score <60: Minimal risk, within status" />
              <TriageItem color="bg-gray-600" title="Indeterminate" desc="Insufficient data for assessment" />
            </div>
          </div>

          {/* Stat Card 1: Total Projects */}
          <div className="lg:col-span-3 bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50 flex flex-col justify-center shadow-lg relative overflow-hidden">
            {loading && <div className="absolute inset-0 bg-black/50 z-10 animate-pulse"></div>}
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Actively Monitored Projects</h3>
            <div className="text-4xl font-bold text-white mb-1">
              {stats.total_projects > 0 ? stats.total_projects.toLocaleString() : "..."}
            </div>
            <div className="text-sm text-gray-500">Projects Scraped & Analyzed</div>
          </div>

          {/* Stat Card 2: Total Budget */}
          <div className="lg:col-span-3 bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50 flex flex-col justify-center shadow-lg relative overflow-hidden">
            {loading && <div className="absolute inset-0 bg-black/50 z-10 animate-pulse"></div>}
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Budget Under Scrutiny</h3>
            <div className="text-4xl font-bold text-white mb-1">
              {stats.total_budget > 0 ? formatMoney(stats.total_budget) : "..."}
            </div>
            <div className="text-sm text-red-400 font-bold">
              {stats.flagged_percentage}% Flagged as Anomaly
            </div>
          </div>
        </div>

        {/* Dynamic Chart Section */}
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800/50 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-200 font-semibold">Risk Distribution Over Time (By Year)</h3>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Low</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>High</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-600"></span>Critical</div>
            </div>
          </div>
          
          {/* Chart Container */}
          {loading ? (
            <div className="h-64 w-full flex items-center justify-center">
              <Loader className="animate-spin text-red-500" />
            </div>
          ) : (
            <div className="w-full">
              <div className="h-64 w-full flex items-end justify-between gap-2 px-2 border-b border-gray-800 pb-2">
                {chartData.length > 0 ? chartData.map((d, i) => (
                  <div key={i} className="h-full flex gap-1 items-end flex-1 justify-center group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-12 bg-black border border-gray-700 text-xs text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap shadow-lg">
                      <span className="font-bold text-gray-300">{d.year}</span>: <br/>
                      <span className="text-red-400">{d.raw_crit} Critical</span>, <br/>
                      <span className="text-yellow-400">{d.raw_high} High</span>, <br/>
                      <span className="text-emerald-400">{d.raw_low} Low</span>
                    </div>
                    
                    {/* Bars - Using Log Height */}
                    <div className="w-2 md:w-3 bg-emerald-500/80 rounded-t-sm hover:bg-emerald-400 transition-all" style={{ height: `${Math.max(d.h_low, 2)}%` }}></div>
                    <div className="w-2 md:w-3 bg-yellow-500/80 rounded-t-sm hover:bg-yellow-400 transition-all" style={{ height: `${Math.max(d.h_high, 2)}%` }}></div>
                    <div className="w-2 md:w-3 bg-red-600/80 rounded-t-sm hover:bg-red-500 transition-all" style={{ height: `${Math.max(d.h_crit, 2)}%` }}></div>
                  </div>
                )) : (
                  <div className="w-full text-center text-gray-600 self-center">No timeline data available</div>
                )}
              </div>
              
              {/* X-Axis Labels */}
              <div className="flex justify-between mt-2 text-xs text-gray-500 px-2">
                {chartData.map((d, i) => (
                  <span key={i} className="flex-1 text-center truncate">{d.year}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Contractors (Dynamic) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800/50 shadow-lg flex flex-col h-[500px]">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-white font-semibold text-lg">Top contractors</h3>
              <p className="text-sm text-gray-500">Contractors with the most awarded projects</p>
            </div>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader className="animate-spin text-red-500" />
                </div>
              ) : topContractors.length === 0 ? (
                <p className="text-gray-500 text-center mt-10">No contractor data available.</p>
              ) : (
                topContractors.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#222] p-4 rounded-lg hover:bg-[#2a2a2a] transition-colors group cursor-pointer border border-transparent hover:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center text-xs font-bold font-mono">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-200 truncate max-w-[200px]">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.count} projects awarded</div>
                      </div>
                    </div>
                    <div className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded font-mono">
                      {c.count}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Red-Flagged Projects (Dynamic) */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800/50 shadow-lg flex flex-col h-[500px]">
             <div className="p-6 border-b border-gray-800">
              <h3 className="text-white font-semibold text-lg">Top Red-Flagged Projects</h3>
              <p className="text-sm text-gray-500">Projects with the highest risk scores</p>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader className="animate-spin text-red-500" />
                </div>
              ) : topRedFlags.length === 0 ? (
                <p className="text-gray-500 text-center mt-10">No critical projects found.</p>
              ) : (
                topRedFlags.map((project, i) => (
                  <div key={i} className="bg-[#222] p-4 rounded-lg hover:bg-[#2a2a2a] transition-colors border border-transparent hover:border-red-900/30 group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-semibold text-gray-200 max-w-[70%] leading-tight truncate">{project.name}</h4>
                      <span className="bg-red-900/30 text-red-400 border border-red-900/50 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide">
                        {Math.round(project.score)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-xs text-gray-500">
                        <div className="truncate max-w-[200px]">{project.contractor}</div>
                        <div className="mt-1">Risk Level: <span className="text-red-400 font-bold">{project.risk}</span></div>
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
                ))
              )}
            </div>
          </div>

        </div>

      </main>

      {/* 2. CHATBOT IS PLACED HERE */}
      <ChatBot />

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

export default Dashboard;