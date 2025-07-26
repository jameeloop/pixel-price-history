import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { session_id } = await req.json();
    
    if (!session_id) {
      throw new Error("Missing session_id");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Get metadata from session
    const email = session.metadata?.email;
    const caption = session.metadata?.caption;
    const imageFileData = session.metadata?.imageFile;

    if (!email || !caption || !imageFileData) {
      throw new Error("Missing metadata from session");
    }

    const imageFile = JSON.parse(imageFileData);

    // Get and increment the price (this also increments the upload count)
    const { data: priceData, error: priceError } = await supabase
      .rpc("get_and_increment_price");

    if (priceError) {
      throw new Error(`Failed to get price: ${priceError.message}`);
    }

    const pricePaid = priceData;

    // Upload image to Supabase storage
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Convert base64 to blob
    const base64Data = imageFile.data.split(',')[1];
    const imageBlob = new Uint8Array(atob(base64Data).split('').map(char => char.charCodeAt(0)));

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, imageBlob, {
        contentType: imageFile.type,
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("uploads")
      .getPublicUrl(fileName);

    // Get current upload count for ordering
    const { data: uploadCountData } = await supabase
      .from("pricing")
      .select("upload_count")
      .single();

    // Save upload record
    const { data: uploadRecord, error: insertError } = await supabase
      .from("uploads")
      .insert({
        user_email: email,
        image_url: publicUrl,
        caption: caption,
        price_paid: pricePaid,
        upload_order: uploadCountData?.upload_count || 1,
        stripe_session_id: session_id,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save upload: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      upload: uploadRecord 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Upload confirmation error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Upload confirmation failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});