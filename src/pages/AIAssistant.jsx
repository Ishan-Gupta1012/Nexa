import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { fetchWithRetry } from "../utils/api.js";
// import { callGeminiApi } from '../utils/geminiApi.js'; // Import the new utility
import {
  MessageSquare,
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  Loader2,
  Plus,
  Menu,
  Trash2,
  Edit3, // CHANGE: Added new icon for "New Chat"
} from "lucide-react";

const quickPrompts = [
  "How can I improve my resume for a tech role?",
  "What are the key skills for a Project Manager?",
  "Suggest some learning resources for Python.",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      type: "bot",
      content: "Hello! Start a new conversation or select a previous one.",
    },
  ]);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const messagesEndRef = useRef(null);
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize(); 
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  useEffect(() => {
    const loadHistory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });
        setChatHistory(data || []);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const saveConversation = async () => {
      if (messages.length < 2) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const title = messages[1]?.content.substring(0, 40) + "...";
      const sessionData = {
        id: currentSessionId,
        user_id: user.id,
        title,
        messages: messages,
        updated_at: new Date(),
      };
      if (!currentSessionId) {
        delete sessionData.id;
      }

      const { data: savedSession, error } = await supabase
        .from("chat_sessions")
        .upsert(sessionData)
        .select()
        .single();

      if (error) {
        console.error("Error saving session:", error);
      } else if (savedSession) {
        if (!currentSessionId) setCurrentSessionId(savedSession.id);
        setChatHistory((prev) => {
          const existing = prev.find((s) => s.id === savedSession.id);
          if (existing) {
            return prev
              .map((s) => (s.id === savedSession.id ? savedSession : s))
              .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
          }
          return [savedSession, ...prev].sort(
            (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
          );
        });
      }
    };
    const debounceSave = setTimeout(saveConversation, 1500);
    return () => clearTimeout(debounceSave);
  }, [messages, currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startNewChat = () => {
    setMessages([
      {
        id: Date.now(),
        type: "bot",
        content: "Hello! How can I assist you today?",
      },
    ]);
    setCurrentSessionId(null);
    if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
    }
  };

  const loadChatSession = (session) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);
      if (error) {
        alert("Failed to delete chat.");
      } else {
        setChatHistory((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          startNewChat();
        }
      }
    }
  };

  const sendMessage = async (messageText = null) => {
    const message = messageText || inputMessage.trim();
    if (!message || isLoading) return;
    const userMessage = { id: Date.now(), type: "user", content: message };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase.from("profiles").select("*").eq("id", user.id).single()
        : { data: null };
      const context = profile
        ? `Context: Role - ${profile.current_role}, Goals - ${profile.career_goals}.`
        : "";
      const conversationHistory = updatedMessages.map((m) => ({
        role: m.type === "bot" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: conversationHistory }),
        }
      );
      if (!response.ok) throw new Error(`API call failed`);
      const responseData = await response.json();
      const botResponseText = responseData.candidates[0].content.parts[0].text;
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: botResponseText,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error)
    {
      console.error("Error in sendMessage:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- CHANGE: The entire ChatHistorySidebar has been redesigned ---
  const ChatHistorySidebar = ({ onClose }) => (
    <div className="flex flex-col h-full bg-gray-900/70 backdrop-blur-lg border-r border-white/10 overflow-hidden p-2">
      {/* Top bar with Close and New Chat buttons */}
      <div className="flex items-center justify-between p-2">
         <button
          onClick={startNewChat}
          className="flex items-center gap-3 text-sm font-medium text-gray-200 p-2 rounded-lg hover:bg-white/10 w-full"
        >
          <Edit3 size={16} />
          New Chat
        </button>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 rounded-lg hover:bg-white/10"
          title="Close Sidebar"
        >
          <Menu size={20} />
        </button>
      </div>
      
      {/* Recent Chats Section */}
      <div className="flex-1 mt-4 overflow-y-auto">
        <h3 className="px-2 text-sm font-semibold text-gray-400 tracking-wide">Recent</h3>
        <div className="mt-2 space-y-1">
          {chatHistory.map((session) => (
            <div key={session.id} className="relative group">
              <button
                onClick={() => loadChatSession(session)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-left transition-colors ${
                  currentSessionId === session.id
                    ? "bg-emerald-500/20 text-emerald-200" // Kept your active style
                    : "text-gray-300 hover:bg-white/10"
                }`}
              >
                <MessageSquare size={16} className="flex-shrink-0" />
                <span className="truncate flex-1">{session.title || "New Conversation"}</span>
              </button>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-md"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-950">
      {/* Sidebar for Mobile */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity ${
          isSidebarOpen ? "bg-black/50" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>
      <div
        className={`fixed inset-y-0 left-0 z-50 w-3/4 sm:w-64 transform transition-transform lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ChatHistorySidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Sidebar for Desktop */}
      <div className={`hidden lg:block h-full transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen ? 'w-72' : 'w-0'}`}>
        <div className="w-72 h-full">
            <ChatHistorySidebar onClose={() => setIsSidebarOpen(false)} />
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center gap-4">
          {!isSidebarOpen && (
            <button
              className="text-white"
              onClick={() => setIsSidebarOpen(true)}
              title="Open Sidebar"
            >
              <Menu />
            </button>
          )}
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              AI Career Assistant
            </h1>
            <p className="text-gray-400">
              Your personalized career guidance expert
            </p>
          </div>
        </div>

        <div className="flex-1 p-4 pt-6 sm:p-6 overflow-y-auto">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.type === "bot" && (
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl p-3 shadow-md ${
                    message.type === "user"
                      ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-200"
                      : "bg-gray-800 border border-gray-700 text-gray-300"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                {message.type === "user" && (
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-gray-400" />
                </div>
                <div className="max-w-[80%] rounded-xl p-3 bg-gray-800 border border-gray-700">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <p className="text-gray-400 font-medium text-sm">
                      AI is thinking...
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-white/10">
          <div className="flex flex-wrap gap-2 mb-4">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={isLoading}
                className="text-xs font-semibold border border-gray-700 rounded-full px-3 py-1 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me anything..."
              className="flex-1 font-medium p-3 bg-gray-800 border border-gray-700 rounded-lg w-full text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold px-4 py-2 rounded-lg text-white disabled:bg-gray-600"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}