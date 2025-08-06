-- Simplify pricing system to be purely chronological
-- Reset and clean up the pricing system

-- First, let's drop the complex pricing table and function
DROP FUNCTION IF EXISTS public.get_and_increment_price();
DROP TABLE IF EXISTS public.pricing;

-- Create a simple function that just gets the next upload number
CREATE OR REPLACE FUNCTION public.get_next_upload_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the count of existing uploads + 1
  SELECT COALESCE(COUNT(*), 0) + 1 INTO next_number FROM public.uploads;
  RETURN next_number;
END;
$$;

-- Update existing uploads to have correct chronological pricing
-- First upload should be 50 cents, second 51 cents, etc.
UPDATE public.uploads 
SET 
  upload_order = (
    SELECT ROW_NUMBER() OVER (ORDER BY created_at ASC)
    FROM public.uploads u2 
    WHERE u2.id = uploads.id
  ),
  price_paid = (
    SELECT 49 + ROW_NUMBER() OVER (ORDER BY created_at ASC)
    FROM public.uploads u2 
    WHERE u2.id = uploads.id
  );

-- Create a view for easier pricing calculation
CREATE OR REPLACE VIEW public.current_price AS
SELECT COALESCE(MAX(upload_order), 0) + 50 as next_price_cents;