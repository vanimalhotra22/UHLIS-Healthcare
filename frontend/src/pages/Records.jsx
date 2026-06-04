import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import { FileText, UploadCloud, Trash2, Download, Search, FileImage, FileBarChart, Loader2, Sparkles } from 'lucide-react';

const PATIENT_ID = 2; // Hardcoded Vani Malhotra for now

const Records = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [summarizingId, setSummarizingId] = useState(null);
  const fileInputRef = useRef(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/records/${PATIENT_ID}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.split('.')[0]); // Use filename as default title

    try {
      await fetch(`http://localhost:8000/records/${PATIENT_ID}`, {
        method: 'POST',
        body: formData,
      });
      await fetchRecords();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Is the backend running?");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm("Delete this record permanently?")) return;
    try {
      await fetch(`http://localhost:8000/records/${recordId}`, {
        method: 'DELETE',
      });
      setRecords(records.filter(r => r.id !== recordId));
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const handleSummarize = async (recordId) => {
    setSummarizingId(recordId);
    try {
      const res = await fetch(`http://localhost:8000/records/${recordId}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: PATIENT_ID })
      });
      const data = await res.json();
      
      // Update local state to show summary
      setRecords(records.map(r => r.id === recordId ? { ...r, summary: data.summary } : r));
    } catch (error) {
      console.error("Summarize failed", error);
      alert("Failed to summarize. Check backend.");
    }
    setSummarizingId(null);
  };

  const getFileIcon = (ext) => {
    const extUpper = ext?.toUpperCase() || "";
    if (['PDF'].includes(extUpper)) return <FileText className="text-red-400" size={24} />;
    if (['JPG', 'PNG', 'JPEG'].includes(extUpper)) return <FileImage className="text-blue-400" size={24} />;
    if (['CSV', 'XLSX'].includes(extUpper)) return <FileBarChart className="text-green-400" size={24} />;
    return <FileText className="text-slate-400" size={24} />;
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 pt-24 text-white font-sans">
      <Navbar />
      
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-500">
              <FileText className="text-purple-400 w-8 h-8" />
              Medical Records
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Securely store, view, and AI-summarize your medical history.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Upload Dropzone (Left Column) */}
          <div className="lg:col-span-1 space-y-4">
            <div 
              className={`bg-slate-900/50 border-2 border-dashed ${uploading ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700 hover:border-slate-500'} rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer h-64`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".pdf,.png,.jpg,.jpeg,.csv"
              />
              {uploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                  <div className="font-bold text-white">Encrypting & Uploading...</div>
                  <div className="text-xs text-slate-400 mt-2">Securing to vault</div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-slate-700 transition-colors">
                    <UploadCloud className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div className="font-bold text-white mb-2">Upload New Record</div>
                  <div className="text-xs text-slate-400">PDF, JPG, PNG or CSV (Max 10MB)</div>
                  <button className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-full transition-colors border border-slate-700">
                    Browse Files
                  </button>
                </>
              )}
            </div>

            {/* Smart Folder Stats */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">Vault Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Records</span>
                  <span className="text-white font-mono">{records.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Storage Used</span>
                  <span className="text-white font-mono">{(records.length * 1.2).toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Encryption</span>
                  <span className="text-green-400 font-mono">AES-256</span>
                </div>
              </div>
            </div>
          </div>

          {/* Records Timeline (Right Column) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between bg-slate-900/30 p-2 rounded-xl border border-slate-800 backdrop-blur-sm">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search records..." 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-3xl p-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Records Found</h3>
                <p className="text-slate-400 text-sm">Upload your first lab report or scan to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map(record => (
                  <div key={record.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex-shrink-0">
                          {getFileIcon(record.file_type)}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{record.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{record.type}</span>
                            <span className="text-xs text-slate-500">{record.date}</span>
                            <span className="text-xs text-slate-500">by {record.doctor}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {record.file_path && (
                          <a 
                            href={`http://localhost:8000/${record.file_path}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download size={16} />
                          </a>
                        )}
                        <button 
                          onClick={() => handleDelete(record.id)}
                          className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* AI Summary Section */}
                    <div className="mt-4 pt-4 border-t border-slate-800/50">
                      {record.summary ? (
                        <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-bold uppercase text-purple-400 tracking-wider">AI Summary</span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {record.summary}
                          </p>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleSummarize(record.id)}
                          disabled={summarizingId === record.id}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 hover:from-purple-600/40 hover:to-cyan-600/40 border border-purple-500/30 rounded-lg text-sm text-purple-300 font-medium transition-all"
                        >
                          {summarizingId === record.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {summarizingId === record.id ? 'Analyzing Document...' : 'Generate AI Summary'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Records;
