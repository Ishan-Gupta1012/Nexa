import React from 'react';
import { FileText, Map, Brain, Award } from 'lucide-react';

const icons = {
    FileText,
    Map,
    Brain,
    Award
};

export default function StatCard({ icon, label, value, color }) {
    const colorClasses = {
        emerald: "text-emerald-300",
        blue: "text-blue-300",
        purple: "text-purple-300",
        pink: "text-pink-300",
    };
    const hoverGlowClasses = {
        emerald: "hover:shadow-glow-emerald",
        blue: "hover:shadow-glow-blue",
        purple: "hover:shadow-glow-purple",
        pink: "hover:shadow-glow-pink",
    }
    const IconComponent = icons[icon];

    return (
        <div className={`bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-xl shadow-lg transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 ${hoverGlowClasses[color]}`}>
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    {IconComponent && <IconComponent className={`w-6 h-6 ${colorClasses[color]}`} />}
                </div>
                <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className={`text-sm font-medium ${colorClasses[color]}`}>{label}</p>
                </div>
            </div>
        </div>
    );
}