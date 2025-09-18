// src/pages/InterviewPrep.jsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import { fetchWithRetry, getApiKey } from "../utils/api";
import { Mic, Send, Bot, User as UserIcon, Loader2, Award, Star, ThumbsDown, ArrowLeft, Settings, Briefcase, BarChart } from "lucide-react";
import BackgroundAnimation from "../components/UI/BackgroundAnimation.jsx";

// Import the new local bot avatar GIF
import interviewerAvatar from '../assets/bot-avatar.png';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
}

export default function InterviewPrep() {
    const [currentView, setCurrentView] = useState('setup');
    const [jobTitle, setJobTitle] = useState('');
    const [messages, setMessages] = useState([]);
    const [transcript, setTranscript] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const finalTranscriptRef = useRef('');
    const timerRef = useRef(null);

    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
                setVoices(englishVoices);
                const defaultVoice = englishVoices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || englishVoices[0];
                setSelectedVoice(defaultVoice);
            }
        };
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }, []);


    const speak = (text) => {
        if (!text || typeof window.speechSynthesis === 'undefined' || !selectedVoice) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/_|\*/g, ''));
        utterance.voice = selectedVoice;
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (currentView === 'interviewing' && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.type === 'bot' && !isLoading) {
                speak(lastMessage.content);
            }
        }
    }, [messages, isLoading, currentView, selectedVoice]);

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

    const sendAnswer = async (isTimeout = false) => {
        const message = isTimeout ? 'User did not respond within 20 seconds.' : inputMessage.trim();
        if ((!message && !isTimeout) || isLoading) return;

        window.speechSynthesis.cancel();
        if (!isTimeout) {
            const userMessage = { id: Date.now(), type: "user", content: message };
            setMessages(prev => [...prev, userMessage]);
            setTranscript(prev => [...prev, { speaker: 'USER', text: message }]);
        }
        setInputMessage("");
        setIsLoading(true);

        try {
            const apiKey = getApiKey();
            const conversationHistory = [...transcript, { speaker: 'USER', text: message }].map(entry => ({
                role: entry.speaker === 'USER' ? 'user' : 'model', parts: [{ text: entry.text }]
            }));
            const prompt = `The user has just answered your previous question for the "${jobTitle}" role. Provide brief, constructive feedback in italics, and then ask the next logical question. Ask only one question or provide one piece of feedback at a time.`;
            conversationHistory.unshift({ role: 'user', parts: [{ text: prompt }] });

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

    useEffect(() => {
        if (currentView === 'interviewing' && !isLoading) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                sendAnswer(true);
            }, 20000); // 20-second timer
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [currentView, isLoading, messages]);

    const endInterviewAndGetFeedback = async () => {
        window.speechSynthesis.cancel();
        setIsLoading(true);
        setCurrentView('feedback');
        if (timerRef.current) clearTimeout(timerRef.current);
        try {
            const transcriptText = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n\n');
            const prompt = `You are an expert HR manager and interview coach. Analyze the interview transcript for a "${jobTitle}" position. Provide a detailed performance report. Return ONLY a valid JSON object: { "clarity_confidence_score": number(1-100), "star_method_score": number(1-100), "keyword_score": number(1-100), "overall_feedback": "string", "strengths": ["string"], "areas_for_improvement": ["string"] }`;
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
            if(timerRef.current) clearTimeout(timerRef.current);
        };
        recognition.onerror = (event) => console.error("Speech recognition error:", event.error);
        recognition.onend = () => setIsListening(false);
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
            case 'feedback': return <InterviewFeedbackView {...{ feedback, isLoading, reset, jobTitle }} />;
            case 'setup':
            default: return <InterviewSetupView {...{ jobTitle, setJobTitle, startInterview, voices, selectedVoice, setSelectedVoice }} />;
        }
    };

    return (
        <div className="relative h-full flex flex-col bg-gray-950 text-white">
            <BackgroundAnimation />
            <div className="relative z-10 h-full flex flex-col">
                {renderView()}
            </div>
        </div>
    );
}

// --- Child Components for each View ---

