import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import { businessService, categoryService, locationService } from "@/services";

describe("Sprint 6C — Supabase Database, RLS & Trigger Verification (PGlite)", () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();

    // 1. Setup Supabase prerequisite roles and schemas
    await db.exec(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
          CREATE ROLE anon;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
          CREATE ROLE service_role;
        END IF;
      END
      $$;

      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id UUID PRIMARY KEY,
        email TEXT,
        phone TEXT,
        raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$ LANGUAGE sql STABLE;

      CREATE SCHEMA IF NOT EXISTS storage;
      CREATE TABLE IF NOT EXISTS storage.buckets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        public BOOLEAN DEFAULT false,
        file_size_limit BIGINT,
        allowed_mime_types TEXT[]
      );

      CREATE TABLE IF NOT EXISTS storage.objects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bucket_id TEXT REFERENCES storage.buckets(id),
        name TEXT,
        owner UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB
      );

      CREATE OR REPLACE FUNCTION storage.foldername(name text)
      RETURNS text[] AS $$
        SELECT string_to_array(name, '/');
      $$ LANGUAGE sql IMMUTABLE;
    `);

    // 2. Load migrations
    let m1 = fs.readFileSync("supabase/migrations/20261031_001_initial_schema.sql", "utf8");
    m1 = m1.replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/g, "-- pgcrypto");
    await db.exec(m1);

    const m2 = fs.readFileSync("supabase/migrations/20261031_002_functions_triggers.sql", "utf8");
    await db.exec(m2);

    const m3 = fs.readFileSync("supabase/migrations/20261031_003_rls_policies.sql", "utf8");
    await db.exec(m3);

    const seed = fs.readFileSync("supabase/seed.sql", "utf8");
    await db.exec(seed);

    const storageSetup = fs.readFileSync("supabase/storage_setup.sql", "utf8");
    await db.exec(storageSetup);
  });

  it("seeds 14 Kerala districts, >= 27 localities, and 18 categories", async () => {
    const districts = await db.query("SELECT COUNT(*) as cnt FROM public.districts");
    expect(Number(districts.rows[0].cnt)).toBe(14);

    const localities = await db.query("SELECT COUNT(*) as cnt FROM public.localities");
    expect(Number(localities.rows[0].cnt)).toBeGreaterThanOrEqual(27);

    const categories = await db.query("SELECT COUNT(*) as cnt FROM public.categories");
    expect(Number(categories.rows[0].cnt)).toBeGreaterThanOrEqual(18);
  });

  it("seeds 9 approved businesses and active updates", async () => {
    const businesses = await db.query("SELECT COUNT(*) as cnt FROM public.businesses WHERE status = 'approved'");
    expect(Number(businesses.rows[0].cnt)).toBe(9);

    const updates = await db.query("SELECT COUNT(*) as cnt FROM public.business_updates WHERE expires_at > NOW()");
    expect(Number(updates.rows[0].cnt)).toBeGreaterThanOrEqual(5);
  });

  it("prevents business owner from self-approving their business listing", async () => {
    const ownerId = "00000000-1111-2222-3333-444444444444";
    const bizId = "00000000-aaaa-bbbb-cccc-dddddddddddd";

    // 1. Create a user via auth.users (trigger automatically creates profile & user_roles)
    await db.exec(`
      INSERT INTO auth.users (id, phone, email, raw_user_meta_data)
      VALUES ('${ownerId}', '9876543210', 'owner@biz.com', '{"name": "Owner User", "role": "business"}');
    `);

    // 2. Create a business owned by ownerId in pending status
    await db.exec(`
      INSERT INTO public.businesses (
        id, owner_id, name, tagline, phone, email, address, district_id, locality_id, status
      ) VALUES (
        '${bizId}', '${ownerId}', 'Test Pending Shop', 'Delicious snacks every day',
        '+919876543210', 'test@shop.com', 'Edappally, Kochi', 'ekm', 'edappally', 'pending'
      );
    `);

    // 3. Set context to the non-admin owner
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '${ownerId}', true)`);

    // 4. Attempt to update status to 'approved' — trigger MUST reject
    let threwError = false;
    try {
      await db.exec(`UPDATE public.businesses SET status = 'approved' WHERE id = '${bizId}'`);
    } catch (err: any) {
      threwError = true;
      expect(err.message).toMatch(/Only admins may approve a business listing/i);
    }
    expect(threwError).toBe(true);

    // Verify status remains 'pending'
    const res = await db.query(`SELECT status FROM public.businesses WHERE id = '${bizId}'`);
    expect(res.rows[0].status).toBe("pending");
  });

  it("enforces max 3 active updates trigger", async () => {
    const bizId = "b1a2c3d4-0004-0004-0004-000000000004"; // Kumarakom Retreat

    // Delete existing updates for this biz
    await db.exec(`DELETE FROM public.business_updates WHERE business_id = '${bizId}'`);

    // Insert 3 active updates
    for (let i = 1; i <= 3; i++) {
      await db.exec(`
        INSERT INTO public.business_updates (business_id, content, expires_at)
        VALUES ('${bizId}', 'Active Offer ${i}', NOW() + INTERVAL '${i} day');
      `);
    }

    // 4th insert must throw check_violation error
    let threw = false;
    try {
      await db.exec(`
        INSERT INTO public.business_updates (business_id, content, expires_at)
        VALUES ('${bizId}', 'Active Offer 4 - Exceeds limit', NOW() + INTERVAL '4 day');
      `);
    } catch (err: any) {
      threw = true;
      expect(err.message).toMatch(/Maximum 3 active updates allowed/i);
    }
    expect(threw).toBe(true);
  });

  it("performs FTS on business name, tagline and Malayalam text", async () => {
    const resKochi = await db.query(`
      SELECT id, name FROM public.businesses
      WHERE fts @@ to_tsquery('simple', 'Kochi')
    `);
    expect(resKochi.rows.length).toBeGreaterThanOrEqual(1);
    expect(resKochi.rows[0].name).toBe("Kochi Bake House");

    const resMalayalam = await db.query(`
      SELECT id, name FROM public.businesses
      WHERE fts @@ to_tsquery('simple', 'കൊച്ചി')
    `);
    expect(resMalayalam.rows.length).toBeGreaterThanOrEqual(1);
  });

  it("validates logo storage path constraint to business UUID", async () => {
    const bizId = "b1a2c3d4-0001-0001-0001-000000000001";

    // Valid logo path starting with business id
    await db.exec(`
      UPDATE public.businesses
      SET logo = '${bizId}/logo.png'
      WHERE id = '${bizId}'
    `);

    // Invalid logo path pointing to someone else's folder
    let threw = false;
    try {
      await db.exec(`
        UPDATE public.businesses
        SET logo = 'wrong-folder/logo.png'
        WHERE id = '${bizId}'
      `);
    } catch (err: any) {
      threw = true;
      expect(err.message).toMatch(/Logo path must start with the business UUID/i);
    }
    expect(threw).toBe(true);
  });
});

