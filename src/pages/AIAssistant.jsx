import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bot, User as UserIcon, Sparkles, ChevronsRight } from "lucide-react";
import BackgroundAnimation from "../components/UI/BackgroundAnimation.jsx";

// --- Predefined Questions and Answers ---
// You can easily add or edit questions and answers here.
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
    {
      question: "Where can I complete my profile?",
      answer: <>Your profile is key to getting personalized recommendations. You can fill it out on the <Link to="/profile" className="text-emerald-400 underline font-semibold">Profile Page</Link>.</>
    }
  ],
  "Features Explained": [
    {
      question: "How does the Resume Analyzer work?",
      answer: <>The <Link to="/resume-analyzer" className="text-emerald-400 underline font-semibold">Resume Analyzer</Link> matches your resume against a specific job description to see how well you match the role. It provides a match score and suggests keywords you might be missing.</>
    },
    {
      question: "What is the Career Explorer?",
      answer: <>The <Link to="/career-explorer" className="text-emerald-400 underline font-semibold">Career Explorer</Link> is a powerful tool that helps you discover different career paths. Select a field, and we'll generate a detailed roadmap with milestones and learning resources to guide you.</>
    },
    {
        question: "How can I practice for interviews?",
        answer: <>Head to our <Link to="/interview-prep" className="text-emerald-400 underline font-semibold">Interview Prep</Link> section. You can practice with an AI interviewer who will ask you relevant questions and provide feedback on your answers.</>
    },
     {
        question: "What are Career Strategies?",
        answer: <>The <Link to="/strategies" className="text-emerald-400 underline font-semibold">Strategies</Link> page offers proven advice on topics like networking, personal branding, and productivity techniques to help you succeed in your career.</>
    }
  ],
  "Troubleshooting": [
    {
        question: "Why is the page loading slowly?",
        answer: "We use AI to generate personalized content, which can sometimes take a moment. We've optimized our pages to load essential content first, but if you continue to experience issues, please try refreshing the page."
    },
    {
        question: "How do I contact support?",
        answer: "You can reach out to our team by using the 'Contact Us' form in the website footer. We're always happy to help!"
    }
  ]
};


export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content: "Hello! I'm your NexaGen assistant. How can I help you today? Please select a topic below to see common questions.",
    },
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePromptClick = (question, answer) => {
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: question,
    };
    const botResponse = {
      id: Date.now() + 1,
      type: "bot",
      content: answer,
    };
    setMessages([...messages, userMessage, botResponse]);
  };

  return (
    <div className="relative h-full flex flex-col bg-gray-950 text-white">
      <BackgroundAnimation />
      <div className="relative z-10 flex flex-col h-full">
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
            <p className="text-gray-400">Your guide to NexaGen AI's features.</p>
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
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
                {message.type === "user" && (
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(faqs).map(([category, questions]) => (
              <div key={category}>
                <h3 className="text-sm font-bold text-gray-400 mb-2">{category}</h3>
                <div className="space-y-2">
                    {questions.map((q) => (
                        <button
                            key={q.question}
                            onClick={() => handlePromptClick(q.question, q.answer)}
                            className="w-full text-left text-sm font-medium text-gray-300 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                           <ChevronsRight className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                           <span>{q.question}</span>
                        </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}