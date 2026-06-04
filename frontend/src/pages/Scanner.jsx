import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import TiltCard from '../components/ui/TiltCard'; 
import { Scan, Upload, Activity, AlertCircle, CheckCircle } from 'lucide-react';

const Scanner = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [organ, setOrgan] = useState("skin");

  // --- 1. HANDLE IMAGE SELECTION ---
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  // --- 2. SEND TO REAL AI BACKEND ---
  const handleScan = async () => {
    if (!selectedImage) return alert("Please select an image first.");
    setScanning(true);

    const formData = new FormData();
    formData.append('file', selectedImage);

    try {
        const response = await fetch(`http://localhost:8000/scan/${organ}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            alert("AI Error: " + data.error);
        } else {
            const isSafe = data.severity === "Normal" || data.severity === "Mild";
            
            setResult({
                condition: data.diagnosis,
                confidence: data.confidence,
                type: `${organ.toUpperCase()} Scan Analysis`,
                solution: data.details,
                severity: data.severity,
                isSafe: isSafe
            });
        }
    } catch (error) {
        console.error("Scan Error:", error);
        alert("Error: Backend is offline.");
    }
    setScanning(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 pt-24 text-white">
      <Navbar />
      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header & Selector */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            <Scan className="text-cyan-400 w-10 h-10" /> Medi-Scan AI
          </h1>
          <p className="text-slate-400">Select the specialist AI model for your scan.</p>
          
          {/* Organ Buttons (Expanded List) */}
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
             {['skin', 'lungs', 'brain', 'bones', 'abdomen', 'eyes', 'blood', 'breast', 'pathology'].map((o) => (
                <button
                    key={o}
                    onClick={() => setOrgan(o)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                        organ === o 
                        ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                    }`}
                >
                    {o}
                </button>
             ))}
          </div>
        </div>

        {/* Upload Area */}
        <TiltCard className="h-72 border-dashed border-2 border-slate-700 flex flex-col items-center justify-center bg-slate-900/30 hover:bg-slate-900/50 cursor-pointer relative overflow-hidden transition-colors group">
          <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" />
          
          {preview ? (
             <div className="relative h-full w-full flex items-center justify-center p-4">
                 <img src={preview} alt="Scan" className="max-h-full object-contain shadow-2xl rounded-lg z-10" />
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <p className="text-white font-bold bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">Click to Change Image</p>
                 </div>
             </div>
          ) : (
             <div className="text-center p-8">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Upload {organ.charAt(0).toUpperCase() + organ.slice(1)} Scan</h3>
                <p className="text-slate-400 text-sm mt-2">Supports JPG, PNG, DICOM (Converted)</p>
             </div>
          )}
        </TiltCard>

        {/* Action Button */}
        <button 
            onClick={handleScan} 
            disabled={scanning || !selectedImage}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex justify-center items-center gap-3 text-lg"
        >
            {scanning ? "Running Neural Network..." : "Analyze Scan"}
        </button>

        {/* AI Results */}
        {result && (
          <TiltCard className="border-t-4 border-t-cyan-500 bg-slate-900/80 animate-fade-in shadow-2xl">
            <div className="flex flex-col md:flex-row items-start gap-6">
               <div className={`p-4 rounded-2xl ${result.isSafe ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                   {result.isSafe ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
               </div>
               <div className="flex-1 w-full">
                  <div className="flex justify-between items-start w-full">
                     <div>
                        <h2 className="text-3xl font-bold text-white mb-1">{result.condition}</h2>
                        <div className="flex gap-3 items-center">
                            <p className="text-slate-400 text-sm uppercase tracking-widest">{result.type}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${result.isSafe ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{result.severity}</span>
                        </div>
                     </div>
                     <span className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 font-mono text-cyan-400 font-bold">
                        {result.confidence}
                     </span>
                  </div>
                  <div className="mt-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                     <h4 className="text-sm font-bold text-slate-300 mb-2">AI Recommendation:</h4>
                     <p className={`${result.isSafe ? 'text-green-400' : 'text-red-400'} font-medium`}>{result.solution}</p>
                  </div>
               </div>
            </div>
          </TiltCard>
        )}
      </div>
    </div>
  );
};

export default Scanner;