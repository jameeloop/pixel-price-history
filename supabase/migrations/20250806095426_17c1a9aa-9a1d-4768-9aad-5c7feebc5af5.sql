-- Reset pricing to match actual upload count
UPDATE pricing 
SET 
  current_price = 50 + upload_count,
  updated_at = now()
WHERE id = '46fc7558-5c43-46bc-be55-03f5647031fb';