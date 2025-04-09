
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Clave API estática como respaldo
const STATIC_API_KEY = 'AIzaSyDPQDyeNZRmcqO9t9FodKEZgN-_s1s5Hvg';

serve(async (req) => {
  console.log("Edge function - get-maps-api-key invoked");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ahora usamos directamente la clave API estática para evitar problemas
    console.log("Returning static API key");
    
    return new Response(
      JSON.stringify({ 
        apiKey: STATIC_API_KEY,
        message: 'API key returned successfully',
        timestamp: new Date().toISOString(),
        keyLength: STATIC_API_KEY.length,
        status: 'success',
        source: 'static'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        } 
      }
    );
  } catch (error) {
    console.error('Error retrieving API key:', error.message);
    
    // Si hay un error, devolver la clave estática como respaldo
    return new Response(
      JSON.stringify({ 
        apiKey: STATIC_API_KEY,
        message: 'Falling back to static API key',
        timestamp: new Date().toISOString(),
        status: 'success',
        source: 'static_fallback'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
