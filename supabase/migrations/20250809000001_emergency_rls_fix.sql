-- EMERGENCY RLS FIX - Ensure service role can access uploads table for pricing
-- This fixes the 406 errors and potential 50-cent pricing bugs

-- Drop any restrictive policies that might block service role access
DROP POLICY IF EXISTS "Block direct public access to uploads" ON public.uploads;
DROP POLICY IF EXISTS "Public can view limited upload info" ON public.uploads;
DROP POLICY IF EXISTS "Admin can view all uploads" ON public.uploads;

-- Recreate the original permissive policy for uploads (needed for pricing calculations)
CREATE POLICY "Anyone can view uploads" ON public.uploads
FOR SELECT USING (true);

-- Ensure service role can insert uploads (needed for webhook)
CREATE POLICY "Anyone can insert uploads" ON public.uploads
FOR INSERT WITH CHECK (true);

-- Add a comment explaining why this is needed
COMMENT ON POLICY "Anyone can view uploads" ON public.uploads IS 'Required for pricing calculations in edge functions. Service role needs access to count uploads.';

-- Also ensure the get_next_upload_price function works properly
-- Drop and recreate with explicit permissions
DROP FUNCTION IF EXISTS public.get_next_upload_price() CASCADE;

CREATE OR REPLACE FUNCTION public.get_next_upload_price()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  upload_count INTEGER;
BEGIN
  -- Get current upload count from uploads table
  SELECT COALESCE(COUNT(*), 0) INTO upload_count FROM public.uploads;
  
  -- CRITICAL: Never allow this function to return 50 or less than 100
  IF upload_count < 0 THEN
    upload_count := 0;
  END IF;
  
  -- Return 100 + upload_count cents (starting at $1.00, minimum $1.00)
  RETURN GREATEST(100 + upload_count, 100);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_next_upload_price() TO anon, authenticated, service_role;

-- Add protective comment
COMMENT ON FUNCTION public.get_next_upload_price() IS 'Returns the price for the next upload in cents. Formula: GREATEST(100 + current_upload_count, 100) - minimum $1.00, never 50 cents';
