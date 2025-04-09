
// This file contains constants that are used throughout the application
import { supabase } from '@/integrations/supabase/client';

// Dummy value used only during development when API isn't available
const FALLBACK_API_KEY = '';

export let GOOGLE_MAPS_API_KEY = FALLBACK_API_KEY;

// Function to fetch the Google Maps API key from database
export async function initializeApiKeys() {
  try {
    console.log('Attempting to get Google Maps API key...');
    
    // First try to get the API key from the app_settings table
    try {
      // Use generic query to avoid typing issues with the newly created table
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'GOOGLE_MAPS_API_KEY')
        .single();
      
      if (!error && data) {
        console.log('Successfully retrieved API key from database');
        GOOGLE_MAPS_API_KEY = data.value;
        return true;
      }
      
      console.log('API key not found in database, falling back to Edge Function');
    } catch (err) {
      console.warn('Error fetching API key from database:', err);
      console.log('Falling back to Edge Function');
    }
    
    // If we couldn't get the key from the database, use the Edge Function
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
    let success = false;
    const maxRetries = 5; // Increased max retries
    
    while (retries < maxRetries && !success) {
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
        
        if (response.ok) {
          success = true;
          break;
        }
        
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
    console.log('API key source:', data.source || 'unknown');
    
    // Validate the API key isn't empty
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.trim() === '') {
      console.error('Retrieved API key is empty');
      throw new Error('Retrieved API key is empty');
    }
    
    // Validate key format (it should be a string of reasonable length)
    if (GOOGLE_MAPS_API_KEY.length < 20) {
      console.error('Retrieved API key seems invalid (too short)');
      throw new Error('Retrieved API key seems invalid (too short)');
    }
    
    // Try to load a test Google Maps resource to verify the key
    try {
      const testResponse = await fetch(`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`, {
        method: 'HEAD',
        mode: 'no-cors' // This prevents CORS issues for this test
      });
      console.log('Google Maps API test request completed');
    } catch (error) {
      // Even if this fails, we don't throw an error as the no-cors mode means
      // we can't actually check the status properly
      console.log('Google Maps API test request completed (with possible error)');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing API keys:', error);
    return false;
  }
}

// Función para insertar o actualizar la API key en la base de datos
export async function storeGoogleMapsApiKey(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.length < 20) {
      console.error('API key invalid or too short');
      return false;
    }
    
    // Evitar el uso del RPC que está causando problemas de tipos
    // y usar directamente una consulta genérica para el upsert
    const { error } = await supabase.rpc(
      'upsert_app_setting', 
      { 
        p_key: 'GOOGLE_MAPS_API_KEY',
        p_value: apiKey,
        p_description: 'Google Maps API Key para la aplicación'
      } as any
    );
    
    if (error) {
      // Si la función RPC falla, intentar con una consulta directa
      // usando una consulta genérica sin tipado fuerte
      const { error: insertError } = await supabase
        .from('app_settings')
        .upsert({
          key: 'GOOGLE_MAPS_API_KEY',
          value: apiKey,
          description: 'Google Maps API Key para la aplicación'
        } as any, { onConflict: 'key' });
      
      if (insertError) {
        console.error('Error storing API key in database:', insertError);
        return false;
      }
    }
    
    console.log('API key successfully stored in database');
    GOOGLE_MAPS_API_KEY = apiKey;
    return true;
  } catch (error) {
    console.error('Error storing API key:', error);
    return false;
  }
}
