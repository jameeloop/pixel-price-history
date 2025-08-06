-- Fix the uploads_public view to remove SECURITY DEFINER
DROP VIEW IF EXISTS uploads_public;

CREATE VIEW uploads_public AS
SELECT 
  id,
  user_email,
  image_url,
  caption,
  price_paid,
  upload_order,
  created_at
FROM uploads;