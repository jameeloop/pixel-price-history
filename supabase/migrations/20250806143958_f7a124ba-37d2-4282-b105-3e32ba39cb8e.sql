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
CREATE INDEX idx_uploads_caption_search ON public.uploads USING gin(to_tsvector('english', caption));