import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import NeuralBackground from '../components/ui/NeuralBackground';

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate authentication/registration delay
    setTimeout(() => {
      // Hardcode PATIENT_ID = 2 to match the rest of the mock system
      localStorage.setItem('uhlis_user_id', '2');
      localStorage.setItem('uhlis_user_name', isSignup && name ? name : 'Vani Malhotra');
      setLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white flex items-center justify-center relative overflow-hidden font-sans selection:bg-cyan-500/30">
      <NeuralBackground />
      
      {/* Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md p-8 relative z-10 animate-fade-in">
        
        {/* Logo/Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 rounded-3xl border border-cyan-500/30 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative group">
             <div className="absolute inset-0 bg-cyan-400/20 rounded-3xl blur-xl group-hover:bg-cyan-400/30 transition-all"></div>
             <Brain className="text-cyan-400 w-10 h-10 relative z-10" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">UHLIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Secure</span></h1>
          <p className="text-slate-400 text-sm">{isSignup ? "Create a new patient account" : "Sign in to your patient portal"}</p>
        </div>

        {/* Login/Signup Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-white/10 rounded-[2rem] p-8 backdrop-blur-2xl shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[2rem] pointer-events-none"></div>
            
            <div className="space-y-6 relative z-10">
                {/* Name Input (Signup Only) */}
                {isSignup && (
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                      <div className="relative">
                          <User className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                          <input 
                              type="text" 
                              required={isSignup}
                              placeholder="Enter your name"
                              className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                          />
                      </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Patient ID / Email</label>
                    <div className="relative">
                        <User className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                        <input 
                            type="text" 
                            required
                            placeholder="Enter your email"
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center pl-1 pr-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                        {!isSignup && <a href="#" className="text-xs text-cyan-500 hover:text-cyan-400 font-bold transition-colors">Forgot?</a>}
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                        <input 
                            type="password" 
                            required
                            placeholder="••••••••"
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder-slate-600"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full relative overflow-hidden group bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all disabled:opacity-70 mt-4"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {isSignup ? "Registering..." : "Authenticating..."}
                        </>
                    ) : (
                        <>
                            {isSignup ? "Create Account" : "Secure Login"} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
            
            <div className="mt-6 text-center text-sm text-slate-400">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{' '}
                <button 
                  type="button" 
                  onClick={() => setIsSignup(!isSignup)} 
                  className="text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  {isSignup ? "Log in here" : "Sign up here"}
                </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck size={14} className="text-green-500" /> End-to-end encrypted connection
            </div>
        </form>
      </div>
      
      <style>{`
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default Login;
