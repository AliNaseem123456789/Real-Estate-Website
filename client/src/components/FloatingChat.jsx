import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { PLACEHOLDER_IMAGE, formatPrice } from "../utils/format";
import { useLanguage } from "../i18n";

// HomeMate: the FastAPI agent in /chatbot. It keeps the conversation itself
// (session id below), searches the live listings, and asks before it sends
// anything on the visitor's behalf.
const AGENT_URL = import.meta.env.VITE_AGENT_URL || "http://localhost:8000";
const SESSION_KEY = "homemate_session";

const SUGGESTIONS = {
  en: [
    "3 bed house for rent in Lahore under 1 lakh",
    "Is this a fair price?",
    "Which area in Karachi is best value?",
    "What can I afford on 150k a month?",
  ],
  ur: [
    "لاہور میں 3 بیڈ گھر کرائے پر",
    "کیا یہ قیمت مناسب ہے؟",
    "کراچی میں کون سا علاقہ بہتر ہے؟",
    "ایک لاکھ ماہانہ میں کیا مل سکتا ہے؟",
  ],
};

const FloatingChat = ({
  title = "HomeMate Assistant 🏠",
  welcomeMessage = "Hello! Looking for property to buy, sell or rent? Try: “3 bed house for rent in Lahore under 1 lakh” ✨",
  primaryColor = "#10B981",
  userId = null,
}) => {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: welcomeMessage, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openTrace, setOpenTrace] = useState(null);
  const messagesEndRef = useRef(null);

  // One session id per browser tab, so the agent remembers the thread
  const sessionRef = useRef(null);
  if (sessionRef.current === null) {
    try {
      sessionRef.current = sessionStorage.getItem(SESSION_KEY);
    } catch {
      sessionRef.current = null;
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  const ask = async (text, { confirm = false } = {}) => {
    if ((!text.trim() && !confirm) || isLoading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, timestamp: new Date() },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${AGENT_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: sessionRef.current,
          user_id: userId || null,
          language: lang === "ur" ? "ur" : "en",
          confirm,
        }),
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        throw new Error(problem.detail || `Assistant error ${response.status}`);
      }

      const data = await response.json();
      if (data.session_id && data.session_id !== sessionRef.current) {
        sessionRef.current = data.session_id;
        try {
          sessionStorage.setItem(SESSION_KEY, data.session_id);
        } catch {
          // private browsing: the thread just won't survive a reload
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          listings: data.properties || [],
          trace: data.trace || [],
          sources: data.sources || [],
          pendingAction: data.pending_action || null,
          filters: data.filters || {},
          timestamp: new Date(),
        },
      ]);
      if (!isOpen) setUnreadCount((count) => count + 1);
    } catch (error) {
      console.error("HomeMate error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I could not reach the assistant. It may still be waking up — try again in a moment.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      ask(input);
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const searchLink = (filters) => {
    const params = new URLSearchParams();
    if (filters.purpose) params.set("action", filters.purpose);
    if (filters.property_type) params.set("type", filters.property_type);
    if (filters.city) params.set("city", filters.city);
    if (filters.min_price) params.set("minPrice", filters.min_price);
    if (filters.max_price) params.set("maxPrice", filters.max_price);
    if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
    if (filters.bathrooms) params.set("bathrooms", filters.bathrooms);
    const query = params.toString();
    return query ? `/properties?${query}` : "/properties";
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
          style={{ backgroundColor: primaryColor }}
          aria-label="Open the property assistant"
        >
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {isOpen && (
        <div className="flex h-[75vh] max-h-[620px] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:w-[420px]">
          <div
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-xs opacity-90">Searches the live listings</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-white/20"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[88%]">
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.role === "user" ? "text-white" : "bg-white text-gray-800 shadow-sm"
                    } ${message.isError ? "bg-red-50 text-red-800" : ""}`}
                    style={message.role === "user" ? { backgroundColor: primaryColor } : {}}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>

                    {message.listings?.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.listings.map((property) => (
                          <Link
                            key={property.id}
                            to={property.url}
                            className="flex items-center gap-2 rounded-lg border p-1 hover:bg-gray-50"
                          >
                            <img
                              src={property.image || PLACEHOLDER_IMAGE}
                              alt=""
                              className="h-12 w-16 rounded object-cover"
                            />
                            <span className="text-xs">
                              <span className="block font-semibold line-clamp-1">{property.title}</span>
                              {property.city} · {formatPrice(property.price)}
                              {property.action === "rent" ? " / month" : ""}
                            </span>
                          </Link>
                        ))}
                        <Link
                          to={searchLink(message.filters || {})}
                          className="block text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          See all matching properties →
                        </Link>
                      </div>
                    )}

                    {/* An action the agent wants to take, waiting on the visitor */}
                    {message.pendingAction && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2">
                        <p className="text-xs font-semibold text-amber-900">Confirm first</p>
                        <p className="mt-1 text-xs text-amber-800">{message.pendingAction.summary}</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => ask("Yes, go ahead.", { confirm: true })}
                            disabled={isLoading}
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => ask("No, cancel that.")}
                            disabled={isLoading}
                            className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-white disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {message.sources?.length > 0 && (
                      <p className="mt-2 border-t border-gray-100 pt-2 text-[11px] text-gray-500">
                        Based on: {message.sources.join(" · ")}
                      </p>
                    )}

                    {/* The agent's own steps, so the reasoning is visible rather than magic */}
                    {message.trace?.length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => setOpenTrace(openTrace === index ? null : index)}
                          className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
                        >
                          {openTrace === index ? "Hide" : "How I worked this out"} ({message.trace.length})
                        </button>
                        {openTrace === index && (
                          <ol className="mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                            {message.trace.map((step, stepIndex) => (
                              <li key={stepIndex} className="text-[11px] text-gray-600">
                                <span className="font-semibold">{step.step}</span>: {step.detail}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}
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
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
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

          <div className="border-t border-gray-100 bg-white px-4 py-2">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(SUGGESTIONS[lang] || SUGGESTIONS.en).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => ask(suggestion)}
                  disabled={isLoading}
                  className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={lang === "ur" ? "اپنا سوال لکھیں..." : "Ask about any property..."}
                className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                rows={1}
              />
              <button
                onClick={() => ask(input)}
                disabled={isLoading || !input.trim()}
                className="rounded-xl px-4 py-2 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
                aria-label="Send"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-gray-400">
              Answers come from the live listings. Verify documents before paying anything.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
        .animate-bounce { animation: bounce 1.4s infinite ease-in-out; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}</style>
    </div>
  );
};

export default FloatingChat;
