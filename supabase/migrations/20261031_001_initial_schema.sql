-- =============================================================================
-- Bizapp Sprint 6B · Migration 001 · Initial Schema
-- Branch: with_Antigravity
-- Created: 2026-10-31
--
-- SECURITY FIXES vs Sprint 6A plan:
--   · FTS uses a GENERATED column (not a function index) so .textSearch('fts',…)
--     works correctly with the Supabase PostgREST client.
--   · `businesses.status` constraint tightened — owner INSERT cannot include
--     status='approved'; enforced by the prevent_self_approval trigger (migration 003).
--   · `events` table drops the per-row `user_id` — analytics are anonymous;
--     a rate-limit guard is in migration 003.
--   · `professional_categories` added here alongside `professionals`.
--   · All TEXT CHECK constraints normalised to lowercase for consistency.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid() on older PG
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- accent-insensitive FTS

-- ---------------------------------------------------------------------------
-- 1. Reference / Seed Tables (public read-only after seeding)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS districts (
  id   TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9_-]+$'),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS localities (
  id          TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9_-]+$'),
  name        TEXT NOT NULL,
  district_id TEXT NOT NULL REFERENCES districts(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_localities_district ON localities(district_id);

CREATE TABLE IF NOT EXISTS categories (
  id      TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9_-]+$'),
  name    TEXT NOT NULL,
  name_ml TEXT,
  kind    TEXT NOT NULL CHECK (kind IN ('business','service'))
);

-- ---------------------------------------------------------------------------
-- 2. User Profiles & Roles
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (length(trim(name)) >= 2),
  -- Normalised 10-digit Indian mobile (no country code, no spaces/dashes)
  phone      TEXT UNIQUE CHECK (phone ~ '^[6-9][0-9]{9}$'),
  email      TEXT CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  language   TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','ml')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles are a separate table so admin grants can be audited and revoked cleanly.
