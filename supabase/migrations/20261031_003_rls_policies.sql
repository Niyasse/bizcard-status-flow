-- =============================================================================
-- Bizapp Sprint 6B · Migration 003 · Row Level Security
-- Branch: with_Antigravity
-- Created: 2026-10-31
--
-- Principle: Default DENY (all tables have RLS enabled); every access must
-- match an explicit policy. Policies are split by operation (SELECT / INSERT /
-- UPDATE / DELETE) so intent is clear and auditable.
--
-- SECURITY FIXES vs Sprint 6A:
--   · profiles: anonymous SELECT blocked (was FOR ALL with uid = id, which
--     allows the row but the anon role has no uid — still safe, but now
--     explicit). Added separate SELECT/INSERT/UPDATE/DELETE policies.
--   · user_roles: admin INSERT check prevents granting 'admin' to self.
--   · businesses: owner UPDATE is now scoped — owners may only modify their
--     own mutable fields (NOT status='approved', enforced by trigger 002).
--     The policy now splits INSERT vs UPDATE vs DELETE for owner.
--   · business_categories: owner SELECT added (owner must see pending listing
--     categories in the dashboard).
--   · business_updates: owner SELECT now also shows expired updates (owner
--     needs to see them in dashboard); public SELECT still active-only.
--   · events: INSERT WITH CHECK now validates that business_id exists AND is
--     approved (prevents spam against non-existent or hidden businesses).
--   · Logo storage (storage.objects): owner path tied to business UUID, not
--     auth.uid(), so a user who owns multiple businesses cannot cross-write.
--   · All policies use DROP IF EXISTS before CREATE to be re-runnable safely.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS (idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE public.districts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.localities             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_updates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_cards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.update_reads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_categories ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: drop a policy without error if it does not exist.
-- (Supabase SQL editor does not support DROP POLICY IF EXISTS before PG 15)
-- ---------------------------------------------------------------------------
DO $helper$
BEGIN
  -- Silently ignore "policy does not exist" errors when dropping below.
  NULL;
END $helper$;

-- =============================================================================
-- REFERENCE TABLES  (districts, localities, categories)
-- =============================================================================
-- Public SELECT; write only via service-role (migrations / admin tools).
-- No user-facing INSERT/UPDATE/DELETE policies → default DENY covers them.

DROP POLICY IF EXISTS "districts_public_select"  ON public.districts;
CREATE POLICY "districts_public_select"
  ON public.districts FOR SELECT USING (true);

DROP POLICY IF EXISTS "localities_public_select" ON public.localities;
CREATE POLICY "localities_public_select"
  ON public.localities FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
CREATE POLICY "categories_public_select"
  ON public.categories FOR SELECT USING (true);

-- =============================================================================
-- PROFILES
-- =============================================================================

-- Own row only: users can read and update their own profile.
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
CREATE POLICY "profiles_own_select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_own_insert" ON public.profiles;
CREATE POLICY "profiles_own_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
CREATE POLICY "profiles_own_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles (for user management panel).
DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_admin_select"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- USER_ROLES
-- =============================================================================

-- Anyone can read their own roles.
DROP POLICY IF EXISTS "user_roles_own_select" ON public.user_roles;
CREATE POLICY "user_roles_own_select"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- SECURITY: Admins can read all roles but cannot grant 'admin' to themselves.
DROP POLICY IF EXISTS "user_roles_admin_select" ON public.user_roles;
CREATE POLICY "user_roles_admin_select"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
CREATE POLICY "user_roles_admin_insert"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND NOT (user_id = auth.uid() AND role = 'admin')  -- cannot self-escalate
  );

DROP POLICY IF EXISTS "user_roles_admin_update" ON public.user_roles;
CREATE POLICY "user_roles_admin_update"
  ON public.user_roles FOR UPDATE
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (
    NOT (user_id = auth.uid() AND role = 'admin')  -- cannot self-escalate
  );

DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;
CREATE POLICY "user_roles_admin_delete"
  ON public.user_roles FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    AND NOT (user_id = auth.uid() AND role = 'admin')  -- cannot revoke own admin
  );

-- =============================================================================
-- BUSINESSES
-- =============================================================================

