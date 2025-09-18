// src/pages/CareerExplorer.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { fetchWithRetry, getApiKey } from '../utils/api';
import { Map, Loader2, Sparkles, BookOpen, BrainCircuit, HeartPulse, Palette, Briefcase, Atom, ArrowLeft, CheckCircle, Target, TrendingUp, Youtube, Globe, FileText } from 'lucide-react';

const careerFields = [
  { name: 'Technology', icon: BrainCircuit, color: 'text-cyan-400' },
  { name: 'Healthcare', icon: HeartPulse, color: 'text-red-400' },
  { name: 'Creative & Arts', icon: Palette, color: 'text-purple-400' },
  { name: 'Business & Finance', icon: Briefcase, color: 'text-emerald-400' },
  { name: 'Engineering', icon: Atom, color: 'text-orange-400' },
];

const resourceIcons = {
  Course: <BookOpen className="w-4 h-4 text-blue-400" />,
  Video: <Youtube className="w-4 h-4 text-red-400" />,
  Article: <FileText className="w-4 h-4 text-yellow-400" />,
  Book: <BookOpen className="w-4 h-4 text-green-400" />,
  default: <Globe className="w-4 h-4 text-gray-400" />,
};

export default function CareerExplorer() {
  const [step, setStep] = useState('fieldSelection'); // fieldSelection, roleInput, generating, roadmapDisplay
  const [selectedField, setSelectedField] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const handleFieldSelect = (field) => {
    setSelectedField(field);
    setStep('roleInput');
  };

  const generateRoadmap = async () => {
    if (!jobTitle.trim()) return;
    setIsLoading(true);
    setStep('generating');
    try {
      const userSkills = profile?.skills?.join(', ') || 'No skills listed';
      const prompt = `
        You are an expert career counselor creating a personalized career roadmap.
        The user wants to become a "${jobTitle}" in the "${selectedField.name}" field.

        USER PROFILE:
        - Current Role: ${profile?.current_role || 'Not specified'}
        - Existing Skills: ${userSkills}

        INSTRUCTIONS:
        1.  Analyze the user's existing skills. If they have relevant skills, the roadmap should focus on ADVANCED topics and building on their foundation.
        2.  If they are missing foundational skills, the roadmap should start with the basics.
        3.  Create a detailed career roadmap with a realistic timeline and 5-6 milestones.
        4.  For EACH milestone, provide:
            - A "title".
            - A "description" of what to achieve.
            - An array of "skills_gained". For existing skills, suggest how to advance them (e.g., "Advanced React (State Management)").
            - An array of 2-3 "suggested_resources". Each resource MUST be an object with "title", "type" (Course, Video, Article, Book), "provider" (e.g., Coursera, freeCodeCamp), and a real, valid "url".

        Return ONLY a valid JSON object with the structure: { "career_goal": "string", "timeline_months": number, "milestones": [ { "title": "string", "description": "string", "skills_gained": ["string"], "suggested_resources": [ { "title": "string", "type": "string", "provider": "string", "url": "string" } ] } ] }`;

      const apiKey = getApiKey();
      const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
      if (!response.ok) throw new Error("API request for roadmap failed");
      const data = await response.json();
      const result = JSON.parse(data.candidates[0].content.parts[0].text);
      setRoadmap(result);
      setStep('roadmapDisplay');
    } catch (error) {
      console.error("Roadmap generation error:", error);
      alert("Failed to generate roadmap. Please try again.");
      setStep('roleInput');
    } finally {
      setIsLoading(false);
    }
  };
  
  const reset = () => {
      setStep('fieldSelection');
      setSelectedField(null);
      setJobTitle('');
      setRoadmap(null);
  }

  const renderContent = () => {
    switch (step) {
      case 'generating':
        return (
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-purple-400" />
            <h2 className="mt-4 text-2xl font-bold text-white">Crafting Your Personalized Roadmap...</h2>
            <p className="text-gray-400">Our AI is analyzing the best path for a "{jobTitle}".</p>
          </div>
        );
      case 'roadmapDisplay':
        return (
          <div>
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white">Your Roadmap to Becoming a {roadmap.career_goal}</h2>
                <p className="text-gray-400">Timeline: ~{roadmap.timeline_months} months</p>
            </div>
            <div className="space-y-4">
              {roadmap.milestones.map((milestone, index) => (
                <details key={index} className="group bg-white/5 p-4 rounded-xl border border-white/10" open={index === 0}>
                  <summary className="font-bold text-white cursor-pointer list-none flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full border-2 flex-shrink-0 flex items-center justify-center bg-gray-700 border-gray-600 text-gray-400">
                        <Target size={20} />
                      </div>
                      <span>{milestone.title}</span>
                    </div>
                  </summary>
                  <div className="pt-4 mt-4 border-t border-white/10 pl-14">
                    <p className="text-gray-400 text-sm mb-4">{milestone.description}</p>
                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-white"><TrendingUp size={16} className="text-blue-400" /> Skills to Gain</h5>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {milestone.skills_gained.map(s => <span key={s} className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-white"><BookOpen size={16} className="text-orange-400" /> Learning Resources</h5>
                    <div className="space-y-2">
                        {milestone.suggested_resources.map(res => (
                            <a href={res.url} target="_blank" rel="noopener noreferrer" key={res.title} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors">
                                <div className="flex-shrink-0">{resourceIcons[res.type] || resourceIcons.default}</div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">{res.title}</p>
                                    <p className="text-xs text-gray-400">{res.provider} - {res.type}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        );
      case 'roleInput':
        return (
          <div className="text-center">
            <button onClick={() => setStep('fieldSelection')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4"><ArrowLeft size={16}/> Back to fields</button>
            <selectedField.icon className={`w-16 h-16 mx-auto ${selectedField.color}`} />
            <h2 className="mt-4 text-3xl font-bold text-white">What's your goal in {selectedField.name}?</h2>
            <p className="text-gray-400 mt-2 mb-6">Enter the specific job title you're aiming for.</p>
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && generateRoadmap()}
              placeholder="e.g., UX Designer, Financial Analyst..."
              className="w-full max-w-lg mx-auto text-center text-lg p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <button onClick={generateRoadmap} disabled={!jobTitle.trim() || isLoading} className="mt-4 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg disabled:bg-gray-600">
              <Sparkles size={20} className="inline mr-2" /> Generate My Roadmap
            </button>
          </div>
        );
      case 'fieldSelection':
      default:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">Explore Your Career Path</h2>
            <p className="text-gray-400 mt-2">Select a field to begin your journey.</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {careerFields.map(field => (
                <button key={field.name} onClick={() => handleFieldSelect(field)} className={`p-8 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-4 hover:-translate-y-1 hover:border-purple-400/50 transition-all duration-300`}>
                  <field.icon className={`w-12 h-12 ${field.color}`} />
                  <span className="font-bold text-lg text-white">{field.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Map className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Career Explorer</h1>
              <p className="text-gray-400">Your personalized step-by-step career guidance</p>
            </div>
          </div>
          {step === 'roadmapDisplay' && (
              <button onClick={reset} className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600">Start New Plan</button>
          )}
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-xl min-h-[60vh] flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
}