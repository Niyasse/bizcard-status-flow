# Sprint 2 — Customer experience

## Completed
- English and Malayalam keyword search across business names, categories, services and places; suggestions, six recent searches and no-result states.
- Combined district, city, locality, category, service, business-type, Open Now and Offers Available filters, with Clear All Filters. Kerala time determines mock opening hours.
- Dedicated icon-based Categories screen linked to filtered Discover results.
- My Cards wallet grouped by category, wallet search, Save/Unsave and refresh persistence.
- Saving automatically follows; removing a card also removes its follow and mute preference. Mute/Unmute is available in the wallet, detail screen and Updates management.
- Updates displays only active, unmuted offers from followed businesses; offers contain short text and optional external links.
- Discover, Categories, My Cards and Updates share navigation with active highlighting. Existing `/companies` URL remains a discovery alias.
- Premium templates, front/back flipping, contact actions and Maps link retained. Improved card sizing and moved flip control away from Share.
- Twelve fictional Kerala businesses including shops, individual professionals and service companies; all fourteen districts are selectable.
- No backend or real authentication connected.

## Files created
- `src/types/index.ts`
- `src/services/index.ts`, `src/services/discovery.ts`, `src/services/discovery.test.ts`
- `src/hooks/use-data.ts`, `src/contexts/CustomerContext.tsx`
- `src/components/customer/AppShell.tsx`, `BusinessResults.tsx`, `BusinessSearch.tsx`, `DiscoveryFilters.tsx`
- `src/pages/CategoriesPage.tsx`, `src/pages/MyCardsPage.tsx`
- `AGENTS.md`, `roadmap.md`, `SPRINT_2_REPORT.md`

## Files modified
- `src/App.tsx`, `src/data/mockData.ts`, `src/index.css`, `tailwind.config.ts`
- `src/pages/Index.tsx`, `CompanyListingPage.tsx`, `ProfilePage.tsx`, `StatusPage.tsx`, `AdminPage.tsx`, `Dashboard.tsx`
- `src/components/BusinessCard.tsx`, `src/components/StatusItem.tsx`
- `package.json`, `bun.lockb` (test command and test-only Bun types)

## Tests performed
- `bun run test`: 12 passing rule tests for bilingual relevance, individual/combined filters, opening-hour boundaries, offers, saving/following, removal and mute/unmute.
- Browser customer journey: Malayalam search, five combined filters, save, wallet search, refresh, automatic followed offer, mute, refresh, unmute, category navigation, detail and flip, removal and refresh.
- Suggestions selected and recent searches read back after refresh.
- Six customer URLs checked at 382px with no horizontal page overflow; desktop checked at 1280px. Mobile Categories and card back screenshots visually inspected.
- Both directions of card flip verified after the animation completed.
- Login, dashboard, admin, create-profile and create-status URLs render. Their owner/admin workflows remain outside this sprint and were not tested as completed functionality.
- No browser page errors in the main customer journey.

## Remaining issues and boundaries
- This checkout did not contain Sprint 1's shared models/services; the needed foundation was recreated rather than connecting services.
- Branch switching and explicit commits cannot be performed by this agent; Lovable controls version history. The requested `update_2026` branch and commit destination are unverified.
- Phone numbers, emails, websites, businesses and offers are fictional fixtures, not real contact details.
- Existing demo login, owner creation/editing and admin controls remain demo-only. The QR symbol remains decorative; generating a scannable QR was not requested in Sprint 2.
- Wallet/recent-search preferences are device-local, not account-synced; storage failure is reported to the customer when saving.
- Districts without fixtures correctly show empty results. Search uses local matching, not AI or transliteration.