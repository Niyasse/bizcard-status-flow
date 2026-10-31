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
