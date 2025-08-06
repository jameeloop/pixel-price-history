-- Manually restore the missing uploads that were paid for but never created
-- Upload #2 (paid 51 cents)
INSERT INTO public.uploads (
  user_email,
  image_url,
  caption,
  price_paid,
  upload_order,
  stripe_session_id,
  created_at
) VALUES (
  'recovered-user@example.com',
  'https://oodqharaqstrbfoqjgfh.supabase.co/storage/v1/object/public/uploads/placeholder-upload-2.svg',
  'Upload #2 - Recovered from failed webhook (paid $0.51)',
  51,
  2,
  'recovered-upload-2',
  NOW() - INTERVAL '30 minutes'
);

-- Upload #3 (paid 52 cents) 
INSERT INTO public.uploads (
  user_email,
  image_url,
  caption,
  price_paid,
  upload_order,
  stripe_session_id,
  created_at
) VALUES (
  'recovered-user@example.com',
  'https://oodqharaqstrbfoqjgfh.supabase.co/storage/v1/object/public/uploads/placeholder-upload-3.svg',
  'Upload #3 - Recovered from failed webhook (paid $0.52)',
  52,
  3,
  'recovered-upload-3',
  NOW() - INTERVAL '15 minutes'
);