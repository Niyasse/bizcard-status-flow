-- =============================================================================
-- Bizapp Sprint 6B · Seed 001 · Kerala Reference Data
-- Branch: with_Antigravity
-- Created: 2026-10-31
--
-- Run via service-role only (bypasses RLS).
-- Safe to re-run: uses INSERT … ON CONFLICT DO NOTHING.
-- Source: src/data/mockData.ts — 9 districts, 13 localities, 13 categories,
--         9 businesses with categories, 3 service professionals, 5 updates.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Districts (14 Kerala revenue districts)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 2. Localities (representative towns per district)
-- ---------------------------------------------------------------------------
INSERT INTO public.localities (id, name, district_id) VALUES
  -- Thiruvananthapuram
  ('kowdiar',      'Kowdiar',          'tvm'),
  ('pattom',       'Pattom',           'tvm'),
  ('kesavadasapuram','Kesavadasapuram', 'tvm'),
  ('kazhakkoottam','Kazhakkoottam',    'tvm'),
  -- Kollam
  ('chinnakada',   'Chinnakada',       'kollam'),
  ('kottiyam',     'Kottiyam',         'kollam'),
  -- Alappuzha
  ('mullakkal',    'Mullakkal',        'alp'),
  ('cherthala',    'Cherthala',        'alp'),
  -- Kottayam
  ('kumarakom',    'Kumarakom',        'ktm'),
  ('changanassery', 'Changanassery',   'ktm'),
  -- Ernakulam
  ('kakkanad',     'Kakkanad',         'ekm'),
  ('edappally',    'Edappally',        'ekm'),
  ('fortkochi',    'Fort Kochi',       'ekm'),
  ('mgroad-ekm',   'MG Road',          'ekm'),
  ('aluva',        'Aluva',            'ekm'),
  -- Thrissur
  ('swaraj',       'Swaraj Round',     'tsr'),
  ('irinjalakuda', 'Irinjalakuda',     'tsr'),
  -- Palakkad
  ('olavakkode',   'Olavakkode',       'pkd'),
  ('palakkad-town','Palakkad Town',    'pkd'),
  -- Malappuram
  ('tirur',        'Tirur',            'mlp'),
  ('manjeri',      'Manjeri',          'mlp'),
  -- Kozhikode
  ('mavoor',       'Mavoor Road',      'kzd'),
  ('calicut-beach','Calicut Beach',    'kzd'),
  -- Wayanad
  ('kalpetta',     'Kalpetta',         'wyd'),
  -- Kannur
  ('thalassery',   'Thalassery',       'knr'),
  ('kannur-town',  'Kannur Town',      'knr'),
  -- Kasaragod
  ('kasaragod-town','Kasaragod Town',  'ksr')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Categories
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4. Demo Businesses
-- Note: UUIDs are fixed so that QR links generated in development remain stable.
-- In production, these would be real registrations. status='approved' is set
-- here via service-role (bypasses the prevent_self_approval trigger — correct).
-- ---------------------------------------------------------------------------

INSERT INTO public.businesses
  (id, owner_id, name, name_ml, logo, tagline, phone, whatsapp, email,
   website, address, district_id, locality_id, services, social,
   template, orientation, status)
