-- Fix security linter warnings from previous migration

-- 1. Fix the mask_email function to have proper search_path
CREATE OR REPLACE FUNCTION public.mask_email(email_input text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 2. Fix the log_admin_access function to have proper search_path
CREATE OR REPLACE FUNCTION public.log_admin_access()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log admin access to uploads table
  INSERT INTO public.audit_logs (
    operation,
    table_name,
    record_id,
    ip_address,
    new_values
  ) VALUES (
    TG_OP,
    'uploads',
    COALESCE(NEW.id, OLD.id),
    inet '0.0.0.0', -- Will be updated by application
    jsonb_build_object('admin_access', true, 'timestamp', now())
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;