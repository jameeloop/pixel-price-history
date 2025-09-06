-- Create pending_uploads table to temporarily store upload data before payment completion
CREATE TABLE public.pending_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  caption TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Enable RLS (though this will be accessed via service key)
ALTER TABLE public.pending_uploads ENABLE ROW LEVEL SECURITY;

-- Policy for service role access
CREATE POLICY "Service role can manage pending uploads" 
ON public.pending_uploads 
FOR ALL 
USING (true);

-- Create index for cleanup
CREATE INDEX idx_pending_uploads_expires_at ON public.pending_uploads(expires_at);

-- Function to cleanup expired pending uploads
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_uploads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.pending_uploads 
  WHERE expires_at < now();
END;
$$;