-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Create uploads table to track submissions and pricing
CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  price_paid INTEGER NOT NULL, -- price in cents
  upload_order INTEGER NOT NULL, -- sequential order number
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create pending_uploads table for temporary storage during payment
CREATE TABLE public.pending_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Enable RLS
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for uploads (public read, anyone can insert)
CREATE POLICY "Anyone can view uploads" ON public.uploads
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert uploads" ON public.uploads
FOR INSERT WITH CHECK (true);

-- Create policies for pending_uploads (service role only)
CREATE POLICY "Service role can manage pending uploads" ON public.pending_uploads
FOR ALL USING (false); -- Only service role can bypass this

-- Create storage policies for uploads bucket
CREATE POLICY "Anyone can view upload images" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Anyone can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'uploads');

-- Create function to get next upload price (1 cent increments starting from $1.00)
CREATE OR REPLACE FUNCTION public.get_next_upload_price()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  upload_count INTEGER;
BEGIN
  -- Get current upload count
  SELECT COALESCE(COUNT(*), 0) INTO upload_count FROM public.uploads;
  
  -- Return 100 + upload_count cents ($1.00, $1.01, $1.02, etc.)
  RETURN 100 + upload_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_next_upload_price() TO anon, authenticated, service_role;

-- Create a view for current pricing info
CREATE OR REPLACE VIEW public.current_price AS
SELECT 
  COALESCE(COUNT(*), 0) as current_upload_count,
  COALESCE(COUNT(*), 0) + 1 as next_upload_number,
  100 + COALESCE(COUNT(*), 0) as next_price_cents,
  ROUND((100 + COALESCE(COUNT(*), 0)) / 100.0, 2) as next_price_dollars
FROM public.uploads;

-- Grant permissions on view
GRANT SELECT ON public.current_price TO anon, authenticated, service_role;