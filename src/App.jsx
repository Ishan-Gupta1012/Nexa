import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import ResumeBuilder from './pages/ResumeBuilder.jsx';
import SignIn from './pages/SignIn.jsx';
import AIAssistant from './pages/AIAssistant.jsx';
import ResumeAnalyzer from './pages/ResumeAnalyzer.jsx';
import CareerRoadmap from './pages/CareerRoadmap.jsx';

import LearningHub from './pages/LearningHub.jsx';
import AboutUs from './pages/AboutUs.jsx';
import ResumePreview from './pages/ResumePreview.jsx';
import InterviewPrep from './pages/InterviewPrep.jsx'; // --- NEW IMPORT ---
function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/resume-preview" element={<ResumePreview />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="resume-builder" element={<ResumeBuilder />} />
        <Route path="ai-assistant" element={<AIAssistant />} />
        <Route path="resume-analyzer" element={<ResumeAnalyzer />} />
        <Route path="interview-prep" element={<InterviewPrep />} /> {/* --- NEW ROUTE --- */}
        <Route path="career-roadmap" element={<CareerRoadmap />} />
        
        <Route path="learning-hub" element={<LearningHub />} />
        <Route path="about-us" element={<AboutUs />} />
      </Route>
    </Routes>
  );
}

export default App;