import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { storeImageData } from "./temp-storage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, imageFile, caption } = await req.json();
    
    if (!email || !imageFile || !caption) {
      throw new Error("Missing required fields: email, imageFile, caption");
    }

    // Server-side validation
    if (!email.includes('@') || email.length > 254) {
      throw new Error("Invalid email format");
    }
    
    if (caption.length > 500) {
      throw new Error("Caption too long (max 500 characters)");
    }
    
    if (!imageFile.type.startsWith('image/')) {
      throw new Error("Invalid file type");
    }
    
    if (imageFile.data.length > 10 * 1024 * 1024) { // ~7MB base64 limit for 5MB file
      throw new Error("File too large");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with service role for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current price
    const { data: pricingData, error: pricingError } = await supabase
      .from("pricing")
      .select("current_price")
      .single();

    if (pricingError) {
      throw new Error(`Failed to get pricing: ${pricingError.message}`);
    }

    const currentPrice = pricingData.current_price;

    // Store image data temporarily with session reference
    const sessionRef = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    storeImageData(sessionRef, imageFile);

    // Create Stripe checkout session with minimal metadata (image stored separately)
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "PicMint Upload",
              description: `Upload picture with caption: "${caption.substring(0, 50)}${caption.length > 50 ? '...' : ''}"`,
            },
            unit_amount: currentPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        email,
        caption: caption.substring(0, 400), // Keep under 500 char limit
        image_name: imageFile.name || "image",
        image_type: imageFile.type || "image/png",
        session_ref: sessionRef,
      },
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      price: currentPrice,
      session_id: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Payment creation failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});