-- Fix RLS policies for likes table to prevent manipulation
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Anyone can insert likes" ON public.likes;
DROP POLICY IF EXISTS "Users can update their own likes" ON public.likes;

-- Create more restrictive policies for likes
CREATE POLICY "Public can view likes" 
ON public.likes 
FOR SELECT 
USING (true);

CREATE POLICY "Restricted like insertion" 
ON public.likes 
FOR INSERT 
WITH CHECK (
  -- Ensure IP address is provided and not empty
  ip_address IS NOT NULL 
  AND length(trim(ip_address)) > 0
  -- Prevent duplicate votes from same IP for same upload
  AND NOT EXISTS (
    SELECT 1 FROM public.likes 
    WHERE upload_id = NEW.upload_id 
    AND ip_address = NEW.ip_address
  )
);

CREATE POLICY "Users can update their own likes by IP" 
ON public.likes 
FOR UPDATE 
USING (true)
WITH CHECK (
  -- Only allow changing vote type, not IP or upload_id
  OLD.ip_address = NEW.ip_address 
  AND OLD.upload_id = NEW.upload_id
);

-- Fix RLS policies for predictions table
DROP POLICY IF EXISTS "Anyone can view predictions" ON public.predictions;
DROP POLICY IF EXISTS "Anyone can insert predictions" ON public.predictions;
DROP POLICY IF EXISTS "Users can update their own predictions" ON public.predictions;

-- Create more restrictive policies for predictions
CREATE POLICY "Public can view predictions" 
ON public.predictions 
FOR SELECT 
USING (true);

CREATE POLICY "Restricted prediction insertion" 
ON public.predictions 
FOR INSERT 
WITH CHECK (
  -- Ensure IP address is provided
  ip_address IS NOT NULL 
  AND length(trim(ip_address)) > 0
  -- Prevent duplicate predictions from same IP for same week
  AND NOT EXISTS (
    SELECT 1 FROM public.predictions 
    WHERE week_ending = NEW.week_ending 
    AND ip_address = NEW.ip_address
  )
  -- Ensure prediction is reasonable (between 1 and 10000)
  AND predicted_price >= 1 
  AND predicted_price <= 10000
);

CREATE POLICY "Users can update their own predictions by IP" 
ON public.predictions 
FOR UPDATE 
USING (true)
WITH CHECK (
  -- Only allow changing predicted price within same week
  OLD.ip_address = NEW.ip_address 
  AND OLD.week_ending = NEW.week_ending
  AND NEW.predicted_price >= 1 
  AND NEW.predicted_price <= 10000
);

-- Create audit logging function for security events
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