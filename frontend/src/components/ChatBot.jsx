import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "I am HYDRA. Accessing database... Ready. What do you need to investigate?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // Make sure this matches your Flask API URL
      const res = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "⚠️ Connection Error: Unable to reach HYDRA mainframe." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      
      {/* TOGGLE BUTTON */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all hover:scale-110 flex items-center gap-2 group animate-in slide-in-from-bottom-4"
        >
          <Bot size={24} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap font-bold">
            AI Investigator
          </span>
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="w-80 md:w-96 bg-[#111] border border-red-900/50 rounded-2xl shadow-2xl flex flex-col h-[500px] overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* HEADER */}
          <div className="bg-gradient-to-r from-red-900 to-[#111] p-4 flex justify-between items-center border-b border-red-900/30">
            <div className="flex items-center gap-2">
              <div className="bg-black/50 p-1.5 rounded-lg border border-red-500/50">
                <Sparkles size={16} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm tracking-wide">HYDRA INTELLIGENCE</h3>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* MESSAGES AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a] custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-red-900/20 border border-red-900/50'}`}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} className="text-red-500"/>}
                </div>
                <div className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-gray-800 text-white rounded-tr-none' 
                    : 'bg-[#161616] border border-gray-800 text-gray-300 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-red-900/20 border border-red-900/50 flex items-center justify-center">
                  <Bot size={14} className="text-red-500"/>
                </div>
                <div className="bg-[#161616] border border-gray-800 p-3 rounded-xl rounded-tl-none flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <form onSubmit={handleSend} className="p-3 bg-[#111] border-t border-gray-800 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query the database..." 
              className="flex-1 bg-[#050505] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-900 transition-colors placeholder:text-gray-600"
            />
            <button 
              type="submit" 
              disabled={isTyping || !input.trim()}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-600 text-white p-2 rounded-lg transition-colors"
            >
              <Send size={16} />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};

export default ChatBot;