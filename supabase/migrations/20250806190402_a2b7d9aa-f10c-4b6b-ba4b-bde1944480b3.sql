-- Reset pricing system to reflect only the 1 actual upload (the X-ray)
-- Set current_price to 51 cents and upload_count to 1
UPDATE public.pricing 
SET 
  current_price = 51,
  upload_count = 1,
  updated_at = now()
WHERE id = (SELECT id FROM public.pricing LIMIT 1);