import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== TESTING PRICING FUNCTION ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }), 
        { status: 500, headers: corsHeaders }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get upload count - single source of truth
    const { count: uploadCount, error: countError } = await supabase
      .from('uploads')
      .select('*', { count: 'exact', head: true });
    
    console.log('Upload count result:', { uploadCount, countError });
    
    // Single variable - everything based on this
    const currentUploadCount = uploadCount || 0;
    
    // Price calculations - all based on currentUploadCount
    const currentPrice = 100 + currentUploadCount; // Current upload price
    const nextPrice = currentPrice + 1; // Next upload will be 1 cent more
    
    // Test database function for comparison
    const { data: dbPrice, error: dbError } = await supabase
      .rpc('get_next_upload_price');
    
    const results = {
      uploadCount,
      currentUploadCount,
      currentPrice,
      nextPrice,
      dbFunctionPrice: dbPrice,
      calculations: {
        currentPriceFormula: `100 + ${currentUploadCount} = ${currentPrice}`,
        nextPriceFormula: `${currentPrice} + 1 = ${nextPrice}`,
        currentPriceDollars: `$${(currentPrice / 100).toFixed(2)}`,
        nextPriceDollars: `$${(nextPrice / 100).toFixed(2)}`
      },
      validation: {
        dbFunctionMatches: dbPrice === currentPrice,
        priceIsValid: currentPrice >= 100,
        noNegativeCount: currentUploadCount >= 0
      }
    };
    
    console.log('=== FINAL RESULTS ===', results);
    
    return new Response(
      JSON.stringify(results, null, 2), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Test error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
