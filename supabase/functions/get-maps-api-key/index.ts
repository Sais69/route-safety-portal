
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Edge function - get-maps-api-key invoked");
    
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
    
    // Return the API key in the response with proper headers
    return new Response(
      JSON.stringify({ 
        apiKey,
        message: 'API key retrieved successfully',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
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
