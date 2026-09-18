'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, Phone, MapPin, Sparkles, CheckCheck } from 'lucide-react';
import { ChatMessage, AdminSettings } from '@/lib/types';

interface ChatSupportProps {
  settings?: AdminSettings;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'bot',
    sender_name: 'BEST Inc. Support Bot',
    text: 'Maayong adlaw! Welcome sa Balamban BEST Inc. Pickleball Support. Unsay among ma-tabang nimo karon?',
    timestamp: 'Just now'
  }
];

export default function ChatSupport({ settings }: ChatSupportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('balamban_chat_messages');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const saveMessages = (msgs: ChatMessage[]) => {
    setMessages(msgs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('balamban_chat_messages', JSON.stringify(msgs));
    }
  };

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      sender_name: 'You',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, userMsg];
    saveMessages(updated);
    if (!textToSend) setInputText('');

    // Trigger auto bot reply based on keywords
    setTimeout(() => {
      const lower = text.toLowerCase();
      let botText = '';

      if (lower.includes('book') || lower.includes('unsaon') || lower.includes('reserve')) {
        botText = 'Aron magpa-book og Pickleball Court, i-click ra ang "BOOK A COURT NOW" button sa taas, pilia ang court, petsa, ug orasan (6 AM - 10 PM). Instant lock ang slots!';
      } else if (lower.includes('pay') || lower.includes('payment') || lower.includes('landbank') || lower.includes('gcash') || lower.includes('maya')) {
        const lb = settings?.landbank_number || '1234-5678-9012';
        const gc = settings?.contact_phone || '0917-888-9900';
        botText = `Modawat kami ug Scan-to-Pay sa Landbank (Acct: ${lb}), GCash (${gc}), ug Maya QR. Naa kay Scan-to-Pay QR code sa confirmation screen!`;
      } else if (lower.includes('hour') || lower.includes('oras') || lower.includes('time') || lower.includes('location') || lower.includes('asan')) {
        const addr = settings?.location_address || 'Poblacion / Bano, Balamban, Cebu';
        botText = `Abli kami kada adlaw (Monday - Sunday) gikan 6:00 AM hangtod 10:00 PM sa ${addr}. GPS: 10.5124145, 123.7298596.`;
      } else if (lower.includes('admin') || lower.includes('hotline') || lower.includes('contact') || lower.includes('tawag')) {
        const phone = settings?.contact_phone || '0917-888-9900';
        botText = `Pwede ka mo-tawag o mo-text sa among Court Admin Hotline sa ${phone} o mag-email sa ${settings?.contact_email || 'booking@balambanbest.ph'}.`;
      } else {
        botText = `Salamat sa imong mensahe! Nakuha na sa among Court Admin sa BEST Inc. Balamban ang imong inquiry. Pwede usab ka mo-contact sa Hotline: ${settings?.contact_phone || '0917-888-9900'}.`;
      }

      const botReply: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        sender_name: 'BEST Inc. Support Bot',
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      saveMessages([...updated, botReply]);
    }, 600);
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-40 px-4 py-3 rounded-full bg-slate-900 hover:bg-lime-600 text-white hover:text-slate-950 font-black text-xs transition-all shadow-2xl flex items-center gap-2 border-2 border-lime-400 active:scale-95 group cursor-pointer"
        title="Open Live Chat Support"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5 text-lime-400 group-hover:text-slate-950 transition" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white"></span>
        </div>
        <span>Chat Support</span>
      </button>

      {/* Floating Chat Widget Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] h-[520px] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 text-slate-900">
          
          {/* Widget Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="relative w-9 h-9 rounded-xl bg-lime-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
              </div>
              <div>
                <h3 className="text-xs font-black tracking-tight flex items-center gap-1.5">
                  <span>BEST Inc. Court Support</span>
                  <span className="text-[10px] bg-lime-400/20 text-lime-400 px-1.5 py-0.5 rounded font-mono">LIVE</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Balamban Pickleball Assistance</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Suggestion Pills */}
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex gap-1.5 overflow-x-auto no-scrollbar text-[10px] font-bold">
            <button
              onClick={() => handleSendMessage('Unsaon pag-book ug Court?')}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-lime-100 border border-slate-200 text-slate-700 hover:text-slate-900 shrink-0 transition shadow-xs"
            >
              🎾 How to Book?
            </button>
            <button
              onClick={() => handleSendMessage('Unsaon pag-pay sa Landbank / GCash?')}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-lime-100 border border-slate-200 text-slate-700 hover:text-slate-900 shrink-0 transition shadow-xs"
            >
              💳 Payment QR
            </button>
            <button
              onClick={() => handleSendMessage('Unsa inyong Operating Hours?')}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-lime-100 border border-slate-200 text-slate-700 hover:text-slate-900 shrink-0 transition shadow-xs"
            >
              ⏰ Operating Hours
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs font-sans">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 mb-1 text-[10px] text-slate-500 font-bold">
                  <span>{m.sender_name}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-medium shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-lime-500 text-slate-950 rounded-br-none font-bold'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="I-type imong pangutana diri..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-lime-600 font-medium"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-lime-500 hover:bg-lime-600 disabled:opacity-40 text-slate-950 font-bold transition shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
