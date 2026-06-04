import React from 'react';
import { motion } from 'framer-motion';
// FIXED: Import Link from react-router-dom so the buttons work
import { Link } from 'react-router-dom';
import { Activity, Shield, Cpu, Brain } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/20 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            System Online: V2.0 Live
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
            The Operating System <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              For Your Existence.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Beyond health tracking. UHLIS is a unified agentic intelligence that predicts risks, plans behaviors, and optimizes your biology in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Button 1: Goes to Dashboard */}
            <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all text-center">
              Initialize Profile
            </Link>
            
            {/* Button 2: Goes to Security Vault */}
            <Link to="/vault" className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              View Security Protocols
            </Link>
          </div>
        </motion.div>

        {/* Stats / Trust Markers */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5 pt-10">
          <Stat label="Data Points/Sec" value="10M+" icon={<Activity />} />
          <Stat label="Prediction Accuracy" value="99.8%" icon={<Cpu />} />
          <Stat label="Encryption" value="Zero-Trust" icon={<Shield />} />
          <Stat label="Active Agents" value="4 Layers" icon={<Brain />} />
        </div>
      </div>
    </section>
  );
};

const Stat = ({ label, value, icon }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="text-slate-500">{icon}</div>
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="text-xs text-slate-500 uppercase tracking-widest">{label}</div>
  </div>
);

export default Hero;