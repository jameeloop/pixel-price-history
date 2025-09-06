-- Create user_votes table to track individual user votes
CREATE TABLE public.user_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
  user_ip TEXT NOT NULL,
  voted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(upload_id, user_ip)
);

-- Enable RLS
ALTER TABLE public.user_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for user_votes (service role only)
CREATE POLICY "Service role can manage user votes" ON public.user_votes
FOR ALL USING (false); -- Only service role can bypass this

-- Add index for efficient lookups
CREATE INDEX idx_user_votes_upload_id ON public.user_votes(upload_id);
CREATE INDEX idx_user_votes_user_ip ON public.user_votes(user_ip);

-- Add comment for documentation
COMMENT ON TABLE public.user_votes IS 'Tracks individual user votes to prevent duplicate voting';
COMMENT ON COLUMN public.user_votes.user_ip IS 'IP address of the user who voted';
COMMENT ON COLUMN public.user_votes.voted IS 'Whether the user has voted (always true when record exists)';
