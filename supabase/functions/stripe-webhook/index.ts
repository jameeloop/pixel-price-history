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
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No signature provided");
    }

    const body = await req.text();
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verify webhook signature
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret!);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    console.log("Webhook event type:", event.type);

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.payment_status === "paid") {
        await processSuccessfulPayment(session);
      }
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(`Webhook error: ${error.message}`, { status: 500 });
  }
});

async function processSuccessfulPayment(session: Stripe.Checkout.Session) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Get metadata from session
    const email = session.metadata?.email;
    const caption = session.metadata?.caption;
    const sessionRef = session.metadata?.session_ref;
    const imageName = session.metadata?.image_name;
    const imageType = session.metadata?.image_type;

    if (!email || !caption || !sessionRef) {
      throw new Error("Missing metadata from session");
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

    // Create a simple placeholder image for now
    // In production, you'd want to handle actual image upload differently
    const placeholderImageData = "data:image/svg+xml;base64," + btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f0f0f0"/>
        <text x="200" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#666">
          ${caption}
        </text>
      </svg>
    `);
    
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.svg`;
    const imageBlob = new Uint8Array(atob(placeholderImageData.split(',')[1]).split('').map(char => char.charCodeAt(0)));

    console.log("Creating placeholder image:", fileName);

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, imageBlob, {
        contentType: "image/svg+xml",
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