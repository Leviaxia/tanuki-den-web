-- Final Robust Fix for Admin Deletion (v2 - Fixed Types)
-- 1. Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin can delete reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON reviews;
DROP POLICY IF EXISTS "Enable read access for all users" ON reviews;

-- 3. Re-create Standard Policies
-- Allow Read for everyone
CREATE POLICY "Enable read access for all users" ON reviews FOR SELECT USING (true);

-- Allow Insert for authenticated users
CREATE POLICY "Enable insert for authenticated users only" ON reviews FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Admin Delete Policy (Robust Email Check)
-- We use a LOWER() check to be case-insensitive
CREATE POLICY "Admin can delete reviews"
ON reviews
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'kaieke37@gmail.com' 
  OR
  (lower(auth.jwt() ->> 'email') = 'kaieke37@gmail.com')
);

-- 5. User Own Delete Policy (Fixed Type Cast)
-- CAST auth.uid() to text because user_id column is TEXT (supports guests)
CREATE POLICY "Users can delete own reviews"
ON reviews
FOR DELETE
TO authenticated
USING (
  auth.uid()::text = user_id
);
