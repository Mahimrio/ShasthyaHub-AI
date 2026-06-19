-- ============================================================
-- ShasthyaHub-AI: Storage Bucket Setup
-- SciBlitz AI Challenge 2026 — Track A (Health & Society)
-- ============================================================

-- ============================================================
-- Create Storage Buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('eye-images', 'eye-images', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('prescription-images', 'prescription-images', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('food-images', 'food-images', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- ============================================================
-- RLS: Users can only access their own folder
-- ============================================================

-- Bucket-level policies for eye-images
CREATE POLICY "Users can view own eye-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'eye-images' AND auth.uid() = (storage.foldername(name))[1]::uuid);

CREATE POLICY "Users can upload own eye-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'eye-images'
    AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Users can update own eye-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'eye-images' AND auth.uid() = (storage.foldername(name))[1]::uuid);

CREATE POLICY "Users can delete own eye-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'eye-images' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Bucket-level policies for prescription-images
CREATE POLICY "Users can view own prescription-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prescription-images' AND auth.uid() = (storage.foldername(name))[1]::uuid);

CREATE POLICY "Users can upload own prescription-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'prescription-images'
    AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Users can update own prescription-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'prescription-images' AND auth.uid() = (storage.foldername(name))[1]::uuid);

CREATE POLICY "Users can delete own prescription-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'prescription-images' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Bucket-level policies for food-images
CREATE POLICY "Users can view own food-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'food-images' AND auth.uid() = (storage.foldername(name))[1]::uuid);

CREATE POLICY "Users can upload own food-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'food-images'
    AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Users can update own food-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'food-images' AND auth.uid() = (storage.foldername(name))[1]::uuid);

CREATE POLICY "Users can delete own food-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'food-images' AND auth.uid() = (storage.foldername(name))[1]::uuid);
