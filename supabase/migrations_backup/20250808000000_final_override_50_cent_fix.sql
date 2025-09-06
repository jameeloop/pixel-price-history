-- FINAL OVERRIDE - This migration runs after ALL others to ensure 1 cent increments starting from $1.00
-- This overrides the 20250806 migrations that were setting 50-cent logic

-- Drop and recreate the function with correct logic
DROP FUNCTION IF EXISTS public.get_next_upload_price();

CREATE OR REPLACE FUNCTION public.get_next_upload_price()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  upload_count INTEGER;
BEGIN
  -- Get current upload count
  SELECT COALESCE(COUNT(*), 0) INTO upload_count FROM public.uploads;
  
  -- Return 100 + upload_count cents ($1.00, $1.01, $1.02, etc.)
  RETURN 100 + upload_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_next_upload_price() TO anon, authenticated;

-- Update the current_price view to use actual upload count
DROP VIEW IF EXISTS public.current_price;
CREATE OR REPLACE VIEW public.current_price AS
SELECT 
  COALESCE(COUNT(*), 0) + 1 as next_upload_number,
  100 + COALESCE(COUNT(*), 0) as next_price_cents
FROM public.uploads;


