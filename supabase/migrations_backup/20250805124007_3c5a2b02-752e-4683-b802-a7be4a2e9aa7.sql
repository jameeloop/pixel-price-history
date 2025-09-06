-- Ensure uploads bucket has proper public access policies
CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY IF NOT EXISTS "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads');

CREATE POLICY IF NOT EXISTS "Allow authenticated updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'uploads');

CREATE POLICY IF NOT EXISTS "Allow authenticated deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'uploads');