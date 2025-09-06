
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();
    
    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Password required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Simple password check (you can change this password)
    const validPassword = 'admin123'; // Change this to your desired admin password

    if (password !== validPassword) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }), 
        { status: 401, headers: corsHeaders }
      );
    }

    // Generate secure session token
    const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

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
    
    return new Response(
      JSON.stringify({ error: 'Authentication failed' }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
