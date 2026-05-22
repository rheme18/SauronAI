'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowUp, Lock, ShieldAlert, Plus, X, FileText, ImageIcon, Brain, ChevronDown, Menu, MessageSquare, Trash2 } from 'lucide-react';
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

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

type ModelType = 'flash' | 'pro';

const MODEL_LABELS: Record<ModelType, string> = {
  flash: 'Flash 2.5',
  pro: 'Pro 2.5',
};

// ----------------------------------------------------------------
// İnce Uzun Minimalist CoT (Düşünce Zinciri) Paneli
// ----------------------------------------------------------------
function ThinkingPanel({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3 w-full max-w-2xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[11px] font-semibold text-neutral-500 bg-neutral-50/80 border border-neutral-200/60 px-3 py-1 rounded-full hover:bg-neutral-100/80 hover:text-neutral-800 transition-all duration-200 shadow-sm"
      >
        <Brain size={12} className="text-purple-500 animate-pulse" />
        <span>SauronAI Düşünce Hattı</span>
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
            <div className="mt-1.5 text-[11px] text-neutral-500 bg-neutral-50/30 border border-neutral-200/40 border-l-2 border-l-purple-400 rounded-xl p-3 leading-relaxed max-h-32 overflow-y-auto font-mono whitespace-pre-wrap">
              {thinking}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------
// Dosya Önizleme Chip Bileşeni
// ----------------------------------------------------------------
function AttachmentChip({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  return (
    <div className="relative flex items-center gap-1.5 bg-neutral-50 border border-neutral-200/80 rounded-xl p-1.5 pr-2.5 text-xs text-neutral-700 shadow-sm animate-fade-in">
      {att.type === 'image' && att.previewUrl ? (
        <img src={att.previewUrl} alt={att.name} className="w-5 h-5 rounded-md object-cover" />
      ) : (
        <FileText size={12} className="text-neutral-400" />
      )}
      <span className="max-w-[100px] truncate font-medium text-[11px]">{att.name}</span>
      <button onClick={onRemove} className="ml-0.5 text-neutral-400 hover:text-neutral-900 transition-colors">
        <X size={11} />
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// Bağımsız Giriş / Input Alanı (Focus Kaybını Önleyen Ana Yapı)
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
  input, setInput, onSubmit, isLoading, placeholder,
  attachments, setAttachments, attachMenuOpen, setAttachMenuOpen,
  model, setModel, modelMenuOpen, setModelMenuOpen,
  imageInputRef, fileInputRef, modelMenuRef, attachMenuRef
}: InputBarProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="w-full bg-white border border-neutral-200/90 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.02)] focus-within:border-neutral-350 focus-within:shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-all duration-300"
    >
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3.5">
          {attachments.map((att) => (
            <AttachmentChip
              key={att.id}
              att={att}
              onRemove={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
            />
          ))}
        </div>
      )}

      <div className="flex items-center p-2.5">
        <div className="relative" ref={attachMenuRef}>
          <button
            type="button"
            onClick={() => setAttachMenuOpen(!attachMenuOpen)}
            className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 rounded-2xl transition-all duration-200 shrink-0"
          >
            <Plus size={18} className={`transition-transform duration-250 ${attachMenuOpen ? 'rotate-45' : ''}`} />
          </button>

          <AnimatePresence>
            {attachMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-13 left-0 bg-white border border-neutral-200 shadow-xl p-1.5 rounded-2xl min-w-[150px] z-50"
              >
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors"
                >
                  <ImageIcon size={14} className="text-neutral-400" />
                  Resim Ekle
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors"
                >
                  <FileText size={14} className="text-neutral-400" />
                  Belge Ekle
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
          className="flex-1 bg-transparent px-3 py-2 text-[14px] text-neutral-900 focus:outline-none placeholder:text-neutral-400"
        />

        <div className="relative mr-1.5" ref={modelMenuRef}>
          <button
            type="button"
            onClick={() => setModelMenuOpen(!modelMenuOpen)}
            className="flex items-center gap-1 h-8 px-3 text-[11px] font-bold text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-neutral-300 hover:text-neutral-800 transition-all duration-200 shrink-0"
          >
            {MODEL_LABELS[model]}
            <motion.span animate={{ rotate: modelMenuOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown size={11} />
            </motion.span>
          </button>

          <AnimatePresence>
            {modelMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-11 right-0 bg-white border border-neutral-200 shadow-xl p-1.5 rounded-2xl min-w-[120px] z-50"
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
          className="w-10 h-10 bg-neutral-950 hover:bg-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-300 text-white rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0 shadow-sm"
        >
          <ArrowUp size={16} className="stroke-[2.5]" />
        </button>
      </div>
    </form>
  );
}

// ----------------------------------------------------------------
// Ana Uygulama Paneli
// ----------------------------------------------------------------
export default function Home() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Gelişmiş Sohbet ve Geçmiş Yönetimi State'leri
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [input, setInput] = useState('');
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

  // Mevcut aktif konuşmanın mesajları
  const currentConversation = conversations.find(c => c.id === activeId);
  const messages = currentConversation ? currentConversation.messages : [];
  const hasStarted = messages.length > 0;

  // LocalStorage'dan geçmişi yükle
  useEffect(() => {
    const saved = localStorage.getItem('sauron_chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setConversations(parsed);
          setActiveId(parsed[0].id);
        }
      } catch (e) { /* Pas geç */ }
    }
  }, []);

  // Geçmiş her değiştiğinde LocalStorage'a kaydet
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('sauron_chats', JSON.stringify(conversations));
    } else {
      localStorage.removeItem('sauron_chats');
    }
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Global tıklama dinleyici: Popover menüleri dışarı tıklanınca kapatır
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

  const startNewChat = () => {
    const newId = Date.now().toString();
    const newChat: Conversation = { id: newId, title: 'Yeni Karanlık Görev', messages: [] };
    setConversations(prev => [newChat, ...prev]);
    setActiveId(newId);
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = conversations.filter(c => c.id !== id);
    setConversations(filtered);
    if (activeId === id) {
      setActiveId(filtered.length > 0 ? filtered[0].id : '');
    }
  };

  const updateActiveConversationMessages = (updater: (prevMsgs: Message[]) => Message[], customTitle?: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id === activeId) {
        return {
          ...c,
          title: customTitle || c.title,
          messages: updater(c.messages)
        };
      }
      return c;
    }));
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

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
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
  }, []);

  // ----------------------------------------------------------------
  // Gelişmiş Harf Harf Akıcı Karakter Ticker Motoru (Queue Pattern)
  // ----------------------------------------------------------------
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    let currentActiveId = activeId;
    if (!currentActiveId) {
      currentActiveId = Date.now().toString();
      const initialChat: Conversation = { id: currentActiveId, title: input.trim().slice(0, 24) || 'Yeni Görev', messages: [] };
      setConversations([initialChat]);
      setActiveId(currentActiveId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    const currentAttachments = [...attachments];
    const updatedTitle = messages.length === 0 ? input.trim().slice(0, 24) : undefined;

    // Arayüzü temizle ve yüklemeyi başlat
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    
    // Geçmişe mesajları ekle
    let currentHistory: Message[] = [];
    setConversations(prev => prev.map(c => {
      if (c.id === currentActiveId) {
        currentHistory = [...c.messages, userMessage];
        return {
          ...c,
          title: updatedTitle || c.title,
          messages: [...currentHistory, { id: assistantId, role: 'assistant', content: '', thinking: undefined }]
        };
      }
      return c;
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentHistory, // Tüm konuşma ağacı artık backend'e gidiyor!
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

      if (!response.ok || !response.body) throw new Error('Yayın akışı başlatılamadı');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let rawAccumulatedBuffer = '';
      let textQueue: string[] = [];
      let isWriting = false;

      // Akıcı harf harf ekrana basan ana döngü çarkı
      const runTicker = () => {
        if (textQueue.length === 0) {
          isWriting = false;
          return;
        }
        isWriting = true;
        const nextChar = textQueue.shift();
        rawAccumulatedBuffer += nextChar;

        let displayCleanText = rawAccumulatedBuffer;
        let extractedThinking = '';

        const thinkBlockMatch = rawAccumulatedBuffer.match(/<think>([\s\S]*?)<\/think>/);
        const unclosedThinkMatch = rawAccumulatedBuffer.match(/<think>([\s\S]*?)$/);

        if (thinkBlockMatch) {
          extractedThinking = thinkBlockMatch[1];
          displayCleanText = rawAccumulatedBuffer.replace(/<think>([\s\S]*?)<\/think>/, '');
        } else if (unclosedThinkMatch) {
          extractedThinking = unclosedThinkMatch[1];
          displayCleanText = rawAccumulatedBuffer.replace(/<think>([\s\S]*?)$/, '');
        }

        const finalText = displayCleanText.trim();

        setConversations(prev => prev.map(c => {
          if (c.id === currentActiveId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === assistantId ? {
                ...m,
                content: finalText,
                thinking: extractedThinking || undefined
              } : m)
            };
          }
          return c;
        }));

        // Harf akış hızı (Ms cinsinden, pürüzsüz akış için 3ms optimize edildi)
        setTimeout(runTicker, 3);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const rawLineChunk = decoder.decode(value, { stream: true });
        const targetLines = rawLineChunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of targetLines) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.done) {
              setIsLoading(false);
              break;
            }
            if (parsed.error) {
              textQueue.push(...`⚠️ Kritik Hata: ${parsed.error}`.split(''));
              if (!isWriting) runTicker();
              break;
            }
            if (parsed.delta) {
              textQueue.push(...parsed.delta.split(''));
              if (!isWriting) runTicker();
            }
          } catch { /* Parça veri hatalarını yakala ve yut */ }
        }
      }

      const flushRemainingData = () => {
        if (textQueue.length > 0) {
          setTimeout(flushRemainingData, 40);
        } else {
          setIsLoading(false);
        }
      };
      flushRemainingData();

    } catch (err) {
      setConversations(prev => prev.map(c => {
        if (c.id === currentActiveId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === assistantId ? { ...m, content: '🔴 Veri hattı koptu patron, ağ bağlantısını yokla.' } : m)
          };
        }
        return c;
      }));
      setIsLoading(false);
    }
  };

  const inputBarProps = {
    input, setInput, onSubmit: handleSendMessage, isLoading,
    placeholder: hasStarted ? "Sohbete devam et, patron..." : "SauronAI'a emret...",
    attachments, setAttachments, attachMenuOpen, setAttachMenuOpen,
    model, setModel, modelMenuOpen, setModelMenuOpen,
    imageInputRef, fileInputRef, modelMenuRef, attachMenuRef
  };

  // Kimlik Doğrulama Ekranı (Cam Efekti Tasarım)
  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen w-full bg-white flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-neutral-50 blur-[140px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm bg-white border border-neutral-200/70 rounded-3xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.02)] z-10"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-neutral-950 rounded-2xl flex items-center justify-center text-white mb-4 shadow-sm">
              <Lock size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-950">SauronAI Terminal</h1>
            <p className="text-xs text-neutral-400 mt-1">Erişim yetkisini doğrulamak için şifreyi gir.</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-center font-mono text-sm tracking-widest text-neutral-900 focus:outline-none focus:border-neutral-950 transition-all duration-200"
            />
            <AnimatePresence>
              {authError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[11px] font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  <ShieldAlert size={14} /> <span>Şifre patladı patron! Sızmaya çalışma. 💀</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button type="submit" className="w-full py-3 bg-neutral-950 hover:bg-neutral-900 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
              Sistemi Ateşle
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-white flex overflow-hidden selection:bg-neutral-100">
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.csv,.js,.ts,.py,.json,.html,.css" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'file')} />

      {/* -------------------------------------------------------------- */}
      {/* SOL GİZLENEBİLİR SIDEBAR (Sohbet Geçmişi Alanı) */}
      {/* -------------------------------------------------------------- */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="h-screen bg-neutral-50/50 border-r border-neutral-200/70 flex flex-col shrink-0 z-40 overflow-hidden"
          >
            <div className="p-4 pt-16 flex flex-col gap-2 border-b border-neutral-200/40">
              <button
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-neutral-200/80 hover:border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 shadow-sm transition-all duration-200"
              >
                <Plus size={14} /> Yeni Görev Başlat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map((chat) => {
                const isSelected = chat.id === activeId;
                return (
                  <div
                    key={chat.id}
                    onClick={() => setActiveId(chat.id)}
                    className={`group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ${isSelected ? 'bg-neutral-100 text-neutral-900 font-semibold' : 'text-neutral-500 hover:bg-neutral-100/60 hover:text-neutral-800'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MessageSquare size={14} className={isSelected ? 'text-neutral-900' : 'text-neutral-400'} />
                      <span className="text-xs truncate max-w-[170px]">{chat.title}</span>
                    </div>
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 p-0.5 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
              {conversations.length === 0 && (
                <div className="text-center py-8 text-[11px] text-neutral-400 font-medium">Kayıtlı görev yok.</div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ANA İÇERİK ALANI */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-white">
        
        {/* ÜST HEADER ALANI */}
        <header className="absolute top-0 left-0 right-0 h-14 bg-white/60 backdrop-blur-md border-b border-neutral-100 z-30 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 flex items-center justify-center hover:bg-neutral-50 border border-neutral-200/40 rounded-lg transition-colors text-neutral-600"
            >
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-2">
              <img 
                src="/favicon.ico" 
                alt="SauronAI" 
                className="w-5 h-5 rounded-md object-contain shadow-sm"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
              />
              <span className="font-bold text-xs tracking-tight text-neutral-950">SauronAI</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200/40">{MODEL_LABELS[model]}</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Çevrimiçi
            </span>
          </div>
        </header>

        {/* MESAJ AKIŞ PANELİ */}
        <div className="flex-1 overflow-y-auto pt-20 pb-36 px-4 flex flex-col items-center">
          <div className="w-full max-w-2xl flex flex-col">
            <AnimatePresence mode="wait">
              {!hasStarted ? (
                <motion.div key="landing" exit={{ opacity: 0, y: -20 }} className="w-full flex flex-col items-center justify-center text-center py-20">
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-14 h-14 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                    <Sparkles size={22} className="text-neutral-950" />
                  </motion.div>
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-950 mb-2">Karanlık Zeka Çevrimiçi.</h1>
                  <p className="text-xs text-neutral-400 max-w-xs mb-8 leading-relaxed">
                    SauronAI mutlak stratejik deha ve toksik karizmayla emrinde. Komut ver zavallı varlık.
                  </p>
                  <div className="w-full max-w-xl">
                    <InputBar {...inputBarProps} />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col gap-5">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      
                      {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-1.5 justify-end max-w-[85%]">
                          {msg.attachments.map((att) => (
                            <div key={att.id} className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-neutral-600 shadow-sm">
                              {att.type === 'image' && att.previewUrl ? (
                                <img src={att.previewUrl} alt={att.name} className="w-4 h-4 rounded object-cover" />
                              ) : <FileText size={11} />}
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
                          className={`max-w-[88%] rounded-2xl px-4.5 py-3 text-[14px] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.01)] ${
                            msg.role === 'user'
                              ? 'bg-neutral-950 text-white rounded-tr-none font-medium'
                              : 'bg-neutral-50/70 text-neutral-900 border border-neutral-200/40 rounded-tl-none prose prose-neutral max-w-none'
                          }`}
                        >
                          {msg.role === 'user' ? (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          ) : msg.content ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          ) : (
                            <span className="text-neutral-400 font-mono text-[11px] animate-pulse">Sinyaller toparlanıyor...</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex justify-start items-center gap-2 text-neutral-400 text-[11px] font-bold pl-2 animate-pulse">
                      <div className="flex gap-0.5">
                        <span className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="font-mono">SauronAI analiz ediyor...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ALT SABİT GİRİŞ ALANI */}
        <AnimatePresence>
          {hasStarted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4 z-20"
            >
              <div className="w-full max-w-xl mx-auto">
                <InputBar {...inputBarProps} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
