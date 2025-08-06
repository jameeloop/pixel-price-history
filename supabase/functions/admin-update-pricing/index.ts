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
    const { newPrice, sessionToken } = await req.json();

    // Verify admin authentication
    const isValidAdmin = await verifyAdminSession(sessionToken, supabase);
    if (!isValidAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate price
    if (!newPrice || newPrice < 1 || newPrice > 10000) {
      return new Response(JSON.stringify({ error: 'Invalid price. Must be between 1 and 10000.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update pricing
    const { error: updateError } = await supabase
      .from('pricing')
      .update({ 
        current_price: newPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', (await supabase.from('pricing').select('id').single()).data?.id);

    if (updateError) {
      console.error('Pricing update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update pricing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update pricing error:', error);
    return new Response(JSON.stringify({ error: 'Update operation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});