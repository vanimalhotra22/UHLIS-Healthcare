import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import { Shield, Search, Star, MessageSquare, Send, Calendar, Award, Phone } from 'lucide-react';

const PATIENT_ID = 2; // Simulated Logged-In Patient

const Clinician = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Selected Doctor State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Chat State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('http://localhost:8000/doctors');
      const data = await res.json();
      setDoctors(data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => {
    let interval;
    if (selectedDoctor) {
      fetchChat();
      interval = setInterval(fetchChat, 5000);
    }
    return () => clearInterval(interval);
  }, [selectedDoctor]);

  const fetchChat = async () => {
    if (!selectedDoctor) return;
    try {
      const res = await fetch(`http://localhost:8000/chat/${PATIENT_ID}/${selectedDoctor.id}`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json);
        scrollToBottom();
      }
    } catch (e) {}
  };

  const scrollToBottom = () => { setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100); };

  const sendPatientMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedDoctor) return;
    try {
      await fetch(`http://localhost:8000/chat/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: PATIENT_ID, receiver_id: selectedDoctor.id, content: newMessage })
      });
      setNewMessage("");
      fetchChat();
    } catch (e) {}
  };

  const filteredDoctors = doctors.filter(d => 
      d.name.toLowerCase().includes(search.toLowerCase()) || 
      d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-6 pt-24 font-sans selection:bg-rose-500/30 flex flex-col">
      <Navbar />
      
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex gap-6 animate-fade-in mb-6">
        
        {/* --- DOCTOR DIRECTORY (LEFT COLUMN) --- */}
        <div className="w-1/2 min-w-[400px] bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 flex flex-col backdrop-blur-xl relative overflow-hidden h-[calc(100vh-140px)]">
           <div className="absolute top-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
           
           <div className="relative z-10 flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="text-rose-400" /> My Care Team</h2>
              <span className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full text-slate-300 border border-white/5">{doctors.length} Available</span>
           </div>

           <div className="relative z-10 mb-6">
              <Search className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
              <input type="text" placeholder="Search by doctor name or specialty..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-rose-500/50" />
           </div>

           <div className="relative z-10 flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {loading ? (
                 <div className="text-center text-slate-500 py-10">Loading Clinicians...</div>
              ) : filteredDoctors.map(d => (
                 <div key={d.id} onClick={() => setSelectedDoctor(d)} className={`p-5 rounded-2xl cursor-pointer transition-all border ${selectedDoctor?.id === d.id ? 'bg-rose-600/20 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'bg-slate-950/40 border-white/5 hover:bg-slate-800/60'}`}>
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-rose-400 font-bold text-xl border border-rose-500/20">
                               {d.name.split(' ')[1] ? d.name.split(' ')[1][0] : d.name[0]}
                           </div>
                           <div>
                              <div className="font-bold text-white text-lg">{d.name}</div>
                              <div className="text-sm font-medium text-rose-400">{d.specialty}</div>
                              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Star size={12} className="text-yellow-400 fill-yellow-400"/> {d.rating} Rating</div>
                           </div>
                       </div>
                       <div className="text-right">
                           <div className="text-xs font-bold text-slate-400 uppercase">Consult Fee</div>
                           <div className="text-lg font-bold text-white">${d.fee}</div>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* --- DOCTOR DETAIL / MESSAGING (RIGHT COLUMN) --- */}
        <div className="flex-1 bg-slate-900/60 border border-white/5 rounded-[2rem] flex flex-col backdrop-blur-xl relative overflow-hidden h-[calc(100vh-140px)]">
           {!selectedDoctor ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center relative z-10 animate-fade-in">
                 <Shield size={64} className="mb-4 opacity-50" />
                 <h3 className="text-xl font-bold text-white">Select a Clinician</h3>
                 <p className="text-sm mt-2 max-w-sm">Choose a doctor from the directory to view their profile, send a direct message, or book a consultation.</p>
              </div>
           ) : (
              <div className="flex-1 flex flex-col h-full animate-fade-in relative z-10">
                 
                 {/* Header Profile */}
                 <div className="p-8 pb-6 border-b border-white/10 bg-slate-900 z-10 shadow-lg">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-6">
                         <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-rose-400 font-bold text-3xl border-2 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                             {selectedDoctor.name.split(' ')[1] ? selectedDoctor.name.split(' ')[1][0] : selectedDoctor.name[0]}
                         </div>
                         <div>
                            <h1 className="text-3xl font-bold">{selectedDoctor.name}</h1>
                            <div className="flex items-center gap-4 text-sm font-medium text-slate-400 mt-2">
                               <span className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20"><Award size={14} /> {selectedDoctor.specialty}</span>
                               <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400"/> {selectedDoctor.rating} / 5.0</span>
                               <span className="flex items-center gap-1"><Phone size={14} /> Telehealth & In-Person</span>
                            </div>
                         </div>
                      </div>
                   </div>
                 </div>

                 {/* TAB CONTENT (MESSAGING) */}
                 <div className="flex-1 flex flex-col bg-slate-950/50">
                    <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs font-bold text-center flex justify-center items-center gap-2">
                        <MessageSquare size={14}/> Secure direct messaging channel. Responses usually within 24 hours.
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="text-center text-slate-500 mt-10">No messages yet. Send a secure message to {selectedDoctor.name}.</div>
                        ) : (
                            messages.map(msg => (
                              <div key={msg.id} className={`flex flex-col ${msg.sender_id === PATIENT_ID ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[75%] p-4 rounded-2xl ${msg.sender_id === PATIENT_ID ? 'bg-rose-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-300 border border-white/5 rounded-tl-none'}`}>
                                  {msg.content}
                                </div>
                                <span className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">
                                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            ))
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 bg-slate-900 border-t border-white/10">
                        <form onSubmit={sendPatientMessage} className="flex gap-2">
                            <input type="text" placeholder={`Type your message to ${selectedDoctor.name}...`} className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500/50" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                            <button type="submit" disabled={!newMessage.trim()} className="bg-rose-600 hover:bg-rose-500 text-white px-6 rounded-xl font-bold transition-colors disabled:opacity-50"><Send size={18} /></button>
                        </form>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>
      
      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default Clinician;