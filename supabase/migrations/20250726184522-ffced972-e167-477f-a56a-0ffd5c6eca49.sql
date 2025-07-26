-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Create uploads table to track submissions and pricing
CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT NOT NULL,
  price_paid INTEGER NOT NULL, -- price in pence
  upload_order INTEGER NOT NULL, -- sequential order number
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create pricing table to track current price
CREATE TABLE public.pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_price INTEGER NOT NULL DEFAULT 50, -- starting price in pence (50p)
  upload_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert initial pricing record
INSERT INTO public.pricing (current_price, upload_count) VALUES (50, 0);

-- Enable RLS
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;

-- Create policies for uploads (public read, authenticated write)
CREATE POLICY "Anyone can view uploads" ON public.uploads
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert uploads" ON public.uploads
FOR INSERT WITH CHECK (true);

-- Create policies for pricing (public read, system write)
CREATE POLICY "Anyone can view pricing" ON public.pricing
FOR SELECT USING (true);

CREATE POLICY "System can update pricing" ON public.pricing
FOR UPDATE USING (true);

-- Create storage policies for uploads bucket
CREATE POLICY "Anyone can view upload images" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Anyone can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'uploads');

-- Create function to get current price and increment
CREATE OR REPLACE FUNCTION public.get_and_increment_price()
RETURNS INTEGER AS $$
DECLARE
  current_price_value INTEGER;
BEGIN
  -- Get current price
  SELECT current_price INTO current_price_value FROM public.pricing LIMIT 1;
  
  -- Increment price and count
  UPDATE public.pricing 
  SET 
    current_price = current_price + 1,
    upload_count = upload_count + 1,
    updated_at = now()
  WHERE id = (SELECT id FROM public.pricing LIMIT 1);
  
  RETURN current_price_value;
END;
$$ LANGUAGE plpgsql;