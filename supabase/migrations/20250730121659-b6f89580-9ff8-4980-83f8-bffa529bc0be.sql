-- Revert database changes to remove authentication requirements
-- Update uploads table to remove user_id requirement
ALTER TABLE public.uploads ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.uploads ALTER COLUMN user_id DROP DEFAULT;

-- Update RLS policies to be more permissive for email-based uploads
DROP POLICY IF EXISTS "Authenticated users can insert their own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can update their own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON public.uploads;

-- Create new permissive policies for email-based system
CREATE POLICY "Anyone can view uploads" 
ON public.uploads 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert uploads" 
ON public.uploads 
FOR INSERT 
WITH CHECK (true);

-- Remove upload_sessions table as we'll use Stripe metadata again (but securely)
DROP TABLE IF EXISTS public.upload_sessions;

-- Remove profiles table as we don't need user accounts
DROP TABLE IF EXISTS public.profiles;

-- Remove triggers that reference profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();