// ResumeDisplay.jsx
import React from "react";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ResumeDisplay({ resumeData, template = "modern" }) {
  if (!resumeData) return null;

  const initials = resumeData.personal_info?.full_name
    ? resumeData.personal_info.full_name.charAt(0).toUpperCase()
    : "P";

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-lg rounded-2xl font-sans text-slate-800">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 flex items-center justify-center rounded-full border-2 border-slate-400 text-2xl font-bold">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {resumeData.personal_info?.full_name || "Your Name"}
          </h1>
          <p className="text-red-600 font-medium">
            {resumeData.personal_info?.title || resumeData.role || "Job Title"}
          </p>
          <div className="mt-2 text-xs text-slate-600 space-y-1">
            {resumeData.personal_info?.email && (
              <div className="flex items-center gap-1">
                <Mail size={12} /> {resumeData.personal_info.email}
              </div>
            )}
            {resumeData.personal_info?.phone && (
              <div className="flex items-center gap-1">
                <Phone size={12} /> {resumeData.personal_info.phone}
              </div>
            )}
            {resumeData.personal_info?.location && (
              <div className="flex items-center gap-1">
                <MapPin size={12} /> {resumeData.personal_info.location}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {resumeData.summary && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-slate-700 border-b mb-2 pb-1">SUMMARY</h2>
          <p className="text-xs text-slate-700">{resumeData.summary}</p>
        </section>
      )}

      {/* Skills */}
      {resumeData.skills?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-slate-700 border-b mb-2 pb-1">SKILLS</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {resumeData.skills.map((skill, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-100 rounded">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {resumeData.experience?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-slate-700 border-b mb-2 pb-1">WORK EXPERIENCE</h2>
          {resumeData.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <h3 className="font-semibold text-sm">{exp.title}</h3>
              <div className="flex justify-between text-xs text-slate-600">
                <span>{exp.company}</span>
                <span>
                  {exp.start_date} - {exp.end_date || "Present"}
                </span>
              </div>
              <p className="text-xs mt-1 whitespace-pre-wrap">{exp.description}</p>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {resumeData.education?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-slate-700 border-b mb-2 pb-1">EDUCATION</h2>
          {resumeData.education.map((edu) => (
            <div key={edu.id} className="mb-2 text-xs">
              <strong>
                {edu.degree} in {edu.field}
              </strong>
              <div>
                {edu.university} – {edu.graduation_date}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {resumeData.projects?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-slate-700 border-b mb-2 pb-1">PROJECTS</h2>
          <ul className="list-disc list-inside mt-2 text-xs space-y-1">
            {resumeData.projects.map((proj, idx) => (
              <li key={idx}>
                <span className="font-medium">{proj.title}:</span> {proj.description}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Certifications */}
      {resumeData.certifications?.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-slate-700 border-b mb-2 pb-1">CERTIFICATIONS</h2>
          <ul className="list-disc list-inside mt-2 text-xs space-y-1">
            {resumeData.certifications.map((cert, idx) => (
              <li key={idx}>{cert}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
