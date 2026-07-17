'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {Send} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useAuth} from '@/shared/auth/AuthProvider';
import {useRequireAuth} from '@/shared/auth/useRequireAuth';

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

function TypingIndicator() {
  return (
    <div className="flex justify-start px-4 py-1">
      <div className="flex items-center gap-3 rounded-2xl bg-gray-100 px-5 py-4">
        <div className="flex items-center gap-1">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

export function ChatbotPage() {
  const t = useTranslations('chatbot');
  const {isAuthenticated, user} = useAuth();
  const {requireAuth} = useRequireAuth();
  const [messages, setMessages] = useState<Message[]>([
    {id: '1', text: t('intro'), isUser: false, timestamp: new Date()}
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [inputValue]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    if (!isAuthenticated) {
      requireAuth(() => {});
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date()
    };

    const history = messages.map((msg) => ({
      role: msg.isUser ? 'user' as const : 'assistant' as const,
      text: msg.text
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({message: text, history})
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: data.text || 'عذراً، حدث خطأ. حاول مرة أخرى.',
          isUser: false,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.text || 'عذراً، حدث خطأ. حاول مرة أخرى.',
        isUser: false,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'عذراً، حدث خطأ في الاتصال. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isAuthenticated, isLoading, messages, t]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showEmptyState = messages.length <= 1 && !isLoading;

  return (
    <div className="mx-auto flex max-w-5xl flex-1 flex-col overflow-hidden" style={{height: 'calc(100dvh - 4rem)'}}>

      <div className="flex-1 overflow-y-auto">
        {showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
              {t('intro')}
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-6 py-6">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-fade-in-up">
                {msg.isUser ? (
                  <div className="flex justify-end px-4 py-1">
                    <div className="max-w-[75%] rounded-2xl bg-blue-600 px-5 py-3 shadow-sm">
                      <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start px-4 py-1">
                    <div className="max-w-[75%] rounded-2xl bg-gray-100 px-5 py-3">
                      <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading ? <TypingIndicator /> : null}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200/80 bg-white/60 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="flex items-end gap-3 rounded-2xl border border-gray-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md transition focus-within:border-amber-300 focus-within:shadow-md">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('placeholder')}
              disabled={isLoading}
              className="max-h-40 flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
