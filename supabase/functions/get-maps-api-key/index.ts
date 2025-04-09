
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Get the API key from environment variables
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      console.error("API key not found in environment variables");
      return new Response(
        JSON.stringify({ 
          error: 'API key not found',
          message: 'The Google Maps API key is not configured in environment variables',
          timestamp: new Date().toISOString()
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
    
    console.log("API key successfully retrieved from environment");
    console.log("Request origin:", req.headers.get('origin'));
    console.log("API key length:", apiKey.length);
    
    // Return the API key in the response with proper headers
    return new Response(
      JSON.stringify({ 
        apiKey,
        message: 'API key retrieved successfully',
        timestamp: new Date().toISOString(),
        keyLength: apiKey.length
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );
  } catch (error) {
    console.error('Error retrieving API key:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'Failed to retrieve API key',
        timestamp: new Date().toISOString()
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
