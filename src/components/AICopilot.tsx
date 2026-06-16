/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, X, CornerDownLeft, Award, HelpCircle, Bot } from "lucide-react";
import { ChatMessage } from "../types";
import { authFetch } from "../auth/AuthContext";

interface AICopilotProps {
  dataContext: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function AICopilot({ dataContext, isOpen, onClose }: AICopilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "Assalamu'alaikum! Saya adalah LUXORA AI, asisten pintar penjualan lampu, POS, serta sistem analisis Keuangan & Syariah. Hubungi saya untuk bantuan: \n\n• 📈 Sales Insight & Trend\n• 📦 Inventory Prediction & Safety Stock\n• 💸 Profit Forecast & COGS Audit\n• ⚠️ Return Risk Analysis (Logistik/Pecah)\n• 🔍 Advertising Efficiency Analysis (Shopee Ads ROI)\n• 🕌 Sharia Compliance Advisor (Zakat & Muamalah)\n• 🏥 Business Health Monitoring",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggested quick prompts specified by user
  const suggestions = [
    { query: "Produk mana yang paling menguntungkan?", label: "📈 Produk Teruntung" },
    { query: "Wilayah mana yang paling loyal?", label: "🗺️ Wilayah Loyal" },
    { query: "Kenapa laba saya tertekan atau turun?", label: "📉 Analisis Laba" },
    { query: "Berapa zakat mal yang harus saya penuhi?", label: "🕌 Zakat Mal Audit" }
  ];

  // Keep chat scrolled
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // Append user message
    const userMsg: ChatMessage = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await authFetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          history: messages.slice(-5), // Send last 5 chats context
          dataContext
        })
      });

      const result = await response.json();
      
      const aiMsg: ChatMessage = {
        sender: "ai",
        text: result.text || "Mohon maaf, terjadi kendala pada sambungan AI.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Copilot Fetch Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Maaf, kendala jaringan menghalangi saya memberikan jawaban kontribusi langsung.",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-6 bottom-6 w-96 h-[540px] bg-white dark:bg-slate-800 rounded-2xl border border-emerald-500/30 shadow-2xl flex flex-col z-50 overflow-hidden">
      
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 dark:from-slate-900 dark:to-slate-850 p-4 text-white flex items-center justify-between border-b dark:border-slate-750">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-white/10 dark:bg-emerald-500/20 rounded-lg">
            <Bot className="w-5 h-5 text-amber-400 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm tracking-tight leading-none block">LUXORA AI</span>
              <span className="px-1.5 py-0.5 text-[8px] bg-amber-400/20 text-amber-300 font-bold uppercase rounded border border-amber-400/35 leading-none">
                AI ANALYTICS ENGINE
              </span>
            </div>
            <span className="text-[10px] text-emerald-250 mt-1 block">Smart Business & Sharia Advisor</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 dark:hover:bg-slate-700 rounded-lg text-white/80 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* CHAT BUBBLES LIST */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900/60 text-2xs leading-relaxed"
      >
        {messages.map((msg, index) => {
          const isUser = msg.sender === "user";
          return (
            <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl relative shadow-2xs select-text ${
                  isUser
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-750 rounded-tl-none font-sans"
                }`}
              >
                {/* Visual glow bulb accent behind AI response */}
                {!isUser && (
                  <div className="absolute top-2 right-2 text-[8px] font-black text-emerald-600/10 dark:text-emerald-400/5 select-none pointer-events-none uppercase">
                    💡 LUXORA
                  </div>
                )}

                {/* Render Text, using nice breaks on newline */}
                <div className="whitespace-pre-line leading-relaxed font-medium">
                  {msg.text}
                </div>

                {/* Timestamp */}
                <div className={`text-[8px] mt-1.5 font-bold ${isUser ? "text-white/60 text-right" : "text-slate-400 dark:text-slate-500"}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* LOADING ANCHOR */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl rounded-tl-none border dark:border-slate-750 flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              <span className="text-[10px] font-bold text-slate-400">Gemini menelaah buku...</span>
            </div>
          </div>
        )}
      </div>

      {/* QUICK PRE-SET SUGGESTIONS */}
      <div className="p-2 border-t bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-750/50 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
        {suggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(sug.query)}
            className="px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-900/60 dark:hover:bg-slate-750 dark:hover:text-amber-400 text-[10px] font-bold text-slate-500 rounded-lg transition-all cursor-pointer border dark:border-slate-750"
          >
            {sug.label}
          </button>
        ))}
      </div>

      {/* INPUT CONTROL BAR */}
      <div className="p-3 bg-white dark:bg-slate-850 border-t border-slate-150 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
          placeholder="Tulis pertanyaan akuntansi syariah/BI..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 text-2xs text-slate-800 dark:text-slate-100 p-2.5 border dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
        />

        <button
          onClick={() => handleSendMessage(inputText)}
          disabled={!inputText.trim()}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shadow"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
