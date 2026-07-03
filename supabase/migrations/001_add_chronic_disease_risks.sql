-- Add missing columns to food_analyses table
ALTER TABLE food_analyses
ADD COLUMN IF NOT EXISTS chronic_disease_risks JSONB,
ADD COLUMN IF NOT EXISTS glucose_impact TEXT;
