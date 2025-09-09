import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient.js";
import { callGeminiApi } from '../utils/geminiApi.js'; // Import the new utility
import { fetchWithRetry } from "../utils/api.js";
import {
  BookOpen,
  Search,
  Sparkles,
  Loader2,
  ExternalLink,
  Bookmark,
  CheckCircle,
  Youtube,
  Globe,
  Clock,
  FileText,
} from "lucide-react";

export default function LearningHub() {
  const [profile, setProfile] = useState(null);
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ difficulty: "all", type: "all" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
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
        const { data: dbResources } = await supabase
          .from("learning_resources")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setResources(dbResources || []);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const filteredResources = useMemo(() => {
    let tempResources = [...resources];
    if (searchQuery) {
      tempResources = tempResources.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.skill_focus?.some((s) =>
            s.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }
    if (filters.difficulty !== "all") {
      tempResources = tempResources.filter(
        (r) => r.difficulty === filters.difficulty
      );
    }
    if (filters.type !== "all") {
      tempResources = tempResources.filter((r) => r.type === filters.type);
    }

    if (activeTab === "saved") return tempResources.filter((r) => r.user_saved);
    if (activeTab === "completed")
      return tempResources.filter((r) => r.user_completed);
    if (activeTab === "recommended")
      return tempResources.filter((r) => r.ai_recommended);
    return tempResources;
  }, [resources, searchQuery, filters, activeTab]);

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const context = profile
        ? `User's career goal is ${
            profile.career_goals || "not specified"
          }. Their current experience level is ${profile.experience_level}.`
        : "";
      const prompt = `Find 5-6 high-quality, real-world learning resources for "${searchQuery}". ${context}.`;

      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              resources: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    provider: { type: "STRING" },
                    type: {
                      type: "STRING",
                      enum: ["course", "video", "article"],
                    },
                    skill_focus: { type: "ARRAY", items: { type: "STRING" } },
                    difficulty: {
                      type: "STRING",
                      enum: ["beginner", "intermediate", "advanced"],
                    },
                    duration_hours: { type: "NUMBER" },
                    url: { type: "STRING" },
                  },
                },
              },
            },
          },
        },
      };

      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const jsonString = data.candidates[0].content.parts[0].text;
      const aiResponse = JSON.parse(jsonString);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const newResources = aiResponse.resources.map((r) => ({
        ...r,
        ai_recommended: true,
        user_id: user.id,
      }));

      const { data: createdResources, error } = await supabase
        .from("learning_resources")
        .insert(newResources)
        .select();
      if (error) throw error;

      setResources((prev) => [
        ...createdResources,
        ...prev.filter((p) => !createdResources.find((cr) => cr.url === p.url)),
      ]);
      setActiveTab("recommended");
    } catch (error) {
      console.error("AI Search Error:", error);
      alert("AI search failed. Please check your API key and console.");
    } finally {
      setIsSearching(false);
    }
  };

  const toggleResourceProp = async (resourceId, prop) => {
    const resource = resources.find((r) => r.id === resourceId);
    if (!resource) return;
    const newValue = !resource[prop];
    const { data: updatedResource, error } = await supabase
      .from("learning_resources")
      .update({ [prop]: newValue })
      .eq("id", resourceId)
      .select()
      .single();
    if (error) {
      console.error(`Failed to toggle ${prop}:`, error);
    } else {
      setResources((prev) =>
        prev.map((r) => (r.id === resourceId ? updatedResource : r))
      );
    }
  };

  const getTypeIcon = (type) =>
    ({
      video: <Youtube className="w-4 h-4 text-red-400" />,
      course: <BookOpen className="w-4 h-4 text-blue-400" />,
      article: <FileText className="w-4 h-4 text-yellow-400" />,
    }[type] || <Globe className="w-4 h-4 text-gray-400" />);
  const getDifficultyColor = (d) =>
    ({
      beginner: "border-green-500/50 bg-green-500/10 text-green-300",
      intermediate: "border-yellow-500/50 bg-yellow-500/10 text-yellow-300",
      advanced: "border-red-500/50 bg-red-500/10 text-red-300",
    }[d] || "");

  if (isLoading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
      </div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Learning Hub</h1>
          <p className="text-gray-400">
            Discover curated learning resources powered by AI
          </p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for courses, skills, or topics..."
              className="pl-12 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAISearch()}
            />
          </div>
          <button
            onClick={handleAISearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 flex items-center justify-center disabled:bg-gray-600 transition-colors"
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                AI Search
              </>
            )}
          </button>
        </div>
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.difficulty}
            onChange={(e) =>
              setFilters((f) => ({ ...f, difficulty: e.target.value }))
            }
            className="border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((f) => ({ ...f, type: e.target.value }))
            }
            className="border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-800 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="course">Course</option>
            <option value="video">Video</option>
            <option value="article">Article</option>
          </select>
        </div>
      </div>

      <div>
        <div className="border-b border-white/10">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {["all", "recommended", "saved", "completed"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? "border-orange-500 text-orange-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-8">
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((r) => (
                <div
                  key={r.id}
                  className="bg-white/5 backdrop-blur-md border border-white/10 flex flex-col p-4 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex-1 space-y-3">
                    <h3 className="font-bold text-white">{r.title}</h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1.5">
                      {getTypeIcon(r.type)}
                      {r.provider}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {r.skill_focus?.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-300">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${getDifficultyColor(
                          r.difficulty
                        )}`}
                      >
                        {r.difficulty}
                      </span>
                      {r.duration_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {r.duration_hours}h
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-4 mt-4 border-t border-white/10">
                    <button
                      onClick={() => toggleResourceProp(r.id, "user_saved")}
                      className={`p-2 rounded-md transition-colors text-gray-400 ${
                        r.user_saved
                          ? "text-orange-400 bg-orange-500/20"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <Bookmark size={20} />
                    </button>
                    <button
                      onClick={() => toggleResourceProp(r.id, "user_completed")}
                      className={`p-2 rounded-md transition-colors text-gray-400 ${
                        r.user_completed
                          ? "text-green-400 bg-green-500/20"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <CheckCircle size={20} />
                    </button>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <button className="w-full px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-semibold hover:bg-gray-700 transition-colors">
                        <ExternalLink className="w-4 h-4 mr-2 inline-block" />
                        View
                      </button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-white/5 backdrop-blur-md rounded-xl border border-dashed border-gray-700">
              <BookOpen className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <h3 className="text-lg font-medium text-white">
                No Resources Found
              </h3>
              <p className="text-gray-500">
                Try adjusting your filters or use AI Search to discover new
                learning materials.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
