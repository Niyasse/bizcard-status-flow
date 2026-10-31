-- =============================================================================
-- BIZAPP — COMPLETE ALL-IN-ONE SUPABASE DATABASE SETUP SCRIPT
-- Project: axxndxlmycrgofxjkzks
-- Run this ONCE in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/axxndxlmycrgofxjkzks/sql/new
-- =============================================================================

BEGIN;

-- =============================================================================
-- SECTION 1: EXTENSIONS & INITIAL SCHEMA
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.districts (
  id   TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9_-]+$'),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.localities (
  id          TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9_-]+$'),
  name        TEXT NOT NULL,
  district_id TEXT NOT NULL REFERENCES public.districts(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_localities_district ON public.localities(district_id);

CREATE TABLE IF NOT EXISTS public.categories (
  id      TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9_-]+$'),
  name    TEXT NOT NULL,
  name_ml TEXT,
  kind    TEXT NOT NULL CHECK (kind IN ('business','service'))
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (length(trim(name)) >= 2),
  phone      TEXT UNIQUE CHECK (phone ~ '^[6-9][0-9]{9}$'),
  email      TEXT CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  language   TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en','ml')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id    UUID  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT  NOT NULL CHECK (role IN ('client','business','admin')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.businesses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  name         TEXT        NOT NULL CHECK (length(trim(name)) >= 2),
  name_ml      TEXT,
  logo         TEXT,
  tagline      TEXT        NOT NULL CHECK (length(trim(tagline)) >= 5),
  phone        TEXT        NOT NULL CHECK (phone ~ '^(\+?91)?[6-9][0-9]{9}$'),
  whatsapp     TEXT        CHECK (whatsapp ~ '^91[6-9][0-9]{9}$'),
  email        TEXT        NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  website      TEXT        CHECK (website ~ '^https?://'),
  address      TEXT        NOT NULL CHECK (length(trim(address)) >= 5),
  district_id  TEXT        NOT NULL REFERENCES public.districts(id)  ON DELETE RESTRICT,
  locality_id  TEXT        NOT NULL REFERENCES public.localities(id) ON DELETE RESTRICT,
  services     TEXT[],
  social       JSONB       DEFAULT '{}'::jsonb,
  template     TEXT        NOT NULL DEFAULT 'default'
                             CHECK (template IN ('default','modern','minimal','bold','elegant','royal')),
  orientation  TEXT        NOT NULL DEFAULT 'landscape'
                             CHECK (orientation IN ('landscape','portrait')),
  status       TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','approved','rejected','hidden')),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fts          TSVECTOR    GENERATED ALWAYS AS (
                  to_tsvector('simple',
                    coalesce(name,'')    || ' ' ||
                    coalesce(name_ml,'') || ' ' ||
                    coalesce(tagline,'') || ' ' ||
                    coalesce(address,'')
                  )
                ) STORED
);

CREATE INDEX IF NOT EXISTS idx_businesses_status   ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_district  ON public.businesses(district_id);
CREATE INDEX IF NOT EXISTS idx_businesses_locality  ON public.businesses(locality_id);
CREATE INDEX IF NOT EXISTS idx_businesses_owner     ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_fts       ON public.businesses USING gin(fts);

