import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Award, Sparkles, Send } from 'lucide-react';
import { fetchWithRetry } from '../utils/api.js';

// Web Speech API setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
}

export default function InterviewPrep() {
  const [jobDetails, setJobDetails] = useState({ title: 'Software Engineer', company: 'Google' });
  const [interviewState, setInterviewState] = useState('setup'); // 'setup', 'in-progress', 'analyzing', 'report'
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interviewTranscript, setInterviewTranscript] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please try Chrome or Edge.');
    }
  }, []);

  const startInterview = async () => {
    setInterviewState('analyzing'); // Use analyzing state for question generation
    try {
      const prompt = `Generate 5 relevant interview questions (a mix of technical and behavioral) for a ${jobDetails.title} role at ${jobDetails.company}. Return ONLY a valid JSON object with a key "questions" which is an array of strings.`;


      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      };

       console.log("Attempting to use API Key:", GEMINI_API_KEY);
      console.log("Sending this payload:", JSON.stringify(payload, null, 2));
      
      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to generate questions.');
      const data = await response.json();
      const result = JSON.parse(data.candidates[0].content.parts[0].text);
      setQuestions(result.questions);
      setInterviewState('in-progress');
    } catch (err) {
      console.error(err);
      setError('Could not generate interview questions. Please try again.');
      setInterviewState('setup');
    }
  };

  const handleListen = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognition.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');
      setTranscript(currentTranscript);
    };
    recognition.start();
  };

  const nextQuestion = () => {
    setInterviewTranscript(prev => [...prev, { question: questions[currentQuestionIndex], answer: transcript }]);
    setTranscript('');
    setIsListening(false);
    recognition.stop();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      generateReport();
    }
  };

  const generateReport = async () => {
    setInterviewState('analyzing');
    const finalTranscript = interviewTranscript.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n');
    
    try {
      const prompt = `You are an expert career coach. Analyze the following interview transcript for a ${jobDetails.title} role. Provide a detailed report as a valid JSON object with these exact keys: "clarity_confidence_score" (number 1-100), "clarity_confidence_feedback" (string explaining the score, noting filler words like 'um'), "star_method_adherence" (number 1-100), "star_method_feedback" (string, explaining how well behavioral answers followed the STAR method), "keyword_analysis" (array of relevant keywords the user mentioned), "keyword_feedback" (string), and "overall_suggestions" (array of 3 actionable improvement suggestions). Transcript:\n\n${finalTranscript}`;

      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );
      if (!response.ok) throw new Error('Failed to generate report.');
      const data = await response.json();
      const result = JSON.parse(data.candidates[0].content.parts[0].text);
      setReport(result);
      setInterviewState('report');
    } catch (err) {
      console.error(err);
      setError('Could not generate your performance report. Please try again later.');
      setInterviewState('in-progress'); // Go back to the last question
    }
  };

  if (error) {
    return <div className="p-8 text-center text-red-400">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
          <Mic className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Dynamic Interview Simulator</h1>
          <p className="text-gray-400">Practice your interview skills with an AI-powered interviewer.</p>
        </div>
      </div>
      
      {interviewState === 'setup' && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-xl space-y-6">
          <h2 className="text-2xl font-bold text-center text-white">Interview Setup</h2>
          <div>
            <label className="font-semibold block mb-2 text-gray-300">Job Title</label>
            <input value={jobDetails.title} onChange={(e) => setJobDetails({...jobDetails, title: e.target.value})} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
          </div>
          <div>
            <label className="font-semibold block mb-2 text-gray-300">Company</label>
            <input value={jobDetails.company} onChange={(e) => setJobDetails({...jobDetails, company: e.target.value})} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg" />
          </div>
          <button onClick={startInterview} className="w-full py-3 bg-purple-600 font-bold rounded-lg hover:bg-purple-700">Start Interview</button>
        </div>
      )}

      {(interviewState === 'analyzing') && (
        <div className="text-center p-12">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-purple-400" />
          <p className="mt-4 text-lg text-gray-400">{report ? 'Analyzing your performance...' : 'Generating questions...'}</p>
        </div>
      )}

      {interviewState === 'in-progress' && questions.length > 0 && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Question {currentQuestionIndex + 1} of {questions.length}</h2>
                <p className="text-purple-300 font-semibold">{jobDetails.title} at {jobDetails.company}</p>
            </div>
            <p className="p-6 bg-gray-800 rounded-lg text-lg min-h-[100px]">{questions[currentQuestionIndex]}</p>
            <div className="relative">
                <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows="5" placeholder="Your answer will appear here..." className="w-full p-4 bg-gray-900 border-2 border-gray-700 rounded-lg focus:border-purple-500 focus:ring-0" />
                <button onClick={handleListen} className={`absolute top-3 right-3 p-3 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-600 text-white'}`}>
                    <Mic size={24} />
                </button>
            </div>
            <button onClick={nextQuestion} disabled={!transcript} className="w-full py-3 bg-emerald-600 font-bold rounded-lg hover:bg-emerald-700 disabled:bg-gray-600">
                {currentQuestionIndex === questions.length - 1 ? 'Finish & Get Report' : 'Submit Answer'}
            </button>
        </div>
      )}

      {interviewState === 'report' && report && (
        <div className="space-y-6">
            <div className="text-center p-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Award className="w-12 h-12 mx-auto text-yellow-300" />
                <h2 className="text-3xl font-bold mt-2">Interview Report</h2>
            </div>
            {/* Render Report Cards here */}
        </div>
      )}
    </div>
  );
}