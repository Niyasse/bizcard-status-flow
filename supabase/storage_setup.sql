-- =============================================================================
-- Bizapp Sprint 6B · Storage Bucket Bootstrap
-- Branch: with_Antigravity
-- Created: 2026-10-31
--
-- Run ONCE via Supabase SQL Editor or service-role API call after applying
-- migrations 001-003. Creates the `logos` bucket with correct settings.
-- Storage RLS policies are defined in migration 003.
-- =============================================================================

-- Create the logos bucket (idempotent via INSERT ON CONFLICT DO NOTHING)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  false,                                           -- NOT public; served via signed URL or policy
  1048576,                                         -- 1 MB = matches MAX_LOGO_BYTES
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit     = EXCLUDED.file_size_limit,
  allowed_mime_types  = EXCLUDED.allowed_mime_types;

