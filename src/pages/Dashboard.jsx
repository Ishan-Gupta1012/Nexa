import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import Footer from "../components/UI/Footer.jsx";
import Layout from "../components/layout.jsx"
import { fetchWithRetry, getApiKey } from "../utils/api.js";
import {
  Sparkles,
  Target,
  X,
  Loader2,
  FileText,
  Map,
  Brain,
  Award,
  Clock,
} from "lucide-react";
import nexaGenLogo from "../assets/logo.png";
import StatCard from "../components/UI/StatCard.jsx";
import SkillGapWidget from "../components/UI/SkillGapWidget.jsx";
import TrendingJobs from "../components/UI/TrendingJobs.jsx";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [latestRoadmap, setLatestRoadmap] = useState(null);
  const [stats, setStats] = useState({
    resumes: 0,
    roadmaps: 0,
    interviews: 0,
    certifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showProfileReminder, setShowProfileReminder] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const [profileRes, resumeRes, roadmapRes, interviewsRes, latestRoadmapRes] =
          await Promise.all([
            supabase.from("profiles").select("certifications, skills, career_goals, current_role").eq("id", user.id).single(),
            supabase.from("resumes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
            supabase.from("career_roadmaps").select("*", { count: "exact", head: true }).eq("user_id", user.id),
            supabase.from("interview_sessions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
            supabase.from("career_roadmaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
          ]);

        const { data: profileData, error: profileError } = profileRes;
        if (!profileData && !profileError) {
          setShowProfileReminder(true);
        } else if (profileData) {
          setProfile(profileData);
        }

        if (latestRoadmapRes.data && latestRoadmapRes.data.length > 0) {
            setLatestRoadmap(latestRoadmapRes.data[0]);
        }

        setStats({
          resumes: resumeRes.count || 0,
          roadmaps: roadmapRes.count || 0,
          interviews: interviewsRes.count || 0,
          certifications: profileData?.certifications?.length || 0,
        });

        // --- NEW: Fetch recent activity ---
        const [recentResumes, recentRoadmaps, recentInterviews] = await Promise.all([
          supabase.from("resumes").select("title, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
          supabase.from("career_roadmaps").select("title, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
          supabase.from("interview_sessions").select("job_title, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
        ]);
        
        const activities = [];
        if (recentResumes.data) {
          recentResumes.data.forEach(item => activities.push({
            type: "Resume created",
            title: item.title,
            date: item.created_at,
            link: "/resume-builder",
            icon: FileText
          }));
        }
        if (recentRoadmaps.data) {
          recentRoadmaps.data.forEach(item => activities.push({
            type: "Career roadmap generated",
            title: item.title,
            date: item.created_at,
            link: "/career-explorer",
            icon: Map
          }));
        }
        if (recentInterviews.data) {
          recentInterviews.data.forEach(item => activities.push({
            type: "Interview practiced",
            title: item.job_title,
            date: item.created_at,
            link: "/interview-prep",
            icon: Brain
          }));
        }

        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentActivity(activities.slice(0, 5));

        if (profileData && profileData.current_role && profileData.career_goals) {
          const prompt = `Based on this user's profile (Role: ${profileData.current_role}, Goal: ${profileData.career_goals}), provide one single, short, and actionable suggestion for their next career step. Be encouraging.`;
          try {
            const apiKey = getApiKey();
            const response = await fetchWithRetry(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
              { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
            );
            if (response.ok) {
              const data = await response.json();
              setAiSuggestion(data.candidates[0].content.parts[0].text.trim());
            }
          } catch (e) { console.error("AI suggestion fetch failed:", e); }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const actionItems = [
    { title: "Resume Tools", link: "/resume-builder" },
    { title: "Career Explorer", link: "/career-explorer" },
    { title: "Interview Prep", link: "/interview-prep" },
  ];

  const statItems = [
    { icon: "FileText", label: "Resumes Created", value: stats.resumes, color: "emerald" },
    { icon: "Map", label: "Career Roadmaps", value: stats.roadmaps, color: "blue" },
    { icon: "Brain", label: "Interviews Practiced", value: stats.interviews, color: "purple" },
    { icon: "Award", label: "Certifications", value: stats.certifications, color: "pink" },
  ];

  if (loading) {
    return (
      <div className="p-8 flex justify-center min-h-screen items-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "User";
  const gridBackgroundStyle = {
      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
      backgroundSize: '2rem 2rem',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white w-full" style={gridBackgroundStyle}>
      <div className="relative overflow-hidden">
        <div className="absolute top-0 -left-1/4 w-full h-full bg-purple-600 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 -right-1/4 w-full h-full bg-emerald-600 rounded-full mix-blend-lighten filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-12">
          
          {showProfileReminder && (
            <div className="bg-yellow-500/10 backdrop-blur-md rounded-xl border border-yellow-400/20 p-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0"><Target className="w-5 h-5 text-yellow-400" /></div>
                <div className="flex-1">
                  <h3 className="text-md font-bold text-white mb-1">Complete Your Profile</h3>
                  <p className="text-yellow-200 text-sm mb-3">Set up your profile to unlock personalized AI recommendations.</p>
                  <Link to="/profile"><button className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold rounded-lg text-xs px-3 py-1.5">Complete Profile</button></Link>
                </div>
                <button onClick={() => setShowProfileReminder(false)} className="text-yellow-200/50 hover:text-yellow-200"><X className="w-5 h-5" /></button>
              </div>
            </div>
          )}
          <section className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Discover Your Path, <br/> <span className="text-emerald-400">{firstName}</span>!
              </h1>
              {aiSuggestion ? (
                  <p className="text-lg text-gray-300 max-w-lg leading-relaxed">{aiSuggestion}</p>
              ) : (
                  <p className="text-lg text-gray-300 max-w-lg leading-relaxed">Chart your course to success with us! We're excited to make your career journey as vibrant and smooth as possible.</p>
              )}
              <div className="w-full overflow-hidden relative group pt-4 pb-4">
                <div className="flex animate-marquee group-hover:[animation-play-state:paused] whitespace-nowrap">
                    {actionItems.concat(actionItems).map((item, index) => (
                        <Link to={item.link} key={`${item.title}-${index}`} className="flex-shrink-0 mx-2 px-5 py-2.5 border border-gray-600 bg-gray-800/50 rounded-lg font-semibold hover:bg-gray-700/80 transition-colors">
                            {item.title}
                        </Link>
                    ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
                <img src={nexaGenLogo} alt="NexaGen AI" className="w-full max-w-sm h-auto animate-float"/>
            </div>
          </section>

          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statItems.map((item) => (
                <StatCard key={item.label} {...item} />
              ))}
            </div>
          </section>

          <section className="space-y-6">
             <SkillGapWidget profile={profile} roadmap={latestRoadmap} />
          </section>
          
          {/* --- NEW: Recent Activity Section --- */}
          <section>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl shadow-lg p-6">
                <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-purple-400" /> Recent Activity
                </h2>
                {recentActivity.length > 0 ? (
                  <ul className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <li key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <activity.icon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white">{activity.type}</p>
                            <p className="text-xs text-gray-400">{activity.title}</p>
                        </div>
                        <p className="text-xs text-gray-500 flex-shrink-0">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity found. Get started with our tools!</p>
                )}
            </div>
          </section>

          <TrendingJobs />

        </div>
      </div>
      <Footer />
    </div>
  );
}