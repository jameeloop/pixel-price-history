
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
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
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!supabaseUrl || !supabaseKey || !stripeKey) {
      console.error('Missing required environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
        stripeKey: !!stripeKey
      });
      return new Response(
        JSON.stringify({ error: 'Configuration error' }), 
        { status: 500, headers: corsHeaders }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Enhanced IP detection
    const getClientIP = (req: Request): string => {
      const xForwardedFor = req.headers.get('x-forwarded-for');
      const xRealIP = req.headers.get('x-real-ip');
      const cfConnectingIP = req.headers.get('cf-connecting-ip');
      
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

    // Stricter rate limiting for payments
    const rateLimiter = new DatabaseRateLimiter(supabaseUrl, supabaseKey);
    const rateCheck = await rateLimiter.checkRateLimit(clientIP, 'create-payment', 300000, 5); // 5 per 5 minutes
    
    if (!rateCheck.allowed) {
      const retryAfter = rateCheck.penaltyUntil 
        ? Math.ceil((rateCheck.penaltyUntil.getTime() - Date.now()) / 1000)
        : Math.ceil((rateCheck.resetTime!.getTime() - Date.now()) / 1000);
        
      return new Response(
        JSON.stringify({ 
          error: 'Too many payment attempts. Please try again later.',
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

    const requestBody = await req.json().catch(() => null);
    if (!requestBody) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }), 
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { email, caption, imageUrl, fileName } = requestBody;
    
    // Enhanced input validation
    if (!InputValidator.validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    const sanitizedCaption = InputValidator.sanitizeString(caption, 500);
    if (!sanitizedCaption || sanitizedCaption.length < 1) {
      return new Response(
        JSON.stringify({ error: 'Caption is required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('https://')) {
      return new Response(
        JSON.stringify({ error: 'Invalid image URL' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Security logging - fixed the .catch() issue
    try {
      await supabase.rpc('log_security_event', {
        event_type: 'PAYMENT_ATTEMPT',
        table_name: 'uploads',
        record_id: null,
        ip_address: clientIP,
        user_agent: userAgent,
        additional_data: { email, caption: sanitizedCaption }
      });
    } catch (logError) {
      console.error('Security logging failed:', logError);
    }

    // Get current price with atomic increment
    const { data: priceInCents, error: priceError } = await supabase.rpc('get_and_increment_price');
    
    if (priceError) {
      console.error('Error getting current price:', priceError);
      throw new Error('Failed to get current price');
    }
    
    if (!priceInCents || !InputValidator.validatePrice(priceInCents)) {
      throw new Error('Failed to get valid current price');
    }


    // Create Stripe checkout session with enhanced security
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Upload #${priceInCents} - PixPeriment`,
              description: `Upload your image for ${(priceInCents / 100).toFixed(2)} USD`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}?cancelled=true`,
      customer_email: email,
      metadata: {
        email,
        caption: sanitizedCaption,
        imageUrl,
        fileName: InputValidator.sanitizeString(fileName || 'upload.jpg', 100),
        uploadOrder: priceInCents.toString(),
        clientIP,
        userAgent: InputValidator.sanitizeString(userAgent, 500)
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      billing_address_collection: 'auto',
      payment_intent_data: {
        setup_future_usage: 'off',
        capture_method: 'automatic',
      },
      submit_type: 'pay',
      locale: 'auto',
    });

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        priceInCents 
      }), 
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error creating payment session:', error);
    
    // Don't leak internal error details
    return new Response(
      JSON.stringify({ error: 'Unable to create payment session' }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
