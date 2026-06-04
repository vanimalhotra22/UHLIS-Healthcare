import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import { Send, Bot, User, Mic, Paperclip, Sparkles, HeartPulse, BrainCircuit } from 'lucide-react';

const Chat = () => {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Initial Message
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello, Vani Malhotra. I am your UHLIS Health Copilot. I have access to verified medical guidelines and diet plans. How can I assist you?", 
      sender: 'bot' 
    }
  ]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMsg = { id: Date.now(), text: text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // 2. CONNECT TO REAL BACKEND (Local Llama 3)
      const response = await fetch('http://localhost:8000/chat/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            patient_id: 2, // Hardcoded 'Vani Malhotra'
            message: text 
        })
      });

      const data = await response.json();

      // 3. Add AI Response
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: data.reply, sender: 'bot' }]);

    } catch (error) {
      console.error("AI Error:", error);
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "⚠️ Error: AI Brain is offline. Please start 'uvicorn main:app'.", sender: 'bot' }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pt-20 text-white">
      <Navbar />

      <div className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col h-[calc(100vh-80px)]">
        
        {/* Header Badge */}
        <div className="flex items-center justify-center mb-6">
          <div className="px-4 py-2 bg-slate-900 rounded-full border border-slate-800 flex items-center gap-2 text-sm text-slate-400 shadow-lg shadow-cyan-900/10">
            <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>AI Model: <strong>Llama 3 (Local Medical Engine)</strong></span>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {/* Bot Icon */}
              {msg.sender === 'bot' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
                  <Bot size={20} className="text-white" />
                </div>
              )}

              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl max-w-[80%] leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-none shadow-md' 
                  : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
              }`}>
                {msg.text}
              </div>

              {/* User Icon */}
              {msg.sender === 'user' && (
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0 border border-slate-600">
                  <User size={20} className="text-slate-300" />
                </div>
              )}
            </div>
          ))}

          {/* Typing Animation */}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center">
                 <Bot size={20} className="text-white" />
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>

        {/* Quick Prompts (Only if chat is empty) */}
        {messages.length < 3 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 mt-6">
            <SuggestionBtn text="Diet for Diabetes?" onClick={() => handleSend("What is the recommended diet for Diabetes?")} />
            <SuggestionBtn text="Flu Symptoms?" onClick={() => handleSend("How do I manage Flu symptoms at home?")} />
            <SuggestionBtn text="Bone Recovery?" onClick={() => handleSend("What foods help heal a bone fracture?")} />
            <SuggestionBtn text="Keto Risks?" onClick={() => handleSend("Is the Keto diet safe for everyone?")} />
          </div>
        )}

        {/* Input Bar */}
        <div className="mt-4 bg-slate-900 p-2 rounded-xl border border-slate-800 flex items-center gap-2 relative shadow-lg">
          <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Paperclip size={20} />
          </button>
          
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask UHLIS about medical facts, diets, or recovery..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none px-2"
          />
          
          <button className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <Mic size={20} />
          </button>

          <button 
            onClick={() => handleSend()}
            disabled={isTyping}
            className="p-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white rounded-lg transition-all shadow-lg shadow-cyan-900/20"
          >
            <Send size={20} />
          </button>
        </div>
        
        <div className="text-center text-xs text-slate-600 mt-2">
          UHLIS Copilot uses verified medical data but is an AI assistant. Consult a real doctor for emergencies.
        </div>
      </div>
    </div>
  );
};

const SuggestionBtn = ({ text, onClick }) => (
  <button 
    onClick={onClick}
    className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-xs text-slate-300 transition-all text-left flex items-center gap-2 group hover:border-cyan-500/30"
  >
    <HeartPulse className="w-4 h-4 text-cyan-500 group-hover:text-cyan-400" />
    {text}
  </button>
);

export default Chat;