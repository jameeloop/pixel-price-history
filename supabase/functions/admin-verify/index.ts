import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const requestCounts = new Map();
const MAX_REQUESTS_PER_MINUTE = 10;

const validateInput = (input: string, maxLength: number = 500): boolean => {
  if (!input || input.length > maxLength) return false;
  
  // Basic XSS prevention
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
};

const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const rateLimitCheck = (clientId: string): boolean => {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  if (!requestCounts.has(clientId)) {
    requestCounts.set(clientId, []);
  }
  
  const requests = requestCounts.get(clientId);
  // Remove old requests
  const recentRequests = requests.filter((timestamp: number) => timestamp > windowStart);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  recentRequests.push(now);
  requestCounts.set(clientId, recentRequests);
  return true;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimitCheck(clientIp)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionToken } = await req.json();

    if (!sessionToken || typeof sessionToken !== 'string') {
      return new Response(JSON.stringify({ valid: false, error: 'Invalid session token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate and sanitize session token
    if (!validateInput(sessionToken, 100)) {
      return new Response(JSON.stringify({ valid: false, error: 'Invalid session token format' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean up expired sessions
    await supabase.rpc('cleanup_expired_admin_sessions');

    // Verify session
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return new Response(JSON.stringify({ valid: false, error: 'Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update last used timestamp
    await supabase
      .from('admin_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('session_token', sessionToken);

    return new Response(JSON.stringify({ 
      valid: true,
      expiresAt: session.expires_at
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      },
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return new Response(JSON.stringify({ valid: false, error: 'Verification failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});