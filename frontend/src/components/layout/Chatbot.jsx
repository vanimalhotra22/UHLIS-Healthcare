import React, { useState } from 'react';
import { MessageSquare, X, Send, HeartPulse } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "System Active. I can analyze physical symptoms, heart patterns, or mental stress. What do you need?", isBot: true }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages([...messages, { text: userMsg, isBot: false }]);
    setInput("");

    // Simulate AI Response based on keywords
    setTimeout(() => {
      let response = "I'm analyzing your biometrics...";
      if (userMsg.toLowerCase().includes("heart")) {
        response = "Reviewing cardiac history. Your HRV is low today. SOLUTION: Initiate 5-min 'Box Breathing' now and avoid caffeine for 4 hours.";
      } else if (userMsg.toLowerCase().includes("tired")) {
        response = "SleepLens data shows low REM. SOLUTION: Schedule a 20-min power nap at 2:00 PM to restore cognitive function.";
      } else {
         response = "Data logged. I have adjusted your daily optimization plan to prioritize recovery.";
      }
      setMessages(prev => [...prev, { text: response, isBot: true }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 md:w-96 bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 flex justify-between items-center">
             <div className="flex items-center gap-2 font-bold text-white">
                <HeartPulse className="w-5 h-5" /> AI Health Copilot
             </div>
             <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white"><X size={18}/></button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
             {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                   <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.isBot ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-cyan-600 text-white rounded-tr-none'}`}>
                      {msg.text}
                   </div>
                </div>
             ))}
          </div>

          <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
             <input 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && handleSend()}
               placeholder="Ask for a solution..." 
               className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
             />
             <button onClick={handleSend} className="p-2 bg-cyan-600 rounded-lg text-white hover:bg-cyan-500"><Send size={18} /></button>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg shadow-cyan-500/30 flex items-center justify-center text-white hover:scale-105 transition-transform"
      >
        <MessageSquare className="w-7 h-7" />
      </button>
    </div>
  );
};

export default Chatbot;