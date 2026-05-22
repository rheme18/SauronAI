'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowUp, Lock, ShieldAlert, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'sauron') {
      setIsAuthorized(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPassword('');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setHasStarted(true);
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      const data = await response.json();
      
      if (response.ok && data.content) {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', content: data.content },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', content: `⚠️ Hata: ${data.error}` },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: '🔴 Sunucuyla bağlantı kurulurken kritik bir hata oluştu.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. ŞİFRE DOĞRULAMA PANELİ (Giriş Ekranı)
  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen w-full bg-white bg-grid flex items-center justify-center p-4">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-neutral-100 blur-[120px] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-white border border-neutral-200/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] backdrop-blur-md z-10"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-white mb-4 shadow-md">
              <Lock size={22} />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950 mb-1">SauronAI Güvenlik</h1>
            <p className="text-xs text-neutral-400">Devam etmek için yetkili erişim şifresini girin.</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-center font-medium tracking-widest text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:bg-white transition-all duration-300 placeholder:tracking-normal placeholder:text-neutral-400"
            />
            <AnimatePresence>
              {authError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  <ShieldAlert size={14} /> <span>Şifre hatalı, patron!</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button type="submit" className="w-full py-4 bg-neutral-950 hover:bg-neutral-900 text-white text-sm font-medium rounded-2xl transition-colors duration-200">
              Sistemi Başlat
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // 2. ANA YAPAY ZEKA ARAYÜZÜ
  return (
    <div className="relative min-h-screen w-full bg-white bg-grid flex flex-col">
      {/* Sabit Üst Menü */}
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-neutral-100 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-neutral-950 rounded-lg flex items-center justify-center text-white"><Cpu size={14} /></div>
          <span className="font-bold text-sm tracking-tight text-neutral-950">SauronAI</span>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Çevrimiçi
        </span>
      </motion.header>

      {/* Dinamik İçerik Alanı */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-4 pt-24 pb-32">
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            /* İLK GİRİŞ EKRANI: TAM ORTADA DURAN GÖVDE */
            <motion.div 
              key="landing"
              exit={{ opacity: 0, y: -50, transition: { duration: 0.4 } }}
              className="w-full flex flex-col items-center justify-center text-center py-12"
            >
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="w-16 h-16 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Sparkles size={28} className="text-neutral-950 stroke-[1.5]" />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-950 mb-3">
                Dalmaya Hazır Mısın?
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-sm text-neutral-400 max-w-sm mb-10 font-light">
                SauronAI mutlak stratejik deha ile emrinde. Gelişmiş bellek algoritmaları aktiftir.
              </motion.p>

              {/* Ortadaki Büyük Giriş Kutusu */}
              <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} onSubmit={handleSendMessage} className="w-full max-w-xl bg-white border border-neutral-200 p-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] focus-within:border-neutral-400 transition-all duration-300 flex items-center">
                <input
                  type="text"
                  placeholder="SauronAI'a bir görev ver..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent px-4 py-3 text-neutral-900 focus:outline-none placeholder:text-neutral-400 text-sm"
                />
                <button type="submit" disabled={!input.trim()} className="w-10 h-10 bg-neutral-950 hover:bg-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-300 text-white rounded-xl flex items-center justify-center transition-all duration-200 shrink-0">
                  <ArrowUp size={16} className="stroke-[2.5]" />
                </button>
              </motion.form>
            </motion.div>
          ) : (
            /* AKTİF SOHBET AKIŞI (Mesaj atınca burası tetiklenir) */
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col gap-6">
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${msg.role === 'user' ? 'bg-neutral-950 text-white rounded-tr-none' : 'bg-neutral-50 text-neutral-900 border border-neutral-100 rounded-tl-none prose'}`}>
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-center gap-2.5 text-neutral-400 text-xs font-medium p-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  </div>
                  <span>SauronAI analiz ediyor...</span>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SABİT ALT INPUT BAR (Sadece sohbet başladıktan sonra aşağıdan fırlar) */}
      <AnimatePresence>
        {hasStarted && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: 'spring', damping: 25 }} className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4 z-40">
            <div className="w-full max-w-xl mx-auto">
              <form onSubmit={handleSendMessage} className="w-full bg-white border border-neutral-200 rounded-2xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.03)] focus-within:border-neutral-400 transition-all duration-300 flex items-center">
                <input
                  type="text"
                  placeholder="Sohbete devam et..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 bg-transparent px-4 py-2.5 text-sm text-neutral-900 focus:outline-none placeholder:text-neutral-400"
                />
                <button type="submit" disabled={!input.trim() || isLoading} className="w-9 h-9 bg-neutral-950 hover:bg-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-300 text-white rounded-xl flex items-center justify-center transition-all duration-200 shrink-0">
                  <ArrowUp size={14} className="stroke-[2.5]" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}