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
    console.log("=== CLEANING UP EXPIRED PENDING UPLOADS ===");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Delete all pending uploads (since they were created without payment verification)
    const { data, error } = await supabase
      .from('pending_uploads')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This will match all records

    if (error) {
      throw new Error(`Failed to clean up pending uploads: ${error.message}`);
    }

    console.log("Cleaned up pending uploads");

    return new Response(JSON.stringify({ 
      message: "Pending uploads cleaned up successfully",
      deleted_count: data?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error cleaning up pending uploads:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to clean up pending uploads",
      message: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
