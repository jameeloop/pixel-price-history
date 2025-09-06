-- Create secure session storage for upload data
CREATE TABLE public.upload_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  image_data TEXT NOT NULL,
  image_name TEXT NOT NULL,
  image_type TEXT NOT NULL,
  caption TEXT NOT NULL,
  price_paid INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Enable RLS
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for upload sessions (only service role can access)
CREATE POLICY "Service role can manage upload sessions" 
ON public.upload_sessions 
FOR ALL 
USING (false); -- Only service role can bypass this

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.upload_sessions 
  WHERE expires_at < now();
END;
$$;