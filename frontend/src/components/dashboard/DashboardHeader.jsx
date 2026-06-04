import React from 'react';
import { Bell, Search, Settings } from 'lucide-react';

const DashboardHeader = ({ userName = "Vani Malhotra" }) => {
  return (
    <header className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{userName}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          UHLIS Core Online • Biometrics Syncing
        </p>
      </div>

      <div className="flex gap-3">
        <button className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
          <Search size={20} />
        </button>
        <button className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
        </button>
        <button className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;