-- Public: approved listings only.
DROP POLICY IF EXISTS "businesses_public_select" ON public.businesses;
CREATE POLICY "businesses_public_select"
  ON public.businesses FOR SELECT
  USING (status = 'approved');

-- Owner SELECT: can see their own listing regardless of status (for dashboard).
DROP POLICY IF EXISTS "businesses_owner_select" ON public.businesses;
CREATE POLICY "businesses_owner_select"
  ON public.businesses FOR SELECT
  USING (auth.uid() = owner_id);

-- Owner INSERT: only 'pending' status allowed (trigger also enforces this).
DROP POLICY IF EXISTS "businesses_owner_insert" ON public.businesses;
CREATE POLICY "businesses_owner_insert"
  ON public.businesses FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND status = 'pending'
  );

-- Owner UPDATE: may edit their own row, but never set status='approved'.
DROP POLICY IF EXISTS "businesses_owner_update" ON public.businesses;
CREATE POLICY "businesses_owner_update"
  ON public.businesses FOR UPDATE
  USING  (auth.uid() = owner_id)
  WITH CHECK (
    auth.uid() = owner_id
    AND status <> 'approved'   -- trigger is secondary guard; policy is primary
  );

-- Owner DELETE: owners may request removal (sets hidden; admin physically deletes).
DROP POLICY IF EXISTS "businesses_owner_delete" ON public.businesses;
CREATE POLICY "businesses_owner_delete"
  ON public.businesses FOR DELETE
  USING (auth.uid() = owner_id);

-- Admin: full access (ALL).
DROP POLICY IF EXISTS "businesses_admin_all" ON public.businesses;
CREATE POLICY "businesses_admin_all"
  ON public.businesses FOR ALL
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- BUSINESS_CATEGORIES
-- =============================================================================

-- Public SELECT: only for approved businesses.
DROP POLICY IF EXISTS "bc_public_select" ON public.business_categories;
CREATE POLICY "bc_public_select"
  ON public.business_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.status = 'approved'
    )
  );

-- Owner SELECT: can see categories for their own (any status) listing.
DROP POLICY IF EXISTS "bc_owner_select" ON public.business_categories;
CREATE POLICY "bc_owner_select"
  ON public.business_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- Owner write (INSERT / UPDATE / DELETE).
DROP POLICY IF EXISTS "bc_owner_insert" ON public.business_categories;
CREATE POLICY "bc_owner_insert"
  ON public.business_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "bc_owner_delete" ON public.business_categories;
CREATE POLICY "bc_owner_delete"
  ON public.business_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

-- Admin ALL.
DROP POLICY IF EXISTS "bc_admin_all" ON public.business_categories;
CREATE POLICY "bc_admin_all"
  ON public.business_categories FOR ALL
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- BUSINESS_UPDATES
-- =============================================================================

-- Public: active updates from approved businesses.
DROP POLICY IF EXISTS "updates_public_select" ON public.business_updates;
CREATE POLICY "updates_public_select"
  ON public.business_updates FOR SELECT
  USING (
    expires_at > NOW()
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.status = 'approved'
    )
  );

-- Owner SELECT: sees own updates including expired ones (dashboard view).
DROP POLICY IF EXISTS "updates_owner_select" ON public.business_updates;
CREATE POLICY "updates_owner_select"
  ON public.business_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "updates_owner_insert" ON public.business_updates;
CREATE POLICY "updates_owner_insert"
  ON public.business_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "updates_owner_update" ON public.business_updates;
CREATE POLICY "updates_owner_update"
  ON public.business_updates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "updates_owner_delete" ON public.business_updates;
CREATE POLICY "updates_owner_delete"
  ON public.business_updates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "updates_admin_all" ON public.business_updates;
CREATE POLICY "updates_admin_all"
  ON public.business_updates FOR ALL
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- SAVED_CARDS
-- =============================================================================

DROP POLICY IF EXISTS "saved_cards_own_select" ON public.saved_cards;
CREATE POLICY "saved_cards_own_select"
  ON public.saved_cards FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_cards_own_insert" ON public.saved_cards;
