// src/utils/geminiApi.js

import { fetchWithRetry } from './api.js';

// Get API keys from environment variables, split them into an array, and filter out any empty strings
const apiKeys = (import.meta.env.VITE_GEMINI_API_KEYS || "")
  .split(',')
  .map(key => key.trim())
  .filter(Boolean);

let currentApiKeyIndex = 0;

/**
 * A centralized function to make calls to the Gemini API.
 * It automatically handles API key rotation if a request fails due to rate limits or other errors.
 *
 * @param {object} payload The body of the request to send to the Gemini API.
 * @returns {Promise<object>} The JSON response from the API.
 * @throws {Error} If all API keys fail.
 */
export async function callGeminiApi(payload) {
    if (!apiKeys.length) {
        throw new Error("Gemini API keys not found. Please check your .env file.");
    }

    // Loop through available API keys starting from the current one
    for (let i = 0; i < apiKeys.length; i++) {
        const keyToTry = apiKeys[currentApiKeyIndex];
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${keyToTry}`;

        try {
            const response = await fetchWithRetry(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Status 429 indicates "Too Many Requests" (rate limit)
            if (response.status === 429) {
                console.warn(`API key at index ${currentApiKeyIndex} is rate-limited. Trying next key.`);
                currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
                continue; // Try the next key
            }

            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }

            // If the request was successful, return the data and don't change the key index
            return await response.json();

        } catch (error) {
            console.error(`Error with API key index ${currentApiKeyIndex}:`, error.message);
            currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length; // Move to the next key on any error
        }
    }

    // If the loop completes without a successful call
    throw new Error("All API keys failed. Please check your keys or try again later.");
}