CREATE TABLE IF NOT EXISTS public.business_categories (
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (business_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_bc_category ON public.business_categories(category_id);

CREATE TABLE IF NOT EXISTS public.business_updates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  content       TEXT        NOT NULL
                              CHECK (length(trim(content)) > 0 AND length(content) <= 200),
  link_url      TEXT        CHECK (link_url IS NULL OR link_url ~ '^https://'),
  link_title    TEXT,
  link_platform TEXT        CHECK (link_platform IS NULL OR
                                   link_platform IN ('instagram','facebook','website')),
  posted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  CONSTRAINT link_platform_requires_url
    CHECK (link_platform IS NULL OR link_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_updates_business ON public.business_updates(business_id);
CREATE INDEX IF NOT EXISTS idx_updates_expires  ON public.business_updates(expires_at);
CREATE INDEX IF NOT EXISTS idx_updates_business_active
  ON public.business_updates(business_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS public.saved_cards (
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  muted       BOOLEAN     NOT NULL DEFAULT FALSE,
  alerts_off  BOOLEAN     NOT NULL DEFAULT FALSE,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, business_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_user     ON public.saved_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_business ON public.saved_cards(business_id);

CREATE TABLE IF NOT EXISTS public.update_reads (
  user_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  update_id UUID        NOT NULL REFERENCES public.business_updates(id) ON DELETE CASCADE,
  read_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, update_id)
);
CREATE INDEX IF NOT EXISTS idx_update_reads_user ON public.update_reads(user_id);

CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  reporter_id UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason      TEXT        NOT NULL CHECK (length(trim(reason)) >= 5),
  status      TEXT        NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open','resolved','dismissed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_business ON public.reports(business_id);
CREATE INDEX IF NOT EXISTS idx_reports_status   ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created  ON public.reports(created_at DESC);

CREATE TABLE IF NOT EXISTS public.events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID        NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL
                            CHECK (event_type IN ('view','qr_visit','whatsapp_enquiry')),
  ref_id      TEXT        CHECK (ref_id IS NULL OR ref_id ~ '^BZ-[A-Z0-9]+-[A-Z0-9]+$'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_business ON public.events(business_id);
CREATE INDEX IF NOT EXISTS idx_events_type     ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created  ON public.events(business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.professionals (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT    NOT NULL CHECK (length(trim(name)) >= 2),
  profession       TEXT    NOT NULL,
  photo            TEXT,
  phone            TEXT    NOT NULL CHECK (phone ~ '^(\+?91)?[6-9][0-9]{9}$'),
  whatsapp         TEXT    CHECK (whatsapp ~ '^91[6-9][0-9]{9}$'),
  district_id      TEXT    NOT NULL REFERENCES public.districts(id)  ON DELETE RESTRICT,
  locality_id      TEXT    NOT NULL REFERENCES public.localities(id) ON DELETE RESTRICT,
  experience_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0)
);
CREATE INDEX IF NOT EXISTS idx_professionals_district ON public.professionals(district_id);

CREATE TABLE IF NOT EXISTS public.professional_categories (
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  category_id     TEXT NOT NULL REFERENCES public.categories(id)    ON DELETE CASCADE,
  PRIMARY KEY (professional_id, category_id)
);

-- =============================================================================
-- SECTION 2: FUNCTIONS & TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.has_role(uid UUID, r TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role = r
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
BEGIN
  _role := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'business' THEN 'business'
    ELSE 'client'
  END;

  INSERT INTO public.profiles (id, name, phone, email)
  VALUES (
    NEW.id,
    TRIM(COALESCE(NEW.raw_user_meta_data->>'name', 'User')),
    REGEXP_REPLACE(COALESCE(NEW.phone, ''), '^(\+?91|0)', ''),
    LOWER(TRIM(COALESCE(NEW.email, '')))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.prevent_self_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins may approve a business listing'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_approval ON public.businesses;
CREATE TRIGGER trg_prevent_self_approval
  BEFORE UPDATE OF status ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_approval();

CREATE OR REPLACE FUNCTION public.check_update_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO _active_count
  FROM public.business_updates
  WHERE business_id = NEW.business_id
    AND expires_at  > NOW()
    AND id          <> NEW.id;

  IF _active_count >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 active updates allowed per business'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_limit ON public.business_updates;
CREATE TRIGGER trg_update_limit
  BEFORE INSERT OR UPDATE ON public.business_updates
  FOR EACH ROW EXECUTE FUNCTION public.check_update_limit();

CREATE OR REPLACE FUNCTION public.check_event_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _recent INTEGER;
BEGIN
  SELECT COUNT(*) INTO _recent
  FROM public.events
  WHERE business_id = NEW.business_id
    AND created_at  > NOW() - INTERVAL '60 seconds';

  IF _recent >= 60 THEN
    RAISE EXCEPTION 'Event rate limit exceeded; try again later'
      USING ERRCODE = 'too_many_requests';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_rate ON public.events;
CREATE TRIGGER trg_event_rate
  BEFORE INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.check_event_rate();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_businesses_updated_at ON public.businesses;
CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.validate_logo_path()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.logo IS NOT NULL THEN
    IF NOT (NEW.logo LIKE (NEW.id::TEXT || '/%')) THEN
      RAISE EXCEPTION 'Logo path must start with the business UUID'
        USING ERRCODE = 'invalid_parameter_value';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_logo_path ON public.businesses;
CREATE TRIGGER trg_validate_logo_path
  BEFORE INSERT OR UPDATE OF logo ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.validate_logo_path();

-- =============================================================================
-- SECTION 3: ROW LEVEL SECURITY POLICIES
-- =============================================================================

ALTER TABLE public.districts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localities              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_updates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_cards             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.update_reads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_categories  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "districts_public_select"  ON public.districts;
CREATE POLICY "districts_public_select" ON public.districts FOR SELECT USING (true);

DROP POLICY IF EXISTS "localities_public_select" ON public.localities;
CREATE POLICY "localities_public_select" ON public.localities FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
CREATE POLICY "categories_public_select" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_own_insert" ON public.profiles;
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "user_roles_own_select" ON public.user_roles;
CREATE POLICY "user_roles_own_select" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_roles_admin_select" ON public.user_roles;
CREATE POLICY "user_roles_admin_select" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
CREATE POLICY "user_roles_admin_insert" ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND NOT (user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "user_roles_admin_update" ON public.user_roles;
CREATE POLICY "user_roles_admin_update" ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (NOT (user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;
CREATE POLICY "user_roles_admin_delete" ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin') AND NOT (user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "businesses_public_select" ON public.businesses;
CREATE POLICY "businesses_public_select" ON public.businesses FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "businesses_owner_select" ON public.businesses;
CREATE POLICY "businesses_owner_select" ON public.businesses FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "businesses_owner_insert" ON public.businesses;
CREATE POLICY "businesses_owner_insert" ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND status = 'pending');

DROP POLICY IF EXISTS "businesses_owner_update" ON public.businesses;
CREATE POLICY "businesses_owner_update" ON public.businesses FOR UPDATE
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id AND status <> 'approved');

DROP POLICY IF EXISTS "businesses_owner_delete" ON public.businesses;
CREATE POLICY "businesses_owner_delete" ON public.businesses FOR DELETE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "businesses_admin_all" ON public.businesses;
CREATE POLICY "businesses_admin_all" ON public.businesses FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "bc_public_select" ON public.business_categories;
CREATE POLICY "bc_public_select" ON public.business_categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'approved'));

DROP POLICY IF EXISTS "bc_owner_select" ON public.business_categories;
CREATE POLICY "bc_owner_select" ON public.business_categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

DROP POLICY IF EXISTS "bc_owner_insert" ON public.business_categories;
CREATE POLICY "bc_owner_insert" ON public.business_categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

DROP POLICY IF EXISTS "bc_owner_delete" ON public.business_categories;
CREATE POLICY "bc_owner_delete" ON public.business_categories FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

DROP POLICY IF EXISTS "bc_admin_all" ON public.business_categories;
CREATE POLICY "bc_admin_all" ON public.business_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "updates_public_select" ON public.business_updates;
CREATE POLICY "updates_public_select" ON public.business_updates FOR SELECT
  USING (expires_at > NOW() AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'approved'));

DROP POLICY IF EXISTS "updates_owner_select" ON public.business_updates;
CREATE POLICY "updates_owner_select" ON public.business_updates FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

DROP POLICY IF EXISTS "updates_owner_insert" ON public.business_updates;
CREATE POLICY "updates_owner_insert" ON public.business_updates FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

DROP POLICY IF EXISTS "updates_owner_update" ON public.business_updates;
CREATE POLICY "updates_owner_update" ON public.business_updates FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

DROP POLICY IF EXISTS "updates_owner_delete" ON public.business_updates;
CREATE POLICY "updates_owner_delete" ON public.business_updates FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

DROP POLICY IF EXISTS "updates_admin_all" ON public.business_updates;
CREATE POLICY "updates_admin_all" ON public.business_updates FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "saved_cards_own_select" ON public.saved_cards;
CREATE POLICY "saved_cards_own_select" ON public.saved_cards FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_cards_own_insert" ON public.saved_cards;
CREATE POLICY "saved_cards_own_insert" ON public.saved_cards FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_cards_own_update" ON public.saved_cards;
CREATE POLICY "saved_cards_own_update" ON public.saved_cards FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_cards_own_delete" ON public.saved_cards;
CREATE POLICY "saved_cards_own_delete" ON public.saved_cards FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_reads_own_select" ON public.update_reads;
CREATE POLICY "update_reads_own_select" ON public.update_reads FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_reads_own_insert" ON public.update_reads;
CREATE POLICY "update_reads_own_insert" ON public.update_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_reads_own_delete" ON public.update_reads;
CREATE POLICY "update_reads_own_delete" ON public.update_reads FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reports_reporter_select" ON public.reports;
CREATE POLICY "reports_reporter_select" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_authenticated_insert" ON public.reports;
CREATE POLICY "reports_authenticated_insert" ON public.reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_admin_all" ON public.reports;
CREATE POLICY "reports_admin_all" ON public.reports FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "events_anon_insert" ON public.events;
CREATE POLICY "events_anon_insert" ON public.events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'approved'));

DROP POLICY IF EXISTS "events_owner_select" ON public.events;
CREATE POLICY "events_owner_select" ON public.events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

DROP POLICY IF EXISTS "events_admin_all" ON public.events;
CREATE POLICY "events_admin_all" ON public.events FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "professionals_public_select" ON public.professionals;
CREATE POLICY "professionals_public_select" ON public.professionals FOR SELECT USING (true);

DROP POLICY IF EXISTS "professionals_admin_all" ON public.professionals;
CREATE POLICY "professionals_admin_all" ON public.professionals FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "prof_categories_public_select" ON public.professional_categories;
CREATE POLICY "prof_categories_public_select" ON public.professional_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "prof_categories_admin_all" ON public.professional_categories;
CREATE POLICY "prof_categories_admin_all" ON public.professional_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- SECTION 4: STORAGE BUCKET (LOGOS)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  false,
  1048576,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit     = EXCLUDED.file_size_limit,
  allowed_mime_types  = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "logos_owner_insert" ON storage.objects;
CREATE POLICY "logos_owner_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos' AND auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::TEXT = (storage.foldername(name))[1]
        AND b.owner_id = auth.uid()
        AND b.status <> 'approved'
    )
  );

DROP POLICY IF EXISTS "logos_owner_update" ON storage.objects;
CREATE POLICY "logos_owner_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos' AND auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::TEXT = (storage.foldername(name))[1]
        AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "logos_owner_delete" ON storage.objects;
CREATE POLICY "logos_owner_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::TEXT = (storage.foldername(name))[1]
        AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;
CREATE POLICY "logos_public_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::TEXT = (storage.foldername(name))[1]
        AND b.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "logos_admin_all" ON storage.objects;
CREATE POLICY "logos_admin_all" ON storage.objects FOR ALL
  USING (bucket_id = 'logos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'logos' AND public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- SECTION 5: KERALA SEED DATA
-- =============================================================================

INSERT INTO public.districts (id, name) VALUES
  ('tvm',    'Thiruvananthapuram'),
  ('kollam', 'Kollam'),
  ('ptr',    'Pathanamthitta'),
  ('alp',    'Alappuzha'),
  ('ktm',    'Kottayam'),
  ('idukki', 'Idukki'),
  ('ekm',    'Ernakulam'),
  ('tsr',    'Thrissur'),
  ('pkd',    'Palakkad'),
  ('mlp',    'Malappuram'),
  ('kzd',    'Kozhikode'),
  ('wyd',    'Wayanad'),
  ('knr',    'Kannur'),
  ('ksr',    'Kasaragod')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.localities (id, name, district_id) VALUES
  ('kowdiar',      'Kowdiar',          'tvm'),
  ('pattom',       'Pattom',           'tvm'),
  ('kesavadasapuram','Kesavadasapuram', 'tvm'),
  ('kazhakkoottam','Kazhakkoottam',    'tvm'),
  ('chinnakada',   'Chinnakada',       'kollam'),
  ('kottiyam',     'Kottiyam',         'kollam'),
  ('mullakkal',    'Mullakkal',        'alp'),
  ('cherthala',    'Cherthala',        'alp'),
  ('kumarakom',    'Kumarakom',        'ktm'),
  ('changanassery', 'Changanassery',   'ktm'),
  ('kakkanad',     'Kakkanad',         'ekm'),
  ('edappally',    'Edappally',        'ekm'),
  ('fortkochi',    'Fort Kochi',       'ekm'),
  ('mgroad-ekm',   'MG Road',          'ekm'),
  ('aluva',        'Aluva',            'ekm'),
  ('swaraj',       'Swaraj Round',     'tsr'),
  ('irinjalakuda', 'Irinjalakuda',     'tsr'),
  ('olavakkode',   'Olavakkode',       'pkd'),
  ('palakkad-town','Palakkad Town',    'pkd'),
  ('tirur',        'Tirur',            'mlp'),
  ('manjeri',      'Manjeri',          'mlp'),
  ('mavoor',       'Mavoor Road',      'kzd'),
  ('calicut-beach','Calicut Beach',    'kzd'),
  ('kalpetta',     'Kalpetta',         'wyd'),
  ('thalassery',   'Thalassery',       'knr'),
  ('kannur-town',  'Kannur Town',      'knr'),
  ('kasaragod-town','Kasaragod Town',  'ksr')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, name, name_ml, kind) VALUES
  ('bakery',       'Bakery',       'ബേക്കറി',                'business'),
  ('supermarket',  'Supermarket',  'സൂപ്പർമാർക്കറ്റ്',       'business'),
  ('textiles',     'Textiles',     'തുണിക്കട',               'business'),
  ('hotels',       'Hotels',       'ഹോട്ടൽ',                 'business'),
  ('restaurant',   'Restaurant',   'റെസ്റ്റോറന്റ്',          'business'),
  ('travels',      'Travels',      'ട്രാവൽസ്',               'business'),
  ('babyshop',     'Babyshop',     'ബേബി ഷോപ്പ്',            'business'),
  ('jewellery',    'Jewellery',    'ജ്വല്ലറി',               'business'),
  ('ayurveda',     'Ayurveda',     'ആയുർവേദം',              'service'),
  ('healthcare',   'Healthcare',   'ആരോഗ്യം',               'service'),
  ('education',    'Education',    'വിദ്യാഭ്യാസം',           'service'),
  ('electrician',  'Electrician',  'ഇലക്ട്രീഷ്യൻ',          'service'),
  ('plumber',      'Plumber',      'പ്ലംബർ',                 'service'),
  ('catering',     'Catering',     'കേറ്ററിംഗ്',             'business'),
  ('pharmacy',     'Pharmacy',     'മരുന്നുകട',              'business'),
  ('salon',        'Salon',        'സലൂൺ',                   'service'),
  ('automobile',   'Automobile',   'ഓട്ടോമൊബൈൽ',           'business'),
  ('realestate',   'Real Estate',  'റിയൽ എസ്റ്റേറ്റ്',      'business')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.businesses
  (id, owner_id, name, name_ml, logo, tagline, phone, whatsapp, email,
   website, address, district_id, locality_id, services, social,
   template, orientation, status)
VALUES
  (
    'b1a2c3d4-0001-0001-0001-000000000001', NULL,
    'Kochi Bake House', 'കൊച്ചി ബേക്ക് ഹൗസ്', NULL,
    'Plum cakes, puffs & Kerala snacks since 1987',
    '+919847012345', '919847012345', 'hello@kochibake.in',
    'https://kochibake.in', 'Edappally Junction, Kochi, Ernakulam 682024',
    'ekm', 'edappally',
    ARRAY['Plum cake', 'Puffs', 'Samosa', 'Kerala banana chips'],
    '{"instagram":"https://instagram.com","facebook":"https://facebook.com"}',
    'default', 'landscape', 'approved'
  ),
  (
    'b1a2c3d4-0002-0002-0002-000000000002', NULL,
    'Malabar Fresh Mart', 'മലബാർ ഫ്രഷ് മാർട്ട്', NULL,
    'Daily groceries, fish & vegetables delivered',
    '+919446022334', NULL, 'care@malabarfresh.in',
    NULL, 'Mavoor Road, Kozhikode 673004',
    'kzd', 'mavoor',
    ARRAY['Groceries', 'Fresh fish', 'Vegetables', 'Home delivery'],
    '{"facebook":"https://facebook.com"}',
    'modern', 'portrait', 'approved'
  ),
  (
    'b1a2c3d4-0003-0003-0003-000000000003', NULL,
    'Seematti Weaves', 'സീമാട്ടി വീവ്സ്', NULL,
    'Kasavu sarees, set mundu & wedding silks',
    '+919895055667', NULL, 'sales@seemattiweaves.in',
    'https://seemattiweaves.in', 'MG Road, Ernakulam 682035',
    'ekm', 'mgroad-ekm',
    ARRAY['Kasavu saree', 'Set mundu', 'Wedding silk', 'Kurthi'],
    '{"instagram":"https://instagram.com"}',
    'elegant', 'landscape', 'approved'
  ),
  (
    'b1a2c3d4-0004-0004-0004-000000000004', NULL,
    'Kumarakom Lake Retreat', 'കുമരകം ലേക്ക് റിട്രീറ്റ്', NULL,
    'Backwater houseboats & lakeside cottages',
    '+919447188990', NULL, 'stay@kumarakomretreat.in',
    'https://kumarakomretreat.in', 'Kumarakom North, Kottayam 686563',
    'ktm', 'kumarakom',
    ARRAY['Houseboat stay', 'Lakeside cottage', 'Ayurveda package', 'Backwater cruise'],
    '{}',
    'elegant', 'portrait', 'approved'
  ),
  (
    'b1a2c3d4-0005-0005-0005-000000000005', NULL,
    'Sreerag Tours & Travels', 'ശ്രീരാഗ് ടൂർസ്', NULL,
    'Munnar, Thekkady & Wayanad packages',
    '+919744033445', NULL, 'book@sreeragtours.in',
    NULL, 'Swaraj Round East, Thrissur 680001',
    'tsr', 'swaraj',
    ARRAY['Munnar package', 'Thekkady package', 'Wayanad package', 'Airport transfer'],
    '{"instagram":"https://instagram.com","facebook":"https://facebook.com"}',
    'bold', 'landscape', 'approved'
  ),
  (
    'b1a2c3d4-0006-0006-0006-000000000006', NULL,
    'Paragon Family Restaurant', 'പാരഗൺ ഫാമിലി റെസ്റ്റോറന്റ്', NULL,
    'Malabar biryani & seafood thali',
    '+919539077881', NULL, 'info@paragonfamily.in',
    NULL, 'Thalassery Main Road, Kannur 670101',
    'knr', 'thalassery',
    ARRAY['Malabar biryani', 'Seafood thali', 'Prawn curry', 'Pathiri'],
    '{}',
    'default', 'portrait', 'approved'
  ),
  (
    'b1a2c3d4-0007-0007-0007-000000000007', NULL,
    'Kunjus Baby World', 'കുഞ്ഞൂസ് ബേബി വേൾഡ്', NULL,
    'Baby clothing, toys & care essentials',
    '+919037044556', NULL, 'hello@kunjusbaby.in',
    NULL, 'Kowdiar, Thiruvananthapuram 695003',
    'tvm', 'kowdiar',
    ARRAY['Baby clothing', 'Toys', 'Diapers', 'Baby food'],
    '{"instagram":"https://instagram.com"}',
    'minimal', 'landscape', 'approved'
  ),
  (
    'b1a2c3d4-0008-0008-0008-000000000008', NULL,
    'Vaidyaratnam Ayur Clinic', 'വൈദ്യരത്നം ആയുർ ക്ലിനിക്', NULL,
    'Panchakarma & traditional Ayurvedic care',
    '+919495366778', NULL, 'care@vaidyaratnamclinic.in',
    NULL, 'Olavakkode, Palakkad 678002',
    'pkd', 'olavakkode',
    ARRAY['Panchakarma', 'Karkidaka chikitsa', 'Consultation', 'Herbal medicines'],
    '{}',
    'modern', 'portrait', 'approved'
  ),
  (
    'b1a2c3d4-0009-0009-0009-000000000009', NULL,
    'Alleppey Gold Palace', 'ആലപ്പി ഗോൾഡ് പാലസ്', NULL,
    '916 hallmark gold & temple jewellery',
    '+919846199001', NULL, 'info@alleppeygold.in',
    NULL, 'Mullakkal, Alappuzha 688011',
    'alp', 'mullakkal',
    ARRAY['916 gold', 'Temple jewellery', 'Diamond rings', 'Silver articles'],
    '{}',
    'elegant', 'landscape', 'approved'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.business_categories (business_id, category_id) VALUES
  ('b1a2c3d4-0001-0001-0001-000000000001', 'bakery'),
  ('b1a2c3d4-0002-0002-0002-000000000002', 'supermarket'),
  ('b1a2c3d4-0003-0003-0003-000000000003', 'textiles'),
  ('b1a2c3d4-0004-0004-0004-000000000004', 'hotels'),
  ('b1a2c3d4-0004-0004-0004-000000000004', 'travels'),
  ('b1a2c3d4-0005-0005-0005-000000000005', 'travels'),
  ('b1a2c3d4-0006-0006-0006-000000000006', 'restaurant'),
  ('b1a2c3d4-0007-0007-0007-000000000007', 'babyshop'),
  ('b1a2c3d4-0008-0008-0008-000000000008', 'ayurveda'),
  ('b1a2c3d4-0008-0008-0008-000000000008', 'healthcare'),
  ('b1a2c3d4-0009-0009-0009-000000000009', 'jewellery')
ON CONFLICT DO NOTHING;

INSERT INTO public.business_updates
  (id, business_id, content, link_url, link_title, link_platform,
   posted_at, expires_at)
VALUES
  (
    '11111111-0001-0001-0001-000000000001',
    'b1a2c3d4-0001-0001-0001-000000000001',
    'Christmas plum cake pre-orders open! 15% off on 1 kg cakes booked before Dec 15.',
    'https://instagram.com', 'See cakes on Instagram', 'instagram',
    NOW() - INTERVAL '2 hours', NOW() + INTERVAL '30 days'
  ),
  (
    '11111111-0002-0002-0002-000000000002',
    'b1a2c3d4-0002-0002-0002-000000000002',
    'Fresh Kozhikode sardines & mackerel in today. Free home delivery above ₹500 on Mavoor Road.',
    NULL, NULL, NULL,
    NOW() - INTERVAL '4 hours', NOW() + INTERVAL '28 days'
  ),
  (
    '11111111-0003-0003-0003-000000000003',
    'b1a2c3d4-0003-0003-0003-000000000003',
    'Onam kasavu collection is here — flat 20% off on set mundu this week.',
    'https://seemattiweaves.in', 'Browse collection', 'website',
    NOW() - INTERVAL '6 hours', NOW() + INTERVAL '25 days'
  ),
  (
    '11111111-0005-0005-0005-000000000005',
    'b1a2c3d4-0005-0005-0005-000000000005',
    'Munnar 2N/3D family package from ₹6,999 per person. Limited seats for the long weekend.',
    'https://facebook.com', 'Package details on Facebook', 'facebook',
    NOW() - INTERVAL '8 hours', NOW() + INTERVAL '20 days'
  ),
  (
    '11111111-0008-0008-0008-000000000008',
    'b1a2c3d4-0008-0008-0008-000000000008',
    'Karkidaka chikitsa bookings open. Free consultation on Saturdays.',
    NULL, NULL, NULL,
    NOW() - INTERVAL '10 hours', NOW() + INTERVAL '22 days'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.professionals
  (id, name, profession, photo, phone, whatsapp, district_id, locality_id, experience_years)
VALUES
  (
    '22222222-0001-0001-0001-000000000001',
    'Anil Kumar', 'Electrician', NULL,
    '+919846011223', '919846011223', 'ekm', 'kakkanad', 12
  ),
  (
    '22222222-0002-0002-0002-000000000002',
    'Shibu Thomas', 'Plumber', NULL,
    '+919447033221', '919447033221', 'ktm', 'kumarakom', 8
  ),
  (
    '22222222-0003-0003-0003-000000000003',
    'Dr. Lakshmi Menon', 'Ayurveda Physician', NULL,
    '+919048055443', '919048055443', 'tsr', 'swaraj', 15
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.professional_categories (professional_id, category_id) VALUES
  ('22222222-0001-0001-0001-000000000001', 'electrician'),
  ('22222222-0002-0002-0002-000000000002', 'plumber'),
  ('22222222-0003-0003-0003-000000000003', 'ayurveda')
ON CONFLICT DO NOTHING;

COMMIT;
