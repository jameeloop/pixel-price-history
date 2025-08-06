
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Starting payment creation...');

    const requestBody = await req.json().catch(() => null);
    if (!requestBody) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }), 
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { email, caption, imageUrl, fileName } = requestBody;
    
    console.log('Request body received:', { email: !!email, caption: !!caption, imageUrl: !!imageUrl });
    
    // Basic input validation
    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email address required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    if (!caption || caption.trim().length < 1) {
      return new Response(
        JSON.stringify({ error: 'Caption is required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('https://')) {
      return new Response(
        JSON.stringify({ error: 'Valid image URL required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Get current price with atomic increment
    const { data: priceInCents, error: priceError } = await supabase.rpc('get_and_increment_price');
    
    if (priceError) {
      console.error('Error getting current price:', priceError);
      throw new Error('Failed to get current price');
    }
    
    if (!priceInCents || typeof priceInCents !== 'number' || priceInCents < 1) {
      throw new Error('Failed to get valid current price');
    }

    console.log('Creating Stripe session with price:', priceInCents);

    // Create Stripe checkout session
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
        caption: caption.trim(),
        imageUrl,
        fileName: fileName || 'upload.jpg',
        uploadOrder: priceInCents.toString()
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    console.log('Stripe session created successfully:', session.id);

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
