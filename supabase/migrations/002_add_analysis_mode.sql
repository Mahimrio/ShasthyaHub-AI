-- ============================================================
-- Migration 002: Add analysis_mode column to analysis tables
-- Tracks whether a result was produced online or offline
-- ============================================================

ALTER TABLE eye_analyses
  ADD COLUMN analysis_mode TEXT DEFAULT 'online'
  CHECK (analysis_mode IN ('online', 'offline'));

ALTER TABLE prescription_analyses
  ADD COLUMN analysis_mode TEXT DEFAULT 'online'
  CHECK (analysis_mode IN ('online', 'offline'));

ALTER TABLE food_analyses
  ADD COLUMN analysis_mode TEXT DEFAULT 'online'
  CHECK (analysis_mode IN ('online', 'offline'));
