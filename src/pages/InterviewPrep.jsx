import React, { useState, useRef, useEffect, useCallback } from "react";

import { fetchWithRetry, getApiKey } from "../utils/api";
import { Mic, Send, Bot, User as UserIcon, Loader2, Award, Star, ThumbsDown, ArrowLeft } from "lucide-react";

// --- Speech Recognition Setup for best performance ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = true; // Keep listening even after a pause
  recognition.interimResults = true; // Get results as the user speaks
  recognition.lang = 'en-US';
}

// --- Main Component ---
export default function InterviewPrep() {
    const [currentView, setCurrentView] = useState('setup'); // 'setup', 'interviewing', 'feedback'
    const [jobTitle, setJobTitle] = useState('');
    const [messages, setMessages] = useState([]);
    const [transcript, setTranscript] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const finalTranscriptRef = useRef('');

    const speak = (text) => {
        if (!text || typeof window.speechSynthesis === 'undefined') return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/_|\*/g, ''));
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (currentView === 'interviewing' && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.type === 'bot' && !isLoading) {
                speak(lastMessage.content);
            }
        }
    }, [messages, isLoading, currentView]);

    const startInterview = async () => {
        if (!jobTitle.trim()) return alert("Please enter a job title.");
        setCurrentView('interviewing');
        setIsLoading(true);
        const initialMessage = `Alright, let's begin your interview simulation for the **${jobTitle}** position. I'll be your interviewer today.`;
        setMessages([{ id: Date.now(), type: "bot", content: initialMessage }]);
        setTranscript([{ speaker: 'SYSTEM', text: `Interview for role: ${jobTitle}` }]);
        
        try {
            const systemPrompt = `You are an expert interviewer hiring for a "${jobTitle}" position. Start by introducing yourself briefly and then ask the first relevant question (it can be behavioral or technical). Ask only one question at a time.`;
            const apiKey = getApiKey();
            const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: systemPrompt }] }] }),
            });
            if (!response.ok) throw new Error(`API call failed`);
            const responseData = await response.json();
            const botResponseText = responseData.candidates[0].content.parts[0].text;
            const botMessage = { id: Date.now() + 1, type: "bot", content: botResponseText };
            setMessages((prev) => [...prev, botMessage]);
            setTranscript(prev => [...prev, { speaker: 'INTERVIEWER', text: botResponseText }]);
        } catch (error) {
            setMessages(prev => [...prev, {id: Date.now() + 1, type: 'bot', content: 'Sorry, there was an error starting the interview.'}])
        } finally {
            setIsLoading(false);
        }
    };

    const sendAnswer = async () => {
        const message = inputMessage.trim();
        if (!message || isLoading) return;

        window.speechSynthesis.cancel();
        const userMessage = { id: Date.now(), type: "user", content: message };
        setMessages(prev => [...prev, userMessage]);
        setTranscript(prev => [...prev, { speaker: 'USER', text: message }]);
        setInputMessage("");
        setIsLoading(true);

        try {
            const apiKey = getApiKey();
            const systemPrompt = `The user has just answered your previous question for the "${jobTitle}" role. Provide brief, constructive feedback on their answer in italics, and then ask the next logical question. Ask only one question at a time.`;
            const conversationHistory = [...transcript, { speaker: 'USER', text: message }].map(entry => ({
                role: entry.speaker === 'USER' ? 'user' : 'model', parts: [{ text: entry.text }]
            }));
            conversationHistory.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
            
            const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: conversationHistory }),
            });
            if (!response.ok) throw new Error(`API call failed`);
            const responseData = await response.json();
            const botResponseText = responseData.candidates[0].content.parts[0].text;
            const botMessage = { id: Date.now() + 1, type: "bot", content: botResponseText };
            setMessages(prev => [...prev, botMessage]);
            setTranscript(prev => [...prev, { speaker: 'INTERVIEWER', text: botResponseText }]);
        } catch (error) {
            setMessages(prev => [...prev, {id: Date.now() + 1, type: 'bot', content: 'Sorry, I encountered an error.'}]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const endInterviewAndGetFeedback = async () => {
        window.speechSynthesis.cancel();
        setIsLoading(true);
        setCurrentView('feedback');
        try {
            const transcriptText = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n\n');
            const prompt = `You are an expert HR manager and interview coach from a top tech company. Analyze the following interview transcript for a "${jobTitle}" position. The user's answers are transcribed from speech. Based on the transcript, provide a detailed performance report. Return ONLY a valid JSON object with the following structure: { "clarity_confidence_score": number (1-100, analyze the user's language for filler words like 'um', 'ah', 'like', and sentence structure to infer confidence and clarity), "star_method_score": number (1-100, evaluate how well the user's answers to behavioral questions followed the STAR method), "keyword_score": number (1-100, assess the use of relevant industry and job-specific keywords), "overall_feedback": "string (a summary of the user's performance)", "strengths": ["string (list of 2-3 key strengths with examples from the transcript)"], "areas_for_improvement": ["string (list of 2-3 actionable improvement areas with examples)"] }`;
            const apiKey = getApiKey();
            const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: `TRANSCRIPT:\n\n${transcriptText}\n\n${prompt}` }] }], generationConfig: { responseMimeType: "application/json" } }),
            });
            if (!response.ok) throw new Error('Feedback generation failed');
            const data = await response.json();
            const result = JSON.parse(data.candidates[0].content.parts[0].text);
            setFeedback(result);
        } catch (error) {
            console.error("Feedback error:", error);
            setFeedback({ error: "Could not generate feedback. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleListen = useCallback(() => {
        if (!recognition) return;
        if (isListening) {
            recognition.stop();
        } else {
            finalTranscriptRef.current = inputMessage ? inputMessage + ' ' : '';
            recognition.start();
        }
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscriptRef.current += event.results[i][0].transcript + '. ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setInputMessage(finalTranscriptRef.current + interimTranscript);
        };
        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };
        recognition.onend = () => {
            setIsListening(false);
        };
    }, [isListening, inputMessage]);
    
    const reset = () => {
        setJobTitle('');
        setMessages([]);
        setTranscript([]);
        setFeedback(null);
        setCurrentView('setup');
    }

    const renderView = () => {
        switch (currentView) {
            case 'interviewing': return <InterviewSessionView {...{ messages, isLoading, inputMessage, setInputMessage, isListening, handleListen, sendAnswer, endInterviewAndGetFeedback, jobTitle }} />;
            case 'feedback': return <InterviewFeedbackView {...{ feedback, isLoading, reset }} />;
            case 'setup':
            default: return <InterviewSetupView {...{ jobTitle, setJobTitle, startInterview }} />;
        }
    };

    return <div className="h-full flex flex-col">{renderView()}</div>;
}

