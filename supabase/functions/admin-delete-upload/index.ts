import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyAdminSession(sessionToken: string, supabase: any): Promise<boolean> {
  if (!sessionToken) return false;

  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single();

  return !error && !!session;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { uploadId, sessionToken } = await req.json();

    // Verify admin authentication
    const isValidAdmin = await verifyAdminSession(sessionToken, supabase);
    if (!isValidAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get upload info first for image cleanup
    const { data: upload, error: fetchError } = await supabase
      .from('uploads')
      .select('image_url')
      .eq('id', uploadId)
      .single();

    if (fetchError) {
      console.error('Upload fetch error:', fetchError);
      return new Response(JSON.stringify({ error: 'Upload not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete the upload record
    const { error: deleteError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', uploadId);

    if (deleteError) {
      console.error('Upload deletion error:', deleteError);
      return new Response(JSON.stringify({ error: 'Failed to delete upload' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to delete the image file from storage (optional, may fail if file doesn't exist)
    if (upload.image_url) {
      try {
        const fileName = upload.image_url.split('/').pop();
        if (fileName && fileName !== 'placeholder.svg') {
          await supabase.storage.from('uploads').remove([fileName]);
        }
      } catch (storageError) {
        console.log('Storage cleanup warning:', storageError);
        // Don't fail the operation if storage cleanup fails
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete upload error:', error);
    return new Response(JSON.stringify({ error: 'Delete operation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});