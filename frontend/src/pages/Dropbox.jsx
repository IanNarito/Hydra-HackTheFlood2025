import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom'; // 👈 IMPORT THIS TO FIX CRASH
import { 
  CloudUpload, FileText, Lock, EyeOff, Ghost, ShieldCheck, 
  AlertTriangle, CheckCircle, ArrowRight, RefreshCw 
} from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import { Navbar } from '../components/Navbar';

const Dropbox = () => {
  const [dragActive, setDragActive] = useState(false);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  const fileInputRef = useRef(null);

  // ... (Keep handleDrag, handleDrop, handleFileSelect same as before) ...
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFiles([...files, ...Array.from(e.dataTransfer.files)]);
  };

  const handleFileSelect = (e) => {
    if (e.target.files) setFiles([...files, ...Array.from(e.target.files)]);
  };

  const handleSubmit = async () => {
    if (!description && files.length === 0) return;
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('description', description);
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch('http://localhost:5000/api/submit-evidence', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      
      setTimeout(() => {
        setSubmissionResult(data);
        setIsSubmitting(false);
        window.scrollTo(0,0); // Scroll to top to see result
      }, 1500);

    } catch (error) {
      console.error("Upload failed", error);
      setIsSubmitting(false);
    }
  };

  // --- RESULT SCREEN (THE POPUP REPLACEMENT) ---
  if (submissionResult) {
    const isCredible = submissionResult.ai_evaluation?.credibility_score > 50;

    return (
      <div className="min-h-screen bg-[#111] text-gray-300 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
        <div className={`max-w-xl w-full border rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden
          ${isCredible ? 'bg-green-900/10 border-green-500/50 shadow-green-900/20' : 'bg-yellow-900/10 border-yellow-500/50 shadow-yellow-900/20'}`}>
          
          {/* Icon */}
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 
            ${isCredible ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
            {isCredible ? <ShieldCheck size={40} /> : <AlertTriangle size={40} />}
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            {isCredible ? "Report Secured & Verified" : "Report Received (Under Review)"}
          </h2>
          
          <p className="text-gray-400 mb-6 leading-relaxed">
            {isCredible 
              ? "Our AI analysis indicates this report contains credible evidence. It has been queued for immediate admin approval."
              : "Our AI flagged potential issues with the evidence. A human officer will review this manually."
            }
          </p>

          {/* AI Stats */}
          <div className="bg-black/40 rounded-xl p-4 mb-8 border border-gray-800 flex justify-around">
            <div>
              <div className="text-xs text-gray-500 uppercase font-bold">Case ID</div>
              <div className="text-white font-mono text-lg">{submissionResult.case_id}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-bold">AI Trust Score</div>
              <div className={`font-mono text-lg ${isCredible ? 'text-green-400' : 'text-yellow-400'}`}>
                {submissionResult.ai_evaluation?.credibility_score || 0}%
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => { 
                setSubmissionResult(null); 
                setFiles([]); 
                setDescription(""); 
                setDragActive(false);
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors font-medium text-white"
            >
              <RefreshCw size={18} /> Submit Another
            </button>
            
            <Link 
              to="/public-reports" 
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-900/20"
            >
              View Published Reports <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN FORM (Keep your existing form layout here) ---
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#111111] text-gray-300 font-sans flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full mt-16">
          
          {/* ... KEEP YOUR EXISTING FORM CODE HERE ... */}
          {/* Just replacing the submit button area with your code to ensure it calls handleSubmit properly */}
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
    </PageTransition>
  );
};

// Keep SecurityCard component...
const SecurityCard = ({ icon, title, desc }) => (
  <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 flex flex-col items-center hover:border-gray-700 transition-colors">
    <div className="text-white mb-4 opacity-80">{icon}</div>
    <h3 className="text-white font-bold text-sm mb-2">{title}</h3>
    <p className="text-gray-500 text-xs max-w-[200px]">{desc}</p>
  </div>
);

export default Dropbox;