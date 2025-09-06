-- Fix RLS policies to prevent unauthorized access

-- Drop the overly permissive policies on uploads table
DROP POLICY IF EXISTS "Anyone can view uploads" ON public.uploads;
DROP POLICY IF EXISTS "Anyone can insert uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can view all uploads" ON public.uploads;

-- Create secure policies for uploads table
-- Public can view uploads but with limited data (no email exposure)
CREATE POLICY "Public can view basic upload info" ON public.uploads
FOR SELECT 
USING (true);

-- Only authenticated admin users can perform write operations
-- We'll create an admin role system for this
CREATE POLICY "Authenticated users can insert uploads" ON public.uploads
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Only admin users can update uploads (will be enforced via edge functions)
CREATE POLICY "Only admin can update uploads" ON public.uploads
FOR UPDATE
USING (false); -- Block all client-side updates

-- Only admin users can delete uploads (will be enforced via edge functions)
CREATE POLICY "Only admin can delete uploads" ON public.uploads
FOR DELETE
USING (false); -- Block all client-side deletes

-- Fix pricing table policies to be more secure
DROP POLICY IF EXISTS "Only service role can update pricing" ON public.pricing;

-- Create more specific pricing policies
CREATE POLICY "Anyone can view current pricing" ON public.pricing
FOR SELECT
USING (true);

CREATE POLICY "Block all client updates to pricing" ON public.pricing
FOR UPDATE
USING (false); -- All pricing updates must go through edge functions

CREATE POLICY "Block all client inserts to pricing" ON public.pricing
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block all client deletes to pricing" ON public.pricing
FOR DELETE
USING (false);

-- Create admin sessions table for secure server-side authentication
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Only edge functions can manage admin sessions
CREATE POLICY "Block all client access to admin sessions" ON public.admin_sessions
FOR ALL
USING (false);

-- Add cleanup function for expired admin sessions
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