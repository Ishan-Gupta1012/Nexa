import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bot, User as UserIcon, Sparkles, ChevronsRight, X } from "lucide-react";

const faqs = {
  "Getting Started": [
    {
      question: "What is NexaGen AI?",
      answer: "NexaGen AI is your personal career assistant! We use AI to help you build resumes, analyze them against job descriptions, prepare for interviews, and create a personalized career roadmap to guide you to your dream job."
    },
    {
      question: "How do I build a resume?",
      answer: <>You can start creating a new resume by visiting the <Link to="/resume-builder" className="text-emerald-400 underline font-semibold">Resume Builder</Link> page. Our builder will guide you step-by-step.</>
    },
  ],
  "Features Explained": [
    {
      question: "How does the Resume Analyzer work?",
      answer: <>The <Link to="/resume-analyzer" className="text-emerald-400 underline font-semibold">Resume Analyzer</Link> matches your resume against a specific job description to see how well you match the role.</>
    },
    {
      question: "What is the Career Explorer?",
      answer: <>The <Link to="/career-explorer" className="text-emerald-400 underline font-semibold">Career Explorer</Link> generates a detailed, step-by-step plan for any career you want to pursue, complete with learning resources.</>
    },
  ],
};

export default function ChatWidget({ onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content: "Hello! How can I help you? Please select a prompt below.",
    },
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePromptClick = (question, answer) => {
    const userMessage = { id: Date.now(), type: "user", content: question };
    const botResponse = { id: Date.now() + 1, type: "bot", content: answer };
    setMessages([...messages, userMessage, botResponse]);
  };

  return (
    <div className="fixed bottom-24 right-8 z-50 w-full max-w-sm h-[70vh] max-h-[500px] bg-gray-900/80 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl flex flex-col transition-all duration-300">
      <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Assistant</h1>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 text-sm ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            {message.type === "bot" && (
              <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl p-3 ${message.type === "user" ? "bg-emerald-500/20 text-emerald-200" : "bg-gray-800 text-gray-300"}`}>
              {message.content}
            </div>
            {message.type === "user" && (
              <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <UserIcon className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 overflow-y-auto max-h-48">
        <div className="space-y-2">
            {Object.entries(faqs).map(([category, questions]) => (
                <div key={category}>
                    <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase">{category}</h3>
                    {questions.map(q => (
                        <button key={q.question} onClick={() => handlePromptClick(q.question, q.answer)} className="w-full text-left text-sm text-gray-300 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2">
                            <ChevronsRight className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                            <span>{q.question}</span>
                        </button>
                    ))}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}