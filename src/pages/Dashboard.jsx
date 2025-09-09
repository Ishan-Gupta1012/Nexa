import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
// import { callGeminiApi } from '../utils/geminiApi.js'; // Import the new utility
import { fetchWithRetry } from "../utils/api.js";
import {
  Sparkles,
  FileText,
  Search,
  Map,
  Brain,
  Award,
  Target,
  X,
  Loader2,
} from "lucide-react";
import StatCard from "../components/UI/StatCard.jsx";
import ActionCard from "../components/UI/ActionCard.jsx";

// A new component for the main action grid for better organization
const MainActions = () => (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg p-6 h-full">
    <h2 className="text-2xl font-bold text-white mb-4">
      What would you like to do?
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ActionCard
        title="Build a New Resume"
        description="Start from scratch with AI help"
        icon="FileText"
        color="emerald"
        link="/resume-builder"
      />
      <ActionCard
        title="Analyze a Resume"
        description="Get AI-powered feedback"
        icon="Search"
        color="blue"
        link="/resume-analyzer"
      />
      <ActionCard
        title="Create a Roadmap"
        description="Generate a step-by-step career plan"
        icon="Map"
        color="purple"
        link="/career-roadmap"
      />
      <ActionCard
        title="Take an Assessment"
        description="Test your skills with a custom quiz"
        icon="Brain"
        color="pink"
        link="/skill-assessment"
      />
    </div>
  </div>
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    resumes: 0,
    roadmaps: 0,
    assessments: 0,
    certifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const [profileRes, resumeRes, roadmapRes, assessmentRes] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("certifications, skills, career_goals, current_role")
              .eq("id", user.id)
              .single(),
            supabase
              .from("resumes")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id),
            supabase
              .from("career_roadmaps")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id),
            supabase
              .from("skill_assessments")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("completed", true),
          ]);

        const { data: profile, error: profileError } = profileRes;
        if (!profile && !profileError) {
          setShowProfileReminder(true);
        }

        setStats({
          resumes: resumeRes.count || 0,
          roadmaps: roadmapRes.count || 0,
          assessments: assessmentRes.count || 0,
          certifications: profile?.certifications?.length || 0,
        });

        if (profile) {
          const prompt = `Based on this user's profile (Role: ${profile.current_role}, Goal: ${profile.career_goals}), provide one single, short, and actionable suggestion for their next career step. Be encouraging.`;
          try {
            const response = await fetchWithRetry(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                }),
              }
            );
            if (response.ok) {
              const data = await response.json();
              setAiSuggestion(data.candidates[0].content.parts[0].text.trim());
            }
          } catch (e) {
            console.error("AI suggestion fetch failed:", e);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "User";

  return (
    <div className="relative overflow-hidden p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Background Glows */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-600 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="space-y-2 relative z-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-white">
          Welcome back, <span className="text-emerald-400">{firstName}</span>!
        </h1>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          {aiSuggestion && (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> Your AI-Powered
                Next Step
              </h3>
              <p className="mt-2 text-gray-300">{aiSuggestion}</p>
            </div>
          )}
          <MainActions />
        </div>

        {/* Right Column (Stats) */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Your Stats</h2>
          <StatCard
            icon="FileText"
            label="Resumes Created"
            value={stats.resumes}
            color="emerald"
          />
          <StatCard
            icon="Map"
            label="Career Roadmaps"
            value={stats.roadmaps}
            color="blue"
          />
          <StatCard
            icon="Brain"
            label="Skills Assessed"
            value={stats.assessments}
            color="purple"
          />
          <StatCard
            icon="Award"
            label="Certifications"
            value={stats.certifications}
            color="pink"
          />
        </div>
      </div>

      {showProfileReminder && (
        <div className="relative z-10 bg-yellow-500/10 backdrop-blur-md rounded-xl border border-yellow-400/20 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">
                Complete Your Profile
              </h3>
              <p className="text-yellow-200 mb-4">
                Set up your profile to unlock personalized AI recommendations.
              </p>
              <Link to="/profile">
                <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg text-sm px-4 py-2">
                  Complete Profile
                </button>
              </Link>
            </div>
            <button
              onClick={() => setShowProfileReminder(false)}
              className="text-gray-500 hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
