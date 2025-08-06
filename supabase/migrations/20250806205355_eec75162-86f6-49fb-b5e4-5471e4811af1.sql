-- Simplify pricing system to be purely chronological
-- Drop the complex pricing table and function that's causing issues
DROP FUNCTION IF EXISTS public.get_and_increment_price();
DROP TABLE IF EXISTS public.pricing;

-- Create a simple function that calculates the next price based on upload count
CREATE OR REPLACE FUNCTION public.get_next_upload_price()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the count of existing uploads + 50 (starting at 50 cents)
  SELECT COALESCE(COUNT(*), 0) + 50 INTO next_number FROM public.uploads;
  RETURN next_number;
END;
$$;

-- Update existing uploads to have correct chronological pricing
-- First upload should be 50 cents, second 51 cents, etc.
WITH numbered_uploads AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM public.uploads
)
UPDATE public.uploads 
SET 
  upload_order = numbered_uploads.row_num,
  price_paid = numbered_uploads.row_num + 49
FROM numbered_uploads
WHERE uploads.id = numbered_uploads.id;