-- ============================================================
-- Migration 007: Scope chat_messages for page-local AI chat
-- ShasthyaHub-AI — AUST CSE Carnival 8.0
-- Adds a per-agent scope + the analysis the conversation is about so the
-- Nayan AI / ScriptGuard / GlycoVision / Lokhon composers can reload their own
-- history without leaking into the global Shasthya Bondhu widget.
-- Safe to re-run.
-- ============================================================

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS context_id TEXT;

ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_scope_check;
ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_scope_check
  CHECK (scope IN ('global', 'nayan', 'scriptguard', 'glycovision', 'lokhon'));

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_scope_context
  ON chat_messages (user_id, scope, context_id, created_at DESC);

-- Existing own-row RLS policies (chat_select_own / chat_insert_own /
-- chat_delete_own) already cover the new columns; nothing to add.
