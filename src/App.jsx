import React from "react";
import { Outlet } from "react-router-dom";
import Layout from "./components/layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import ResumeBuilder from "./pages/ResumeBuilder.jsx";
import SignIn from "./pages/SignIn.jsx";
import ResumeAnalyzer from "./pages/ResumeAnalyzer.jsx";
import CareerExplorer from "./pages/CareerExplorer.jsx";
import AboutUs from "./pages/AboutUs.jsx";
import ResumePreview from "./pages/ResumePreview.jsx";
import InterviewPrep from "./pages/InterviewPrep.jsx";
import Strategies from "./pages/Strategies.jsx";
import CareerCompass from "./pages/CareerCompass.jsx";
import JobDetails from "./pages/JobDetails.jsx";

export const routes = [
	{ path: "signin", element: <SignIn /> },
	{ path: "resume-preview", element: <ResumePreview /> },
	{
		path: "",
		element: <Layout />,
		children: [
			{ index: true, element: <Dashboard /> },
			{ path: "dashboard", element: <Dashboard /> },
			{ path: "profile", element: <Profile /> },
			{ path: "resume-builder", element: <ResumeBuilder /> },
			{ path: "resume-analyzer", element: <ResumeAnalyzer /> },
			{ path: "interview-prep", element: <InterviewPrep /> },
			{ path: "career-explorer", element: <CareerExplorer /> },
			{ path: "career-compass", element: <CareerCompass /> },
			{ path: "strategies", element: <Strategies /> },
			{ path: "about-us", element: <AboutUs /> },
			{ path: "job-details/:jobTitle", element: <JobDetails /> },
		],
	},
];