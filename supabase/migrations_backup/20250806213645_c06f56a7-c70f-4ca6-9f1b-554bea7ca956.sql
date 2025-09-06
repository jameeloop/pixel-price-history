-- Manual fix for existing broken image URLs
-- These are the known broken uploads that should be fixed

-- Update upload #51 (test image) - there's a real JPEG file for this one
UPDATE uploads 
SET image_url = 'https://oodqharaqstrbfoqjgfh.supabase.co/storage/v1/object/public/uploads/1754508970895-9uavh.jpeg'
WHERE id = '6daf8425-b89d-420a-8655-4938af7b26c8' 
AND image_url LIKE '%.svg';

-- For the other broken records, we'll leave them as-is since the fix function 
-- couldn't find matching real images for them