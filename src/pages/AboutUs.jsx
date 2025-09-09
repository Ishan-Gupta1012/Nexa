import React from 'react';
import { Target, Lightbulb, Heart } from 'lucide-react';
import nexaGenLogo from '../assets/logo.png'; 

// Import team member images
import ishanImage from '../assets/Ishan.png'; // Assuming ishan.png is Image 3
import kshitijImage from '../assets/Kshitij.png'; // Assuming kshitij.png is Image 1
import rahulImage from '../assets/Rahul.png'; // Assuming rahul.png is Image 2
import diwakarImage from '../assets/Diwakar.png'; // Assuming diwakar.png is Image 4


const teamMembers = [
  { name: "Ishan Gupta", role: "Frontend Developer", image: ishanImage }, // Changed to Image 3
  { name: "Kshitij Garg", role: "Backend Developer", image: kshitijImage }, // Changed to Image 1
  { name: "Rahul Kumar", role: "Full Stack Developer", image: rahulImage }, // Changed to Image 2
  { name: "Diwakar Mishra", role: "API Developer", image: diwakarImage } // Changed to Image 4
];

export default function AboutUs() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-12 text-white">
            <div className="text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-20 h-20 flex items-center justify-center">
                        <img src={nexaGenLogo} alt="NexaGen AI Logo" className="w-full h-full object-contain" />
                    </div>
                </div>
                <div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">About NexaGen AI</h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        Empowering students with AI-driven career guidance and personalized learning paths.
                    </p>
                </div>
            </div>

            <div className="text-center p-8 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-lg shadow-lg">
                <Target className="w-8 h-8 mx-auto mb-4" />
                <h2 className="text-3xl font-bold">Our Mission</h2>
                <p className="text-lg mt-2 max-w-4xl mx-auto text-gray-200">
                    Our project, “NexaGen AI”, is designed to empower students by providing a personalized roadmap for their future careers. The platform analyzes resumes, evaluates skills, and recommends suitable career paths while offering curated learning resources.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-lg space-y-4">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center"><Lightbulb className="w-6 h-6 text-orange-400" /></div>
                    <h3 className="text-2xl font-bold text-white">The Challenge</h3>
                    <p className="text-gray-300 leading-relaxed">In today’s fast-evolving job market, students often struggle to identify the right skills and opportunities. Our solution bridges this gap by combining AI-driven insights, career guidance, and continuous learning support, preparing learners to stay ahead in their professional journey.</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-lg space-y-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center"><Heart className="w-6 h-6 text-green-400" /></div>
                    <h3 className="text-2xl font-bold text-white">Our Vision</h3>
                    <p className="text-gray-300 leading-relaxed">We believe technology can democratize career guidance and make it accessible to everyone, helping students build confidence and clarity about their future. We are committed to creating a platform that truly understands and supports each learner's unique journey.</p>
                </div>
            </div>

            <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Meet Our Team</h2>
                <p className="text-gray-400 mt-2">The passionate innovators from Maharaja Agrasen Institute of Technology behind NexaGen AI.</p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {teamMembers.map((member) => (
                        <div key={member.name} className="text-center space-y-3 flex flex-col items-center">
                            <div className="w-28 h-28 mx-auto bg-gray-800 border border-white/10 rounded-full flex items-center justify-center overflow-hidden">
                                {member.image ? (
                                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-400 to-pink-400">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{member.name}</h4>
                                <p className="text-sm text-purple-400 font-medium">{member.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}