
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
      const xForwardedFor = req.headers.get('x-forwarded-for');
      const xRealIP = req.headers.get('x-real-ip');
      const cfConnectingIP = req.headers.get('cf-connecting-ip');
      
      // Cloudflare IP (most reliable for Supabase)
      if (cfConnectingIP && InputValidator.validateIpAddress(cfConnectingIP)) {
        return cfConnectingIP;
      }
      
      // X-Forwarded-For (take first IP)
      if (xForwardedFor) {
        const firstIP = xForwardedFor.split(',')[0].trim();
        if (InputValidator.validateIpAddress(firstIP)) {
          return firstIP;
        }
      }
      
      // X-Real-IP
      if (xRealIP && InputValidator.validateIpAddress(xRealIP)) {
        return xRealIP;
      }
      
      return '127.0.0.1'; // Fallback
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

    // Enhanced rate limiting with database persistence
    const rateLimiter = new DatabaseRateLimiter(supabaseUrl, supabaseKey);
    const rateCheck = await rateLimiter.checkRateLimit(clientIP, 'create-like', 60000, 20);
    
    if (!rateCheck.allowed) {
      const retryAfter = rateCheck.penaltyUntil 
        ? Math.ceil((rateCheck.penaltyUntil.getTime() - Date.now()) / 1000)
        : Math.ceil((rateCheck.resetTime!.getTime() - Date.now()) / 1000);
        
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded', 
          retryAfter,
          penaltyUntil: rateCheck.penaltyUntil?.toISOString()
        }), 
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Reset': (rateCheck.resetTime || rateCheck.penaltyUntil)!.toISOString()
          } 
        }
      );
    }

    const { uploadId, likeType } = await req.json();
    
    // Enhanced input validation
    if (!InputValidator.validateUploadId(uploadId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid upload ID' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    if (!['like', 'dislike'].includes(likeType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid like type' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if upload exists
    const { data: uploadExists, error: uploadError } = await supabase
      .from('uploads')
      .select('id')
      .eq('id', uploadId)
      .single();

    if (uploadError || !uploadExists) {
      return new Response(
        JSON.stringify({ error: 'Upload not found' }), 
        { status: 404, headers: corsHeaders }
      );
    }

    // Security logging - fixed the .catch() issue
    try {
      await supabase.rpc('log_security_event', {
        event_type: 'LIKE_ATTEMPT',
        table_name: 'likes',
        record_id: uploadId,
        ip_address: clientIP,
        user_agent: userAgent,
        additional_data: { like_type: likeType }
      });
    } catch (logError) {
      console.error('Security logging failed:', logError);
    }

    // Check for existing like from this IP
    const { data: existingLike } = await supabase
      .from('likes')
      .select('*')
      .eq('upload_id', uploadId)
      .eq('ip_address', clientIP)
      .single();

    if (existingLike) {
      if (existingLike.like_type === likeType) {
        // Remove like if same type
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) throw error;
        
        return new Response(
          JSON.stringify({ success: true, action: 'removed', likeType }), 
          { headers: corsHeaders }
        );
      } else {
        // Update like type if different
        const { error } = await supabase
          .from('likes')
          .update({ like_type: likeType })
          .eq('id', existingLike.id);

        if (error) throw error;
        
        return new Response(
          JSON.stringify({ success: true, action: 'updated', likeType }), 
          { headers: corsHeaders }
        );
      }
    } else {
      // Create new like
      const { error } = await supabase
        .from('likes')
        .insert({
          upload_id: uploadId,
          like_type: likeType,
          ip_address: clientIP
        });

      if (error) throw error;
      
      return new Response(
        JSON.stringify({ success: true, action: 'created', likeType }), 
        { headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Error in create-like function:', error);
    
    // Don't leak internal error details
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
