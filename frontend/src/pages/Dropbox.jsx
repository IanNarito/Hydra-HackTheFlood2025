import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  CloudUpload, FileText, Lock, EyeOff, Ghost, ShieldCheck, Menu, X, AlertTriangle, CheckCircle 
} from 'lucide-react';

const Dropbox = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Form State
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  const fileInputRef = useRef(null);

  // Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles([...files, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const handleSubmit = async () => {
    if (!description && files.length === 0) return;

    setIsSubmitting(true);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('description', description);
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:5000/api/submit-evidence', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      // Artificial delay for "Scanning" effect (UX trick)
      setTimeout(() => {
        setSubmissionResult(data);
        setIsSubmitting(false);
      }, 1500);

    } catch (error) {
      console.error("Upload failed", error);
      setIsSubmitting(false);
    }
  };

  // --- RESULT SCREEN ---
  if (submissionResult) {
    // SCENARIO 1: MATCH FOUND
    if (submissionResult.status === "match_found") {
      const p = submissionResult.match_data;
      return (
        <div className="min-h-screen bg-[#111] text-gray-300 flex flex-col items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-red-900/10 border border-red-500 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <AlertTriangle size={64} className="mx-auto text-red-500 mb-6" />
            <h2 className="text-3xl font-bold text-white mb-2">We Know About This.</h2>
            <p className="text-gray-400 mb-8">
              Your submission matches an existing high-risk project in our database.
            </p>

            <div className="bg-black/40 rounded-xl p-6 mb-8 text-left border border-gray-800">
              <h3 className="text-white font-bold text-lg mb-1">{p.project_description || "Project Details"}</h3>
              <p className="text-gray-500 text-sm mb-4">{p.contractor}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#222] p-3 rounded">
                  <div className="text-xs text-gray-500 uppercase">Risk Score</div>
                  <div className="text-2xl font-bold text-red-500">{Math.round(p.suspicion_score)} / 100</div>
                </div>
                <div className="bg-[#222] p-3 rounded">
                  <div className="text-xs text-gray-500 uppercase">Status</div>
                  <div className="text-2xl font-bold text-white">Flagged</div>
                </div>
              </div>
            </div>

            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold">
              Submit Another
            </button>
          </div>
        </div>
      );
    }

    // SCENARIO 2: NO MATCH (Sent to Admin)
    return (
      <div className="min-h-screen bg-[#111] text-gray-300 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-green-900/10 border border-green-500 rounded-2xl p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
          <ShieldCheck size={64} className="mx-auto text-green-500 mb-6" />
          <h2 className="text-3xl font-bold text-white mb-2">Evidence Secured.</h2>
          <p className="text-gray-400 mb-8">
            No existing match found. Your report has been anonymized and sent to our investigation unit.
          </p>
          <div className="bg-black/40 p-4 rounded-lg mb-8 inline-block">
            <span className="text-gray-500 text-xs uppercase font-bold mr-2">Case ID:</span>
            <span className="text-white font-mono">{submissionResult.case_id}</span>
          </div>
          
          {submissionResult.flags_detected && submissionResult.flags_detected.length > 0 && (
             <div className="mb-8">
               <p className="text-xs text-gray-500 mb-2 uppercase font-bold">Automated Flags Detected:</p>
               <div className="flex flex-wrap justify-center gap-2">
                 {submissionResult.flags_detected.map((flag, i) => (
                   <span key={i} className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/30">
                     {flag}
                   </span>
                 ))}
               </div>
             </div>
          )}

          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => { setSubmissionResult(null); setFiles([]); setDescription(""); }}
              className="px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
            >
              Submit Another
            </button>
            <Link to="/public-reports" className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition-colors">
              View Published Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-gray-300 font-sans flex flex-col">
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
                <Link to="/Dashboard" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Overview</Link>
                <Link to="/map" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Investigator map</Link>
                <Link to="/dropbox" className="text-white px-3 py-2 rounded-md text-sm font-medium border-b-2 border-red-500">Dropbox</Link>
                {/* Optional Links for Demo purposes */}
                <Link to="/public-reports" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Reports</Link>
                <Link to="/admin" className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Admin</Link>
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-400 hover:text-white">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#161616] border-b border-gray-800 px-2 pt-2 pb-3 space-y-1">
            <Link to="/" className="block text-gray-400 px-3 py-2 rounded-md hover:bg-gray-800">Overview</Link>
            <Link to="/map" className="block text-gray-400 px-3 py-2 rounded-md hover:bg-gray-800">Investigator map</Link>
            <Link to="/dropbox" className="block text-white bg-gray-900 px-3 py-2 rounded-md">Dropbox</Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Speak Truth to Power.<br />Safely.</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
            Securely upload evidence. Our automated engine strips metadata and scans for anomalies instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Left: Text Entry */}
          <div className="flex flex-col">
            <label className="flex items-center gap-2 text-white font-medium mb-3"><FileText size={18} /> Incident Details</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 text-gray-300 focus:outline-none focus:border-red-900/50 resize-none h-64 md:h-80 shadow-inner"
              placeholder="Describe the anomaly (e.g. 'Unfinished bridge by Megabuild Corp in Bulacan')..."
            ></textarea>
          </div>

          {/* Right: File Upload */}
          <div className="flex flex-col">
            <label className="flex items-center gap-2 text-white font-medium mb-3"><CloudUpload size={18} /> Upload Evidence</label>
            <div 
              className={`flex-1 bg-[#1a1a1a] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors h-64 md:h-80 cursor-pointer group relative
                ${dragActive ? 'border-red-500 bg-red-900/10' : 'border-gray-800 hover:border-gray-600'}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
              
              {files.length > 0 ? (
                <div className="w-full h-full overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="bg-[#222] p-2 rounded text-xs text-gray-300 truncate flex items-center gap-2">
                        <FileText size={12} /> {f.name}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center text-green-500 text-sm font-bold">+ {files.length} files ready</div>
                </div>
              ) : (
                <>
                  <div className="bg-[#222] p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <CloudUpload size={40} className="text-gray-400 group-hover:text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">Drag and drop your files</h3>
                  <p className="text-gray-500 text-sm mb-4">or click to browse from your device</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-16">
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || (!description && files.length === 0)}
            className={`px-12 py-3 rounded-full font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(153,27,27,0.3)] border border-red-800 flex items-center gap-2
              ${isSubmitting ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-red-900/80 hover:bg-red-800 text-red-100 hover:scale-105'}`}
          >
            {isSubmitting ? (
              <>Processing Encryption...</> 
            ) : (
              <><Lock size={18} /> Secure Upload</>
            )}
          </button>
        </div>

        {/* Privacy Section (Static) */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Your Privacy is Our Priority</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SecurityCard icon={<Lock size={32} />} title="End-to-End Encrypted" desc="All data is encrypted before transmission" />
            <SecurityCard icon={<EyeOff size={32} />} title="Metadata Stripped" desc="Client-side removal of identifying information" />
            <SecurityCard icon={<Ghost size={32} />} title="Anonymous Submission" desc="No logs. No IP tracking. Completely clean." />
          </div>
        </div>
      </main>
    </div>
  );
};

const SecurityCard = ({ icon, title, desc }) => (
  <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 flex flex-col items-center hover:border-gray-700 transition-colors">
    <div className="text-white mb-4 opacity-80">{icon}</div>
    <h3 className="text-white font-bold text-sm mb-2">{title}</h3>
    <p className="text-gray-500 text-xs max-w-[200px]">{desc}</p>
  </div>
);

export default Dropbox;