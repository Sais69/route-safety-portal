
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
    
    console.log('Fetching Google Maps API key from Supabase Edge Function...');
    
    // Fetch API key with proper authentication, with retry mechanism
    let response;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        response = await fetch('https://tuyxymqapxiinsijucww.supabase.co/functions/v1/get-maps-api-key', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          }
        });
        
        if (response.ok) break;
        
        console.warn(`Attempt ${retries + 1} failed with status: ${response.status}. Retrying...`);
        retries++;
        
        // Exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
      } catch (fetchError) {
        console.error(`Fetch attempt ${retries + 1} failed:`, fetchError);
        retries++;
        if (retries >= maxRetries) throw fetchError;
        
        // Exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
      }
    }

    if (!response || !response.ok) {
      console.error('Failed to fetch API key after multiple attempts');
      throw new Error(`Failed to fetch API key: ${response ? response.status : 'No response'}`);
    }

    const data = await response.json();
    
    if (!data.apiKey) {
      console.error('API key not found in response:', data);
      throw new Error('API key not found in response');
    }
    
    GOOGLE_MAPS_API_KEY = data.apiKey;
    console.log('Google Maps API key initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing API keys:', error);
    return false;
  }
}
