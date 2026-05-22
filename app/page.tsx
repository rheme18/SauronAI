'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowUp, Lock, ShieldAlert, Cpu, Plus, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ... (Diğer interface ve başlangıç kodları aynı kalmalı)

export default function Home() {
  const [input, setInput] = useState('');
  const [modelType, setModelType] = useState<'flash' | 'pro'>('flash');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // handleSendMessage fonksiyonuna güncelleme:
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          modelType: modelType 
        }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.content }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Input barı kısmı (Form içindeki yapı):
  return (
    // ... (Üst kısımlar aynı)
    <form onSubmit={handleSendMessage} className="w-full bg-white border border-neutral-200 rounded-2xl p-2 shadow-sm flex items-center gap-2">
      <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500">
        <Plus size={20} />
      </button>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
      
      <input
        type="text"
        placeholder="SauronAI'a görev ver..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none"
      />
      
      <select 
        value={modelType} 
        onChange={(e) => setModelType(e.target.value as 'flash' | 'pro')}
        className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 px-2 py-1 rounded-md border-none focus:outline-none"
      >
        <option value="flash">FLASH</option>
        <option value="pro">PRO</option>
      </select>

      <button type="submit" className="w-8 h-8 bg-neutral-950 text-white rounded-lg flex items-center justify-center">
        <ArrowUp size={14} />
      </button>
    </form>
    // ... (Geri kalan kısım aynı)
  );
}
