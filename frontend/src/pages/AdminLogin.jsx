import React, { useState } from 'react';
import { Shield, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('adminToken', data.token); // Simple auth
        navigate('/admin'); // Redirect to dashboard
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Connection failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center border border-red-900/50">
            <Shield size={32} className="text-red-500" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2">HYDRA Admin</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">Restricted Access. Authorized Personnel Only.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Access Key</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-gray-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-red-500 transition-colors"
                placeholder="Enter master password"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button type="submit" className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
            Authenticate <ArrowRight size={16} />
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <a href="/" className="text-xs text-gray-600 hover:text-gray-400">Return to Public Site</a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;