-- Clear all uploads and reset the experiment
DELETE FROM uploads;

-- Reset pricing to initial state
UPDATE pricing SET 
  current_price = 50,
  upload_count = 0,
  updated_at = now()
WHERE id = (SELECT id FROM pricing LIMIT 1);

-- If no pricing record exists, create one
INSERT INTO pricing (current_price, upload_count)
SELECT 50, 0
WHERE NOT EXISTS (SELECT 1 FROM pricing);