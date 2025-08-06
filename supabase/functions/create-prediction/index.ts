import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'; script-src 'none'; object-src 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
};

// Rate limiting
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 300000; // 5 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function getRealIpAddress(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  if (xRealIp) {
    return xRealIp;
  }
  
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now - limit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return false;
  }
  
  if (limit.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  limit.count++;
  return false;
}

function getWeekEnding(): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  const weekEnding = new Date(now);
  weekEnding.setDate(now.getDate() + daysUntilSunday);
  weekEnding.setHours(23, 59, 59, 999);
  return weekEnding.toISOString().split('T')[0];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = getRealIpAddress(req);
    
    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { predictedPrice } = await req.json();

    // Validate prediction
    if (!predictedPrice || typeof predictedPrice !== 'number' || 
        predictedPrice < 1 || predictedPrice > 10000) {
      return new Response(
        JSON.stringify({ error: 'Invalid prediction price (must be 1-10000)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weekEnding = getWeekEnding();

    // Check if user already predicted for this week
    const { data: existingPrediction } = await supabase
      .from('predictions')
      .select('*')
      .eq('ip_address', clientIp)
      .eq('week_ending', weekEnding)
      .single();

    if (existingPrediction) {
      // Update existing prediction
      const { data, error } = await supabase
        .from('predictions')
        .update({ predicted_price: predictedPrice })
        .eq('id', existingPrediction.id)
        .select()
        .single();

      if (error) throw error;

      // Log security event
      await supabase.rpc('log_security_event', {
        event_type: 'prediction_updated',
        table_name: 'predictions',
        record_id: data.id,
        ip_address: clientIp,
        user_agent: req.headers.get('user-agent') || null,
        additional_data: { 
          week_ending: weekEnding, 
          old_price: existingPrediction.predicted_price,
          new_price: predictedPrice 
        }
      });

      return new Response(
        JSON.stringify({ success: true, action: 'updated', prediction: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Create new prediction
      const { data, error } = await supabase
        .from('predictions')
        .insert({
          predicted_price: predictedPrice,
          week_ending: weekEnding,
          ip_address: clientIp
        })
        .select()
        .single();

      if (error) throw error;

      // Log security event
      await supabase.rpc('log_security_event', {
        event_type: 'prediction_created',
        table_name: 'predictions',
        record_id: data.id,
        ip_address: clientIp,
        user_agent: req.headers.get('user-agent') || null,
        additional_data: { week_ending: weekEnding, predicted_price: predictedPrice }
      });

      return new Response(
        JSON.stringify({ success: true, action: 'created', prediction: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error handling prediction:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});