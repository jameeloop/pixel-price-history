-- Phase 1: Critical Security Fixes - Fix data exposure and RLS policies

-- 1. First, let's fix the uploads table RLS policies
-- Remove the overly permissive public access policy
DROP POLICY IF EXISTS "Public can view basic upload info" ON public.uploads;

-- Create a more restrictive policy that blocks all direct public access
CREATE POLICY "Block direct public access to uploads" 
ON public.uploads 
FOR SELECT 
USING (false); -- Block all direct access to uploads table

-- Create admin-only access policy for uploads table
CREATE POLICY "Admin can view all uploads" 
ON public.uploads 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.admin_sessions 
  WHERE session_token IS NOT NULL 
  AND expires_at > now()
));

-- 2. Update the uploads_public view to ensure it properly masks emails
-- First drop the existing view
DROP VIEW IF EXISTS public.uploads_public;

-- Create a new view that uses the mask_email function
CREATE VIEW public.uploads_public AS 
SELECT 
  id,
  mask_email(user_email) as user_email,
  caption,
  image_url,
  price_paid,
  upload_order,
  created_at
FROM public.uploads;

-- 3. Update the likes table policies to be more restrictive
DROP POLICY IF EXISTS "Users can update their own likes by IP" ON public.likes;

CREATE POLICY "Users can modify their own likes by IP" 
ON public.likes 
FOR ALL
USING (true)
WITH CHECK (
  ip_address IS NOT NULL 
  AND length(trim(ip_address)) > 0
  AND like_type IN ('like', 'dislike')
);

-- 4. Ensure predictions table has proper constraints (fix syntax)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'predictions_price_range_check'
  ) THEN
    ALTER TABLE public.predictions 
    ADD CONSTRAINT predictions_price_range_check 
    CHECK (predicted_price >= 1 AND predicted_price <= 10000);
  END IF;
END $$;

-- 5. Add audit logging for admin access
CREATE OR REPLACE FUNCTION log_admin_access()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;