describe("Sprint 6C — Frontend Service Interfaces & Paginated Search", () => {
  it("fetches reference data through service interface", async () => {
    const districts = await locationService.getDistricts();
    expect(districts.length).toBeGreaterThanOrEqual(9);

    const localities = await locationService.getLocalities("ekm");
    expect(localities.length).toBeGreaterThanOrEqual(1);

    const categories = await categoryService.getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(13);
  }, 15000);

  it("supports paginated business discovery search", async () => {
    const page0 = await businessService.list({ page: 0, pageSize: 3 });
    expect(page0.length).toBe(3);

    const page1 = await businessService.list({ page: 1, pageSize: 3 });
    expect(page1.length).toBe(3);

    // Items on page 0 and page 1 should be distinct
    const ids0 = page0.map((b) => b.id);
    const ids1 = page1.map((b) => b.id);
    expect(ids0.some((id) => ids1.includes(id))).toBe(false);
  }, 15000);

  it("supports category and keyword filter", async () => {
    const bakeries = await businessService.list({ category: "Bakery" });
    expect(bakeries.some((b) => b.name === "Kochi Bake House")).toBe(true);

    const searchRes = await businessService.list({ search: "cake" });
    expect(searchRes.some((b) => b.name === "Kochi Bake House")).toBe(true);
  }, 15000);
});

