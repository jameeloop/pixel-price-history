-- Fix security issues from the linter

-- Fix function search path for get_next_upload_price
DROP FUNCTION IF EXISTS public.get_next_upload_price();

CREATE OR REPLACE FUNCTION public.get_next_upload_price()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the count of existing uploads + 50 (starting at 50 cents)
  SELECT COALESCE(COUNT(*), 0) + 50 INTO next_number FROM public.uploads;
  RETURN next_number;
END;
$$;