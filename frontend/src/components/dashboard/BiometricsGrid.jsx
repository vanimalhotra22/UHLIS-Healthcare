import React from 'react';
import Card from '../ui/Card';
import { Activity, Heart, Thermometer, Droplets } from 'lucide-react';

const Metric = ({ label, value, unit, trend, icon, color }) => (
  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
    <div className={`flex justify-between items-start mb-2 ${color}`}>
      {icon}
      <span className={`text-xs font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
        {trend > 0 ? '+' : ''}{trend}%
      </span>
    </div>
    <div className="text-2xl font-bold text-white">
      {value}<span className="text-xs text-slate-500 font-normal ml-1">{unit}</span>
    </div>
    <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{label}</div>
  </div>
);

const BiometricsGrid = () => {
  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="text-green-400" /> Live Vitals
        </h2>
        <span className="text-xs text-slate-500 animate-pulse">● Live Stream</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Metric 
          label="Heart Rate" value="72" unit="bpm" trend={-2} 
          icon={<Heart size={20} />} color="text-red-400" 
        />
        <Metric 
          label="HRV" value="48" unit="ms" trend={+5} 
          icon={<Activity size={20} />} color="text-green-400" 
        />
        <Metric 
          label="Skin Temp" value="36.4" unit="°C" trend={0} 
          icon={<Thermometer size={20} />} color="text-orange-400" 
        />
        <Metric 
          label="Hydration" value="92" unit="%" trend={-1} 
          icon={<Droplets size={20} />} color="text-blue-400" 
        />
      </div>
    </Card>
  );
};

export default BiometricsGrid;