import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { callGeminiApi } from '../utils/geminiApi.js'; // Import the new utility
import { fetchWithRetry } from "../utils/api.js";
import {
  Upload,
  FileText,
  Search,
  Loader2,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const inputRef = useRef(null);
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    // This line is crucial for the PDF reader to work.
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
    setIsProcessing(true);
    setAnalysis(null);

    try {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async (event) => {
        try {
          const pdfData = new Uint8Array(event.target.result);
          const pdf = await window.pdfjsLib.getDocument({ data: pdfData })
            .promise;
          let textContent = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map((s) => s.str).join(" \n");
          }

          const prompt = `Analyze the following resume text for a professional role. Provide a detailed, constructive analysis. Return ONLY a valid JSON object with the structure: { "overall_score": number (1-100), "strengths": [array of 3 strings], "weaknesses": [array of 3 strings], "suggestions": [array of 3 strings] }`;

          const response = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: `RESUME TEXT: """ ${textContent} """ ${prompt}` },
                    ],
                  },
                ],
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
          alert(
            "Failed to get AI analysis. Please check your API key and console for details."
          );
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
  };

  const AnalysisResults = () => (
    <div className="space-y-8">
      <div className="text-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Analysis Complete</h2>
        <p className="text-5xl font-bold">
          {analysis.overall_score}
          <span className="text-3xl">/100</span>
        </p>
        <p className="text-purple-200 mt-1">
          Your resume's score based on professional standards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
          <h3 className="font-bold text-lg text-green-400 flex items-center gap-2">
            <CheckCircle />
            Strengths
          </h3>
          <ul className="mt-4 space-y-2 list-disc list-inside text-gray-300">
            {analysis.strengths.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
          <h3 className="font-bold text-lg text-orange-400 flex items-center gap-2">
            <AlertTriangle />
            Areas for Improvement
          </h3>
          <ul className="mt-4 space-y-2 list-disc list-inside text-gray-300">
            {analysis.weaknesses.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
        <h3 className="font-bold text-lg text-blue-400 flex items-center gap-2">
          <Lightbulb />
          Actionable AI Suggestions
        </h3>
        <ul className="mt-4 space-y-3 list-decimal list-inside text-gray-300">
          {analysis.suggestions.map((item, i) => (
            <li key={i} className="pl-2">
              {item}
            </li>
          ))}
        </ul>
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
        <label className="font-bold text-white">Upload Your Resume (PDF)</label>
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
      <div className="text-center">
        <button
          onClick={analyzeResume}
          disabled={isProcessing || !file}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-600 flex items-center justify-center mx-auto transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" /> Analyze Resume
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
            Get instant, expert feedback on your resume.
          </p>
        </div>
      </div>
      {analysis ? <AnalysisResults /> : <UploadForm />}
    </div>
  );
}
