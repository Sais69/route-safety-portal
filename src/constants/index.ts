
// This file contains constants that are used throughout the application
// API keys are not stored here directly but retrieved securely from Supabase Edge Functions

// Dummy value used only during development when API isn't available
const FALLBACK_API_KEY = '';

export let GOOGLE_MAPS_API_KEY = FALLBACK_API_KEY;

// Function to fetch the Google Maps API key from Supabase Edge Function
export async function initializeApiKeys() {
  try {
    const response = await fetch('https://tuyxymqapxiinsijucww.supabase.co/functions/v1/get-maps-api-key', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch API key: ${response.status}`);
    }

    const data = await response.json();
    GOOGLE_MAPS_API_KEY = data.apiKey;
    console.log('API keys initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing API keys:', error);
    return false;
  }
}
