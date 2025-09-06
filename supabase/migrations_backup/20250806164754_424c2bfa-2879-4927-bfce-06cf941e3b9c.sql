-- Fix security definer issue by creating a simple view without SECURITY DEFINER
DROP VIEW IF EXISTS uploads_public;

CREATE VIEW uploads_public AS
SELECT 
  id,
  upload_order,
  image_url,
  user_email, -- Keep original email for now, handle masking in frontend
  price_paid,
  created_at,
  caption
FROM uploads
ORDER BY created_at DESC;