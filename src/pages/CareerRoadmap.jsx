import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
// import { callGeminiApi } from '../utils/geminiApi.js'; // Import the new utility
import { fetchWithRetry } from "../utils/api.js";
import {
  Map,
  Plus,
  Sparkles,
  Loader2,
  CheckCircle,
  Target,
  BookOpen,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default function CareerRoadmapPage() {
  const [profile, setProfile] = useState(null);
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newRoadmapGoal, setNewRoadmapGoal] = useState("");
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(userProfile);

        const { data: userRoadmaps } = await supabase
          .from("career_roadmaps")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setRoadmaps(userRoadmaps || []);
        if (userRoadmaps?.length > 0) {
          setSelectedRoadmap(userRoadmaps[0]);
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const generateRoadmap = async () => {
    if (!newRoadmapGoal.trim()) return;
    if (!profile) {
      alert("Please complete your profile first for a personalized roadmap!");
      return;
    }
    setIsCreating(true);
    try {
      const context = `Current Profile: Role - ${
        profile.current_role
      }, Skills - ${profile.skills?.join(", ")}`;
      const prompt = `Based on this context: "${context}", create a detailed career roadmap for a user who wants to become a "${newRoadmapGoal}". Generate a JSON object with a realistic timeline in months and 5-7 logical milestones. For each milestone, provide a title, description, skills_gained (array of strings), and suggested_resources (array of strings). Return ONLY a valid JSON object with the structure: { "timeline_months": number, "milestones": [ { "title": "string", "description": "string", "skills_gained": ["string"], "suggested_resources": ["string"] } ] }`;

      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );
      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const jsonString = data.candidates[0].content.parts[0].text;
      const aiResponse = JSON.parse(jsonString);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const newRoadmapData = {
        user_id: user.id,
        title: `${newRoadmapGoal} Roadmap`,
        career_goal: newRoadmapGoal,
        timeline_months: aiResponse.timeline_months,
        milestones: aiResponse.milestones.map((m) => ({
          ...m,
          status: "pending",
        })),
      };

      const { data: newRoadmap, error } = await supabase
        .from("career_roadmaps")
        .insert(newRoadmapData)
        .select()
        .single();
      if (error) throw error;

      setRoadmaps((prev) => [newRoadmap, ...prev]);
      setSelectedRoadmap(newRoadmap);
      setNewRoadmapGoal("");
    } catch (error) {
      console.error("Error generating roadmap:", error);
      alert(
        "Failed to generate roadmap. Please check your API key and console."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const updateMilestoneStatus = async (milestoneIndex, newStatus) => {
    if (!selectedRoadmap) return;

    const updatedMilestones = selectedRoadmap.milestones.map((m, i) =>
      i === milestoneIndex ? { ...m, status: newStatus } : m
    );
    const completedCount = updatedMilestones.filter(
      (m) => m.status === "completed"
    ).length;
    const progress = Math.round(
      (completedCount / updatedMilestones.length) * 100
    );

    const { data: updatedRoadmap, error } = await supabase
      .from("career_roadmaps")
      .update({ milestones: updatedMilestones, progress_percentage: progress })
      .eq("id", selectedRoadmap.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating milestone:", error);
    } else {
      setSelectedRoadmap(updatedRoadmap);
      setRoadmaps((prev) =>
        prev.map((r) => (r.id === updatedRoadmap.id ? updatedRoadmap : r))
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
          <Map className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">AI Career Roadmap</h1>
          <p className="text-gray-400">
            Your personalized step-by-step career guidance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
            <h3 className="font-bold mb-2 text-lg text-white">
              Create New Roadmap
            </h3>
            <input
              value={newRoadmapGoal}
              onChange={(e) => setNewRoadmapGoal(e.target.value)}
              placeholder="e.g., Senior ML Engineer"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isCreating}
            />
            <button
              onClick={generateRoadmap}
              disabled={isCreating || !newRoadmapGoal.trim()}
              className="mt-3 w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 flex items-center justify-center disabled:bg-gray-600 transition-colors"
            >
              {isCreating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate AI Roadmap
                </>
              )}
            </button>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-lg">
            <h3 className="font-bold text-lg mb-2 text-white">My Roadmaps</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {roadmaps.length > 0 ? (
                roadmaps.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoadmap(r)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedRoadmap?.id === r.id
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-gray-700 hover:bg-white/10"
                    }`}
                  >
                    <p className="font-semibold text-white">{r.career_goal}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: `${r.progress_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-300">
                        {r.progress_percentage}%
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-center text-gray-500 py-4">
                  No roadmaps yet. Create one to get started!
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedRoadmap ? (
            <div className="space-y-4">
              {selectedRoadmap.milestones?.map((milestone, index) => (
                <details
                  key={index}
                  className="group bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10"
                  open={index === 0}
                >
                  <summary className="font-bold text-white cursor-pointer list-none flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          milestone.status === "completed"
                            ? "bg-green-500/20 border-green-500 text-green-400"
                            : "bg-gray-700 border-gray-600 text-gray-400"
                        }`}
                      >
                        {milestone.status === "completed" ? (
                          <CheckCircle size={20} />
                        ) : (
                          <Target size={20} />
                        )}
                      </div>
                      <span>{milestone.title}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="pt-4 mt-4 border-t border-white/10 pl-14">
                    <p className="text-gray-400 text-sm mb-4">
                      {milestone.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-white">
                          <TrendingUp size={16} className="text-blue-400" />{" "}
                          Skills to Gain
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {milestone.skills_gained.map((s) => (
                            <span
                              key={s}
                              className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm mb-2 flex items-center gap-2 text-white">
                          <BookOpen size={16} className="text-orange-400" />{" "}
                          Suggested Resources
                        </h5>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                          {milestone.suggested_resources?.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {milestone.status !== "completed" && (
                      <div className="mt-4">
                        <button
                          onClick={() =>
                            updateMilestoneStatus(index, "completed")
                          }
                          className="text-xs px-3 py-1 bg-green-500/20 text-green-300 rounded-full hover:bg-green-500/30 font-semibold transition-colors"
                        >
                          Mark as Completed
                        </button>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center bg-white/5 backdrop-blur-md rounded-xl border border-dashed border-gray-700">
              <div className="text-center space-y-4">
                <Map className="w-16 h-16 mx-auto text-gray-700" />
                <div>
                  <h3 className="text-lg font-medium text-white">
                    No Roadmap Selected
                  </h3>
                  <p className="text-gray-500">
                    Create or select a roadmap to view your career path.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
