import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { Activity, Moon, Zap, Heart, AlertCircle, ShoppingBag, Pill, FileText, Brain, Scan, Droplet, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import RPPGScanner from '../components/rPPGScanner';

const PATIENT_ID = 2; // Vani Malhotra's user ID in the DB

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [liveBpm, setLiveBpm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [time, setTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch dashboard summary
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`http://localhost:8000/dashboard/${PATIENT_ID}`);
        if (!res.ok) throw new Error('Backend returned error');
        const json = await res.json();
        setData(json);
        setError(false);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    
    // Poll telemetry data every 3 seconds
    const interval = setInterval(() => {
        fetchDashboard();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const toggleMedication = async (prescriptionId, taken) => {
    try {
      const res = await fetch(`http://localhost:8000/prescriptions/${PATIENT_ID}/log/${prescriptionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taken })
      });
      if (res.ok) {
        setData(prev => {
          if (!prev) return prev;
          const newPrescriptions = prev.prescriptions.map(p => 
            p.id === prescriptionId ? { ...p, taken_today: taken } : p
          );
          return { ...prev, prescriptions: newPrescriptions };
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 animate-pulse">Syncing with UHLIS Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-6 pt-24 font-sans selection:bg-cyan-500/30">
      <Navbar />

      <div className="max-w-screen-2xl mx-auto space-y-8 animate-fade-in">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 backdrop-blur-xl relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{data?.user_name || 'User'}</span>
            </h1>
            <p className="text-slate-400 flex items-center gap-2 mt-3 text-sm font-medium">
              <span className={`w-2 h-2 rounded-full ${error ? 'bg-yellow-500' : 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]'}`}></span>
              {error ? 'System Offline (Cached)' : 'Live Telemetry Active • Secured by UHLIS'}
            </p>
          </div>
          
          <div className="relative z-10 flex gap-4">
             <div className="flex flex-col items-end">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Health Score</span>
                <div className="flex items-baseline gap-1">
                   <span className="text-4xl font-black text-white">{data?.healthScore || 100}</span>
                   <span className="text-cyan-400 font-bold">/100</span>
                </div>
             </div>
          </div>
        </div>

        {/* --- 3-COLUMN COMMAND CENTER --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           
           {/* LEFT COLUMN: Overview & Quick Stats (Span 3) */}
           <div className="lg:col-span-3 space-y-6 flex flex-col">
              
              {/* rPPG Scanner Module */}
              <div className="h-48 rounded-[2rem] overflow-hidden border border-white/5 relative bg-slate-900/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                 <RPPGScanner onBpmUpdate={(bpm) => {
                    setLiveBpm(bpm);
                    // Dynamically feed into chart data
                    setData(prev => {
                       if (!prev || !prev.telemetry) return prev;
                       const hrList = [...prev.telemetry.heartRate];
                       if (hrList.length > 0) {
                           hrList.shift();
                           const nowStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                           hrList.push({ time: nowStr, bpm: bpm });
                       }
                       return { ...prev, telemetry: { ...prev.telemetry, heartRate: hrList } };
                    });
                 }} />
              </div>

              {/* Vitals Summary Card */}
              <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 rounded-[2rem] border border-white/5 flex-1 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity size={16} className="text-cyan-400"/> Current Vitals
                 </h2>
                 
                 <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                          <Heart className="text-red-400" size={24} />
                       </div>
                       <div>
                          <div className="text-3xl font-black">{liveBpm || data?.telemetry?.heartRate?.[23]?.bpm || '--'} <span className="text-sm font-medium text-slate-500">bpm</span></div>
                          <div className="text-xs text-green-400 font-bold uppercase tracking-wider mt-1">
                             {liveBpm ? "Live Tracking" : "Normal"}
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <Droplet className="text-blue-400" size={24} />
                       </div>
                       <div>
                          <div className="text-3xl font-black">{data?.telemetry?.bloodPressure?.[23]?.systolic || '--'}/{data?.telemetry?.bloodPressure?.[23]?.diastolic || '--'}</div>
                          <div className="text-xs text-yellow-400 font-bold uppercase tracking-wider mt-1">Elevated</div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Action Modules */}
              <div className="grid grid-cols-2 gap-4">
                 <Link to="/records" className="bg-slate-900/50 p-5 rounded-3xl border border-white/5 hover:bg-slate-800 transition-all group relative overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                       <FileText size={20} className="text-purple-400" />
                    </div>
                    <div className="font-bold">Records</div>
                    <div className="text-xs text-slate-500">{data?.recordsCount || 0} files</div>
                 </Link>
                 <Link to="/purchase" className="bg-slate-900/50 p-5 rounded-3xl border border-white/5 hover:bg-slate-800 transition-all group relative overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3">
                       <ShoppingBag size={20} className="text-yellow-400" />
                    </div>
                    <div className="font-bold">Pharmacy</div>
                    <div className="text-xs text-slate-500">{data?.cartTotal || 0} items</div>
                 </Link>
                 <Link to="/emergency" className="col-span-2 bg-red-900/20 p-5 rounded-3xl border border-red-500/20 hover:bg-red-900/30 hover:border-red-500/40 transition-all group relative overflow-hidden">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                          <AlertTriangle size={20} className="text-red-400 animate-pulse" />
                       </div>
                       <div>
                          <div className="font-bold text-red-300">Emergency Services</div>
                          <div className="text-xs text-slate-500">Ambulance · Nearby Doctors Map</div>
                       </div>
                    </div>
                 </Link>
              </div>
           </div>

           {/* MIDDLE COLUMN: Real-time Telemetry Graphs (Span 6) */}
           <div className="lg:col-span-6 space-y-6">
              
              {/* Heart Rate Graph */}
              <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 h-[320px] flex flex-col relative">
                 <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex justify-between">
                    <span>Heart Rate (24h)</span>
                    <span className="text-cyan-400 animate-pulse text-[10px]">LIVE</span>
                 </h2>
                 <div className="flex-1 w-full -ml-4">
                    {data?.telemetry?.heartRate && (
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.telemetry.heartRate}>
                             <defs>
                                <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                             <XAxis dataKey="time" stroke="#ffffff40" tick={{fill: '#ffffff60', fontSize: 10}} tickMargin={10} axisLine={false} />
                             <YAxis stroke="#ffffff40" tick={{fill: '#ffffff60', fontSize: 10}} domain={['dataMin - 10', 'dataMax + 10']} axisLine={false} tickLine={false} />
                             <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                             />
                             <Area type="monotone" dataKey="bpm" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorBpm)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    )}
                 </div>
              </div>

              {/* Blood Pressure Graph */}
              <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 h-[320px] flex flex-col relative">
                 <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Blood Pressure Trends</h2>
                 <div className="flex-1 w-full -ml-4">
                    {data?.telemetry?.bloodPressure && (
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.telemetry.bloodPressure}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                             <XAxis dataKey="time" stroke="#ffffff40" tick={{fill: '#ffffff60', fontSize: 10}} tickMargin={10} axisLine={false} />
                             <YAxis stroke="#ffffff40" tick={{fill: '#ffffff60', fontSize: 10}} domain={['auto', 'auto']} axisLine={false} tickLine={false} />
                             <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                             />
                             <Line type="monotone" dataKey="systolic" stroke="#f43f5e" strokeWidth={2} dot={false} name="Systolic" />
                             <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={false} name="Diastolic" />
                          </LineChart>
                       </ResponsiveContainer>
                    )}
                 </div>
              </div>

           </div>

           {/* RIGHT COLUMN: Actionable Insights & Alerts (Span 3) */}
           <div className="lg:col-span-3 space-y-6 flex flex-col">
              
              {/* Prescriptions & Alerts */}
              <div className="bg-slate-900/60 border border-white/5 rounded-[2rem] p-6 flex-1 flex flex-col">
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Meds</h2>
                    {data?.alerts > 0 && (
                       <span className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <AlertCircle size={12} /> {data.alerts} Critical
                       </span>
                    )}
                 </div>

                 <div className="space-y-3 overflow-y-auto pr-2 flex-1 max-h-[500px]">
                    {data?.prescriptions?.length === 0 ? (
                       <div className="text-center text-slate-500 py-10 text-sm">No active prescriptions</div>
                    ) : (
                       data?.prescriptions?.map((p, i) => (
                           <div key={i} className={`p-4 rounded-2xl border ${p.is_critical ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-950/50 border-white/5'} flex items-start gap-3 relative group transition-colors hover:border-white/20`}>
                              <button 
                                onClick={() => toggleMedication(p.id, !p.taken_today)}
                                className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${p.taken_today ? 'bg-green-500/20 text-green-400 border border-green-500/50' : p.is_critical ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                              >
                                 {p.taken_today ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                              </button>
                              <div className="flex-1">
                                 <div className={`font-bold ${p.taken_today ? 'text-slate-400 line-through' : p.is_critical ? 'text-red-100' : 'text-white'}`}>{p.drug_name}</div>
                                 <div className="text-xs text-slate-500 mt-1">{p.dosage} • {p.frequency}</div>
                                 <div className="flex justify-between items-center mt-2">
                                     <div className="text-[10px] font-bold text-cyan-500 uppercase">{p.days_left} Days Left</div>
                                     {p.taken_today && <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Taken</span>}
                                 </div>
                              </div>
                           </div>
                       ))
                    )}
                 </div>

                 {/* Order Refill Button */}
                 {data?.prescriptions?.length > 0 && (
                    <Link to="/purchase" className="mt-6 w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-sm text-center shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex justify-center items-center gap-2">
                       <ShoppingBag size={16} /> Order Refills
                    </Link>
                 )}
              </div>

           </div>
        </div>
      </div>
      
      <style>{`
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        /* Custom scrollbar for meds list */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default Dashboard;