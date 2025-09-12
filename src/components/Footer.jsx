import React from 'react';
import linked from "../assets/linked.png"
import git from "../assets/git.png"

const Footer = () => {
  return (
    <footer className="bg-gray-900/50 text-white py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} NexaGen. All rights reserved.</p>
          <div className="flex space-x-4">
            <a 
              href="https://www.linkedin.com/in/ishan-gupta-08686631a?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BuVkHFmqNTnWvp4ff0TmKHA%3D%3D" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:opacity-80 transition-opacity"
            >
              <img 
                // src={linked} 
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg"
                alt="LinkedIn" 
                className="w-6 h-6" 
              />
            </a>
            
            <a 
              href="https://github.com/Ishan-Gupta1012" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:opacity-80 transition-opacity"
            >
              <img 
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" 
                alt="GitHub" 
                id="git"
                className="w-6 h-6" 
              />
            </a>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;