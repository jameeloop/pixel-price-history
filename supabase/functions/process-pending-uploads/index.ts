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
    console.log("=== PROCESSING PENDING UPLOADS ===");
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all pending uploads
    const { data: pendingUploads, error: pendingError } = await supabase
      .from('pending_uploads')
      .select('*')
      .order('created_at', { ascending: true });

    if (pendingError) {
      throw new Error(`Failed to get pending uploads: ${pendingError.message}`);
    }

    console.log(`Found ${pendingUploads?.length || 0} pending uploads`);

    if (!pendingUploads || pendingUploads.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No pending uploads found",
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const processedUploads = [];

    for (const pendingUpload of pendingUploads) {
      try {
        console.log(`Processing upload: ${pendingUpload.id}`);
        
        // Get current upload count
        const { count: uploadCount, error: countError } = await supabase
          .from('uploads')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          console.error('Error getting upload count:', countError);
          continue;
        }

        const currentUploadCount = uploadCount || 0;
        const currentUploadOrder = currentUploadCount + 1;
        
        // Calculate price (100 + upload count)
        const pricePaid = 100 + currentUploadCount;
        
        console.log(`Upload ${pendingUpload.id}: count=${currentUploadCount}, order=${currentUploadOrder}, price=${pricePaid}`);

        // Create upload record
        const { data: uploadRecord, error: insertError } = await supabase
          .from("uploads")
          .insert({
            user_email: pendingUpload.email,
            image_url: pendingUpload.image_url,
            caption: pendingUpload.caption,
            price_paid: pricePaid,
            upload_order: currentUploadOrder,
            stripe_session_id: `manual-${pendingUpload.id}`, // Mark as manually processed
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Failed to create upload for ${pendingUpload.id}:`, insertError);
          continue;
        }

        // Delete pending upload
        await supabase
          .from('pending_uploads')
          .delete()
          .eq('id', pendingUpload.id);

        processedUploads.push({
          id: uploadRecord.id,
          email: pendingUpload.email,
          price_paid: pricePaid,
          upload_order: currentUploadOrder
        });

        console.log(`Successfully processed upload: ${uploadRecord.id}`);
      } catch (error) {
        console.error(`Error processing upload ${pendingUpload.id}:`, error);
      }
    }

    return new Response(JSON.stringify({ 
      message: `Processed ${processedUploads.length} uploads`,
      processed: processedUploads.length,
      uploads: processedUploads
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error processing pending uploads:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to process pending uploads",
      message: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
