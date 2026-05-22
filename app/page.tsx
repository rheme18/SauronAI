'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowUp, Lock, ShieldAlert, Plus, X, FileText, ImageIcon, Brain, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'text';
  mimeType: string;
  base64?: string;
  text?: string;
  previewUrl?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  attachments?: Attachment[];
}

type ModelType = 'flash' | 'pro';

const MODEL_LABELS: Record<ModelType, string> = {
  flash: 'Flash 2.5',
  pro: 'Pro 2.5',
};

// ----------------------------------------------------------------
// CoT Panel Bileşeni (İnce ve Uzun Minimalist Tasarım)
// ----------------------------------------------------------------
function ThinkingPanel({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2 w-full max-w-xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[11px] font-medium text-neutral-500 bg-neutral-50 border border-neutral-200/60 px-3 py-1 rounded-full hover:bg-neutral-100 hover:text-neutral-800 transition-all duration-200"
      >
        <Brain size={11} className="text-violet-500 animate-pulse" />
        <span>SauronAI Düşünce Süreci</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={11} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 text-[11px] text-neutral-500 bg-neutral-50/50 border border-neutral-200/40 rounded-xl p-3 leading-relaxed max-h-36 overflow-y-auto font-mono whitespace-pre-wrap border-l-2 border-l-violet-400">
              {thinking}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------
// Dosya Küçük Kart Bileşeni
// ----------------------------------------------------------------
function AttachmentChip({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  return (
    <div className="relative flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl p-1.5 pr-2.5 text-xs text-neutral-700 group shadow-sm">
      {att.type === 'image' ? (
        att.previewUrl ? (
          <img src={att.previewUrl} alt={att.name} className="w-5 h-5 rounded-md object-cover" />
        ) : (
          <ImageIcon size={12} className="text-neutral-400" />
        )
      ) : (
        <FileText size={12} className="text-neutral-400" />
      )}
      <span className="max-w-[90px] truncate font-medium text-[11px]">{att.name}</span>
      <button
        onClick={onRemove}
        className="ml-0.5 text-neutral-400 hover:text-neutral-900 transition-colors"
      >
        <X size={11} />
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// Bağımsız InputBar Bileşeni (Focus Sorununu Kökten Çözen Yapı)
// ----------------------------------------------------------------
interface InputBarProps {
  input: string;
  setInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  placeholder: string;
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  attachMenuOpen: boolean;
  setAttachMenuOpen: (v: boolean) => void;
  model: ModelType;
  setModel: (m: ModelType) => void;
  modelMenuOpen: boolean;
  setModelMenuOpen: (v: boolean) => void;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  modelMenuRef: React.RefObject<HTMLDivElement | null>;
  attachMenuRef: React.RefObject<HTMLDivElement | null>;
}

function InputBar({
  input,
  setInput,
  onSubmit,
  isLoading,
  placeholder,
  attachments,
  setAttachments,
  attachMenuOpen,
  setAttachMenuOpen,
  model,
  setModel,
  modelMenuOpen,
  setModelMenuOpen,
  imageInputRef,
  fileInputRef,
  modelMenuRef,
  attachMenuRef,
}: InputBarProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="w-full bg-white border border-neutral-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] focus-within:border-neutral-300 focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300"
    >
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pt-3">
          {attachments.map((att) => (
            <AttachmentChip
              key={att.id}
              att={att}
              onRemove={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
            />
          ))}
        </div>
      )}

      <div className="flex items-center p-2">
        <div className="relative" ref={attachMenuRef}>
          <button
            type="button"
            onClick={() => setAttachMenuOpen(!attachMenuOpen)}
            className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 rounded-xl transition-all duration-200 shrink-0"
          >
            <Plus size={16} className={`transition-transform duration-200 ${attachMenuOpen ? 'rotate-45' : ''}`} />
          </button>

          <AnimatePresence>
            {attachMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-12 left-0 bg-white border border-neutral-200/80 backdrop-blur-md rounded-2xl shadow-xl p-1.5 min-w-[140px] z-50"
              >
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors"
                >
                  <ImageIcon size={13} className="text-neutral-400" />
                  Resim Yükle
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors"
                >
                  <FileText size={13} className="text-neutral-400" />
                  Dosya Yükle
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:outline-none placeholder:text-neutral-400"
        />

        <div className="relative mr-1" ref={modelMenuRef}>
          <button
            type="button"
            onClick={() => setModelMenuOpen(!modelMenuOpen)}
            className="flex items-center gap-1 h-8 px-2.5 text-[11px] font-semibold text-neutral-500 bg-neutral-50 border border-neutral-200/70 rounded-xl hover:border-neutral-300 hover:text-neutral-800 transition-all duration-200 shrink-0"
          >
            {MODEL_LABELS[model]}
            <motion.span animate={{ rotate: modelMenuOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown size={10} />
            </motion.span>
          </button>

          <AnimatePresence>
            {modelMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-10 right-0 bg-white border border-neutral-200 rounded-2xl shadow-xl p-1.5 min-w-[110px] z-50"
              >
                {(Object.keys(MODEL_LABELS) as ModelType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setModel(m); setModelMenuOpen(false); }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-xl transition-colors ${model === m ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
                  >
                    {MODEL_LABELS[m]}
                    {model === m && <span className="w-1 h-1 rounded-full bg-emerald-400 ml-2" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="submit"
          disabled={(!input.trim() && attachments.length === 0) || isLoading}
          className="w-9 h-9 bg-neutral-950 hover:bg-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-300 text-white rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 shadow-sm"
        >
          <ArrowUp size={14} className="stroke-[2.5]" />
        </button>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------
// Ana Uygulama Alanı
// ----------------------------------------------------------------
export default function Home() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState(false);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [model, setModel] = useState<ModelType>('flash');
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Dışarı tıklama referansları
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Otomatik aşağı kaydırma mekanizması
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Sayfada herhangi bir yere basıldığında açık menüleri kapatma mekanizması
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (modelMenuRef.current && !modelMenuRef.current.contains(target)) {
        setModelMenuOpen(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(target)) {
        setAttachMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(',')[1]);
      r.onerror = () => rej(new Error('Dosya okunamadı'));
      r.readAsDataURL(file);
    });

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(new Error('Dosya okunamadı'));
      r.readAsText(file);
    });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const newAtts: Attachment[] = [];
      for (const file of files) {
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';

        let base64: string | undefined;
        let text: string | undefined;
        let previewUrl: string | undefined;

        if (isImage || isPdf) {
          base64 = await readFileAsBase64(file);
          if (isImage) previewUrl = URL.createObjectURL(file);
        } else {
          text = await readFileAsText(file);
        }

        newAtts.push({
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: isImage ? 'image' : isPdf ? 'pdf' : 'text',
          mimeType: file.type || 'application/octet-stream',
          base64,
          text,
          previewUrl,
        });
      }

      setAttachments((prev) => [...prev, ...newAtts]);
      setAttachMenuOpen(false);
      e.target.value = '';
    },
    []
  );

  // ----------------------------------------------------------------
  // Harf Harf Akıcı Streaming Efekt Motoru (Queue Pattern)
  // ----------------------------------------------------------------
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    const currentAttachments = [...attachments];
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setHasStarted(true);
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', thinking: undefined },
    ]);

    try {
      const chatHistory = [...messages, userMessage];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          model,
          attachments: currentAttachments.map((a) => ({
            name: a.name,
            type: a.type,
            mimeType: a.mimeType,
            base64: a.base64,
            text: a.text,
          })),
        }),
      });

      if (!response.ok || !response.body) throw new Error('Stream başlatılamadı');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let rawBuffer = '';
      let renderedText = '';
      let currentThinking = '';
      let textQueue: string[] = [];
      let isTyping = false;

      // Sıradaki harfleri ekrana akıcı basan alt motor
      const processQueue = () => {
        if (textQueue.length === 0) {
          isTyping = false;
          return;
        }
        isTyping = true;
        const nextChar = textQueue.shift();
        rawBuffer += nextChar;

        // Gelişmiş Regex ile CoT temizliği ve ayrıştırması
        let displayText = rawBuffer;
        const thinkMatch = rawBuffer.match(/<think>([\s\S]*?)<\/think>/);
        const unclosedThink = rawBuffer.match(/<think>([\s\S]*?)$/);

        if (thinkMatch) {
          currentThinking = thinkMatch[1];
          displayText = rawBuffer.replace(/<think>([\s\S]*?)<\/think>/, '');
        } else if (unclosedThink) {
          currentThinking = unclosedThink[1];
          displayText = rawBuffer.replace(/<think>([\s\S]*?)$/, '');
        }

        renderedText = displayText.trim();

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: renderedText, thinking: currentThinking || undefined }
              : m
          )
        );

        // Harf basma hızı (Ms cinsinden, daha hızlı akış için optimize)
        setTimeout(processQueue, 4);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.done) {
              setIsLoading(false);
              break;
            }
            if (parsed.error) {
              textQueue.push(...`⚠️ Hata: ${parsed.error}`.split(''));
              if (!isTyping) processQueue();
              break;
            }
            if (parsed.delta) {
              textQueue.push(...parsed.delta.split(''));
              if (!isTyping) processQueue();
            }
          } catch {
            // Buffer yarım kalırsa yakalama hatasını pas geç
          }
        }
      }

      // Kalan karakterler varsa boşaltılması beklenir
      const checkFinalData = () => {
        if (textQueue.length > 0) {
          setTimeout(checkFinalData, 50);
        } else {
          setIsLoading(false);
        }
      };
      checkFinalData();

    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: '🔴 Sunucuyla bağlantı kurulurken kritik bir hata oluştu, patron.' }
            : m
        )
      );
      setIsLoading(false);
    }
  };

  // Ortak input parametre paketi
  const inputBarProps = {
    input, setInput, onSubmit: handleSendMessage, isLoading,
    placeholder: hasStarted ? "Sohbete devam et..." : "SauronAI'a bir görev ver...",
    attachments, setAttachments, attachMenuOpen, setAttachMenuOpen,
    model, setModel, modelMenuOpen, setModelMenuOpen,
    imageInputRef, fileInputRef, modelMenuRef, attachMenuRef
  };

  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen w-full bg-white flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-neutral-50 blur-[130px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm bg-white/70 backdrop-blur-xl border border-neutral-200/80 rounded-3xl p-7 shadow-[0_20px_50px_rgba(0,0,0,0.02)] z-10"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-12 h-12 bg-neutral-950 rounded-2xl flex items-center justify-center text-white mb-4 shadow-sm"
            >
              <Lock size={18} />
            </motion.div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-950">SauronAI Terminal</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Erişim yetkisini doğrulamak için şifreyi gir.</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-center font-mono text-sm tracking-widest text-neutral-900 focus:outline-none focus:border-neutral-950 transition-all duration-200 placeholder:tracking-normal placeholder:text-neutral-300"
            />
            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-[11px] font-semibold text-red-600 bg-red-50/60 backdrop-blur-sm p-2.5 rounded-xl border border-red-100"
                >
                  <ShieldAlert size={13} /> <span>Şifre hatalı, patron! Sızmaya çalışma. 💀</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="submit"
              className="w-full py-3 bg-neutral-950 hover:bg-neutral-900 active:scale-[0.99] text-white text-xs font-semibold rounded-xl transition-all duration-150 shadow-sm"
            >
              Sistemi Ateşle
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-white flex flex-col selection:bg-neutral-100 selection:text-neutral-950">
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.csv,.js,.ts,.py,.json,.html,.css" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'file')} />

      {/* Header (Favicon Entegre Edilmiş Durumda) */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 h-14 bg-white/70 backdrop-blur-md border-b border-neutral-100 z-50 px-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <img 
            src="/favicon.ico" 
            alt="SauronAI" 
            className="w-5 h-5 rounded-md object-contain"
            onError={(e) => {
              // Eğer favicon.ico henüz dizinde yoksa kırık görünmesin diye fallback
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="font-bold text-xs tracking-tight text-neutral-950">SauronAI</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200/40">{MODEL_LABELS[model]}</span>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Aktif
          </span>
        </div>
      </motion.header>

      {/* Ana Gövde Alanı */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-4 pt-20 pb-32">
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            <motion.div
              key="landing"
              exit={{ opacity: 0, y: -20, transition: { duration: 0.25 } }}
              className="w-full flex flex-col items-center justify-center text-center py-10"
            >
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="w-12 h-12 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
              >
                <Sparkles size={20} className="text-neutral-950 stroke-[1.8]" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-2xl font-bold tracking-tight text-neutral-950 mb-2"
              >
                Karanlık Zeka Çevrimiçi.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xs text-neutral-400 max-w-xs mb-8 font-normal leading-relaxed"
              >
                SauronAI mutlak stratejik deha ve toksik karizmayla emrinde. Komut ver zavallı varlık.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="w-full max-w-lg">
                <InputBar {...inputBarProps} />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col gap-5">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex w-full flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5 justify-end max-w-[85%]">
                      {msg.attachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-xl px-2 py-1 text-[10px] font-medium text-neutral-600 shadow-sm">
                          {att.type === 'image' && att.previewUrl ? (
                            <img src={att.previewUrl} alt={att.name} className="w-4 h-4 rounded object-cover" />
                          ) : (
                            <FileText size={10} />
                          )}
                          <span className="max-w-[80px] truncate">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.role === 'assistant' && msg.thinking && (
                    <ThinkingPanel thinking={msg.thinking} />
                  )}

                  {(msg.content || msg.role === 'assistant') && (
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-neutral-950 text-white rounded-tr-none font-medium'
                          : 'bg-neutral-50/70 text-neutral-900 border border-neutral-200/50 rounded-tl-none prose prose-neutral max-w-none shadow-sm'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : msg.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      ) : (
                        <span className="text-neutral-400 font-mono text-[10px] animate-pulse">veri hatları işleniyor...</span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-center gap-2 text-neutral-400 text-[10px] font-semibold pl-2">
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="font-mono">SauronAI analiz ediyor...</span>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {hasStarted && (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            transition={{ type: 'spring', damping: 28 }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-5 px-4 z-40"
          >
            <div className="w-full max-w-lg mx-auto">
              <InputBar {...inputBarProps} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
