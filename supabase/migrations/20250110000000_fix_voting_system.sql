-- Fix voting system issues
-- This migration ensures the voting system works properly

-- 1. Ensure upvotes column exists (safe to run multiple times)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'uploads' 
        AND column_name = 'upvotes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.uploads ADD COLUMN upvotes INTEGER DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_uploads_upvotes ON public.uploads(upvotes);
        COMMENT ON COLUMN public.uploads.upvotes IS 'Number of upvotes for this upload';
    END IF;
END $$;

-- 2. Fix RLS policies for user_votes table
-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Service role can manage user votes" ON public.user_votes;

-- Create more appropriate policies
CREATE POLICY "Enable read access for service role" ON public.user_votes
FOR SELECT USING (true);

CREATE POLICY "Enable insert for service role" ON public.user_votes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for service role" ON public.user_votes
FOR DELETE USING (true);

-- 3. Ensure uploads table can be updated for upvotes
-- Check if update policy exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'uploads' 
        AND policyname = 'Enable upvote updates'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Enable upvote updates" ON public.uploads
        FOR UPDATE USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 4. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_votes TO service_role;
GRANT UPDATE ON public.uploads TO service_role;

-- 5. Add helpful comments
COMMENT ON TABLE public.user_votes IS 'Tracks individual user votes to prevent duplicate voting - Fixed RLS policies';
COMMENT ON POLICY "Enable read access for service role" ON public.user_votes IS 'Allows service role to check existing votes';
COMMENT ON POLICY "Enable insert for service role" ON public.user_votes IS 'Allows service role to create new votes';
COMMENT ON POLICY "Enable delete for service role" ON public.user_votes IS 'Allows service role to remove votes (toggle functionality)';
