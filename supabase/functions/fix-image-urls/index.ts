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
    console.log("=== FIXING IMAGE URLS ===");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all uploads with SVG image URLs
    const { data: brokenUploads, error: fetchError } = await supabase
      .from('uploads')
      .select('id, image_url, created_at, stripe_session_id')
      .like('image_url', '%.svg')
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch broken uploads: ${fetchError.message}`);
    }

    console.log(`Found ${brokenUploads?.length || 0} uploads with SVG URLs`);

    if (!brokenUploads || brokenUploads.length === 0) {
      return new Response(JSON.stringify({ message: "No broken uploads found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // List all files in storage
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('uploads')
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (storageError) {
      throw new Error(`Failed to list storage files: ${storageError.message}`);
    }

    console.log(`Found ${storageFiles?.length || 0} files in storage`);

    let fixedCount = 0;
    const results = [];

    for (const upload of brokenUploads) {
      console.log(`Processing upload ${upload.id}...`);
      
      // Extract timestamp from broken SVG URL
      const svgName = upload.image_url.split('/').pop();
      const timestamp = svgName?.split('-')[0];
      
      if (!timestamp) {
        console.log(`Could not extract timestamp from ${svgName}`);
        continue;
      }

      // Find real image files with similar timestamp (within 5 minutes)
      const targetTime = parseInt(timestamp);
      const realImage = storageFiles?.find(file => {
        if (file.name.endsWith('.svg')) return false;
        
        const fileTimestamp = file.name.split('-')[0];
        const fileTime = parseInt(fileTimestamp);
        
        // Check if within 5 minutes (300,000 ms)
        return Math.abs(fileTime - targetTime) < 300000;
      });

      if (realImage) {
        console.log(`Found matching real image: ${realImage.name}`);
        
        // Get public URL for the real image
        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(realImage.name);

        // Update the database record
        const { error: updateError } = await supabase
          .from('uploads')
          .update({ image_url: urlData.publicUrl })
          .eq('id', upload.id);

        if (updateError) {
          console.error(`Failed to update upload ${upload.id}:`, updateError);
          results.push({
            uploadId: upload.id,
            status: 'error',
            error: updateError.message
          });
        } else {
          console.log(`Successfully updated upload ${upload.id}`);
          fixedCount++;
          results.push({
            uploadId: upload.id,
            status: 'fixed',
            oldUrl: upload.image_url,
            newUrl: urlData.publicUrl
          });
        }
      } else {
        console.log(`No matching real image found for ${upload.id}`);
        results.push({
          uploadId: upload.id,
          status: 'no_match',
          svgUrl: upload.image_url
        });
      }
    }

    console.log(`Fixed ${fixedCount} out of ${brokenUploads.length} uploads`);

    return new Response(JSON.stringify({
      message: `Fixed ${fixedCount} out of ${brokenUploads.length} uploads`,
      fixedCount,
      totalBroken: brokenUploads.length,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error fixing image URLs:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});