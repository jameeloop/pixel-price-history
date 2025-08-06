
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DatabaseRateLimiter } from '../shared/rate-limiter.ts';
import { InputValidator } from '../shared/input-validator.ts';
import { getSecurityHeaders } from '../shared/security-headers.ts';

const corsHeaders = getSecurityHeaders();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Enhanced IP detection
    const getClientIP = (req: Request): string => {
      const cfConnectingIP = req.headers.get('cf-connecting-ip');
      const xForwardedFor = req.headers.get('x-forwarded-for');
      const xRealIP = req.headers.get('x-real-ip');
      
      if (cfConnectingIP && InputValidator.validateIpAddress(cfConnectingIP)) {
        return cfConnectingIP;
      }
      
      if (xForwardedFor) {
        const firstIP = xForwardedFor.split(',')[0].trim();
        if (InputValidator.validateIpAddress(firstIP)) {
          return firstIP;
        }
      }
      
      if (xRealIP && InputValidator.validateIpAddress(xRealIP)) {
        return xRealIP;
      }
      
      return '127.0.0.1';
    };

    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Validate user agent
    if (!InputValidator.validateUserAgent(userAgent)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Rate limiting
    const rateLimiter = new DatabaseRateLimiter(supabaseUrl, supabaseKey);
    const rateCheck = await rateLimiter.checkRateLimit(clientIP, 'create-prediction', 3600000, 10); // 10 per hour
    
    if (!rateCheck.allowed) {
      const retryAfter = rateCheck.penaltyUntil 
        ? Math.ceil((rateCheck.penaltyUntil.getTime() - Date.now()) / 1000)
        : Math.ceil((rateCheck.resetTime!.getTime() - Date.now()) / 1000);
        
      return new Response(
        JSON.stringify({ 
          error: 'Too many predictions. Please try again later.',
          retryAfter
        }), 
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Retry-After': retryAfter.toString() 
          } 
        }
      );
    }

    const { predictedPrice, weekEnding } = await req.json();
    
    // Enhanced input validation
    if (!InputValidator.validatePrice(predictedPrice) || predictedPrice > 10000) {
      return new Response(
        JSON.stringify({ error: 'Invalid predicted price (must be between 1-10000 cents)' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate week ending date
    const weekEndDate = new Date(weekEnding);
    if (isNaN(weekEndDate.getTime()) || weekEndDate <= new Date()) {
      return new Response(
        JSON.stringify({ error: 'Invalid week ending date' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Security logging
    await supabase.rpc('log_security_event', {
      event_type: 'PREDICTION_ATTEMPT',
      table_name: 'predictions',
      record_id: null,
      ip_address: clientIP,
      user_agent: userAgent,
      additional_data: { predicted_price: predictedPrice, week_ending: weekEnding }
    }).catch(console.error);

    // Check for existing prediction from this IP for the same week
    const { data: existingPrediction } = await supabase
      .from('predictions')
      .select('*')
      .eq('ip_address', clientIP)
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
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'updated', 
          prediction: data 
        }), 
        { headers: corsHeaders }
      );
    } else {
      // Create new prediction
      const { data, error } = await supabase
        .from('predictions')
        .insert({
          predicted_price: predictedPrice,
          week_ending: weekEnding,
          ip_address: clientIP
        })
        .select()
        .single();

      if (error) throw error;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'created', 
          prediction: data 
        }), 
        { headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Error in create-prediction function:', error);
    
    // Don't leak internal error details
    return new Response(
      JSON.stringify({ error: 'Unable to process prediction' }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
