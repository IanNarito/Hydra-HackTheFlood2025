import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import InvestigatorMap from './pages/InvestigatorMap.jsx'; 
import Dropbox from './pages/Dropbox.jsx';
import { LoadingPage } from './components/LoadingPage.jsx';

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
        {/* Default route is the Dashboard */}
        <Route path="/" element={<Dashboard />} />
        
        {/* The new Map route */}
        <Route path="/map" element={<InvestigatorMap />} />

        {/* Dropbox route */}
        <Route path="/dropbox" element={<Dropbox />} />

        {/* Loading page route for testing */}
        <Route path="/loading" element={<LoadingPage />} />
      </Routes>
    </Router>
  );
}

export default App;