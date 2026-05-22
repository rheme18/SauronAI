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
// Düşünce Zinciri (CoT) Paneli
// ----------------------------------------------------------------
function ThinkingPanel({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4 w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[12px] font-bold text-neutral-400 bg-neutral-50 border border-neutral-200/60 px-3 py-1.5 rounded-full hover:bg-neutral-100/80 hover:text-neutral-700 transition-all duration-200"
      >
        <Brain size={13} className="text-purple-500 animate-pulse" />
        <span>SauronAI Düşünce Hattı</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={12} />
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
            <div className="mt-2 text-[12px] text-neutral-500 bg-neutral-50/50 border border-neutral-200/40 border-l-2 border-l-purple-400 rounded-2xl p-4 leading-relaxed max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
              {thinking}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------
// Dosya Önizleme Kartı
// ----------------------------------------------------------------
function AttachmentChip({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  return (
    <div className="relative flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-full p-1.5 pr-3 text-xs text-neutral-700 shadow-sm">
      {att.type === 'image' && att.previewUrl ? (
        <img src={att.previewUrl} alt={att.name} className="w-5 h-5 rounded-full object-cover" />
      ) : (
        <FileText size={13} className="text-neutral-400" />
      )}
      <span className="max-w-[120px] truncate font-medium text-[12px]">{att.name}</span>
      <button onClick={onRemove} className="ml-1 text-neutral-400 hover:text-neutral-900 transition-colors">
        <X size={12} />
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// Gelişmiş Giriş Alanı (Genişletilmiş ve Yukarı Açılan Menüler)
// ----------------------------------------------------------------
interface InputBarProps {
  input: string;
  setInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
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
  input, setInput, onSubmit, onPaste, isLoading, placeholder,
  attachments, setAttachments, attachMenuOpen, setAttachMenuOpen,
  model, setModel, modelMenuOpen, setModelMenuOpen,
  imageInputRef, fileInputRef, modelMenuRef, attachMenuRef
}: InputBarProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="w-full bg-white border border-neutral-200 shadow-[0_12px_40px_rgba(0,0,0,0.03)] rounded-full focus-within:border-neutral-400 focus-within:shadow-[0_14px_45px_rgba(0,0,0,0.05)] transition-all duration-300"
    >
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pt-4">
          {attachments.map((att) => (
            <AttachmentChip
              key={att.id}
              att={att}
              onRemove={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
            />
          ))}
        </div>
      )}

      <div className="flex items-center p-3">
        <div className="relative" ref={attachMenuRef}>
          <button
            type="button"
            onClick={() => setAttachMenuOpen(!attachMenuOpen)}
            className="w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 rounded-full transition-all duration-200 shrink-0"
          >
            <Plus size={20} className={`transition-transform duration-200 ${attachMenuOpen ? 'rotate-45' : ''}`} />
          </button>

          <AnimatePresence>
            {attachMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-full mb-3 left-0 bg-white border border-neutral-200 shadow-xl p-2 rounded-2xl min-w-[160px] z-50"
              >
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors"
                >
                  <ImageIcon size={15} className="text-neutral-400" />
                  Resim Ekle
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors"
                >
                  <FileText size={15} className="text-neutral-400" />
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
          onPaste={onPaste}
          disabled={isLoading}
          className="flex-1 bg-transparent px-4 py-2.5 text-[15px] text-neutral-900 focus:outline-none placeholder:text-neutral-400 font-medium"
        />

        <div className="relative mr-2" ref={modelMenuRef}>
          <button
            type="button"
            onClick={() => setModelMenuOpen(!modelMenuOpen)}
            className="flex items-center gap-1.5 h-9 px-4 text-[12px] font-bold text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-full hover:border-neutral-300 hover:text-neutral-800 transition-all duration-200 shrink-0"
          >
            {MODEL_LABELS[model]}
            <motion.span animate={{ rotate: modelMenuOpen ? 180 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown size={12} />
            </motion.span>
          </button>

          <AnimatePresence>
            {modelMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-full mb-3 right-0 bg-white border border-neutral-200 shadow-xl p-2 rounded-2xl min-w-[130px] z-50"
              >
                {(Object.keys(MODEL_LABELS) as ModelType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setModel(m); setModelMenuOpen(false); }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 text-xs font-semibold rounded-xl transition-colors ${model === m ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
                  >
                    {MODEL_LABELS[m]}
                    {model === m && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-2" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="submit"
          disabled={(!input.trim() && attachments.length === 0) || isLoading}
          className="w-11 h-11 bg-neutral-950 hover:bg-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-300 text-white rounded-full flex items-center justify-center transition-all duration-200 shrink-0 shadow-sm"
        >
          <ArrowUp size={18} className="stroke-[2.5]" />
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
  
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === activeId);
  const messages = currentConversation ? currentConversation.messages : [];
  const hasStarted = messages.length > 0;

  // Geçmişi yükle/kaydet
  useEffect(() => {
    const saved = localStorage.getItem('sauron_chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setConversations(parsed);
          setActiveId(parsed[0].id);
        }
      } catch (e) { /* Pas */ }
    }
  }, []);

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

  // Sayfada herhangibir yere basıldığında otomatik kapatma motoru
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
  // Gelişmiş Ctrl + V (Pano Yapıştırma) Yakalayıcı Sistemi
  // ----------------------------------------------------------------
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const newAtts: Attachment[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;
        const base64 = await readFileAsBase64(file);
        const previewUrl = URL.createObjectURL(file);
        newAtts.push({
          id: Date.now().toString() + Math.random(),
          name: file.name || `yapistirilan-resim-${Date.now()}.png`,
          type: 'image',
          mimeType: file.type,
          base64,
          previewUrl
        });
      } else if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (!file) continue;
        const isPdf = file.type === 'application/pdf';
        let base64: string | undefined;
        let text: string | undefined;
        if (isPdf) {
          base64 = await readFileAsBase64(file);
        } else {
          text = await readFileAsText(file);
        }
        newAtts.push({
          id: Date.now().toString() + Math.random(),
          name: file.name,
          type: isPdf ? 'pdf' : 'text',
          mimeType: file.type,
          base64,
          text
        });
      }
    }

    if (newAtts.length > 0) {
      setAttachments((prev) => [...prev, ...newAtts]);
    }
  }, []);

  // Message Sender / Akıllı Kesintisiz Stream Buffer Motoru
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

    setInput('');
    setAttachments([]);
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
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
          messages: currentHistory, 
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

      if (!response.ok || !response.body) throw new Error('Yayın hattı koptu.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let fullBuffer = ''; 
      let rawAccumulatedText = '';

      // Paket parçalanmasını ve zıplamayı engelleyen kesintisiz döngü çarkı
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fullBuffer += decoder.decode(value, { stream: true });
        const parts = fullBuffer.split('\n');
        fullBuffer = parts.pop() || ''; // Eksik kalan son satırı tampona al

        for (const line of parts) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.done) {
              setIsLoading(false);
              break;
            }
            if (parsed.error) {
              rawAccumulatedText += `\n⚠️ Hata: ${parsed.error}`;
              break;
            }
            if (parsed.delta) {
              rawAccumulatedText += parsed.delta;

              let displayCleanText = rawAccumulatedText;
              let extractedThinking = '';

              const thinkBlockMatch = rawAccumulatedText.match(/<think>([\s\S]*?)<\/think>/);
              const unclosedThinkMatch = rawAccumulatedText.match(/<think>([\s\S]*?)$/);

              if (thinkBlockMatch) {
                extractedThinking = thinkBlockMatch[1];
                displayCleanText = rawAccumulatedText.replace(/<think>([\s\S]*?)<\/think>/, '');
              } else if (unclosedThinkMatch) {
                extractedThinking = unclosedThinkMatch[1];
                displayCleanText = rawAccumulatedText.replace(/<think>([\s\S]*?)$/, '');
              }

              setConversations(prev => prev.map(c => {
                if (c.id === currentActiveId) {
                  return {
                    ...c,
                    messages: c.messages.map(m => m.id === assistantId ? {
                      ...m,
                      content: displayCleanText,
                      thinking: extractedThinking || undefined
                    } : m)
                  };
                }
                return c;
              }));
            }
          } catch { /* Parçalanmış JSON hatalarını safely yut */ }
        }
      }
      setIsLoading(false);

    } catch (err) {
      setConversations(prev => prev.map(c => {
        if (c.id === currentActiveId) {
          return {
            ...c,
            messages: c.messages.map(m => m.id === assistantId ? { ...m, content: '🔴 Veri kanalları tıkandı patron, bağlantıyı yokla.' } : m)
          };
        }
        return c;
      }));
      setIsLoading(false);
    }
  };

  const inputBarProps = {
    input, setInput, onSubmit: handleSendMessage, onPaste: handlePaste, isLoading,
    placeholder: hasStarted ? "Sohbete devam et, patron..." : "SauronAI'a emret...",
    attachments, setAttachments, attachMenuOpen, setAttachMenuOpen,
    model, setModel, modelMenuOpen, setModelMenuOpen,
    imageInputRef, fileInputRef, modelMenuRef, attachMenuRef
  };

  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen w-full bg-white flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-neutral-50 blur-[140px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-sm bg-white border border-neutral-200 rounded-3xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.02)] z-10"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-neutral-950 rounded-2xl flex items-center justify-center text-white mb-4 shadow-sm">
              <Lock size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-950">SauronAI Terminal</h1>
            <p className="text-xs text-neutral-400 mt-1">Sistemi ateşlemek için şifreyi gir.</p>
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
              Giriş Yap
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

      {/* SOL GİZLENEBİLİR SIDEBAR */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="h-screen bg-neutral-50/70 border-r border-neutral-200/60 flex flex-col shrink-0 z-40 overflow-hidden"
          >
            {/* Sidebar Üst Başlık ve Aksiyon Alanı */}
            <div className="p-5 pt-6 flex flex-col gap-4 border-b border-neutral-200/30">
              <div className="text-[19px] font-extrabold tracking-tight text-neutral-950">SauronAI</div>
              <button
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-neutral-200 hover:border-neutral-300 rounded-full text-xs font-bold text-neutral-800 shadow-sm transition-all duration-200"
              >
                <Plus size={14} /> Yeni Görev Başlat
              </button>
            </div>

            {/* Görev Geçmişi Listesi */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {conversations.map((chat) => {
                const isSelected = chat.id === activeId;
                return (
                  <div
                    key={chat.id}
                    onClick={() => setActiveId(chat.id)}
                    className={`group flex items-center justify-between px-3.5 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${isSelected ? 'bg-neutral-200/60 text-neutral-950 font-bold' : 'text-neutral-500 hover:bg-neutral-100/80 hover:text-neutral-900'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MessageSquare size={15} className={isSelected ? 'text-neutral-950' : 'text-neutral-400'} />
                      <span className="text-[13px] truncate max-w-[180px]">{chat.title}</span>
                    </div>
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 p-1 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
              {conversations.length === 0 && (
                <div className="text-center py-8 text-[12px] text-neutral-400 font-semibold">Kayıtlı görev yok.</div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ANA İÇERİK AKIŞI */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-white">
        
        {/* ÜST HEADER */}
        <header className="absolute top-0 left-0 right-0 h-16 bg-white/60 backdrop-blur-md border-b border-neutral-100/80 z-30 px-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 flex items-center justify-center hover:bg-neutral-50 border border-neutral-200/50 rounded-xl transition-colors text-neutral-600"
            >
              <Menu size={18} />
            </button>
            {!sidebarOpen && (
              <span className="text-[16px] font-extrabold tracking-tight text-neutral-950 animate-fade-in">SauronAI</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-neutral-400 bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-250/30">{MODEL_LABELS[model]}</span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Çevrimiçi
            </span>
          </div>
        </header>

        {/* SPACIUS & BORDERLESS MESAJ FORMATI (KUTUCUKSUZ VE SAKİN TASARIM) */}
        <div className="flex-1 overflow-y-auto pt-24 pb-40 px-5 flex flex-col items-center">
          <div className="w-full max-w-2xl flex flex-col">
            <AnimatePresence mode="wait">
              {!hasStarted ? (
                <motion.div key="landing" exit={{ opacity: 0, y: -20 }} className="w-full flex flex-col items-center justify-center text-center py-24">
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-16 h-16 bg-neutral-50 border border-neutral-200 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                    <Sparkles size={24} className="text-neutral-950" />
                  </motion.div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950 mb-3">Zekanın Karanlık Tarafı.</h1>
                  <p className="text-[13px] text-neutral-400 max-w-xs mb-10 leading-relaxed font-medium">
                    SauronAI mutlak stratejik deha ve eşsiz karizmayla emrinde. Komut ver, patron.
                  </p>
                  <div className="w-full max-w-2xl">
                    <InputBar {...inputBarProps} />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col gap-8">
                  {messages.map((msg) => (
                    <div key={msg.id} className="w-full flex flex-col items-start border-b border-neutral-100/40 pb-6">
                      
                      {/* Ekli Dosya Göstergeleri */}
                      {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 justify-start max-w-full">
                          {msg.attachments.map((att) => (
                            <div key={att.id} className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-full px-3 py-1 text-[11px] font-bold text-neutral-500 shadow-sm">
                              {att.type === 'image' && att.previewUrl ? (
                                <img src={att.previewUrl} alt={att.name} className="w-4 h-4 rounded-full object-cover" />
                              ) : <FileText size={12} />}
                              <span className="max-w-[100px] truncate">{att.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Asistan Akıllı Düşünce Hattı */}
                      {msg.role === 'assistant' && msg.thinking && (
                        <ThinkingPanel thinking={msg.thinking} />
                      )}

                      {/* Kimlik Başlıkları */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[11px] font-extrabold tracking-wider uppercase ${msg.role === 'user' ? 'text-neutral-400' : 'text-purple-600'}`}>
                          {msg.role === 'user' ? 'SEN' : 'SAURONAI'}
                        </span>
                      </div>

                      {/* Kutucuksuz, Temiz, Geniş Yazı Tipi */}
                      <div className={`w-full text-[15px] leading-relaxed text-neutral-900 ${msg.role === 'assistant' ? 'prose prose-neutral max-w-none font-normal' : 'font-medium whitespace-pre-wrap'}`}>
                        {msg.role === 'user' ? (
                          <p>{msg.content}</p>
                        ) : msg.content ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        ) : (
                          <span className="text-neutral-300 font-mono text-[12px] animate-pulse">Sinyaller toparlanıyor...</span>
                        )}
                      </div>

                    </div>
                  ))}

                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex justify-start items-center gap-2.5 text-neutral-400 text-[12px] font-bold pl-1 animate-pulse">
                      <div className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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

        {/* GENİŞLETİLMİŞ ALT SABİT GİRİŞ ALANI */}
        <AnimatePresence>
          {hasStarted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-12 pb-8 px-5 z-20"
            >
              <div className="w-full max-w-2xl mx-auto">
                <InputBar {...inputBarProps} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
