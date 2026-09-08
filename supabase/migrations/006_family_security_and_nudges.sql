-- ============================================================
-- Migration 006: Family security hardening + caregiver nudges
-- ShasthyaHub-AI — AUST CSE Carnival 8.0
-- Fixes from the 2026-09-08 security scan of migration 004.
-- ============================================================

-- 1. PROFILE VISIBILITY
-- 004 opened profiles to every authenticated user (USING TRUE).
-- Restrict to: own row, or an accepted family connection.
-- Family search continues to work through the service-role API route.
DROP POLICY IF EXISTS "Users can search profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own or family profiles" ON profiles;
CREATE POLICY "Users can view own or family profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM family_connections fc
      WHERE fc.status = 'accepted'
        AND ((fc.requester_id = auth.uid() AND fc.target_id = profiles.id)
          OR (fc.target_id = auth.uid() AND fc.requester_id = profiles.id))
    )
  );

-- 2. INVITATION ACCEPTANCE
-- 004 let either party UPDATE a connection, so a requester could accept
-- their own invitation. Only the invited target may change status.
DROP POLICY IF EXISTS "Users can update own family connections" ON family_connections;
DROP POLICY IF EXISTS "Invited user can respond to family connections" ON family_connections;
CREATE POLICY "Invited user can respond to family connections"
  ON family_connections FOR UPDATE
  USING (auth.uid() = target_id)
  WITH CHECK (auth.uid() = target_id);

-- 3. SIGNUP TRIGGER
-- SECURITY DEFINER with an empty search_path requires schema-qualified names.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, preferred_language)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'bn')
  );
  RETURN NEW;
END;
$$;

-- 4. CAREGIVER NUDGES
-- Previously the nudge endpoint returned success without storing anything.
CREATE TABLE IF NOT EXISTS caregiver_nudges (
  id TEXT PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_relation TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen_at TIMESTAMPTZ,
  CONSTRAINT nudge_not_self CHECK (sender_id <> target_id)
);

ALTER TABLE caregiver_nudges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view nudges" ON caregiver_nudges;
CREATE POLICY "Participants can view nudges"
  ON caregiver_nudges FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = target_id);

-- Sender must hold an accepted connection to the target.
DROP POLICY IF EXISTS "Connected family can send nudges" ON caregiver_nudges;
CREATE POLICY "Connected family can send nudges"
  ON caregiver_nudges FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM family_connections fc
      WHERE fc.status = 'accepted'
        AND ((fc.requester_id = sender_id AND fc.target_id = target_id)
          OR (fc.target_id = sender_id AND fc.requester_id = target_id))
    )
  );

DROP POLICY IF EXISTS "Recipient can mark nudges seen" ON caregiver_nudges;
CREATE POLICY "Recipient can mark nudges seen"
  ON caregiver_nudges FOR UPDATE
  USING (auth.uid() = target_id)
  WITH CHECK (auth.uid() = target_id);

CREATE INDEX IF NOT EXISTS idx_caregiver_nudges_target_unseen
  ON caregiver_nudges (target_id, created_at DESC) WHERE seen_at IS NULL;
