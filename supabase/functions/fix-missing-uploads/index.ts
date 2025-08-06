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
    console.log("=== MANUAL UPLOAD CREATION ===");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current pricing to see how many uploads are missing
    const { data: pricingData } = await supabase
      .from("pricing")
      .select("upload_count, current_price")
      .single();

    const { data: existingUploads } = await supabase
      .from("uploads")
      .select("id")
      .order("created_at", { ascending: false });

    const missingUploads = (pricingData?.upload_count || 0) - (existingUploads?.length || 0);
    
    console.log(`Pricing shows ${pricingData?.upload_count} uploads, but only ${existingUploads?.length} exist. Missing: ${missingUploads}`);

    const createdUploads = [];

    // Create missing uploads
    for (let i = 0; i < missingUploads; i++) {
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
            PixPeriment Upload #${(existingUploads?.length || 0) + i + 1}
          </text>
          <text x="400" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.9)">
            Missing upload recovered from payment
          </text>
          <text x="400" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)">
            Recovered Upload • $${((51 + i) / 100).toFixed(2)}
          </text>
        </svg>
      `;
      
      const fileName = `missing-upload-${Date.now()}-${i}.svg`;
      const imageBlob = new Uint8Array(atob(btoa(placeholderSvg)).split('').map(char => char.charCodeAt(0)));
      
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, imageBlob, {
          contentType: "image/svg+xml",
        });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from("uploads")
          .getPublicUrl(fileName);

        const { data: uploadRecord, error: insertError } = await supabase
          .from("uploads")
          .insert({
            user_email: "anonymous@pixperiment.com",
            image_url: publicUrl,
            caption: `Missing upload #${(existingUploads?.length || 0) + i + 1} - recovered from failed webhook`,
            price_paid: 51 + i, // Estimated price based on sequence
            upload_order: (existingUploads?.length || 0) + i + 1,
            stripe_session_id: `recovered-${Date.now()}-${i}`,
          })
          .select()
          .single();

        if (!insertError) {
          createdUploads.push(uploadRecord);
          console.log(`Created missing upload #${(existingUploads?.length || 0) + i + 1}`);
        } else {
          console.error(`Failed to create upload ${i}:`, insertError);
        }
      } else {
        console.error(`Failed to upload image ${i}:`, uploadError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      missing: missingUploads,
      created: createdUploads.length,
      uploads: createdUploads
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Manual creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});