-- Try different extensions for the broken image files
-- Update upload #2 (test #51) - try PNG extension
UPDATE uploads 
SET image_url = 'https://oodqharaqstrbfoqjgfh.supabase.co/storage/v1/object/public/uploads/1754508970895-9uavh.png'
WHERE id = '6daf8425-b89d-420a-8655-4938af7b26c8';

-- Update upload #4 (fly photo) - try PNG extension  
UPDATE uploads 
SET image_url = 'https://oodqharaqstrbfoqjgfh.supabase.co/storage/v1/object/public/uploads/1754511295947-aucheb.png'
WHERE id = '8e948006-a9c5-4633-9ae3-36976a9b7173';