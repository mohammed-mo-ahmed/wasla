-- ═══════════════════════════════════════════
-- Migration 00002: Create user_api_keys table
-- Run this in your Supabase Dashboard SQL Editor
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_api_keys (
  user_id TEXT PRIMARY KEY,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_api_keys_select" ON user_api_keys;
DROP POLICY IF EXISTS "user_api_keys_insert" ON user_api_keys;
DROP POLICY IF EXISTS "user_api_keys_update" ON user_api_keys;
DROP POLICY IF EXISTS "user_api_keys_delete" ON user_api_keys;

CREATE POLICY "user_api_keys_select" ON user_api_keys
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "user_api_keys_insert" ON user_api_keys
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "user_api_keys_update" ON user_api_keys
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "user_api_keys_delete" ON user_api_keys
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON user_api_keys TO authenticated;
