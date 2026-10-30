// Service layer: the only place UI gets data from.
// Every function is async so the mock implementation can later be swapped for backend calls
// without changing any component.
import * as db from "@/data/mockData";
import { ownUpdateService } from "./engagement";
export * from "./engagement";
export * from "./admin";
import { moderationService } from "./admin";
import { isPublicListing } from "@/lib/auth";
import type {
  Business, BusinessFilter, BusinessUpdate, CardTemplate, Category, District, Locality, ServiceProfessional,
} from "@/types";

const delay = <T,>(v: T) => Promise.resolve(structuredClone(v));

export const ALL = "All";

export const locationService = {
  getDistricts: (): Promise<District[]> => delay(db.districts),
  getLocalities: (districtId?: string): Promise<Locality[]> =>
    delay(districtId ? db.localities.filter((l) => l.districtId === districtId) : db.localities),
};

export const categoryService = {
  getCategories: (): Promise<Category[]> => delay(db.categories),
};

/** English + Malayalam searchable text for a business (name, tagline, categories, place). */
function searchText(b: Business): string {
  const cats = db.categories.filter((c) => b.categoryIds.includes(c.id));
  const loc = db.localities.find((l) => l.id === b.localityId)?.name ?? "";
  const dist = db.districts.find((d) => d.id === b.districtId)?.name ?? "";
  return [b.name, b.nameMl, b.tagline, ...b.tags, ...cats.flatMap((c) => [c.name, c.nameMl]), loc, dist]
    .filter(Boolean).join(" ").toLowerCase();
}

export function filterBusinesses(list: Business[], f: BusinessFilter = {}): Business[] {
  const q = f.search?.trim().toLowerCase();
  return list.filter((b) =>
    (!f.category || f.category === ALL || b.tags.includes(f.category)) &&
    (!f.districtId || b.districtId === f.districtId) &&
    (!f.localityId || b.localityId === f.localityId) &&
    (!q || searchText(b).includes(q)),
  );
}

/* ---------- Owner's registered business (localStorage until the backend exists) ---------- */
const MY_BUSINESS_KEY = "bizapp.myBusiness";
export const MY_BUSINESS_ID = "my-business";
function readMine(): Business | null {
  try { const v = JSON.parse(localStorage.getItem(MY_BUSINESS_KEY) ?? "null"); return v && v.id ? v : null; } catch { return null; }
}
const allBusinesses = (): Business[] => { const m = readMine(); return m ? [m, ...db.businesses] : db.businesses; };

export const businessService = {
  /** Public discovery: approved listings only. */
  list: (filter?: BusinessFilter): Promise<Business[]> =>
    delay(filterBusinesses(allBusinesses().filter((b) => isPublicListing(moderationService.statusOf(b.id, b.id === MY_BUSINESS_ID))), filter)),
  /** Admin: every listing regardless of moderation status. */
  listAll: (): Promise<Business[]> => delay(allBusinesses()),
  getById: (id: string): Promise<Business | null> => delay(allBusinesses().find((b) => b.id === id) ?? null),
};

export const myBusinessService = {
  get: (): Promise<Business | null> => delay(readMine()),
  /** Create or update the owner's business; category names are derived from ids. */
  save: (input: Omit<Business, "id" | "tags" | "lastUpdated" | "hasNewStatus">): Promise<Business> => {
    const tags = db.categories.filter((c) => input.categoryIds.includes(c.id)).map((c) => c.name);
    const b: Business = { ...input, id: MY_BUSINESS_ID, tags, lastUpdated: "Just now", hasNewStatus: false };
    localStorage.setItem(MY_BUSINESS_KEY, JSON.stringify(b));
    return delay(b);
  },
  remove: () => { localStorage.removeItem(MY_BUSINESS_KEY); },
};

export const professionalService = {
  list: (): Promise<ServiceProfessional[]> => delay(db.serviceProfessionals),
};

export const updateService = {
  /** Active offers (mock + owner's own), newest first. */
  list: (companyId?: string): Promise<BusinessUpdate[]> => {
    const now = Date.now();
    const all = [...ownUpdateService.list(), ...db.updates]
      .filter((u) => new Date(u.expiresAt).getTime() > now && (!companyId || u.companyId === companyId))
      .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
    return delay(all);
  },
};

export const templateService = {
  list: (): Promise<CardTemplate[]> => delay(db.cardTemplates),
};

/* ---------- Saved-card wallet (localStorage until the backend exists) ---------- */
const WALLET_KEY = "bizapp.wallet";
export interface WalletState { savedIds: string[]; mutedIds: string[] }
const listeners = new Set<() => void>();
let cache: WalletState | null = null;

function read(): WalletState {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(WALLET_KEY) ?? "{}");
    cache = { savedIds: Array.isArray(raw.savedIds) ? raw.savedIds : [], mutedIds: Array.isArray(raw.mutedIds) ? raw.mutedIds : [] };
  } catch { cache = { savedIds: [], mutedIds: [] }; }
  return cache;
}
function write(next: WalletState) {
  cache = next;
  localStorage.setItem(WALLET_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const walletService = {
  get: read,
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  /** Saving a card follows the business; unsaving also clears its mute. */
  toggleSave: (id: string) => {
    const s = read();
    const saved = s.savedIds.includes(id);
    write({ savedIds: toggle(s.savedIds, id), mutedIds: saved ? s.mutedIds.filter((x) => x !== id) : s.mutedIds });
  },
  toggleMute: (id: string) => { const s = read(); write({ ...s, mutedIds: toggle(s.mutedIds, id) }); },
  /** Offers from saved, unmuted businesses. */
  followedUpdates: (all: BusinessUpdate[], s: WalletState = read()) =>
    all.filter((u) => s.savedIds.includes(u.companyId) && !s.mutedIds.includes(u.companyId)),
  _reset: () => { cache = null; },
};

/* ---------- Recent searches (localStorage until the backend exists) ---------- */
const RECENT_KEY = "bizapp.recentSearches";
export const recentSearchService = {
  get: (): string[] => {
    try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
  },
  add: (q: string): string[] => {
    const t = q.trim();
    const next = t ? [t, ...recentSearchService.get().filter((x) => x !== t)].slice(0, 6) : recentSearchService.get();
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    return next;
  },
  clear: () => { try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ } },
};
