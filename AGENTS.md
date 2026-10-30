# Project rules

- Shared data models live in `src/types`; keep them flat so they map to future database tables.
- UI never imports `src/data/mockData.ts`; it reads data through `src/services` (async) via hooks in `src/hooks/use-data.ts`, so the backend can be swapped in later without touching screens.
- Customer screens wrap content in `AppShell` (header + `BottomNav`) and use `PageHeader` for titles; don't add per-page headers or footers.
- Colors come from CSS tokens in `src/index.css` (primary/brand, brand-accent, background); don't hardcode hex values in components.
- Business updates are short text offers with an optional external link; no image/video status feed.
