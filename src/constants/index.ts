
// This file contains constants that are used throughout the application
import { supabase } from '@/integrations/supabase/client';

// Clave API de Google Maps proporcionada
export let GOOGLE_MAPS_API_KEY = 'AIzaSyDPQDyeNZRmcqO9t9FodKEZgN-_s1s5Hvg';

// Function to fetch the Google Maps API key from database
export async function initializeApiKeys() {
  try {
    console.log('Using provided Google Maps API key');
    
    // Store the API key in the database for future reference
    try {
      await storeGoogleMapsApiKey(GOOGLE_MAPS_API_KEY);
    } catch (err) {
      console.warn('Error storing API key in database:', err);
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
    
    // Usando una consulta genérica sin tipado fuerte
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'GOOGLE_MAPS_API_KEY',
          value: apiKey,
          description: 'Google Maps API Key para la aplicación'
        } as any, { onConflict: 'key' });
      
      if (error) {
        console.error('Error storing API key in database:', error);
        return false;
      }
    } catch (err) {
      console.error('Error with upsert operation:', err);
      return false;
    }
    
    console.log('API key successfully stored in database');
    return true;
  } catch (error) {
    console.error('Error storing API key:', error);
    return false;
  }
}
