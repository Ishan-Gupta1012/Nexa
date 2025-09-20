// src/pages/ResumeBuilder.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient.js";
import { fetchWithRetry, getApiKey } from "../utils/api.js";
import { Loader2, Save, Plus, Trash2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import ResumeDisplay from "../components/resume_templates/ResumeDisplay.jsx";
import BackgroundAnimation from "../components/UI/BackgroundAnimation.jsx";

const initialResumeState = {
  template: "modern",
  personal_info: { full_name: "", title: "", email: "", phone: "", location: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
};

const sections = ["Personal", "Summary", "Experience", "Education", "Skills", "Projects", "Finalize"];

const FormInput = ({ id, placeholder, value, onChange, type = "text" }) => (
    <input 
        id={id} 
        type={type}
        placeholder={placeholder} 
        value={value} 
        onChange={onChange}
        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
    />
);

const FormTextarea = ({ id, placeholder, value, onChange, rows = 4 }) => (
    <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
    />
);

export default function ResumeBuilder() {
  const [resumeData, setResumeData] = useState(initialResumeState);
  const [activeSection, setActiveSection] = useState("Personal");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingBulletsFor, setIsGeneratingBulletsFor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setResumeData((prev) => ({
          ...prev,
          personal_info: { 
            full_name: profileData?.full_name || user.user_metadata?.full_name || "",
            email: user.email || "",
            phone: profileData?.phone || "",
            location: profileData?.location || "",
            title: profileData?.current_role || "",
          },
          skills: profileData?.skills || [],
          certifications: (profileData?.certifications || []).map(cert => ({
              id: Date.now() + Math.random(),
              name: cert,
              issuer: '',
              date: ''
          })),
        }));
      }
    };
    fetchUserAndProfile();
  }, []);

  const handleNestedChange = (e) =>
    setResumeData((p) => ({
      ...p,
      personal_info: { ...p.personal_info, [e.target.id]: e.target.value },
    }));

  const handleItemChange = (index, section, e) => {
    const list = [...resumeData[section]];
    list[index][e.target.id] = e.target.value;
    setResumeData((p) => ({ ...p, [section]: list }));
  };

  const addItem = (section) => {
    let newItem;
    if (section === "experience") newItem = { id: Date.now(), title: "", company: "", location: "", start_date: "", end_date: "", description: "" };
    else if (section === "education") newItem = { id: Date.now(), degree: "", field: "", university: "", graduation_date: "" };
    else if (section === "projects") newItem = { id: Date.now(), title: "", description: "", link: "" };
     
    setResumeData((p) => ({ ...p, [section]: [...(p[section] || []), newItem] }));
  };

  const removeItem = (section, index) =>
    setResumeData((p) => ({ ...p, [section]: p[section].filter((_, i) => i !== index) }));

  const handleGenerateSuggestions = async (index) => {
    const experienceItem = resumeData.experience[index];
    if (!experienceItem.title) {
      alert("Please enter a 'Job Title' first to generate suggestions.");
      return;
    }
    setIsGeneratingBulletsFor(index);
    try {
      const prompt = `You are a professional resume writer. Based on the job title "${experienceItem.title}" and the company "${experienceItem.company}", generate 3-4 concise, action-oriented bullet points that highlight key achievements. If the user has provided some notes in the description below, use them for context. Use the STAR (Situation, Task, Action, Result) method where possible. Start each bullet point with an action verb.
      
      User's notes (if any): "${experienceItem.description}"

      Return ONLY a valid JSON object with the structure: { "bullet_points": ["string"] }`;

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
      if (!response.ok) throw new Error("AI suggestion failed");

      const data = await response.json();
      const jsonString = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(jsonString);

      if (result.bullet_points && result.bullet_points.length > 0) {
        const list = [...resumeData.experience];
        list[index].description = result.bullet_points.map(bp => `- ${bp}`).join('\n');
        setResumeData((p) => ({ ...p, experience: list }));
      }

    } catch (error) {
      console.error("Error generating suggestions:", error);
      alert("Failed to generate suggestions. Please try again.");
    } finally {
      setIsGeneratingBulletsFor(null);
    }
  };

  const handleSaveAndPreview = async () => {
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in.");
      return setIsSaving(false);
    }
    const { data, error } = await supabase
      .from("resumes")
      .insert({ ...resumeData, user_id: user.id, title: `${resumeData.personal_info.full_name}'s Resume` })
      .select()
      .single();
    if (error) {
        console.error("Save error:", error);
        alert("Failed to save resume.");
    } else {
      localStorage.setItem("resumeForPreview", JSON.stringify(data));
      navigate("/resume-preview");
    }
    setIsSaving(false);
  };

  const navigateSection = (direction) => {
    const currentIndex = sections.indexOf(activeSection);
    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < sections.length) setActiveSection(sections[newIndex]);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "Personal":
        return (
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput id="full_name" placeholder="Full Name" value={resumeData.personal_info.full_name} onChange={handleNestedChange} />
              <FormInput id="title" placeholder="Professional Title" value={resumeData.personal_info.title} onChange={handleNestedChange} />
              <FormInput id="email" placeholder="Email" value={resumeData.personal_info.email} onChange={handleNestedChange} />
              <FormInput id="phone" placeholder="Phone" value={resumeData.personal_info.phone} onChange={handleNestedChange} />
              <FormInput id="location" placeholder="Location (e.g., City, Country)" value={resumeData.personal_info.location} onChange={handleNestedChange} />
            </div>
          </div>
        );
      case "Summary":
        return (
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Professional Summary</h3>
            <FormTextarea
              placeholder="Write a short, compelling summary about your professional background and goals..."
              value={resumeData.summary}
              onChange={(e) => setResumeData((p) => ({ ...p, summary: e.target.value }))}
              rows={6}
            />
          </div>
        );
      case "Experience":
        return (
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Work Experience</h3>
            <div className="space-y-4">
              {resumeData.experience.map((exp, i) => (
                <div key={exp.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-3 relative">
                  <button onClick={() => removeItem("experience", i)} className="absolute top-3 right-3 text-red-400 hover:text-red-300">
                    <Trash2 size={16} />
                  </button>
                  <FormInput id="title" placeholder="Job Title" value={exp.title} onChange={(e) => handleItemChange(i, "experience", e)} />
                  <FormInput id="company" placeholder="Company" value={exp.company} onChange={(e) => handleItemChange(i, "experience", e)} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput id="start_date" type="date" placeholder="Start Date" value={exp.start_date} onChange={(e) => handleItemChange(i, "experience", e)} />
                    <FormInput id="end_date" type="date" placeholder="End Date" value={exp.end_date} onChange={(e) => handleItemChange(i, "experience", e)} />
                  </div>
                  <div>
                    <FormTextarea 
                      id="description" 
                      placeholder="Describe your role and achievements, or add notes for the AI..." 
                      value={exp.description} 
                      onChange={(e) => handleItemChange(i, "experience", e)} 
                      rows={5}
                    />
                    <div className="text-right -mt-11 mr-2">
                       <button 
                         onClick={() => handleGenerateSuggestions(i)} 
                         disabled={isGeneratingBulletsFor !== null}
                         className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/50 text-purple-200 text-xs font-semibold rounded-lg hover:bg-purple-600/80 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                       >
                         {isGeneratingBulletsFor === i ? (
                           <Loader2 size={14} className="animate-spin" />
                         ) : (
                           <Sparkles size={14} />
                         )}
                         AI Suggest
                       </button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => addItem("experience")} className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                <Plus size={16} className="inline mr-1" /> Add Experience
              </button>
            </div>
          </div>
        );
      case "Education":
        return (
           <div>
            <h3 className="font-bold text-lg mb-4 text-white">Education</h3>
            <div className="space-y-4">
              {resumeData.education.map((edu, i) => (
                <div key={edu.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-3 relative">
                  <button onClick={() => removeItem("education", i)} className="absolute top-3 right-3 text-red-400 hover:text-red-300">
                    <Trash2 size={16} />
                  </button>
                  <FormInput id="degree" placeholder="Degree (e.g., Bachelor of Science)" value={edu.degree} onChange={(e) => handleItemChange(i, "education", e)} />
                  <FormInput id="field" placeholder="Field of Study (e.g., Computer Science)" value={edu.field} onChange={(e) => handleItemChange(i, "education", e)} />
                  <FormInput id="university" placeholder="University Name" value={edu.university} onChange={(e) => handleItemChange(i, "education", e)} />
                  <FormInput id="graduation_date" type="text" placeholder="Graduation Date" value={edu.graduation_date} onChange={(e) => handleItemChange(i, "education", e)} />
                </div>
              ))}
              <button onClick={() => addItem("education")} className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                <Plus size={16} className="inline mr-1" /> Add Education
              </button>
            </div>
          </div>
        );
      case "Skills":
        return (
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Skills</h3>
            <FormTextarea
              value={resumeData.skills.join(", ")}
              onChange={(e) => setResumeData((p) => ({ ...p, skills: e.target.value.split(",").map((s) => s.trim()) }))}
              placeholder="Enter skills separated by commas (e.g., React, Node.js, Python)..."
            />
          </div>
        );
       case "Projects":
        return (
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Projects</h3>
            <div className="space-y-4">
                {resumeData.projects.map((proj, i) => (
                <div key={proj.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg space-y-3 relative">
                    <button onClick={() => removeItem("projects", i)} className="absolute top-3 right-3 text-red-400 hover:text-red-300">
                        <Trash2 size={16} />
                    </button>
                    <FormInput id="title" placeholder="Project Title" value={proj.title} onChange={(e) => handleItemChange(i, "projects", e)} />
                    <FormInput id="link" placeholder="Project Link (e.g., GitHub, Live Demo)" value={proj.link} onChange={(e) => handleItemChange(i, "projects", e)} />
                    <FormTextarea id="description" placeholder="Project Description" value={proj.description} onChange={(e) => handleItemChange(i, "projects", e)} />
                </div>
                ))}
                <button onClick={() => addItem("projects")} className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                <Plus size={16} className="inline mr-1" /> Add Project
                </button>
            </div>
          </div>
        );
      case "Finalize":
        return (
          <div className="text-center p-8 flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <Save className="w-8 h-8 text-emerald-400"/>
            </div>
            <h3 className="text-2xl font-bold text-white">Ready to Save?</h3>
            <p className="mt-2 text-gray-400">Click below to save your resume and generate a downloadable version.</p>
            <button onClick={handleSaveAndPreview} disabled={isSaving} className="mt-6 px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg inline-flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:bg-gray-600">
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Save & Preview
            </button>
          </div>
        );
      default:
        return <p>Coming soon...</p>;
    }
  };

  return (
    <div className="min-h-full bg-gray-950 text-white relative overflow-hidden">
      <BackgroundAnimation />
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 sm:p-8 items-start">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl space-y-6 h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-2 border-b border-white/10 pb-4">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`text-sm font-semibold pb-2 transition-colors ${
                  activeSection === section ? "border-b-2 border-emerald-500 text-emerald-400" : "text-gray-400 hover:text-white"
                }`}
              >
                {section}
              </button>
            ))}
          </div>
          {renderSection()}
          <div className="flex justify-between mt-6 pt-4 border-t border-white/10">
            <button
              onClick={() => navigateSection("prev")}
              disabled={sections.indexOf(activeSection) === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => navigateSection("next")}
              disabled={sections.indexOf(activeSection) === sections.length - 1}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Section <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="sticky top-24">
          <div className="aspect-[8.5/11] w-full bg-white shadow-2xl border-4 border-white/10 rounded-lg overflow-hidden">
            <ResumeDisplay resumeData={resumeData} template={resumeData.template} />
          </div>
        </div>
      </div>
    </div>
  );
}