-- Add upvotes column to uploads table
ALTER TABLE public.uploads ADD COLUMN upvotes INTEGER DEFAULT 0;

-- Add index for efficient sorting by upvotes
CREATE INDEX idx_uploads_upvotes ON public.uploads(upvotes);

-- Add comment for documentation
COMMENT ON COLUMN public.uploads.upvotes IS 'Number of upvotes for this upload';
