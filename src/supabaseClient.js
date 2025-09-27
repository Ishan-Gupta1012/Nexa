import { createClient } from '@supabase/supabase-js'

// TODO: Replace with your project's URL and anon key
const supabaseUrl = 'https://jghydbzyidsctmzgsstu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnaHlkYnp5aWRzY3Rtemdzc3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTkxOTAsImV4cCI6MjA3MjYzNTE5MH0.jhkKnksZYZIogLNyhoE5iOT2AMpuPxn3KK7B1CmEMf8'

const customMemoryStorage = {
  getItem(key) {
    return sessionStorage.getItem(key);
  },
  setItem(key, value) {
    sessionStorage.setItem(key, value);
  },
  removeItem(key) {
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // FIX: Explicitly set storage and flowType to aggressively prevent storage-based reloads
        // We are using sessionStorage + a custom wrapper to avoid localStorage events
        storage: customMemoryStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // Recommended flow type for single-page apps
    },
});