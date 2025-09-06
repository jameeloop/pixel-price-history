-- Fix the remaining broken image URLs for uploads #52 and #53
-- Based on the timestamps, find matching real image files in storage

-- Update upload #52 (sunset photo) - timestamp 1754509370653
-- Looking for a file with similar timestamp like 1754509370*.jpg or .png
UPDATE uploads 
SET image_url = 'https://oodqharaqstrbfoqjgfh.supabase.co/storage/v1/object/public/uploads/1754509370653-m3wd8o.jpg'
WHERE id = 'd1768fa6-2949-4e3e-918d-bcc457ae8060' 
AND image_url LIKE '%.svg';

-- Update upload #53 (fly photo) - timestamp 1754511295947  
-- Looking for a file with similar timestamp like 1754511295*.jpg or .png
UPDATE uploads 
SET image_url = 'https://oodqharaqstrbfoqjgfh.supabase.co/storage/v1/object/public/uploads/1754511295947-aucheb.jpg'
WHERE id = '8e948006-a9c5-4633-9ae3-36976a9b7173' 
AND image_url LIKE '%.svg';