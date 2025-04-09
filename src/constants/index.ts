
// This file contains constants that are used throughout the application

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
    const maxRetries = 5; // Increased max retries
    
    while (retries < maxRetries) {
      try {
        console.log(`Attempt ${retries + 1} to fetch Google Maps API key`);
        
        // Use a timestamp parameter to prevent caching
        const timestamp = new Date().getTime();
        
        response = await fetch(`https://tuyxymqapxiinsijucww.supabase.co/functions/v1/get-maps-api-key?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          // Add cache control
          cache: 'no-store'
        });
        
        console.log(`API key fetch attempt ${retries + 1} status:`, response.status);
        
        if (response.ok) break;
        
        console.warn(`Attempt ${retries + 1} failed with status: ${response.status}. Retrying...`);
        retries++;
        
        // Exponential backoff with jitter to prevent thundering herd
        const baseWait = Math.min(1000 * Math.pow(2, retries), 10000);
        const jitter = Math.random() * 1000;
        await new Promise(r => setTimeout(r, baseWait + jitter));
      } catch (fetchError) {
        console.error(`Fetch attempt ${retries + 1} failed:`, fetchError);
        retries++;
        if (retries >= maxRetries) throw fetchError;
        
        // Exponential backoff with jitter
        const baseWait = Math.min(1000 * Math.pow(2, retries), 10000);
        const jitter = Math.random() * 1000;
        await new Promise(r => setTimeout(r, baseWait + jitter));
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
    console.log('API key length:', GOOGLE_MAPS_API_KEY.length);
    
    // Validate the API key isn't empty
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.trim() === '') {
      console.error('Retrieved API key is empty');
      throw new Error('Retrieved API key is empty');
    }
    
    // Validate key format (it should be a string of reasonable length)
    if (GOOGLE_MAPS_API_KEY.length < 10) {
      console.error('Retrieved API key seems invalid (too short)');
      throw new Error('Retrieved API key seems invalid (too short)');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing API keys:', error);
    return false;
  }
}
