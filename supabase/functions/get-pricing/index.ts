import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== GETTING PRICING ===");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get upload count using service role (bypasses RLS)
    const { count: uploadCount, error } = await supabase
      .from('uploads')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting upload count:', error);
      return new Response(JSON.stringify({ 
        error: "Failed to get upload count",
        message: error.message 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const currentUploadCount = uploadCount || 0;
    const nextPrice = 100 + currentUploadCount;

    console.log('Pricing result:', {
      uploadCount: currentUploadCount,
      nextPrice: nextPrice,
      nextPriceDollars: (nextPrice / 100).toFixed(2)
    });

    return new Response(JSON.stringify({ 
      uploadCount: currentUploadCount,
      nextPrice: nextPrice,
      nextPriceDollars: (nextPrice / 100).toFixed(2)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error getting pricing:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to get pricing",
      message: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
