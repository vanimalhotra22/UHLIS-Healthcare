import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Zap, Moon, Coffee } from 'lucide-react';

const actions = [
  { 
    id: 1, 
    time: "Just Now", 
    title: "Cognitive Load Intervention", 
    desc: "Workload stress detected via typing cadence. Initiating 'Focus Hertz' audio protocol.",
    icon: <Zap size={18} />,
    status: "Active",
    color: "cyan"
  },
  { 
    id: 2, 
    time: "14:00 PM (Predicted)", 
    title: "Glucose Crash Prevention", 
    desc: "Metabolic crash likely. Suggesting high-protein intake in 30 mins.",
    icon: <Coffee size={18} />,
    status: "Pending",
    color: "warning"
  },
  { 
    id: 3, 
    time: "21:30 PM (Scheduled)", 
    title: "Circadian Reset", 
    desc: "Smart home lights will dim to 2700K to boost Melatonin.",
    icon: <Moon size={18} />,
    status: "Scheduled",
    color: "neutral"
  }
];

const ActionFeed = () => {
  return (
    <Card className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="text-cyan-400" /> Action Engine
        </h2>
        <Badge variant="success">Running</Badge>
      </div>

      <div className="space-y-4">
        {actions.map((item) => (
          <div key={item.id} className="group flex gap-4 p-3 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-800 cursor-pointer">
            <div className={`mt-1 p-2 rounded-lg h-fit ${item.status === 'Active' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
              {item.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-500">{item.time}</span>
                {item.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>}
              </div>
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ActionFeed;