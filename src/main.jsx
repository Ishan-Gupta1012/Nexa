import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routes } from "./App.jsx";
import "./index.css";

// 1. Define the future flags to opt into new behaviors and remove warnings
const future = {
	v7_startTransition: true,
	v7_relativeSplatPath: true,
};

// 2. Create the router using the new data router API and pass the flags
const router = createBrowserRouter(routes, { future });

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>
);

