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
    console.log("=== RECOVERING FAILED UPLOADS ===");
    
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all successful checkout sessions from the last 24 hours
    const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
    
    const sessions = await stripe.checkout.sessions.list({
      created: { gte: oneDayAgo },
      status: 'complete',
      limit: 100
    });

    console.log(`Found ${sessions.data.length} completed sessions`);

    const recoveredUploads = [];

    for (const session of sessions.data) {
      if (session.payment_status === 'paid' && session.metadata) {
        // Check if this session already has an upload record
        const { data: existingUpload } = await supabase
          .from("uploads")
          .select("id")
          .eq("stripe_session_id", session.id)
          .single();

        if (!existingUpload) {
          console.log(`Recovering session: ${session.id}`);
          
          const email = session.customer_email || session.metadata.email;
          const caption = session.metadata.caption || "Recovered upload";
          const pricePaid = session.amount_total || 100; // Default to $1.00 if amount not available

          // Create placeholder image
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
                PixPeriment Upload (Recovered)
              </text>
              <text x="400" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.9)">
                ${caption.length > 100 ? caption.substring(0, 100) + '...' : caption}
              </text>
              <text x="400" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)">
                Recovered Upload • $${(pricePaid / 100).toFixed(2)}
              </text>
            </svg>
          `;
          
          const placeholderImageData = "data:image/svg+xml;base64," + btoa(placeholderSvg);
          const fileName = `recovered-${Date.now()}-${Math.random().toString(36).substring(7)}.svg`;
          const imageBlob = new Uint8Array(atob(placeholderImageData.split(',')[1]).split('').map(char => char.charCodeAt(0)));
          
          const { error: uploadError } = await supabase.storage
            .from("uploads")
            .upload(fileName, imageBlob, {
              contentType: "image/svg+xml",
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("uploads")
              .getPublicUrl(fileName);

            // Get current upload count directly from uploads table
            const { count: uploadCount, error: countError } = await supabase
              .from("uploads")
              .select("*", { count: "exact", head: true });

            // Create upload record
            const { data: uploadRecord, error: insertError } = await supabase
              .from("uploads")
              .insert({
                user_email: email,
                image_url: publicUrl,
                caption: caption,
                price_paid: pricePaid,
                upload_order: (uploadCount || 0) + recoveredUploads.length + 1,
                stripe_session_id: session.id,
              })
              .select()
              .single();

            if (!insertError) {
              recoveredUploads.push(uploadRecord);
              console.log(`Successfully recovered upload for ${email}`);
            }
          }
        }
      }
    }

    console.log(`Recovered ${recoveredUploads.length} uploads`);

    return new Response(JSON.stringify({ 
      success: true, 
      recovered: recoveredUploads.length,
      uploads: recoveredUploads
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Recovery error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});