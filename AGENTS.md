# Project rules

- Shared data models live in `src/types`; keep them flat so they map to future database tables.
- UI never imports `src/data/mockData.ts`; it reads data through `src/services` (async) via hooks in `src/hooks/use-data.ts`, so the backend can be swapped in later without touching screens.
- Customer screens wrap content in `AppShell` (header + `BottomNav`) and use `PageHeader` for titles; don't add per-page headers or footers.
- Colors come from CSS tokens in `src/index.css` (primary/brand, brand-accent, background); don't hardcode hex values in components.
- Business updates are short text offers with an optional external link; no image/video status feed.
- The owner's registered business is stored via `myBusinessService` (localStorage, single record merged into `businessService` results); form rules live in `src/lib/validation.ts` with vitest tests (`bun run test`) — keeps validation testable and storage swappable for the backend.
- Offers, read/alert prefs and tracking (views, QR visits, WhatsApp enquiries) live in `src/services/engagement.ts` as localStorage stores; their rules (max active updates, unread, notifications, reference IDs, permanent `?src=qr` link) are pure functions in `src/lib/engagement.ts` with vitest tests — swappable for the backend later.
- Auth is mocked in `AuthContext` (phone + demo OTP, demo accounts) backed by `userService`; rules (OTP, role homes, route access, listing visibility) are pure functions in `src/lib/auth.ts` with tests. Role-gated routes wrap pages in `RequireRole` (UI-only guard; real enforcement must be backend RLS).
- Admin moderation, reports, users and app settings live in `src/services/admin.ts` localStorage stores; public `businessService.list` returns only approved listings, admin uses `listAll`.
- Backend swap points are documented in `docs/BACKEND_HANDOFF.md`; update it when adding services or models.
- PWA is manifest-only (installable, no service worker); don't add offline caching unless asked.
