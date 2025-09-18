// src/pages/ResumeAnalyzer.jsx

import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { fetchWithRetry, getApiKey } from "../utils/api.js";
import {
  Upload,
  FileText,
  Search,
  Loader2,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  ClipboardPaste,
} from "lucide-react";

export default function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [profile, setProfile] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from("profiles").select("skills").eq("id", user.id).single();
            setProfile(data);
        }
    };
    fetchProfile();
    
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Please select a PDF file.");
    }
  };

  const analyzeResume = async () => {
    if (!file) return alert("Please upload a resume first.");
    if (!jobDescription.trim()) return alert("Please paste a job description.");
    setIsProcessing(true);
    setAnalysis(null);

    try {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async (event) => {
        try {
          const pdfData = new Uint8Array(event.target.result);
          const pdf = await window.pdfjsLib.getDocument({ data: pdfData }).promise;
          let textContent = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map((s) => s.str).join(" \n");
          }

          const userSkills = profile?.skills?.join(', ') || 'Not specified';
          const prompt = `You are an expert HR tech analyst. Analyze the provided resume text against the job description, considering the user's listed skills from their profile.

            -   **Job Description**: """${jobDescription}"""
            -   **Resume Text**: """${textContent}"""
            -   **User's Profile Skills**: ${userSkills}

            Provide a 'Job Match Score' from 1-100. Also, provide a 'Missing Keywords' array with critical terms from the job description that are not in the resume, and an 'Improvement Suggestions' array with 3 actionable pieces of advice on how to better tailor the resume for this role, taking into account their existing skills.

            Return ONLY a valid JSON object with the structure: { "job_match_score": number, "missing_keywords": ["string"], "improvement_suggestions": ["string"] }`;

          const apiKey = getApiKey();
          const response = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" },
              }),
            }
          );

          if (!response.ok) throw new Error("API request for analysis failed");

          const data = await response.json();
          const jsonString = data.candidates[0].content.parts[0].text;
          const result = JSON.parse(jsonString);
          setAnalysis(result);
        } catch (err) {
          console.error("AI Analysis error:", err);
          alert("Failed to get AI analysis. Please check your API key and console for details.");
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (error) {
      console.error("File reading error:", error);
      setIsProcessing(false);
    }
  };

  const resetAnalyzer = () => {
    setFile(null);
    setAnalysis(null);
    setJobDescription("");
  };

  const AnalysisResults = () => (
    <div className="space-y-8">
      <div className="text-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Job Match Score</h2>
        <p className="text-5xl font-bold">
          {analysis.job_match_score}
          <span className="text-3xl">/100</span>
        </p>
        <p className="text-purple-200 mt-1">
          Your resume's alignment with the job description.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
          <h3 className="font-bold text-lg text-orange-400 flex items-center gap-2">
            <AlertTriangle />
            Missing Keywords
          </h3>
          <p className="text-xs text-gray-400 mb-4">Keywords from the job description not found in your resume.</p>
          <div className="flex flex-wrap gap-2">
            {analysis.missing_keywords.map((item, i) => (
              <span key={i} className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">{item}</span>
            ))}
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
          <h3 className="font-bold text-lg text-blue-400 flex items-center gap-2">
            <Lightbulb />
            Actionable AI Suggestions
          </h3>
          <ul className="mt-4 space-y-3 list-decimal list-inside text-gray-300 text-sm">
            {analysis.improvement_suggestions.map((item, i) => (
              <li key={i} className="pl-2">{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-center pt-6">
        <button
          onClick={resetAnalyzer}
          className="px-8 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 flex items-center justify-center mx-auto text-lg transition-colors"
        >
          Analyze Another Resume
        </button>
      </div>
    </div>
  );
  
  const UploadForm = () => (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-xl space-y-6">
      <div>
        <label className="font-bold text-white">1. Upload Your Resume (PDF)</label>
        <div className="mt-2 text-center p-8 border-2 border-dashed border-gray-700 rounded-lg">
          <Upload className="w-12 h-12 mx-auto text-blue-500 mb-4" />
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileSelect}
            className="hidden"
            id="resume-upload"
            accept=".pdf"
          />
          <button
            onClick={() => inputRef.current.click()}
            className="px-4 py-2 border border-gray-600 bg-gray-700/50 rounded-md font-semibold hover:bg-gray-700 text-white transition-colors"
          >
            <FileText className="w-4 h-4 mr-2 inline-block" />
            {file ? file.name : "Choose PDF File"}
          </button>
        </div>
      </div>
      <div>
        <label className="font-bold text-white">2. Paste Job Description</label>
        <div className="mt-2 relative">
            <ClipboardPaste className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
            <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows="8"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>
      </div>
      <div className="text-center">
        <button
          onClick={analyzeResume}
          disabled={isProcessing || !file || !jobDescription}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-600 flex items-center justify-center mx-auto transition-colors text-lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" /> Get Job Match Analysis
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <Search className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">AI Resume Analyzer</h1>
          <p className="text-gray-400">
            Get instant feedback on how well your resume matches a job description.
          </p>
        </div>
      </div>
      {analysis ? <AnalysisResults /> : <UploadForm />}
    </div>
  );
}