VALUES
  (
    'b1a2c3d4-0001-0001-0001-000000000001',
    NULL,
    'Kochi Bake House',
    'കൊച്ചി ബേക്ക് ഹൗസ്',
    NULL,
    'Plum cakes, puffs & Kerala snacks since 1987',
    '+919847012345', '919847012345', 'hello@kochibake.in',
    'https://kochibake.in',
    'Edappally Junction, Kochi, Ernakulam 682024',
    'ekm', 'edappally',
    ARRAY['Plum cake', 'Puffs', 'Samosa', 'Kerala banana chips'],
    '{"instagram":"https://instagram.com","facebook":"https://facebook.com"}',
    'default', 'landscape', 'approved'
  ),
  (
    'b1a2c3d4-0002-0002-0002-000000000002',
    NULL,
    'Malabar Fresh Mart',
    'മലബാർ ഫ്രഷ് മാർട്ട്',
    NULL,
    'Daily groceries, fish & vegetables delivered',
    '+919446022334', NULL, 'care@malabarfresh.in',
    NULL,
    'Mavoor Road, Kozhikode 673004',
    'kzd', 'mavoor',
    ARRAY['Groceries', 'Fresh fish', 'Vegetables', 'Home delivery'],
    '{"facebook":"https://facebook.com"}',
    'modern', 'portrait', 'approved'
  ),
  (
    'b1a2c3d4-0003-0003-0003-000000000003',
    NULL,
    'Seematti Weaves',
    'സീമാട്ടി വീവ്സ്',
    NULL,
    'Kasavu sarees, set mundu & wedding silks',
    '+919895055667', NULL, 'sales@seemattiweaves.in',
    'https://seemattiweaves.in',
    'MG Road, Ernakulam 682035',
    'ekm', 'mgroad-ekm',
    ARRAY['Kasavu saree', 'Set mundu', 'Wedding silk', 'Kurthi'],
    '{"instagram":"https://instagram.com"}',
    'elegant', 'landscape', 'approved'
  ),
  (
    'b1a2c3d4-0004-0004-0004-000000000004',
    NULL,
    'Kumarakom Lake Retreat',
    'കുമരകം ലേക്ക് റിട്രീറ്റ്',
    NULL,
    'Backwater houseboats & lakeside cottages',
    '+919447188990', NULL, 'stay@kumarakomretreat.in',
    'https://kumarakomretreat.in',
    'Kumarakom North, Kottayam 686563',
    'ktm', 'kumarakom',
    ARRAY['Houseboat stay', 'Lakeside cottage', 'Ayurveda package', 'Backwater cruise'],
    '{}',
    'elegant', 'portrait', 'approved'
  ),
  (
    'b1a2c3d4-0005-0005-0005-000000000005',
    NULL,
    'Sreerag Tours & Travels',
    'ശ്രീരാഗ് ടൂർസ്',
    NULL,
    'Munnar, Thekkady & Wayanad packages',
    '+919744033445', NULL, 'book@sreeragtours.in',
    NULL,
    'Swaraj Round East, Thrissur 680001',
    'tsr', 'swaraj',
    ARRAY['Munnar package', 'Thekkady package', 'Wayanad package', 'Airport transfer'],
    '{"instagram":"https://instagram.com","facebook":"https://facebook.com"}',
    'bold', 'landscape', 'approved'
  ),
  (
    'b1a2c3d4-0006-0006-0006-000000000006',
    NULL,
    'Paragon Family Restaurant',
    'പാരഗൺ ഫാമിലി റെസ്റ്റോറന്റ്',
    NULL,
    'Malabar biryani & seafood thali',
    '+919539077881', NULL, 'info@paragonfamily.in',
    NULL,
    'Thalassery Main Road, Kannur 670101',
    'knr', 'thalassery',
    ARRAY['Malabar biryani', 'Seafood thali', 'Prawn curry', 'Pathiri'],
    '{}',
    'default', 'portrait', 'approved'
  ),
  (
    'b1a2c3d4-0007-0007-0007-000000000007',
    NULL,
    'Kunjus Baby World',
    'കുഞ്ഞൂസ് ബേബി വേൾഡ്',
    NULL,
    'Baby clothing, toys & care essentials',
    '+919037044556', NULL, 'hello@kunjusbaby.in',
    NULL,
    'Kowdiar, Thiruvananthapuram 695003',
    'tvm', 'kowdiar',
    ARRAY['Baby clothing', 'Toys', 'Diapers', 'Baby food'],
    '{"instagram":"https://instagram.com"}',
    'minimal', 'landscape', 'approved'
  ),
  (
    'b1a2c3d4-0008-0008-0008-000000000008',
    NULL,
    'Vaidyaratnam Ayur Clinic',
    'വൈദ്യരത്നം ആയുർ ക്ലിനിക്',
    NULL,
    'Panchakarma & traditional Ayurvedic care',
    '+919495366778', NULL, 'care@vaidyaratnamclinic.in',
    NULL,
    'Olavakkode, Palakkad 678002',
    'pkd', 'olavakkode',
    ARRAY['Panchakarma', 'Karkidaka chikitsa', 'Consultation', 'Herbal medicines'],
    '{}',
    'modern', 'portrait', 'approved'
  ),
  (
    'b1a2c3d4-0009-0009-0009-000000000009',
    NULL,
    'Alleppey Gold Palace',
    'ആലപ്പി ഗോൾഡ് പാലസ്',
    NULL,
    '916 hallmark gold & temple jewellery',
    '+919846199001', NULL, 'info@alleppeygold.in',
    NULL,
    'Mullakkal, Alappuzha 688011',
    'alp', 'mullakkal',
    ARRAY['916 gold', 'Temple jewellery', 'Diamond rings', 'Silver articles'],
    '{}',
    'elegant', 'landscape', 'approved'
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Business → Category mappings
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 6. Business Updates (offers — expires set 30 days from seed date)
-- ---------------------------------------------------------------------------
INSERT INTO public.business_updates
  (id, business_id, content, link_url, link_title, link_platform,
   posted_at, expires_at)
VALUES
  (
    '11111111-0001-0001-0001-000000000001',
    'b1a2c3d4-0001-0001-0001-000000000001',
    'Christmas plum cake pre-orders open! 15% off on 1 kg cakes booked before Dec 15.',
    'https://instagram.com', 'See cakes on Instagram', 'instagram',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '30 days'
  ),
  (
    '11111111-0002-0002-0002-000000000002',
    'b1a2c3d4-0002-0002-0002-000000000002',
    'Fresh Kozhikode sardines & mackerel in today. Free home delivery above ₹500 on Mavoor Road.',
    NULL, NULL, NULL,
    NOW() - INTERVAL '4 hours',
    NOW() + INTERVAL '28 days'
  ),
  (
    '11111111-0003-0003-0003-000000000003',
    'b1a2c3d4-0003-0003-0003-000000000003',
    'Onam kasavu collection is here — flat 20% off on set mundu this week.',
    'https://seemattiweaves.in', 'Browse collection', 'website',
    NOW() - INTERVAL '6 hours',
    NOW() + INTERVAL '25 days'
  ),
  (
    '11111111-0005-0005-0005-000000000005',
    'b1a2c3d4-0005-0005-0005-000000000005',
    'Munnar 2N/3D family package from ₹6,999 per person. Limited seats for the long weekend.',
    'https://facebook.com', 'Package details on Facebook', 'facebook',
    NOW() - INTERVAL '8 hours',
    NOW() + INTERVAL '20 days'
  ),
  (
    '11111111-0008-0008-0008-000000000008',
    'b1a2c3d4-0008-0008-0008-000000000008',
    'Karkidaka chikitsa bookings open. Free consultation on Saturdays.',
    NULL, NULL, NULL,
    NOW() - INTERVAL '10 hours',
    NOW() + INTERVAL '22 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Service Professionals
-- ---------------------------------------------------------------------------
INSERT INTO public.professionals
  (id, name, profession, photo, phone, whatsapp, district_id, locality_id, experience_years)
VALUES
  (
    '22222222-0001-0001-0001-000000000001',
    'Anil Kumar', 'Electrician', NULL,
    '+919846011223', '919846011223',
    'ekm', 'kakkanad', 12
  ),
  (
    '22222222-0002-0002-0002-000000000002',
    'Shibu Thomas', 'Plumber', NULL,
    '+919447033221', '919447033221',
    'ktm', 'kumarakom', 8
  ),
  (
    '22222222-0003-0003-0003-000000000003',
    'Dr. Lakshmi Menon', 'Ayurveda Physician', NULL,
    '+919048055443', '919048055443',
    'tsr', 'swaraj', 15
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.professional_categories (professional_id, category_id) VALUES
  ('22222222-0001-0001-0001-000000000001', 'electrician'),
  ('22222222-0002-0002-0002-000000000002', 'plumber'),
  ('22222222-0003-0003-0003-000000000003', 'ayurveda')
ON CONFLICT DO NOTHING;

