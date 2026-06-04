import React from 'react';
import { Brain, ArrowRight, Shield, Activity, Scan, MessageSquare, CreditCard, LayoutDashboard, FileText, Calendar, User, Target, AlertTriangle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/dashboard';
  const isLoggedIn = !!localStorage.getItem('uhlis_user_id');

  const handleLogout = () => {
    localStorage.removeItem('uhlis_user_id');
    localStorage.removeItem('uhlis_user_name');
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
            <Brain className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tighter">
            UHLIS <span className="text-xs align-top text-cyan-400">2.0</span>
          </span>
        </Link>

        {/* Desktop Links (Cleaned) */}
        {isLoggedIn && (
          <div className="hidden xl:flex items-center gap-2 text-xs font-medium text-slate-400">
             
             <Link to="/dashboard" className="hover:text-white flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
               <LayoutDashboard className="w-4 h-4 text-green-400"/> Dashboard
             </Link>

             <Link to="/records" className="hover:text-white flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
               <FileText className="w-4 h-4 text-purple-400"/> Records
             </Link>

             <Link to="/clinician" className="hover:text-white flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
               <Shield className="w-4 h-4 text-rose-400"/> Care Team
             </Link>

             <Link to="/scanner" className="hover:text-white flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
               <Scan className="w-4 h-4 text-cyan-400"/> Scan
             </Link>
             
             <Link to="/chat" className="hover:text-white flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
               <MessageSquare className="w-4 h-4 text-blue-400"/> AI Copilot
             </Link>
             
             <Link to="/appointments" className="hover:text-white flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
               <Calendar className="w-4 h-4 text-indigo-400"/> Appointments
             </Link>

             <Link to="/fitness" className="hover:text-white flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
               <Target className="w-4 h-4 text-orange-400"/> Fitness
             </Link>
             
             <div className="w-px h-4 bg-slate-800 mx-2"></div>

             <Link to="/purchase" className="hover:text-white flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
               <CreditCard className="w-4 h-4 text-yellow-400"/> Store
             </Link>

             <div className="w-px h-4 bg-slate-800 mx-2"></div>

             {/* Emergency — Highlighted */}
             <Link to="/emergency" className="hover:text-white flex items-center gap-2 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 hover:border-red-500/40 px-3 py-2 rounded-lg transition-all">
               <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse"/> <span className="text-red-400 font-bold">Emergency</span>
             </Link>
          </div>
        )}

        {/* Right Side Button */}
        <div className="flex items-center gap-4">
          {isDashboard && (
             <div className="hidden sm:flex items-center gap-2 text-green-400 text-sm font-medium px-4 py-2 bg-green-900/10 rounded-full border border-green-900/30">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Live
             </div>
          )}
          
          {isLoggedIn ? (
             <div className="flex items-center gap-4">
                 <Link to="/profile" className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all">
                    <User size={18} />
                 </Link>
                 <button onClick={handleLogout} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
                    Logout
                 </button>
             </div>
          ) : (
            <Link to="/login" className="group flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-full font-semibold text-sm hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              Secure Login <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;