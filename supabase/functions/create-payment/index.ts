import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, imageFile, caption } = await req.json();
    
    if (!email || !imageFile || !caption) {
      throw new Error("Missing required fields: email, imageFile, caption");
    }

    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email) || email.length > 254) {
      throw new Error("Invalid email format");
    }
    
    // Enhanced caption validation and sanitization
    const sanitizedCaption = caption.trim().replace(/[<>]/g, '');
    if (sanitizedCaption.length > 500 || sanitizedCaption.length < 1) {
      throw new Error("Caption must be between 1 and 500 characters");
    }
    
    // Enhanced file type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed");
    }
    
    if (imageFile.data.length > 10 * 1024 * 1024) { // ~7MB base64 limit for 5MB file
      throw new Error("File too large");
    }

    // Initialize Stripe with environment variable
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    
    const stripe = new Stripe(stripeKey, {
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

    console.log("Creating payment session for:", email, "Price:", currentPrice);

    // First, upload the image to storage before creating the payment session
    // This ensures we have the full image data available after payment
    const imageDataB64 = imageFile.data.split(',')[1]; // Remove data:image/...;base64, prefix
    const imageBytes = Uint8Array.from(atob(imageDataB64), c => c.charCodeAt(0));
    
    // Create unique filename
    const fileExtension = imageFile.type.split('/')[1] || 'png';
    const tempFileName = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    
    console.log("Uploading temp image:", tempFileName, "Size:", imageBytes.length, "bytes");
    
     // Determine pricing tier based on amount
    const priceInCents = currentPrice;
    const amountInDollars = priceInCents / 100;
    const useMicropayments = amountInDollars < 12;
    
    // Calculate Stripe fees based on tier
    let stripeFeePercentage, stripeFeeFixed;
    if (useMicropayments) {
      // Micropayments: 5% + $0.05
      stripeFeePercentage = 0.05;
      stripeFeeFixed = 5; // $0.05 in cents
    } else {
      // Standard: 2.9% + $0.30
      stripeFeePercentage = 0.029;
      stripeFeeFixed = 30; // $0.30 in cents
    }
    
    // Calculate total amount including Stripe fees
    const totalAmount = Math.round(priceInCents + (priceInCents * stripeFeePercentage) + stripeFeeFixed);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(tempFileName, imageBytes, {
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error("Failed to upload temp image:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    console.log("Temp image uploaded successfully:", uploadData.path);

    // Create Stripe checkout session with the temp filename in metadata
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
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        email,
        caption: sanitizedCaption.substring(0, 400), // Keep under 500 char limit
        image_name: imageFile.name || "image",
        image_type: imageFile.type || "image/png",
        temp_file_path: tempFileName, // Store the temp file path
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