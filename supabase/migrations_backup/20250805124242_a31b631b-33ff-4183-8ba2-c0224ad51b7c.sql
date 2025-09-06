-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Create proper storage policies for uploads bucket
CREATE POLICY "Public read access for uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can update uploads" ON storage.objects
  FOR UPDATE USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can delete uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'uploads');