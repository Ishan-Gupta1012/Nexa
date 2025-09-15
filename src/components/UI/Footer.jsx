import React, { useState } from 'react';
import { Mail, Send, X } from 'lucide-react';
import nexaGenLogo from '../../assets/logo.png';

// --- Easily Editable Social Links ---
const socialLinks = {
  email: "nexagen0@gmail.com"
};

const ContactModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-white/10 rounded-xl p-8 max-w-lg w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
        <p className="text-gray-400 mb-6">Have a question or feedback? Fill out the form below.</p>
        <form action={`https://formsubmit.co/${socialLinks.email}`} method="POST" className="space-y-4">
          <input type="text" name="name" placeholder="Your Name" required className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white" />
          <input type="email" name="email" placeholder="Your Email" required className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white" />
          <textarea name="message" placeholder="Your Message" rows="5" required className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white"></textarea>
          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-2">
            <Send size={18} /> Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <footer className="relative z-10 w-full mt-12 border-t border-white/10 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3">
                <img src={nexaGenLogo} alt="NexaGen AI" className="w-10 h-10" />
                <span className="text-xl font-bold">NexaGen AI</span>
              </div>
              <p className="mt-4 text-sm text-gray-400 text-center md:text-left">
                Empowering your career journey with artificial intelligence.
              </p>
            </div>

            <div className="text-center">
              <h3 className="font-semibold tracking-wider uppercase">Quick Links</h3>
              <div className="mt-4 flex flex-col space-y-2 text-sm">
                <a href="#/about-us" className="text-gray-400 hover:text-white transition-colors">About Us</a>
                <button onClick={() => setIsModalOpen(true)} className="text-gray-400 hover:text-white transition-colors">Contact Us</button>
              </div>
            </div>

            <div className="text-center md:text-right">
              <h3 className="font-semibold tracking-wider uppercase">Connect With Us</h3>
              <div className="mt-4 flex justify-center md:justify-end">
                <a href={`mailto:${socialLinks.email}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-center group">
                  <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                    <Mail size={24} />
                  </div>
                  <span className="mt-2 text-sm text-gray-400 group-hover:text-white transition-colors">{socialLinks.email}</span>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} NexaGen AI. All rights reserved.
          </div>
        </div>
      </footer>
      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}