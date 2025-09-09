import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
// import { callGeminiApi } from '../utils/geminiApi.js'; // Import the new utility    
import { fetchWithRetry } from "../utils/api.js";
import {
  Brain,
  Play,
  Loader2,
  Award,
  Sparkles,
  CheckCircle,
  XCircle,
  FileText,
  ArrowLeft,
} from "lucide-react";

const popularSkills = [
  "JavaScript",
  "Python",
  "React",
  "SQL",
  "Project Management",
];

export default function SkillAssessmentPage() {
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [skillCategory, setSkillCategory] = useState("JavaScript");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [numQuestions, setNumQuestions] = useState(5);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("skill_assessments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setHistory(data || []);
    }
    setIsLoadingHistory(false);
  };

  const handleGenerateQuiz = async () => {
    if (!skillCategory.trim()) return alert("Please enter a skill category.");
    setIsGenerating(true);
    try {
      const prompt = `Create a skill assessment for a user on the topic of "${skillCategory}" at a "${difficulty}" difficulty level. Generate exactly ${numQuestions} multiple-choice questions. Return ONLY a valid JSON object with a "questions" array. Each question object must have: "question": string, "options": array of 4 strings, "correct_answer": number (0-3 index of the correct option), "explanation": string.`;

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
      if (!response.ok) throw new Error("API request failed to generate quiz.");

      const data = await response.json();
      const jsonString = data.candidates[0].content.parts[0].text;
      const aiResponse = JSON.parse(jsonString);

      setCurrentAssessment({
        skill_category: skillCategory,
        questions: aiResponse.questions,
      });
    } catch (error) {
      console.error("Quiz Generation Error:", error);
      alert(
        "Failed to create the assessment with AI. Please check your API key and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const nextQuestion = () => {
    if (selectedAnswer === null) return;
    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);
    if (currentQuestionIndex < currentAssessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      completeAssessment(newAnswers);
    }
  };

  const completeAssessment = async (answers) => {
    const correctAnswers = answers.filter(
      (ans, i) => ans === currentAssessment.questions[i].correct_answer
    ).length;
    const score = Math.round(
      (correctAnswers / currentAssessment.questions.length) * 100
    );
    const level =
      score >= 80 ? "Expert" : score >= 60 ? "Advanced" : "Intermediate";

    setIsGeneratingFeedback(true);
    try {
      const feedbackPrompt = `A user scored ${score}% on a ${currentAssessment.skill_category} assessment. Provide a short, encouraging feedback summary (2-3 sentences) and suggest 2 specific, high-quality online learning resources to help them improve. Format the response with markdown.`;
      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: feedbackPrompt }] }],
          }),
        }
      );
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      const aiFeedback = data.candidates[0].content.parts[0].text;

      const questionsWithUserAnswers = currentAssessment.questions.map(
        (q, i) => ({ ...q, user_answer: answers[i] })
      );

      const finalResults = {
        score,
        level,
        ai_feedback: aiFeedback,
        questions: questionsWithUserAnswers,
        userAnswers: answers,
      };
      setResults(finalResults);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: newEntry } = await supabase
          .from("skill_assessments")
          .insert({
            user_id: user.id,
            skill_category: currentAssessment.skill_category,
            score: score,
            level: level,
            questions: questionsWithUserAnswers,
            ai_feedback: aiFeedback,
            completed: true,
          })
          .select()
          .single();
        if (newEntry) setHistory((prev) => [newEntry, ...prev]);
      }
    } catch (error) {
      console.error("Feedback generation failed:", error);
      setResults({
        score,
        level,
        ai_feedback: "Could not generate AI feedback at this time.",
        questions: currentAssessment.questions,
        userAnswers: answers,
      });
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const viewHistoryItem = (assessment) => {
    const answers = assessment.questions.map((q) => q.user_answer);
    setResults({ ...assessment, userAnswers: answers });
  };

  const resetQuiz = () => {
    setCurrentAssessment(null);
    setResults(null);
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setSkillCategory("JavaScript");
    setDifficulty("intermediate");
    setNumQuestions(5);
  };

  if (isGenerating || isGeneratingFeedback) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="w-16 h-16 text-pink-400 animate-spin" />
        <p className="text-xl text-gray-400">AI is working its magic...</p>
      </div>
    );
  }

  if (results) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <Award className="w-16 h-16 mx-auto text-yellow-400" />
          <h1 className="text-3xl font-bold mt-4 text-white">
            Assessment Complete!
          </h1>
          <p className="text-5xl font-bold mt-2 text-white">
            {results.score}
            <span className="text-3xl">/100</span>
          </p>
          <p className="text-xl font-semibold bg-purple-500/20 text-purple-300 inline-block px-4 py-1 rounded-full mt-2">
            {results.level}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
            <FileText size={20} className="text-gray-400" />
            Review Your Answers
          </h3>
          <div className="space-y-6">
            {results.questions.map((q, index) => {
              const userAnswer = results.userAnswers[index];
              const isCorrect = userAnswer === q.correct_answer;
              return (
                <div key={index} className="border-t border-white/10 pt-4">
                  <p className="font-semibold text-white">
                    {index + 1}. {q.question}
                  </p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((option, i) => {
                      let styles = "border-gray-700 text-gray-300";
                      if (i === q.correct_answer)
                        styles =
                          "bg-green-500/20 border-green-500/30 font-semibold text-green-300";
                      if (i === userAnswer && !isCorrect)
                        styles = "bg-red-500/20 border-red-500/30 text-red-300";
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 border rounded-lg text-sm ${styles}`}
                        >
                          {i === q.correct_answer && (
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          )}
                          {i === userAnswer && !isCorrect && (
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          )}
                          <span>{option}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 p-3 bg-gray-800/50 rounded-md">
                    <p className="text-xs font-semibold text-gray-300">
                      Explanation:
                    </p>
                    <p className="text-xs text-gray-400">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-white">
            <Sparkles size={20} className="text-purple-400" />
            AI Feedback & Recommendations
          </h3>
          <div
            className="text-gray-300 whitespace-pre-wrap prose prose-sm max-w-none prose-strong:text-white"
            dangerouslySetInnerHTML={{
              __html: results.ai_feedback
                .replace(/\n/g, "<br />")
                .replace(/\*/g, "&bull;"),
            }}
          />
        </div>

        <div className="text-center pt-4">
          <button
            onClick={resetQuiz}
            className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2 inline-block" /> Back to
            Assessments
          </button>
        </div>
      </div>
    );
  }

  if (currentAssessment) {
    const question = currentAssessment.questions[currentQuestionIndex];
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            {currentAssessment.skill_category} Quiz
          </h1>
          <p className="font-semibold text-gray-300">
            Question {currentQuestionIndex + 1} of{" "}
            {currentAssessment.questions.length}
          </p>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-pink-600 h-2.5 rounded-full"
            style={{
              width: `${
                ((currentQuestionIndex + 1) /
                  currentAssessment.questions.length) *
                100
              }%`,
            }}
          ></div>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-6 text-white">
            {question.question}
          </h2>
          <div className="space-y-4">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedAnswer(i)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === i
                    ? "border-pink-500 bg-pink-500/20 text-pink-300"
                    : "border-gray-700 text-gray-300 hover:bg-white/10"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={nextQuestion}
            disabled={selectedAnswer === null}
            className="px-8 py-3 bg-pink-600 text-white font-bold rounded-lg disabled:bg-gray-600 transition-colors"
          >
            {currentQuestionIndex === currentAssessment.questions.length - 1
              ? "Finish & See Results"
              : "Next Question"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
          <Brain className="w-6 h-6 text-pink-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Skill Assessment</h1>
          <p className="text-gray-400">
            Generate a custom quiz on any topic with AI.
          </p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl space-y-6">
        <h2 className="text-xl font-bold text-white">
          Create a New Assessment
        </h2>
        <div>
          <label
            htmlFor="skill-category"
            className="text-sm font-semibold block mb-2 text-gray-300"
          >
            Skill or Topic
          </label>
          <input
            id="skill-category"
            value={skillCategory}
            onChange={(e) => setSkillCategory(e.target.value)}
            placeholder="e.g., React Hooks, SQL Joins..."
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {popularSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => setSkillCategory(skill)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  skillCategory === skill
                    ? "bg-pink-600 text-white border-pink-600"
                    : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="difficulty"
              className="text-sm font-semibold block mb-2 text-gray-300"
            >
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="num-questions"
              className="text-sm font-semibold block mb-2 text-gray-300"
            >
              Number of Questions
            </label>
            <select
              id="num-questions"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>
        <div className="text-center pt-4">
          <button
            onClick={handleGenerateQuiz}
            className="w-full sm:w-auto px-8 py-3 bg-pink-600 text-white rounded-md font-bold hover:bg-pink-700 flex items-center justify-center mx-auto transition-colors"
          >
            <Play className="w-5 h-5 mr-2" />
            Start AI-Powered Assessment
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
        <h3 className="font-bold text-lg text-white">
          Your Assessment History
        </h3>
        <div className="mt-4 space-y-2">
          {isLoadingHistory ? (
            <p className="text-gray-400">Loading history...</p>
          ) : history.length > 0 ? (
            history.map((a) => (
              <button
                key={a.id}
                onClick={() => viewHistoryItem(a)}
                className="w-full text-left p-3 border-b border-white/10 flex justify-between items-center hover:bg-white/5 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-semibold text-white">{a.skill_category}</p>
                  <p className="text-xs text-gray-400">
                    Completed on {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-white">{a.score}/100</p>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      a.level === "Expert"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-green-500/20 text-green-300"
                    }`}
                  >
                    {a.level}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-center text-gray-500 py-4">
              You haven't completed any assessments yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