describe("Sprint 6D — Live Data Integration, RLS Isolation & Analytics (PGlite)", () => {
  let db: PGlite;
  const user1 = "11111111-2222-3333-4444-555555555501";
  const user2 = "11111111-2222-3333-4444-555555555502";
  const ownerId = "11111111-1111-4111-8111-111111111103";
  const adminId = "11111111-1111-4111-8111-111111111101";
  const bizId = "b1a2c3d4-0001-0001-0001-000000000001"; // Kochi Bake House (approved)

  beforeAll(async () => {
    db = new PGlite();

    // 1. Setup prerequisite roles and schemas
    await db.exec(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
          CREATE ROLE anon;
        END IF;
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated;
        END IF;
      END
      $$;

      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id UUID PRIMARY KEY,
        email TEXT,
        phone TEXT,
        raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$ LANGUAGE sql STABLE;

      CREATE SCHEMA IF NOT EXISTS storage;
      CREATE TABLE IF NOT EXISTS storage.buckets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        public BOOLEAN DEFAULT false,
        file_size_limit BIGINT,
        allowed_mime_types TEXT[]
      );

      CREATE TABLE IF NOT EXISTS storage.objects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bucket_id TEXT REFERENCES storage.buckets(id),
        name TEXT,
        owner UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB
      );

      CREATE OR REPLACE FUNCTION storage.foldername(name text)
      RETURNS text[] AS $$
        SELECT string_to_array(name, '/');
      $$ LANGUAGE sql IMMUTABLE;
    `);

    // Load migrations and seed
    let m1 = fs.readFileSync("supabase/migrations/20261031_001_initial_schema.sql", "utf8");
    m1 = m1.replace(/CREATE EXTENSION IF NOT EXISTS "pgcrypto";/g, "-- pgcrypto");
    await db.exec(m1);
    await db.exec(fs.readFileSync("supabase/migrations/20261031_002_functions_triggers.sql", "utf8"));
    await db.exec(fs.readFileSync("supabase/migrations/20261031_003_rls_policies.sql", "utf8"));
    await db.exec(fs.readFileSync("supabase/seed.sql", "utf8"));

    // Enable FORCE ROW LEVEL SECURITY so superuser in PGlite obeys RLS
    await db.exec(`
      ALTER TABLE public.saved_cards FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.update_reads FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.events FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.reports FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.businesses FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.business_updates FORCE ROW LEVEL SECURITY;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
    `);

    // Create test client users & admin & owner
    await db.exec(`
      INSERT INTO auth.users (id, phone, email, raw_user_meta_data)
      VALUES
        ('${user1}', '9000000011', 'user1@test.com', '{"name": "User 1", "role": "client"}'),
        ('${user2}', '9000000012', 'user2@test.com', '{"name": "User 2", "role": "client"}'),
        ('${ownerId}', '9000000013', 'owner@test.com', '{"name": "Owner", "role": "business"}'),
        ('${adminId}', '9000000001', 'admin@b.com', '{"name": "Admin", "role": "admin"}');

      INSERT INTO public.user_roles (user_id, role)
      VALUES ('${adminId}', 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    `);
  });

  it("isolates saved cards between different users via RLS", async () => {
    // Switch to non-superuser authenticated role
    await db.exec(`SET ROLE authenticated;`);

    // User 1 saves bizId and mutes it (is_local = false persists for the session)
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '${user1}', false)`);
    await db.exec(`
      INSERT INTO public.saved_cards (user_id, business_id, muted, alerts_off)
      VALUES ('${user1}', '${bizId}', true, false);
    `);

    // User 1 can see their saved card
    const u1Cards = await db.query(`SELECT * FROM public.saved_cards WHERE user_id = '${user1}'`);
    expect(u1Cards.rows.length).toBe(1);
    expect(u1Cards.rows[0].muted).toBe(true);

    // Switch context to User 2
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '${user2}', false)`);

    // User 2 cannot see User 1's saved cards
    const u2ViewOfU1 = await db.query(`SELECT * FROM public.saved_cards WHERE user_id = '${user1}'`);
    expect(u2ViewOfU1.rows.length).toBe(0);

    // User 2 query all saved_cards returns only their own (0 currently)
    const u2Own = await db.query(`SELECT * FROM public.saved_cards`);
    expect(u2Own.rows.length).toBe(0);

    await db.exec(`RESET ROLE;`);
  });

  it("isolates update read tracking per user via RLS", async () => {
    const updateId = "11111111-0001-0001-0001-000000000001"; // Seeded update

    await db.exec(`SET ROLE authenticated;`);

    // User 1 marks update as read
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '${user1}', false)`);
    await db.exec(`
      INSERT INTO public.update_reads (user_id, update_id)
      VALUES ('${user1}', '${updateId}');
    `);

    const u1Reads = await db.query(`SELECT * FROM public.update_reads`);
    expect(u1Reads.rows.length).toBe(1);

    // Switch to User 2: sees 0 reads
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '${user2}', false)`);
    const u2Reads = await db.query(`SELECT * FROM public.update_reads`);
    expect(u2Reads.rows.length).toBe(0);

    await db.exec(`RESET ROLE;`);
  });

  it("allows anonymous analytics inserts for approved businesses but rejects for pending", async () => {
    // Switch to anon role
    await db.exec(`SET ROLE anon;`);
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '', false)`);

    // Anonymous user inserts view and qr_visit for approved business
    await db.exec(`
      INSERT INTO public.events (business_id, event_type)
      VALUES ('${bizId}', 'view'), ('${bizId}', 'qr_visit');
    `);

    // Insert whatsapp enquiry with valid reference ID format
    await db.exec(`
      INSERT INTO public.events (business_id, event_type, ref_id)
      VALUES ('${bizId}', 'whatsapp_enquiry', 'BZ-KOCHIB-ABC123');
    `);

    // Attempting to insert an event for a non-approved business must fail RLS
    const pendingBizId = "00000000-aaaa-bbbb-cccc-dddddddddddd";
    let threw = false;
    try {
      await db.exec(`
        INSERT INTO public.events (business_id, event_type)
        VALUES ('${pendingBizId}', 'view');
      `);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);

    await db.exec(`RESET ROLE;`);
  });

  it("allows business owner and admin to view analytics events", async () => {
    // Assign ownerId to bizId
    await db.exec(`UPDATE public.businesses SET owner_id = '${ownerId}' WHERE id = '${bizId}';`);

    await db.exec(`SET ROLE authenticated;`);

    // Owner reads events
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '${ownerId}', false)`);
    const ownerEvents = await db.query(`
      SELECT event_type, COUNT(*) as cnt
      FROM public.events
      WHERE business_id = '${bizId}'
      GROUP BY event_type
    `);
    expect(ownerEvents.rows.length).toBeGreaterThanOrEqual(1);

    // Random non-owner client cannot view events for that business
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '${user2}', false)`);
    const unauthorized = await db.query(`
      SELECT * FROM public.events WHERE business_id = '${bizId}'
    `);
    expect(unauthorized.rows.length).toBe(0);

    await db.exec(`RESET ROLE;`);
  });

  it("handles user reports and admin moderation lifecycle", async () => {
    await db.exec(`SET ROLE authenticated;`);

    // 1. User 1 submits a report on bizId
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '${user1}', false)`);
    const reportId = "99999999-9999-4999-8999-999999999999";
    await db.exec(`
      INSERT INTO public.reports (id, business_id, reporter_id, reason, status)
      VALUES ('${reportId}', '${bizId}', '${user1}', 'Phone number unreachable during working hours', 'open');
    `);

    // User 1 sees their report
    const userReports = await db.query(`SELECT * FROM public.reports WHERE id = '${reportId}'`);
    expect(userReports.rows.length).toBe(1);

    // User 2 cannot see User 1's report
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '${user2}', false)`);
    const u2Reports = await db.query(`SELECT * FROM public.reports WHERE id = '${reportId}'`);
    expect(u2Reports.rows.length).toBe(0);

    // Admin sees all reports and resolves it
    await db.exec(`SELECT set_config('request.jwt.claim.sub', '${adminId}', false)`);
    const adminReports = await db.query(`SELECT * FROM public.reports WHERE id = '${reportId}'`);
    expect(adminReports.rows.length).toBe(1);

    await db.exec(`
      UPDATE public.reports SET status = 'resolved' WHERE id = '${reportId}'
    `);

    const updated = await db.query(`SELECT status FROM public.reports WHERE id = '${reportId}'`);
    expect(updated.rows[0].status).toBe("resolved");

    await db.exec(`RESET ROLE;`);
  });
});
