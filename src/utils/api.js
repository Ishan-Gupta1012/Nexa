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