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
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function getRealIpAddress(request: Request): string {
  // Get IP from various headers in order of preference
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (xForwardedFor) {
    // Take the first IP in the chain
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  if (xRealIp) {
    return xRealIp;
  }
  
  // Fallback - this might be a proxy IP
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

function validateInput(input: string, maxLength: number = 500): boolean {
  if (!input || input.length > maxLength) return false;
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = getRealIpAddress(req);
    
    // Rate limiting
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

    const { uploadId, likeType } = await req.json();

    // Validate inputs
    if (!validateInput(uploadId, 100) || !validateInput(likeType, 20)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['like', 'dislike'].includes(likeType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid like type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('likes')
      .select('*')
      .eq('upload_id', uploadId)
      .eq('ip_address', clientIp)
      .single();

    if (existingVote) {
      if (existingVote.like_type === likeType) {
        // Remove vote if clicking same type
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingVote.id);

        if (error) throw error;

        // Log security event
        await supabase.rpc('log_security_event', {
          event_type: 'vote_removed',
          table_name: 'likes',
          record_id: existingVote.id,
          ip_address: clientIp,
          user_agent: req.headers.get('user-agent') || null,
          additional_data: { upload_id: uploadId, like_type: likeType }
        });

        return new Response(
          JSON.stringify({ success: true, action: 'removed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Change vote type
        const { error } = await supabase
          .from('likes')
          .update({ like_type: likeType })
          .eq('id', existingVote.id);

        if (error) throw error;

        // Log security event
        await supabase.rpc('log_security_event', {
          event_type: 'vote_changed',
          table_name: 'likes',
          record_id: existingVote.id,
          ip_address: clientIp,
          user_agent: req.headers.get('user-agent') || null,
          additional_data: { upload_id: uploadId, old_type: existingVote.like_type, new_type: likeType }
        });

        return new Response(
          JSON.stringify({ success: true, action: 'updated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Create new vote
      const { data, error } = await supabase
        .from('likes')
        .insert({
          upload_id: uploadId,
          like_type: likeType,
          ip_address: clientIp
        })
        .select()
        .single();

      if (error) throw error;

      // Log security event
      await supabase.rpc('log_security_event', {
        event_type: 'vote_created',
        table_name: 'likes',
        record_id: data.id,
        ip_address: clientIp,
        user_agent: req.headers.get('user-agent') || null,
        additional_data: { upload_id: uploadId, like_type: likeType }
      });

      return new Response(
        JSON.stringify({ success: true, action: 'created' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error handling like:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});