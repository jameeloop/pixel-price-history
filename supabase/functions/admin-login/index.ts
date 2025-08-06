
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
    const adminPasswordHash = Deno.env.get('ADMIN_PASSWORD_HASH')!;
    
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
    
    // Enhanced validation
    if (!InputValidator.validateUserAgent(userAgent)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Very strict rate limiting for admin login
    const rateLimiter = new DatabaseRateLimiter(supabaseUrl, supabaseKey);
    const rateCheck = await rateLimiter.checkRateLimit(clientIP, 'admin-login', 3600000, 3); // 3 attempts per hour
    
    if (!rateCheck.allowed) {
      // Security logging for blocked attempts
      await supabase.rpc('log_security_event', {
        event_type: 'ADMIN_LOGIN_BLOCKED',
        table_name: 'admin_sessions',
        record_id: null,
        ip_address: clientIP,
        user_agent: userAgent,
        additional_data: { reason: 'rate_limit_exceeded' }
      }).catch(console.error);
      
      const retryAfter = rateCheck.penaltyUntil 
        ? Math.ceil((rateCheck.penaltyUntil.getTime() - Date.now()) / 1000)
        : Math.ceil((rateCheck.resetTime!.getTime() - Date.now()) / 1000);
        
      return new Response(
        JSON.stringify({ 
          error: 'Too many login attempts. Access temporarily suspended.',
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

    const { password } = await req.json();
    
    if (!password || typeof password !== 'string') {
      await supabase.rpc('log_security_event', {
        event_type: 'ADMIN_LOGIN_FAILED',
        table_name: 'admin_sessions',
        record_id: null,
        ip_address: clientIP,
        user_agent: userAgent,
        additional_data: { reason: 'missing_password' }
      }).catch(console.error);
      
      return new Response(
        JSON.stringify({ error: 'Password required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Hash the provided password and compare
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex !== adminPasswordHash) {
      await supabase.rpc('log_security_event', {
        event_type: 'ADMIN_LOGIN_FAILED',
        table_name: 'admin_sessions',
        record_id: null,
        ip_address: clientIP,
        user_agent: userAgent,
        additional_data: { reason: 'invalid_password' }
      }).catch(console.error);
      
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }), 
        { status: 401, headers: corsHeaders }
      );
    }

    // Generate secure session token
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    // Clean up old sessions for this IP (limit concurrent sessions)
    await supabase
      .from('admin_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    // Create new session
    const { error } = await supabase
      .from('admin_sessions')
      .insert({
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      console.error('Failed to create admin session:', error);
      return new Response(
        JSON.stringify({ error: 'Session creation failed' }), 
        { status: 500, headers: corsHeaders }
      );
    }

    // Success logging
    await supabase.rpc('log_security_event', {
      event_type: 'ADMIN_LOGIN_SUCCESS',
      table_name: 'admin_sessions',
      record_id: null,
      ip_address: clientIP,
      user_agent: userAgent,
      additional_data: { session_expires: expiresAt.toISOString() }
    }).catch(console.error);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionToken,
        expiresAt: expiresAt.toISOString()
      }), 
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in admin-login function:', error);
    
    // Don't leak internal error details
    return new Response(
      JSON.stringify({ error: 'Authentication failed' }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
