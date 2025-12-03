import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, FileText, ArrowLeft, Siren, Search, Filter, 
  ChevronRight, ShieldCheck, MapPin, Calendar 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/public-reports')
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  const filteredReports = reports.filter(r => 
    r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.case_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-red-900 selection:text-white">
      
      {/* PROFESSIONAL HEADER */}
      <nav className="border-b border-gray-800 bg-[#111] sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/Dashboard" className="text-gray-500 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="bg-red-900/20 p-1.5 rounded">
                <Siren className="text-red-500" size={20} />
              </div>
              <span className="font-bold text-white text-lg tracking-wide uppercase">
                HYDRA <span className="text-red-500">Public Watch</span>
              </span>
            </div>
          </div>
          <Link to="/dropbox" className="text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            Submit New Evidence
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* HERO SECTION */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Verified Corruption <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">
              Intelligence Reports
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            The following reports have been submitted by brave citizens, analyzed by our AI engine, and verified by our investigation unit. We bring the dark into the light.
          </p>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 sticky top-20 z-40 bg-[#050505]/95 backdrop-blur py-4 border-b border-gray-900">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search reports by keywords, location, or Case ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-all placeholder:text-gray-600"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#111] border border-gray-800 rounded-xl text-gray-400 hover:text-white hover:border-gray-600 transition-all">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>

        {/* REPORTS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-[#111] rounded-2xl border border-gray-800"></div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-800 rounded-3xl">
            <ShieldCheck className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-500">No Public Reports Yet</h3>
            <p className="text-gray-600 mt-2">Be the first to blow the whistle.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report, idx) => {
              const aiFlags = report.ai_flags ? JSON.parse(report.ai_flags) : [];
              const isRecent = new Date(report.timestamp) > new Date(Date.now() - 86400000 * 7); // New if < 7 days

              return (
                <div key={report.id} className="group bg-[#111] border border-gray-800 rounded-2xl overflow-hidden hover:border-red-900/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(153,27,27,0.1)] flex flex-col">
                  
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-800/50 bg-gradient-to-b from-[#161616] to-[#111]">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2">
                        {isRecent && (
                          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                            New
                          </span>
                        )}
                        <span className="bg-gray-800 text-gray-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-gray-700">
                          {report.case_id}
                        </span>
                      </div>
                      <ShieldCheck size={16} className="text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 group-hover:text-red-400 transition-colors">
                      {report.description.length > 60 ? report.description.substring(0, 60) + "..." : report.description}
                    </h3>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    
                    {/* Tags / Evidence */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      {aiFlags.slice(0, 3).map((flag, i) => (
                        <span key={i} className="text-[10px] bg-red-900/10 text-red-400 px-2 py-1 rounded border border-red-900/20 uppercase font-semibold">
                          {flag.replace('KEYWORD:', '').replace('TARGET MATCH:', '')}
                        </span>
                      ))}
                      {aiFlags.length > 3 && (
                        <span className="text-[10px] text-gray-500 px-1 py-1">+{aiFlags.length - 3} more</span>
                      )}
                    </div>

                    <p className="text-sm text-gray-400 mb-6 line-clamp-3 leading-relaxed flex-1">
                      {report.description}
                    </p>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800 mt-auto">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        {new Date(report.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      
                      <button className="text-xs font-bold text-white flex items-center gap-1 hover:gap-2 transition-all hover:text-red-400">
                        Read Full Dossier <ChevronRight size={12} />
                      </button>
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