import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { User, Bell, Shield, Smartphone, Heart, AlertCircle } from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState(null);
  const userId = localStorage.getItem('uhlis_user_id') || 2;

  useEffect(() => {
    fetch(`http://localhost:8000/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error(err));
  }, [userId]);

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-6 pt-24 font-sans selection:bg-cyan-500/30">
      <Navbar />
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 bg-cyan-900/20 text-cyan-400 font-bold rounded-xl border border-cyan-500/30 flex items-center gap-3">
              <User size={18} /> Personal Info
            </button>
            <button className="w-full text-left px-4 py-3 text-slate-400 hover:bg-slate-900/50 hover:text-white rounded-xl transition-all flex items-center gap-3">
              <Bell size={18} /> Notifications
            </button>
            <button className="w-full text-left px-4 py-3 text-slate-400 hover:bg-slate-900/50 hover:text-white rounded-xl transition-all flex items-center gap-3">
              <Shield size={18} /> Privacy & Security
            </button>
            <button className="w-full text-left px-4 py-3 text-slate-400 hover:bg-slate-900/50 hover:text-white rounded-xl transition-all flex items-center gap-3">
              <Smartphone size={18} /> Connected Devices
            </button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <User size={20} className="text-cyan-400" /> Basic Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                  <div className="text-lg font-medium">{user?.name || 'Loading...'}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Patient ID</label>
                  <div className="text-lg font-medium text-slate-300">UHLIS-PT-{user?.id || 'XX'}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Account Type</label>
                  <div className="inline-block mt-1 px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full capitalize">
                    {user?.role || 'Patient'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <AlertCircle size={20} className="text-red-400" /> Emergency Contact
              </h2>
              <div className="p-4 bg-slate-950/50 border border-white/5 rounded-xl">
                <div className="font-bold">Primary Contact (Mock)</div>
                <div className="text-slate-400 text-sm mt-1">Jane Doe • +1 (555) 019-2834</div>
                <div className="text-xs text-slate-500 mt-1">Relation: Spouse</div>
              </div>
            </div>
            
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

export default Profile;
