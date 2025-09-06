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
    console.log("=== RESTORING MISSING UPLOADS ===");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current upload count directly from uploads table
    const { count: uploadCount, error: countError } = await supabase
      .from("uploads")
      .select("*", { count: "exact", head: true });

    if (countError) {
      return new Response(JSON.stringify({ error: "Failed to get upload count" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const actualUploadCount = uploadCount || 0;
    const existingCount = actualUploadCount; // Same as upload count in our new system
    const missingCount = 0; // No missing uploads in our new system
    
    console.log(`Current upload count: ${actualUploadCount}, Missing: ${missingCount}`);

    if (missingCount <= 0) {
      return new Response(JSON.stringify({ 
        message: "No missing uploads found",
        existing: existingCount,
        expected: uploadCount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const createdUploads = [];
    // Create the missing uploads
    for (let i = 0; i < missingCount; i++) {
      const uploadOrder = existingCount + i + 1;
      const price = 100 + (uploadOrder - 1); // Current price: 100 + upload count
      
      // Create placeholder image
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
          PixPeriment Upload #${uploadOrder}
        </text>
        <text x="400" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.9)">
          Recovered from failed webhook processing
        </text>
        <text x="400" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)">
          Recovered Upload • $${(price / 100).toFixed(2)}
        </text>
      </svg>`;
      
      const fileName = `recovered-${uploadOrder}-${Date.now()}.svg`;
      const imageBlob = new Uint8Array(atob(btoa(placeholderSvg)).split('').map(char => char.charCodeAt(0)));
      
      // Upload placeholder image
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, imageBlob, {
          contentType: "image/svg+xml",
        });

      if (uploadError) {
        console.error(`Failed to upload image for ${uploadOrder}:`, uploadError);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("uploads")
        .getPublicUrl(fileName);

      // Create upload record
      const { data: uploadRecord, error: insertError } = await supabase
        .from("uploads")
        .insert({
          user_email: "recovered@pixperiment.com",
          image_url: publicUrl,
          caption: `Upload #${uploadOrder} - Recovered from failed webhook (paid $${(price / 100).toFixed(2)})`,
          price_paid: price,
          upload_order: uploadOrder,
          stripe_session_id: `recovered-${uploadOrder}-${Date.now()}`,
          created_at: new Date(Date.now() - (missingCount - i) * 60000).toISOString(), // Stagger timestamps
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Failed to create upload record for ${uploadOrder}:`, insertError);
        continue;
      }

      createdUploads.push(uploadRecord);
      console.log(`Successfully restored upload #${uploadOrder} at $${(price / 100).toFixed(2)}`);
    }

    console.log(`Successfully restored ${createdUploads.length} uploads`);

    return new Response(JSON.stringify({ 
      success: true,
      restored: createdUploads.length,
      uploads: createdUploads.map(u => ({
        order: u.upload_order,
        price: `$${(u.price_paid / 100).toFixed(2)}`,
        caption: u.caption
      }))
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Restore error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});