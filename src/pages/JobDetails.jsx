import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchWithRetry, getApiKey } from '../utils/api';
import { ArrowLeft, Briefcase, DollarSign, TrendingUp, Award, Loader2, IndianRupee } from 'lucide-react';
import BackgroundAnimation from '../components/UI/BackgroundAnimation';

export default function JobDetails() {
    const { jobTitle } = useParams();
    const [details, setDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJobDetails = async () => {
            setIsLoading(true);
            try {
                const prompt = `
                    Generate a detailed job description for the role of a "${decodeURIComponent(jobTitle)}".
                    Provide a comprehensive overview for the Indian job market including:
                    1.  A "detailed_description" of typical daily tasks and responsibilities.
                    2.  "salary_benchmarks_inr" with average salary ranges as strings for entry, mid, and senior levels in INR (e.g., "₹8-12 LPA").
                    3.  A "career_trajectory" outlining potential growth paths.
                    4.  A list of "required_qualifications" including common degrees and certifications.
                    Return ONLY a valid JSON object with the structure:
                    {
                        "detailed_description": "string",
                        "salary_benchmarks_inr": { "entry_level": "string", "mid_level": "string", "senior_level": "string" },
                        "career_trajectory": ["string"],
                        "required_qualifications": ["string"]
                    }
                `;

                const apiKey = getApiKey();
                const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json" },
                    }),
                });

                if (!response.ok) throw new Error("API request for job details failed");
                const data = await response.json();
                const result = JSON.parse(data.candidates[0].content.parts[0].text);
                setDetails(result);
            } catch (error) {
                console.error("Job details generation error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (jobTitle) {
            fetchJobDetails();
        }
    }, [jobTitle]);

    const InfoCard = ({ icon: Icon, title, children, color }) => (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
            <h3 className={`font-bold text-lg ${color} flex items-center gap-2 mb-3`}>
                <Icon className="w-5 h-5" /> {title}
            </h3>
            <div className="text-gray-300 space-y-2">{children}</div>
        </div>
    );

    return (
        <div className="relative min-h-full p-4 sm:p-6 lg:p-8 text-white">
            <BackgroundAnimation />
            <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                {isLoading ? (
                     <div className="flex flex-col items-center justify-center h-96">
                        <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
                        <p className="mt-4 text-gray-400">Loading job details for {decodeURIComponent(jobTitle)}...</p>
                    </div>
                ) : !details ? (
                    <div className="text-center">
                        <p>Could not load job details. Please try again later.</p>
                        <Link to="/dashboard" className="mt-4 inline-flex items-center gap-2 text-emerald-400 hover:underline">
                            <ArrowLeft size={16} /> Back to Dashboard
                        </Link>
                    </div>
                ) : (
                    <>
                        <div>
                            <Link to="/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4 text-sm">
                                <ArrowLeft size={16} /> Back to Dashboard
                            </Link>
                            <h1 className="text-4xl font-bold">{decodeURIComponent(jobTitle)}</h1>
                        </div>

                        <InfoCard icon={Briefcase} title="Role Description" color="text-cyan-400">
                            <p className="leading-relaxed">{details.detailed_description}</p>
                        </InfoCard>

                        <div className="grid md:grid-cols-2 gap-8">
                            <InfoCard icon={IndianRupee} title="Salary Benchmarks (INR)" color="text-emerald-400">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>Entry-Level:</strong> {details.salary_benchmarks_inr.entry_level}</li>
                                    <li><strong>Mid-Level:</strong> {details.salary_benchmarks_inr.mid_level}</li>
                                    <li><strong>Senior-Level:</strong> {details.salary_benchmarks_inr.senior_level}</li>
                                </ul>
                            </InfoCard>

                            <InfoCard icon={TrendingUp} title="Career Trajectory" color="text-purple-400">
                                <ul className="list-disc list-inside space-y-1">
                                    {details.career_trajectory.map((path, index) => (
                                        <li key={index}>{path}</li>
                                    ))}
                                </ul>
                            </InfoCard>
                        </div>


                        <InfoCard icon={Award} title="Required Qualifications" color="text-orange-400">
                            <ul className="list-disc list-inside space-y-1">
                                {details.required_qualifications.map((qual, index) => (
                                    <li key={index}>{qual}</li>
                                ))}
                            </ul>
                        </InfoCard>
                    </>
                )}
            </div>
        </div>
    );
}

