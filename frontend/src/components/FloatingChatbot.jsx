import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Trash2, Minimize2 } from 'lucide-react';

const PATIENT_ID = 2; // Active patient ID

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I'm **UHLIS Copilot** — your AI health assistant. I can help with medical questions, check your prescriptions, or guide you to the right module. How can I assist you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const QUICK_PROMPTS = [
    { label: '💊 My Meds', text: 'What are my current medications?' },
    { label: '🍎 Diet Tips', text: 'What diet should I follow for my condition?' },
    { label: '🩺 Symptom Check', text: 'I have a headache and fever. What should I do?' },
    { label: '📋 Next Steps', text: 'What should I do for my next check-up?' },
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  const handleSend = async (textOverride) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:8000/chat/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: PATIENT_ID, message: text })
      });
      const data = await res.json();
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply || 'I received your message.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      if (!isOpen || isMinimized) setUnreadCount(c => c + 1);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: '⚠️ **UHLIS Copilot is offline.** Make sure the backend server is running (`uvicorn main:app --reload`).',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      sender: 'bot',
      text: "Chat cleared. How can I help you?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const renderText = (text) => {
    // Simple markdown: **bold** and line breaks
    return text
      .split('\n')
      .map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {parts.map((p, j) =>
              p.startsWith('**') && p.endsWith('**')
                ? <strong key={j}>{p.slice(2, -2)}</strong>
                : p
            )}
            {i < text.split('\n').length - 1 && <br />}
          </span>
        );
      });
  };

  return (
    <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: '380px',
          height: isMinimized ? '60px' : '540px',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(15, 23, 42, 0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(6,182,212,0.1)',
          marginBottom: '16px',
          overflow: 'hidden',
          transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px',
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#f1f5f9' }}>UHLIS Copilot</div>
                <div style={{ fontSize: '11px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
                  Medical AI · Online
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={clearChat}
                title="Clear chat"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#475569', padding: '6px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'none'; }}
              >
                <Trash2 size={15} />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#475569', padding: '6px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'none'; }}
              >
                <Minimize2 size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#475569', padding: '6px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'none'; }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.1) transparent',
              }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                  }}>
                    {msg.sender === 'bot' && (
                      <div style={{
                        width: '28px', height: '28px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Bot size={14} color="white" />
                      </div>
                    )}
                    <div style={{ maxWidth: '80%' }}>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: msg.sender === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: msg.sender === 'user'
                          ? 'linear-gradient(135deg, #0891b2, #6d28d9)'
                          : 'rgba(30, 41, 59, 0.8)',
                        border: msg.sender === 'bot' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        color: '#e2e8f0',
                        fontSize: '13px',
                        lineHeight: 1.55,
                      }}>
                        {renderText(msg.text)}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: '#334155',
                        marginTop: '3px',
                        textAlign: msg.sender === 'user' ? 'right' : 'left',
                        paddingInline: '4px',
                      }}>
                        {msg.time}
                      </div>
                    </div>
                    {msg.sender === 'user' && (
                      <div style={{
                        width: '28px', height: '28px', flexShrink: 0,
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <User size={14} color="#94a3b8" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '28px', height: '28px',
                      background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                      borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Bot size={14} color="white" />
                    </div>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '14px 14px 14px 4px',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', gap: '4px', alignItems: 'center',
                    }}>
                      {[0, 150, 300].map(delay => (
                        <span key={delay} style={{
                          width: '7px', height: '7px',
                          background: '#06b6d4',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: `bounce 1s ease-in-out ${delay}ms infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick prompts — show only at start */}
                {messages.length <= 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, paddingLeft: '4px' }}>
                      Quick Prompts
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {QUICK_PROMPTS.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(p.text)}
                          style={{
                            background: 'rgba(30,41,59,0.5)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '10px',
                            padding: '8px 10px',
                            color: '#94a3b8',
                            fontSize: '11px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s',
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'; e.currentTarget.style.color = '#e2e8f0'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={scrollRef} />
              </div>

              {/* Input bar */}
              <div style={{
                padding: '12px 14px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.2)',
                flexShrink: 0,
              }}>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  background: 'rgba(30,41,59,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '6px 8px 6px 14px',
                  transition: 'border-color 0.15s',
                }}>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Ask UHLIS anything..."
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      color: '#e2e8f0',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                    }}
                    onFocus={e => e.currentTarget.parentNode.style.borderColor = 'rgba(6,182,212,0.4)'}
                    onBlur={e => e.currentTarget.parentNode.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={isTyping || !input.trim()}
                    style={{
                      width: '34px', height: '34px',
                      background: input.trim() && !isTyping
                        ? 'linear-gradient(135deg, #06b6d4, #8b5cf6)'
                        : 'rgba(255,255,255,0.05)',
                      border: 'none',
                      borderRadius: '9px',
                      cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <Send size={15} color={input.trim() && !isTyping ? 'white' : '#475569'} />
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: '#1e293b', marginTop: '6px', textAlign: 'center' }}>
                  UHLIS AI · Not a substitute for professional medical advice
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Toggle Button */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end' }}>
        {/* Unread badge */}
        {!isOpen && unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-6px', right: '-6px',
            width: '20px', height: '20px',
            background: '#ef4444',
            borderRadius: '50%',
            color: 'white',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #0f172a',
            zIndex: 1,
          }}>
            {unreadCount}
          </div>
        )}

        <button
          onClick={isOpen ? () => setIsOpen(false) : handleOpen}
          style={{
            width: '58px', height: '58px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(6,182,212,0.4), 0 0 0 1px rgba(6,182,212,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(6,182,212,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(6,182,212,0.4)'; }}
        >
          {isOpen
            ? <X size={22} color="white" />
            : <MessageCircle size={22} color="white" />
          }
        </button>
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default FloatingChatbot;
