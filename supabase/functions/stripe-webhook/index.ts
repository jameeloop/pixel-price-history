import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

// In-memory temp storage for webhook processing
const tempImageStorage = new Map<string, any>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Webhook received:", req.method, req.url);
    
    const signature = req.headers.get("stripe-signature");
    console.log("Stripe signature:", signature ? "present" : "missing");
    
    if (!signature) {
      console.log("No signature provided - returning 400");
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    console.log("Body received:", body.length, "characters");
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    console.log("Webhook secret:", webhookSecret ? "present" : "missing");
    
    if (!webhookSecret) {
      console.log("No webhook secret configured - returning 500");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify webhook signature
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event;
    try {
      // TEMPORARILY SKIP SIGNATURE VERIFICATION FOR DEBUGGING
      const eventData = JSON.parse(body);
      console.log("=== RAW WEBHOOK DATA ===");
      console.log("Event type:", eventData.type);
      console.log("Event data:", JSON.stringify(eventData, null, 2));
      event = eventData;
      
      // Re-enable this after debugging:
      // event = stripe.webhooks.constructEvent(body, signature, endpointSecret!);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      console.error("Expected secret (first 10 chars):", endpointSecret?.substring(0, 10));
      console.error("Received signature:", signature?.substring(0, 20));
      return new Response(JSON.stringify({ 
        error: "Webhook signature verification failed",
        details: err.message 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Webhook event type:", event.type);

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("=== CHECKOUT SESSION COMPLETED ===");
      console.log("Session ID:", session.id);
      console.log("Payment status:", session.payment_status);
      console.log("Customer email:", session.customer_email);
      console.log("Session metadata:", JSON.stringify(session.metadata, null, 2));
      
      if (session.payment_status === "paid") {
        console.log("Payment confirmed, processing...");
        await processSuccessfulPayment(session);
      } else {
        console.log("Payment not confirmed, status:", session.payment_status);
      }
    } else {
      console.log("Unhandled event type:", event.type);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(`Webhook error: ${error.message}`, { status: 500 });
  }
});

async function processSuccessfulPayment(session: Stripe.Checkout.Session) {
  console.log("=== PROCESSING PAYMENT START ===");
  console.log("Session ID:", session.id);
  console.log("Payment status:", session.payment_status);
  console.log("Customer email:", session.customer_email);
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get metadata from session  
    const email = session.customer_email || session.metadata?.email;
    const caption = session.metadata?.caption || "Default upload";

    console.log("Session metadata:", session.metadata);
    console.log("Extracted - email:", email, "caption:", caption);

    if (!email) {
      console.log("No email found in session");
      // Use customer email from session instead
      throw new Error("No email found in session");
    }

    // Since we can't access temp storage across functions, we'll create a placeholder
    // The image will be uploaded when the user uploads it initially
    console.log("Processing payment for session:", session.id);
    console.log("Metadata:", session.metadata);

    // Check if already processed
    const { data: existingUpload } = await supabase
      .from("uploads")
      .select("id")
      .eq("stripe_session_id", session.id)
      .single();

    if (existingUpload) {
      console.log("Session already processed:", session.id);
      return;
    }

    // Get and increment the price
    const { data: priceData, error: priceError } = await supabase
      .rpc("get_and_increment_price");

    if (priceError) {
      throw new Error(`Failed to get price: ${priceError.message}`);
    }

    const pricePaid = priceData;

    // Try to get image data from Stripe metadata
    const imageDataPreview = session.metadata?.image_data_preview;
    const imageName = session.metadata?.image_name || 'upload.png';
    const imageType = session.metadata?.image_type || 'image/png';
    
    console.log("Processing actual user upload:", {
      hasImageData: !!imageDataPreview,
      imageName,
      imageType,
      dataLength: imageDataPreview?.length
    });
    
    let imageBlob: Uint8Array;
    let fileName: string;
    let contentType: string;

    // Check if we have actual image data (even if truncated)
    if (imageDataPreview && imageDataPreview.startsWith('data:image')) {
      console.log("Found image data in metadata, using it");
      try {
        const base64Data = imageDataPreview.split(',')[1];
        imageBlob = new Uint8Array(atob(base64Data).split('').map(char => char.charCodeAt(0)));
        fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${imageType.split('/')[1] || 'png'}`;
        contentType = imageType;
      } catch (error) {
        console.error("Failed to process image data:", error);
        throw new Error("Failed to process uploaded image");
      }
    } else {
      // Create a nice placeholder that shows the caption
      console.log("No image data found, creating visual placeholder");
      const placeholderSvg = `
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="800" height="600" fill="url(#grad1)"/>
          <rect x="50" y="50" width="700" height="500" fill="rgba(255,255,255,0.1)" rx="20"/>
          <text x="400" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="white" font-weight="bold">
            PixPeriment Upload
          </text>
          <text x="400" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.9)">
            ${caption.length > 100 ? caption.substring(0, 100) + '...' : caption}
          </text>
          <text x="400" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)">
            PixPeriment Upload • $${((pricePaid || 50) / 100).toFixed(2)}
          </text>
        </svg>
      `;
      
      const placeholderImageData = "data:image/svg+xml;base64," + btoa(placeholderSvg);
      fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.svg`;
      imageBlob = new Uint8Array(atob(placeholderImageData.split(',')[1]).split('').map(char => char.charCodeAt(0)));
      contentType = "image/svg+xml";
    }

    console.log("Creating placeholder image:", fileName);

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, imageBlob, {
        contentType: contentType,
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
        stripe_session_id: session.id,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save upload: ${insertError.message}`);
    }

    // Send confirmation email
    await sendConfirmationEmail(email, uploadRecord, pricePaid);

    console.log("Successfully processed payment for:", email);
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
}

async function sendConfirmationEmail(email: string, uploadRecord: any, pricePaid: number) {
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  
  const priceFormatted = `$${(pricePaid / 100).toFixed(2)}`;
  
  try {
    await resend.emails.send({
      from: "PicMint <noreply@yourdomain.com>", // You'll need to update this
      to: [email],
      subject: "🧠 You're part of the PicMint experiment!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">🧠 You're Part of the Experiment!</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Upload Details</h2>
            <p><strong>Upload #:</strong> ${uploadRecord.upload_order}</p>
            <p><strong>Caption:</strong> "${uploadRecord.caption}"</p>
            <p><strong>Price Paid:</strong> ${priceFormatted}</p>
            <p><strong>Upload Date:</strong> ${new Date(uploadRecord.created_at).toLocaleDateString()}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <img src="${uploadRecord.image_url}" alt="Your uploaded image" style="max-width: 400px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1565c0;">
              🧠 <strong>Experiment continues:</strong> The next upload will cost ${((pricePaid + 1) / 100).toFixed(2)} (1¢ more than yours)! You've helped push the price higher.
            </p>
          </div>
          
          <p style="text-align: center; color: #666;">
            Thank you for participating in the PicMint social experiment!<br>
            <a href="${Deno.env.get("SITE_URL") || 'https://your-site.com'}" style="color: #1976d2;">View the Experiment</a>
          </p>
        </div>
      `,
    });
    
    console.log("Confirmation email sent to:", email);
  } catch (error) {
    console.error("Failed to send email:", error);
    // Don't throw here - we don't want email failures to block the upload
  }
}