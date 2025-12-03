import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, FileText, Loader, ArrowRight, Trash2, Users, Database, LogOut, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // AUTH CHECK
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) navigate('/admin/login');
    else fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/reports');
      const data = await res.json();
      setReports(data.reports || []);
      setStats(data.stats || {});
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePublish = async (id) => {
    await fetch(`http://localhost:5000/api/admin/publish/${id}`, { method: 'POST' });
    fetchData(); // Refresh to update counts
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this report?")) return;
    await fetch(`http://localhost:5000/api/admin/delete/${id}`, { method: 'POST' });
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#111] border-r border-gray-800 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-red-500" /> HYDRA <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">ADMIN</span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 px-2">Investigation</div>
          <button className="w-full text-left px-4 py-2 bg-red-900/10 text-red-400 border-l-2 border-red-500 font-medium flex items-center gap-3">
            <FileText size={18} /> Inbox ({reports.length})
          </button>
          <Link to="/public-reports" className="w-full text-left px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded flex items-center gap-3">
            <CheckCircle size={18} /> Published
          </Link>
          
          <div className="mt-8 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 px-2">Intelligence</div>
          <div className="w-full text-left px-4 py-2 text-gray-400 flex items-center gap-3 cursor-not-allowed opacity-50">
            <Users size={18} /> Blacklist ({stats.blacklist_count || 0})
          </div>
          <div className="w-full text-left px-4 py-2 text-gray-400 flex items-center gap-3 cursor-not-allowed opacity-50">
            <Database size={18} /> Database
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-gray-500 hover:text-white px-4 py-2 hover:bg-gray-800 rounded transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-64 flex-1 p-8">
        
        {/* HEADER STATS */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Pending Review" value={stats.pending || 0} color="text-yellow-500" />
          <StatCard label="Published Reports" value={stats.published || 0} color="text-green-500" />
          <StatCard label="Total Submissions" value={stats.total || 0} color="text-white" />
          <StatCard label="System Status" value="ONLINE" color="text-blue-500" />
        </div>

        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-2xl font-bold text-white">Investigation Queue</h2>
          <div className="text-sm text-gray-500">Auto-refreshing...</div>
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader className="animate-spin mx-auto text-red-500" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-[#111] rounded-xl border border-gray-800 opacity-50">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <h2 className="text-xl text-white font-bold">Queue Empty</h2>
            <p className="text-gray-500">Good news! No new reports to investigate.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reports.map(report => (
              <div key={report.id} className="bg-[#111] border border-gray-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start gap-6 hover:border-gray-600 transition-all shadow-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded font-mono border border-gray-700">CASE: {report.case_id}</span>
                    <span className="text-xs text-gray-500">{new Date(report.timestamp).toLocaleString()}</span>
                  </div>
                  
                  <p className="text-gray-200 text-lg mb-4 leading-relaxed font-serif pl-4 border-l-2 border-red-900/50">
                    "{report.description}"
                  </p>
                  
                  {report.ai_flags && (
                    <div className="flex gap-2 flex-wrap">
                      {JSON.parse(report.ai_flags).map((flag, i) => (
                        <span key={i} className="text-xs bg-red-900/20 text-red-400 px-2 py-1 rounded border border-red-900/40">
                          AI FLAG: {flag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Mock file display */}
                  <div className="mt-4 text-xs text-gray-600 flex items-center gap-2">
                    <FileText size={12}/> {JSON.parse(report.files || "[]").length} Files attached (Secure Vault)
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 shrink-0">
                  <button 
                    onClick={() => handlePublish(report.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                  >
                    Verify & Publish <ArrowRight size={16}/>
                  </button>
                  <button 
                    onClick={() => handleDelete(report.id)}
                    className="bg-transparent border border-gray-800 hover:bg-red-900/20 hover:text-red-500 hover:border-red-900/50 text-gray-500 px-6 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14}/> Discard
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="bg-[#111] p-4 rounded-xl border border-gray-800">
    <div className="text-gray-500 text-xs uppercase font-bold mb-1">{label}</div>
    <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
  </div>
);

export default AdminPanel;