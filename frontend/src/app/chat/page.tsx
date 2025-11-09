"use client";

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Chat() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll animado al final cuando cambien los mensajes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const send = async () => {
    if (!input) return;
    
    // const oldMessages = messages;
    const newMessages = [...messages, {role: 'user', content: input}];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        // message: input,
        history: newMessages
      };
      
      console.log('📤 Enviando al backend:', payload);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(`${apiUrl}/chat/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      console.log('📥 Respuesta del backend:', data);
      
      setMessages(prev => [...prev, {role: 'assistant', content: data.response}]);
    } catch {
      setMessages(prev => [...prev, {role: 'assistant', content: 'Error'}]);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-8.6rem)] bg-white py-8 md:py-12 lg:py-16 xl:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-xl sm:text-2xl font-light text-black mb-2">
            Chat MIMIC-IV
          </h1>
          <p className="text-gray-600 text-sm">
            Consulta la base de datos usando lenguaje natural
          </p>
        </div>

        {/* Chat Container */}
        <div className="max-w-3xl mx-auto">
          <div ref={chatContainerRef} className="bg-gray-50 border border-gray-200 rounded-lg p-6 h-[40vh] xl:h-[55vh] overflow-y-auto mb-6">
            {messages.map((m, i) => (
              <div key={i} className={`mb-4 ${m.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${
                   m.role === 'user' 
                     ? 'bg-black text-white text-left' 
                     : 'bg-white border border-gray-200 text-gray-900'
                 }`}>
                   <div className="text-sm font-light">
                     {m.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none [&_p:not(:last-child)]:mb-4 [&_li]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4">
                         <ReactMarkdown>{m.content}</ReactMarkdown>
                       </div>
                     ) : (
                       m.content
                     )}
                   </div>
                 </div>
              </div>
            ))}
            {loading && (
              <div className="text-gray-500 text-sm font-light flex items-center ml-1">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-[bounce_0.8s_infinite] [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-[bounce_0.8s_infinite] [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-[bounce_0.8s_infinite]"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Pregunta algo..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm font-light focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
            />
            <button 
              onClick={send} 
              disabled={loading}
              className="bg-black text-white px-6 py-3 rounded-lg text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:hover:bg-black"
            >
              Enviar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
} 