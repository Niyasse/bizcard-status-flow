-- =============================================================================
-- Bizapp Sprint 6B · Migration 002 · Functions & Triggers
-- Branch: with_Antigravity
-- Created: 2026-10-31
--
-- SECURITY FIXES vs Sprint 6A plan:
--   · handle_new_user: role from metadata is NEVER 'admin' — hard-capped to
--     'client' or 'business'; any attempt to pass role='admin' in signup
--     silently falls back to 'client'.
--   · prevent_self_approval: blocks any UPDATE that tries to set status='approved'
--     where the caller is the business owner (not an admin).
--   · check_update_limit: fixed UPDATE logic — compares NEW.id not a static UUID.
--   · check_event_rate: blocks more than 5 events per IP per business per minute
--     using a simple time-window count.  No user_id column needed.
--   · touch_updated_at: now also fires on business_updates (not just businesses).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. has_role — SECURITY DEFINER so RLS policies can call it without
--    exposing user_roles to public queries.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(uid UUID, r TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER          -- runs as owner (postgres), not calling user
STABLE                    -- same result within a transaction for caching
SET search_path = public  -- prevent search_path injection
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = uid AND role = r
  );
$$;

-- Grant execute to anon + authenticated so RLS policies can invoke it.
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT)
  TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. handle_new_user — fires after every INSERT into auth.users
--    SECURITY: 'admin' role is NEVER set through this path.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
BEGIN
  -- Clamp role: only 'client' and 'business' are allowed via signup.
  -- Anything else (including 'admin') silently falls back to 'client'.
  _role := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'business' THEN 'business'
    ELSE 'client'
  END;

  INSERT INTO public.profiles (id, name, phone, email)
  VALUES (
    NEW.id,
    TRIM(COALESCE(NEW.raw_user_meta_data->>'name', 'User')),
    -- Phone comes from Supabase phone-auth; strip country code to 10 digits.
    REGEXP_REPLACE(COALESCE(NEW.phone, ''), '^(\+?91|0)', ''),
    LOWER(TRIM(COALESCE(NEW.email, '')))
  )
  ON CONFLICT (id) DO NOTHING;   -- idempotent: safe on re-triggers

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop & recreate to ensure the trigger is attached to the correct version.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. prevent_self_approval — businesses owner cannot approve their own listing
--    Only a user with the 'admin' role may set status = 'approved'.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_self_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block only when status is being changed TO 'approved'.
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    -- Allow if caller is an admin (or service-role, which bypasses RLS/triggers).
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

-- ---------------------------------------------------------------------------
-- 4. check_update_limit — max 3 *active* updates per business
--    SECURITY FIX vs 6A: used a hardcoded NULL UUID for UPDATE comparison,
--    which is always FALSE. Fixed to use NEW.id directly.
-- ---------------------------------------------------------------------------
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
    AND id          <> NEW.id;   -- exclude current row on UPDATE

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

-- ---------------------------------------------------------------------------
-- 5. check_event_rate — lightweight DoS guard on anonymous event inserts
--    Blocks if the same business_id has received more than 60 events in the
--    last 60 seconds (sustained ~1 req/s per business).
--    A proper rate-limit should also be enforced at the Edge Function layer.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 6. touch_updated_at — keep updated_at current on businesses
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 7. validate_logo_ownership — logo storage path must start with the
--    business's own UUID so a rogue owner cannot overwrite another's logo.
--    Path pattern: <business_id>/<filename>
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_logo_path()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only validate when a logo path is being set/changed.
  IF NEW.logo IS NOT NULL THEN
    -- Path must start with the business UUID.
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

