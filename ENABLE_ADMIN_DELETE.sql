-- Enable RLS (if not already enabled)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to delete their own reviews (optional, but good practice)
-- DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
-- CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policy to allow Admin to delete ANY review
-- Specifically checks if the authenticated user's email matches 'kaieke37@gmail.com'
-- This relies on the JWT containing the email.
DROP POLICY IF EXISTS "Admin can delete reviews" ON reviews;

CREATE POLICY "Admin can delete reviews"
ON reviews
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'kaieke37@gmail.com'
);

-- Ensure authenticated users can still insert/select (re-affirming previous fixes)
-- (These might already exist, but this ensures the admin capabilities don't block normal usage if policies are restrictive)
-- We assume SELECT and INSERT policies are already handled by FIX_DB_PERMISSIONS.sql
