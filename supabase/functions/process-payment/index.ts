import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== PROCESSING PAYMENT ===");
    
    const { session_id } = await req.json();
    
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Session ID required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if upload already exists
    const { data: existingUpload } = await supabase
      .from("uploads")
      .select("id")
      .eq("stripe_session_id", session_id)
      .single();

    if (existingUpload) {
      console.log("Upload already exists for session:", session_id);
      return new Response(JSON.stringify({ 
        message: "Upload already processed",
        upload_id: existingUpload.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get Stripe session details
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ 
        error: "Payment not completed",
        payment_status: session.payment_status
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("Payment confirmed for session:", session_id);

    // Get pending upload data
    const pendingUploadId = session.metadata?.pending_upload_id;
    
    if (!pendingUploadId) {
      return new Response(JSON.stringify({ 
        error: "No pending upload found for this session"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: pendingUpload, error: pendingError } = await supabase
      .from('pending_uploads')
      .select('*')
      .eq('id', pendingUploadId)
      .single();

    if (pendingError || !pendingUpload) {
      return new Response(JSON.stringify({ 
        error: "Pending upload not found"
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get current upload count
    const { count: uploadCount, error: countError } = await supabase
      .from('uploads')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to get upload count: ${countError.message}`);
    }

    const currentUploadCount = uploadCount || 0;
    const currentUploadOrder = currentUploadCount + 1;
    const pricePaid = parseInt(session.metadata?.price_paid || '100');

    console.log(`Creating upload: count=${currentUploadCount}, order=${currentUploadOrder}, price=${pricePaid}`);

    // Create upload record
    const { data: uploadRecord, error: insertError } = await supabase
      .from("uploads")
      .insert({
        user_email: pendingUpload.email,
        image_url: pendingUpload.image_url,
        caption: pendingUpload.caption,
        price_paid: pricePaid,
        upload_order: currentUploadOrder,
        stripe_session_id: session_id,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create upload: ${insertError.message}`);
    }

    // Clean up pending upload
    await supabase
      .from('pending_uploads')
      .delete()
      .eq('id', pendingUploadId);

    console.log("Successfully processed payment and created upload:", uploadRecord.id);

    return new Response(JSON.stringify({ 
      message: "Payment processed successfully",
      upload: uploadRecord,
      upload_id: uploadRecord.id,
      upload_order: currentUploadOrder,
      price_paid: pricePaid
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error processing payment:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to process payment",
      message: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
