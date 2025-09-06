-- ABSOLUTE FINAL PRICING FIX - January 9, 2025
-- This migration runs AFTER ALL OTHERS to completely eliminate 50-cent pricing
-- Formula: 100 + upload_count cents ($1.00, $1.01, $1.02, etc.)

-- Step 1: Drop ALL pricing-related functions and views
DROP FUNCTION IF EXISTS public.get_next_upload_price() CASCADE;
DROP FUNCTION IF EXISTS public.get_and_increment_price() CASCADE;
DROP VIEW IF EXISTS public.current_price CASCADE;
DROP TABLE IF EXISTS public.pricing CASCADE;

-- Step 2: Create the definitive pricing function
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
  
  -- Return 100 + upload_count cents (starting at $1.00)
  RETURN 100 + upload_count;
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_next_upload_price() TO anon, authenticated, service_role;

-- Step 4: Create a simple view for current pricing info
CREATE OR REPLACE VIEW public.current_price AS
SELECT 
  COALESCE(COUNT(*), 0) as current_upload_count,
  COALESCE(COUNT(*), 0) + 1 as next_upload_number,
  100 + COALESCE(COUNT(*), 0) as next_price_cents,
  ROUND((100 + COALESCE(COUNT(*), 0)) / 100.0, 2) as next_price_dollars
FROM public.uploads;

-- Step 5: Grant permissions on view
GRANT SELECT ON public.current_price TO anon, authenticated, service_role;

-- Step 6: Update any existing uploads that might have wrong pricing
-- (This is a safety measure to ensure consistency)
UPDATE public.uploads 
SET price_paid = 100 + (upload_order - 1)
WHERE price_paid < 100 OR price_paid != 100 + (upload_order - 1);

-- Step 7: Add a comment for documentation
COMMENT ON FUNCTION public.get_next_upload_price() IS 'Returns the price for the next upload in cents. Formula: 100 + current_upload_count (starts at $1.00)';
