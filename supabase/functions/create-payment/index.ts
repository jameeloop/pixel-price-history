
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== EDGE FUNCTION START ===');
  console.log('🔥 VERSION: AGGRESSIVE-DEBUG-50-CENT-BUG 🔥');
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

    // Get upload count - single source of truth
    const { count: uploadCount, error: uploadsError } = await supabase
      .from('uploads')
      .select('*', { count: 'exact', head: true });
    
    if (uploadsError) {
      console.error('Database error getting upload count:', uploadsError);
      return new Response(
        JSON.stringify({ error: 'Failed to get upload count' }), 
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Single variable - everything based on this
    const currentUploadCount = uploadCount || 0;
    
    // Price calculations - all based on currentUploadCount
    const currentPrice = 100 + currentUploadCount; // $1.00 + upload count (current price)
    const nextPrice = currentPrice + 1; // Next upload will be 1 cent more
    
    console.log('=== SIMPLIFIED PRICING ===');
    console.log('uploadCount from DB:', uploadCount);
    console.log('currentUploadCount (clean):', currentUploadCount);
    console.log('currentPrice (100 + count):', currentPrice, '=', '$' + (currentPrice/100).toFixed(2));
    console.log('nextPrice (current + 1):', nextPrice, '=', '$' + (nextPrice/100).toFixed(2));

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
        
        // Generate unique filename with proper extension mapping
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        let extension = 'jpg'; // default
        
        // Map MIME types to proper extensions
        switch (mimeType) {
          case 'image/jpeg':
            extension = 'jpg';
            break;
          case 'image/png':
            extension = 'png';
            break;
          case 'image/gif':
            extension = 'gif';
            break;
          case 'image/webp':
            extension = 'webp';
            break;
          default:
            extension = 'jpg';
        }
        
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

    console.log('=== CREATING PENDING UPLOAD RECORD ===');
    // Store upload data in pending_uploads table to avoid Stripe metadata limits
    const { data: pendingUpload, error: pendingError } = await supabase
      .from('pending_uploads')
      .insert([{
        email,
        caption: caption.trim(),
        image_url: imageStorageUrl
      }])
      .select()
      .single();

    if (pendingError) {
      console.error('Failed to create pending upload:', pendingError);
      throw new Error(`Failed to create pending upload: ${pendingError.message}`);
    }

    console.log('Pending upload created:', pendingUpload.id);

    console.log('=== CREATING STRIPE SESSION ===');
    console.log('Using currentPrice for Stripe:', currentPrice, '(', '$' + (currentPrice/100).toFixed(2), ')');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Upload #${currentUploadCount + 1} - PixPeriment`,
              description: `Upload your image for ${(currentPrice / 100).toFixed(2)} USD`,
            },
            unit_amount: currentPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}?cancelled=true`,
      customer_email: email,
      metadata: {
        pending_upload_id: pendingUpload.id,
        price_paid: currentPrice.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });
    
    console.log('Stripe session created successfully:', session.id);
    console.log('Stripe session details:', {
      sessionId: session.id,
      unit_amount_sent: currentPrice,
      metadata_price_paid: currentPrice.toString(),
      session_amount_total: session.amount_total
    });

    const responseData = { 
      sessionId: session.id,
      url: session.url,
      priceInCents: currentPrice
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
