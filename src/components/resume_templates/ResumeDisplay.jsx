import React from "react";
import { Mail, Phone, MapPin, Link as LinkIcon } from "lucide-react";

export default function ResumeDisplay({ resumeData, template = "modern" }) {
  if (!resumeData) return null;

  const initials = resumeData.personal_info?.full_name
    ? resumeData.personal_info.full_name.charAt(0).toUpperCase()
    : "P";

  // Helper to check if a section has content to display
  const hasContent = (section) => {
      if (!section) return false;
      if (Array.isArray(section)) return section.length > 0 && section.some(item => Object.values(item).some(val => !!val));
      if (typeof section === 'object') return Object.keys(section).length > 0;
      return true;
  }

  return (
    // Use Flexbox to structure the layout vertically and ensure it fills the height
    <div className="p-8 bg-white font-sans text-slate-800 h-full flex flex-col overflow-hidden">
      {/* Header Section */}
      <header className="flex items-center gap-6 mb-8 flex-shrink-0">
        <div className="w-20 h-20 flex items-center justify-center rounded-full border-2 border-slate-400 text-3xl font-bold bg-slate-50 flex-shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {resumeData.personal_info?.full_name || "Your Name"}
          </h1>
          <p className="text-red-600 font-medium text-lg">
            {resumeData.personal_info?.title || "Job Title"}
          </p>
          <div className="mt-2 text-sm text-slate-600 space-y-1">
            {resumeData.personal_info?.email && (
              <div className="flex items-center gap-2">
                <Mail size={14} /> {resumeData.personal_info.email}
              </div>
            )}
            {resumeData.personal_info?.phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} /> {resumeData.personal_info.phone}
              </div>
            )}
            {resumeData.personal_info?.location && (
              <div className="flex items-center gap-2">
                <MapPin size={14} /> {resumeData.personal_info.location}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content area that will grow to fill available space */}
      <div className="flex-grow space-y-6 overflow-y-auto pr-2">
        {hasContent(resumeData.summary) && (
          <section>
            <h2 className="text-base font-bold text-slate-700 border-b-2 border-slate-300 mb-2 pb-1 tracking-wider uppercase">SUMMARY</h2>
            <p className="text-sm text-slate-700">{resumeData.summary}</p>
          </section>
        )}

        {hasContent(resumeData.experience) && (
          <section>
            <h2 className="text-base font-bold text-slate-700 border-b-2 border-slate-300 mb-3 pb-1 tracking-wider uppercase">WORK EXPERIENCE</h2>
            <div className="space-y-4">
              {resumeData.experience.map((exp) => (
                <div key={exp.id}>
                  <h3 className="font-semibold text-lg">{exp.title}</h3>
                  <div className="flex justify-between text-sm text-slate-600 font-medium">
                    <span>{exp.company}</span>
                    <span>
                      {exp.start_date} - {exp.end_date || "Present"}
                    </span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap text-slate-700">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {hasContent(resumeData.projects) && (
          <section>
            <h2 className="text-base font-bold text-slate-700 border-b-2 border-slate-300 mb-3 pb-1 tracking-wider uppercase">PROJECTS</h2>
            <div className="space-y-3 text-sm">
              {resumeData.projects.map((proj, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2">
                      <span className="font-bold text-base">{proj.title}</span>
                      {proj.link && (
                          <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                              <LinkIcon size={12}/>
                              View Project
                          </a>
                      )}
                  </div>
                  <p className="text-slate-700">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {hasContent(resumeData.education) && (
          <section>
            <h2 className="text-base font-bold text-slate-700 border-b-2 border-slate-300 mb-3 pb-1 tracking-wider uppercase">EDUCATION</h2>
            <div className="space-y-2">
              {resumeData.education.map((edu) => (
                <div key={edu.id} className="text-sm">
                  <strong className="text-base">
                    {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                  </strong>
                  <div>
                    {edu.university} – {edu.graduation_date}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {hasContent(resumeData.skills) && (
          <section>
            <h2 className="text-base font-bold text-slate-700 border-b-2 border-slate-300 mb-3 pb-1 tracking-wider uppercase">SKILLS</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              {resumeData.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 rounded-md font-medium text-slate-700">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}