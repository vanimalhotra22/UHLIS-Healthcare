import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import { Calendar, Clock, Video, MapPin, Plus, UserCircle, X, CheckCircle, AlertTriangle, MessageSquare, Download, FileText, Send } from 'lucide-react';
import jsPDF from 'jspdf';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('Upcoming'); // Upcoming or Archive
  
  // AI Chat State
  const [activeAI, setActiveAI] = useState(null); // stores appt object
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const chatEndRef = useRef(null);

  const userId = localStorage.getItem('uhlis_user_id') || 2;

  const [newAppt, setNewAppt] = useState({
    doctor_id: '', date: '', time: '', type: 'Telehealth', symptoms: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [userId]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`http://localhost:8000/appointments/${userId}`);
      const data = await res.json();
      setAppointments(data);
    } catch (e) {} finally { setLoading(false); }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`http://localhost:8000/doctors`);
      const data = await res.json();
      setDoctors(data);
      if (data.length > 0) setNewAppt(prev => ({ ...prev, doctor_id: data[0].id }));
    } catch (e) {}
  };

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      const selectedDoc = doctors.find(d => d.id === parseInt(newAppt.doctor_id));
      await fetch('http://localhost:8000/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId), doctor_id: selectedDoc.id, doctor: selectedDoc.name,
          date: newAppt.date, time: newAppt.time, type: newAppt.type, symptoms: newAppt.symptoms
        })
      });
      setShowModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchAppointments();
    } catch (e) {}
  };

  const updateStatus = async (appId, status) => {
    try {
      await fetch(`http://localhost:8000/appointments/${appId}/status?status=${status}`, { method: 'PUT' });
      fetchAppointments();
    } catch (e) {}
  };

  const downloadInvoice = (appt) => {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text("UHLIS Medical Invoice", 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Invoice ID: #INV-${appt.id}${Math.floor(Math.random()*1000)}`, 20, 40);
      doc.text(`Date: ${appt.date} ${appt.time}`, 20, 50);
      doc.text(`Consultation Type: ${appt.type}`, 20, 60);
      doc.text(`Doctor: ${appt.doctor}`, 20, 70);
      
      doc.setLineWidth(0.5);
      doc.line(20, 80, 190, 80);
      
      doc.setFontSize(14);
      doc.text(`Total Fee: $${appt.fee}`, 20, 95);
      doc.text(`Status: PAID`, 20, 105);
      
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("Thank you for choosing UHLIS. This is an electronically generated invoice.", 20, 280);
      
      doc.save(`UHLIS_Invoice_${appt.date}.pdf`);
  };

  const sendAiMessage = async (e) => {
      e.preventDefault();
      if(!aiInput.trim()) return;
      const userMsg = { sender: 'user', text: aiInput };
      setAiMessages(prev => [...prev, userMsg]);
      const currentInput = aiInput;
      setAiInput("");
      
      try {
          const res = await fetch('http://localhost:8000/chat/ai', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ patient_id: parseInt(userId), message: currentInput })
          });
          if(res.ok) {
              const data = await res.json();
              setAiMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
          }
      } catch (e) {
          setAiMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I am offline." }]);
      }
  };

  useEffect(() => {
      if(activeAI) {
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
  }, [aiMessages, activeAI]);

  const openAIChat = (appt) => {
      setActiveAI(appt);
      setAiMessages([{ sender: 'ai', text: `Hi! I'm the UHLIS AI Assistant. I see you have an appointment with ${appt.doctor} for ${appt.symptoms || 'a general checkup'}. I can ask you a few pre-consultation questions to prepare notes for the doctor. How long have you been experiencing these symptoms?` }]);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(a => a.date >= todayStr && a.status !== 'Completed');
  const archive = appointments.filter(a => a.date < todayStr || a.status === 'Completed' || a.status === 'Cancelled');
  
  const displayAppts = activeTab === 'Upcoming' ? upcoming : archive;

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-6 pt-24 font-sans selection:bg-cyan-500/30">
      <Navbar />
      <div className="max-w-6xl mx-auto animate-fade-in">
        
        {showSuccess && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500/90 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 animate-bounce z-50">
            <CheckCircle size={20} /> Appointment Booked Successfully!
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointments & Consultations</h1>
            <p className="text-slate-400 mt-2 text-sm">Manage upcoming visits and pre-consultation AI sessions.</p>
          </div>
          
          <div className="flex items-center gap-4">
              <div className="flex bg-slate-900 border border-white/10 rounded-xl p-1">
                  <button onClick={() => setActiveTab('Upcoming')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Upcoming' ? 'bg-cyan-600/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>Upcoming</button>
                  <button onClick={() => setActiveTab('Archive')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'Archive' ? 'bg-cyan-600/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>Archive</button>
              </div>
              <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2">
                <Plus size={18} /> Book New
              </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading appointments...</div>
        ) : displayAppts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-white/5 rounded-3xl">
            <Calendar className="mx-auto text-slate-600 mb-4" size={48} />
            <div className="text-lg font-bold text-slate-300">No {activeTab} Appointments</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayAppts.map(appt => (
              <div key={appt.id} className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem] hover:border-cyan-500/30 transition-colors flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-cyan-400">
                        <UserCircle size={24} />
                        </div>
                        <div>
                        <h3 className="font-bold text-lg">{appt.doctor}</h3>
                        <div className="text-xs font-bold text-cyan-500 uppercase tracking-widest">{appt.type}</div>
                        </div>
                    </div>
                    </div>
                    
                    <div className="space-y-2 mt-4 bg-slate-950/50 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 flex items-center gap-2"><Calendar size={14}/> Date</span>
                            <span className="font-bold text-white">{appt.date}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 flex items-center gap-2"><Clock size={14}/> Time</span>
                            <span className="font-bold text-white">{appt.time}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t border-white/10 pt-2 mt-2">
                            <span className="text-slate-400">Fee Paid</span>
                            <span className="font-bold text-green-400">${appt.fee}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-2">
                    {activeTab === 'Upcoming' && appt.status !== 'Cancelled' ? (
                        <>
                        <button onClick={() => openAIChat(appt)} disabled={appt.status === 'Pending'} className={`w-full py-3 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 ${appt.status === 'Pending' ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30'}`}>
                            <MessageSquare size={16} /> {appt.status === 'Pending' ? 'Awaiting Approval' : 'Start AI Pre-Consultation'}
                        </button>
                        <div className="flex gap-2">
                            <button onClick={() => downloadInvoice(appt)} className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold flex justify-center items-center gap-1 hover:bg-slate-700"><Download size={14}/> Invoice</button>
                            <button onClick={() => updateStatus(appt.id, 'Cancelled')} className="flex-1 py-2 bg-red-900/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-900/40">Cancel</button>
                        </div>
                        </>
                    ) : (
                        <button onClick={() => downloadInvoice(appt)} className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-slate-700">
                            <FileText size={16}/> Download Invoice / Record
                        </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] w-full max-w-lg animate-fade-in shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Book Consultation</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleBook} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Select Clinician</label>
                <select className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50" value={newAppt.doctor_id} onChange={e => setNewAppt({...newAppt, doctor_id: e.target.value})} required>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Date</label>
                  <input type="date" required className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50" value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Time</label>
                  <input type="time" required className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50" value={newAppt.time} onChange={e => setNewAppt({...newAppt, time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-2"><AlertTriangle size={14} className="text-yellow-500" /> Symptom Triage</label>
                <textarea required placeholder="Briefly describe your symptoms..." className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50 h-24 resize-none" value={newAppt.symptoms} onChange={e => setNewAppt({...newAppt, symptoms: e.target.value})}></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">Pay & Confirm Booking</button>
            </form>
          </div>
        </div>
      )}

      {/* AI Pre-Consultation Chat Modal */}
      {activeAI && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end animate-fade-in">
              <div className="bg-slate-900 border-l border-white/10 w-full max-w-md h-full shadow-2xl flex flex-col">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900 z-10">
                      <div>
                          <h3 className="font-bold text-lg flex items-center gap-2"><MessageSquare className="text-indigo-400"/> AI Pre-Consultation</h3>
                          <p className="text-xs text-slate-400">Preparing notes for {activeAI.doctor}</p>
                      </div>
                      <button onClick={() => setActiveAI(null)} className="text-slate-500 hover:text-white"><X size={24}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/50 custom-scrollbar">
                      {aiMessages.map((msg, idx) => (
                          <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-300 border border-white/5 rounded-tl-none'}`}>
                                  {msg.text}
                              </div>
                          </div>
                      ))}
                      <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 bg-slate-900 border-t border-white/10">
                      <form onSubmit={sendAiMessage} className="flex gap-2">
                          <input type="text" placeholder="Describe how you feel..." className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" value={aiInput} onChange={(e) => setAiInput(e.target.value)} />
                          <button type="submit" disabled={!aiInput.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-xl font-bold disabled:opacity-50 transition-colors"><Send size={18}/></button>
                      </form>
                      <p className="text-center text-[10px] text-slate-500 mt-3">This AI summarizes your symptoms for the doctor. It is not medical advice.</p>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default Appointments;
