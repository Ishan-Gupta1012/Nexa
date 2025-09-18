// src/components/UI/TrendingJobs.jsx

import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { fetchWithRetry, getApiKey } from '../../utils/api';

const defaultTrendingJobs = [
    { title: "Data Scientist", field: "Data & AI", type: "tech" },
    { title: "AI/ML Engineer", field: "Data & AI", type: "tech" },
    { title: "Full Stack Developer", field: "Development", type: "tech" },
    { title: "Cybersecurity Analyst", field: "Security", type: "tech" },
    { title: "Cloud Architect", field: "Infrastructure", type: "tech" },
    { title: "Digital Marketing Manager", field: "Marketing", type: "business" },
    { title: "Product Manager", field: "Management", type: "business" },
];


const JobCard = ({ title, field, type }) => {
  const typeColor = type === 'tech' ? 'text-cyan-400' : 'text-amber-400';
  return (
    <a href="#" className="block group bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:border-cyan-400/50">
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${typeColor}`}>{field}</p>
          <h4 className="font-bold text-white mt-1">{title}</h4>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-cyan-400 transition-all duration-300 transform -rotate-45 group-hover:rotate-0" />
      </div>
    </a>
  );
};

export default function TrendingJobs({ profile }) {
    const [jobs, setJobs] = useState(defaultTrendingJobs);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (profile && profile.skills && profile.skills.length > 0) {
            getPersonalizedJobs(profile.skills);
        } else {
            setIsLoading(false);
        }
    }, [profile]);

    const getPersonalizedJobs = async (skills) => {
        setIsLoading(true);
        try {
            const prompt = `
                Based on the user's skills: [${skills.join(', ')}], generate a list of 7 trending job roles that are a good match.
                For each job, provide a "title", a general "field", and a "type" ('tech' or 'business').
                Return ONLY a valid JSON object with the structure: { "jobs": [ { "title": "string", "field": "string", "type": "string" } ] }`;

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

            if (!response.ok) throw new Error('Failed to fetch personalized jobs');

            const data = await response.json();
            const result = JSON.parse(data.candidates[0].content.parts[0].text);

            if (result.jobs && result.jobs.length > 0) {
                setJobs(result.jobs);
            }
        } catch (error) {
            console.error("Error fetching personalized jobs:", error);
            setJobs(defaultTrendingJobs);
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold text-white text-center flex items-center justify-center gap-3">
        <TrendingUp className="w-8 h-8 text-cyan-400" />
        {profile && profile.skills && profile.skills.length > 0 ? 'Trending Jobs For You' : 'Trending Job Roles'}
      </h2>
      {isLoading ? (
          <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(job => <JobCard key={job.title} {...job} />)}
            <div className="md:col-span-2 lg:col-span-1 flex items-center justify-center text-center bg-white/5 backdrop-blur-md border-2 border-dashed border-white/10 p-4 rounded-xl">
                <p className="text-gray-400">More roles and regional data coming soon!</p>
            </div>
        </div>
      )}
    </section>
  );
}