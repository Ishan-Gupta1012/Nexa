import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithRetry, getApiKey } from '../../utils/api';
import { Target, Loader2, ArrowRight } from 'lucide-react';

export default function SkillGapWidget({ profile, roadmap }) {
  const [skillGaps, setSkillGaps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // We need both the profile with skills and a roadmap to analyze gaps.
    if (!profile?.skills || !roadmap?.milestones) {
      setIsLoading(false);
      return;
    }

    const analyzeGaps = async () => {
      try {
        const userSkills = profile.skills || [];
        // Flatten the skills from all milestones into a single array
        const requiredSkills = roadmap.milestones.flatMap(m => m.skills_gained);
        
        // Remove duplicates to create a clean list for the AI
        const uniqueRequiredSkills = [...new Set(requiredSkills)];

        if (uniqueRequiredSkills.length === 0) {
            setIsLoading(false);
            return;
        }

        const prompt = `Given a user's current skills: [${userSkills.join(', ')}] and the skills required for their career goal of '${roadmap.career_goal}': [${uniqueRequiredSkills.join(', ')}], identify the top 5 most important skills the user is missing. If there are no missing skills, return an empty array for "skill_gaps". Return ONLY a valid JSON object with the structure: { "skill_gaps": ["string"] }`;

        const apiKey = getApiKey();
        const response = await fetchWithRetry(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );

        if (!response.ok) throw new Error('Skill gap analysis failed');
        
        const data = await response.json();
        const jsonString = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(jsonString);
        
        setSkillGaps(result.skill_gaps || []);
      } catch (error) {
        console.error("Error analyzing skill gaps:", error);
        // In case of an error, we'll just have an empty array so the component hides itself.
        setSkillGaps([]);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeGaps();
  }, [profile, roadmap]);

  const handleSkillClick = (skill) => {
    // Navigate to the learning hub and pre-fill the search query
    navigate(`/learning-hub?search=${encodeURIComponent(skill)}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg p-6 text-center h-48 flex flex-col justify-center">
        <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-400" />
        <p className="text-sm text-gray-400 mt-2">Analyzing your skill gaps...</p>
      </div>
    );
  }

  // If there are no gaps, don't render the component. This keeps the UI clean.
  if (skillGaps.length === 0) {
    return null; 
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl shadow-lg p-6">
      <h3 className="font-bold text-lg flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-blue-400" /> Your Path to {roadmap.career_goal}
      </h3>
      <p className="text-sm text-gray-400 mb-4">Based on your roadmap, here are the top skills to focus on next. Click any skill to find learning resources.</p>
      <div className="flex flex-wrap gap-3">
        {skillGaps.map((skill, index) => (
          <button
            key={index}
            onClick={() => handleSkillClick(skill)}
            className="group text-sm font-semibold border border-blue-700/50 rounded-full px-4 py-2 bg-blue-900/50 text-blue-300 hover:bg-blue-800/80 hover:border-blue-600 transition-all duration-200 flex items-center gap-2"
          >
            {skill}
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}