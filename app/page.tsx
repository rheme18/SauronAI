'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowUp, Lock, ShieldAlert, Cpu, Plus, X, FileText, ImageIcon, Brain, ChevronDown } from 'lucide-react';
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
// CoT Panel bileşeni
// ----------------------------------------------------------------
function ThinkingPanel({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2 w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-violet-500 bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition-colors duration-200"
      >
        <Brain size={12} />
        <span>Düşünce Zinciri</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 text-[11px] text-violet-700 bg-violet-50 border border-violet-100 rounded-xl p-3 leading-relaxed max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
              {thinking}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------
// Dosya / Attachment önizleme küçük kart
// ----------------------------------------------------------------
function AttachmentChip({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  return (
    <div className="relative flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs text-neutral-700 group">
      {att.type === 'image' ? (
        att.previewUrl ? (
          <img src={att.previewUrl} alt={att.name} className="w-5 h-5 rounded object-cover" />
        ) : (
          <ImageIcon size={12} className="text-neutral-400" />
        )
      ) : (
        <FileText size={12} className="text-neutral-400" />
      )}
      <span className="max-w-[100px] truncate">{att.name}</span>
      <button
        onClick={onRemove}
        className="ml-1 text-neutral-400 hover:text-red-500 transition-colors"
      >
        <X size={10} />
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// Ana Bileşen
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
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Model menüsü dışarı tıklanınca kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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

  // Dosya okuyucu yardımcı
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
        const isText = file.type.startsWith('text/');

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
  // Streaming mesaj gönderme
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

    // Boş asistan mesajı oluştur (stream dolduracak)
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

      if (!response.ok || !response.body) {
        throw new Error('Stream başlatılamadı');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let thinkingText = '';
      let inThink = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.done) break;
            if (parsed.error) {
              fullText += `⚠️ Hata: ${parsed.error}`;
              break;
            }
            if (parsed.delta) {
              fullText += parsed.delta;

              // CoT ayrıştırma: <think>...</think>
              let displayText = fullText;
              const thinkStart = fullText.indexOf('<think>');
              const thinkEnd = fullText.indexOf('</think>');

              if (thinkStart !== -1 && thinkEnd !== -1) {
                thinkingText = fullText.slice(thinkStart + 7, thinkEnd);
                displayText = fullText.slice(0, thinkStart) + fullText.slice(thinkEnd + 8);
              } else if (thinkStart !== -1) {
                // Henüz kapanmadı
                thinkingText = fullText.slice(thinkStart + 7);
                displayText = fullText.slice(0, thinkStart);
              }

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: displayText.trim(), thinking: thinkingText || undefined }
                    : m
                )
              );
            }
          } catch {
            // parse hatası yok say
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: '🔴 Sunucuyla bağlantı kurulurken kritik bir hata oluştu.' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Input bar (hem landing hem sohbet için ortak)
  // ----------------------------------------------------------------
  const InputBar = ({ placeholder, className = '' }: { placeholder: string; className?: string }) => (
    <form
      onSubmit={handleSendMessage}
      className={`w-full bg-white border border-neutral-200 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] focus-within:border-neutral-400 transition-all duration-300 ${className}`}
    >
      {/* Attachment önizlemeleri */}
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
        {/* + Buton (dosya/resim) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setAttachMenuOpen((v) => !v)}
            className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all duration-200 shrink-0"
          >
            <Plus size={16} />
          </button>

          <AnimatePresence>
            {attachMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-12 left-0 bg-white border border-neutral-200 rounded-2xl shadow-lg p-1.5 min-w-[150px] z-50"
              >
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors"
                >
                  <ImageIcon size={14} className="text-neutral-400" />
                  Resim Yükle
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-xl transition-colors"
                >
                  <FileText size={14} className="text-neutral-400" />
                  Dosya Yükle
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text input */}
        <input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-neutral-900 focus:outline-none placeholder:text-neutral-400"
        />

        {/* Model seçici */}
        <div className="relative mr-1" ref={modelMenuRef}>
          <button
            type="button"
            onClick={() => setModelMenuOpen((v) => !v)}
            className="flex items-center gap-1 h-8 px-2.5 text-[11px] font-medium text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-neutral-300 hover:text-neutral-700 transition-all duration-200 shrink-0"
          >
            {MODEL_LABELS[model]}
            <motion.span animate={{ rotate: modelMenuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={10} />
            </motion.span>
          </button>

          <AnimatePresence>
            {modelMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-10 right-0 bg-white border border-neutral-200 rounded-2xl shadow-lg p-1.5 min-w-[120px] z-50"
              >
                {(Object.keys(MODEL_LABELS) as ModelType[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setModel(m); setModelMenuOpen(false); }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-xl transition-colors ${model === m ? 'bg-neutral-950 text-white' : 'text-neutral-700 hover:bg-neutral-50'}`}
                  >
                    {MODEL_LABELS[m]}
                    {model === m && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-2" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gönder butonu */}
        <button
          type="submit"
          disabled={(!input.trim() && attachments.length === 0) || isLoading}
          className="w-9 h-9 bg-neutral-950 hover:bg-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-300 text-white rounded-xl flex items-center justify-center transition-all duration-200 shrink-0"
        >
          <ArrowUp size={14} className="stroke-[2.5]" />
        </button>
      </div>
    </form>
  );

  // ----------------------------------------------------------------
  // Giriş Ekranı
  // ----------------------------------------------------------------
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
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-white mb-4 shadow-md"
            >
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
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-100"
                >
                  <ShieldAlert size={14} /> <span>Şifre hatalı, patron!</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="submit"
              className="w-full py-4 bg-neutral-950 hover:bg-neutral-900 text-white text-sm font-medium rounded-2xl transition-colors duration-200"
            >
              Sistemi Başlat
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Ana Arayüz
  // ----------------------------------------------------------------
  return (
    <div className="relative min-h-screen w-full bg-white bg-grid flex flex-col">
      {/* Gizli file input'lar */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.csv,.js,.ts,.py,.json,.html,.css"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'file')}
      />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-neutral-100 z-50 px-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-neutral-950 rounded-lg flex items-center justify-center text-white">
            <Cpu size={14} />
          </div>
          <span className="font-bold text-sm tracking-tight text-neutral-950">SauronAI</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-neutral-400">{MODEL_LABELS[model]}</span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Çevrimiçi
          </span>
        </div>
      </motion.header>

      {/* İçerik */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-4 pt-24 pb-36">
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            /* Landing */
            <motion.div
              key="landing"
              exit={{ opacity: 0, y: -50, transition: { duration: 0.4 } }}
              className="w-full flex flex-col items-center justify-center text-center py-12"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm"
              >
                <Sparkles size={28} className="text-neutral-950 stroke-[1.5]" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-950 mb-3"
              >
                Dalmaya Hazır Mısın?
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-neutral-400 max-w-sm mb-10 font-light"
              >
                SauronAI mutlak stratejik deha ile emrinde. Gelişmiş bellek algoritmaları aktiftir.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-xl"
              >
                <InputBar placeholder="SauronAI'a bir görev ver..." />
              </motion.div>
            </motion.div>
          ) : (
            /* Sohbet */
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col gap-6">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex w-full flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Attachment önizleme (kullanıcı mesajı) */}
                  {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 justify-end max-w-[88%]">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs text-neutral-600"
                        >
                          {att.type === 'image' && att.previewUrl ? (
                            <img src={att.previewUrl} alt={att.name} className="w-5 h-5 rounded object-cover" />
                          ) : (
                            <FileText size={12} />
                          )}
                          <span className="max-w-[100px] truncate">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CoT panel (asistan) */}
                  {msg.role === 'assistant' && msg.thinking && (
                    <div className="max-w-[88%]">
                      <ThinkingPanel thinking={msg.thinking} />
                    </div>
                  )}

                  {/* Mesaj balonu */}
                  {(msg.content || msg.role === 'assistant') && (
                    <div
                      className={`max-w-[88%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-neutral-950 text-white rounded-tr-none'
                          : 'bg-neutral-50 text-neutral-900 border border-neutral-100 rounded-tl-none prose prose-sm max-w-none'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : msg.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      ) : (
                        /* Stream başladı ama henüz içerik yok */
                        <span className="text-neutral-400 text-xs italic">yazıyor...</span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Loading dots (sadece CoT gelene kadar) */}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start items-center gap-2.5 text-neutral-400 text-xs font-medium p-2"
                >
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

      {/* Sabit alt input (sohbet başladıktan sonra) */}
      <AnimatePresence>
        {hasStarted && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4 z-40"
          >
            <div className="w-full max-w-xl mx-auto">
              <InputBar placeholder="Sohbete devam et..." />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