-- SECURITY: valid roles are strictly 'client' | 'business' — 'admin' is never
-- inserted here by user-facing code; it is inserted only by service-role scripts
-- or via Supabase dashboard by a human operator.
CREATE TABLE IF NOT EXISTS user_roles (
  user_id    UUID  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT  NOT NULL CHECK (role IN ('client','business','admin')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

-- ---------------------------------------------------------------------------
-- 3. Businesses
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS businesses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  name         TEXT        NOT NULL CHECK (length(trim(name)) >= 2),
  name_ml      TEXT,
  -- Storage path only (no full URL stored); resolved to public URL at read time.
  logo         TEXT,
  tagline      TEXT        NOT NULL CHECK (length(trim(tagline)) >= 5),
  phone        TEXT        NOT NULL CHECK (phone ~ '^(\+?91)?[6-9][0-9]{9}$'),
  whatsapp     TEXT        CHECK (whatsapp ~ '^91[6-9][0-9]{9}$'),  -- with country code
  email        TEXT        NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  website      TEXT        CHECK (website ~ '^https?://'),
  address      TEXT        NOT NULL CHECK (length(trim(address)) >= 5),
  district_id  TEXT        NOT NULL REFERENCES districts(id)  ON DELETE RESTRICT,
  locality_id  TEXT        NOT NULL REFERENCES localities(id) ON DELETE RESTRICT,
  services     TEXT[],
  social       JSONB       DEFAULT '{}'::jsonb,
  template     TEXT        NOT NULL DEFAULT 'default'
                             CHECK (template IN ('default','modern','minimal','bold','elegant','royal')),
  orientation  TEXT        NOT NULL DEFAULT 'landscape'
                             CHECK (orientation IN ('landscape','portrait')),
  -- SECURITY: owners may never self-approve; only 'pending'|'rejected'|'hidden'
  -- are settable by owner; 'approved' is set only by admins (trigger 003).
  status       TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','rejected','hidden')),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- FTS: generated column so PostgREST .textSearch('fts') works out of the box.
  -- Uses 'simple' config (no stemming) to support Malayalam tokens unchanged.
  fts          TSVECTOR    GENERATED ALWAYS AS (
                  to_tsvector('simple',
                    unaccent(coalesce(name,''))    || ' ' ||
                    coalesce(name_ml,'')           || ' ' ||
                    unaccent(coalesce(tagline,'')) || ' ' ||
                    unaccent(coalesce(address,''))
                  )
                ) STORED
);

CREATE INDEX IF NOT EXISTS idx_businesses_status   ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_district  ON businesses(district_id);
CREATE INDEX IF NOT EXISTS idx_businesses_locality  ON businesses(locality_id);
CREATE INDEX IF NOT EXISTS idx_businesses_owner     ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_fts       ON businesses USING gin(fts);

-- ---------------------------------------------------------------------------
-- 4. Business → Category join
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS business_categories (
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (business_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_bc_category ON business_categories(category_id);

-- ---------------------------------------------------------------------------
-- 5. Business Updates (Offers)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS business_updates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  content       TEXT        NOT NULL
                              CHECK (length(trim(content)) > 0 AND length(content) <= 200),
  link_url      TEXT        CHECK (link_url IS NULL OR link_url ~ '^https://'),
  link_title    TEXT,
  link_platform TEXT        CHECK (link_platform IS NULL OR
                                   link_platform IN ('instagram','facebook','website')),
  posted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL
                              CHECK (expires_at > NOW()),   -- validated on insert
  CONSTRAINT link_platform_requires_url
    CHECK (link_platform IS NULL OR link_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_updates_business ON business_updates(business_id);
CREATE INDEX IF NOT EXISTS idx_updates_expires  ON business_updates(expires_at);
-- Composite: typical query is "active updates for a business"
CREATE INDEX IF NOT EXISTS idx_updates_business_active
  ON business_updates(business_id, expires_at DESC);

-- ---------------------------------------------------------------------------
-- 6. Saved Cards (Wallet)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS saved_cards (
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  muted       BOOLEAN     NOT NULL DEFAULT FALSE,
  alerts_off  BOOLEAN     NOT NULL DEFAULT FALSE,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, business_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_user     ON saved_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_business ON saved_cards(business_id);

-- ---------------------------------------------------------------------------
-- 7. Update Reads
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS update_reads (
  user_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  update_id UUID        NOT NULL REFERENCES business_updates(id) ON DELETE CASCADE,
  read_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, update_id)
);
CREATE INDEX IF NOT EXISTS idx_update_reads_user ON update_reads(user_id);

-- ---------------------------------------------------------------------------
-- 8. Reports
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  reporter_id UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  reason      TEXT        NOT NULL CHECK (length(trim(reason)) >= 5),
  status      TEXT        NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open','resolved','dismissed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_business ON reports(business_id);
CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created  ON reports(created_at DESC);

-- ---------------------------------------------------------------------------
-- 9. Events (Analytics — fully anonymous)
-- ---------------------------------------------------------------------------
-- SECURITY vs 6A: No user_id stored here at all.
-- Storing user_id would allow linking behaviour across businesses, which is a
-- privacy risk. Dashboard aggregates are counts only; no identity needed.
-- Rate-limiting is enforced by the check_event_rate trigger (migration 003).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL
                            CHECK (event_type IN ('view','qr_visit','whatsapp_enquiry')),
  -- BZ-XXXXXX-XXXXXX for whatsapp_enquiry rows; NULL for view/qr_visit
  ref_id      TEXT        CHECK (ref_id IS NULL OR ref_id ~ '^BZ-[A-Z0-9]+-[A-Z0-9]+$'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_business ON events(business_id);
CREATE INDEX IF NOT EXISTS idx_events_type     ON events(event_type);
-- Range queries for dashboard: last 7 / 30 days
CREATE INDEX IF NOT EXISTS idx_events_created  ON events(business_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 10. Service Professionals
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS professionals (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT    NOT NULL CHECK (length(trim(name)) >= 2),
  profession       TEXT    NOT NULL,
  photo            TEXT,
  phone            TEXT    NOT NULL CHECK (phone ~ '^(\+?91)?[6-9][0-9]{9}$'),
  whatsapp         TEXT    CHECK (whatsapp ~ '^91[6-9][0-9]{9}$'),
  district_id      TEXT    NOT NULL REFERENCES districts(id)  ON DELETE RESTRICT,
  locality_id      TEXT    NOT NULL REFERENCES localities(id) ON DELETE RESTRICT,
  experience_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0)
);
CREATE INDEX IF NOT EXISTS idx_professionals_district ON professionals(district_id);

CREATE TABLE IF NOT EXISTS professional_categories (
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  category_id     TEXT NOT NULL REFERENCES categories(id)    ON DELETE CASCADE,
  PRIMARY KEY (professional_id, category_id)
);
