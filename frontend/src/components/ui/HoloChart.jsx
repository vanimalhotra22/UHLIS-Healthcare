import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '10 AM', hr: 65, stress: 30 },
  { time: '11 AM', hr: 72, stress: 45 },
  { time: '12 PM', hr: 95, stress: 75 }, // Spike
  { time: '1 PM', hr: 85, stress: 50 },
  { time: '2 PM', hr: 70, stress: 35 },
  { time: '3 PM', hr: 74, stress: 40 },
];

const HoloChart = () => {
  return (
    <div className="h-64 w-full bg-slate-900/40 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
      <h3 className="text-slate-400 text-xs uppercase font-bold mb-4">Real-time Biometrics</h3>
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#475569" fontSize={10} />
          <YAxis stroke="#475569" fontSize={10} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Area type="monotone" dataKey="hr" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorHr)" />
          <Area type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorStress)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HoloChart;