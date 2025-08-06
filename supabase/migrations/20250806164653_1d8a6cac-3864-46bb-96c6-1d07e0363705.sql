-- Drop the empty view and recreate it as a proper view of uploads with masked emails
DROP VIEW IF EXISTS uploads_public;

CREATE VIEW uploads_public AS
SELECT 
  id,
  upload_order,
  image_url,
  mask_email_safe(user_email) as user_email,
  price_paid,
  created_at,
  caption
FROM uploads
ORDER BY created_at DESC;