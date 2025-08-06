-- Reset pricing to correct state: 1 actual upload = next price should be 51p
UPDATE public.pricing 
SET 
  current_price = 51,
  upload_count = 1,
  updated_at = now()
WHERE id = (SELECT id FROM public.pricing LIMIT 1);