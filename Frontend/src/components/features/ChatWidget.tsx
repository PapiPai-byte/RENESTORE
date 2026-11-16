// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { chatApi } from '@/services/chatService';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  followups?: string[];
  loading?: boolean;
}

export const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestedFaq[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatApi.getSuggestedFaqs().then(setSuggestions).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const addMessage = (msg: Partial<Message>) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), ...msg }]);
  };

  const updateLastMessage = (update: Partial<Message>) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== 'bot') return prev;
      return [...prev.slice(0, -1), { ...last, ...update }];
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    addMessage({ role: 'user', content: text.trim() });
    setInput('');
    setLoading(true);
    addMessage({ role: 'bot', content: '', loading: true });

    try {
      const fullContent: string[] = [];
      let followups: string[] = [];

      for await (const event of chatApi.streamChat(text)) {
        if ('token' in event) {
          const cleanToken = event.token.replace(/\[FOLLOWUP:[^\]]*\]/g, '');
          fullContent.push(cleanToken);
          updateLastMessage({ content: fullContent.join(''), loading: false });
        } else if ('followups' in event) {
          followups = event.followups;
          updateLastMessage({ followups });
        } else if ('error' in event) {
          updateLastMessage({ content: `Error: ${event.error}`, loading: false });
        }
      }

      // Increment click count on matched FAQs
      if (followups.length === 0 && fullContent.length > 0) {
        // Could track which FAQ was matched and increment here
      }
    } catch (err: any) {
      updateLastMessage({ content: err.message ?? 'Failed to get response', loading: false });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (faq: SuggestedFaq) => {
    await chatApi.incrementFaqClick(faq.id);
    await sendMessage(faq.question);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full',
          'bg-gradient-to-br from-bright to-primary text-abyss',
          'shadow-glow hover:scale-105 transition-all duration-200',
          'flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/70'
        )}
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          )}
        </svg>
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            'fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)]',
            'glass-strong rounded-2xl shadow-glow flex flex-col overflow-hidden',
            'animate-slide-up'
          )}
          role="dialog"
          aria-label="Chat widget"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bright to-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-abyss" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white">ReneBot</h3>
              <p className="text-xs text-white/50">How can I help?</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/50 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/70 rounded p-1"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[50vh]">
            {messages.length === 0 && suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-white/50 mb-3">Suggested questions:</p>
                {suggestions.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => handleSuggestionClick(faq)}
                    className="w-full text-left text-sm text-white/70 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/70"
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-primary/80 text-white'
                      : 'glass-subtle text-white/90'
                  )}
                >
                  {msg.content ? msg.content.replace(/\[FOLLOWUP:.*?\]/g, '').trim() : (msg.loading ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </span>
                  ) : null)}
                </div>
              </div>
            ))}

            {/* Follow-up chips */}
            {messages[messages.length - 1]?.followups?.map((fq, i) => (
              <button
                key={i}
                onClick={() => sendMessage(fq)}
                className="w-full text-left text-xs text-cyan-300/80 hover:text-cyan-200 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors"
              >
                → {fq}
              </button>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products, shipping..."
                className="flex-1 glass-input text-sm"
                disabled={loading}
                aria-label="Chat message"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-3 py-2 bg-primary/80 hover:bg-primary text-white rounded-lg transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/70"
                aria-label="Send message"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
