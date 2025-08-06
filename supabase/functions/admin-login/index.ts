import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { encodeBase64 } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map (in production, use Redis or database)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

const ADMIN_PASSWORD_HASH = Deno.env.get('ADMIN_PASSWORD_HASH') || '';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { password } = await req.json();
    
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limiting
    const attemptKey = `login_${clientIP}`;
    const attempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
    
    if (attempts.count >= MAX_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      if (timeSinceLastAttempt < LOCKOUT_TIME) {
        return new Response(JSON.stringify({ error: 'Too many login attempts. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Reset attempts after lockout period
        loginAttempts.delete(attemptKey);
      }
    }
    
    if (!password || typeof password !== 'string' || password.length > 100) {
      throw new Error('Invalid password format');
    }

    // Hash the provided password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedInput = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashedInput !== ADMIN_PASSWORD_HASH) {
      // Record failed attempt
      attempts.count++;
      attempts.lastAttempt = Date.now();
      loginAttempts.set(attemptKey, attempts);
      
      console.log(`Failed login attempt from ${clientIP}. Attempts: ${attempts.count}`);
      
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Clear successful login attempts
    loginAttempts.delete(attemptKey);
    console.log(`Successful admin login from ${clientIP}`);

    // Generate secure session token
    const sessionToken = encodeBase64(crypto.getRandomValues(new Uint8Array(32)));
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    // Clean up expired sessions first
    await supabase.rpc('cleanup_expired_admin_sessions');

    // Create new session
    const { error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return new Response(JSON.stringify({ error: 'Session creation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      sessionToken,
      expiresAt: expiresAt.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});