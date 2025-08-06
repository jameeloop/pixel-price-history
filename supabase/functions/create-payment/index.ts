
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== EDGE FUNCTION START ===');
  console.log('Method:', req.method);
  
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
    });
    
    if (!supabaseUrl || !supabaseKey || !stripeKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Configuration error - missing environment variables' }), 
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log('=== PARSING REQUEST BODY ===');
    let requestBody;
    try {
      const text = await req.text();
      console.log('Raw request text:', text);
      requestBody = JSON.parse(text);
      console.log('Parsed request body:', requestBody);
    } catch (bodyError) {
      console.error('Failed to parse request body:', bodyError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }), 
        { status: 400, headers: corsHeaders }
      );
    }
    
    const { email, caption, imageUrl, fileName } = requestBody;
    console.log('Extracted fields:', { 
      email: !!email,
      caption: !!caption,
      imageUrl: !!imageUrl,
      fileName: !!fileName
    });
    
    console.log('=== BASIC VALIDATION ===');
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

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('Invalid imageUrl:', imageUrl);
      return new Response(
        JSON.stringify({ error: 'Valid image URL required' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('=== INITIALIZING CLIENTS ===');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });
    console.log('Clients initialized');

    console.log('=== GETTING CURRENT PRICE (NO INCREMENT) ===');
    // Get current price WITHOUT incrementing - increment only happens on successful webhook
    const { data: priceData, error: priceError } = await supabase
      .from('pricing')
      .select('current_price')
      .single();
    
    console.log('Price query result:', { priceData, priceError });
    
    if (priceError) {
      console.error('Database error getting price:', priceError);
      return new Response(
        JSON.stringify({ error: 'Failed to get current price' }), 
        { status: 500, headers: corsHeaders }
      );
    }
    
    const priceInCents = priceData?.current_price;
    if (!priceInCents || typeof priceInCents !== 'number' || priceInCents < 1) {
      console.error('Invalid price returned:', priceInCents);
      return new Response(
        JSON.stringify({ error: 'Invalid price from database' }), 
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('=== UPLOADING IMAGE TO STORAGE ===');
    // Upload the actual image to Supabase storage first
    let imageStorageUrl = null;
    if (imageUrl && imageUrl.startsWith('data:')) {
      try {
        // Extract base64 data and convert to blob
        const [header, base64Data] = imageUrl.split(',');
        const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        
        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const extension = mimeType.split('/')[1] || 'jpg';
        const storageFileName = `${timestamp}-${randomString}.${extension}`;
        
        console.log('Uploading file to storage:', storageFileName);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(storageFileName, bytes, {
            contentType: mimeType,
            upsert: false
          });
        
        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
        
        console.log('File uploaded successfully:', uploadData);
        
        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(storageFileName);
        
        imageStorageUrl = urlData.publicUrl;
        console.log('Image storage URL:', imageStorageUrl);
        
      } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error(`Image upload failed: ${error.message}`);
      }
    }

    console.log('=== CREATING STRIPE SESSION ===');
    
    // Store image URL temporarily - we'll access it in the webhook via a temp storage mechanism
    // Since Stripe metadata has a 500 character limit, we need an alternative approach

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
        caption: caption.trim().substring(0, 400), // Limit caption to 400 chars
        fileName: fileName || 'upload.jpg',
        uploadOrder: priceInCents.toString(),
        price_paid: priceInCents.toString(),
        imageStorageUrl: imageStorageUrl || '' // Try to include the URL
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });
    
    console.log('Stripe session created successfully:', session.id);

    const responseData = { 
      sessionId: session.id,
      url: session.url,
      priceInCents 
    };
    console.log('=== RETURNING SUCCESS RESPONSE ===');
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
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error occurred',
        message: error.message 
      }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
