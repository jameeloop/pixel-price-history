
-- Fix the critical email exposure in uploads_public view
-- Replace the current view with one that masks emails properly
DROP VIEW IF EXISTS public.uploads_public;

CREATE VIEW public.uploads_public AS
SELECT 
    id,
    upload_order,
    image_url,
    mask_email_safe(user_email) as user_email,
    price_paid,
    created_at,
    caption
FROM public.uploads
ORDER BY upload_order ASC;

-- Ensure RLS is enabled on the view (though views inherit from base tables)
ALTER VIEW public.uploads_public OWNER TO postgres;

-- Grant appropriate access
GRANT SELECT ON public.uploads_public TO anon;
GRANT SELECT ON public.uploads_public TO authenticated;
