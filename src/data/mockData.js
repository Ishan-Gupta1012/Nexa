export const mockUser = { full_name: "Alex Doe" };

export const mockStats = { resumes: 3, roadmaps: 1, completedAssessments: 4 };

export const mockProfile = {
    profile_picture_url: "",
    career_goals: "To become a lead software architect in the fintech industry.",
    current_role: "Senior Software Engineer",
    experience_level: "senior",
    industry: "Technology",
    skills: ["React", "Node.js", "TypeScript", "AWS"],
    certifications: ["AWS Certified Solutions Architect"],
    education: { degree: "Bachelor of Science", field: "Computer Science", university: "MIT", graduation_year: 2018 },
};
``
export const mockResume = {
    fullName: "Alex Doe",
    email: "alex.doe@email.com",
    phone: "123-456-7890",
    linkedin: "[linkedin.com/in/alexdoe](https://linkedin.com/in/alexdoe)",
    summary: "Experienced Senior Software Engineer with a demonstrated history of working in the computer software industry. Skilled in modern web technologies and cloud computing.",
    experience: [
        { id: 1, title: "Senior Software Engineer", company: "Tech Solutions Inc.", dates: "Jan 2020 - Present", description: "Led a team to develop and maintain a large-scale financial application using React and Node.js." },
        { id: 2, title: "Software Engineer", company: "Innovate Co.", dates: "Jun 2018 - Dec 2019", description: "Contributed to the development of a customer relationship management (CRM) platform." }
    ],
    education: { degree: "Bachelor of Science in Computer Science", university: "MIT", year: "2018" },
    skills: ["React", "Node.js", "TypeScript", "AWS", "SQL", "Docker"]
};


export const mockInterviewFeedbackEmpty = {
    clarity_confidence_score: 0,
    star_method_score: 0,
    keyword_score: 0,
    overall_feedback: "No interview data was found to provide feedback on. Please start a new interview session to get a detailed report.",
    strengths: [],
    areas_for_improvement: []
};