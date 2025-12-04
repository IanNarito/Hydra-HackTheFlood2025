import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, ArrowLeft, Siren, Search, Filter, 
  ChevronRight, ShieldCheck, MapPin, Calendar, Image as ImageIcon,
  X, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // FILTER STATES
  const [filters, setFilters] = useState({
    contractor: "",
    dateSort: "newest",
    reportTypes: [],
    fileTypes: []
  });

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/public-reports')
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  // --- HELPER: DETERMINE REPORT CATEGORY BASED ON FLAGS ---
  const getReportCategory = (flags) => {
    if (!flags) return "Whistleblowing";
    const f = flags.join(" ").toUpperCase();
    if (f.includes("GHOST")) return "Ghost Project";
    if (f.includes("SUBSTANDARD") || f.includes("CRACK")) return "Substandard Quality";
    if (f.includes("BRIBE") || f.includes("FRAUD")) return "Corruption/Bribery";
    if (f.includes("DELAY") || f.includes("ABANDONED")) return "Project Anomalies";
    return "Whistleblowing";
  };

  // --- HELPER: PARSE FILE TYPES ---
  const hasFileType = (rawTypes, targetType) => {
    if (!rawTypes) return false;
    if (targetType === 'IMAGE' && (rawTypes.includes('image/') || rawTypes.includes('jpg') || rawTypes.includes('png'))) return true;
    if (targetType === 'VIDEO' && (rawTypes.includes('mp4') || rawTypes.includes('video/'))) return true;
    if (targetType === 'DOC' && (rawTypes.includes('pdf') || rawTypes.includes('word'))) return true;
    return false;
  };

  // --- FILTERING LOGIC ---
  const filteredReports = reports.filter(r => {
    // 1. Text Search
    const searchMatch = (r.public_summary || r.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (r.case_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (r.contractor_name || "").toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Contractor Filter
    const contractorMatch = filters.contractor === "" || 
                            (r.contractor_name || "").toLowerCase().includes(filters.contractor.toLowerCase());

    // 3. Report Type Filter
    let aiFlags = [];
    try { aiFlags = r.ai_flags ? JSON.parse(r.ai_flags) : []; } catch(e) {}
    const category = getReportCategory(aiFlags);
    const typeMatch = filters.reportTypes.length === 0 || filters.reportTypes.includes(category);

    // 4. File Type Filter
    const fileMatch = filters.fileTypes.length === 0 || filters.fileTypes.some(ft => hasFileType(r.raw_file_types, ft));

    return searchMatch && contractorMatch && typeMatch && fileMatch;
  }).sort((a, b) => {
    const dateA = new Date(a.published_at || a.timestamp);
    const dateB = new Date(b.published_at || b.timestamp);
    return filters.dateSort === "newest" ? dateB - dateA : dateA - dateB;
  });

  // TOGGLE HELPERS
  const toggleFilter = (type, value) => {
    setFilters(prev => {
      const current = prev[type];
      const updated = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-red-900 selection:text-white">
      
      <nav className="border-b border-gray-800 bg-[#111] sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/Dashboard" className="text-gray-500 hover:text-white transition-colors"><ArrowLeft size={20} /></Link>
            <div className="flex items-center gap-2">
              <div className="bg-red-900/20 p-1.5 rounded"><Siren className="text-red-500" size={20} /></div>
              <span className="font-bold text-white text-lg tracking-wide uppercase">HYDRA <span className="text-red-500">Public Watch</span></span>
            </div>
          </div>
          <Link to="/dropbox" className="text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">Submit New Evidence</Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Verified Corruption <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">Intelligence Reports</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Reports submitted by citizens, analyzed by AI, and verified for public release.
          </p>
        </div>

        {/* --- SEARCH & FILTER BAR --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 sticky top-20 z-40 bg-[#050505]/95 backdrop-blur py-4 border-b border-gray-900">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search keywords, Case ID, or Contractor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-red-900 transition-all placeholder:text-gray-600"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-xl transition-all ${showFilterMenu ? 'bg-red-900/20 border-red-900 text-white' : 'bg-[#111] border-gray-800 text-gray-400 hover:text-white'}`}
            >
              <Filter size={18} /> <span>Filter</span> <ChevronDown size={14} />
            </button>

            {/* --- FILTER DROPDOWN MENU --- */}
            {showFilterMenu && (
              <div className="absolute right-0 top-14 w-80 bg-[#161616] border border-gray-800 rounded-xl shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-bold text-sm uppercase tracking-wider">Filter Options</h4>
                  <button onClick={() => setShowFilterMenu(false)}><X size={16} className="text-gray-500 hover:text-white" /></button>
                </div>

                {/* Contractor Name Input */}
                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-1 block">Contractor Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. WAWAO Builders" 
                    value={filters.contractor}
                    onChange={(e) => setFilters({...filters, contractor: e.target.value})}
                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  />
                </div>

                {/* Date Sort */}
                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-1 block">Date Published</label>
                  <select 
                    value={filters.dateSort}
                    onChange={(e) => setFilters({...filters, dateSort: e.target.value})}
                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                {/* Report Type Checkboxes */}
                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-1 block">Report Type</label>
                  <div className="space-y-2">
                    {['Ghost Project', 'Project Anomalies', 'Substandard Quality', 'Whistleblowing'].map(type => (
                      <label key={type} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={filters.reportTypes.includes(type)}
                          onChange={() => toggleFilter('reportTypes', type)}
                          className="rounded border-gray-700 bg-black text-red-600 focus:ring-red-900"
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                {/* File Type Checkboxes */}
                <div className="mb-4">
                  <label className="text-xs text-gray-500 mb-1 block">Evidence Format</label>
                  <div className="flex gap-2">
                    {['IMAGE', 'VIDEO', 'DOC'].map(type => (
                      <button
                        key={type}
                        onClick={() => toggleFilter('fileTypes', type)}
                        className={`text-xs px-3 py-1.5 rounded border transition-colors ${filters.fileTypes.includes(type) ? 'bg-red-900/30 border-red-500 text-white' : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => setFilters({contractor: "", dateSort: "newest", reportTypes: [], fileTypes: []})}
                  className="w-full py-2 text-xs text-center text-red-400 hover:text-red-300 underline"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* REPORTS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3].map(i => (<div key={i} className="h-64 bg-[#111] rounded-2xl border border-gray-800"></div>))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-3xl">
            <ShieldCheck className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-500">No Matches Found</h3>
            <p className="text-gray-600 mt-2">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => {
              let aiFlags = [];
              try { aiFlags = report.ai_flags ? JSON.parse(report.ai_flags) : []; } catch (e) {}
              const displayText = report.public_summary || report.description || "No details available.";
              const isRecent = new Date(report.published_at) > new Date(Date.now() - 86400000 * 7);
              const category = getReportCategory(aiFlags);

              return (
                <div key={report.pub_id} className="group bg-[#111] border border-gray-800 rounded-2xl overflow-hidden hover:border-red-900/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(153,27,27,0.1)] flex flex-col">
                  
                  {/* Header */}
                  <div className="p-5 border-b border-gray-800/50 bg-gradient-to-b from-[#161616] to-[#111]">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2">
                        {isRecent && <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">New</span>}
                        <span className="bg-gray-800 text-gray-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-gray-700">{report.case_id}</span>
                      </div>
                      {report.contractor_name && (
                        <span className="text-[10px] text-orange-400 border border-orange-900/30 bg-orange-900/10 px-2 py-0.5 rounded truncate max-w-[120px]">
                          {report.contractor_name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 group-hover:text-red-400 transition-colors">
                      {displayText.length > 60 ? displayText.substring(0, 60) + "..." : displayText}
                    </h3>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="text-[10px] bg-blue-900/10 text-blue-400 px-2 py-1 rounded border border-blue-900/20 uppercase font-semibold">
                        {category}
                      </span>
                      {aiFlags.slice(0, 2).map((flag, i) => (
                        <span key={i} className="text-[10px] bg-red-900/10 text-red-400 px-2 py-1 rounded border border-red-900/20 uppercase font-semibold">
                          {flag.replace('BLACKLIST MATCH:', '').replace('GHOST', '👻 GHOST')}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm text-gray-400 mb-6 line-clamp-3 leading-relaxed flex-1">{displayText}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800 mt-auto">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        {new Date(report.published_at || report.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      {report.file_count > 0 && (
                         <div className="flex items-center gap-1 text-xs text-gray-400">
                           <ImageIcon size={12} />
                           <span>{report.file_count} Files</span>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicReports;