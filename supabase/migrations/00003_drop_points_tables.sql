-- ═══════════════════════════════════════════
-- Migration 00003: Drop points/credit tables
-- Run this in your Supabase Dashboard SQL Editor
-- ═══════════════════════════════════════════

DROP TABLE IF EXISTS points_transactions CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;
