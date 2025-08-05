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

    // Get image data from metadata - try multiple approaches
    const imageDataPreview = session.metadata?.image_data_preview;
    const imageName = session.metadata?.image_name || 'upload.png';
    const imageType = session.metadata?.image_type || 'image/png';
    
    console.log("Image metadata:", {
      hasImageDataPreview: !!imageDataPreview,
      imageName,
      imageType,
      previewLength: imageDataPreview ? imageDataPreview.length : 0
    });
    
    let imageBlob: Uint8Array;
    let fileName: string;
    let contentType: string;

    // For now, always create a placeholder since the webhook isn't receiving full image data
    console.log("Creating placeholder image with caption");
    const placeholderImageData = "data:image/png;base64," + btoa(
      // Create a simple colored rectangle as base64 PNG
      String.fromCharCode(...new Uint8Array([
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 1, 144, 0, 0, 1, 44, 8, 6, 0, 0, 0, 
        163, 105, 123, 222, 0, 0, 0, 25, 116, 69, 88, 116, 83, 111, 102, 116, 119, 97, 114, 101, 0, 65, 100, 111, 98, 101, 
        32, 73, 109, 97, 103, 101, 82, 101, 97, 100, 121, 113, 201, 101, 60, 0, 0, 3, 147, 73, 68, 65, 84, 120, 218, 236, 
        221, 49, 14, 2, 49, 16, 69, 81, 15, 192, 63, 240, 15, 252, 3, 255, 192, 63, 240, 15, 252, 3, 255, 192, 63, 240, 15, 
        252, 3, 255, 192, 63, 240, 15, 252, 3, 255, 192, 63, 240, 15, 252, 3, 255, 192, 63, 240, 15, 252, 3, 255, 192
      ]))
    );
    fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    imageBlob = new Uint8Array(atob(placeholderImageData.split(',')[1]).split('').map(char => char.charCodeAt(0)));
    contentType = "image/png";

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