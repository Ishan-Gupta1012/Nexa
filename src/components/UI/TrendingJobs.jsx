import React from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';

const trendingJobs = [
  { title: "Data Scientist", field: "Data & AI", type: "tech" },
  { title: "AI/ML Engineer", field: "Data & AI", type: "tech" },
  { title: "Full Stack Developer", field: "Development", type: "tech" },
  { title: "Cybersecurity Analyst", field: "Security", type: "tech" },
  { title: "Cloud Architect", field: "Infrastructure", type: "tech" },
  { title: "Digital Marketing Manager", field: "Marketing", type: "business" },
  { title: "Product Manager", field: "Management", type: "business" },
];

const JobCard = ({ title, field, type }) => {
  const typeColor = type === 'tech' ? 'text-cyan-400' : 'text-amber-400';
  return (
    <a href="#" className="block group bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:border-cyan-400/50">
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${typeColor}`}>{field}</p>
          <h4 className="font-bold text-white mt-1">{title}</h4>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-cyan-400 transition-all duration-300 transform -rotate-45 group-hover:rotate-0" />
      </div>
    </a>
  );
};

export default function TrendingJobs() {
  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold text-white text-center flex items-center justify-center gap-3">
        <TrendingUp className="w-8 h-8 text-cyan-400" />
        Trending Job Roles
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingJobs.map(job => <JobCard key={job.title} {...job} />)}
         <div className="md:col-span-2 lg:col-span-1 flex items-center justify-center text-center bg-white/5 backdrop-blur-md border-2 border-dashed border-white/10 p-4 rounded-xl">
            <p className="text-gray-400">More roles and regional data coming soon!</p>
        </div>
      </div>
    </section>
  );
}