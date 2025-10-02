// src/utils/api.js

// This is a robust fetch function with exponential backoff for handling rate limits (429 errors)
export async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.status !== 429) {
                return response; // Success or a non-rate-limit error
            }
            // If it's a 429, wait and retry
            console.warn(`Rate limit hit. Retrying in ${delay / 1000}s...`);
            await new Promise(res => setTimeout(res, delay));
            delay *= 2; // Exponential backoff
        } catch (error) {
            // This catches network errors, not HTTP error statuses
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
        }
    }
    throw new Error("API rate limit exceeded after multiple retries. Please try again later.");
}

// --- NEW --- API Key Pool Logic
const apiKeys = [
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
  import.meta.env.VITE_GEMINI_API_KEY_5,
  import.meta.env.VITE_GEMINI_API_KEY_6,
  import.meta.env.VITE_GEMINI_API_KEY_7,
  import.meta.env.VITE_GEMINI_API_KEY_8,
  import.meta.env.VITE_GEMINI_API_KEY_9,
  import.meta.env.VITE_GEMINI_API_KEY_10,
  import.meta.env.VITE_GEMINI_API_KEY_11,
  import.meta.env.VITE_GEMINI_API_KEY_12,
  import.meta.env.VITE_GEMINI_API_KEY_13,
  import.meta.env.VITE_GEMINI_API_KEY_14,

  // Add more keys here if you have them
].filter(Boolean); // Filter out any undefined keys

if (apiKeys.length === 0) {
  console.error("No Gemini API keys found in .env file. Please add them.");
}

export function getApiKey() {
  if (apiKeys.length === 0) {
    throw new Error("No API keys available.");
  }
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return apiKeys[randomIndex];
}