-- Fix search path security issue in log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  table_name text,
  record_id uuid,
  ip_address text,
  user_agent text DEFAULT NULL,
  additional_data jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    operation,
    table_name,
    record_id,
    ip_address,
    user_agent,
    new_values
  ) VALUES (
    event_type,
    table_name,
    record_id,
    ip_address::inet,
    user_agent,
    additional_data
  );
END;
$$;

-- Fix search path for existing functions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.upload_sessions 
  WHERE expires_at < now();
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.admin_sessions 
  WHERE expires_at < now();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_and_increment_price()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  current_price_value INTEGER;
BEGIN
  -- Get current price
  SELECT current_price INTO current_price_value FROM public.pricing LIMIT 1;
  
  -- Increment price and count
  UPDATE public.pricing 
  SET 
    current_price = current_price + 1,
    upload_count = upload_count + 1,
    updated_at = now()
  WHERE id = (SELECT id FROM public.pricing LIMIT 1);
  
  RETURN current_price_value;
END;
$$;