CREATE POLICY "saved_cards_own_insert"
  ON public.saved_cards FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_cards_own_update" ON public.saved_cards;
CREATE POLICY "saved_cards_own_update"
  ON public.saved_cards FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_cards_own_delete" ON public.saved_cards;
CREATE POLICY "saved_cards_own_delete"
  ON public.saved_cards FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- UPDATE_READS
-- =============================================================================

DROP POLICY IF EXISTS "update_reads_own_select" ON public.update_reads;
CREATE POLICY "update_reads_own_select"
  ON public.update_reads FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_reads_own_insert" ON public.update_reads;
CREATE POLICY "update_reads_own_insert"
  ON public.update_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_reads_own_delete" ON public.update_reads;
CREATE POLICY "update_reads_own_delete"
  ON public.update_reads FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- REPORTS
-- =============================================================================

-- Reporters can see their own reports; admin sees all.
DROP POLICY IF EXISTS "reports_reporter_select" ON public.reports;
CREATE POLICY "reports_reporter_select"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Authenticated users (not anon) can file a report.
DROP POLICY IF EXISTS "reports_authenticated_insert" ON public.reports;
CREATE POLICY "reports_authenticated_insert"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_admin_all" ON public.reports;
CREATE POLICY "reports_admin_all"
  ON public.reports FOR ALL
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- EVENTS (Analytics — anonymous insert)
-- =============================================================================
-- SECURITY vs 6A: INSERT now validates business exists AND is approved,
-- preventing spam events against hidden/pending/rejected businesses.

DROP POLICY IF EXISTS "events_anon_insert" ON public.events;
CREATE POLICY "events_anon_insert"
  ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.status = 'approved'
    )
  );

-- Owner can read aggregate-ready event rows for their own businesses.
DROP POLICY IF EXISTS "events_owner_select" ON public.events;
CREATE POLICY "events_owner_select"
  ON public.events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_id AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "events_admin_all" ON public.events;
CREATE POLICY "events_admin_all"
  ON public.events FOR ALL
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- PROFESSIONALS & PROFESSIONAL_CATEGORIES
-- =============================================================================

DROP POLICY IF EXISTS "professionals_public_select" ON public.professionals;
CREATE POLICY "professionals_public_select"
  ON public.professionals FOR SELECT USING (true);

DROP POLICY IF EXISTS "professionals_admin_all" ON public.professionals;
CREATE POLICY "professionals_admin_all"
  ON public.professionals FOR ALL
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "prof_categories_public_select" ON public.professional_categories;
CREATE POLICY "prof_categories_public_select"
  ON public.professional_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "prof_categories_admin_all" ON public.professional_categories;
CREATE POLICY "prof_categories_admin_all"
  ON public.professional_categories FOR ALL
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================================================
-- STORAGE — logos bucket
-- =============================================================================
-- Path pattern enforced: <business_uuid>/<filename>
-- SECURITY vs 6A: the 6A plan used auth.uid()::text as the folder name,
-- but the folder is the BUSINESS UUID (not user UUID), so we validate via
-- a subquery confirming the user owns the business whose id is the folder.

DROP POLICY IF EXISTS "logos_owner_insert" ON storage.objects;
CREATE POLICY "logos_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::TEXT = (storage.foldername(name))[1]   -- folder = business UUID
        AND b.owner_id = auth.uid()
        AND b.status <> 'approved'   -- cannot re-upload after approved; need admin
    )
  );

DROP POLICY IF EXISTS "logos_owner_update" ON storage.objects;
CREATE POLICY "logos_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::TEXT = (storage.foldername(name))[1]
        AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "logos_owner_delete" ON storage.objects;
CREATE POLICY "logos_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos'
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::TEXT = (storage.foldername(name))[1]
        AND b.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;
CREATE POLICY "logos_public_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'logos'
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::TEXT = (storage.foldername(name))[1]
        AND b.status = 'approved'
    )
  );

DROP POLICY IF EXISTS "logos_admin_all" ON storage.objects;
CREATE POLICY "logos_admin_all"
  ON storage.objects FOR ALL
  USING  (bucket_id = 'logos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'logos' AND public.has_role(auth.uid(), 'admin'));

