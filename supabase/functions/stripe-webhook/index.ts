import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

// In-memory temp storage for webhook processing
const tempImageStorage = new Map<string, { imageUrl: string; caption: string; email: string; price: number }>();

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
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();
    let event;
    try {
      if (!endpointSecret) {
        throw new Error("Webhook secret not configured");
      }
      
      console.log("Webhook secret length:", endpointSecret.length);
      console.log("Webhook secret (first 10 chars):", endpointSecret.substring(0, 10));
      console.log("Signature (first 20 chars):", signature?.substring(0, 20));
      console.log("Body length:", body.length);
      
      // Use async webhook verification to avoid SubtleCryptoProvider issues
      event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
      console.log("Webhook signature verified successfully");
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      console.error("Error details:", err.message);
      return new Response(JSON.stringify({ 
        error: "Webhook signature verification failed",
        details: err.message,
        debug: {
          secretLength: endpointSecret?.length || 0,
          signatureLength: signature?.length || 0,
          bodyLength: body.length
        }
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
  console.log("Session metadata:", session.metadata);
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get pending upload data using the ID from metadata
    const pendingUploadId = session.metadata?.pending_upload_id;
    
    if (!pendingUploadId) {
      throw new Error("No pending upload ID found in session metadata");
    }

    console.log("Retrieving pending upload:", pendingUploadId);
    const { data: pendingUpload, error: pendingError } = await supabase
      .from('pending_uploads')
      .select('*')
      .eq('id', pendingUploadId)
      .single();

    if (pendingError || !pendingUpload) {
      console.error("Failed to retrieve pending upload:", pendingError);
      throw new Error("Pending upload not found");
    }

    console.log("Retrieved pending upload:", pendingUpload);

    // Extract data from pending upload
    const email = pendingUpload.email || session.customer_email;
    const caption = pendingUpload.caption || "Default upload";
    const imageStorageUrl = pendingUpload.image_url;

    console.log("Extracted - email:", email, "caption:", caption);
    console.log("Image storage URL:", imageStorageUrl);

    if (!email) {
      console.log("No email found in session");
      throw new Error("No email found in session");
    }

    console.log("Processing payment for session:", session.id);

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

    // Get upload count - single source of truth
    const { count: uploadCount, error: countError } = await supabase
      .from('uploads')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting upload count:', countError);
      throw new Error(`Failed to get upload count: ${countError.message}`);
    }

    // Single variable - everything based on this
    const currentUploadCount = uploadCount || 0;
    const currentUploadOrder = currentUploadCount + 1;
    
    // Get the price paid from session metadata (should match our calculation)
    const pricePaid = parseInt(session.metadata?.price_paid || '100');
    
    console.log('=== SIMPLIFIED WEBHOOK PRICING ===');
    console.log('uploadCount from DB:', uploadCount);
    console.log('currentUploadCount:', currentUploadCount);
    console.log('currentUploadOrder:', currentUploadOrder);
    console.log('pricePaid from metadata:', pricePaid);
    
    // Use the actual image URL from storage
    const finalImageUrl = imageStorageUrl;
    if (!finalImageUrl) {
      throw new Error("No image URL found in pending upload - cannot create upload record");
    }

    // Save upload record using the price paid from Stripe
    console.log('💰 SAVING UPLOAD WITH PRICE:', pricePaid);
    
    const { data: uploadRecord, error: insertError } = await supabase
      .from("uploads")
      .insert({
        user_email: email,
        image_url: finalImageUrl,
        caption: caption,
        price_paid: pricePaid, // Use the ACTUAL price paid from Stripe, not recalculated
        upload_order: currentUploadOrder,
        stripe_session_id: session.id,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save upload: ${insertError.message}`);
    }

    // Clean up the pending upload record
    await supabase
      .from('pending_uploads')
      .delete()
      .eq('id', pendingUploadId);
    
    console.log("Pending upload cleaned up");

    // Send confirmation email with ACTUAL price paid
    await sendConfirmationEmail(email, uploadRecord, pricePaid);

    console.log("Successfully processed payment for:", email);
  } catch (error) {
    console.error("Error processing payment:", error);
    throw error;
  }
}

async function sendConfirmationEmail(email: string, uploadRecord: { id: string; image_url: string; caption: string; upload_order: number; created_at: string }, pricePaid: number) {
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

async function createPlaceholderImage(caption: string, pricePaid: number, supabase: ReturnType<typeof createClient>): Promise<string> {
  // Create a placeholder SVG image with safe character handling
  const safeCaption = caption.replace(/[<>&"']/g, '').substring(0, 100);
  
  const placeholderSvg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
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
        ${safeCaption}
      </text>
      <text x="400" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)">
        PixPeriment Upload • ${(pricePaid / 100).toFixed(2)}p
      </text>
    </svg>`;
  
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.svg`;
  // Use TextEncoder for proper UTF-8 encoding
  const encoder = new TextEncoder();
  const imageBlob = encoder.encode(placeholderSvg);
  
  const { error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(fileName, imageBlob, {
      contentType: "image/svg+xml",
    });

  if (uploadError) {
    throw new Error(`Failed to upload placeholder: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from("uploads")
    .getPublicUrl(fileName);

  return publicUrl;
}