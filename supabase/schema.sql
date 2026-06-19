-- ============================================================
-- ShasthyaHub-AI: Complete Database Schema
-- SciBlitz AI Challenge 2026 — Track A (Health & Society)
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  district TEXT,
  preferred_language TEXT DEFAULT 'bn',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO profiles (id, name, preferred_language)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'bn')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. EYE ANALYSES TABLE (Nayan AI)
-- ============================================================
CREATE TABLE eye_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  diagnosis TEXT,
  confidence_score DECIMAL(5,2),
  severity TEXT CHECK (severity IN ('Normal', 'Low', 'Medium', 'High', 'Critical')),
  recommendation_en TEXT,
  recommendation_bn TEXT,
  urgency_days INT,
  specialist_needed TEXT,
  gemini_raw_output JSONB,
  groq_processed_output JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE eye_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own eye analyses"
  ON eye_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own eye analyses"
  ON eye_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own eye analyses"
  ON eye_analyses FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. PRESCRIPTION ANALYSES TABLE (ScriptGuard)
-- ============================================================
CREATE TABLE prescription_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  extracted_drugs JSONB,
  interaction_warnings JSONB,
  digital_schedule JSONB,
  digital_schedule_bn JSONB,
  has_dangerous_interactions BOOLEAN DEFAULT FALSE,
  image_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prescription_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prescription analyses"
  ON prescription_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prescription analyses"
  ON prescription_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prescription analyses"
  ON prescription_analyses FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. FOOD ANALYSES TABLE (GlycoVision)
-- ============================================================
CREATE TABLE food_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  identified_items JSONB,
  total_calories DECIMAL(8,2),
  total_carbs_g DECIMAL(8,2),
  total_protein_g DECIMAL(8,2),
  total_fat_g DECIMAL(8,2),
  glycemic_load DECIMAL(6,2),
  risk_level TEXT CHECK (risk_level IN ('Green', 'Yellow', 'Red')),
  risk_summary_en TEXT,
  risk_summary_bn TEXT,
  meal_modifications JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE food_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food analyses"
  ON food_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food analyses"
  ON food_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food analyses"
  ON food_analyses FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. BD DRUGS TABLE (public read-only reference)
-- ============================================================
CREATE TABLE bd_drugs (
  id SERIAL PRIMARY KEY,
  brand_name TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  manufacturer TEXT,
  drug_class TEXT,
  atc_code TEXT,
  common_in_bd BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_bd_drugs_brand_name ON bd_drugs (brand_name);
CREATE INDEX idx_bd_drugs_generic_name ON bd_drugs (generic_name);

ALTER TABLE bd_drugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bd_drugs"
  ON bd_drugs FOR SELECT
  USING (TRUE);

-- ============================================================
-- 6. BD FOOD ITEMS TABLE (public read-only reference)
-- ============================================================
CREATE TABLE bd_food_items (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_bn TEXT,
  calories_per_100g DECIMAL(8,2) NOT NULL,
  carbs_per_100g DECIMAL(8,2),
  protein_per_100g DECIMAL(8,2),
  fat_per_100g DECIMAL(8,2),
  glycemic_index INT,
  category TEXT
);

CREATE INDEX idx_bd_food_items_name_en ON bd_food_items (name_en);

ALTER TABLE bd_food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bd_food_items"
  ON bd_food_items FOR SELECT
  USING (TRUE);
