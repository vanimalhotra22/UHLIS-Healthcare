import React from 'react';
import Card from '../ui/Card';
import { Moon, Waves, Battery } from 'lucide-react';

const SleepLens = () => {
  return (
    <Card className="h-full border-purple-500/20 bg-gradient-to-br from-slate-900 to-purple-900/10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Moon className="text-purple-400" /> SleepLens Technology
        </h2>
        <span className="text-xs text-purple-300 bg-purple-900/30 px-2 py-1 rounded border border-purple-800">
          Optimization Active
        </span>
      </div>

      <div className="space-y-6">
        {/* Visual Sleep Stages */}
        <div className="flex items-end gap-1 h-24 mt-4">
          <div className="w-1/4 bg-purple-900/30 h-[40%] rounded-t mx-0.5 relative group">
             <span className="absolute -top-6 text-[10px] hidden group-hover:block">Light</span>
          </div>
          <div className="w-1/4 bg-purple-600 h-[90%] rounded-t mx-0.5 relative group shadow-[0_0_15px_rgba(147,51,234,0.5)]">
             <span className="absolute -top-6 text-[10px] text-purple-300 w-24 -ml-4">Deep (Repair Phase)</span>
          </div>
          <div className="w-1/4 bg-cyan-600 h-[70%] rounded-t mx-0.5 relative group">
             <span className="absolute -top-6 text-[10px] text-cyan-300">REM (Dreaming)</span>
          </div>
          <div className="w-1/4 bg-purple-900/30 h-[30%] rounded-t mx-0.5"></div>
        </div>

        {/* Optimization Metrics */}
        <div className="grid grid-cols-2 gap-3">
           <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                 <Battery size={12} /> Recovery
              </div>
              <div className="text-lg font-bold text-green-400">98%</div>
           </div>
           <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                 <Waves size={12} /> REM Cycles
              </div>
              <div className="text-lg font-bold text-cyan-400">Optimal</div>
           </div>
        </div>
      </div>
    </Card>
  );
};

export default SleepLens;