// src/components/FloatingChat.jsx
import React, { useState, useRef, useEffect } from "react";

const FloatingChat = ({
  botId = "ecommerce",
  apiUrl = "https://chatbot-gateway.onrender.com",
  title = "AI Assistant",
  welcomeMessage = "Hello! How can I help you today?",
  primaryColor = "#3B82F6",
  userId = null,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([
    { role: "assistant", content: welcomeMessage, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        setUnreadCount((prev) => prev + 1);
      }
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/chat/${botId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          user_id: userId || localStorage.getItem("userId") || "anonymous",
          conversation_history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);

      if (isOpen) {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button - Only visible when chat is closed */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
          style={{ backgroundColor: primaryColor }}
        >
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex h-[550px] w-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-xs opacity-90">Online • AI Assistant</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-white/20"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] ${message.role === "user" ? "order-2" : "order-1"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "text-white"
                        : "bg-white text-gray-800 shadow-sm"
                    } ${message.isError ? "bg-red-100 text-red-800" : ""}`}
                    style={
                      message.role === "user"
                        ? { backgroundColor: primaryColor }
                        : {}
                    }
                  >
                    <p className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </p>
                  </div>
                  <p
                    className={`mt-1 text-xs text-gray-400 ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-4 py-2 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="border-t border-gray-100 bg-white px-4 py-2">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {getSuggestions(botId).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    setTimeout(() => sendMessage(), 100);
                  }}
                  className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ focusRingColor: primaryColor }}
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="rounded-xl px-4 py-2 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-gray-400">
              Powered by AI • Responses are generated automatically
            </p>
          </div>
        </div>
      )}

      {/* Global styles for animations */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
        .animate-bounce {
          animation: bounce 1.4s infinite ease-in-out;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}</style>
    </div>
  );
};

// Helper function for bot-specific suggestions
const getSuggestions = (botId) => {
  const suggestions = {
    salt: [
      "Show me salt lamps",
      "Do you ship internationally?",
      "Bulk order discounts",
      "Are lamps genuine?",
    ],
    ecommerce: [
      "Show me laptops under $500",
      "Best selling items",
      "Shipping policy",
      "Track my order",
    ],
    realestate: [
      "Properties for sale",
      "Rental apartments",
      "Mortgage rates",
      "Investment properties",
    ],
  };
  return suggestions[botId] || suggestions.ecommerce;
};

export default FloatingChat;
