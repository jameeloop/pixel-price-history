-- Fix function search path security warning
CREATE OR REPLACE FUNCTION public.get_and_increment_price()
RETURNS INTEGER AS $$
DECLARE
  current_price_value INTEGER;
BEGIN
  -- Get current price
  SELECT current_price INTO current_price_value FROM public.pricing LIMIT 1;
  
  -- Increment price and count
  UPDATE public.pricing 
  SET 
    current_price = current_price + 1,
    upload_count = upload_count + 1,
    updated_at = now()
  WHERE id = (SELECT id FROM public.pricing LIMIT 1);
  
  RETURN current_price_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;