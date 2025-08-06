-- Fix the data type issue for likes and predictions tables
ALTER TABLE public.likes ALTER COLUMN ip_address TYPE TEXT;
ALTER TABLE public.predictions ALTER COLUMN ip_address TYPE TEXT;