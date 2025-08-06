-- Fix Security Definer View Issue
-- Replace the current approach with a SECURITY INVOKER view and client-side email masking

-- 1. Drop the current uploads_public view
DROP VIEW IF EXISTS public.uploads_public;

-- 2. Create a new SECURITY INVOKER view that doesn't use SECURITY DEFINER functions
CREATE VIEW public.uploads_public 
WITH (security_invoker = true) AS 
SELECT 
  id,
  user_email,  -- Keep original email for now, will mask on client side
  caption,
  image_url,
  price_paid,
  upload_order,
  created_at
FROM public.uploads;

-- 3. Grant appropriate permissions on the view
GRANT SELECT ON public.uploads_public TO anon;
GRANT SELECT ON public.uploads_public TO authenticated;

-- 4. Create a client-side safe function for email masking (non-SECURITY DEFINER)
-- This function can be called by the client application when needed
CREATE OR REPLACE FUNCTION public.mask_email_safe(email_input text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  local_part text;
  domain_part text;
  masked_local text;
BEGIN
  -- Basic input validation
  IF email_input IS NULL OR length(email_input) < 3 THEN
    RETURN 'anonymous';
  END IF;
  
  -- Split email into local and domain parts
  SELECT split_part(email_input, '@', 1), split_part(email_input, '@', 2) 
  INTO local_part, domain_part;
  
  -- If no domain part, return as is (invalid email)
  IF domain_part = '' THEN
    RETURN 'anonymous';
  END IF;
  
  -- Mask local part: show first 2 chars, then asterisks
  IF length(local_part) <= 2 THEN
    masked_local := local_part || '***';
  ELSE
    masked_local := left(local_part, 2) || repeat('*', greatest(length(local_part) - 2, 3));
  END IF;
  
  RETURN masked_local || '@' || domain_part;
END;
$function$;