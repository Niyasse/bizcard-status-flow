# Bizapp — Backend Handoff (for Google Antigravity / Supabase)

The frontend is complete against mock data. Every screen reads data through `src/services` (async or external stores) and hooks in `src/hooks/use-data.ts`. Swap service internals for Supabase calls; screens should not change.

## 1. Data models (`src/types/index.ts`) → tables

| Model | Table | Key fields | Notes |
|---|---|---|---|
| District | `districts` | id, name | seed data |
| Locality | `localities` | id, name, district_id → districts | seed data |
| Category | `categories` | id, name, name_ml, kind (business/service) | seed data |
| Business | `businesses` | id, owner_id → auth.users, name, name_ml, logo, tagline, phone, whatsapp, email, website, address, district_id, locality_id, services text[], social jsonb, template, orientation, updated_at | `tags` is derived from categories — don't store |
| (join) | `business_categories` | business_id, category_id | replaces `categoryIds[]` |
| ListingStatus | `businesses.status` | pending / approved / rejected / hidden | only `approved` is public |
| BusinessUpdate | `business_updates` | id, business_id, content, link_url, link_title, link_platform, posted_at, expires_at | max 3 active per business (enforce with trigger) |
| AppUser | `profiles` | id → auth.users, name, phone, email | **roles in separate `user_roles` table** (client/business/admin) — never on profiles |
| Wallet | `saved_cards` | user_id, business_id, muted bool, alerts_off bool | saving = following |
| Read state | `update_reads` | user_id, update_id, read_at | |
| Report | `reports` | id, business_id, reporter_id, reason, status (open/resolved/dismissed), created_at | |
| Tracking | `events` | id, business_id, type (view/qr_visit/whatsapp_enquiry), ref_id, created_at | dashboard counts = aggregates |
| ServiceProfessional | `professionals` | as model | |
| CardTemplate | static in code | | no table needed |

## 2. Service methods → mock-data replacement points

| Service (file) | Methods | Replace with |
|---|---|---|
| `locationService`, `categoryService` (services/index.ts) | getDistricts, getLocalities, getCategories | `select` from seed tables |
| `businessService` | list(filter) (approved only), listAll() (admin), getById | `select … where status='approved'` + filters; full-text search on name/name_ml/tagline/category |
| `myBusinessService` | get, save, remove | `businesses` row where owner_id = auth.uid() (save inserts with status `pending`) |
| `updateService`, `ownUpdateService` (engagement.ts) | list, save, remove | `business_updates` (active = expires_at > now()) |
| `walletService` | get, toggleSave, toggleMute, followedUpdates | `saved_cards` |
| `prefsService` | markRead, toggleAlerts | `update_reads`, `saved_cards.alerts_off` |
| `trackingService` | logView, logQrVisit, logEnquiry | insert into `events` (anon allowed, rate-limited) |
| `moderationService` (admin.ts) | statusOf, setStatus | `businesses.status` update — admin only |
| `reportService` | list, add, setStatus | `reports` |
| `userService` | list, findByPhone, findByEmail, upsert | `profiles` + `user_roles` (admin list only) |
| `AuthContext` (contexts/AuthContext.tsx) | login, loginWithOtp, signup, updateProfile, logout | Supabase phone OTP (`signInWithOtp`/`verifyOtp`), `onAuthStateChange`; demo accounts and `MOCK_OTP` removed |
| `settingsStore` | language | can stay local, or `profiles.language` |
| `recentSearchService` | get/add/clear | stays local |

`src/data/mockData.ts` becomes seed SQL; delete it once every service is switched.

## 3. API / security requirements
- RLS on every table. Public read: approved businesses, active updates, seed tables. Owners write only their own business/updates. Admin checks via `has_role(auth.uid(), 'admin')` security-definer function.
- Route guards (`RequireRole`) are UI only — real access control must be RLS.
- Phone OTP via an SMS provider (Twilio/MSG91) configured in auth.
- Logo uploads → storage bucket `logos` (≤1 MB, images only — matches `src/lib/validation.ts`).
- QR links are permanent: `/profile/:id?src=qr` — keep business ids stable (uuid).
- WhatsApp enquiry reference IDs are generated client-side (`makeReferenceId`) and logged as events.
- Notifications are in-app only (derived from unread updates of followed, alerts-on businesses). No push.

## 4. Business rules with tests (keep passing: `bunx vitest run`)
- `src/lib/validation.ts` — registration form rules
- `src/lib/engagement.ts` — 3 active updates, unread, notifications, reference IDs, QR link
- `src/lib/auth.ts` — OTP, phone format, role homes, route access, moderation visibility
