-- ============================================================
-- 004: Family System (Poribar / পরিবার) Migration
-- ============================================================

-- 1. Add username to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);

-- Allow authenticated users to search profiles by username/name
DROP POLICY IF EXISTS "Users can search profiles" ON profiles;
CREATE POLICY "Users can search profiles"
  ON profiles FOR SELECT
  USING (TRUE);

-- 2. Family Connections Table
CREATE TABLE IF NOT EXISTS family_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  reverse_relation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT unique_family_pair UNIQUE (requester_id, target_id),
  CONSTRAINT no_self_connection CHECK (requester_id <> target_id)
);

CREATE INDEX IF NOT EXISTS idx_family_connections_requester ON family_connections (requester_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_target ON family_connections (target_id);
CREATE INDEX IF NOT EXISTS idx_family_connections_status ON family_connections (status);

ALTER TABLE family_connections ENABLE ROW LEVEL SECURITY;

-- Select policy: User is either requester or target
DROP POLICY IF EXISTS "Users can view own family connections" ON family_connections;
CREATE POLICY "Users can view own family connections"
  ON family_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- Insert policy: Authenticated user can send invite as requester
DROP POLICY IF EXISTS "Users can create family connection requests" ON family_connections;
CREATE POLICY "Users can create family connection requests"
  ON family_connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Update policy: Either party can update (e.g. target accepts/rejects)
DROP POLICY IF EXISTS "Users can update own family connections" ON family_connections;
CREATE POLICY "Users can update own family connections"
  ON family_connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = target_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = target_id);

-- Delete policy: Either party can remove connection
DROP POLICY IF EXISTS "Users can delete own family connections" ON family_connections;
CREATE POLICY "Users can delete own family connections"
  ON family_connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = target_id);