function InterviewSetupView({ jobTitle, setJobTitle, startInterview, voices, selectedVoice, setSelectedVoice }) {
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
                    
                    <div className="mt-4">
                        <label htmlFor="voice-select" className="text-sm font-medium text-gray-400 flex items-center justify-center gap-2"><Settings size={16}/> Interviewer Voice</label>
                        <select
                            id="voice-select"
                            value={selectedVoice ? selectedVoice.name : ''}
                            onChange={(e) => {
                                const voice = voices.find(v => v.name === e.target.value);
                                setSelectedVoice(voice);
                            }}
                            className="w-full mt-2 p-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        >
                            {voices.map(voice => (
                                <option key={voice.name} value={voice.name}>
                                    {voice.name} ({voice.lang})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button onClick={startInterview} disabled={!jobTitle.trim()} className="mt-6 w-full p-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg disabled:bg-gray-600">Start Interview Simulation</button>
                </div>
            </div>
        </div>
    );
}

function InterviewSessionView({ inputMessage, setInputMessage, isListening, handleListen, sendAnswer, endInterviewAndGetFeedback, jobTitle, isLoading }) {
    return (
        <div className="flex flex-col h-full w-full">
            <div className="p-4 sm:p-6 border-b border-purple-400/20 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0"><Mic className="w-6 h-6 text-white" /></div>
                    <div className="min-w-0"><h1 className="text-xl md:text-2xl font-bold text-white truncate">Interviewing for: {jobTitle}</h1><p className="text-gray-400">Session in progress...</p></div>
                </div>
                <button onClick={endInterviewAndGetFeedback} disabled={isLoading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:bg-gray-600 flex-shrink-0">End & Get Feedback</button>
            </div>
            <div className="flex-1 p-4 pt-6 sm:p-6 overflow-y-auto flex flex-col items-center justify-center">
                <div className="relative w-64 h-64">
                    <img src={interviewerAvatar} alt="AI Interviewer" className="w-full h-full object-contain" />
                </div>
                 {isLoading && (
                    <div className="mt-8 text-center flex items-center justify-center gap-2 text-purple-300">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <p className="font-medium text-sm">AI is thinking...</p>
                    </div>
                )}
            </div>
            <div className="p-4 sm:p-6 border-t border-purple-400/20">
                <div className="flex gap-3 max-w-4xl mx-auto">
                    <textarea value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendAnswer())} placeholder={isListening ? "Listening..." : "Type or use the mic to answer..."} className="flex-1 font-medium p-3 bg-gray-800 border border-gray-700 rounded-lg w-full text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500" rows={1}/>
                    {recognition && <button onClick={handleListen} disabled={isLoading} className={`font-bold px-4 py-2 rounded-lg text-white transition-colors ${isListening ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-purple-600 hover:bg-purple-700'}`}><Mic className="w-5 h-5" /></button>}
                    <button onClick={() => sendAnswer()} disabled={!inputMessage.trim() || isLoading} className="bg-emerald-600 hover:bg-emerald-700 font-bold px-4 py-2 rounded-lg text-white disabled:bg-gray-600">{isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}</button>
                </div>
            </div>
        </div>
    );
}

function InterviewFeedbackView({ feedback, isLoading, reset, jobTitle }) {
    if (isLoading || !feedback) {
        return <div className="flex flex-col h-full w-full items-center justify-center"><div className="p-4 sm:p-6 w-full"><div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0"><Award className="w-6 h-6 text-white" /></div></div><div className="flex-1 flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-400"/> <p className="mt-4 text-gray-400">Generating your detailed feedback report...</p></div></div>;
    }
    if (feedback.error) {
        return <div className="flex flex-col h-full w-full items-center justify-center text-center p-4"><p className="text-red-400">{feedback.error}</p><button onClick={reset} className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg">Try Another Interview</button></div>
    }

    const ScoreCircle = ({ score, label, color }) => (
        <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative w-24 h-24">
                <svg className="w-full h-full" viewBox="0 0 36 36" transform="rotate(-90 18 18)"><path className="text-gray-700/50" strokeWidth="2" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path className={color} strokeWidth="2.5" fill="none" stroke="currentColor" strokeDasharray={`${score}, 100`} strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold text-white">{score}</span></div>
            </div>
            <p className="text-xs font-semibold text-gray-300 w-24">{label}</p>
        </div>
    );

    return (
        <div className="flex flex-col h-full w-full">
            <div className="p-4 sm:p-6 border-b border-purple-400/20 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0"><Award className="w-6 h-6 text-white" /></div>
                <div><h1 className="text-2xl font-bold text-white">Interview Feedback Report</h1><p className="text-gray-400">Performance for: <span className="font-semibold text-purple-300">{jobTitle}</span></p></div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-8">
                <div className="bg-white/5 p-6 rounded-2xl">
                    <h3 className="font-bold text-xl text-white flex items-center gap-2 mb-4"><BarChart className="w-6 h-6 text-purple-300"/> Performance Scores</h3>
                    <div className="flex flex-col md:flex-row justify-around items-center gap-6">
                        <ScoreCircle score={feedback.clarity_confidence_score} label="Clarity & Confidence" color="text-purple-400" />
                        <ScoreCircle score={feedback.star_method_score} label="STAR Method" color="text-emerald-400"/>
                        <ScoreCircle score={feedback.keyword_score} label="Keyword Usage" color="text-blue-400"/>
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl">
                    <h3 className="font-bold text-xl text-white flex items-center gap-2"><Briefcase className="w-6 h-6 text-purple-300"/> Overall Feedback</h3>
                    <p className="mt-4 text-gray-300 leading-relaxed">{feedback.overall_feedback}</p>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-6 rounded-2xl">
                        <h3 className="font-bold text-lg text-emerald-300 flex items-center gap-2"><Star />Strengths</h3>
                        <ul className="mt-4 space-y-3 list-disc list-inside text-gray-300">{feedback.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 p-6 rounded-2xl">
                        <h3 className="font-bold text-lg text-orange-300 flex items-center gap-2"><ThumbsDown />Areas for Improvement</h3>
                        <ul className="mt-4 space-y-3 list-disc list-inside text-gray-300">{feedback.areas_for_improvement.map((item, i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                </div>
                 <div className="text-center pt-4">
                    <button onClick={reset} className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg text-lg">Try Another Interview</button>
                </div>
            </div>
        </div>
    );
}