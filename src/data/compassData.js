import React, { useState } from 'react';
// Import the pre-written data directly
import { compassData } from '../data/compassData.js';
import { Compass, Book, Brain, FlaskConical, BarChart3, Palette, Landmark, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

// The streams object is now derived directly from our imported data
const streams = {
  "Science (Math)": {
    icon: <FlaskConical />,
    color: "cyan",
  },
  "Science (Biology)": {
    icon: <Brain />,
    color: "emerald",
  },
  "Commerce": {
    icon: <BarChart3 />,
    color: "amber",
  },
  "Arts/Humanities": {
    icon: <Palette />,
    color: "purple",
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
  const [isLoading, setIsLoading] = useState(false); // Kept for smooth UI transitions

  const handleStreamSelect = (streamName) => {
    setSelectedStream(streamName);
    setStep('domainSelection');
  };

  const handleCareerSelect = (careerName) => {
    setIsLoading(true);
    // Find the career data in our local file instead of an API call
    const careerData = compassData[selectedStream]?.domains.find(d => d.name === careerName);
    
    if (careerData) {
      setSelectedCareer(careerName);
      setCareerDetails(careerData);
      setStep('careerDetails');
    } else {
      console.error("Career data not found for:", careerName);
      alert("Details for this career are not available yet.");
    }
    setIsLoading(false);
  };

  const generateRoadmap = (degree) => {
    setIsLoading(true);
     // Find the roadmap data in our local file
    const roadmapData = careerDetails?.roadmap;
    
    if (roadmapData) {
      setRoadmap({ degree, roadmap: roadmapData });
      setStep('roadmapDisplay');
    } else {
      console.error("Roadmap not found for:", degree);
      alert("A roadmap for this degree is not available yet.");
    }
    setIsLoading(false);
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
        const streamDomains = compassData[selectedStream]?.domains || [];
        return (
          <div>
            <PageHeader title={selectedStream} subtitle="Choose a career domain to explore." onBack={reset} showBack />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {streamDomains.map(domain => (
                <button key={domain.name} onClick={() => handleCareerSelect(domain.name)} className={`p-6 bg-white/5 border border-white/10 rounded-xl text-center hover:bg-white/10 transition-colors`}>
                  <p className="font-bold text-white">{domain.name}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 'careerDetails':
        if (!careerDetails) return <p>Details not found.</p>;
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
        if (!roadmap) return <p>Roadmap not found.</p>;
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

