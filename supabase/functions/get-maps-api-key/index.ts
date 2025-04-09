
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

serve(async (req) => {
  console.log("Edge function - get-maps-api-key invoked");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the Supabase URL and anon key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are not set');
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Intentar obtener la API key de la base de datos
    // Usar una consulta sin tipado fuerte
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', 'GOOGLE_MAPS_API_KEY')
      .single();
    
    if (error) {
      console.error("Error fetching API key from database:", error);
      
      // Intentamos obtener la API key del entorno como fallback
      const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
      
      if (!apiKey) {
        console.error("API key not found in environment variables");
        return new Response(
          JSON.stringify({ 
            error: 'API key not found',
            message: 'The Google Maps API key is not configured',
            timestamp: new Date().toISOString(),
            status: 'error'
          }),
          { 
            status: 500, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      console.log("Using API key from environment variables (fallback)");
      
      // Return the API key from environment variables
      return new Response(
        JSON.stringify({ 
          apiKey,
          message: 'API key retrieved from environment variables',
          timestamp: new Date().toISOString(),
          keyLength: apiKey.length,
          status: 'success',
          source: 'environment'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
          } 
        }
      );
    }
    
    if (!data || !data.value) {
      console.error("API key not found in database");
      return new Response(
        JSON.stringify({ 
          error: 'API key not found in database',
          message: 'The Google Maps API key is not configured in the database',
          timestamp: new Date().toISOString(),
          status: 'error'
        }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    const apiKey = data.value;
    
    // Basic validation of API key format
    if (apiKey.length < 20) {
      console.error("API key format appears invalid (too short)");
      return new Response(
        JSON.stringify({ 
          error: 'Invalid API key format',
          message: 'The Google Maps API key appears to be invalid (too short)',
          timestamp: new Date().toISOString(),
          status: 'error'
        }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    console.log("API key successfully retrieved from database");
    console.log("Request origin:", req.headers.get('origin'));
    console.log("API key length:", apiKey.length);
    
    // Return the API key in the response with proper headers
    return new Response(
      JSON.stringify({ 
        apiKey,
        message: 'API key retrieved successfully from database',
        timestamp: new Date().toISOString(),
        keyLength: apiKey.length,
        status: 'success',
        source: 'database'
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
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to retrieve API key',
        timestamp: new Date().toISOString(),
        status: 'error'
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
