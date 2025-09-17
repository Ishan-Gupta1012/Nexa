import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import ResumeDisplay from "../components/resume_templates/ResumeDisplay.jsx";

export default function ResumePreview() {
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = localStorage.getItem("resumeForPreview");
    if (storedData) {
      setResumeData(JSON.parse(storedData));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center p-8 text-white bg-gray-950">
        <h2 className="text-2xl font-bold">No Resume Data Found</h2>
        <p className="text-gray-400 mt-2">
          Please go back to the builder and save a resume to preview it.
        </p>
        <button
          onClick={() => navigate("/resume-builder")}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back to Builder
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-4 sm:p-8 min-h-screen">
      <style>{`
                @media print {
                  body { background-color: white !important; -webkit-print-color-adjust: exact; }
                  .no-print { display: none !important; }
                  .print-container { padding: 0 !important; margin: 0 !important; }
                  .print-content { box-shadow: none !important; border: none !important; }
                }
            `}</style>

      <div className="max-w-4xl mx-auto print-container">
        <div className="flex justify-between mb-4 no-print">
          <button
            onClick={() => navigate("/resume-builder")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 border border-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Editor
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Printer className="w-4 h-4" /> Save as PDF / Print
          </button>
        </div>

        <div className="aspect-[8.5/11] w-full bg-white print-content shadow-2xl rounded-lg overflow-hidden">
          <ResumeDisplay
            resumeData={{
              ...resumeData,
              summary: resumeData.summary || "",
              projects: resumeData.projects || [],
              certifications: resumeData.certifications || [],
            }}
            template={resumeData.template || "modern"}
          />
        </div>
      </div>
    </div>
  );
}