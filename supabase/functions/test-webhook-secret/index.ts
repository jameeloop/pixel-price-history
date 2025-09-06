import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    return new Response(JSON.stringify({ 
      webhook_secret_configured: !!webhookSecret,
      webhook_secret_length: webhookSecret?.length || 0,
      webhook_secret_first_10: webhookSecret?.substring(0, 10) || "not set",
      webhook_secret_has_whitespace: webhookSecret ? webhookSecret !== webhookSecret.trim() : false,
      webhook_url: "https://oodqharaqstrbfoqjgfh.supabase.co/functions/v1/stripe-webhook"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: "Failed to check webhook secret",
      message: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
