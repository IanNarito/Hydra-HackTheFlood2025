import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building, MapPin, FileText, ChevronRight, Loader, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchProjects } from '../services/api.js';

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, PROJECT, CONTRACTOR, LOCATION
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects().then(data => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  // --- SEARCH ENGINE LOGIC ---
  const results = useMemo(() => {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    
    return projects.filter(p => {
      const matchProject = (p.name || "").toLowerCase().includes(lowerQuery);
      const matchContractor = (p.contractor || "").toLowerCase().includes(lowerQuery);
      const matchLocation = (
        (p.municipality || "") + " " + (p.province || "")
      ).toLowerCase().includes(lowerQuery);

      if (filterType === "PROJECT") return matchProject;
      if (filterType === "CONTRACTOR") return matchContractor;
      if (filterType === "LOCATION") return matchLocation;
      
      return matchProject || matchContractor || matchLocation;
    });
  }, [query, projects, filterType]);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans">
      
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-[#111] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-widest text-red-500">HYDRA</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">DATABASE ACCESS</span>
          </div>
          <div className="flex gap-6 text-sm font-medium">
            <Link to="/" className="hover:text-white transition-colors">Overview</Link>
            <Link to="/map" className="hover:text-white transition-colors">Map</Link>
            <Link to="/search" className="text-white border-b-2 border-red-500">Search</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        
        {/* Search Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-4">Intelligence Database</h1>
          <p className="text-gray-500">Search 10,000+ government contracts, contractors, and audits.</p>
        </div>

        {/* Search Input Area */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-red-900/20 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative flex items-center bg-[#111] border border-gray-800 rounded-2xl overflow-hidden focus-within:border-red-500/50 focus-within:ring-1 focus-within:ring-red-500/50 transition-all shadow-2xl">
            <Search className="ml-6 text-gray-500" size={24} />
            <input 
              type="text" 
              className="w-full bg-transparent border-none text-white text-lg px-4 py-6 focus:ring-0 placeholder:text-gray-600"
              placeholder="Search by Project Name, Contractor, or Location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {loading && <Loader className="mr-6 animate-spin text-red-500" />}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 justify-center">
          {["ALL", "PROJECT", "CONTRACTOR", "LOCATION"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider border transition-all ${
                filterType === type 
                  ? "bg-red-900/20 border-red-500 text-red-400" 
                  : "bg-transparent border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {query === "" ? (
            <div className="text-center py-20 opacity-30">
              <Search className="mx-auto mb-4" size={48} />
              <p>Enter a keyword to begin investigation.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-500">No records found matching "{query}"</p>
            </div>
          ) : (
            results.slice(0, 50).map((item) => (
              <Link 
                to={`/project/${item.id}`} 
                key={item.id}
                className="flex items-center justify-between bg-[#161616] border border-gray-800/50 p-4 rounded-xl hover:border-red-500/30 hover:bg-[#1a1a1a] transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    item.risk === 'Critical' ? 'bg-red-900/20 text-red-500' : 
                    item.risk === 'High' ? 'bg-yellow-900/20 text-yellow-500' : 'bg-gray-800 text-gray-400'
                  }`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-200 group-hover:text-white transition-colors">{item.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Building size={10} /> {item.contractor}</span>
                      <span className="flex items-center gap-1"><MapPin size={10} /> {item.municipality}, {item.province}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {item.risk === 'Critical' && (
                    <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded">CRITICAL</span>
                  )}
                  <ChevronRight className="text-gray-600 group-hover:text-white transition-transform group-hover:translate-x-1" size={18} />
                </div>
              </Link>
            ))
          )}
          {results.length > 50 && (
            <p className="text-center text-xs text-gray-600 mt-4">Showing top 50 matches...</p>
          )}
        </div>

      </main>
    </div>
  );
};

export default SearchPage;