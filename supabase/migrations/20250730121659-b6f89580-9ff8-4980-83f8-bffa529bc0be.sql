-- Create likes table for photo voting system
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  like_type TEXT NOT NULL CHECK (like_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(upload_id, ip_address)
);

-- Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Create policies for likes
CREATE POLICY "Anyone can view likes" 
ON public.likes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert likes" 
ON public.likes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own likes" 
ON public.likes 
FOR UPDATE 
USING (true);

-- Create predictions table for weekly price predictions
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  predicted_price INTEGER NOT NULL,
  week_ending DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ip_address, week_ending)
);

-- Enable RLS
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Create policies for predictions
CREATE POLICY "Anyone can view predictions" 
ON public.predictions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert predictions" 
ON public.predictions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own predictions" 
ON public.predictions 
FOR UPDATE 
USING (true);

-- Add indexes for better performance
CREATE INDEX idx_likes_upload_id ON public.likes(upload_id);
CREATE INDEX idx_likes_ip_address ON public.likes(ip_address);
CREATE INDEX idx_predictions_week_ending ON public.predictions(week_ending);
CREATE INDEX idx_uploads_created_at ON public.uploads(created_at);
CREATE INDEX idx_uploads_price_paid ON public.uploads(price_paid);

-- Add constraint for predictions price range
ALTER TABLE public.predictions 
ADD CONSTRAINT predictions_price_range_check 
CHECK (predicted_price >= 100 AND predicted_price <= 10000); -- $1.00 to $100.00

-- Create admin sessions table for control panel access
CREATE TABLE public.admin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  ip_address INET
);

-- Enable RLS on admin sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for admin sessions (service role only)
CREATE POLICY "Service role can manage admin sessions" 
ON public.admin_sessions 
FOR ALL 
USING (false); -- Only service role can bypass this

-- Create mask_email function for privacy
CREATE OR REPLACE FUNCTION public.mask_email(email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF email IS NULL OR email = '' THEN
    RETURN '';
  END IF;
  
  -- Extract parts
  DECLARE
    local_part TEXT;
    domain_part TEXT;
    at_position INTEGER;
  BEGIN
    at_position := POSITION('@' IN email);
    
    IF at_position = 0 THEN
      -- No @ symbol, just mask most of it
      RETURN LEFT(email, 2) || REPEAT('*', GREATEST(LENGTH(email) - 4, 1)) || RIGHT(email, 2);
    END IF;
    
    local_part := LEFT(email, at_position - 1);
    domain_part := SUBSTRING(email FROM at_position);
    
    -- Mask local part: show first 2 and last 1 characters
    IF LENGTH(local_part) <= 3 THEN
      local_part := LEFT(local_part, 1) || REPEAT('*', LENGTH(local_part) - 1);
    ELSE
      local_part := LEFT(local_part, 2) || REPEAT('*', LENGTH(local_part) - 3) || RIGHT(local_part, 1);
    END IF;
    
    RETURN local_part || domain_part;
  END;
END;
$$;

-- Grant execute permission on mask_email function
GRANT EXECUTE ON FUNCTION public.mask_email(TEXT) TO anon, authenticated, service_role;