import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== GET UPLOADS FUNCTION ===");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get parameters from request body
    const body = await req.json();
    const limit = body.limit;
    const search = body.search;
    const sortBy = body.sortBy || 'date'; // 'date', 'index', or 'votes'
    const sortOrder = body.sortOrder || 'desc'; // 'asc' or 'desc'

    // Build query
    let query = supabase
      .from('uploads')
      .select('id, user_email, image_url, caption, price_paid, upload_order, created_at, stripe_session_id, upvotes');
    
    // Apply sorting
    console.log('Sorting by:', sortBy, 'order:', sortOrder);
    if (sortBy === 'date') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'index') {
      // Sort by upload order (index)
      query = query.order('upload_order', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'votes') {
      // Sort by upvotes
      query = query.order('upvotes', { ascending: sortOrder === 'asc' });
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    if (search) {
      console.log('Searching for:', search);
      // Search by caption, email, and price only (removed index search)
      const searchQuery = `caption.ilike.%${search}%,user_email.ilike.%${search}%,price_paid.eq.${parseInt(search) * 100 || 0}`;
      console.log('Search query:', searchQuery);
      query = query.or(searchQuery);
    }

    const { data: uploads, error, count } = await query;

    if (error) {
      console.error('Error getting uploads:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to get uploads' }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Fetched uploads:', { count, uploads: uploads?.length });

    return new Response(JSON.stringify({
      uploads: uploads || [],
      count: count || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in get-uploads function:", error);
    return new Response(JSON.stringify({
      error: "Failed to fetch uploads",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});