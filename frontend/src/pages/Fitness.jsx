import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import { Activity, Droplet, Moon, Plus, Target, Zap, MessageSquare, Send, Watch, Brain, Flame, Utensils, HeartPulse, Award, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PATIENT_ID = 2;

const Fitness = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // AI Chat State (replacing Doctor Chat)
  const [messages, setMessages] = useState([{ sender: 'ai', text: "Hello! I'm your AI Fitness Coach. I can analyze your metrics, suggest workouts, and help you reach your goals. What's on your mind today?" }]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  // Advanced Log Forms
  const [mealForm, setMealForm] = useState({ type: 'Breakfast', cal: 450, protein: 20, carbs: 40, fats: 15 });
  const [workoutForm, setWorkoutForm] = useState({ activity: 'Running', dur: 30, cal: 300 });

  // History State
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchFitness();
    fetchHistory();
  }, []);

  const fetchFitness = async () => {
    try {
      const res = await fetch(`http://localhost:8000/fitness/${PATIENT_ID}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {} finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`http://localhost:8000/fitness/${PATIENT_ID}/history`);
      if (res.ok) {
          const json = await res.json();
          // Map to chart format
          const formatted = json.map(h => ({
              day: new Date(h.date).toLocaleDateString('en-US', {weekday: 'short'}),
              steps: h.steps,
              hrv: h.hrv_score,
              water: h.water_glasses
          })).reverse(); // Oldest to newest for the chart
          setHistory(formatted);
      }
    } catch (e) {}
  };

  const syncWearable = async () => {
    try {
      await fetch(`http://localhost:8000/fitness/${PATIENT_ID}/sync_wearable`, { method: 'POST' });
      alert("Apple Watch / Fitbit data synced successfully!");
      fetchFitness();
      fetchHistory();
    } catch (e) {}
  };

  const logMeal = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:8000/fitness/${PATIENT_ID}/meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            meal_type: mealForm.type, 
            calories: mealForm.cal, 
            description: "",
            protein: mealForm.protein,
            carbs: mealForm.carbs,
            fats: mealForm.fats
        })
      });
      alert(`Logged ${mealForm.cal} kcal for ${mealForm.type}`);
    } catch (e) {}
  };

  const logWorkout = async (e) => {
    e.preventDefault();
    try {
      await fetch(`http://localhost:8000/fitness/${PATIENT_ID}/workout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: workoutForm.activity, duration_minutes: workoutForm.dur, calories_burned: workoutForm.cal })
      });
      alert(`Logged ${workoutForm.activity}`);
    } catch (e) {}
  };

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const addSteps = async (amount) => {
    try {
      const res = await fetch(`http://localhost:8000/fitness/${PATIENT_ID}/steps`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: (data?.steps || 0) + amount })
      });
      if (res.ok) { const json = await res.json(); setData(prev => ({ ...prev, steps: json.steps })); fetchHistory(); }
    } catch (e) {}
  };

  const addWater = async () => {
    try {
      const res = await fetch(`http://localhost:8000/fitness/${PATIENT_ID}/water`, { method: 'POST' });
      if (res.ok) { const json = await res.json(); setData(prev => ({ ...prev, water_glasses: json.water_glasses })); fetchHistory(); }
    } catch (e) {}
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const userMsg = { sender: 'user', text: newMessage };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = newMessage;
    setNewMessage("");
    scrollToBottom();

    try {
      const res = await fetch(`http://localhost:8000/chat/ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: PATIENT_ID, message: "Fitness context: " + currentInput })
      });
      if(res.ok) {
          const data = await res.json();
          setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
          scrollToBottom();
      }
    } catch (e) {
        setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I am offline." }]);
    }
  };

  // Gamification Logic
  const getBadges = () => {
      const badges = [];
      if(data?.steps >= 10000) badges.push({ name: "Step Goal Crusher", icon: <TrendingUp size={16}/>, color: "text-green-400 bg-green-500/20 border-green-500/30" });
      if(data?.water_glasses >= 8) badges.push({ name: "Hydration Master", icon: <Droplet size={16}/>, color: "text-blue-400 bg-blue-500/20 border-blue-500/30" });
      
      const stepStreak = history.filter(h => h.steps >= 10000).length;
      if(stepStreak >= 3) badges.push({ name: `${stepStreak}-Day Streak`, icon: <Flame size={16}/>, color: "text-orange-400 bg-orange-500/20 border-orange-500/30" });
      
      return badges;
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-300 font-sans selection:bg-cyan-500/30">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 pb-24 animate-fade-in">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <Activity className="text-cyan-400" size={36} /> Ultimate Fitness Hub
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Advanced metric tracking, AI insights, and macro logging.</p>
          </div>
          <button onClick={syncWearable} className="px-6 py-3 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 transition-all">
            <Watch size={20} className="text-cyan-400" /> Sync Wearable
          </button>
        </header>

        {/* GAMIFICATION BADGES */}
        <div className="flex flex-wrap gap-4 mb-6">
            {getBadges().map((b, i) => (
                <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold shadow-lg ${b.color} animate-fade-in`}>
                    {b.icon} {b.name}
                </div>
            ))}
        </div>

        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem]">
            <div className="flex justify-between items-center mb-4">
               <div className="w-10 h-10 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center"><Target size={20} /></div>
               <span className="text-xs font-bold text-slate-500 uppercase">Goal: 10k</span>
            </div>
            <div className="text-3xl font-black text-white">{data?.steps?.toLocaleString()}</div>
            <div className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Steps</div>
            <button onClick={() => addSteps(500)} className="w-full mt-4 py-2 bg-green-600/20 text-green-400 text-xs font-bold rounded-xl hover:bg-green-600/30">Log 500 Steps</button>
          </div>
          
          <div className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem]">
            <div className="flex justify-between items-center mb-4">
               <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center"><Droplet size={20} /></div>
               <span className="text-xs font-bold text-slate-500 uppercase">Goal: 8</span>
            </div>
            <div className="text-3xl font-black text-white">{data?.water_glasses}/8</div>
            <div className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Water (Glasses)</div>
            <button onClick={addWater} className="w-full mt-4 py-2 bg-blue-600/20 text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-600/30">Log Water</button>
          </div>
          
          <div className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem]">
            <div className="flex justify-between items-center mb-4">
               <div className="w-10 h-10 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center"><HeartPulse size={20} /></div>
               <span className="text-xs font-bold text-slate-500 uppercase">Avg 65ms</span>
            </div>
            <div className="text-3xl font-black text-white">{data?.hrv_score || 55} <span className="text-xl text-slate-500">ms</span></div>
            <div className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">HRV Stress Index</div>
          </div>
          
          {/* AI Insight Panel */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-cyan-900/40 border border-cyan-500/20 p-6 rounded-[2rem] flex flex-col justify-between">
            <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2"><Brain size={16}/> AI Health Insight</h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Your HRV is {data?.hrv_score > 60 ? 'optimal' : 'slightly lower than your 7-day average'}. Combined with your recent high-intensity workouts, your body indicates {data?.hrv_score > 60 ? 'good recovery' : 'mild central nervous system fatigue'}. <br/><br/>
              <strong>Recommendation:</strong> {data?.hrv_score > 60 ? 'Keep up the good work and push your limits.' : 'Prioritize 8 hours of sleep tonight and increase hydration.'}
            </p>
          </div>
        </div>

        {/* MIDDLE SECTION - CHARTS AND LOGGERS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
           
           {/* Chart */}
           <div className="col-span-2 bg-slate-900/60 border border-white/5 rounded-[2rem] p-6">
              <h3 className="text-lg font-bold text-white mb-6">7-Day Step & HRV Trend</h3>
              <div className="h-64">
                {history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                        <XAxis dataKey="day" stroke="#ffffff30" tick={{fill: '#ffffff60', fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#ffffff30" tick={{fill: '#ffffff60', fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#ffffff30" tick={{fill: '#ffffff60', fontSize: 12}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                        <Bar yAxisId="left" dataKey="steps" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="hrv" stroke="#f43f5e" strokeWidth={3} />
                    </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">Not enough history data.</div>
                )}
              </div>
           </div>

           {/* Manual Loggers */}
           <div className="space-y-6">
             {/* Workout Logger */}
             <form onSubmit={logWorkout} className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem]">
               <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-4 uppercase tracking-widest"><Flame size={16} className="text-orange-400"/> Log Workout</h3>
               <select value={workoutForm.activity} onChange={e=>setWorkoutForm({...workoutForm, activity: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-cyan-500 mb-3">
                 <option>Running</option><option>Cycling</option><option>Weightlifting</option><option>Yoga</option>
               </select>
               <div className="flex gap-2 mb-4">
                 <input type="number" placeholder="Mins" required value={workoutForm.dur} onChange={e=>setWorkoutForm({...workoutForm, dur: e.target.value})} className="w-1/2 bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-cyan-500" />
                 <input type="number" placeholder="Kcal" required value={workoutForm.cal} onChange={e=>setWorkoutForm({...workoutForm, cal: e.target.value})} className="w-1/2 bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-cyan-500" />
               </div>
               <button type="submit" className="w-full py-2 bg-orange-600/20 text-orange-400 text-xs font-bold rounded-xl hover:bg-orange-600/30">Save Session</button>
             </form>

             {/* Meal Logger */}
             <form onSubmit={logMeal} className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem]">
               <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-4 uppercase tracking-widest"><Utensils size={16} className="text-yellow-400"/> Macro Meal Log</h3>
               <div className="flex gap-2 mb-3">
                 <select value={mealForm.type} onChange={e=>setMealForm({...mealForm, type: e.target.value})} className="w-1/2 bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-cyan-500">
                   <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option>
                 </select>
                 <input type="number" placeholder="Kcal" required value={mealForm.cal} onChange={e=>setMealForm({...mealForm, cal: e.target.value})} className="w-1/2 bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-cyan-500" />
               </div>
               <div className="flex gap-2 mb-4 text-xs font-bold">
                   <div className="flex-1">
                       <span className="text-red-400 ml-1">P(g)</span>
                       <input type="number" placeholder="P" required value={mealForm.protein} onChange={e=>setMealForm({...mealForm, protein: e.target.value})} className="w-full mt-1 bg-slate-950 border border-white/10 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500" />
                   </div>
                   <div className="flex-1">
                       <span className="text-blue-400 ml-1">C(g)</span>
                       <input type="number" placeholder="C" required value={mealForm.carbs} onChange={e=>setMealForm({...mealForm, carbs: e.target.value})} className="w-full mt-1 bg-slate-950 border border-white/10 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500" />
                   </div>
                   <div className="flex-1">
                       <span className="text-yellow-400 ml-1">F(g)</span>
                       <input type="number" placeholder="F" required value={mealForm.fats} onChange={e=>setMealForm({...mealForm, fats: e.target.value})} className="w-full mt-1 bg-slate-950 border border-white/10 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500" />
                   </div>
               </div>
               <button type="submit" className="w-full py-2 bg-yellow-600/20 text-yellow-400 text-xs font-bold rounded-xl hover:bg-yellow-600/30">Save Macros</button>
             </form>
           </div>
        </div>

        {/* AI Chat Section */}
        <div className="bg-slate-900/60 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-[400px]">
          <div className="bg-slate-900 border-b border-white/5 p-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center border border-indigo-500/30"><Brain size={18} /></div>
              <div>
                <h3 className="font-bold text-white">AI Personal Fitness Coach</h3>
                <p className="text-xs text-slate-400">Powered by UHLIS Medical Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-500 uppercase">AI Online</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/30 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-300 border border-white/5 rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="bg-slate-900 border-t border-white/5 p-4 z-10">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input type="text" placeholder="Ask your AI coach for advice, workouts, or meal ideas..." className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 rounded-xl font-bold transition-colors disabled:opacity-50" disabled={!newMessage.trim()}><Send size={18} /></button>
            </form>
          </div>
        </div>

      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default Fitness;
