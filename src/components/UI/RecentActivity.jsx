import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Map, Brain } from 'lucide-react';

const activityItems = [
    { icon: FileText, label: "Resumes Created", valueKey: "resumes", color: "emerald", link: "/resume-builder" },
    { icon: Map, label: "Career Roadmaps", valueKey: "roadmaps", color: "blue", link: "/career-explorer" },
    { icon: Brain, label: "Interviews Practiced", valueKey: "interviews", color: "purple", link: "/interview-prep" },
];

export default function RecentActivity({ stats }) {
    return (
        <section className="space-y-6">
            <h2 className="text-3xl font-bold text-white text-center">Your Recent Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activityItems.map((item, index) => {
                    const value = stats[item.valueKey] || 0;
                    const colorClass = `text-${item.color}-400`;
                    const bgColorClass = `bg-${item.color}-500/20`;

                    return (
                        <Link to={item.link} key={index} className="group p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg transition-all duration-300 hover:bg-white/10 hover:-translate-y-1">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${bgColorClass} rounded-xl flex items-center justify-center`}>
                                    <item.icon className={`w-6 h-6 ${colorClass}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{value}</p>
                                    <p className={`text-sm font-medium ${colorClass}`}>{item.label}</p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}