// --- Child Components for each View ---

function InterviewSetupView({ jobTitle, setJobTitle, startInterview }) {
    return (
        <div className="flex flex-col h-full w-full">
            <div className="p-4 sm:p-6 border-b border-purple-400/20 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0"><Mic className="w-6 h-6 text-white" /></div>
                <div><h1 className="text-2xl font-bold text-white">Interview Simulator</h1><p className="text-gray-400">Practice your interview skills with an AI</p></div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-lg text-center">
                    <h2 className="text-3xl font-bold text-white">What role are you interviewing for?</h2>
                    <p className="text-gray-400 mt-2 mb-6">Include the company for more specific questions (e.g., "Software Engineer at Google").</p>
                    <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} onKeyPress={(e) => e.key === "Enter" && startInterview()} placeholder="Enter a job title..." className="w-full text-center text-lg p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500"/>
                    <button onClick={startInterview} disabled={!jobTitle.trim()} className="mt-4 w-full p-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg disabled:bg-gray-600">Start Interview Simulation</button>
                </div>
            </div>
        </div>
    );
}

function InterviewSessionView({ messages, isLoading, inputMessage, setInputMessage, isListening, handleListen, sendAnswer, endInterviewAndGetFeedback, jobTitle }) {
    const messagesEndRef = useRef(null);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    return (
        <div className="flex flex-col h-full w-full">
            <div className="p-4 sm:p-6 border-b border-purple-400/20 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0"><Mic className="w-6 h-6 text-white" /></div>
                    <div className="min-w-0"><h1 className="text-xl md:text-2xl font-bold text-white truncate">Interviewing for: {jobTitle}</h1><p className="text-gray-400">Session in progress...</p></div>
                </div>
                <button onClick={endInterviewAndGetFeedback} disabled={isLoading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:bg-gray-600 flex-shrink-0">End & Get Feedback</button>
            </div>
            <div className="flex-1 p-4 pt-6 sm:p-6 overflow-y-auto">
                <div className="space-y-6 max-w-4xl mx-auto">
                    {messages.map((message) => (
                         <div key={message.id} className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                            {message.type === "bot" && ( <div className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><Mic className="w-4 h-4 text-purple-300" /></div>)}
                            <div className={`max-w-[80%] rounded-xl p-3 shadow-md ${message.type === "user" ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-200" : "bg-purple-500/20 border border-purple-400/30 text-purple-200"}`}><p className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: message.content.replace(/\_(.*?)\_/g, '<i>$1</i>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p></div>
                            {message.type === "user" && (<div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><UserIcon className="w-4 h-4 text-gray-400" /></div>)}
                        </div>
                    ))}
                    {isLoading && <div className="flex gap-3 justify-start"><div className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><Mic className="w-4 h-4 text-purple-300" /></div><div className="max-w-[80%] rounded-xl p-3 bg-purple-500/20"><div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-purple-300" /><p className="text-purple-300 font-medium text-sm">AI is thinking...</p></div></div></div>}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-purple-400/20">
                <div className="flex gap-3 max-w-4xl mx-auto">
                    <textarea value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendAnswer())} placeholder={isListening ? "Listening..." : "Type or use the mic to answer..."} className="flex-1 font-medium p-3 bg-gray-800 border border-gray-700 rounded-lg w-full text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500" rows={1}/>
                    {recognition && <button onClick={handleListen} disabled={isLoading} className={`font-bold px-4 py-2 rounded-lg text-white transition-colors ${isListening ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-purple-600 hover:bg-purple-700'}`}><Mic className="w-5 h-5" /></button>}
                    <button onClick={sendAnswer} disabled={!inputMessage.trim() || isLoading} className="bg-emerald-600 hover:bg-emerald-700 font-bold px-4 py-2 rounded-lg text-white disabled:bg-gray-600">{isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}</button>
                </div>
            </div>
        </div>
    );
}

function InterviewFeedbackView({ feedback, isLoading, reset }) {
    if (isLoading || !feedback) {
        return <div className="flex flex-col h-full w-full items-center justify-center"><div className="p-4 sm:p-6 w-full"><div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0"><Award className="w-6 h-6 text-white" /></div></div><div className="flex-1 flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-400"/> <p className="mt-4 text-gray-400">Generating your detailed feedback report...</p></div></div>;
    }
    if (feedback.error) {
        return <div className="flex flex-col h-full w-full items-center justify-center text-center p-4"><p className="text-red-400">{feedback.error}</p><button onClick={reset} className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg">Try Another Interview</button></div>
    }

    const ScoreCircle = ({ score, label }) => (
        <div className="flex flex-col items-center text-center">
            <div className="relative w-24 h-24">
                <svg className="w-full h-full" viewBox="0 0 36 36" transform="rotate(-90 18 18)"><path className="text-gray-700" strokeWidth="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path className="text-purple-400" strokeWidth="3" fill="none" stroke="currentColor" strokeDasharray={`${score}, 100`} strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold text-white">{score}</span></div>
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-300 w-24">{label}</p>
        </div>
    );
    
    return (
        <div className="flex flex-col h-full w-full">
            <div className="p-4 sm:p-6 border-b border-purple-400/20 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0"><Award className="w-6 h-6 text-white" /></div>
                <div><h1 className="text-2xl font-bold text-white">Interview Feedback Report</h1><p className="text-gray-400">Here's your performance breakdown</p></div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div className="bg-white/5 p-6 rounded-lg flex flex-col sm:flex-row justify-around items-center gap-6">
                    <ScoreCircle score={feedback.clarity_confidence_score} label="Clarity & Confidence" />
                    <ScoreCircle score={feedback.star_method_score} label="STAR Method" />
                    <ScoreCircle score={feedback.keyword_score} label="Keyword Usage" />
                </div>
                <div className="bg-white/5 p-6 rounded-lg">
                    <h3 className="font-bold text-lg text-white">Overall Feedback</h3>
                    <p className="mt-2 text-gray-300">{feedback.overall_feedback}</p>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 p-6 rounded-lg">
                        <h3 className="font-bold text-lg text-green-400 flex items-center gap-2"><Star />Strengths</h3>
                        <ul className="mt-4 space-y-2 list-disc list-inside text-gray-300">{feedback.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                    <div className="bg-white/5 p-6 rounded-lg">
                        <h3 className="font-bold text-lg text-orange-400 flex items-center gap-2"><ThumbsDown />Areas for Improvement</h3>
                        <ul className="mt-4 space-y-2 list-disc list-inside text-gray-300">{feedback.areas_for_improvement.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                </div>
                 <div className="text-center pt-4">
                    <button onClick={reset} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg">Try Another Interview</button>
                </div>
            </div>
        </div>
    );
}