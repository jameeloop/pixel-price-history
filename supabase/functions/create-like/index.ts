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

    const { uploadId, userIP } = await req.json();
    
    // Enhanced input validation
    if (!InputValidator.validateUploadId(uploadId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid upload ID' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if upload exists
    const { data: uploadExists, error: uploadError } = await supabase
      .from('uploads')
      .select('id, upvotes')
      .eq('id', uploadId)
      .single();

    if (uploadError || !uploadExists) {
      return new Response(
        JSON.stringify({ error: 'Upload not found' }), 
        { status: 404, headers: corsHeaders }
      );
    }

    // Check for existing vote from this user
    const { data: existingVote } = await supabase
      .from('user_votes')
      .select('*')
      .eq('upload_id', uploadId)
      .eq('user_ip', userIP)
      .single();

    if (existingVote) {
      // User already voted, remove their vote
      const { error: deleteError } = await supabase
        .from('user_votes')
        .delete()
        .eq('id', existingVote.id);

      if (deleteError) throw deleteError;

      // Decrement upvotes
      const { error: updateError } = await supabase
        .from('uploads')
        .update({ upvotes: Math.max(0, (uploadExists.upvotes || 0) - 1) })
        .eq('id', uploadId);

      if (updateError) throw updateError;
      
      return new Response(
        JSON.stringify({ success: true, action: 'removed' }), 
        { headers: corsHeaders }
      );
    } else {
      // User hasn't voted, add their vote
      const { error: insertError } = await supabase
        .from('user_votes')
        .insert({
          upload_id: uploadId,
          user_ip: userIP,
          voted: true
        });

      if (insertError) throw insertError;

      // Increment upvotes
      const { error: updateError } = await supabase
        .from('uploads')
        .update({ upvotes: (uploadExists.upvotes || 0) + 1 })
        .eq('id', uploadId);

      if (updateError) throw updateError;
      
      return new Response(
        JSON.stringify({ success: true, action: 'created' }), 
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