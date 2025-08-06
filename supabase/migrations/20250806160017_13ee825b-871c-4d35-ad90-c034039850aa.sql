-- Add function to better mask emails at database level
CREATE OR REPLACE FUNCTION public.mask_email(email_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create audit log table for sensitive operations
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow reading audit logs (no public access to create/update/delete)
CREATE POLICY "Block all client access to audit logs" 
ON public.audit_logs 
FOR ALL 
USING (false);

-- Add a view for safely displaying uploads with masked emails
CREATE OR REPLACE VIEW public.uploads_public AS
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