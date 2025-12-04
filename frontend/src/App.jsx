import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import InvestigatorMap from './pages/InvestigatorMap.jsx'; 
import Dropbox from './pages/Dropbox.jsx';
import SatelliteEvidence from './pages/SatelliteEvidence.jsx';
import { LoadingPage } from './components/LoadingPage.jsx';
import AdminPanel from './pages/AdminPanel.jsx'; 
import PublicReports from './pages/PublicReports.jsx'; 
import AdminLogin from './pages/AdminLogin.jsx'; 

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 3 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3000);

    // Remove splash screen after fade out completes (3s + 0.8s fade)
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Show splash screen on initial load
  if (showSplash) {
    return <LoadingPage fadeOut={fadeOut} />;
  }

  return (
    <Router>
      <Routes>
        {/* Default route is the Landing Page after splash screen */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Dashboard route */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* The Map route */}
        <Route path="/map" element={<InvestigatorMap />} />

        {/* Dropbox route */}
        <Route path="/dropbox" element={<Dropbox />} />

        {/* Admin route */}
        <Route path="/admin" element={<AdminPanel />} />
        
        {/* Reports route */}
        <Route path="/public-reports" element={<PublicReports />} />

        {/* Admin Login route */}
        <Route path="/admin/login" element={<AdminLogin />} /> {/* New Route */}

        {/* Loading page route for testing */}
        <Route path="/loading" element={<LoadingPage />} />

        {/* Satellite Evidence page route */}
        <Route path="/satellite/:projectId" element={<SatelliteEvidence />} />
      </Routes>
    </Router>
  );
}

export default App;