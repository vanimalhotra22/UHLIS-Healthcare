import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { 
  Activity, Brain, Scan, ShoppingCart, 
  ArrowRight, Shield, Zap, Database, 
  Stethoscope, Microscope, FileText
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500 selection:text-white overflow-hidden relative">
      <Navbar />
      
      {/* Background Glow Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      <main className="pt-24 pb-12 px-6">
        
        {/* --- HERO SECTION --- */}
        <section className="max-w-7xl mx-auto text-center mb-32 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-700 text-xs font-medium text-cyan-400 mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            System Operational • v2.0
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 leading-[1.1]">
            Next-Generation <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Medical Intelligence.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A unified platform for <strong>Diagnostic Imaging</strong>, 
            <strong> Tele-Medicine</strong>, and <strong>Secure Records</strong>. 
            Empowering doctors and patients with real-time AI insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/dashboard" className="group relative px-8 py-4 bg-white text-slate-950 rounded-full font-bold text-lg hover:bg-cyan-50 transition-all flex items-center gap-2">
              Open Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 rounded-full ring-4 ring-white/20 group-hover:ring-white/40 transition-all"></div>
            </Link>
            <Link to="/scanner" className="px-8 py-4 bg-slate-900 text-white border border-slate-700 rounded-full font-bold text-lg hover:bg-slate-800 transition-all flex items-center gap-2">
              <Scan className="w-5 h-5 text-cyan-400" />
              Upload Scan
            </Link>
          </div>
        </section>

        {/* --- LIVE FEATURES GRID (Professional Names) --- */}
        <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
          
          {/* Feature 1: The Scanner */}
          <FeatureCard 
            icon={<Scan className="text-cyan-400" />}
            title="AI Diagnostic Imaging"
            desc="Multi-organ analysis engine. Detects anomalies in X-Rays, MRIs, and CT Scans with clinical-grade precision."
            link="/scanner"
            badge="Live Analysis"
          />

          {/* Feature 2: The Agent */}
          <FeatureCard 
            icon={<Brain className="text-purple-400" />}
            title="AI Health Copilot"
            desc="Intelligent assistant for symptom checking, diet planning, and medication reminders. 24/7 Availability."
            link="/chat"
            badge="Assistant"
          />

          {/* Feature 3: The Store */}
          <FeatureCard 
            icon={<ShoppingCart className="text-green-400" />}
            title="Pharmacy & Bio-Bank"
            desc="Integrated marketplace for medications and real-time tracking of blood/organ availability."
            link="/purchase"
            badge="Inventory"
          />

          {/* Feature 4: Clinician View */}
          <FeatureCard 
            icon={<Stethoscope className="text-blue-400" />}
            title="Clinician Console"
            desc="Provider dashboard for patient monitoring, risk assessment, and rapid prescription generation."
            link="/clinician"
          />

          {/* Feature 5: Security */}
          <FeatureCard 
            icon={<Shield className="text-yellow-400" />}
            title="Encrypted Health Vault"
            desc="Military-grade encryption for patient records. Ensuring 100% data sovereignty and privacy."
            link="/vault"
          />

          {/* Feature 6: Data Pipeline */}
          <FeatureCard 
            icon={<FileText className="text-red-400" />}
            title="Verified Medical Protocols"
            desc="Information grounded in official medical guidelines (WHO, ADA) to ensure safe and accurate advice."
            link="/chat"
          />

        </section>

        {/* --- TECHNICAL SPECS FOOTER --- */}
        <footer className="border-t border-slate-800 pt-12 pb-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            
            <div className="text-left">
              <div className="flex items-center gap-2 text-xl font-bold text-white mb-2">
                <Activity className="text-cyan-500" /> UHLIS <span className="text-xs px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">v2.0</span>
              </div>
              <p className="text-slate-500 text-sm max-w-md">
                Unified Health & Life Intelligence System. 
                Bridging the gap between patient care and advanced technology.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm text-slate-400">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> System Online</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Secure Connection</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Low Latency</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Privacy First</div>
            </div>

          </div>
          
          <div className="text-center text-slate-600 text-xs mt-12">
            © 2025 UHLIS. All Rights Reserved.
          </div>
        </footer>

      </main>
    </div>
  );
};

// --- SUB-COMPONENT: Glass Card ---
const FeatureCard = ({ icon, title, desc, link, badge }) => (
  <Link to={link} className="group p-6 rounded-3xl bg-slate-900/40 border border-white/5 hover:border-cyan-500/30 hover:bg-slate-900/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
    
    {/* Hover Glow */}
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 group-hover:border-cyan-500/30 transition-colors">
          {icon}
        </div>
        {badge && (
          <span className="px-2 py-1 rounded-md bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-700">
            {badge}
          </span>
        )}
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed">
        {desc}
      </p>
    </div>
  </Link>
);

export default Landing;