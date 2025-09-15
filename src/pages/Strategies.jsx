import React from 'react';
import { Lightbulb, Target, TrendingUp, Briefcase, BookOpen, Users, Timer, Brain, WifiOff } from 'lucide-react';
import BackgroundAnimation from '../components/UI/BackgroundAnimation.jsx';

const strategyData = [
    {
      "title": "Effective Resume Building",
      "description": "Craft a resume that stands out to recruiters and hiring managers. Learn how to highlight your skills, experience, and achievements to make a powerful first impression.",
      "icon": "FileText",
      "points": [
        "Use action verbs to describe your accomplishments.",
        "Tailor your resume for each job application.",
        "Quantify your achievements with numbers and data.",
        "Keep your resume concise and easy to read."
      ]
    },
    {
      "title": "Networking for Success",
      "description": "Build meaningful professional connections that can open doors to new opportunities. Discover how to network effectively both online and in person.",
      "icon": "Users",
      "points": [
        "Attend industry events and conferences.",
        "Leverage LinkedIn to connect with professionals in your field.",
        "Conduct informational interviews to learn from others.",
        "Follow up with new connections to maintain relationships."
      ]
    },
    {
      "title": "Mastering the Interview",
      "description": "Prepare for interviews with confidence. Learn how to answer common interview questions, ask insightful questions, and showcase your qualifications.",
      "icon": "Briefcase",
      "points": [
        "Research the company and the role beforehand.",
        "Practice answering behavioral questions using the STAR method.",
        "Prepare a list of questions to ask the interviewer.",
        "Send a thank-you note after the interview."
      ]
    },
    {
      "title": "Developing In-Demand Skills",
      "description": "Stay competitive in the job market by continuously developing new skills. Identify the skills that are in high demand in your industry and create a plan to acquire them.",
      "icon": "TrendingUp",
      "points": [
        "Take online courses and tutorials.",
        "Work on personal projects to apply your skills.",
        "Earn certifications to validate your expertise.",
        "Seek out opportunities for hands-on experience."
      ]
    },
    {
      "title": "Building a Personal Brand",
      "description": "Define and communicate your unique value proposition. Learn how to build a strong personal brand that attracts opportunities and establishes you as an expert in your field.",
      "icon": "Target",
      "points": [
        "Create a professional website or portfolio.",
        "Share your knowledge on social media and blogs.",
        "Speak at events and conferences.",
        "Network with other professionals in your industry."
      ]
    },
    {
      "title": "Continuous Learning Mindset",
      "description": "Embrace a mindset of lifelong learning to stay relevant and adaptable in an ever-changing world. Cultivate curiosity and a passion for acquiring new knowledge.",
      "icon": "BookOpen",
      "points": [
        "Read books, articles, and industry publications.",
        "Listen to podcasts and watch educational videos.",
        "Attend workshops and seminars.",
        "Seek feedback and learn from your mistakes."
      ]
    },
    {
      "title": "Pomodoro Technique",
      "description": "Boost productivity by working in short, focused bursts The Pomodoro Technique involves working in intervals called 'Pomodoros' with breaks in between.",
      "icon": "Timer",
      "points": [
        "Set a timer for 25 minutes and focus on one task.",
        "Take a 5-minute break after each interval.",
        "Repeat this cycle 4 times, then take a longer 15-30 minute break.",
      ]
    },
    {
      "title": "Mindfulness Meditation",
      "description": "Improve focus and reduce stress through mindfulness Mindfulness meditation helps you stay present and develop better focus by observing your thoughts without judgment.",
      "icon": "Brain",
      "points": [
        "Find a quiet place and sit comfortably.",
        "Close your eyes and focus on your breath.",
        "When your mind wanders, gently bring it back to your breath.",
        "Practice daily for 5-10 minutes, gradually increasing the duration.",
      ]
    },
    {
      "title": "Digital Detox",
      "description": "Enhance productivity by limiting screen time A digital detox involves consciously reducing screen time to minimize distractions and improve focus.",
      "icon": "WifiOff",
      "points": [
        "Set specific times for checking emails and social media.",
        "Use apps or tools to track and limit screen time.",
        "Create phone-free zones, like the bedroom or dining area.",
        "Engage in offline activities, such as reading or outdoor sports.",
      ]
    }
];

const iconMap = {
    FileText: Briefcase,
    Users: Users,
    Briefcase: Briefcase,
    TrendingUp: TrendingUp,
    Target: Target,
    BookOpen: BookOpen,
    Default: Lightbulb
};


const StrategyCard = ({ item }) => {
    const Icon = iconMap[item.icon] || iconMap.Default;
    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg h-full flex flex-col">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4 flex-grow">{item.description}</p>
            <ul className="space-y-2">
                {item.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-purple-400 mt-1">&rarr;</span>
                        <span>{point}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default function Strategies() {
    return (
        <div className="relative p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-12">
            <BackgroundAnimation />
            <div className="relative z-10 text-center">
                <h1 className="text-4xl lg:text-5xl font-bold text-white">Career Strategies</h1>
                <p className="text-xl text-gray-400 mt-4 max-w-3xl mx-auto">
                    Actionable advice and proven techniques to help you navigate your career path and achieve your professional goals.
                </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {strategyData.map((item, index) => (
                    <StrategyCard key={index} item={item} />
                ))}
            </div>
        </div>
    );
}