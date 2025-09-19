import React, { useState, useEffect } from 'react';
import { useOutletContext } from "react-router-dom";
import { fetchWithRetry, getApiKey } from '../utils/api';
import { Map, Loader2, Sparkles, BookOpen, BrainCircuit, HeartPulse, Palette, Briefcase, Atom, ArrowLeft, Target, TrendingUp, Youtube, Globe, FileText, CalendarDays, CheckCircle, Search } from 'lucide-react';

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

// --- Improved Caching Logic ---
const getCacheKeyForJob = (jobTitle) => `roadmap_progress_${jobTitle.trim().toLowerCase().replace(/\s+/g, '_')}`;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const getCachedData = (jobTitle) => {
  const cacheKey = getCacheKeyForJob(jobTitle);
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION_MS) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    // Convert arrays back to Sets
    data.completedMilestones = new Set(data.completedMilestones);
    data.completedResources = new Set(data.completedResources);
    return data;
  } catch (error) { return null; }
};

const setCachedData = (jobTitle, data) => {
  const cacheKey = getCacheKeyForJob(jobTitle);
  try {
    // Convert Sets to arrays for JSON serialization
    const serializableData = {
        ...data,
        completedMilestones: [...data.completedMilestones],
        completedResources: [...data.completedResources],
    };
    const cachePayload = { data: serializableData, timestamp: Date.now() };
    sessionStorage.setItem(cacheKey, JSON.stringify(cachePayload));
  } catch (error) { console.error("Failed to write to cache:", error); }
};
// --- End Caching Logic ---

