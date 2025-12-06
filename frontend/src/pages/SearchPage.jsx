import { useState, useEffect } from 'react';
import { Search, Building, MapPin, FileText, ChevronRight, Loader, AlertTriangle, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProjectModal from '../components/Dashboard/ProjectModal';

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // <--- DEFAULT IS NOW 'ALL'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  // 1. Reset everything when Query or Filter changes
  useEffect(() => {
    setResults([]); 
    setOffset(0);   
    setHasMore(true);
    
    const timer = setTimeout(() => {
      loadData(0, true); 
    }, 500);

    return () => clearTimeout(timer);
  }, [query, filterType]);

  // 2. Data Fetcher
  const loadData = async (currentOffset, isNewSearch) => {
    setLoading(true);
    try {
      const url = `http://127.0.0.1:5000/api/search?q=${encodeURIComponent(query)}&type=${filterType}&offset=${currentOffset}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.length < 50) setHasMore(false);

      if (isNewSearch) {
        setResults(data);
      } else {
        setResults(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Load More
  const handleLoadMore = () => {
    const newOffset = offset + 50;
    setOffset(newOffset);
    loadData(newOffset, false);
  };

  // Helper for Dynamic Placeholder Text
  const getPlaceholder = () => {
    if (filterType === 'PROJECT') return "Search specific Project Names...";
    if (filterType === 'CONTRACTOR') return "Search specific Contractors...";
    return "Search Everything (Projects, Contractors, Locations)..."; // Default
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans pb-20">
      
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-[#111] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-widest text-red-500">HYDRA</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">DATABASE ACCESS</span>
          </div>
          <div className="flex gap-6 text-sm font-medium">
            <Link to="/Dashboard" className="hover:text-white transition-colors">Overview</Link>
            <Link to="/map" className="hover:text-white transition-colors">Map</Link>
            <Link to="/search" className="text-white border-b-2 border-red-500">Search</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-4">Intelligence Database</h1>
          <p className="text-gray-500">
            {query 
              ? `Searching ${filterType === 'ALL' ? 'entire database' : filterType.toLowerCase() + 's'} for "${query}"` 
              : "Browsing Full Database"
            }
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-red-900/20 blur-xl rounded-full opacity-0 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative flex items-center bg-[#111] border border-gray-800 rounded-2xl overflow-hidden focus-within:border-red-500/50 focus-within:ring-1 focus-within:ring-red-500/50 transition-all shadow-2xl">
            <Search className="ml-6 text-gray-500" size={24} />
            <input 
              type="text" 
              className="w-full bg-transparent border-none text-white text-lg px-4 py-6 focus:ring-0 placeholder:text-gray-600 outline-none"
              placeholder={getPlaceholder()}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {loading && <Loader className="mr-6 animate-spin text-red-500" />}
          </div>
        </div>

        {/* 3 BUTTON FILTER (ALL IS DEFAULT) */}
        <div className="flex gap-4 mb-8 justify-center">
          {["ALL", "PROJECT", "CONTRACTOR"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-2 rounded-full text-xs font-bold tracking-wider border transition-all ${
                filterType === type 
                  ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-900/50" 
                  : "bg-transparent border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              {type === 'ALL' ? 'SEARCH ALL' : type}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-3">
          {results.map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelectedProject(item)}
              className="flex items-center justify-between bg-[#161616] border border-gray-800/50 p-4 rounded-xl hover:border-gray-600 hover:bg-[#1a1a1a] transition-all group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  (item.risk || '').includes('CRITICAL') ? 'bg-red-900/20 text-red-500' : 
                  (item.risk || '').includes('HIGH') ? 'bg-yellow-900/20 text-yellow-500' : 'bg-green-900/20 text-green-500'
                }`}>
                  {/* Dynamic Icon based on what matched or just FileText for generic */}
                  {filterType === 'CONTRACTOR' ? <Building size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-200 group-hover:text-white transition-colors">{item.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building size={10} /> 
                      <span className={filterType === 'CONTRACTOR' ? "text-white font-semibold" : ""}>
                        {item.contractor || "Unknown Contractor"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1"><MapPin size={10} /> {item.municipality}, {item.province}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {(item.risk || '').includes('CRITICAL') && (
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded shadow-lg shadow-red-900/50">
                    <AlertTriangle size={10} /> CRITICAL
                  </span>
                )}
                {(item.risk || '').includes('HIGH') && (
                  <span className="text-[10px] font-bold bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 px-2 py-1 rounded">
                    HIGH
                  </span>
                )}
                {(item.risk || '').includes('LOW') && (
                  <span className="text-[10px] font-bold bg-green-900/20 text-green-500 border border-green-900/50 px-2 py-1 rounded">
                    LOW
                  </span>
                )}
                <ChevronRight className="text-gray-600 group-hover:text-white transition-transform group-hover:translate-x-1" size={18} />
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && results.length > 0 && (
            <div className="pt-8 text-center">
              <button 
                onClick={handleLoadMore}
                disabled={loading}
                className="flex items-center gap-2 mx-auto px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-full font-bold transition-all disabled:opacity-50"
              >
                {loading ? <Loader className="animate-spin" size={16} /> : <ArrowDown size={16} />}
                Load More Records
              </button>
              <p className="text-xs text-gray-600 mt-2">Showing {results.length} records</p>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-500">No records found.</p>
            </div>
          )}
        </div>

      </main>

      {/* Project Modal */}
      {selectedProject && (
        <ProjectModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </div>
  );
};

export default SearchPage;