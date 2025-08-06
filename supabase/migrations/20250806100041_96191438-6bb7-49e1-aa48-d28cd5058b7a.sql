-- Fix pricing to match actual upload count
UPDATE pricing 
SET 
  upload_count = (SELECT COUNT(*) FROM uploads),
  current_price = 50 + (SELECT COUNT(*) FROM uploads),
  updated_at = now();