export default function CareerExplorer() {
  const [step, setStep] = useState('fieldSelection');
  const [selectedField, setSelectedField] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [planTypeLoading, setPlanTypeLoading] = useState(null);
  const [customizationRequest, setCustomizationRequest] = useState('');
  const [completedResources, setCompletedResources] = useState(new Set());
  const [completedMilestones, setCompletedMilestones] = useState(new Set());
  const [congratsMessage, setCongratsMessage] = useState('');
  const [progress, setProgress] = useState(0);
  
  const { profile } = useOutletContext();

  useEffect(() => {
    if (roadmap && roadmap.milestones) {
        const totalMilestones = roadmap.milestones.length;
        if (totalMilestones > 0) {
            const newProgress = Math.round((completedMilestones.size / totalMilestones) * 100);
            setProgress(newProgress);
        }
    }
  }, [roadmap, completedMilestones]);

  const handleResourceComplete = (resourceQuery) => {
    if (completedResources.has(resourceQuery)) return;
    const newSet = new Set(completedResources).add(resourceQuery);
    setCompletedResources(newSet);
    setCachedData(jobTitle, { roadmap, completedMilestones, completedResources: newSet });
    setCongratsMessage("Great job! One step closer to your goal.");
    setTimeout(() => setCongratsMessage(''), 3000);
  };

  const handleMilestoneToggle = (milestoneTitle) => {
    const newSet = new Set(completedMilestones);
    if (newSet.has(milestoneTitle)) {
        newSet.delete(milestoneTitle);
        setCongratsMessage('');
    } else {
        newSet.add(milestoneTitle);
        setCongratsMessage("Milestone Complete! Keep it up!");
        setTimeout(() => setCongratsMessage(''), 3000);
    }
    setCompletedMilestones(newSet);
    setCachedData(jobTitle, { roadmap, completedMilestones: newSet, completedResources });
  };

  const handleFieldSelect = (field) => {
    setSelectedField(field);
    setStep('roleInput');
  };

  const generateRoadmap = async () => {
    if (!jobTitle.trim()) return;

    const cachedData = getCachedData(jobTitle);
    if (cachedData) {
      setRoadmap(cachedData.roadmap);
      setCompletedMilestones(cachedData.completedMilestones);
      setCompletedResources(cachedData.completedResources);
      setStep('roadmapDisplay');
      return;
    }
    
    setIsLoading(true);
    setStudyPlan(null);
    setCompletedResources(new Set());
    setCompletedMilestones(new Set());
    setProgress(0);
    setStep('generating');
    try {
      const userSkills = profile?.skills?.join(', ') || 'No skills listed';
      const prompt = `
        You are an expert career counselor. Create a personalized career roadmap for a user who wants to become a "${jobTitle}" in "${selectedField.name}".
        USER PROFILE: Current Role: ${profile?.current_role || 'N/A'}, Existing Skills: ${userSkills}.
        Create 5-6 milestones. For each, provide a "title", "description", an array of "skills_gained", and an array of 2-3 "suggested_resources".
        Each resource MUST be an object with "title", "type" (Course, Video, Article, Book), "provider", and a "search_query".
        The "search_query" should be a concise and effective string to find that specific resource online (e.g., 'CS50 Introduction to Computer Science Harvard'). Do NOT provide a URL.
        Return ONLY a valid JSON object with the structure: { "career_goal": "string", "timeline_months": number, "milestones": [ { "title": "string", "description": "string", "skills_gained": ["string"], "suggested_resources": [ { "title": "string", "type": "string", "provider": "string", "search_query": "string" } ] } ] }`;

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
      setCachedData(jobTitle, { roadmap: result, completedMilestones: new Set(), completedResources: new Set() });
      setStep('roadmapDisplay');
    } catch (error) {
      console.error("Roadmap generation error:", error);
      alert("Failed to generate roadmap. Please try again.");
      setStep('roleInput');
    } finally {
      setIsLoading(false);
    }
  };

  const generateStudyPlan = async (planType) => {
    if (!roadmap) return;
    setPlanTypeLoading(planType);
    setStudyPlan(null);
    try {
        const prompt = `
            Based on this career roadmap for a "${roadmap.career_goal}", create a detailed ${planType} study plan.
            The user's available time is ${profile?.availability_hours_per_week || 10} hours/week.
            User's customization request: "${customizationRequest || 'None'}".
            Roadmap: ${JSON.stringify(roadmap.milestones, null, 2)}
            Return ONLY a valid JSON object. For a "weekly" plan, keys should be "Week 1", "Week 2", etc. For "monthly", use "Month 1", etc. Each period should contain an array of specific tasks as strings.`;
        
        const apiKey = getApiKey();
        const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
        });
        if (!response.ok) throw new Error("API request for study plan failed");
        const data = await response.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        setStudyPlan(result);
    } catch (error) {
        console.error("Study plan generation error:", error);
        alert("Failed to generate the study plan. Please try again.");
    } finally {
        setPlanTypeLoading(null);
    }
  };
  
  const reset = () => {
      setStep('fieldSelection');
      setSelectedField(null);
      setJobTitle('');
      setRoadmap(null);
      setStudyPlan(null);
      setCustomizationRequest('');
      setCompletedResources(new Set());
      setCompletedMilestones(new Set());
      setProgress(0);
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
            <div className="mb-4 text-center">
                <h2 className="text-3xl font-bold text-white">Your Roadmap to Becoming a {roadmap.career_goal}</h2>
                <p className="text-gray-400">Estimated Timeline: ~{roadmap.timeline_months} months</p>
            </div>

            <div className="mb-8 px-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-emerald-300">Milestone Progress</span>
                    <span className="text-sm font-medium text-emerald-300">{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>


            <div className="bg-white/10 p-4 rounded-xl mb-8 text-center space-y-4">
              <h3 className="font-bold text-white">Generate a Detailed Study Schedule</h3>
              <textarea
                value={customizationRequest}
                onChange={(e) => setCustomizationRequest(e.target.value)}
                placeholder="Optional: Customize your plan (e.g., 'focus on video tutorials', 'add more practical projects')..."
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm"
                rows="2"
              />
              <div className="flex justify-center gap-4">
                  <button onClick={() => generateStudyPlan('weekly')} disabled={!!planTypeLoading} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:bg-gray-600">
                      {planTypeLoading === 'weekly' ? <Loader2 className="w-4 h-4 animate-spin"/> : <CalendarDays className="w-4 h-4"/>}
                      Weekly Plan
                  </button>
                  <button onClick={() => generateStudyPlan('monthly')} disabled={!!planTypeLoading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:bg-gray-600">
                       {planTypeLoading === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin"/> : <CalendarDays className="w-4 h-4"/>}
                      Monthly Plan
                  </button>
              </div>
            </div>

            {planTypeLoading && (
                <div className="text-center p-8">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-emerald-400" />
                    <p className="mt-2 text-gray-300">Building your custom study plan...</p>
                </div>
            )}
            
            {studyPlan && (
                <div className="mb-8 bg-white/5 p-6 rounded-2xl">
                    <h3 className="text-2xl font-bold text-white text-center mb-4">Your Custom Study Plan</h3>
                    <div className="space-y-4">
                        {Object.entries(studyPlan).map(([period, tasks]) => (
                            <div key={period}>
                                <h4 className="font-semibold text-lg text-emerald-400 border-b border-emerald-400/20 pb-1 mb-2">{period}</h4>
                                <ul className="list-disc list-inside space-y-1 text-gray-300 pl-2">
                                    {Array.isArray(tasks) && tasks.map((task, i) => <li key={i}>{task}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
              {roadmap.milestones.map((milestone, index) => (
                <details key={index} className={`group bg-white/5 p-4 rounded-xl border border-white/10 transition-opacity duration-500 ${completedMilestones.has(milestone.title) ? 'opacity-30' : 'opacity-100'}`}>
                  <summary className="font-bold text-white cursor-pointer list-none flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <input 
                        type="checkbox"
                        checked={completedMilestones.has(milestone.title)}
                        onChange={() => handleMilestoneToggle(milestone.title)}
                        onClick={(e) => e.stopPropagation()}
                        className="form-checkbox h-5 w-5 text-emerald-500 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
                      />
                      <div className={`w-10 h-10 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${completedMilestones.has(milestone.title) ? 'bg-emerald-500/20 border-emerald-500' : 'bg-gray-700 border-gray-600'}`}>
                        {completedMilestones.has(milestone.title) ? <CheckCircle className="text-emerald-400"/> : <Target />}
                      </div>
                      <span className={`${completedMilestones.has(milestone.title) ? 'line-through' : ''}`}>{milestone.title}</span>
                    </div>
                  </summary>
                  <div className="pt-4 mt-4 border-t border-white/10 pl-20">
                    <p className="text-gray-400 text-sm mb-4">{milestone.description}</p>
                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-white"><TrendingUp size={16} className="text-blue-400" /> Skills to Gain</h5>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {milestone.skills_gained.map(s => <span key={s} className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-white"><BookOpen size={16} className="text-orange-400" /> Learning Resources</h5>
                    <div className="space-y-2">
                        {milestone.suggested_resources.map(res => {
                            const searchUrl = res.type === 'Video'
                                ? `https://www.youtube.com/results?search_query=${encodeURIComponent(res.search_query)}`
                                : `https://www.google.com/search?q=${encodeURIComponent(res.search_query)}`;

                            return (
                                <a 
                                    href={searchUrl}
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    key={res.search_query}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleResourceComplete(res.search_query);
                                        window.open(searchUrl, '_blank');
                                    }}
                                    className={`group flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-all duration-300 ${completedResources.has(res.search_query) ? 'opacity-40 line-through' : ''}`}
                                >
                                    <div className="flex-shrink-0">{resourceIcons[res.type] || resourceIcons.default}</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">{res.title}</p>
                                        <p className="text-xs text-gray-400">{res.provider} - {res.type}</p>
                                    </div>
                                    <Search className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                                </a>
                            );
                        })}
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
       <div 
        aria-live="assertive" 
        className={`fixed top-24 right-8 z-50 bg-emerald-600 text-white font-bold px-6 py-3 rounded-lg shadow-2xl transition-all duration-300 ease-out
                    ${congratsMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        🎉 {congratsMessage}
      </div>

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

