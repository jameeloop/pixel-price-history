
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== PAYMENT FUNCTION START ===');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== CHECKING ENVIRONMENT VARIABLES ===');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    console.log('Environment check:', {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
      stripeKey: !!stripeKey,
      supabaseUrlLength: supabaseUrl?.length || 0,
      supabaseKeyLength: supabaseKey?.length || 0,
      stripeKeyLength: stripeKey?.length || 0
    });
    
    if (!supabaseUrl || !supabaseKey || !stripeKey) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Configuration error - missing environment variables' }), 
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log('=== INITIALIZING CLIENTS ===');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created');
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });
    console.log('Stripe client created');

    console.log('=== PARSING REQUEST BODY ===');
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
    } catch (bodyError) {
      console.error('Failed to parse request body:', bodyError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }), 
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { email, caption, imageUrl, fileName } = requestBody;
    console.log('Request data:', { 
      email: email ? `${email.substring(0, 3)}***` : 'missing',
      caption: caption ? `${caption.length} chars` : 'missing',
      imageUrl: imageUrl ? `${imageUrl.substring(0, 20)}...` : 'missing',
      fileName: fileName || 'not provided'
    });
    
    console.log('=== VALIDATING INPUT ===');
    if (!email || !email.includes('@')) {
      console.error('Invalid email:', email);
      return new Response(
        JSON.stringify({ error: 'Valid email address required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    if (!caption || caption.trim().length < 1) {
      console.error('Invalid caption:', caption);
      return new Response(
        JSON.stringify({ error: 'Caption is required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('https://')) {
      console.error('Invalid imageUrl:', imageUrl);
      return new Response(
        JSON.stringify({ error: 'Valid image URL required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('=== GETTING PRICE FROM DATABASE ===');
    let priceInCents, priceError;
    try {
      const result = await supabase.rpc('get_and_increment_price');
      priceInCents = result.data;
      priceError = result.error;
      console.log('Price query result:', { priceInCents, priceError });
    } catch (dbError) {
      console.error('Database error when getting price:', dbError);
      return new Response(
        JSON.stringify({ error: 'Database connection failed' }), 
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (priceError) {
      console.error('Error getting current price:', priceError);
      return new Response(
        JSON.stringify({ error: 'Failed to get current price' }), 
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!priceInCents || typeof priceInCents !== 'number' || priceInCents < 1) {
      console.error('Invalid price returned:', priceInCents, typeof priceInCents);
      return new Response(
        JSON.stringify({ error: 'Invalid price from database' }), 
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('=== CREATING STRIPE SESSION ===');
    console.log('Creating session with price:', priceInCents);
    console.log('Origin for URLs:', req.headers.get('origin'));

    let session;
    try {
      session = await stripe.checkout.sessions.create({
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
    } catch (stripeError) {
      console.error('Stripe error details:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        param: stripeError.param,
        stack: stripeError.stack
      });
      return new Response(
        JSON.stringify({ error: 'Stripe session creation failed', details: stripeError.message }), 
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('=== RETURNING SUCCESS RESPONSE ===');
    const responseData = { 
      sessionId: session.id,
      url: session.url,
      priceInCents 
    };
    console.log('Response data:', responseData);

    return new Response(
      JSON.stringify(responseData), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('=== UNEXPECTED ERROR ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error occurred',
        message: error.message 
      }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
