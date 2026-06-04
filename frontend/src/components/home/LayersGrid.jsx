import React from 'react';
import { Database, Zap, Layout, Smartphone } from 'lucide-react';

const LayersGrid = () => {
  const layers = [
    {
      id: 1,
      title: "The Core Vault",
      desc: "Zero-trust storage for multimodal life data. DNA, sensors, and environment.",
      icon: <Database className="w-6 h-6 text-purple-400" />,
      color: "from-purple-500/20 to-purple-900/5"
    },
    {
      id: 2,
      title: "Intelligence Universe",
      desc: "Multi-model hybrid AI. Predicts metabolic crashes and burnout timelines.",
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      color: "from-yellow-500/20 to-yellow-900/5"
    },
    {
      id: 3,
      title: "Action Engine",
      desc: "Autonomous micro-interventions. The system acts before you even feel the risk.",
      icon: <Layout className="w-6 h-6 text-cyan-400" />,
      color: "from-cyan-500/20 to-cyan-900/5"
    },
    {
      id: 4,
      title: "Experience Dimension",
      desc: "Clinician consoles and User dashboards integrated into one seamless flow.",
      icon: <Smartphone className="w-6 h-6 text-green-400" />,
      color: "from-green-500/20 to-green-900/5"
    }
  ];

  return (
    <section id="layers" className="py-24 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The 4 Superior Layers</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            UHLIS isn't just an app. It is a vertically integrated stack of biological intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {layers.map((layer) => (
            <div key={layer.id} className={`p-6 rounded-2xl bg-gradient-to-b ${layer.color} border border-white/5 hover:border-white/10 transition-all group`}>
              <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {layer.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{layer.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{layer.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LayersGrid;