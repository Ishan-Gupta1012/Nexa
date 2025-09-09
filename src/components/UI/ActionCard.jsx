import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Map, Brain, ArrowRight } from 'lucide-react';

const icons = {
    FileText,
    Search,
    Map,
    Brain
};

export default function ActionCard({ title, icon, color, description, link }) {
     const colorClasses = {
        emerald: "text-emerald-400",
        blue: "text-blue-400",
        purple: "text-purple-400",
        pink: "text-pink-400",
    };
    const hoverGlowClasses = {
        emerald: "hover:shadow-glow-emerald",
        blue: "hover:shadow-glow-blue",
        purple: "hover:shadow-glow-purple",
        pink: "hover:shadow-glow-pink",
    };
    const IconComponent = icons[icon];

    return (
        <Link to={link} className="block group">
            <div className={`bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 ${hoverGlowClasses[color]}`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                           {IconComponent && <IconComponent className={`w-6 h-6 ${colorClasses[color]}`} />}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-white">{title}</h3>
                            <p className="text-sm text-gray-400">{description}</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            </div>
        </Link>
    );
};