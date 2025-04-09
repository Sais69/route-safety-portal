
// This file contains constants that are used throughout the application
// API keys are not stored here securely from Supabase Edge Functions

// Dummy value used only during development when API isn't available
const FALLBACK_API_KEY = '';

export let GOOGLE_MAPS_API_KEY = FALLBACK_API_KEY;

// Function to fetch the Google Maps API key from Supabase Edge Function
export async function initializeApiKeys() {
  try {
    // Get the Supabase anon key from environment variables
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseAnonKey) {
      console.warn('Supabase anon key not available. Using fallback API key.');
      return false;
    }
    
    // Fetch API key with proper authentication
    const response = await fetch('https://tuyxymqapxiinsijucww.supabase.co/functions/v1/get-maps-api-key', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch API key: ${response.status}`);
    }

    const data = await response.json();
    GOOGLE_MAPS_API_KEY = data.apiKey;
    console.log('API keys initialized successfully:', data.message);
    return true;
  } catch (error) {
    console.error('Error initializing API keys:', error);
    return false;
  }
}
