import React, { useState } from 'react';
import { fetchWithRetry, getApiKey } from '../utils/api';
import { Compass, Book, Brain, FlaskConical, BarChart3, Palette, Landmark, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

const streams = {
  "Science (Math)": {
    icon: <FlaskConical />,
    color: "cyan",
    domains: ["Engineering", "Computer Science", "Data Science", "Architecture"],
    degrees: ["B.Tech in Computer Science", "Bachelor of Engineering (B.E.)", "Bachelor of Architecture (B.Arch)"],
  },
  "Science (Biology)": {
    icon: <Brain />,
    color: "emerald",
    domains: ["Medicine", "Biotechnology", "Pharmacy", "Nursing"],
    degrees: ["MBBS", "Bachelor of Pharmacy (B.Pharm)", "B.Sc. in Biotechnology"],
  },
  "Commerce": {
    icon: <BarChart3 />,
    color: "amber",
    domains: ["Chartered Accountancy", "Business Administration", "Finance", "Marketing"],
    degrees: ["Bachelor of Commerce (B.Com)", "BBA", "Chartered Accountancy (CA)"],
  },
  "Arts/Humanities": {
    icon: <Palette />,
    color: "purple",
    domains: ["Law", "Journalism", "Design", "Psychology"],
    degrees: ["Bachelor of Arts (B.A.) in Psychology", "B.A. LLB", "Bachelor of Design (B.Des)"],
  }
};

const PageHeader = ({ title, subtitle, onBack, showBack }) => (
  <div className="relative mb-8 text-center">
    {showBack && (
      <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft size={16}/> Back
      </button>
    )}
    <h1 className="text-4xl font-bold text-white">{title}</h1>
    <p className="text-lg text-gray-400 mt-2">{subtitle}</p>
  </div>
);

export default function CareerCompass() {
  const [step, setStep] = useState('streamSelection'); // streamSelection, domainSelection, careerDetails, roadmapDisplay
  const [selectedStream, setSelectedStream] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [careerDetails, setCareerDetails] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStreamSelect = (stream) => {
    setSelectedStream(stream);
    setStep('domainSelection');
  };

  const handleCareerSelect = async (career) => {
    setSelectedCareer(career);
    setIsLoading(true);
    setStep('careerDetails');
    try {
      const prompt = `
        Provide a detailed overview for a 12th-grade student interested in a career as a "${career}". The information should be relevant to India.
        Return ONLY a valid JSON object with the following structure:
        {
          "role_description": "string",
          "market_demand_future_scope": "string",
          "average_starting_salary_inr": "string (e.g., '₹4,00,000 to ₹7,00,000 per annum')",
          "required_degrees": ["string"],
          "top_entrance_exams": ["string"]
        }`;

      const apiKey = getApiKey();
      const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      setCareerDetails(JSON.parse(data.candidates[0].content.parts[0].text));
    } catch (error) {
      console.error("Failed to fetch career details:", error);
      setStep('domainSelection');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRoadmap = async (degree) => {
    setIsLoading(true);
    setStep('roadmapDisplay');
    try {
      const prompt = `
        Create a simple, actionable 4-year undergraduate roadmap for a student pursuing a "${degree}" in India.
        Break it down year by year. For each year, provide a short "focus" summary and a list of "key_activities".
        Return ONLY a valid JSON object with the structure:
        { "degree": "string", "roadmap": { "Year 1": { "focus": "string", "key_activities": ["string"] }, "Year 2": { ... }, "Year 3": { ... }, "Year 4": { ... } } }`;

      const apiKey = getApiKey();
      const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
      });
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      setRoadmap(JSON.parse(data.candidates[0].content.parts[0].text));
    } catch (error) {
      console.error("Failed to generate roadmap:", error);
      setStep('careerDetails');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep('streamSelection');
    setSelectedStream(null);
    setSelectedCareer(null);
    setCareerDetails(null);
    setRoadmap(null);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center"><Loader2 className="w-12 h-12 mx-auto animate-spin text-purple-400" /><p className="mt-4 text-gray-300">Loading...</p></div>;
    }

    switch (step) {
      case 'streamSelection':
        return (
          <div>
            <PageHeader title="Career Compass" subtitle="Select your 12th Grade stream to begin." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {Object.entries(streams).map(([name, { icon, color }]) => (
                <button key={name} onClick={() => handleStreamSelect(name)} className={`p-8 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-4 hover:-translate-y-1 hover:border-${color}-400/50 transition-all duration-300`}>
                  {React.cloneElement(icon, { className: `w-12 h-12 text-${color}-400` })}
                  <span className="font-bold text-lg text-white">{name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'domainSelection':
        const streamData = streams[selectedStream];
        return (
          <div>
            <PageHeader title={selectedStream} subtitle="Choose a career domain to explore." onBack={reset} showBack />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {streamData.domains.map(domain => (
                <button key={domain} onClick={() => handleCareerSelect(domain)} className={`p-6 bg-white/5 border border-white/10 rounded-xl text-center hover:bg-white/10 transition-colors`}>
                  <p className="font-bold text-white">{domain}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 'careerDetails':
        return (
          <div>
            <PageHeader title={selectedCareer} subtitle="Explore the details and generate a study roadmap." onBack={() => setStep('domainSelection')} showBack />
            <div className="space-y-6">
                <p>{careerDetails.role_description}</p>
                <p><strong>Market Demand:</strong> {careerDetails.market_demand_future_scope}</p>
                <p><strong>Starting Salary (INR):</strong> {careerDetails.average_starting_salary_inr}</p>
                <div><strong>Required Degrees:</strong><ul className="list-disc list-inside ml-4">{careerDetails.required_degrees.map(d => <li key={d}>{d}</li>)}</ul></div>
                <div><strong>Top Entrance Exams:</strong><ul className="list-disc list-inside ml-4">{careerDetails.top_entrance_exams.map(e => <li key={e}>{e}</li>)}</ul></div>
                <div className="text-center pt-4">
                    <h3 className="font-bold text-lg text-emerald-400">Ready for the next step?</h3>
                    <p className="text-gray-400 mb-4">Select a degree to generate your 4-year college roadmap.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {careerDetails.required_degrees.map(degree => (
                            <button key={degree} onClick={() => generateRoadmap(degree)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-lg">
                                <Sparkles size={16} className="inline mr-2"/> Generate Roadmap for {degree}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        );
    case 'roadmapDisplay':
        return (
          <div>
            <PageHeader title={`4-Year Roadmap for ${roadmap.degree}`} subtitle="Your personalized guide through college." onBack={() => setStep('careerDetails')} showBack />
            <div className="space-y-4">
              {Object.entries(roadmap.roadmap).map(([year, data]) => (
                <div key={year} className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <h3 className="font-bold text-lg text-emerald-400">{year}</h3>
                  <p className="text-sm text-gray-300 font-semibold italic my-2">Focus: {data.focus}</p>
                  <ul className="list-disc list-inside ml-4 space-y-1 text-gray-400">
                    {data.key_activities.map(activity => <li key={activity}>{activity}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-white">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
          <Compass className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Career Compass</h1>
          <p className="text-gray-400">Your guide to success after 12th grade.</p>
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-xl min-h-[60vh]">
        {renderContent()}
      </div>
    </div>
  );
}
