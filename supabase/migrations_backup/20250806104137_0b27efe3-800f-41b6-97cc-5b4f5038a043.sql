-- Update Stripe secrets to live environment
-- This will be handled via the Supabase dashboard secrets management

-- Note: The actual secret updates need to be done via Supabase CLI or dashboard
-- STRIPE_SECRET_KEY should be updated to: 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
-- STRIPE_WEBHOOK_SECRET should be updated to: whsec_F8DHdKkJBQnJ9xVohJB4jC4yFG5BhEvw

SELECT 'Stripe secrets need to be updated in Supabase dashboard or CLI' as notice;