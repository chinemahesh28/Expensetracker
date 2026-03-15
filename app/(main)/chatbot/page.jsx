"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      role: "model",
      content: "Hello! I am FinanceBudy, your AI finance assistant. How can I help you today with your budget, investments, or money management?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "model", content: data.text },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 mt-20 px-4 h-[calc(100vh-100px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-400 bg-clip-text text-transparent">
          FinanceBudy AI Assistant
        </h1>
        <p className="text-gray-500 mt-2">
          Ask me anything about personal finance, budgeting, and investments.
        </p>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col blur-backdrop-filter">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-4 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-teal-100 text-teal-600"
                }`}
              >
                {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
              </div>
              
              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none whitespace-pre-wrap"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
                <Bot size={20} />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 shadow-sm rounded-tl-none flex items-center gap-2">
                <Loader2 size={18} className="animate-spin text-teal-600" />
                <span className="text-gray-500 text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3 w-full"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a finance question..."
              className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-full w-12 h-12 flex items-center justify-center p-0 shadow-md hover:shadow-lg transition-transform hover:scale-105"
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
