'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowUp, Lock, ShieldAlert, Plus, X, FileText, ImageIcon, Brain, 
  ChevronDown, PanelRightClose, Copy, Check, Settings, MessageSquare, Trash2, 
  Save, Sliders, HardDrive, Palette, Zap, Shield, Cpu
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ============================================================================
// TİPLER VE ARAYÜZLER (TYPES & INTERFACES)
// ============================================================================
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
  flash: 'Sauron Flash 2.5',
  pro: 'Sauron Pro 2.5',
};

// ============================================================================
// ALT BİLEŞENLER (SUB-COMPONENTS)
// ============================================================================

// 1. Favicon Animasyonlu Toggle Butonu
function FaviconToggle({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-all duration-200 relative overflow-hidden shrink-0"
    >
      <AnimatePresence mode="wait">
        {isHovered ? (
          <motion.div
            key="menu-icon"
            initial={{ scale: 0.6, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.6, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.15 }}
          >
            <PanelRightClose size={18} className="text-neutral-800" />
          </motion.div>
        ) : (
          <motion.div
            key="favicon-img"
            initial={{ scale: 0.6, opacity: 0, rotate: 90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.6, opacity: 0, rotate: -90 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            <img 
              src="/favicon.ico" 
              alt="Favicon" 
              className="w-7 h-7 rounded-full object-cover shadow-sm" 
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// 2. Özel Markdown Kod Bloğu (Kopyalama Özellikli)
function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLSpanElement>(null);

  const handleCopy = async () => {
    if (codeRef.current) {
      const text = codeRef.current.innerText;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : 'code';

  return (
    <div className="relative my-5 rounded-2xl border border-neutral-800 bg-[#0a0a0a] text-neutral-100 font-mono text-[13px] overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#141414] text-neutral-400 border-b border-neutral-800 select-none">
        <span className="text-[11px] font-bold uppercase tracking-wider">{lang}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] font-medium hover:text-white transition-colors duration-150"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
        </button>
      </div>
      <div className="p-5 overflow-x-auto whitespace-pre custom-scrollbar">
        <span ref={codeRef} className={className}>{children}</span>
      </div>
    </div>
  );
}

// 3. Yapay Zeka Düşünce Zinciri (CoT) Paneli
function ThinkingPanel({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3 w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[12px] font-bold text-neutral-400 bg-neutral-50 px-3 py-1.5 rounded-full hover:bg-neutral-100/80 hover:text-neutral-700 transition-all duration-200"
      >
        <Brain size={13} className="text-purple-500 animate-pulse" />
        <span>SauronAI Analiz Süreci</span>
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
            className="overflow-hidden"
          >
            <div className="mt-2 text-[12px] text-neutral-500 bg-neutral-50/50 border-l-2 border-l-purple-400 rounded-2xl p-4 leading-relaxed max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
              {thinking}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 4. Toggle Switch (Ayarlar için)
function ToggleSwitch({ enabled, onChange }: { enabled: boolean, onChange: () => void }) {
  return (
    <button 
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-neutral-900' : 'bg-neutral-200'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition duration-200 ease-in-out ${enabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
    </button>
  );
}

// ============================================================================
// ANA UYGULAMA (MAIN APPLICATION)
// ============================================================================
export default function Home() {
  // Kimlik Doğrulama State
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Genel Chat State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Ayarlar State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'memory' | 'advanced'>('general');
  const [memories, setMemories] = useState<string[]>([]);
  const [newMemory, setNewMemory] = useState('');
  const [toxicMode, setToxicMode] = useState(true); // Görsel ayar
  const [streamSpeed, setStreamSpeed] = useState(true); // Görsel ayar

  // Aktif Giriş State
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<ModelType>('flash');

  // Menü State
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);

  // Referanslar
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === activeId);
  const messages = currentConversation ? currentConversation.messages : [];
  const hasStarted = messages.length > 0;

  // --------------------------------------------------------------------------
  // LOKAL DEPOLAMA ETKİLEŞİMLERİ (LOCAL STORAGE)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const savedChats = localStorage.getItem('sauron_chats');
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        if (parsed.length > 0) {
          setConversations(parsed);
          setActiveId(parsed[0].id);
        }
      } catch (e) { console.error("Geçmiş yükleme hatası"); }
    }
    const savedMem = localStorage.getItem('sauron_memories');
    if (savedMem) {
      try { setMemories(JSON.parse(savedMem)); } catch (e) { }
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) localStorage.setItem('sauron_chats', JSON.stringify(conversations));
    else localStorage.removeItem('sauron_chats');
  }, [conversations]);

  useEffect(() => { localStorage.setItem('sauron_memories', JSON.stringify(memories)); }, [memories]);

  // Otomatik kaydırma
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  // Menüleri dışarı tıklama ile kapatma motoru
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (modelMenuRef.current && !modelMenuRef.current.contains(target)) setModelMenuOpen(false);
      if (attachMenuRef.current && !attachMenuRef.current.contains(target)) setAttachMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // --------------------------------------------------------------------------
  // AKSİYON FONKSİYONLARI (ACTION HANDLERS)
  // --------------------------------------------------------------------------
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'sauron') { setIsAuthorized(true); setAuthError(false); } 
    else { setAuthError(true); setPassword(''); }
  };

  const startNewChat = () => {
    const newId = Date.now().toString();
    const newChat: Conversation = { id: newId, title: 'Yeni Görev', messages: [] };
    setConversations(prev => [newChat, ...prev]);
    setActiveId(newId);
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = conversations.filter(c => c.id !== id);
    setConversations(filtered);
    if (activeId === id) setActiveId(filtered.length > 0 ? filtered[0].id : '');
  };

  // Dosya İşleme
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
      r.readAsText(file);
    });

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newAtts: Attachment[] = [];
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      let base64, text, previewUrl;
      if (isImage || file.type === 'application/pdf') {
        base64 = await readFileAsBase64(file);
        if (isImage) previewUrl = URL.createObjectURL(file);
      } else { text = await readFileAsText(file); }
      newAtts.push({ id: Date.now().toString() + Math.random(), name: file.name, type: isImage ? 'image' : 'text', mimeType: file.type, base64, text, previewUrl });
    }
    setAttachments((prev) => [...prev, ...newAtts]);
    setAttachMenuOpen(false);
    e.target.value = '';
  }, []);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const newAtts: Attachment[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;
        const base64 = await readFileAsBase64(file);
        newAtts.push({ id: Date.now().toString() + Math.random(), name: file.name || 'yapistirilan-resim.png', type: 'image', mimeType: file.type, base64, previewUrl: URL.createObjectURL(file) });
      }
    }
    if (newAtts.length > 0) setAttachments(prev => [...prev, ...newAtts]);
  }, []);

  // --------------------------------------------------------------------------
  // KUSURSUZ MESAJ GÖNDERME VE STREAM PARSING (THE FIX)
  // --------------------------------------------------------------------------
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

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, attachments: [...attachments] };
    const currentAttachments = [...attachments];
    const updatedTitle = messages.length === 0 ? input.trim().slice(0, 24) : undefined;

    setInput(''); setAttachments([]); setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    let currentHistory: Message[] = [];
    
    setConversations(prev => prev.map(c => {
      if (c.id === currentActiveId) {
        currentHistory = [...c.messages, userMessage];
        return { ...c, title: updatedTitle || c.title, messages: [...currentHistory, { id: assistantId, role: 'assistant', content: '', thinking: undefined }] };
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
          memories,
          attachments: currentAttachments.map(a => ({ name: a.name, type: a.type, mimeType: a.mimeType, base64: a.base64, text: a.text })),
        }),
      });

      if (!response.ok || !response.body) throw new Error('Sunucu cevap vermedi patron.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let rawAccumulatedText = '';
      let streamBuffer = ''; // KUSURSUZ BUFFER SİSTEMİ

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Gelen binary datayı stringe çevir ve buffer'a ekle
        streamBuffer += decoder.decode(value, { stream: true });
        
        // Güvenli SSE (Server-Sent Events) ayrıştırıcı
        let doubleNewlineIndex;
        // Çift satır sonu bulana kadar buffer'ı tara (tamamlanmış JSON paketini garanti eder)
        while ((doubleNewlineIndex = streamBuffer.indexOf('\n\n')) >= 0) {
          // Tamamlanmış bloğu al
          const chunkStr = streamBuffer.slice(0, doubleNewlineIndex).trim();
          // Buffer'dan bu bloğu temizle
          streamBuffer = streamBuffer.slice(doubleNewlineIndex + 2);
          
          if (chunkStr.startsWith('data: ')) {
            const jsonStr = chunkStr.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.error) {
                rawAccumulatedText += `\n\n⚠️ Hata: ${parsed.error}`;
                break;
              }
              if (parsed.done) {
                break; // Stream bitti
              }
              if (parsed.delta) {
                rawAccumulatedText += parsed.delta;

                // <think> etiketlerini ayrıştır
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

                // Ekrana yansıt
                setConversations(prev => prev.map(c => c.id === currentActiveId ? {
                    ...c, messages: c.messages.map(m => m.id === assistantId ? { 
                      ...m, 
                      content: displayCleanText.trimStart(), 
                      thinking: extractedThinking || undefined 
                    } : m)
                  } : c));
              }
            } catch (e) { 
              // Beklenmeyen devasa parçalanma olursa konsola at, sistemi kilitleme
              console.error("JSON Parse Hatası:", e, "Metin:", jsonStr);
            }
          }
        }
      }
      setIsLoading(false);
    } catch (err: any) {
      setConversations(prev => prev.map(c => c.id === currentActiveId ? {
        ...c, messages: c.messages.map(m => m.id === assistantId ? { ...m, content: `🔴 Veri hattı koptu patron. Hata: ${err.message}` } : m)
      } : c));
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // KİMLİK DOĞRULAMA (AUTH SCREEN)
  // --------------------------------------------------------------------------
  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 selection:bg-neutral-200">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-white border border-neutral-200 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-14 h-14 bg-neutral-950 rounded-2xl flex items-center justify-center text-white mb-4"><Lock size={20} /></div>
            <h1 className="text-xl font-bold">SauronAI Terminal</h1>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-center focus:outline-none focus:border-neutral-950 transition-all" />
            <button type="submit" className="w-full py-3 bg-neutral-950 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors">Giriş Yap</button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ANA ARAYÜZ (MAIN UI)
  // --------------------------------------------------------------------------
  return (
    <div className="h-screen w-full bg-white flex overflow-hidden selection:bg-neutral-100">
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.js,.py,.html,.css" className="hidden" onChange={handleFileSelect} />

      {/* --- SIDEBAR SİSTEMİ --- */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 70 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`h-full bg-neutral-50/50 flex flex-col shrink-0 z-40 transition-colors ${sidebarOpen ? 'border-r border-neutral-200/60' : 'border-r-0'}`}
      >
        <div className={`flex flex-col flex-1 min-h-0 ${sidebarOpen ? 'p-4' : 'items-center py-4 gap-6'}`}>
          
          {/* Favicon / Logo Bölümü */}
          {sidebarOpen ? (
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-3">
                <img src="/favicon.ico" alt="Logo" className="w-7 h-7 rounded-full object-cover shadow-sm" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-[18px] font-extrabold text-neutral-950 tracking-tight">SauronAI</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-neutral-400 hover:text-neutral-900 transition-colors">
                <PanelRightClose size={18} />
              </button>
            </div>
          ) : (
            <FaviconToggle isOpen={sidebarOpen} onClick={() => setSidebarOpen(true)} />
          )}

          {/* Aksiyon: Yeni Görev */}
          {sidebarOpen ? (
            <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-neutral-200 hover:border-neutral-300 rounded-full text-xs font-bold text-neutral-800 shadow-sm transition-all mb-4">
              <Plus size={14} /> Yeni Görev Başlat
            </button>
          ) : (
            <button onClick={startNewChat} className="w-10 h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-neutral-700 hover:border-neutral-400 shadow-sm transition-all">
              <Plus size={16} />
            </button>
          )}

          {/* Sohbet Geçmişi */}
          <div className={`flex-1 overflow-y-auto space-y-1 custom-scrollbar ${!sidebarOpen && 'hidden'}`}>
            {conversations.map((chat) => (
              <div key={chat.id} onClick={() => setActiveId(chat.id)} className={`group flex items-center justify-between px-3 py-3 rounded-2xl cursor-pointer transition-all ${chat.id === activeId ? 'bg-neutral-200/60 font-bold text-neutral-950' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                <span className="text-[13px] truncate pr-2">{chat.title}</span>
                <button onClick={(e) => deleteChat(chat.id, e)} className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Ayarlar İkonu */}
        <div className={`p-4 ${!sidebarOpen && 'flex justify-center'}`}>
          <button onClick={() => setSettingsOpen(true)} className={`flex items-center gap-3 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-xl transition-all ${sidebarOpen ? 'w-full px-4 py-3 text-[13px] font-bold' : 'p-2.5'}`}>
            <Settings size={sidebarOpen ? 18 : 20} />
            {sidebarOpen && <span>Ayarlar</span>}
          </button>
        </div>
      </motion.aside>

      {/* --- ANA ÇALIŞMA ALANI --- */}
      <div className="flex-1 flex flex-col h-full relative bg-white overflow-hidden">
        
        {/* Görünmez Header (Üstteki boşluğu dengeler) */}
        <header className="absolute top-0 left-0 right-0 h-14 bg-transparent z-30 px-6 flex items-center justify-between pointer-events-none">
          <div />
          <div className="flex items-center gap-2 pointer-events-auto mt-4">
            <span className="text-[10px] font-bold text-neutral-400 bg-neutral-50 px-2 py-1 rounded-md border border-neutral-100">{MODEL_LABELS[model]}</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Çevrimiçi
            </span>
          </div>
        </header>

        {/* --- MESAJ AKIŞI (CHAT FEED) --- */}
        <div className="flex-1 overflow-y-auto w-full px-4 pt-20 pb-48 custom-scrollbar">
          <div className="w-full max-w-3xl mx-auto flex flex-col">
            <AnimatePresence mode="wait">
              {!hasStarted ? (
                <motion.div key="landing" exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center justify-center text-center py-20 mt-10">
                  <div className="w-16 h-16 bg-neutral-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm"><Sparkles size={24} className="text-neutral-950" /></div>
                  <h1 className="text-3xl font-extrabold text-neutral-950 mb-3 tracking-tight">Karanlık Zeka Devrede.</h1>
                  <p className="text-[14px] text-neutral-400 max-w-sm mb-10 font-medium">SauronAI mutlak strateji ve eşsiz mühendislikle emrinde. Emret patron.</p>
                </motion.div>
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 w-full">
                  {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={msg.id} className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        {isUser ? (
                          /* KULLANICI MESAJI (Sağda, Siyah Balon) */
                          <div className="max-w-[85%] flex flex-col items-end">
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2 justify-end">
                                {msg.attachments.map((att) => (
                                  <div key={att.id} className="flex items-center gap-2 bg-neutral-100 rounded-full px-3 py-1 text-[11px] font-bold text-neutral-600">
                                    {att.type === 'image' && att.previewUrl ? <img src={att.previewUrl} alt={att.name} className="w-4 h-4 rounded-full object-cover" /> : <FileText size={12} />}
                                    <span className="truncate max-w-[100px]">{att.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="bg-neutral-950 text-white px-5 py-3.5 rounded-3xl rounded-tr-sm text-[15px] font-medium leading-relaxed whitespace-pre-wrap shadow-sm">
                              {msg.content}
                            </div>
                          </div>
                        ) : (
                          /* YAPAY ZEKA MESAJI (Solda, Çizgisiz, Sınırsız, Markdown) */
                          <div className="w-full flex flex-col items-start pr-12">
                            {msg.thinking && <ThinkingPanel thinking={msg.thinking} />}
                            <div className="text-[15px] leading-relaxed text-neutral-900 prose prose-neutral max-w-none w-full">
                              {msg.content ? (
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]} 
                                  components={{ 
                                    code({ className, children }) { 
                                      return <CodeBlock className={className}>{children}</CodeBlock>; 
                                    } 
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              ) : (
                                <span className="text-neutral-400 font-mono text-[13px] animate-pulse">Sinyaller analiz ediliyor...</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex items-center gap-2 text-neutral-400 text-[12px] font-bold animate-pulse mt-2">
                      <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- ALT SABİT İNPUT ALANI VE BLUR EFEKTİ --- */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center pb-5 px-6">
          
          {/* SİHİRLİ BLUR (BULANIKLIK) TABAKASI (İnputun hemen üstünde) */}
          <div className="absolute bottom-full left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent backdrop-blur-[2px] pointer-events-none" />
          
          {/* Form Alanı */}
          <form onSubmit={handleSendMessage} className="w-full max-w-3xl bg-white border border-neutral-200 shadow-[0_10px_40px_rgba(0,0,0,0.06)] rounded-full focus-within:border-neutral-400 transition-all relative z-10">
            
            {/* Önizleme Eklentileri */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-5 pt-4">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 bg-neutral-100 rounded-full p-1.5 pr-3 text-xs text-neutral-700">
                    {att.type === 'image' && att.previewUrl ? <img src={att.previewUrl} alt={att.name} className="w-5 h-5 rounded-full object-cover" /> : <FileText size={13} />}
                    <span className="truncate max-w-[100px] font-medium">{att.name}</span>
                    <button type="button" onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="ml-1 text-neutral-400 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center p-2.5">
              
              {/* Artı Menüsü */}
              <div className="relative" ref={attachMenuRef}>
                <button type="button" onClick={() => setAttachMenuOpen(!attachMenuOpen)} className="w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-all">
                  <Plus size={20} className={attachMenuOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
                </button>
                <AnimatePresence>
                  {attachMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-3 left-0 bg-white border border-neutral-200 shadow-2xl p-2 rounded-2xl min-w-[150px] z-50">
                      <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center gap-3 w-full px-3 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 rounded-xl"><ImageIcon size={15} /> Resim</button>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 w-full px-3 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 rounded-xl"><FileText size={15} /> Belge</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <input 
                type="text" 
                placeholder="SauronAI'a bir komut ver..." 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onPaste={handlePaste} 
                disabled={isLoading} 
                className="flex-1 bg-transparent px-4 py-2.5 text-[15px] font-medium text-neutral-900 focus:outline-none placeholder:text-neutral-400" 
              />
              
              {/* Model Seçici */}
              <div className="relative mr-2" ref={modelMenuRef}>
                <button type="button" onClick={() => setModelMenuOpen(!modelMenuOpen)} className="flex items-center gap-1.5 h-9 px-4 text-[12px] font-bold text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-full hover:text-neutral-800 transition-colors">
                  {MODEL_LABELS[model]} <ChevronDown size={12} />
                </button>
                <AnimatePresence>
                  {modelMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full mb-3 right-0 bg-white border border-neutral-200 shadow-2xl p-2 rounded-2xl min-w-[140px] z-50">
                      {(Object.keys(MODEL_LABELS) as ModelType[]).map((m) => (
                        <button key={m} type="button" onClick={() => { setModel(m); setModelMenuOpen(false); }} className={`flex items-center justify-between w-full px-3 py-2.5 text-xs font-bold rounded-xl transition-colors ${model === m ? 'bg-neutral-950 text-white' : 'hover:bg-neutral-50 text-neutral-700'}`}>
                          {MODEL_LABELS[m]} {model === m && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-2" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Gönder Butonu */}
              <button type="submit" disabled={(!input.trim() && attachments.length === 0) || isLoading} className="w-11 h-11 bg-neutral-950 hover:bg-neutral-800 text-white rounded-full flex items-center justify-center disabled:bg-neutral-100 disabled:text-neutral-400 transition-all shrink-0">
                <ArrowUp size={18} className="stroke-[2.5]" />
              </button>
            </div>
          </form>

          {/* DİSCLAIMER / UYARI YAZISI */}
          <div className="mt-3 text-center text-[10px] text-neutral-400 font-medium tracking-wide z-10">
            Sauron bir yapay zeka modeli olduğu için hata yapabilir.
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* GELİŞMİŞ JARVIS AYARLAR MENÜSÜ (ADVANCED SETTINGS MODAL) */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSettingsOpen(false)} 
              className="absolute inset-0 bg-neutral-950/30 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white border border-neutral-200 rounded-[28px] w-full max-w-2xl h-[550px] shadow-2xl z-10 flex overflow-hidden"
            >
              {/* Ayarlar Sidebar */}
              <div className="w-56 bg-neutral-50/50 border-r border-neutral-100 p-5 flex flex-col gap-2">
                <h3 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider mb-2 pl-2">Sistem Kontrol</h3>
                <button onClick={() => setActiveSettingsTab('general')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${activeSettingsTab === 'general' ? 'bg-white shadow-sm border border-neutral-200 text-neutral-950' : 'text-neutral-500 hover:bg-neutral-100'}`}>
                  <Sliders size={15} /> Genel
                </button>
                <button onClick={() => setActiveSettingsTab('memory')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${activeSettingsTab === 'memory' ? 'bg-white shadow-sm border border-neutral-200 text-neutral-950' : 'text-neutral-500 hover:bg-neutral-100'}`}>
                  <Brain size={15} /> Bellek Yönetimi
                </button>
                <button onClick={() => setActiveSettingsTab('advanced')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${activeSettingsTab === 'advanced' ? 'bg-white shadow-sm border border-neutral-200 text-neutral-950' : 'text-neutral-500 hover:bg-neutral-100'}`}>
                  <Cpu size={15} /> Gelişmiş AI
                </button>
              </div>

              {/* Ayarlar İçerik */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-neutral-100">
                  <h2 className="text-lg font-extrabold text-neutral-950">
                    {activeSettingsTab === 'general' && 'Genel Ayarlar'}
                    {activeSettingsTab === 'memory' && 'SauronAI Bellek Ağı'}
                    {activeSettingsTab === 'advanced' && 'Çekirdek Konfigürasyonu'}
                  </h2>
                  <button onClick={() => setSettingsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {/* TAB 1: GENEL */}
                  {activeSettingsTab === 'general' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-2xl bg-neutral-50/50">
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2"><Palette size={16} /> Tema Modu</h4>
                          <p className="text-xs text-neutral-500 mt-1">Şimdilik sadece Saf Beyaz (Modern) tema desteklenmektedir.</p>
                        </div>
                        <div className="px-3 py-1.5 bg-neutral-200/50 text-neutral-600 rounded-lg text-xs font-bold">Kilitli</div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-wider">Veri Yönetimi</h4>
                        <button onClick={() => { if(confirm("Tüm veriler kalıcı olarak silinecek. Emin misin patron?")) { setConversations([]); setActiveId(''); localStorage.removeItem('sauron_chats'); } }} className="w-full flex items-center justify-between p-4 border border-red-200 bg-red-50/50 hover:bg-red-50 rounded-2xl transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><Trash2 size={14} /></div>
                            <div className="text-left">
                              <div className="text-sm font-bold text-red-600">Sohbet Geçmişini Temizle</div>
                              <div className="text-xs text-red-400/80">Lokaldeki tüm görev loglarını siler.</div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: BELLEK */}
                  {activeSettingsTab === 'memory' && (
                    <div className="space-y-5 h-full flex flex-col">
                      <p className="text-xs text-neutral-500 font-medium">SauronAI bu alana eklediğin kuralları ve bilgileri her konuşmada hatırlar. Sistem direktifine doğrudan enjekte edilir.</p>
                      <div className="flex items-center gap-2">
                        <input type="text" placeholder="Yeni bellek kuralı (Örn: Bana hep Kral de)" value={newMemory} onChange={(e) => setNewMemory(e.target.value)} className="flex-1 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-neutral-400 transition-colors" />
                        <button onClick={() => { if(newMemory.trim()) { setMemories([...memories, newMemory.trim()]); setNewMemory(''); } }} className="px-5 py-3 bg-neutral-950 hover:bg-neutral-800 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors"><Save size={16} /> Kaydet</button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto border border-neutral-200 rounded-2xl bg-neutral-50/30 p-2 space-y-1">
                        {memories.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-neutral-400 opacity-60">
                            <HardDrive size={32} className="mb-2" />
                            <span className="text-xs font-bold">Bellek Çekirdeği Boş</span>
                          </div>
                        ) : (
                          memories.map((m, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white border border-neutral-100 rounded-xl shadow-sm group">
                              <span className="text-xs font-medium text-neutral-700 w-[90%] truncate">{m}</span>
                              <button onClick={() => setMemories(memories.filter((_, idx) => idx !== i))} className="text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={16} /></button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: GELİŞMİŞ */}
                  {activeSettingsTab === 'advanced' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-2xl bg-white shadow-sm">
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2"><Shield size={16} className="text-purple-500" /> Toksik Kişilik Modu</h4>
                          <p className="text-xs text-neutral-500 mt-1">SauronAI'ın zorba ve Sigma tavrını korur.</p>
                        </div>
                        <ToggleSwitch enabled={toxicMode} onChange={() => setToxicMode(!toxicMode)} />
                      </div>

                      <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-2xl bg-white shadow-sm">
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2"><Zap size={16} className="text-amber-500" /> Ultra Hızlı Stream</h4>
                          <p className="text-xs text-neutral-500 mt-1">Yazı akışını optimize eder (Önerilir).</p>
                        </div>
                        <ToggleSwitch enabled={streamSpeed} onChange={() => setStreamSpeed(!streamSpeed)} />
                      </div>

                      <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-2xl">
                        <h4 className="text-xs font-extrabold text-emerald-700 flex items-center gap-2 mb-1">Sistem Durumu: Stabil</h4>
                        <p className="text-[11px] text-emerald-600/80 font-mono">Tüm sinyaller aktif. Core v2.5. API Connection: OK.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d4d4d4; }
      `}</style>
    </div>
  );
}
