-- Fix security issues from linter

-- 1. Fix the view security definer issue by removing SECURITY DEFINER and using RLS instead
DROP VIEW IF EXISTS public.uploads_public;

-- Create a simple view without SECURITY DEFINER
CREATE VIEW public.uploads_public AS
SELECT 
  id,
  mask_email(user_email) AS user_email,
  caption,
  image_url,
  price_paid,
  upload_order,
  created_at
FROM public.uploads
ORDER BY upload_order DESC;

-- Grant access to the view
GRANT SELECT ON public.uploads_public TO anon, authenticated;

-- 2. Fix function search path issues by setting immutable search paths
CREATE OR REPLACE FUNCTION public.mask_email(email_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
DECLARE
  local_part text;
  domain_part text;
  masked_local text;
BEGIN
  -- Split email into local and domain parts
  SELECT split_part(email_input, '@', 1), split_part(email_input, '@', 2) 
  INTO local_part, domain_part;
  
  -- If no domain part, return as is (invalid email)
  IF domain_part = '' THEN
    RETURN email_input;
  END IF;
  
  -- Mask local part: show first 2 chars, then asterisks
  IF length(local_part) <= 2 THEN
    masked_local := local_part || '***';
  ELSE
    masked_local := left(local_part, 2) || repeat('*', greatest(length(local_part) - 2, 3));
  END IF;
  
  RETURN masked_local || '@' || domain_part;
END;
$$;